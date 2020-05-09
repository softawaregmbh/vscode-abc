"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const abc = require("abc2svg/abc2svg-1");
function activate(context) {
    console.log('Congratulations, your extension "abc-music" is now active!');
    let disposable = vscode.commands.registerCommand('abc-music.showMusicsheet', () => {
        var _a, _b;
        const panel = vscode.window.createWebviewPanel('musicSheet', 'Music Sheet', vscode.ViewColumn.Beside, {
            enableScripts: true
        });
        panel.webview.html = getWebviewContent((_b = (_a = vscode.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document.getText()) !== null && _b !== void 0 ? _b : '');
        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'selection':
                    jumpToPosition(message.start, message.stop);
                    return;
            }
        }, undefined, context.subscriptions);
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
    var svgContent = '';
    let abcEngine;
    var user = {
        img_out: function (str) {
            svgContent += str;
        },
        anno_stop: function (type, start, stop, x, y, w, h, s) {
            if (["beam", "slur", "tuplet"].indexOf(type) >= 0) {
                return;
            }
            //syms[start] = s		// music symbol
            // create a rectangle as a clickable marker and add caret corresponding position as css class
            abcEngine.out_svg(`<rect class="selMarker _${start}-${stop}_" x="`);
            // out_sxsy translates x and y for correct positioning
            abcEngine.out_sxsy(x, '" y="', y);
            abcEngine.out_svg(`" width="${w.toFixed(2)}" height="${abcEngine.sh(h).toFixed(2)}"/>\n`);
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
	  	.selMarker {fill: #d00000; fill-opacity: 0; z-index: 15}
	  </style>	  
  </head>
  <body>
	${svgContent}


	<script type="text/javascript">
		(function() {
			const vscode = acquireVsCodeApi();
					
			document.addEventListener('click', function(e) {
				e = e || window.event;
				var target = e.target;   
				
				var element = event.target;
				var cssClass = element.getAttribute('class');
	
				if (cssClass && cssClass.substr(0, 9) == "selMarker") {
					var startStop = cssClass.slice(11, -1);
					var start = Number(startStop.substr(0, startStop.indexOf('-')));
					var stop = Number(startStop.substr(startStop.indexOf('-') + 1));
					
					vscode.postMessage({
						command: 'selection',
						start: start,
						stop: stop
					});
				}
			}, false);
		}())

	  </script>
  </body>
  </html>`;
}
function jumpToPosition(start, stop) {
    var _a;
    if (((_a = vscode.window.visibleTextEditors) === null || _a === void 0 ? void 0 : _a.length) != 1) {
        return;
    }
    const editor = vscode.window.visibleTextEditors[0];
    const currentContent = editor.document.getText();
    const lines = currentContent === null || currentContent === void 0 ? void 0 : currentContent.split('\n');
    let lineNumber = 1;
    let currentCharacterCount = 0;
    while ((currentCharacterCount + (lines[lineNumber - 1].length + 1)) < start) {
        // add line length of current line number + add 1 (for \n)
        currentCharacterCount += (lines[lineNumber - 1].length + 1);
        lineNumber++;
    }
    let charactersBeforePosition = start - currentCharacterCount;
    let selectionLength = stop - start;
    editor.selection = new vscode.Selection(lineNumber - 1, charactersBeforePosition, lineNumber - 1, charactersBeforePosition + selectionLength);
    vscode.window.activeTextEditor = editor;
}
exports.jumpToPosition = jumpToPosition;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map