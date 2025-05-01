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