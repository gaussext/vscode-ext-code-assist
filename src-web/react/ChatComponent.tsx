declare var marked: any;
declare var hljs: any;

import React, { useEffect, useRef, useState } from 'react';
import { AIModel, Info, Message } from "../Model";
import { createMarkdownInfo } from '../vanilla/Utils';

(marked as any).setOptions({
    highlight: function (code: string, language: string) {
        const validLanguage = hljs.getLanguage(language) ? language : "plaintext";
        return hljs.highlight(validLanguage, code).value;
    },
    langPrefix: "hljs language-", // highlight.js css expects a top-level 'hljs' class.
    pedantic: false,
    gfm: true,
    breaks: false,
    sanitize: false,
    smartLists: true,
    smartypants: false,
    xhtml: false,
});

// 类型定义
interface ChatState {
    content: string;
    isLoading: boolean;
    model: string;
    tokens: number;
    startTime: number;
    endTime: number;
    duration: number
}

interface ChatComponentProps {
    model: {
        getModels: () => void;
        getConversations: () => void;
        getMessages: () => Promise<Message[]>;
        addAIMessage: (content: string, info?: any) => void;
        chat: (model: string, message: string, history: Message[]) => void;
        updateConversationId: (id: string) => void;
        createConversation: () => void;
        deleteConversation: (id: string) => void;
        updateConversationTitle: (title: string) => void;
        stop: () => void;
        messages: Message[];
        conversations: any[];
        conversationId: string;
        state: {
            model: string;
        };
    };
}

const ChatComponent: React.FC<ChatComponentProps> = ({ model }) => {
    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // State
    const [chatState, setChatState] = useState<ChatState>({
        content: '',
        isLoading: false,
        model: model.state.model,
        tokens: 0,
        startTime: 0,
        endTime: 0,
        duration: 0
    });

    const [inputValue, setInputValue] = useState('');
    const [models, setModels] = useState<AIModel[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);

    // 初始化数据
    useEffect(() => {
        loadInitialData();
        window.addEventListener('message', handleWindowMessage);
        return () => window.removeEventListener('message', handleWindowMessage);
    }, []);

    // 滚动到底部
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 加载初始数据
    const loadInitialData = async () => {
        const [loadedModels, loadedConversations] = await Promise.all([
            model.getModels(),
            model.getConversations()
        ]);
        setModels([]);
        loadMessages();
        hljs.highlightAll(); // 初始化代码高亮
    };

    // 加载消息
    const loadMessages = async () => {
        const loadedMessages = await model.getMessages();
        setMessages(loadedMessages);
    };

    // 处理窗口消息
    const handleWindowMessage = (e: MessageEvent) => {
        const { type, data, text } = e.data;
        switch (type) {
            case 'tags-end':
                handleModels(text.models as AIModel[]);
                break;
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

    // 处理模型数据
    const handleModels = (models: AIModel[]) => {
        const sortedModels = [...models].sort((a, b) => a.name.localeCompare(b.name));
        console.log(sortedModels);
        setModels(sortedModels);
    };

    // 处理聊天请求
    const handleChatRequest = () => {
        setChatState(prev => ({
            ...prev,
            content: '...',
            isLoading: true
        }));
        setMessages(prev => [...prev, { role: 'assistant', content: '...', info: new Info(), timestamp: Date.now() }]);
    };

    // 处理聊天开始
    const handleChatStart = () => {
        setChatState(prev => ({
            ...prev,
            content: '',
            tokens: 0,
            startTime: 0,
            endTime: 0
        }));
    };

    // 处理聊天数据
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

            // 每2个token更新一次UI
            if (newState.tokens % 2 === 0) {
                updateAIMessage(newState.content);
            }

            return newState;
        });
    };

    // 处理聊天结束
    const handleChatEnd = () => {
        const { content, model: currentModel, tokens, startTime, endTime } = chatState;
        const duration = (endTime - startTime) / 1000;

        model.addAIMessage(content, {
            model: currentModel,
            tokens,
            duration,
            startTime,
            endTime
        });

        setChatState(prev => ({ ...prev, isLoading: false }));
        updateAIMessage(content, createMarkdownInfo(chatState));
        loadMessages();
    };

    // 处理代码优化
    const handleOptimization = (code: string) => {
        if (!code) return;
        setInputValue(`优化一下这段代码\`\`\`${code}\`\`\``);
        inputRef.current?.focus();
    };

    // 处理代码解释
    const handleExplanation = (code: string) => {
        if (!code) return;
        setInputValue(`解释一下这段代码\`\`\`${code}\`\`\``);
        inputRef.current?.focus();
    };

    // 更新AI消息
    const updateAIMessage = (content: string, info: string = '') => {
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
    const sendMessage = () => {
        if (!inputValue.trim()) return;

        if (chatState.isLoading) {
            model.stop();
            return;
        }

        const newMessage: Message = {
            role: 'user',
            content: inputValue,
            timestamp: Date.now(),
            info: new Info()
        };

        setMessages(prev => [...prev, newMessage]);
        model.chat(chatState.model, inputValue, messages);
        model.updateConversationTitle(inputValue);
        setInputValue('');
    };

    // 滚动到底部
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // 渲染消息
    const renderMessage = (message: Message, index: number) => {
        const isAI = message.role === 'assistant';
        const html = marked.parse(`${isAI ? 'AI: ' : ''}${message.content} ${message.info || ''}`);

        return (
            <div
                key={index}
                className={`message ${isAI ? 'message-ai' : 'message-you'}`}
                dangerouslySetInnerHTML={{ __html: html }}
            />
        );
    };

    return (
        <div className="chat-container">
            <div className="history-area">
                <select
                    className="vscode-select"
                    id="model-select"
                    value={chatState.model}
                    onChange={(e) => setChatState(prev => ({ ...prev, model: e.target.value }))}
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
                    value={model.conversationId}
                    onChange={(e) => model.updateConversationId(e.target.value)}
                >
                    {model.conversations.map(conv => (
                        <option key={conv.id} value={conv.id}>
                            {conv.title}
                        </option>
                    ))}
                </select>

                <button
                    className="vscode-button-small"
                    id="create-button"
                    onClick={model.createConversation}
                >
                    +
                </button>

                <button
                    className="vscode-button-small"
                    id="delete-button"
                    onClick={() => model.deleteConversation(model.conversationId)}
                >
                    -
                </button>
            </div>

            <div className="messages-area" id="messages">
                {messages.map(renderMessage)}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-area">
                <textarea
                    ref={inputRef}
                    className="vscode-textarea"
                    id="chat-input"
                    placeholder="请输入您的问题"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                        }
                    }}
                    disabled={chatState.isLoading}
                />

                <button
                    className="vscode-button-full"
                    id="chat-button"
                    onClick={sendMessage}
                    disabled={!inputValue.trim()}
                >
                    {chatState.isLoading ? '停止' : '发送'}
                </button>
            </div>
        </div>
    );
};

export default ChatComponent;