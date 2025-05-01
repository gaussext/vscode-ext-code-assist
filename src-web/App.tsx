import React, { useEffect, useState } from 'react';
import AppBody from './components/AppBody';
import AppFooter from './components/AppFooter';
import AppHeader from './components/AppHeader';
import { ChatMessage, event } from "./models/Model";
import store from './store/index';

const modelIdL = localStorage.getItem('modelId') || '';
const conversationIdL = localStorage.getItem('conversationId') || '';

const ChatComponent: React.FC = () => {

    const [modelId, setModelId] = useState(modelIdL)
    const [conversationId, setConversationId] = useState(conversationIdL)

    console.log('[Webview]', conversationId);

    const [tempMessage, setTempMessage] = useState(new ChatMessage('assistant'));
    const [isLoading, setLoading] = useState<boolean>(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        window.addEventListener('message', handleWindowMessage);
        return () => window.removeEventListener('message', handleWindowMessage);
    }, []);

    useEffect(() => {
        loadMessages();
    }, [conversationId])

    const loadMessages = async () => {
        const loadedMessages = await store.getMessagesById(conversationId);
        setMessages([...loadedMessages]);
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
        setLoading(true);
        setTempMessage(prev => {
            return {
                ...prev,
                content: '...',
            }
        })
    };
    // AI 开始回答
    const handleChatStart = () => {
        setTempMessage(prev => {
            return {
                ...prev,
                content: '',
            }
        })
    };

    // AI 回答中
    const handleChatData = (text: string) => {
        setTempMessage(prev => {
            const json = JSON.parse(text);
            const delta = json.message.content;
            return {
                ...prev,
                content: prev.content + delta
            }
        });
    };

    // AI 结束回答
    const handleChatEnd = () => {
        setLoading(false);
        setTempMessage(temp => {
            setMessages(prev => {
                const message = new ChatMessage('assistant');
                message.content = temp.content;
                const next = [...prev, message];
                setConversationId(id => {
                    store.setMessagesById(id, next)
                    return id;
                })
                return next;
            });
            return temp;
        })

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
    const onButtonClick = async () => {
        if (!inputValue.trim()) {
            return;
        }
        if (isLoading) {
            event.stop();
            return;
        }
        await store.updateConversationTitle(conversationId, inputValue);
        setInputValue('');
        setMessages(prev => {
            const message = new ChatMessage('user');
            message.content = inputValue;
            const next = [...prev, message]
            event.chat(modelId, inputValue, next);
            store.setMessagesById(conversationId, next)
            return next;
        });
    };

    return (
        <div className="chat-container">
            <AppHeader
                modelId={modelId}
                conversationId={conversationId}
                onModelChange={(id: string) => {
                    localStorage.setItem('code-assist.modelId', id);
                    setModelId(id);
                }}
                onConversationChange={(id: string) => {
                    localStorage.setItem('code-assist.conversationId', id);
                    setMessages([]);
                    setConversationId(id);
                }}
            />
            <AppBody messages={messages} tempMessage={tempMessage} isLoading={isLoading} />
            <AppFooter
                inputValue={inputValue}
                isLoading={isLoading}
                onInputChange={setInputValue}
                onButtonClick={onButtonClick}
            />
        </div>
    );
};

export default ChatComponent;