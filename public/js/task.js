// responseStore.js

class ResponseStore {
    constructor() {
        this.stores = []
        window.addEventListener('message', this.handleMessage.bind(this));
    }


    waitFor(Type) {
        return new Promise((resolve, reject) => {
            this.stores.push({ resolve, reject, Type });
        });
    }

    handleMessage(event) {
        if (event.origin !== window.location.origin) return;
        if (event.data.source && event.data.source == "react-devtools-content-script") {
            return;
        }

        console.dir(event.data)
        const eventType = event.data;
        const queue = this.stores;
        while (queue.length) {
            const { resolve, reject, Type } = queue.shift();
            console.dir(Type)
            if (eventType.pageType != Type.pageType) {
                reject()
            }
            resolve()
        }
    }
}


// TaskManager.js
export default class TaskManager {
    /**
     * @param {HTMLIFrameElement} iframeElement - The target iframe
     * @param {string} [baseUrl=''] - Base URL for redirects
     */
    constructor(iframeElement = document.getElementById("app-frame"), baseUrl = 'http://localhost:8080') {
        this.responseStore = new ResponseStore();
        this.iframe = iframeElement;
        this.baseUrl = baseUrl;
        this.taskHandlers = {
            redirect: this.handleRedirect.bind(this),
            login: this.handleLogin.bind(this),
            signup: this.handleSignUp.bind(this),
            createListing: this.handleCreatingListing.bind(this),
            logout: this.handleLogout.bind(this),
            updateListing: this.handleUpdateListing.bind(this),
            deleteListing: this.handleDeleteListing.bind(this)
        };
    }

    /**
     * Executes an array of task steps in sequence
     * @param {Array<Object>} steps
     */
    async executeTask(step) {
        const handler = this.taskHandlers[step.type];
        if (!handler) {
            throw new Error(`Unsupported task type: ${step.type}`);
        }
        await handler(step);
    }

    /**
     * Redirects the iframe and waits for a "redirect" message
     * @param {{ url: string }} param0
     */
    async handleRedirect({ url }) {
        let p = this.responseStore.waitFor({ type: 'redirect', pageType: url })
        this.iframe.contentWindow.location.href = `${this.baseUrl}${url}`;
        return p;
    }

    /**
     * Performs login by redirecting to /login and posting credentials
     * Waits for a "login" message
     * @param {{ username: string, password: string }} param
     */
    async handleLogin({ username, password }) {
        console.log('come to handlelogin ')
        await this.handleRedirect({ url: '/login' });
        console.log('gone to /login');

        const childDoc = this.iframe.contentDocument;
        // 1. Select the username & password fields
        const userInput = childDoc.querySelector('input[name="username"]');
        const passInput = childDoc.querySelector('input[name="password"]');
        if (!userInput || !password) {
            return { success: false, message: "Not found login form!" }
        }
        userInput.value = username;
        passInput.value = password;

        const loginBtn = childDoc.querySelector('#login-button');
        console.log('come to login buttons')
        if (!loginBtn) {
            console.log('not fount ')
            return { success: false, message: "Not found clicking button" };
        }

        let p = this.responseStore.waitFor({ type: 'redirect', pageType: '/listings' });
        loginBtn.click();
        await p;
    }

    /**
     * Performs account creation by redirecting to /register and posting credentials
     * Waits for a "register" message
     * @param {{ username: string, password: string, email: string }} param
     */
    async handleSignUp({ username, password, email }) {
        await this.handleRedirect({ url: '/signup' });
        console.log('redirects to signup page ')

        const childDoc = this.iframe.contentDocument;
        // 1. Select the username, password & email fields
        const userInput = childDoc.querySelector('input[name="username"]');
        const passInput = childDoc.querySelector('input[name="password"]');
        const emailInput = childDoc.querySelector('input[name="email"]');
        if (!userInput || !passInput || !emailInput) {
            console.log('signup filed not got !')
            return { success: false, message: "Not found registration form!" }
        }
        userInput.value = username;
        passInput.value = password;
        emailInput.value = email;
        console.dir(emailInput.value);

        const registerBtn = childDoc.querySelector('#signup-button');
        if (!registerBtn) {
            console.log('signup button not found!')
            return { success: false, message: "Not found register button" };
        }
        console.log('come here')
        let p = this.responseStore.waitFor({ type: 'redirect', pageType: '/listings' });
        registerBtn.click();
        await p;
    }

    /**
     * Performs logout by redirecting to /listings and clicking the logout button
     * Waits for a "redirect" message to "/"
     */
    async handleLogout() {
        let p = this.responseStore.waitFor({ type: 'redirect', pageType: '/listings' })
        this.iframe.contentWindow.location.href = `${this.baseUrl}/logout`;
        return p;
    }

    /**
     * Handles creating a new listing by navigating to /listings/new,
     * filling the form, and submitting it.
     * @param {{ title: string, description: string, price: number, country: string, location: string }} param
     */
    async handleCreatingListing({ title, description, price, country, location }) {
        // 1. Go to /listings/new
        await this.handleRedirect({ url: '/listings/new' });

        const childDoc = this.iframe.contentDocument;

        // 2. Fill the form fields
        const titleInput = childDoc.querySelector('input[name="title"]');
        const descInput = childDoc.querySelector('textarea[name="description"]');
        const priceInput = childDoc.querySelector('input[name="price"]');
        const countryInput = childDoc.querySelector('input[name="country"], select[name="country"]');
        const locationInput = childDoc.querySelector('input[name="location"]');

        if (!titleInput || !descInput || !priceInput || !countryInput || !locationInput) {
            return { success: false, message: "Not found listing form fields!" };
        }

        titleInput.value = title;
        descInput.value = description;
        priceInput.value = price;
        countryInput.value = country;
        locationInput.value = location;

        // 3. Click the submit button
        const submitBtn = childDoc.querySelector('#create-listing-button');
        if (!submitBtn) {
            return { success: false, message: "Not found create listing button!" };
        }

        let p = this.responseStore.waitFor({ type: 'redirect', pageType: '/listings' });
        submitBtn.click();
        await p;
    }
    /**
     * Handles editing an existing listing by navigating to /listings/{id}/edit,
     * filling only the provided fields, and submitting the form.
     * @param {{ id: string, change: { title?: string, description?: string, price?: number, country?: string, location?: string } }} param
     */
    async handleUpdateListing({ id, change }) {
        if (!id) {
            return { success: false, message: "Listing ID is required for editing!" };
        }
        // 1. Go to /listings/{id}/edit
        await this.handleRedirect({ url: `/listings/${id}/edit` });

        const childDoc = this.iframe.contentDocument;

        // 2. Fill only the provided fields from change
        // Use more specific selectors based on your HTML structure
        const fieldSelectors = {
            title: 'input[name="title"]',
            description: 'textarea[name="description"]',
            price: 'input[name="price"]',
            country: 'input[name="country"]',
            location: 'input[name="location"]'
        };

        for (const key in change) {
            console.log(key);
            if (change[key] !== undefined && fieldSelectors[key]) {
                const selector = fieldSelectors[key];
                let input = childDoc.querySelector(selector);
                if (input) {
                    input.value = change[key];
                } else {
                    console.warn(`EditListing: Could not find input for ${key} using selectors: ${fieldSelectors[key]}`);
                }
            }
        }

        // 3. Click the edit/submit button
        const editBtn = childDoc.querySelector('#edit-listing-button');
        if (!editBtn) {
            return { success: false, message: "Not found edit listing button!" };
        }

        let p = this.responseStore.waitFor({ type: 'redirect', pageType: `/listings/${id}` });
        editBtn.click();
        await p;
    }


    /**
     * Handles deleting a listing by navigating to /listings/{id},
     * clicking the delete button, and waiting for redirect to /listings.
     * @param {{ id: string }} param
     */
    async handleDeleteListing({ id }) {
        if (!id) {
            return { success: false, message: "Listing ID is required for deletion!" };
        }
        // 1. Go to /listings/{id}
        await this.handleRedirect({ url: `/listings/${id}` });

        const childDoc = this.iframe.contentDocument;

        // 2. Click the delete button
        const deleteBtn = childDoc.querySelector('#delete-listing-button');
        if (!deleteBtn) {
            return { success: false, message: "Not found delete listing button!" };
        }

        let p = this.responseStore.waitFor({ type: 'redirect', pageType: '/listings' });
        deleteBtn.click();
        await p;
    }
}
