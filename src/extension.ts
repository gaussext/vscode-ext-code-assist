import * as vscode from "vscode";
import { ChatWebViewProvider } from "./ChatWebViewProvider";
import { getAICompletion, getCodeContext, insertCompletion } from "./CodeCompletion";

// ====== AI 对话聊天 ======
function setupChatWebview(context: vscode.ExtensionContext) {
  const provider = new ChatWebViewProvider(context.extensionUri);
  const view = vscode.window.registerWebviewViewProvider(
    "code-assist.view",
    provider
  );
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

  const chat = vscode.commands.registerCommand(
    "codeAssist.chat",
    () => {
      openViewAndSendMessage("chat", '');
    }
  );

  const optimization = vscode.commands.registerCommand(
    "codeAssist.optimization",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const selection = editor.document.getText(editor.selection);
        openViewAndSendMessage("optimization", selection);
      }
    }
  );

  const explanation = vscode.commands.registerCommand(
    "codeAssist.explanation",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const selection = editor.document.getText(editor.selection);
        openViewAndSendMessage("explanation", selection);
      }
    }
  );

  context.subscriptions.push(chat, optimization, explanation);
}

// ====== AI 自动补全 ======
function setupAutoComplete(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('codeAssist.complete', async () => {
    try {
      const contextCode = getCodeContext();
      if (!contextCode) {
        vscode.window.showInformationMessage(`AI 补全需要提示`);
        return;
      }
      vscode.window.showInformationMessage(`AI 补全中，请稍等`);
      const suggestions = await getAICompletion(contextCode);
      vscode.window.showInformationMessage(`AI 补全完成`);

      insertCompletion(suggestions);

    } catch (error) {
      vscode.window.showErrorMessage(`AI补全失败: ${error}`);
    }
  });

  context.subscriptions.push(disposable);
}

export function activate(context: vscode.ExtensionContext) {
  setupChatWebview(context);
  setupAutoComplete(context);
}
