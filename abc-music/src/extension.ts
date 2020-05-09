import * as vscode from 'vscode';
import * as abc from 'abc2svg/abc2svg-1';

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('abc-music.showMusicsheet', () => {

		const panel = vscode.window.createWebviewPanel(
			'musicSheet',
			'Music Sheet',
			vscode.ViewColumn.Beside,
			{
				enableScripts: true
			}
		);

		panel.webview.html = getWebviewContent(vscode.window.activeTextEditor?.document.getText() ?? '');
	
		panel.webview.onDidReceiveMessage(
			message => {
			  
			  switch (message.command) {
				case 'selection':
				  jumpToPosition(message.start, message.stop);
				  return;
			  }
			},
			undefined,
			context.subscriptions
		);
		
		vscode.workspace.onDidChangeTextDocument(eventArgs => {
			if (eventArgs.document.languageId == "abc") {
				panel.webview.html = getWebviewContent(eventArgs.document.getText());
			}
		});
	});

	context.subscriptions.push(disposable);
}


function getWebviewContent(currentContent: string) {
	var svgContent = '';

	let abcEngine: any;

	var user = {
		img_out: function (str: any) {
			svgContent += str;
		},
		anno_stop: function(type: string, start: number, stop: number, x: number, y: number, w: number, h: number, s: any) {
			if (["beam", "slur", "tuplet"].indexOf(type) >= 0) {
				return;
			}
			
			// create a rectangle as a clickable marker and add caret corresponding position as css class
			abcEngine.out_svg(`<rect class="selMarker _${start}-${stop}_" x="`);
			// out_sxsy translates x and y for correct positioning
			abcEngine.out_sxsy(x, '" y="', y);
			abcEngine.out_svg(`" width="${w.toFixed(2)}" height="${abcEngine.sh(h).toFixed(2)}"/>\n`);
		},
		imagesize: `width="100%" `
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

export function jumpToPosition(start: number, stop: number) {
	if (vscode.window.visibleTextEditors?.length != 1) {
		return;
	}

	const editor = vscode.window.visibleTextEditors[0];

	const currentContent:string = editor.document.getText();
	const lines:string[] = currentContent?.split('\n');
	let lineNumber: number = 1;
	
	let currentCharacterCount: number = 0;

	while((currentCharacterCount + (lines[lineNumber - 1].length + 1)) < start) {
		// add line length of current line number + add 1 (for \n)
		currentCharacterCount += (lines[lineNumber - 1].length + 1);
		lineNumber++;
	}

	let charactersBeforePosition = start-currentCharacterCount;

	let selectionLength = stop-start;
	editor.selection = new vscode.Selection(lineNumber - 1, charactersBeforePosition, lineNumber - 1, charactersBeforePosition+selectionLength);
	
	vscode.window.activeTextEditor = editor;
}

// this method is called when your extension is deactivated
export function deactivate() {}
