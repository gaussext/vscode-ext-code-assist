import React, { useRef } from 'react';

interface AppFooterProps {
    inputValue: string;
    isLoading: boolean;
    onInputChange: (value: string) => void;
    onButtonClick: () => void;
}

const AppFooter: React.FC<AppFooterProps> = ({
    inputValue,
    isLoading,
    onInputChange,
    onButtonClick
}) => {
    const inputRef = useRef<HTMLTextAreaElement>(null);

    return (
        <div className="chat-area">
            <textarea
                ref={inputRef}
                className="vscode-textarea"
                id="chat-input"
                placeholder="请输入您的问题"
                value={inputValue}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        onButtonClick();
                    }
                }}
                disabled={isLoading}
            />

            <button
                className="vscode-button-full"
                id="chat-button"
                onClick={onButtonClick}
                disabled={!inputValue.trim()}
            >
                {isLoading ? '停止' : '发送'}
            </button>
        </div>
    );
};

export default AppFooter;