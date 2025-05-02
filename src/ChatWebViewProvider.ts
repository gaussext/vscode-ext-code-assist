import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

const setting = vscode.workspace.getConfiguration('code-assist');

export class ChatWebViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const markedUri = webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this._extensionUri.fsPath, "dist-web/js/marked.min.js")
      )
    );

    const highlightUri = webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this._extensionUri.fsPath, "dist-web/js/highlight.min.js")
      )
    );

    const resetUri = webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this._extensionUri.fsPath, "dist-web/css/reset.css")
      )
    );

    const oneDarkUri = webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this._extensionUri.fsPath, "dist-web/css/atom-one-dark.min.css")
      )
    );

    const vscodeStyleUri = webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this._extensionUri.fsPath, "dist-web/css/vscode.css")
      )
    );

    const markdownStyleUri = webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this._extensionUri.fsPath, "dist-web/css/markdown.css")
      )
    );

    const mainStyleUri = webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this._extensionUri.fsPath, "dist-web/css/style.css")
      )
    );

    const appUri = webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this._extensionUri.fsPath, "dist-web/js/app.js")
      )
    );

    const vendorsUri = webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this._extensionUri.fsPath, "dist-web/js/chunk-vendors.js")
      )
    );

    // 读取 HTML 模板文件
    const htmlPath = path.join(
      this._extensionUri.fsPath,
      "dist-web",
      "index.html"
    );
    let html = fs.readFileSync(htmlPath, "utf-8");

    // 替换占位符
    
    html = html.replace("Object.entries({})", `Object.entries(${JSON.stringify(setting)})`);
    html = html.replace("./js/highlight.min.js", markedUri.toString());
    html = html.replace("./js/marked.min.js", highlightUri.toString());

    html = html.replace("./css/reset.css", resetUri.toString());
    html = html.replace("./css/atom-one-dark.min.css", oneDarkUri.toString());
    html = html.replace("./css/vscode.css", vscodeStyleUri.toString());
    html = html.replace("./css/markdown.css", markdownStyleUri.toString());
    html = html.replace("./css/style.css", mainStyleUri.toString());

    html = html.replace("/js/app.js", appUri.toString());
    html = html.replace("/js/chunk-vendors.js", vendorsUri.toString());
    
    return html;
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
