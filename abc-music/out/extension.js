"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const abc = require("abc2svg/abc2svg-1");
function activate(context) {
    console.log('Congratulations, your extension "abc-music" is now active!');
    let disposable = vscode.commands.registerCommand('abc-music.showMusicsheet', () => {
        var _a, _b;
        const panel = vscode.window.createWebviewPanel('musicSheet', 'Music Sheet', vscode.ViewColumn.Beside, {});
        panel.webview.html = getWebviewContent((_b = (_a = vscode.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document.getText()) !== null && _b !== void 0 ? _b : '');
        // vscode.window.showOpenDialog
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
    var result = '';
    var user = {
        img_out: function (str) {
            result += str;
        }
    };
    var abcEngine = new abc.Abc(user);
    abcEngine.tosvg('filename', '%%bgcolor white');
    abcEngine.tosvg('filename', currentContent);
    return `<!DOCTYPE html>
  <html lang="en">
  <head>
	  <meta charset="UTF-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <title>ABC Music Sheet</title>
  </head>
  <body>
	  ` + result + `
  </body>
  </html>`;
}
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map