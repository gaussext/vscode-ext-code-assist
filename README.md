# Code Assist

基于 OpenAI API 的 VS Code 代码助手扩展，提供智能代码辅助功能。

## 功能特性

- **智能对话**: 支持多会话聊天、上下文对话、历史记录管理
- **代码操作**: 代码解释、优化、注释生成、语法升级（Class/Vue/React）
- **文本处理**: 数据分析、文本翻译、文学鉴赏
- **用户体验**: Markdown 渲染、代码高亮、一键复制、流式响应
- **快捷操作**: 右键菜单集成、快捷键支持（Ctrl+U / Cmd+U）

## 安装

```bash
# 构建扩展
pnpm run vsce

# 安装扩展
code --install-extension code-assist-*.vsix
```

## 使用方法

### 快捷键

- **Ctrl+U** (Windows/Linux) 或 **Cmd+U** (Mac): 打开代码助手

### 右键菜单

选中代码后，可通过右键菜单访问：

- 开始对话、代码解释、代码优化、代码注释
- 升级 Class/Vue/React、数据分析、文本翻译、文学鉴赏

### 命令面板

通过 `Ctrl+Shift+P` / `Cmd+Shift+P` 访问所有 `Code Assist:` 开头的命令。

## 许可证

MIT License
