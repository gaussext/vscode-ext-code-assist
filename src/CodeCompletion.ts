import * as vscode from 'vscode';
import axios from 'axios';

const setting = vscode.workspace.getConfiguration('code-assist');

export function getCodeContext(document?: vscode.TextDocument, position?: vscode.Position): string {
    const editor = vscode.window.activeTextEditor;
    if (!editor && !document) {
        vscode.window.showErrorMessage('No active editor');
        return '';
    }

    const doc = document || editor!.document;
    const pos = position || editor!.selection.active;
    const lineNumber = pos.line;
    const startLine = Math.max(0, lineNumber - 10);
    let contextCode = '';
    for (let i = startLine; i <= lineNumber; i++) {
        contextCode += doc.lineAt(i).text + '\n';
    }

    return contextCode;
}

function createRequestData(text: string) {
    return {
        "model": "deepseek-chat",
        "prompt": text
    };
}

export async function getAICompletion(context: string): Promise<string> {
    const TOKEN = setting.get("deepseek_token") || ""; // code-assist.deepseek_token
    if (!TOKEN) {
        vscode.window.showErrorMessage('请配置 code-assist.deepseek_token');
        return '';
    }
    const data = createRequestData(context);
    const response = await axios.post('https://api.deepseek.com/beta/completions', data, {
        headers: {
            'Content-Type': 'application/json', 
            'Accept': 'application/json',
            Authorization: `Bearer ${TOKEN}`
        },
    });
    return response.data.choices[0].text;
}

export function insertCompletion(text: string) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    editor.edit(editBuilder => {
        editBuilder.insert(editor.selection.active, text);
    });
}