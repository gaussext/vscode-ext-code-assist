import * as vscode from "vscode";
import { ChatPanel } from "./ChatPanel";

export function activate(context: vscode.ExtensionContext) {
  // 注册命令来打开聊天窗口
  const disposable = vscode.commands.registerCommand(
    "code-assist.openChat",
    () => {
      ChatPanel.createOrShow(context.extensionUri);
    }
  );

  context.subscriptions.push(disposable);

  // 注册视图提供程序
  const provider = ChatPanel.createOrShow(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("chatView", provider)
  );

  // 如果已经恢复了聊天面板，则重新创建
  if (vscode.window.registerWebviewPanelSerializer) {
    vscode.window.registerWebviewPanelSerializer(ChatPanel.viewType, {
      async deserializeWebviewPanel(
        webviewPanel: vscode.WebviewPanel,
        state: any
      ) {
        ChatPanel.revive(webviewPanel, context.extensionUri);
      },
    });
  }
}
