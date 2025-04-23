import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { chat, tags } from "./prompt";

let controller = new AbortController();

export class ChatViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // 处理来自 webview 的消息
    let startTime = Date.now();
    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case "loaded": {
          const loadTime = Date.now() - startTime;
          console.log(`[INFO] Webview loaded in ${loadTime}ms`);
          break;
        }
        case "tags": {
          tags((type: string, text: string) => {
            webviewView.webview.postMessage({ type, text });
          });
          break;
        }
        case "chat": {
          controller = new AbortController();
          chat(
            message.text,
            message.messages || [],
            message.model,
            (type: string, text: string) => {
              webviewView.webview.postMessage({ type, text });
            },
            controller
          );
          break;
        }
        case "stop": {
          controller.abort();
          break;
        }
        default:
          return;
      }
    });

    webviewView.onDidChangeVisibility(() => {
      console.log("[INFO] visible", webviewView.visible);
      if (webviewView.visible) {
        // 视图变为可见时执行的操作
        startTime = Date.now();
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // 获取依赖包

    

    const markedUri = webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this._extensionUri.fsPath, "assets/lib/js/marked.min.js")
      )
    );

    const highlightUri = webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this._extensionUri.fsPath, "assets/lib/js/highlight.min.js")
      )
    );

    const resetUri = webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this._extensionUri.fsPath, "assets/lib/css/reset.css")
      )
    );

    const oneDarkUri = webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this._extensionUri.fsPath, "assets/lib/css/atom-one-dark.min.css")
      )
    );

    const vscodeStyleUri = webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this._extensionUri.fsPath, "assets/lib/css/vscode.css")
      )
    );

    const markdownStyleUri = webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this._extensionUri.fsPath, "assets/lib/css/markdown.css")
      )
    );

    const mainStyleUri = webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this._extensionUri.fsPath, "assets/lib/css/style.css")
      )
    );

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this._extensionUri.fsPath, "assets/out/bundle.js")
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
    html = html.replace("{{markedUri}}", markedUri.toString());
    html = html.replace("{{highlightUri}}", highlightUri.toString());
    html = html.replace("{{scriptUri}}", scriptUri.toString());
  
    html = html.replace("{{resetUri}}", resetUri.toString());
    html = html.replace("{{oneDarkUri}}", oneDarkUri.toString());
    html = html.replace("{{vscodeStyleUri}}", vscodeStyleUri.toString());
    html = html.replace("{{markdownStyleUri}}", markdownStyleUri.toString());
    html = html.replace("{{styleUri}}", mainStyleUri.toString());

    return html;
  }

  // 添加一个公开的显示方法
  public show() {
    if (this._view) {
      this._view.show(true); // true 参数表示即使已可见也强制聚焦
    }
  }

  public isVisible() {
    return this._view?.visible;
  }

  public onSelection(type: string, text: string) {
    if (this._view) {
      this._view.webview.postMessage({ type, text });

    }
  }
}
