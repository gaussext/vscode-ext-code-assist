(function() {
    const vscode = acquireVsCodeApi();
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const messagesContainer = document.getElementById('messages');

    // 处理发送消息
    sendButton.addEventListener('click', () => {
        const message = messageInput.value;
        if (message) {
            vscode.postMessage({
                command: 'sendMessage',
                text: message
            });
            
            // 在本地显示消息
            const messageElement = document.createElement('div');
            messageElement.textContent = `You: ${message}`;
            messagesContainer.appendChild(messageElement);
            
            messageInput.value = '';
        }
    });

    // 允许按 Enter 键发送消息
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendButton.click();
        }
    });
}());