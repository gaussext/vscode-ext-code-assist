# AGENTS.md

## Package Manager

This project uses **pnpm** as the package manager.

## Project Overview

**Code Assist** is a VS Code extension that provides AI-powered code assistance using DeepSeek API. It's a monorepo project with the following structure:

### Project Structure

```
vscode-ext-code-assist/
├── packages/
│   ├── main/                    # VS Code Extension Main Program
│   │   ├── src/
│   │   │   ├── controllers/     # Chat Controller
│   │   │   ├── models/          # Data Models & Types
│   │   │   ├── services/        # OpenAI Service (DeepSeek API)
│   │   │   ├── views/           # Webview Provider
│   │   │   └── extension.ts     # Extension Entry Point
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── webpack.config.js
│   ├── vscode-webview-rpc/      # Webview RPC Communication Library
│   │   ├── src/                 # RPC Server & Client Implementation
│   │   ├── examples/            # Usage Examples
│   │   └── README.md
│   └── webview/                 # Vue 3 Frontend UI
│       ├── src/
│       │   ├── api/             # RPC API
│       │   ├── components/      # Vue Components
│       │   ├── store/           # Vuex Store
│       │   ├── stores/          # Pinia Stores
│       │   ├── styles/          # CSS Styles
│       │   ├── utils/           # Utilities
│       │   └── types/           # TypeScript Types
│       ├── package.json
│       └── vite.config.ts
├── package.json                 # Root Package Configuration
├── pnpm-workspace.yaml          # Workspace Configuration
└── tsconfig.json                # TypeScript Configuration
```

### Technology Stack

- **Language**: TypeScript
- **Extension API**: VS Code Extension API
- **Frontend Framework**: Vue 3
- **Build Tools**: Vite, Webpack
- **Package Manager**: pnpm
- **AI Provider**: DeepSeek API

### Key Features

1. **Chat Interface**
   - Markdown rendering with syntax highlighting
   - Code copy functionality
   - Generation speed calculation
   - Streaming response support

2. **Configuration**
   - Configurable DeepSeek API endpoint
   - Dynamic model list fetching
   - Model selection
   - Temperature parameter adjustment

3. **Session Management**
   - Multi-conversation support
   - Context-aware conversations
   - History management
   - Session deletion

4. **Code Integration**
   - Right-click menu integration
   - Code explanation
   - Code optimization
   - Code commenting
   - Code upgrades (Class, Vue, React)
   - Data analysis
   - Text translation
   - Literary appreciation

5. **User Experience**
   - Keyboard shortcut (Ctrl+U / Cmd+U)
   - Session information display
   - Multiple chat modes

### Development Commands

```bash
# Install dependencies
pnpm install

# Build RPC library
pnpm run build:rpc

# Build webview
pnpm run build:webview

# Build all (prepare)
pnpm run build:prepare

# Compile extension
pnpm run compile

# Watch mode for development
pnpm run watch

# Package extension
pnpm run package

# Run linter
pnpm run lint

# Run tests
pnpm test

# Create VSIX package
pnpm run vsce
```

### Installation

```bash
# Build the extension
pnpm run vsce

# Install the extension
code --install-extension code-assist-*.vsix
```

### Configuration

The extension can be configured through VS Code settings:

- `code-assist.deepseek`: DeepSeek server address (default: https://api.deepseek.com)
- `code-assist.deepseek_token`: DeepSeek API token

### Commands

- `codeAssist.open`: Open Code Assist (Ctrl+U / Cmd+U)
- `codeAssist.chat`: Start chat with selected code
- `codeAssist.optimization`: Optimize selected code
- `codeAssist.explanation`: Explain selected code
- `codeAssist.comment`: Add comments to selected code
- `codeAssist.upgrade-class`: Upgrade to class syntax
- `codeAssist.upgrade-vue`: Upgrade Vue code
- `codeAssist.upgrade-react`: Upgrade React code
- `codeAssist.analysis`: Analyze selected data
- `codeAssist.translation`: Translate selected text
- `codeAssist.appreciation`: Literary appreciation
- `codeAssist.add-to-chat`: Add selection to chat