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
    let abcEngine;
    var user = {
        img_out: function (str) {
            result += str;
        },
        anno_stop: function (type, start, stop, x, y, w, h, s) {
            if (["beam", "slur", "tuplet"].indexOf(type) >= 0) {
                return;
            }
            //syms[start] = s		// music symbol
            // create a rectangle
            abcEngine.out_svg(`<rect class="abcr _${start}_" x="${x}" y="${y}" width="${w.toFixed(2)}" height="${abcEngine.sh(h).toFixed(2)}"/>\n`);
        },
    };
    abcEngine = new abc.Abc(user);
    abcEngine.tosvg('filename', '%%bgcolor white');
    abcEngine.tosvg('filename', currentContent);
    return `<!DOCTYPE html>
  <html lang="en">
  <head>
	  <meta charset="UTF-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <title>ABC Music Sheet</title>
	  <style type="text/css">
	  .abcr {fill: #d00000; fill-opacity: 0; z-index: 15}
	  </style>
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