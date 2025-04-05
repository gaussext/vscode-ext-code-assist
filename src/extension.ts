import * as vscode from "vscode";
import { ChatViewProvider } from "./ChatPanel";

export function activate(context: vscode.ExtensionContext) {
  const provider = new ChatViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("chatView", provider)
  );

  const disposable = vscode.commands.registerCommand(
    "code-assist.optimization",
    (e) => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const selection = editor.document.getText(editor.selection);
        provider.onSelection(selection);
      }
      vscode.commands.executeCommand('workbench.view.code-assisst.chatView');
      provider.show();
    }
  );

  context.subscriptions.push(disposable);
}
