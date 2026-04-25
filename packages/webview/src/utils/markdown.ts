import { marked } from '@/utils/marked';
import DOMPurify from 'dompurify';

export const reasoningStartTag = `<details><summary>Think</summary>`;
export const reasoningEndTag = `</details>`;

const cleanHtml = (html: string) => DOMPurify.sanitize(html);

export const renderMarkdown = async (markdown: string) => {
  if (!markdown) {
    return '';
  }
  const result = await marked.parse(markdown);
  return cleanHtml(result);
};