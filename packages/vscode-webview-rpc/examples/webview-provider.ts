import * as vscode from 'vscode';
import { WebviewPanel, WebviewViewProvider, WebviewView } from 'vscode';
import { WebviewRpcServer } from 'vscode-webview-rpc';

export class ExampleWebviewProvider implements WebviewViewProvider {
  private rpcServer: WebviewRpcServer;

  constructor(private extensionUri: vscode.Uri) {
    this.rpcServer = new WebviewRpcServer(null, { debug: true });
    this.registerHandlers();
  }

  resolveWebviewView(webviewView: WebviewView) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    this.rpcServer = new WebviewRpcServer(webviewView.webview, { debug: true });
    this.registerHandlers();
  }

  private registerHandlers() {
    this.rpcServer.registerHandlers('example', {
      async hello(params: { name: string }) {
        return { message: `Hello, ${params.name}!` };
      },

      async echo(params: { text: string }) {
        return { echo: params.text };
      },

      async streamData(params: { count: number }, stream) {
        for (let i = 0; i < params.count; i++) {
          stream.write({ index: i, data: `Item ${i}` });
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        stream.complete();
      },
    });
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RPC Example</title>
</head>
<body>
  <h1>VS Code Webview RPC Example</h1>
  <div id="output"></div>
  <script>
    const vscode = acquireVsCodeApi();
    const output = document.getElementById('output');

    function log(message) {
      const div = document.createElement('div');
      div.textContent = message;
      output.appendChild(div);
    }

    async function testHello() {
      log('Testing hello...');
      const result = await rpcClient.call('example.hello', { name: 'World' });
      log('Response: ' + JSON.stringify(result));
    }

    async function testEcho() {
      log('Testing echo...');
      const result = await rpcClient.call('example.echo', { text: 'Hello RPC' });
      log('Response: ' + JSON.stringify(result));
    }

    async function testStream() {
      log('Testing stream...');
      rpcClient.stream('example.streamData', { count: 5 }, {
        onChunk: (chunk) => log('Stream chunk: ' + JSON.stringify(chunk)),
        onComplete: () => log('Stream completed'),
        onError: (error) => log('Stream error: ' + error.message)
      });
    }

    log('RPC Client initialized');
  </script>
</body>
</html>`;
  }
}
