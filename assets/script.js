function main() {
  const vscode = acquireVsCodeApi();
  const $select = document.querySelector("#model-select");
  const $input = document.getElementById("messageInput");
  const $button = document.getElementById("sendButton");
  const $messages = document.getElementById("messages");
  let currentModel = '';
  const oldMessage = [];

  function tags() {
    vscode.postMessage({
      command: 'tags',
    });
  }

  function chat(text) {
    vscode.postMessage({
      command: "chat",
      text: text,
      oldMessage: oldMessage,
      model: currentModel
    });
  }

  // 获取模型列表
  tags();

  // 选择模型
  $select.addEventListener('change', e => {
    currentModel = e.target.value;
  });

  // 发送消息
  $button.addEventListener("click", () => {
    const message = $input.value;
    if (message) {
      oldMessage.push({
        role: 'user',
        content: message,
      });
      chat(message, currentModel);
      // 在本地显示消息
      const messageElement = document.createElement("div");
      messageElement.classList.add("message-you");
      messageElement.textContent = `You: ${message}`;
      $messages.appendChild(messageElement);
      $input.value = "";
    }
  });

  // 允许按 Enter 键发送消息
  $input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      $button.click();
    }
  });

  // 接受消息
  let contentTemp = '';
  let tokens = 0;
  let startTime = 0;
  let endTime = 0;
  window.addEventListener("message", (e) => {
    const type = e.data.type;
    if (type === "chat-start") {
      const messageElement = document.createElement("div");
      messageElement.classList.add("message-ai");
      messageElement.classList.add("markdown-body");
      contentTemp = `AI: `;
      messageElement.innerHTML = marked.parse(contentTemp);
      $messages.appendChild(messageElement);
    } else if (type === "chat-data") {
      const messageElements = document.querySelectorAll(".message-ai");
      const list = Array.from(messageElements);
      const messageElement = list[list.length - 1];
      const json = e.data.text;
      const data = JSON.parse(json);
      const text = data.message.content;
      if (startTime === 0) {
        startTime = new Date(data.created_at).getTime();
      }
      endTime = new Date(data.created_at).getTime();
      contentTemp += text;
      messageElement.innerHTML = marked.parse(contentTemp);
      $messages.scrollTo(0, $messages.scrollHeight);
      tokens++;
    } else if (type === "chat-end") {
      oldMessage.push({
        role: 'assistant',
        content: contentTemp,
      });
      const messageElements = document.querySelectorAll(".message-ai");
      const list = Array.from(messageElements);
      const messageElement = list[list.length - 1];
      const duration = (endTime - startTime) / 1000;
      const speed = tokens / duration;
      contentTemp += `
\`\`\`
Model: ${currentModel} 
Tokens: ${tokens} 
Duration: ${duration.toFixed(2)} Sec 
Speed: ${speed.toFixed(2)} Token/s
\`\`\`
`;
      messageElement.innerHTML = marked.parse(contentTemp);
      $messages.scrollTo(0, $messages.scrollHeight);
      tokens = 0;
      startTime = 0;
      endTime = 0;
    } else if (type === "tags-end") {
      const json = e.data.text;
      const models = json.models || [];
      models.sort((a, b) => a.name.localeCompare(b.name))
      if (!currentModel) {
        currentModel = models[0].name;
        $select.value = currentModel;
      }
      $select.innerHTML = '';
      models.forEach(model => {
        const $option = document.createElement('option');
        $option.value = model.name;
        $option.textContent = `${model.name}`;
        $select.appendChild($option);
      });
      $select.appendChild(select);
    }
  });
};

window.addEventListener('load', main);
