import * as vscode from "vscode";
import { ChatViewProvider } from "./ChatPanel";

export function activate(context: vscode.ExtensionContext) {
  const provider = new ChatViewProvider(context.extensionUri);
  const view = vscode.window.registerWebviewViewProvider("chatView", provider);
  context.subscriptions.push(view);

  const optimization = vscode.commands.registerCommand(
    "codeAssist.optimization",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const selection = editor.document.getText(editor.selection);
        provider.onSelection('optimization', selection);
      }
    }
  );

  const explanation = vscode.commands.registerCommand(
    "codeAssist.explanation",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const selection = editor.document.getText(editor.selection);
        provider.onSelection('explanation', selection);
      }
    }
  );

  context.subscriptions.push(optimization, explanation);
}
