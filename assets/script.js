// 初始化
marked.setOptions({
  highlight: function (code, language) {
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

const db = new SimpleIDB({
  dbName: "code-assist",
  storeName: "conversations",
  version: 3,
});

function createConversationInit(params) {
  return [
    {
      id: "0",
      title: "新建对话",
    },
  ];
}

const vscode = acquireVsCodeApi();
let conversations = createConversationInit();
let messages = [];
let currentId = "0";
let currentModel = localStorage.getItem("code-assist.currentModel") || "";

function getModels() {
  vscode.postMessage({
    command: "tags",
  });
}

function chatStart(message) {
  messages.push({
    role: "user",
    timestamp: Date.now(),
    content: message,
  });
  vscode.postMessage({
    command: "chat",
    model: currentModel,
    text: message,
    messages: messages,
  });
}

function chatStop() {
  vscode.postMessage({
    command: "stop",
  });
}

function chatEnd(text, info) {
  messages.push({
    role: "assistant",
    timestamp: Date.now(),
    content: text,
    info: info,
  });
  saveMessages();
}

function saveMessages() {
  db.set({
    id: currentId,
    messages: messages,
    timestamp: Date.now(),
  });
}

function cleanData() {
  db.set({
    id: currentId,
    messages: [],
    timestamp: Date.now(),
  });
}

function createConversation() {
  const nextId =
    (Math.max(...conversations.map((item) => Number(item.id))) || 0) + 1;
  currentId = `${nextId}`;
  conversations.push({
    id: currentId,
    title: "新建对话",
  });
}

function saveConversation() {
  localStorage.setItem("conversations", JSON.stringify(conversations));
}

function onLoad() {
  const $selectModel = document.getElementById("model-select");
  const $selectHistory = document.getElementById("history-select");
  const $input = document.getElementById("chat-input");
  const $buttonChat = document.getElementById("chat-button");
  const $buttonStop = document.getElementById("stop-button");
  const $buttonNew = document.getElementById("new-button");
  const $buttonClean = document.getElementById("clean-button");

  const $messages = document.getElementById("messages");

  function createMarkdownInfo(info) {
    if (!info) {
      return "";
    }
    const { model, tokens, duration } = info;
    const speed = tokens / duration;
    return `
  \`\`\`
  Model: ${model} 
  Tokens: ${tokens} 
  Duration: ${duration.toFixed(2)} Sec 
  Speed: ${speed.toFixed(2)} Token/s
  \`\`\`
  `;
  }

  function createMessageForYou(message) {
    const $message = document.createElement("div");
    $message.classList.add("message-you");
    $message.textContent = `You: ${message}`;
    return $message;
  }

  function createMessageForAI(message) {
    const $message = document.createElement("div");
    $message.classList.add("message-ai");
    $message.classList.add("markdown-body");
    $message.innerHTML = marked.parse(`AI: ${message}`);
    return $message;
  }

  function getLatestMessage() {
    const list = Array.from(document.querySelectorAll(".message-ai"));
    const $message = list[list.length - 1];
    return $message;
  }

  function renderConversation() {
    $selectHistory.innerHTML = "";
    conversations.forEach((item) => {
      const $option = document.createElement("option");
      $option.value = item.id;
      $option.textContent = `${item.title}`;
      if ($option.value === currentId) {
        $option.selected = true;
      }
      $selectHistory.appendChild($option);
    });
  }

  function getConversations() {
    try {
      const list = JSON.parse(localStorage.getItem("conversations")) || [];
      if (list.length) {
        conversations = list;
        currentId = list[0].id;
        renderConversation();
      }
    } catch (error) {
      conversations = createConversationInit();
      renderConversation();
    }
  }
  // 获取数据
  function getMesasges() {
    db.get(currentId)
      .then((conversation) => {
        if (!conversation) {
          return false;
        }
        messages = conversation.messages || [];
        messages.forEach((item) => {
          if (item.role === "user") {
            $messages.appendChild(createMessageForYou(item.content));
          }
          if (item.role === "assistant") {
            $messages.appendChild(
              createMessageForAI(item.content + createMarkdownInfo(item.info))
            );
          }
        });
        $messages.scrollTo(0, $messages.scrollHeight);
        hljs.highlightAll();
      })
  }

  function sendMessage() {
    const message = $input.value;
    if (message) {
      $messages.appendChild(createMessageForYou(message));
      chatStart(message);
      conversations.forEach((item) => {
        if (item.id === currentId) {
          item.title = message.slice(0, 10) + "...";
        }
      });
      renderConversation();
      saveConversation();
      $input.value = "";
    }
  }

  // 初始化
  renderConversation();
  // 1. 获取模型列表
  getModels();
  // 2. 获取历史对话
  getConversations();
  // 3. 获取对话消息
  getMesasges();

  // 创建新对话
  $buttonNew.addEventListener("click", () => {
    createConversation();
    renderConversation();
    saveConversation();
    messages = [];
    $messages.innerHTML = [];
    saveMessages();
  });

  // 选择对话
  $selectHistory.addEventListener("change", (e) => {
    currentId = e.target.value;
    localStorage.setItem("code-assist.currentId", currentId);
    messages = [];
    $messages.innerHTML = [];
    getMesasges();
  });

  // 选择模型
  $selectModel.addEventListener("change", (e) => {
    currentModel = e.target.value;
    localStorage.setItem("code-assist.currentModel", currentModel);
  });

  // 发送消息
  $buttonChat.addEventListener("click", () => {
    sendMessage();
  });

  // 允许按 Enter 键发送消息
  $input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

  // 中断消息
  $buttonStop.addEventListener("click", () => {
    chatStop();
  });

  // 清空消息
  $buttonClean.addEventListener("click", () => {
    messages = [];
    $messages.innerHTML = [];
    cleanData();
  });

  function disableInteraction(){
    $input.disabled = true;
    $buttonChat.disabled = true;
    $buttonNew.disabled = true;
    $buttonClean.disabled = true;
  }

  function enableInteraction(){
    $input.disabled = false;
    $buttonChat.disabled = false;
    $buttonNew.disabled = false;
    $buttonClean.disabled = false;
  }
  // 接受消息
  let contentTemp = "";
  let tokens = 0;
  let startTime = 0;
  let endTime = 0;

  function resetInfo() {
    tokens = 0;
    startTime = 0;
    endTime = 0;
  }
  window.addEventListener("message", (e) => {
    const type = e.data.type;
    if (type === "chat-pre") {
      contentTemp = `...`;
      $messages.appendChild(createMessageForAI(contentTemp));
      $messages.scrollTo(0, $messages.scrollHeight);
      disableInteraction();
    }
    if (type === "chat-start") {
      const $message = getLatestMessage();
      contentTemp = "";
      $message.innerHTML = marked.parse(contentTemp);
      $messages.scrollTo(0, $messages.scrollHeight);
    } else if (type === "chat-data") {
      const $message = getLatestMessage();
      const json = e.data.text;
      const data = JSON.parse(json);
      const text = data.message.content;
      if (startTime === 0) {
        startTime = new Date(data.created_at).getTime();
      }
      endTime = new Date(data.created_at).getTime();
      contentTemp += text;
      $message.innerHTML = marked.parse(contentTemp);
      $messages.scrollTo(0, $messages.scrollHeight);
      tokens++;
    } else if (type === "chat-end") {
      const duration = (endTime - startTime) / 1000;
      chatEnd(contentTemp, { model: currentModel, tokens, duration });
      contentTemp += createMarkdownInfo({
        model: currentModel,
        tokens,
        duration,
      });
      const $message = getLatestMessage();
      $message.innerHTML = marked.parse(contentTemp);
      $messages.scrollTo(0, $messages.scrollHeight);
      hljs.highlightAll();
      resetInfo();
      enableInteraction();
    } else if (type === "tags-end") {
      const json = e.data.text;
      const models = json.models || [];
      models.sort((a, b) => a.name.localeCompare(b.name));
      $selectModel.innerHTML = "";
      models.forEach((model) => {
        const $option = document.createElement("option");
        $option.value = model.name;
        $option.textContent = `${model.name}`;
        if ($option.value === currentModel) {
          $option.selected = true;
        }
        $selectModel.appendChild($option);
      });
    }
  });
}

window.addEventListener("load", onLoad);
