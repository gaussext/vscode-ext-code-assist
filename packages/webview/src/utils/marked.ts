import hljs from './hljs';
import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';

export const marked = new Marked(
  markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    async: true,
    async highlight(code, language) {
      try {
        const validLang = language && hljs.getLanguage(language) ? language : 'plaintext';
        const highlighted = hljs.highlight(code, { language: validLang }).value;
        const buttonHtml = `<button class="copy-button" data-code="${code}" onclick="copyCode(this)"><span class="copy-text">复制</span></button>`;
        return `${buttonHtml}${highlighted}`;
      } catch {
        return code;
      }
    },
  })
);

(window as any).copyCode = function (button: HTMLButtonElement) {
  const code = decodeURIComponent(button.dataset.code || '');
  if (navigator.clipboard) {
    navigator.clipboard.writeText(code).then(() => {
      showCopySuccess(button);
    });
  } else {
    const textarea = document.createElement('textarea');
    textarea.value = code;
    textarea.style.position = 'fixed';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showCopySuccess(button);
    } finally {
      document.body.removeChild(textarea);
    }
  }
};

function showCopySuccess(button: HTMLButtonElement) {
  const textSpan = button.querySelector('.copy-text');
  if (textSpan) {
    textSpan.textContent = '已复制';
    button.classList.add('copy-success');
    setTimeout(() => {
      textSpan.textContent = '复制';
      button.classList.remove('copy-success');
    }, 2000);
  }
}
