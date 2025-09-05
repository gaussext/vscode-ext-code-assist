import hljs from './hljs';
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";

export const marked = new Marked(
    markedHighlight({
        emptyLangClass: 'hljs',
        langPrefix: 'hljs language-',
        highlight(code, lang, info) {
            try {
                const language = hljs.getLanguage(lang) ? lang : 'plaintext';
                return hljs.highlight(code, { language }).value;
            } catch {
                return code;
            }

        }
    })
)