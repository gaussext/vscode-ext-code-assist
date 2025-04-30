import React, { useEffect, useState } from 'react';
import { AIModel, Conversation, event } from "../models/Model";
import store from '../store';
import { firstElement, lastElement } from '../utils';

interface AppHeaderProps {
    model: string;
    conversationId: string;
    onModelChange: (model: string) => void;
    onConversationChange: (id: string) => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
    model,
    conversationId,
    onModelChange,
    onConversationChange,
}) => {

    const [models, setModels] = useState<AIModel[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);


    // 更新模型列表
    const handleModels = (models: AIModel[]) => {
        const sortedModels = [...models].sort((a, b) => a.name.localeCompare(b.name));
        setModels(sortedModels);
    };

    const handleWindowMessage = (e: MessageEvent) => {
        const { type, data, text } = e.data;
        switch (type) {
            case 'tags-end':
                handleModels(text.models as AIModel[]);
                break;
        }
    };

    const getModels = () => {
        window.addEventListener('message', handleWindowMessage);
        event.getModels();
    }

    const getConversations = async () => {
        const conversations = await store.getConversations();
        setConversations(conversations);
        return conversations;
    }

    useEffect(() => {
        getModels();
        getConversations();
        return () => window.removeEventListener('message', handleWindowMessage);
    }, [])

    const onCreateConversation = async () => {
        await store.createConversation();
        const conversations = await getConversations();
        onConversationChange(lastElement(conversations).id)
    }

    const onDeleteConversation = async () => {
        await store.deleteConversation(conversationId);
        const conversations = await getConversations();
        onConversationChange(firstElement(conversations).id)
    }

    const onClearConversation = async () => {
        await store.setMessagesById(conversationId, []);
        onConversationChange(conversationId);
    }

    return (
        <div className="history-area">
            <select
                className="vscode-select"
                id="model-select"
                value={model}
                onChange={(e) => onModelChange(e.target.value)}
            >
                {models.map(model => (
                    <option key={model.name} value={model.name}>
                        {model.name}
                    </option>
                ))}
            </select>

            <select
                className="vscode-select"
                id="history-select"
                value={conversationId}
                onChange={(e) => onConversationChange(e.target.value)}
            >
                {conversations.map(conv => (
                    <option key={conv.id} value={conv.id}>
                        {conv.title}
                    </option>
                ))}
            </select>

            <button
                className="vscode-button-small"
                id="create-button"
                onClick={onCreateConversation}
            >
                +
            </button>

            <button
                className="vscode-button-small"
                id="delete-button"
                onClick={onDeleteConversation}
            >
                -
            </button>

            <button
                className="vscode-button-small"
                id="clear-button"
                title="清空消息"
                onClick={onClearConversation}
            >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M6 7V18C6 19.1046 6.89543 20 8 20H16C17.1046 20 18 19.1046 18 18V7M4 7H20M10 11V16M14 11V16M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
            </button>
        </div>
    );
};

export default AppHeader;