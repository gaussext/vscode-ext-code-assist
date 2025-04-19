async function copyToClipboard(text) {
  if (navigator.clipboard) {
    return await navigator.clipboard.writeText(text);
  } else {
    return new Promise((resolve, reject) => {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      document.body.appendChild(textarea);
      textarea.select();

      try {
        const successful = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (successful) {
          resolve();
        } else {
          reject(new Error("复制命令失败"));
        }
      } catch (err) {
        document.body.removeChild(textarea);
        reject(err);
      }
    });
  }
}

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
  version: 4,
});

function createConversationInit(params) {
  return [
    {
      id: "0",
      title: "新建对话",
    },
  ];
}

function createState() {
  return {
    model: "",
    startTime: 0,
    endTime: 0,
    tokens: 0,
    content: "",
  };
}

const state = createState();
function resetInfo() {
  state.startTime = 0;
  state.endTime = 0;
  state.tokens = 0;
  state.content = "";
}
const vscode = acquireVsCodeApi();
let conversations = createConversationInit();
let messages = [];
let conversationId = "0";
state.model = localStorage.getItem("code-assist.model") || "";

function getModels() {
  vscode.postMessage({
    command: "tags",
  });
}

function doChatStart(message) {
  messages.push({
    role: "user",
    timestamp: Date.now(),
    content: message,
  });
  vscode.postMessage({
    command: "chat",
    model: state.model,
    text: message,
    messages: messages,
  });
}

function doChatStop() {
  vscode.postMessage({
    command: "stop",
  });
}

function doChatEnd(info) {
  const { content, model, tokens, startTime, endTime } = info;
  const duration = (endTime - startTime) / 1000;
  messages.push({
    role: "assistant",
    timestamp: Date.now(),
    content: content,
    info: {
      model,
      tokens,
      duration,
      startTime, 
      endTime
    },
  });
  saveMessages();
}

function createMarkdownInfo(info) {
  const { model, tokens, startTime, endTime } = info;
  const duration = (endTime - startTime) / 1000;
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

function saveMessages() {
  db.set({
    id: conversationId,
    messages: messages,
    timestamp: Date.now(),
  });
}

function cleanData() {
  db.set({
    id: conversationId,
    messages: [],
    timestamp: Date.now(),
  });
}

function createConversation() {
  const nextId =
    (Math.max(...conversations.map((item) => Number(item.id))) || 0) + 1;
  conversationId = `${nextId}`;
  conversations.push({
    id: conversationId,
    title: "新建对话",
  });
}

function deleteConversation(id) {
  if (conversations.length <= 1) {
    return false;
  }
  conversations = conversations.filter((item) => item.id !== id);
  conversationId = conversations[0].id;
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
  const $buttonCreate = document.getElementById("create-button");
  const $buttonDelete = document.getElementById("delete-button");
  const $buttonClean = document.getElementById("clean-button");

  const $messages = document.getElementById("messages");

  function getLatestMessage() {
    const list = Array.from(document.querySelectorAll(".message-ai"));
    const $message = list[list.length - 1];
    return $message;
  }

  function addCopyEvent($message, message) {
    const $html = $message.querySelector(".copy-html");
    if ($html) {
      $html.onclick = () => {
        copyToClipboard($message.innerHTML).then(() => {
          $html.innerHTML = "复制成功";
          setTimeout(() => {
            $html.innerHTML = "复制 HTML";
          }, 1000);
        });
      };
    }
    const $markdown = $message.querySelector(".copy-markdown");
    if ($markdown) {
      $markdown.onclick = () => {
        copyToClipboard(message).then(() => {
          $markdown.innerHTML = "复制成功";
          setTimeout(() => {
            $markdown.innerHTML = "复制 Markdown";
          }, 1000);
        });
      };
    }
  }

  function createMessageForYou(message) {
    const $message = document.createElement("div");
    $message.classList.add("message-you");
    $message.classList.add("markdown-body");
    $message.innerHTML = marked.parse(`You: ${message}`);
    $messages.scrollTo(0, $messages.scrollHeight);
    return $message;
  }

  const footer =
    '<a class="link-copy copy-html">复制 HTML</a><a class="link-copy copy-markdown">复制 Markdown</a>';

  function createMessageForAI(message, info) {
    const $message = document.createElement("div");
    $message.classList.add("message-ai");
    $message.classList.add("markdown-body");
    $message.innerHTML = marked.parse(`AI: ${message}`);
    $messages.scrollTo(0, $messages.scrollHeight);
    if (info) {
      $message.innerHTML += marked.parse(info) + footer;
      addCopyEvent($message, message);
    }
    return $message;
  }

  function updateMessageForAI(message) {
    const $message = getLatestMessage();
    $message.innerHTML = marked.parse(`AI: ${message}`);
    $messages.scrollTo(0, $messages.scrollHeight);
  }

  function endMessageForAI(message, info) {
    const $message = getLatestMessage();
    $message.innerHTML = marked.parse(`AI: ${message} ${info}`) + footer;
    $messages.scrollTo(0, $messages.scrollHeight);
    addCopyEvent($message, message);
  }

  function renderConversation() {
    $selectHistory.innerHTML = "";
    conversations.forEach((item) => {
      const $option = document.createElement("option");
      $option.value = item.id;
      $option.textContent = `${item.title}`;
      if ($option.value === conversationId) {
        $option.selected = true;
      }
      $selectHistory.appendChild($option);
    });
  }
  // 获取对话
  function getConversations() {
    try {
      const list = JSON.parse(localStorage.getItem("conversations")) || [];
      if (list.length) {
        conversations = list;
        conversationId = list[0].id;
        renderConversation();
      }
    } catch (error) {
      conversations = createConversationInit();
      renderConversation();
    }
  }
  // 获取数据
  function getMesasges() {
    messages = [];
    $messages.innerHTML = "";
    db.get(conversationId).then((conversation) => {
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
            createMessageForAI(item.content, createMarkdownInfo(item.info))
          );
        }
      });
      $messages.scrollTo(0, $messages.scrollHeight);
      hljs.highlightAll();
    });
  }

  function sendMessage() {
    const message = $input.value;
    if (message) {
      $messages.appendChild(createMessageForYou(message));
      doChatStart(message);
      conversations.forEach((item) => {
        if (item.id === conversationId) {
          item.title = message.slice(0, 10) + "...";
        }
      });
      renderConversation();
      saveConversation();
      $input.value = "";
      hljs.highlightAll();
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
  $buttonCreate.addEventListener("click", () => {
    createConversation();
    renderConversation();
    saveConversation();
    messages = [];
    $messages.innerHTML = [];
    saveMessages();
  });

  // 删除当前会话
  $buttonDelete.addEventListener("click", () => {
    deleteConversation(conversationId);
    renderConversation();
    saveConversation();
    getMesasges();
  });

  // 选择对话
  $selectHistory.addEventListener("change", (e) => {
    conversationId = e.target.value;
    getMesasges();
  });

  // 选择模型
  $selectModel.addEventListener("change", (e) => {
    state.model = e.target.value;
    localStorage.setItem("code-assist.model", state.model);
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
    doChatStop();
  });

  // 清空消息
  $buttonClean.addEventListener("click", () => {
    messages = [];
    $messages.innerHTML = [];
    cleanData();
  });

  function disableInteraction() {
    $selectModel.disabled = true;
    $selectHistory.disabled = true;
    $buttonCreate.disabled = true;
    $buttonDelete.disabled = true;

    $input.disabled = true;
    $buttonChat.disabled = true;
    $buttonClean.disabled = true;
  }

  function enableInteraction() {
    $selectModel.disabled = false;
    $selectHistory.disabled = false;
    $buttonCreate.disabled = false;
    $buttonDelete.disabled = false;

    $input.disabled = false;
    $buttonChat.disabled = false;
    $buttonClean.disabled = false;
    
  }
  // 获取到模型列表
  function onModels(e) {
    const json = e.data.text;
    const models = json.models || [];
    models.sort((a, b) => a.name.localeCompare(b.name));
    $selectModel.innerHTML = "";
    models.forEach((model) => {
      const $option = document.createElement("option");
      $option.value = model.name;
      $option.textContent = `${model.name}`;
      if ($option.value === state.model) {
        $option.selected = true;
      }
      $selectModel.appendChild($option);
    });
  }

  // 接受消息
  function onRequest() {
    state.content = `...`;
    $messages.appendChild(createMessageForAI(state.content));
    disableInteraction();
  }

  function onStart() {
    state.content = "";
    updateMessageForAI(state.content);
  }

  function onData(e) {
    const json = e.data.text;
    const data = JSON.parse(json);
    const text = data.message.content;
    if (data.created_at) {
      if (state.startTime === 0) {
        state.startTime = new Date(data.created_at).getTime();
      }
      state.endTime = new Date(data.created_at).getTime();
    }
    
    state.content += text;
    state.tokens++;
    if (state.tokens % 2 === 0) {
      updateMessageForAI(state.content);
    }
  }

  function onEnd() {
    doChatEnd(state);
    endMessageForAI(state.content, createMarkdownInfo(state));
    hljs.highlightAll();
    resetInfo();
    enableInteraction();
  }
  // 优化代码
  function onOptimization(e) {
    const text = e.data.text;
    if (!text) {
      return false;
    }
    $input.value = `优化一下这段代码  
\`\`\`
${text}
\`\`\``;
    $buttonChat.click();
  }
  // 解释代码
  function onExplanation(e) {
    const text = e.data.text;
    if (!text) {
      return false;
    }
    $input.value = `解释一下这段代码 
\`\`\`
${text}
\`\`\``;
    $buttonChat.click();
  }

  window.addEventListener("message", (e) => {
    const type = e.data.type;
    if (type === "tags-end") {
      onModels(e);
    } else if (type === "chat-pre") {
      onRequest();
    } else if (type === "chat-start") {
      onStart();
    } else if (type === "chat-data") {
      onData(e);
    } else if (type === "chat-end") {
      onEnd();
    } else if (type === "optimization") {
      onOptimization(e);
    } else if (type === "explanation") {
      onExplanation(e);
    }
  });

  vscode.postMessage({
    command: "loaded",
  });
}

window.addEventListener("load", onLoad);
