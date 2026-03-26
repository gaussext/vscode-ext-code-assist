import * as vscode from 'vscode';
import { WebviewRpcServer } from 'vscode-webview-rpc';

export function activate(context: vscode.ExtensionContext) {
  console.log('vscode-webview-rpc extension is now active!');

  const disposable = vscode.commands.registerCommand('vscode-webview-rpc.hello', () => {
    vscode.window.showInformationMessage('Hello World from vscode-webview-rpc!');
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
