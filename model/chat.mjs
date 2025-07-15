export class InMemoryConversationStore {
    constructor() {
        // If extending the abstract base, use:
        // export class InMemoryConversationStore extends ConversationStoreBase {
        this.conversations = {};
    }
    get(conversationId) {
        return this.conversations[conversationId];
    }
    save(conversationId, state) {
        this.conversations[conversationId] = state;
    }
}
/** Singleton instance for easy import/use */
export const conversationStore = new InMemoryConversationStore();
