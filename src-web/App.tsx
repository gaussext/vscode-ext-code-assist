import React, { useEffect, useState } from 'react';
import AppBody from './components/AppBody';
import AppFooter from './components/AppFooter';
import AppHeader from './components/AppHeader';
import { ChatMessage, event } from "./models/Model";
import store from './store/index';
import { createMarkdownInfo } from './utils';

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
        modelId: localStorage.getItem('modelId') || '',
        conversationId: localStorage.getItem('conversationId') || '',
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

    // 更新最新的一个回答
    const updateLatestMessage = (content: string) => {
        setMessages(prev => {
            const newMessages = [...prev];
            const lastIndex = newMessages.length - 1;
            newMessages[lastIndex] = {
                ...newMessages[lastIndex],
                content,
            };
            return newMessages;
        });
    };

    // 接收插件进程消息
    const handleWindowMessage = (e: MessageEvent) => {
        const { type, text } = e.data;
        switch (type) {
            case 'chat-pre':
                handleChatRequest();
                break;
            case 'chat-start':
                handleChatStart();
                break;
            case 'chat-data':
                handleChatData(text);
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
        const content = '';
        setChatState(prev => ({
            ...prev,
            content,
        }));
        updateLatestMessage(content);
    };

    // AI 回答中
    const handleChatData = (text: string) => {
        const json = JSON.parse(text);
        const content = json.message.content;
        setChatState(prev => {
            updateLatestMessage(prev.content + content);
            return {
                ...prev,
                content: prev.content + content,
            }
        });
    };
    
    // AI 结束回答
    const handleChatEnd = () => {
        const { conversationId, content, startTime, endTime } = chatState;
        const duration = (endTime - startTime) / 1000;
        const info = {
            ...chatState,
            duration,
        }
        const message = new ChatMessage('assistant');
        message.content = content;
        message.info = info;
        setChatState(prev => ({ ...prev, isLoading: false }));
        store.setMessagesById(conversationId, messages);
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



    // 发送消息
    const onButtonClick = () => {
        if (!inputValue.trim()) {
            return;
        }
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