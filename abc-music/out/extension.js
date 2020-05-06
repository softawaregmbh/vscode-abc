"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "abc-music" is now active!');
    let disposable = vscode.commands.registerCommand('abc-music.showMusicsheet', () => {
        var _a, _b;
        const panel = vscode.window.createWebviewPanel('musicSheet', 'Music Sheet', vscode.ViewColumn.Beside, {});
        panel.webview.html = getWebviewContent((_b = (_a = vscode.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document.getText()) !== null && _b !== void 0 ? _b : '');
        vscode.workspace.onDidChangeTextDocument(eventArgs => {
            if (eventArgs.document.languageId == "abc") {
                panel.webview.html = getWebviewContent(eventArgs.document.getText());
            }
        });
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function getWebviewContent(currentContent) {
    return `<!DOCTYPE html>
  <html lang="en">
  <head>
	  <meta charset="UTF-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <title>Cat Coding</title>
  </head>
  <body>
	  <div id="abctext">` + currentContent + `</div>
  </body>
  </html>`;
}
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map