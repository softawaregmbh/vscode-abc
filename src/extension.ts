/// <reference path="../node_modules/@types/node/fs.d.ts" />

import * as vscode from 'vscode';
import * as abc from 'abc2svg/abc2svg-1';
import * as path from 'path';
import { Func } from 'mocha';
import { fstat } from 'fs';

export function activate(context: vscode.ExtensionContext) {

	const outputChannel = vscode.window.createOutputChannel('ABC Errors');

	// Preview command
	let showMusicCommand = vscode.commands.registerCommand('abc-music.showMusicsheet', () => {

		// webview panel for live preview
		const panel = vscode.window.createWebviewPanel(
			'musicSheet',
			'Music Sheet',
			vscode.ViewColumn.Beside,
			{
				enableScripts: true
			}
		);

		panel.webview.html = getWebviewContent(vscode.window.activeTextEditor?.document.getText() ?? '', context.extensionPath, outputChannel);
	
		// handle messages from the webview
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
		
		// refresh preview whenever the text changes
		vscode.workspace.onDidChangeTextDocument(eventArgs => {
			if (eventArgs.document.languageId == "abc") {
				panel.webview.html = getWebviewContent(eventArgs.document.getText(), context.extensionPath, outputChannel);
			}
		});
	});

	// Print command
	let printCommand = vscode.commands.registerCommand('abc-music.print', async () => {
		if (vscode.window.activeTextEditor?.document.isUntitled) {
			vscode.window.showInformationMessage('Please save document before printing.');
		}

		const html = getWebviewContent(vscode.window.activeTextEditor?.document.getText() ?? '', context.extensionPath, outputChannel, true);
		
		let fs = require("fs");
		let url = vscode.window.activeTextEditor?.document.fileName + '_print.html';
		fs.writeFileSync(url, html);

		url = url.replace('\\', '/');
		url = 'file:///' + url;
		await vscode.env.openExternal(vscode.Uri.parse(url));

	});

	context.subscriptions.push(showMusicCommand);
	context.subscriptions.push(printCommand);
}


function getWebviewContent(
	currentContent: string, 
	extensionPath: string, 
	outputChannel: vscode.OutputChannel, 
	print: boolean = false) {
	var svgContent = '';
	
	let abcEngine: any;
	let characterOffset: number = 0;

	var user = {
		img_out: function (str: any) {
			svgContent += str;
		},
		anno_stop: function(type: string, start: number, stop: number, x: number, y: number, w: number, h: number, s: any) {
			if (["beam", "slur", "tuplet"].indexOf(type) >= 0) {
				return;
			}

			// add offset of previous songs in the same file to start and stop
			start += characterOffset;
			stop += characterOffset;
			
			// create a rectangle as a clickable marker and add caret corresponding position as css class
			abcEngine.out_svg(`<rect class="selMarker _${start}-${stop}_" x="`);
			// out_sxsy translates x and y for correct positioning
			abcEngine.out_sxsy(x, '" y="', y);
			abcEngine.out_svg(`" width="${w.toFixed(2)}" height="${abcEngine.sh(h).toFixed(2)}"/>\n`);
		},
		imagesize: `width="100%" `,
		errbld: function(severityLevel:number, message: string, fileName: string, lineNumber: number, columnNumber: number) {
			outputChannel.appendLine(`Line ${lineNumber}, Column ${columnNumber}: ${message}`);
		}
	};

	abc.abc2svg.loadjs = function(scriptName: string, relay: any, fn2: any) {
		// Get path to resource on disk
		const url = vscode.Uri.file(path.join(extensionPath, 'node_modules', 'abc2svg', scriptName));
		
		let fs = require("fs");
		let moduleJavascript: string = fs.readFileSync(url.fsPath);

		// What now?

		vscode.window.showInformationMessage(`Loaded module ${scriptName}.`);
		return true;
	};

	let songsInFile: string[] = currentContent.split(new RegExp('(?=X:)', 'gm'));

	abcEngine = new abc.Abc(user);

	try {
		abcEngine.tosvg('song', '%%bgcolor white');
		songsInFile.forEach(element => {
			abc.abc2svg.modules.load(
				element, 
				function() {
				}, 
				function(errorMessage: string) {
					vscode.window.showErrorMessage(errorMessage);
				}
			);
			abcEngine.tosvg('song', element);
			characterOffset += element.length;
		});
	} catch (error) {
		vscode.window.showErrorMessage(error.message);
	}
	
	const printCommand = print ? 'window.onload = function() { window.print(); }' : '';

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
			${printCommand}

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

	while((currentCharacterCount + (lines[lineNumber - 1].length + 1)) <= start) {
		// add line length of current line number + add 1 (for \n)
		currentCharacterCount += (lines[lineNumber - 1].length + 1);
		lineNumber++;
	}

	let charactersBeforePosition = start-currentCharacterCount;

	let selectionLength = stop-start;
	editor.selection = new vscode.Selection(lineNumber - 1, charactersBeforePosition, lineNumber - 1, charactersBeforePosition+selectionLength);
	editor.revealRange(new vscode.Range(lineNumber, 0, lineNumber + 10, 0));

	vscode.window.activeTextEditor = editor;
}

// this method is called when your extension is deactivated
export function deactivate() {}
