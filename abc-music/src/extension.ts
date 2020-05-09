import * as vscode from 'vscode';
import * as abc from 'abc2svg/abc2svg-1';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "abc-music" is now active!');

	let disposable = vscode.commands.registerCommand('abc-music.showMusicsheet', () => {

		const panel = vscode.window.createWebviewPanel(
			'musicSheet',
			'Music Sheet',
			vscode.ViewColumn.Beside,
			{} 
		);

		panel.webview.html = getWebviewContent(vscode.window.activeTextEditor?.document.getText() ?? '');
	
		// vscode.window.showOpenDialog

		vscode.workspace.onDidChangeTextDocument(eventArgs => {
			if (eventArgs.document.languageId == "abc") {
				panel.webview.html = getWebviewContent(eventArgs.document.getText());
			}
		});
	});

	context.subscriptions.push(disposable);
}


function getWebviewContent(currentContent: string) {
	var result = '';

	let abcEngine: any;

	var user = {
		img_out: function (str: any) {
			result += str;
		},
		anno_stop: function(type: string, start: number, stop: number, x: number, y: number, w: number, h: number, s: any) {
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
export function deactivate() {}
