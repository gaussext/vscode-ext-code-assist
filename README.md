# vscode-ext-code-assist

VS Code 简单代码小助手，使用本地 Ollama 作为后端

![](https://www.gausszhou.top/static/data/github/code-assist.webp)

## Configuration

`settings.json`

```json
{
    "code-assist.ollama": "http://127.0.0.1:11434",
    "code-assist.deepseek_token": "sk-***"
}
```

## Features

- [x] 基本问答功能完成
- [x] 渲染 Markdown
- [x] 计算生成速度
- [x] 允许配置地址
- [x] 配置地址后获取模型列表
- [x] 可自由选择模型 
- [x] 样式优化
- [x] 代码高亮
- [x] 支持上下文对话
- [x] 支持历史记录
- [x] 支持清空历史记录
- [x] 支持创建多个对话
- [x] 支持删除会话
- [x] 右键菜单 - 开始对话
- [x] 右键菜单 - 代码解释
- [x] 右键菜单 - 代码优化
- [x] 复制回答 - HTML
- [x] 复制回答 - Markdown
- [x] 支持 Deepseek
- [x] 支持 Deepseek 代码补全

## Build

```bash
npm i
npm run vsce
code --install-extension your-extension.vsix
```

## Test

```bash
使用十种编程语言输出 Hello World
```