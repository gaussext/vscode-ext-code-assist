import katex from 'katex';
import 'katex/dist/katex.min.css';

// 1. 定义 KaTeX 渲染函数
const renderMath = (math, displayMode) => {
  return katex.renderToString(math, {
    displayMode: displayMode, // true 为块级公式 ($$)，false 为行内公式 ($)
    throwOnError: false, // 避免公式错误导致页面崩溃
  });
};

// 2. 创建 marked 扩展以支持 $ 和 $$
export const markedKatexExtension = {
  name: 'katex',
  level: 'inline', // 行内公式
  start(src) { return src.match(/\$/)?.index; }, // 优化性能
  tokenizer(src, tokens) {
    // 匹配行内公式 $...$
    const inlineRule = /^\$([^\$\n]+)\$/;
    const match = inlineRule.exec(src);
    if (match) {
      return {
        type: 'katex',
        raw: match[0],
        text: match[1],
        displayMode: false
      };
    }
    return false;
  },
  renderer(token) {
    return renderMath(token.text, token.displayMode);
  }
};

export const markedBlockKatexExtension = {
  name: 'blockKatex',
  level: 'block', // 块级公式
  start(src) { return src.match(/\$\$/)?.index; },
  tokenizer(src, tokens) {
    // 匹配块级公式 $$...$$
    const blockRule = /^\$\$([^\$]+)\$\$/;
    const match = blockRule.exec(src);
    if (match) {
      return {
        type: 'blockKatex',
        raw: match[0],
        text: match[1],
        displayMode: true
      };
    }
    return false;
  },
  renderer(token) {
    return renderMath(token.text, token.displayMode);
  }
};