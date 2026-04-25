import { marked } from '@/utils/marked';
import DOMPurify from 'dompurify';

export const reasoningStartTag = `<details><summary>Think</summary>`;
export const reasoningEndTag = `</details>`;

const cleanHtml = (markdown: string) => {
  return DOMPurify.sanitize(markdown, {
    ALLOWED_TAGS: [
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'p',
      'div',
      'span',
      'br',
      'hr',
      'ul',
      'ol',
      'li',
      'blockquote',
      'pre',
      'code',
      'a',
      'img',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'details',
      'summary',
      'mark',
      'b',
      'i',
      'strong',
      'em',
      'del',
      's',
      'button',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'data-code', 'onclick', 'open'],
  });
};

export const renderMarkdown = async (markdown: string) => {
  if (!markdown) {
    return '';
  }
  const result = await marked.parse(markdown);
  return cleanHtml(result);
};
