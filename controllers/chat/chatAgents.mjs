import { z } from 'zod';
import { Agent, tool } from '@openai/agents';
import { CREATE_LISTING_TEMPLATE, DELETE_LISTING_TEMPLATE, LOGIN_TEMPLATE, LOGOUT_TEMPLATE, TRIAGE_TEMPLATE, UPDATE_LISTING_TEMPLATE } from './prompts.mjs';


import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Listing = require('../../model/listing.js')

const loginStepTool = tool({
    name: 'do_login_step',
    description: 'create step for user login',
    parameters: z.object({
        username: z.string().describe("user's username"),
        password: z.string().describe("user's password")
    }),
    async execute(input, context) {
        if (!input) {
            return "usename and password are required for doing login step.";
        }
        if (!input.username) {
            return "missing username field for doing login step.";
        }
        if (!input.password) {
            return "missing username field for doing login step.";
        }
        const newStep = {
            type: 'login',
            username: input.username,
            password: input.password,
        };
        // Optionally, you can add the new step to the context if needed
        if (context?.context?.steps) {
            context.context.steps.push(newStep);
        }
        else {
            return "state doesn't exist to add the step.";
        }
        return `Login step created for user ${input.username}`;
    },
});
const logoutStepTool = tool({
    name: "do_logout_step",
    description: "Create logout step for the user",
    parameters: z.object({}),
    async execute(_input, context) {
        const newStep = {
            type: 'logout'
        };
        if (context?.context?.steps) {
            context.context.steps.push(newStep);
        }
        else {
            return "state doesn't exist to add the step.";
        }
        return `Logout step created`;
    },
});
const createListingStepTool = tool({
    name: "do_create_listing_step",
    description: "Create a step for listing creation",
    parameters: z.object({
        title: z.string().describe("the title of the listing"),
        description: z.string().describe("the description of the listing"),
        price: z.string().describe("the price of the listing"),
        country: z.string().describe("the country of the listing"),
        location: z.string().describe("the location of the listing"),
    }),
    async execute(input, context) {

        const newStep = {
            type: "createListing",
            ...input
        };

        if (context?.context?.steps) {
            context.context.steps.push(newStep);
        }
        else {
            return "state doesn't exist to add the step.";
        }
        return `Listing step created: ${input.listingName} in ${input.place}`;
    },
});
const updateListingStepTool = tool({
    name: "do_update_listing_step",
    description: "Create a step for updating a listing",
    parameters: z.object({
        id: z.string().min(1, "id is required").describe("the id of the listing"),
        change: z.object({
            title: z.union([z.string(), z.null()]).default(null).describe("the updated title of the listing"),
            description: z.union([z.string(), z.null()]).default(null).describe("the updated description of the listing"),
            price: z.union([z.number(), z.null()]).default(null).describe("the updated price of the listing"),
            country: z.union([z.string(), z.null()]).default(null).describe("the updated country of the listing"),
            location: z.union([z.string(), z.null()]).default(null).describe("the updated location of the listing"),
        }).describe("fields to change in the listing"),
    }),
    async execute(input, context) {
        if (!input.id) {
            return "Missing id field for update-listing step.";
        }
        if (!input.change || Object.keys(input.change).length === 0) {
            return "At least one field in 'change' must be provided for update-listing step.";
        }
        const newStep = {
            type: "updateListing",
            id: input.id,
            change: Object.fromEntries(Object.entries(input.change).filter(([_, v]) => v !== null))
        };
        if (context?.context?.steps) {
            context.context.steps.push(newStep);
        }
        else {
            return "State doesn't exist to add the step.";
        }
        return `Listing step updated: id=${input.id}, changes=${JSON.stringify(input.change)}`;
    },
});
const deleteListingStepTool = tool({
    name: "do_delete_listing_step",
    description: "Create a step for deleting a listing",
    parameters: z.object({
        id: z.string().min(1, "id is required").describe("the id of the listing to delete"),
    }),
    async execute(input, context) {
        if (!input.id) {
            return "Missing id field for delete-listing step.";
        }
        const newStep = {
            type: "deleteListing",
            id: input.id,
        };
        if (context?.context?.steps) {
            context.context.steps.push(newStep);
        }
        else {
            return "state doesn't exist to add the step.";
        }
        return `Listing step deleted: id=${input.id}`;
    },
});
const getListingIdTool = tool({
    name: "get_listing_id",
    description: "Retrieve the listing ID based on the provided title and price. If not found, inform the user.",
    parameters: z.object({
        title: z.string().describe("The title of the listing"),
        price: z.number().describe("The price of the listing"),
    }),
    async execute(input, context) {

        const listing = await Listing.findOne({
            title: input.title,
            price: input.price
        });

        if (!listing) {
            return `No listing found with title "${input.title}" and price ${input.price}.`;
        }

        console.log('getListing id output :', listing._id);
        return `Listing ID: ${listing._id}`;
    },
});
// 3) Check login status
const isUserLoggedInTool = tool({
    name: "do_check_login_status",
    description: "Check if the user is currently logged in",
    parameters: z.object({}), // no arguments
    async execute(_input, context) {

        if (!context?.context?.req.isAuthenticated()) {
            return "User is not logged in "
        }

        return "User is logged in.";
    },
});
const CreateListingAgent = new Agent({
    name: 'Create Listing Agent',
    handoffDescription: 'A helpful agent which guide through to create Listing',
    instructions: CREATE_LISTING_TEMPLATE,
    tools: [isUserLoggedInTool, loginStepTool, createListingStepTool],
});
const UpdateListingAgent = new Agent({
    name: 'Update Listing Agent',
    handoffDescription: 'A helpful agent which guide through to update Listing',
    instructions: UPDATE_LISTING_TEMPLATE,
    tools: [isUserLoggedInTool, loginStepTool, getListingIdTool, updateListingStepTool],
});
const DeleteListingAgent = new Agent({
    name: 'Delete Listing Agent',
    handoffDescription: 'A helpful agent which guide through to delete Listing',
    instructions: DELETE_LISTING_TEMPLATE,
    tools: [isUserLoggedInTool, loginStepTool, getListingIdTool, deleteListingStepTool],
});
const LoginAgent = new Agent({
    name: 'Login Agent',
    handoffDescription: 'A agent which helps to login user',
    instructions: LOGIN_TEMPLATE,
    tools: [isUserLoggedInTool, loginStepTool],
});
const LogoutAgent = new Agent({
    name: 'Logout Agent',
    handoffDescription: 'A agent which helps to logout user',
    instructions: LOGOUT_TEMPLATE,
    tools: [isUserLoggedInTool, logoutStepTool],
});
export const triageAgent = Agent.create({
    name: 'Triage Agent',
    handoffDescription: "A triage agent that can delegate a customer's request to the appropriate agent.",
    instructions: TRIAGE_TEMPLATE,
    handoffs: [CreateListingAgent, UpdateListingAgent, DeleteListingAgent, LoginAgent, LogoutAgent],
});
// Make sure agents can handoff to each other
LoginAgent.handoffs = [triageAgent];
LogoutAgent.handoffs = [triageAgent];
CreateListingAgent.handoffs = [triageAgent];
UpdateListingAgent.handoffs = [triageAgent];
DeleteListingAgent.handoffs = [triageAgent];
