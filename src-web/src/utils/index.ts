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

// 控制速度为 33 - 60 Token/s
const calcDelay = (count, min = 1000 / 60, max = 1000 / 30) => {
    const progress = Math.max(0, (max + min - count) / (max + min));
    return Math.ceil(lerp(min, max, progress));
};

let isExecuting = false;
const resultQueue: any[] = [];
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

export const queueAsync = (result: any, callback) => {
    resultQueue.push(result);
    // 如果没有正在执行的任务，开始执行
    if (!isExecuting) {
        executeNextTask(callback);
    }
};