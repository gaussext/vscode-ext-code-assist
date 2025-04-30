import React, { useRef, useEffect } from 'react';
import { ChatMessage } from "../models/Model";
import { createMarkdownInfo } from '../utils';
declare var marked: any;

interface AppBodyProps {
    messages: ChatMessage[];
}

const AppBody: React.FC<AppBodyProps> = ({ messages }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 当消息更新后，滚动到底部
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const renderMessage = (message: ChatMessage, index: number) => {
        const isAI = message.role === 'assistant';
        const html = marked.parse(`${isAI ? 'AI: ' : ''}${message.content} ${isAI ? createMarkdownInfo(message.info) : ''}`);

        return (
            <div
                key={index}
                className={`message ${isAI ? 'message-ai' : 'message-you'}`}
                dangerouslySetInnerHTML={{ __html: html }}
            />
        );
    };

    return (
        <div className="messages-area" id="messages">
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default AppBody;