# vscode-ext-code-assist

VS Code 简单代码小助手，使用本地 Ollama 作为后端

## Configuration

`settings.json`

```json
{
    "code-assist.origin": "http://127.0.0.1:11434"
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
- [x] 右键菜单

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