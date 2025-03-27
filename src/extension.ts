import * as vscode from "vscode";
import { ChatViewProvider } from "./ChatPanel";

export function activate(context: vscode.ExtensionContext) {
  const provider = new ChatViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("chatView", provider)
  );
}
