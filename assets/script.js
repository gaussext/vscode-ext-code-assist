(function () {
  const vscode = acquireVsCodeApi();
  const messageInput = document.getElementById("messageInput");
  const sendButton = document.getElementById("sendButton");
  const messagesContainer = document.getElementById("messages");

  // 处理发送消息
  sendButton.addEventListener("click", () => {
    const message = messageInput.value;
    if (message) {
      vscode.postMessage({
        command: "sendMessage",
        text: message,
      });
      // 在本地显示消息
      const messageElement = document.createElement("div");
      messageElement.classList.add("message-you");
      messageElement.textContent = `You: ${message}`;
      messagesContainer.appendChild(messageElement);
      messageInput.value = "";
    }
  });

  // 允许按 Enter 键发送消息
  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendButton.click();
    }
  });

  let contentTemp = '';
  let tokens = 0;
  let startTime = 0;
  let endTime = 0;
  window.addEventListener("message", (e) => {
    const type = e.data.type;
    if (type === "start") {
      const messageElement = document.createElement("div");
      messageElement.classList.add("message-ai");
      messageElement.classList.add("markdown-body");
      const json = e.data.text;
      const data = JSON.parse(json);
      startTime = new Date(data.created_at).getTime();
      contentTemp = `AI: `;
      messageElement.innerHTML = marked.parse(contentTemp);
      messagesContainer.appendChild(messageElement);
    } else if (type === "data") {
      const messageElements = document.querySelectorAll(".message-ai");
      const list = Array.from(messageElements);
      const messageElement = list[list.length - 1];
      const json = e.data.text;
      const data = JSON.parse(json);
      const text = data.message.content;
      endTime = new Date(data.created_at).getTime();
      contentTemp += text;
      messageElement.innerHTML = marked.parse(contentTemp);
      messagesContainer.scrollTo(0, messagesContainer.scrollHeight);
      tokens++;
    } else if (type === "end") {
      const messageElements = document.querySelectorAll(".message-ai");
      const list = Array.from(messageElements);
      const messageElement = list[list.length - 1];
      const duration = (endTime - startTime) / 1000;
      const speed = tokens / duration;
      contentTemp += `\`\`\`Tokens: ${tokens} Duration: ${duration.toFixed(2)} Sec Speed: ${speed.toFixed(2)} Token/s\`\`\``;
      messageElement.innerHTML = marked.parse(contentTemp);
      messagesContainer.scrollTo(0, messagesContainer.scrollHeight);
      tokens = 0;
    }
  });
})();
