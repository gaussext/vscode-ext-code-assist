import { marked } from '@/utils/marked';
import DOMPurify from 'dompurify';

export const reasoningStartTag = `<details><summary>Think</summary>`;
export const reasoningEndTag = `</details>`;

const pureMarkdown = (markdown: string) => {
  return DOMPurify.sanitize(markdown, {
    ALLOWED_TAGS: ['h1' ,'h2', 'h3', 'p', 'div', 'b', 'i', 'img'],
    ALLOWED_ATTR: ['src', 'alt'],
  })
}

const cleanHtml = (html: string) => DOMPurify.sanitize(html);

export const renderMarkdown = async (markdown: string) => {
  if (!markdown) {
    return '';
  }
  const result = await marked.parse(pureMarkdown(markdown));
  return cleanHtml(result);
};