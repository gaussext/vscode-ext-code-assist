# code-assist-main

VS Code 扩展主程序，提供 AI 代码助手的核心功能。

## 功能特性

- **AI 聊天**: 与 AI 进行代码相关的对话
- **代码优化**: 优化选中代码的性能和可读性
- **代码解释**: 解释选中代码的功能
- **添加注释**: 为代码添加注释
- **代码升级**: 将代码升级为 Class/Vue/React 语法
- **数据分析**: 分析选中数据
- **文本翻译**: 翻译选中文本
- **文学鉴赏**: 对选中内容进行文学鉴赏

## 安装

```bash
pnpm install
pnpm run compile
```

## 快捷键

- `Ctrl+U` / `Cmd+U`: 打开 Code Assist

## 命令

| 命令 | 描述 |
|------|------|
| `codeAssist.open` | 打开 Code Assist |
| `codeAssist.chat` | 开始聊天 |
| `codeAssist.optimization` | 代码优化 |
| `codeAssist.explanation` | 代码解释 |
| `codeAssist.comment` | 添加注释 |
| `codeAssist.upgrade-class` | 升级为 Class 语法 |
| `codeAssist.upgrade-vue` | 升级 Vue 代码 |
| `codeAssist.upgrade-react` | 升级 React 代码 |
| `codeAssist.analysis` | 数据分析 |
| `codeAssist.translation` | 文本翻译 |
| `codeAssist.appreciation` | 文学鉴赏 |
| `codeAssist.add-to-chat` | 添加到聊天 |

## 配置

- `code-assist.deepseek`: DeepSeek 服务器地址（默认: `https://api.deepseek.com`）
- `code-assist.deepseek_token`: DeepSeek API Token

## 许可证

MIT