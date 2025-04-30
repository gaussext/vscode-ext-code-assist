declare var marked: any;
import { Info } from "../models/Model";
const footer = '<a class="link-copy copy-html">复制 HTML</a><a class="link-copy copy-markdown">复制 Markdown</a>';

export async function copyToClipboard(text: string) {
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
                    resolve({});
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

export function addCopyEvent($message: HTMLElement, message: string) {
    const $html = $message.querySelector(".copy-html") as HTMLElement;
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
    const $markdown = $message.querySelector(".copy-markdown") as HTMLElement;
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

export function createMessageForYou(message: string) {
    const $message = document.createElement("div");
    $message.classList.add("message-you");
    $message.classList.add("markdown-body");
    $message.innerHTML = marked.parse(`You: ${message}`);
    return $message;
}

export function createMessageForAI(message: string, info: string) {
    const $message = document.createElement("div");
    $message.classList.add("message-ai");
    $message.classList.add("markdown-body");
    $message.innerHTML = marked.parse(`AI: ${message}`);
    if (info) {
        $message.innerHTML += marked.parse(info) + footer;
        addCopyEvent($message, message);
    }
    return $message;
}

export function createMarkdownInfo(info: Info) {
    const { modelId, tokens, startTime, endTime } = info;
    const duration = (endTime - startTime) / 1000;
    const speed = tokens / duration;
    return `
\`\`\`
Model: ${modelId} 
Tokens: ${tokens} 
Duration: ${duration.toFixed(2)} Sec 
Speed: ${speed.toFixed(2)} Token/s
\`\`\`
`;
}

export function firstElement<T>(list: T[]) {
    return list[0];
}

export function lastElement<T>(list: T[]) {
    return list[list.length - 1];
}