# Code Assist

一个强大的 VS Code 代码助手扩展，基于 DeepSeek API 提供智能代码辅助功能。

## 简介

Code Assist 是一个功能丰富的 VS Code 扩展，通过集成 DeepSeek AI 模型，为开发者提供智能的代码辅助功能。它支持多种代码操作，包括代码解释、优化、注释生成等，帮助提高开发效率。

## 核心功能

### 聊天界面
- ✅ 智能问答功能
- ✅ Markdown 渲染支持
- ✅ 代码高亮显示
- ✅ 一键复制代码
- ✅ 实时生成速度计算
- ✅ 流式响应支持

### 配置管理
- ✅ 自定义 API 服务器地址
- ✅ 动态获取可用模型列表
- ✅ 灵活的模型选择
- ✅ 温度参数调整

### 会话管理
- ✅ 多会话支持
- ✅ 上下文对话
- ✅ 历史记录保存
- ✅ 清空历史记录
- ✅ 会话删除功能

### 代码集成
- ✅ 右键菜单集成
- ✅ 代码解释
- ✅ 代码优化
- ✅ 代码注释生成
- ✅ Class 语法升级
- ✅ Vue 代码升级
- ✅ React 代码升级
- ✅ 数据分析
- ✅ 文本翻译
- ✅ 文学鉴赏
- ✅ 添加到对话

### 用户体验
- ✅ 快捷键支持（Ctrl+U / Cmd+U）
- ✅ 会话信息显示（输入/输出/上下文长度）
- ✅ 多种聊天模式

### 支持的模型
- ✅ DeepSeek（主要支持）
- ⚪ Ollama（已屏蔽）
- ⚪ Gemini（已屏蔽）

## 项目结构

本项目采用 Monorepo 架构，包含以下包：

```
vscode-ext-code-assist/
├── packages/
│   ├── main/                    # VS Code 扩展主程序
│   ├── vscode-webview-rpc/      # Webview RPC 通信库
│   └── webview/                 # Vue 3 前端界面
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.json
```

## 技术栈

- **编程语言**: TypeScript
- **扩展 API**: VS Code Extension API
- **前端框架**: Vue 3
- **构建工具**: Vite, Webpack
- **包管理器**: pnpm
- **AI 服务**: DeepSeek API

## 安装

### 从 VSIX 安装

```bash
# 构建扩展
pnpm run vsce

# 安装扩展
code --install-extension code-assist-*.vsix
```

### 从源码安装

```bash
# 克隆仓库
git clone https://github.com/your-username/vscode-ext-code-assist.git
cd vscode-ext-code-assist

# 安装依赖
pnpm install

# 构建扩展
pnpm run compile

# 打包扩展
pnpm run vsce

# 安装扩展
code --install-extension code-assist-*.vsix
```

## 配置

在 VS Code 设置中配置以下选项：

- `code-assist.deepseek`: DeepSeek 服务器地址（默认：https://api.deepseek.com）
- `code-assist.deepseek_token`: DeepSeek API 密钥

## 使用方法

### 快捷键

- **Ctrl+U** (Windows/Linux) 或 **Cmd+U** (Mac): 打开代码助手

### 右键菜单

在代码编辑器中选中代码后，可以通过右键菜单访问以下功能：

1. **开始对话**: 与选中的代码开始对话
2. **代码解释**: 解释选中的代码
3. **代码优化**: 优化选中的代码
4. **代码注释**: 为选中的代码添加注释
5. **升级 Class**: 将代码升级为 Class 语法
6. **升级 Vue**: 升级 Vue 代码
7. **升级 React**: 升级 React 代码
8. **数据分析**: 分析选中的数据
9. **文本翻译**: 翻译选中的文本
10. **文学鉴赏**: 进行文学鉴赏
11. **添加到对话**: 将选中内容添加到当前对话

### 命令面板

通过命令面板（Ctrl+Shift+P / Cmd+Shift+P）可以访问所有命令：

- `Code Assist: 打开代码助手`
- `Code Assist: 开始对话`
- `Code Assist: 代码优化`
- `Code Assist: 代码解释`
- `Code Assist: 代码注释`
- `Code Assist: 升级 Class`
- `Code Assist: 升级 Vue`
- `Code Assist: 升级 React`
- `Code Assist: 数据分析`
- `Code Assist: 文本翻译`
- `Code Assist: 文学鉴赏`
- `Code Assist: 添加到对话`

## 开发

### 环境要求

- Node.js >= 18
- pnpm >= 8
- VS Code >= 1.98.0

### 开发命令

```bash
# 安装依赖
pnpm install

# 构建 RPC 库
pnpm run build:rpc

# 构建 Webview
pnpm run build:webview

# 构建所有（准备）
pnpm run build:prepare

# 编译扩展
pnpm run compile

# 监听模式（开发）
pnpm run watch

# 打包扩展
pnpm run package

# 运行 Linter
pnpm run lint

# 运行测试
pnpm test

# 创建 VSIX 包
pnpm run vsce
```

### 项目架构

#### packages/main
VS Code 扩展的主程序，包含：
- `controllers/`: 聊天控制器
- `models/`: 数据模型和类型定义
- `services/`: OpenAI 服务（DeepSeek API 集成）
- `views/`: Webview 提供者
- `extension.ts`: 扩展入口点

#### packages/vscode-webview-rpc
Webview RPC 通信库，提供：
- 简单易用的 RPC 通信接口
- 支持流式数据传输
- 类型安全的 TypeScript 支持
- 完整的错误处理机制

详见 [vscode-webview-rpc README](packages/vscode-webview-rpc/README.md)

#### packages/webview
Vue 3 前端界面，包含：
- `api/`: RPC API 封装
- `components/`: Vue 组件
- `store/`: Vuex Store
- `stores/`: Pinia Stores
- `styles/`: CSS 样式
- `utils/`: 工具函数
- `types/`: TypeScript 类型定义

## 测试

```bash
# 运行测试
pnpm test

# 示例测试问题
使用十种编程语言输出 Hello World
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 作者

gausszhou

## 更新日志

### v0.3.4
- 添加会话信息显示
- 支持温度参数调整
- 优化用户界面

## 相关链接

- [VS Code 扩展 API](https://code.visualstudio.com/api)
- [DeepSeek API](https://platform.deepseek.com/)
- [Vue 3](https://vuejs.org/)
- [pnpm](https://pnpm.io/)
