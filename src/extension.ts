import * as vscode from "vscode";
import { ChatWebViewProvider } from "./ChatWebViewProvider";

// ====== AI 对话聊天 ======
function setupChatWebview(context: vscode.ExtensionContext) {
  const provider = new ChatWebViewProvider(context.extensionUri);
  const view = vscode.window.registerWebviewViewProvider("code-assist.view", provider);
  context.subscriptions.push(view);

  const openViewAndSendMessage = (type: string, text: string) => {
    if (provider.isVisible()) {
      return provider.onSelection(type, text);
    }
    vscode.commands.executeCommand("workbench.view.extension.chat-container");
    vscode.commands.executeCommand("code-assist.view.focus");
    setTimeout(() => {
      provider.onSelection(type, text);
    }, 1000);
  };

  const addCommand = (command: string) => {
    const disposable = vscode.commands.registerCommand(`codeAssist.${command}`, () => {
      const editor = vscode.window.activeTextEditor;
      const selection = editor?.document.getText(editor.selection) || "";
      openViewAndSendMessage(command, selection);
    });
    context.subscriptions.push(disposable);
  };
  ["chat","optimization","explanation","comment", "upgrade-class", "upgrade-vue", "upgrade-react","add-to-chat"].forEach(addCommand);
}

export function activate(context: vscode.ExtensionContext) {
  setupChatWebview(context);
}
