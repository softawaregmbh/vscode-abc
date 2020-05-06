// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "abc-music" is now active!');

	let disposable = vscode.commands.registerCommand('abc-music.showMusicsheet', () => {

		const panel = vscode.window.createWebviewPanel(
			'musicSheet',
			'Music Sheet',
			vscode.ViewColumn.Beside,
			{} 
		);

		panel.webview.html = getWebviewContent(vscode.window.activeTextEditor?.document.getText() ?? '');
	
		vscode.workspace.onDidChangeTextDocument(eventArgs => {
			if (eventArgs.document.languageId == "abc") {
				panel.webview.html = getWebviewContent(eventArgs.document.getText());
			}
		});
	});

	context.subscriptions.push(disposable);
}


function getWebviewContent(currentContent: string) {
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
export function deactivate() {}
