import hljs from './hljs';
import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import { markedKatexExtension, markedBlockKatexExtension } from './katex';
import { copyToClipboard } from '.';

export const marked = new Marked(
  markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    async: true,
    async highlight(code, language) {
      try {
        const validLang = language && hljs.getLanguage(language) ? language : 'plaintext';
        const highlighted = hljs.highlight(code, { language: validLang }).value;
        const encoded = encodeURIComponent(code)
        const buttonHtml = `<button class="copy-button" data-code="${encoded}" onclick="copyCode(this)"><span class="copy-text">复制</span></button>`;
        return `${buttonHtml}${highlighted}`;
      } catch {
        return code;
      }
    },
  })
);

marked.use({ extensions: [markedKatexExtension, markedBlockKatexExtension] });

(window as any).copyCode =  async (button: HTMLButtonElement) => {
  const code = decodeURIComponent(button.dataset.code || '');
  await copyToClipboard(code)
  showCopySuccess(button)
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
