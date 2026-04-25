import type { IMessage } from '@/types';

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
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
 * token 是模型用来表示自然语言文本的基本单位，也是我们的计费单元，可以直观的理解为“字”或“词”；通常 1 个中文词语、1 个英文单词、1 个数字或 1 个符号计为 1 个 token。
 * 一般情况下模型中 token 和字数的换算比例大致如下：
 * 1 个英文字符 ≈ 0.3 个 token。
 * 1 个中文字符 ≈ 0.6 个 token。
 * 但因为不同模型的分词不同，所以换算比例也存在差异，每一次实际处理 token 数量以模型返回为准，您可以从返回结果的 usage 中查看。
 * @param text
 * @returns
 */
export function getTokenCount(text: string = ''): number {
  let tokenCount = 0;
  for (const char of text) {
    const code = char.charCodeAt(0);
    // Simplified check: Chinese characters are mostly in 0x4E00-0x9FFF
    if (code >= 0x4e00 && code <= 0x9fff) {
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
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      document.body.appendChild(textarea);
      textarea.select();

      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (successful) {
          resolve({});
        } else {
          reject(new Error('复制命令失败'));
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