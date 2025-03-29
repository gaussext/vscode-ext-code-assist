import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { chat, tags } from "./prompt";

export class ChatViewProvider implements vscode.WebviewViewProvider {
  constructor(private readonly _extensionUri: vscode.Uri) { }

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };
    
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // 处理来自 webview 的消息
    webviewView.webview.onDidReceiveMessage(async (message) => {      
      switch (message.command) {
        case "tags": {
          console.log("tags", message);
          tags((type: string, text: string) => {
            webviewView.webview.postMessage({ type, text });
          });
          break;
        }
        case "chat": {
          console.log("chat", message);
          chat(
            message.text,
            message.oldMessage,
            message.model,
            (type: string, text: string) => {
              webviewView.webview.postMessage({ type, text });
            }
          );
          break;
        }

        default:
          return;
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // 获取本地脚本和样式表的 URI
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this._extensionUri.fsPath, "assets", "script.js")
      )
    );

    const styleUri = webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this._extensionUri.fsPath, "assets", "style.css")
      )
    );

    // 读取 HTML 模板文件
    const htmlPath = path.join(
      this._extensionUri.fsPath,
      "assets",
      "index.html"
    );
    let html = fs.readFileSync(htmlPath, "utf-8");

    // 替换占位符
    html = html.replace("{{scriptUri}}", scriptUri.toString());
    html = html.replace("{{styleUri}}", styleUri.toString());

    return html;
  }
}
