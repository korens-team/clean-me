// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
		console.log('Congratulations, your extension "helloworld" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.helloWorld', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Cleaner is ON!');

		const changeDecorationType = vscode.window.createTextEditorDecorationType({
			overviewRulerColor: 'blue',
			backgroundColor: '#0000FF',
			isWholeLine: true,
			color: 'white',
		});
	
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return; // No open text editor
		}
		
		function updateDecorations(ranges: any[]) {
			if (!editor) {
				return;
			}
			const changeDecoOpt: vscode.DecorationOptions[] = [];
			
			ranges.forEach((textRange) => {
					const decoration = { range: textRange.range, hoverMessage: textRange.description};
						changeDecoOpt.push(decoration);
					});
			
			editor.setDecorations(changeDecorationType, changeDecoOpt);
		}


		var editedText = "";
		var seperator = '//------------------------------------------------------------------';

		var deltas = [{description: "This is fun",start: 1, end: 3},
		{description: "HELOO ME",start: 4, end: 4},
		{description: "THIS is j=djs ds",start: 6, end: 7}];

		var lines = editor.document.getText().split("\n");

		var count = 0;
		var textRangeArr : any[]= [];
		
		deltas.forEach((index) => {
			lines.splice(index.start-1 + count,0,"/*" + index.description + "*/" + '\n' + seperator);
			count += 1;
			lines.splice(index.end + count,0,seperator);
			count += 1;				

		});

		lines.forEach((line) => {
			editedText += line +'\n';
		});

		var fullOriginalText = editor.document.getText();

		let options: Object = {
			content: fullOriginalText, // here the new text
			language: "javascript"
		  };

		  var firstLine = editor.document.lineAt(0);
		  var lastLine = editor.document.lineAt(editor.document.lineCount - 1);
		  var textRange = new vscode.Range(0, 
										   firstLine.range.start.character, 
										   editor.document.lineCount - 1, 
										   lastLine.range.end.character);

		  var temp = 2;
		  editor.edit(builder => builder.replace(textRange, editedText)).then(
			  function(){
				  deltas.forEach((index) => {
					  textRangeArr.push({range: new vscode.Range(index.start -1 + temp,
				  editor.document.lineAt(index.start -1 + temp).range.start.character, 
											   index.end - 1 + temp,
											   editor.document.lineAt(index.end -1 + temp).range.end.character),description: index.description});
			  temp += 3;			
		  });
			updateDecorations(textRangeArr);	
		}
		  );
		vscode.workspace.openTextDocument(options).then((doc) => {
			vscode.window.showTextDocument(doc,2);
		});
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
