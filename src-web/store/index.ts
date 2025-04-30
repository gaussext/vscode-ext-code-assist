import { createConversation, deleteConversation, getConversations, updateConversationTitle } from "./modules/conversations";
import { getMessagesById, setMessagesById } from "./modules/messages";

const store = {
    getConversations,
    createConversation,
    deleteConversation,
    updateConversationTitle,
    getMessagesById,
    setMessagesById
};

export default store;