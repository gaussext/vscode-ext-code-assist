import React, { useEffect, useState } from 'react';
import AppBody from './components/AppBody';
import AppFooter from './components/AppFooter';
import AppHeader from './components/AppHeader';
import { ChatMessage, event } from "./models/Model";
import { createMarkdownInfo } from './utils';
import store from './store/index';

// 类型定义
interface ChatState {
    modelId: string;
    conversationId: string;
    content: string;
    tokens: number;
    startTime: number;
    endTime: number;
    duration: number
    isLoading: boolean;
}

const ChatComponent: React.FC = () => {

    const [chatState, setChatState] = useState<ChatState>({
        modelId: '',
        conversationId: '',
        isLoading: false,
        content: '',
        tokens: 0,
        startTime: 0,
        endTime: 0,
        duration: 0
    });
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');

    // 初始化
    useEffect(() => {
        loadInitialData();
        window.addEventListener('message', handleWindowMessage);
        return () => window.removeEventListener('message', handleWindowMessage);
    }, []);

    const loadInitialData = async () => {
        loadMessages();
    };

    const loadMessages = async () => {
        const loadedMessages = await store.getMessagesById(chatState.conversationId);
        setMessages(loadedMessages);
    };

    // 接收插件进程消息
    const handleWindowMessage = (e: MessageEvent) => {
        const { type, data, text } = e.data;
        switch (type) {
            case 'chat-pre':
                handleChatRequest();
                break;
            case 'chat-start':
                handleChatStart();
                break;
            case 'chat-data':
                handleChatData(data);
                break;
            case 'chat-end':
                handleChatEnd();
                break;
            case 'optimization':
                handleOptimization(text);
                break;
            case 'explanation':
                handleExplanation(text);
                break;
        }
    };

    // 等待 AI 回复
    const handleChatRequest = () => {
        const content = '...'
        const message = new ChatMessage('assistant');
        message.content = content;
        setChatState(prev => ({
            ...prev,
            content,
            isLoading: true
        }));
        setMessages(prev => [...prev, message]);
    };

    // AI 开始回答
    const handleChatStart = () => {
        setChatState(prev => ({
            ...prev,
            content: '',
            tokens: 0,
            startTime: 0,
            endTime: 0
        }));
    };

    // AI 回答中
    const handleChatData = (data: any) => {
        const text = data.message.content;
        const createdAt = data.created_at ? new Date(data.created_at).getTime() : 0;

        setChatState(prev => {
            const newState = {
                ...prev,
                content: prev.content + text,
                tokens: prev.tokens + 1
            };

            if (createdAt) {
                if (prev.startTime === 0) {
                    newState.startTime = createdAt;
                }
                newState.endTime = createdAt;
            }

            if (newState.tokens % 2 === 0) {
                updateAIMessage(newState.content);
            }

            return newState;
        });
    };

    // AI 结束回答
    const handleChatEnd = () => {
        const { content, modelId: currentModel, tokens, startTime, endTime } = chatState;
        const duration = (endTime - startTime) / 1000;    
        const info = {
            modelId: currentModel,
            tokens,
            duration,
            startTime,
            endTime
        }
        const message  = new ChatMessage('assistant');
        message.content = content;
        message.info = info;
        setChatState(prev => ({ ...prev, isLoading: false }));
        updateAIMessage(content + createMarkdownInfo(chatState));
        loadMessages();
    };

    const handleOptimization = (code: string) => {
        if (!code) return;
        setInputValue(`优化一下这段代码\`\`\`${code}\`\`\``);
        onButtonClick();
    };

    const handleExplanation = (code: string) => {
        if (!code) return;
        setInputValue(`解释一下这段代码\`\`\`${code}\`\`\``);
        onButtonClick();
    };

    // 更新消息
    const updateAIMessage = (content: string) => {
        setMessages(prev => {
            const newMessages = [...prev];
            const lastIndex = newMessages.length - 1;

            if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
                newMessages[lastIndex] = {
                    ...newMessages[lastIndex],
                    content,
                };
            }

            return newMessages;
        });
    };

    // 发送消息
    const onButtonClick = () => {
        if (!inputValue.trim()) return;
        if (chatState.isLoading) {
            event.stop();
            return;
        }
        const message = new ChatMessage('user');
        message.content = inputValue;
        setMessages(prev => [...prev, message]);
        event.chat(chatState.modelId, inputValue, messages);
        store.setMessagesById(chatState.conversationId, [...messages, message])
        store.updateConversationTitle(chatState.conversationId, inputValue);
        setInputValue('');
    };
    
    return (
        <div className="chat-container">
            <AppHeader
                model={chatState.modelId}
                conversationId={chatState.conversationId}
                onModelChange={(id: string) => {
                    setChatState(prev => ({ ...prev, modelId: id }))
                }}
                onConversationChange={(id: string) => {
                    setChatState(prev => ({ ...prev, conversationId: id }));
                    loadMessages();
                }}
            />

            <AppBody messages={messages} />

            <AppFooter
                inputValue={inputValue}
                isLoading={chatState.isLoading}
                onInputChange={setInputValue}
                onButtonClick={onButtonClick}
            />
        </div>
    );
};

export default ChatComponent;