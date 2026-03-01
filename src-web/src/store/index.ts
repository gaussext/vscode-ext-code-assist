import { clearConversation, createConversation, deleteConversation, getConversations, updateConversationTitle } from "./modules/conversations";
import { getMessagesById, removeMessagesById, setMessagesById } from "./modules/messages";

const store = {
    getConversations,
    createConversation,
    deleteConversation,
    clearConversation,
    updateConversationTitle,
    // 
    getMessagesById,
    setMessagesById,
    removeMessagesById,
};

export default store;