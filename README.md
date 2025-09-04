# vscode-ext-code-assist

VS Code 简单代码小助手，支持 Ollama/DeepSeek/Gemini

## Configuration

`settings.json`

```json
{
  "code-assist.ollama": "http://127.0.0.1:11434",
  "code-assist.deepseek": "https://api.deepseek.com",
  "code-assist.deepseek_token": "***",
  "code-assist.gemini_token": "***"
}
```

## Features

- [x] 基本功能
  - [x] 基本问答功能完成
  - [x] 渲染 Markdown
  - [x] 计算生成速度
  - [x] 代码高亮
- [x] 配置
  - [x] 允许配置地址
  - [x] 配置地址后获取模型列表
  - [x] 可自由选择模型
- [x] 会话
  - [x] 支持上下文对话
  - [x] 支持历史记录
  - [x] 支持清空历史记录
  - [x] 支持创建多个对话
  - [x] 支持删除会话
- [x] 右键菜单
  - [x] 右键菜单 - 开始对话
  - [x] 右键菜单 - 代码解释
  - [x] 右键菜单 - 代码优化
  - [x] 复制回答 - Markdown
- [x] 支持模型
  - [x] 支持 Ollama
  - [x] 支持 Deepseek
  - [x] 支持 Gemini
- [x] 支持显示会话信息
  - [x] 输入
  - [x] 输出
  - [x] 上下文长度

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
