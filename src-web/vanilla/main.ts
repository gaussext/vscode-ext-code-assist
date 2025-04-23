import { Model } from "../Model";
import { View } from "./View";

declare var marked: any;
declare var hljs: any;

// 初始化
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

function render() {
  document.getElementById("root")!.innerHTML = `
  <div class="chat-container">
        <div class="history-area">
            <select class="vscode-select" id="model-select"></select>
            <select class="vscode-select" id="history-select"></select>
            <button class="vscode-button-small" id="create-button">+</button>
            <button class="vscode-button-small" id="delete-button">-</button>
        </div>
        <div class="messages-area" id="messages"></div>
        <div class="chat-area">
            <textarea class="vscode-textarea" id="chat-input" rows="4" placeholder="请输入您的问题" resize="none"></textarea>
            <button style="margin-top: 6px;" class="vscode-button-full" id="chat-button">发送</button>
        </div>
    </div>
  `
}

function onLoad() {
  render();
  new View(new Model());
}

window.addEventListener("load", onLoad);
