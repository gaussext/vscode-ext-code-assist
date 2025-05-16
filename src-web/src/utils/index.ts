/**
 *  获取 Json 数据
 * @param str 
 * @param defValue 
 * @returns 
 */
export function getJsonSafe(str: string, defValue: any = null) {
    try {
        return JSON.parse(str);
    }   catch (e) {
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

export type ThrottledFunction<T extends any[]> = (...args: T) => void;

export function throttle<T extends any[]>(
    func: (...args: T) => void,
    limit: number
): ThrottledFunction<T> {
    let lastFunc: ReturnType<typeof setTimeout> | null = null;
    let lastRan: number | null = null;

    return function (this: any, ...args: T) {
        const context = this;
        if (!lastRan) {
            func.apply(context, args);
            lastRan = Date.now();
        } else {
            if (lastFunc) {
                clearTimeout(lastFunc);
            }
            lastFunc = setTimeout(() => {
                if (lastRan && Date.now() - lastRan >= limit) {
                    func.apply(context, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - (lastRan || 0)));
        }
    };
}