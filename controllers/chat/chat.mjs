import { v4 as uuidv4 } from 'uuid';
import { conversationStore } from '../../model/chat.mjs';
import { triageAgent } from "./chatAgents.mjs";
import { run } from '@openai/agents';


export const chatRoute = async (req, res, next) => {
    const { conversationId, message } = req.body;

    let convoId = conversationId || uuidv4();
    //everty time new context are made ie, {steps:[]}
    const currContext = { steps: [], req };
    // Initialize or retrieve state

    let state = conversationStore.get(convoId);
    if (!state) {
        state = {
            inputItems: [],
            currentAgent: triageAgent,
        };
    }

    const userItem = { content: message, role: 'user' }
    state.inputItems.push(userItem);

    let result;
    try {
        result = await run(state.currentAgent, state.inputItems, { context: currContext });
    }
    catch (e) {
        console.dir(e)
        return res.status(500).json({ errorMessage: e.message || 'Internal Server Error !' });

    }

    //for logging the agent transfer...
    for (const newItem of result.newItems) {
        // Type guards for RunItem discriminated union
        if (newItem.type === 'message_output_item') {
            const agentName = newItem.agent?.name || 'Agent';
            console.log(`${agentName}: ${newItem.content}`);
        }
        else if (newItem.type === 'handoff_output_item') {
            const handoffItem = newItem;
            console.log(`Handed off from ${handoffItem.sourceAgent.name} to ${handoffItem.targetAgent.name}`);
        }
        else if (newItem.type === 'tool_call_item') {
            const agentName = newItem.agent?.name || 'Agent';
            console.log(`${agentName}: Calling a tool`);
        }
        else if (newItem.type === 'tool_call_output_item') {
            const agentName = newItem.agent?.name || 'Agent';
            console.log(`${agentName}: Tool call output: ${newItem.output}`);
        }
        else {
            const agentName = newItem.agent?.name || 'Agent';
            console.log(`${agentName}: Skipping item: ${newItem.type}`);
        }
    }

    const outputMessage = result.finalOutput;

    state.inputItems = result.history || [];
    state.currentAgent = result.lastAgent;
    conversationStore.save(convoId, state);


    const response = {
        conversationId: convoId,
        message: outputMessage,
        context: currContext,
    };

    delete currContext.req;
    return res.json(response);
}