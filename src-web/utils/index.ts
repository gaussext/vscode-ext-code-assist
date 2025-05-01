import { Info } from "../models/Model";

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