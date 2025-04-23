import { Model } from "./Model";
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

function onLoad() {
  new View(new Model());
}

window.addEventListener("load", onLoad);
