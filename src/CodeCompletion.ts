import * as vscode from 'vscode';
import axios from 'axios';

const setting = vscode.workspace.getConfiguration('code-assist');
let controller = new AbortController();

function createRequestData(text: string) {
    return {
        model: "deepseek-chat",
        prompt: text,
        temperature: 0.2,
        max_tokens: 512
    };
}

export function getCodeContext(document?: vscode.TextDocument, position?: vscode.Position): string {
    const editor = vscode.window.activeTextEditor;
    if (!editor && !document) {
        vscode.window.showErrorMessage('No active editor');
        return '';
    }

    // 获取当前位置的前后 10 行代码
    const doc = document || editor!.document;
    const pos = position || editor!.selection.active;
    const currentLine = pos.line;
    const startLine = Math.max(0, currentLine - 10);
    const endLine = Math.min(doc.lineCount, currentLine + 10);
    let contextCode = '请根据我提供的前后 10 行代码，补全中间代码 \n';
    contextCode += '这是前 10 行代码\n';
    for (let i = startLine; i <= endLine; i++) {
        if (i < currentLine) {
            contextCode += doc.lineAt(i).text + '\n';
        } else if (i === currentLine) {
            contextCode += doc.lineAt(i).text + '\n';
            contextCode += '这是后 10 行代码\n';
        } else {
            contextCode += doc.lineAt(i).text + '\n';
        }
    }
    return contextCode;
}


export async function getAICompletion(context: string): Promise<string> {
    const TOKEN = setting.get("deepseek_token") || ""; // code-assist.deepseek_token
    if (!TOKEN) {
        vscode.window.showErrorMessage('请配置 code-assist.deepseek_token');
        return '';
    }
    try {
        controller.abort();
        controller = new AbortController();
        const data = createRequestData(context);
        const response = await axios.post('https://api.deepseek.com/beta/completions', data, {
            headers: {
                'Content-Type': 'application/json', 
                'Accept': 'application/json',
                Authorization: `Bearer ${TOKEN}`
            },
            signal: controller.signal
        });
        return response.data.choices[0].text;    
    } catch (error: any) {
        vscode.window.showErrorMessage('请求失败: ' + error.message);
        return '';
    }
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