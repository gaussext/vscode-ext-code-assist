import type { IMessage } from "@/types";

/**
 *  获取 Json 数据
 * @param str 
 * @param defValue 
 * @returns 
 */
export function getJsonSafe(str: string, defValue: any = null) {
    try {
        return JSON.parse(str);
    } catch (e) {
        return defValue;
    }
}

/**
 * 简易 Token 计算方法
 * @param text 
 * @returns 
 */
export function getTokenCount(text: string): number {
    let tokenCount = 0;
    for (const char of text) {
        const code = char.charCodeAt(0);
        // Simplified check: Chinese characters are mostly in 0x4E00-0x9FFF
        if (code >= 0x4E00 && code <= 0x9FFF) {
            tokenCount += 0.6; // Chinese character
        } else {
            tokenCount += 0.3; // English or other
        }
    }

    return Math.ceil(tokenCount);
}

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

export function firstElement<T>(list: T[]) {
    return list[0];
}

export function lastElement<T>(list: T[]) {
    return list[list.length - 1];
}

function lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
}

// 控制速度为 30 - 165 Token/s
// 剩余字符越多，渲染帧数越高
const calcDelay = (count, min = 30, max = 165) => {
    const total = max + min;
    const progress = count / (total + count);
    const fps = lerp(min, max, progress);
    const ms = Math.ceil(1000 / fps);
    return ms;
};

let isExecuting = false;
const resultQueue: IMessage[] = [];

// 执行队列中的任务
const executeNextTask = async (callback) => {
    while (resultQueue.length > 0 && !isExecuting) {
        isExecuting = true;
        const result = resultQueue.shift();
        callback(result);
        const delay = calcDelay(resultQueue.length);
        await new Promise(resolve => setTimeout(resolve, delay));
        isExecuting = false;
    }
};

type Callback<T> = (result: T) => void;

export const queueAsync = <T extends IMessage>(result: T, callback: Callback<T>) => {
    // 拆分 delta 为单个字符
    if (result.type === 'delta') {
        Array.from({ length: result.delta.length }).forEach((_, index) => {
            const char = result.delta[index];
            resultQueue.push({ type: 'delta', delta: char });
        });
    } else {
        resultQueue.push(result);
    }
    // 如果没有正在执行的任务，开始执行
    if (!isExecuting) {
        executeNextTask(callback);
    }
};