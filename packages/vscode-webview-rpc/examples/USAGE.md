# VS Code Webview RPC 使用示例

## Main 端（VS Code Extension）

```typescript
import * as vscode from 'vscode';
import { WebviewRpcServer } from 'vscode-webview-rpc';

export class ChatWebViewProvider implements vscode.WebviewViewProvider {
  private rpcServer: WebviewRpcServer;

  constructor(private extensionUri: vscode.Uri) {
    this.rpcServer = new WebviewRpcServer(null, { debug: true });
    this.registerHandlers();
  }

  resolveWebviewView(webviewView: vscode.WebviewView) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    this.rpcServer = new WebviewRpcServer(webviewView.webview, { debug: true });
    this.registerHandlers();
  }

  private registerHandlers() {
    this.rpcServer.registerHandlers('chat', {
      async sendMessage(params: { message: string }) {
        return { 
          response: `You said: ${params.message}`,
          timestamp: Date.now()
        };
      },

      async streamMessage(params: { message: string }, stream) {
        const words = params.message.split(' ');
        for (let i = 0; i < words.length; i++) {
          stream.write({ 
            word: words[i],
            progress: ((i + 1) / words.length) * 100 
          });
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        stream.complete();
      },

      async getHistory() {
        return {
          messages: [
            { id: 1, role: 'user', content: 'Hello' },
            { id: 2, role: 'assistant', content: 'Hi there!' }
          ]
        };
      }
    });
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chat</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    .message { margin: 10px 0; padding: 10px; border-radius: 5px; }
    .user { background: #e3f2fd; }
    .assistant { background: #f5f5f5; }
    #output { margin-top: 20px; }
  </style>
</head>
<body>
  <h1>Chat Example</h1>
  <div>
    <input type="text" id="messageInput" placeholder="Type a message...">
    <button onclick="sendMessage()">Send</button>
    <button onclick="streamMessage()">Stream</button>
    <button onclick="getHistory()">History</button>
  </div>
  <div id="output"></div>
  
  <script>
    const vscode = acquireVsCodeApi();
    const output = document.getElementById('output');
    const messageInput = document.getElementById('messageInput');

    function log(message, type = 'info') {
      const div = document.createElement('div');
      div.className = 'message ' + type;
      div.textContent = message;
      output.appendChild(div);
    }

    async function sendMessage() {
      const message = messageInput.value;
      log('Sending: ' + message, 'user');
      
      const result = await rpcClient.call('chat.sendMessage', { message });
      log('Response: ' + result.response, 'assistant');
    }

    async function streamMessage() {
      const message = messageInput.value;
      log('Streaming: ' + message, 'user');
      
      let fullResponse = '';
      rpcClient.stream('chat.streamMessage', { message }, {
        onChunk: (chunk) => {
          fullResponse += chunk.word + ' ';
          log('Stream: ' + chunk.word + ' (' + chunk.progress.toFixed(0) + '%)', 'assistant');
        },
        onComplete: () => {
          log('Stream completed: ' + fullResponse, 'assistant');
        },
        onError: (error) => {
          log('Error: ' + error.message, 'error');
        }
      });
    }

    async function getHistory() {
      const result = await rpcClient.call('chat.getHistory', {});
      log('History: ' + JSON.stringify(result.messages), 'info');
    }
  </script>
</body>
</html>`;
  }
}
```

## Webview 端

```typescript
import { WebviewRpcClient } from 'vscode-webview-rpc';

const vscode = acquireVsCodeApi();
const rpcClient = new WebviewRpcClient(vscode, { debug: true });

rpcClient.setupMessageListener();

async function callExample() {
  try {
    const result = await rpcClient.call('chat.sendMessage', { 
      message: 'Hello from webview!' 
    });
    console.log('Response:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

function streamExample() {
  rpcClient.stream('chat.streamMessage', { 
    message: 'This is a streaming example' 
  }, {
    onChunk: (chunk) => {
      console.log('Received chunk:', chunk);
    },
    onComplete: () => {
      console.log('Stream completed');
    },
    onError: (error) => {
      console.error('Stream error:', error);
    }
  });
}
```

## 在 extension.ts 中注册

```typescript
import * as vscode from 'vscode';
import { ChatWebViewProvider } from './webview-provider';

export function activate(context: vscode.ExtensionContext) {
  const provider = new ChatWebViewProvider(context.extensionUri);
  
  const view = vscode.window.registerWebviewViewProvider(
    'chat.view',
    provider
  );
  
  context.subscriptions.push(view);
}
```

## 在 package.json 中添加配置

```json
{
  "contributes": {
    "viewsContainers": {
      "activitybar": [
        {
          "id": "chat-container",
          "title": "Chat",
          "icon": "assets/chat-icon.svg"
        }
      ]
    },
    "views": {
      "chat-container": [
        {
          "id": "chat.view",
          "name": "Chat",
          "type": "webview"
        }
      ]
    }
  }
}
```
