

import TaskManager from "./task.js";
class ChatInterface {
    constructor() {
        this.taskManager = new TaskManager();
        this.initializeElements();
        this.bindEvents();
        this.isTyping = false;
        this.initializeChat();
        this.conversationId = null;
    }

    initializeChat() {
        // Add initial welcome message
        setTimeout(() => {
            this.addMessage('Welcome! Try commands like "help", "login username/password", or just chat with me.', 'bot');
        }, 500);
    }

    initializeElements() {
        this.chatPanel = document.getElementById('chat-panel');
        this.chatFab = document.getElementById('chat-fab');
        this.chatOverlay = document.getElementById('chat-overlay');
        this.chatToggle = document.getElementById('chat-toggle');
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.messagesContainer = document.getElementById('messages-container');
        this.typingIndicator = document.getElementById('typing-indicator');

        this.iframe = document.getElementById('app-frame');
    }

    bindEvents() {
        // Mobile chat toggle
        this.chatFab?.addEventListener('click', () => this.toggleChat());
        this.chatToggle?.addEventListener('click', () => this.toggleChat());
        this.chatOverlay?.addEventListener('click', () => this.toggleChat());

        // Message sending
        this.sendButton?.addEventListener('click', () => this.sendMessage());
        this.messageInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Auto-resize input
        this.messageInput?.addEventListener('input', () => this.autoResizeInput());

        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
    }


    toggleChat() {

        if (this.chatPanel.classList.contains('show')) {
            this.hideChat();
        } else {
            this.showChat();
        }
    }

    showChat() {
        this.chatPanel.classList.add('show');
        this.chatOverlay.classList.add('show');
        this.chatFab?.classList.add('hidden');
        this.messageInput?.focus();
    }

    hideChat() {
        this.chatPanel.classList.remove('show');
        this.chatOverlay.classList.remove('show');
        setTimeout(() => {
            this.chatFab?.classList.remove('hidden');
        }, 200);
    }

    async sendMessage() {

        const message = this.messageInput.value.trim();
        if (!message) return;

        // Add user message
        this.addMessage(message, 'user');
        this.messageInput.value = '';

        // Show loading state
        this.showLoading();

        let chatResponse;
        try {
            chatResponse = await this.fetchResponse({ conversationId: this.conversationId, message });
            if (!chatResponse) {
                this.hideLoading();
                this.addMessage("Sorry for inconvenience, error in getting response !", 'bot');
                return;
            }
        } catch (error) {
            console.log(error);
            console.log("error in getting response !");
            this.hideLoading();
            this.addMessage(` "${error.message}"`, 'bot');
            return;
        }

        // Update for next turn
        this.conversationId = chatResponse.conversationId;

        if (!chatResponse.context.steps || chatResponse.context.steps.length == 0) {
            this.hideLoading();
            this.addMessage(chatResponse.message, 'bot');
            return;
        }

        let isTaskSuccess = true;
        const textSpan = this.addMessage("Doing tasks .....", 'bot');
        for (const step of chatResponse.context.steps) {
            try {
                // wait for this task to complete (or throw)
                await this.taskManager.executeTask(step);
                console.log('step', step);
                this.addContentToMessage(textSpan, `✅ ${step.type} task completed!\n`);
            }
            catch (err) {
                this.addContentToMessage(textSpan, `❌ ${step.type} task not done!\n`);
                console.error("error in doing task", err);
                isTaskSuccess = false;
                break;
            }
        }

        if (isTaskSuccess) this.addContentToMessage(textSpan, chatResponse.message)
        // Simulate API call
        this.hideLoading();
    }

    async fetchResponse({ conversationId, message }) {

        const res = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversationId, message })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.errorMessage || 'Server error');
        }

        const data = await res.json();
        return data;
    }


    addMessage(content, type = 'user') {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';

        const messageContent = document.createElement('div');
        messageContent.className = `message-content ${type}-message`;
        const icon = document.createElement('i');


        // the span we’ll return so you can update it
        let textSpan = document.createElement('span');
        textSpan.textContent = content;

        if (type === 'bot') {
            icon.className = 'fas fa-robot me-2';
        }

        messageContent.append(icon, textSpan);

        messageDiv.appendChild(messageContent);
        this.messagesContainer.appendChild(messageDiv);

        // Scroll to bottom
        this.scrollToBottom();
        return textSpan;
    }

    addContentToMessage(textSpan, content) {
        console.log('content of task :', content)
        // textSpan.textContent += '\n' + content;
        textSpan.innerHTML += '<br>' + content;
        this.scrollToBottom();
    }


    showLoading() {
        this.isTyping = true;
        this.typingIndicator.classList.remove('d-none');
        this.sendButton.classList.add('btn-loading');
        this.scrollToBottom();
    }

    hideLoading() {
        this.isTyping = false;
        this.typingIndicator.classList.add('d-none');
        this.sendButton.classList.remove('btn-loading');
    }

    clearMessages() {
        this.messagesContainer.innerHTML = '';
        this.addMessage('Chat cleared! How can I help you?', 'bot');
    }

    scrollToBottom() {
        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 100);
    }

    isChatVisible() {
        if (window.innerWidth >= 992) {
            return true; // Always visible on desktop
        }
        return this.chatPanel.classList.contains('show');
    }



    autoResizeInput() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = this.messageInput.scrollHeight + 'px';
    }

    handleResize() {
        this.chatFab?.classList.remove('hidden');
    }
}

// Initialize chat interface when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ChatInterface();
});

// Add some utility functions for enhanced UX
function addMessageWithDelay(chatInterface, message, type, delay) {
    setTimeout(() => {
        chatInterface.addMessage(message, type);
    }, delay);
}

// Easter egg: Konami code
let konamiCode = [];
const konamiSequence = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'KeyB', 'KeyA'
];

document.addEventListener('keydown', (e) => {
    konamiCode.push(e.code);
    if (konamiCode.length > konamiSequence.length) {
        konamiCode.shift();
    }

    if (konamiCode.join('') === konamiSequence.join('')) {
        const chatInterface = new ChatInterface();
        chatInterface.addMessage('🎉 Konami code activated! You found the easter egg!', 'bot');
        konamiCode = [];
    }
});
