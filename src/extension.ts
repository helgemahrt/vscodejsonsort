// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { stringify } from 'querystring';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('extension.jsonsort.desc', async () => {
		return sort(true);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('extension.jsonsort.asc', async () => {
		return sort(false);
	}));
}
async function sort(desc: boolean) {
	if (!vscode.window.activeTextEditor) {
		return; // no editor
	}
	let { document } = vscode.window.activeTextEditor;
	if (document.languageId !== 'json') {
		return; // not my scheme
	}
	
	// find JSON object in first line to extract schema
	let firstLine = document.lineAt(0);
	let objectStart = firstLine.text.indexOf("{");
	if (objectStart === -1) {
		vscode.window.showErrorMessage('No JSON object found in first line.');
		return;
	}

	let objectEnd = firstLine.text.lastIndexOf("}");
	if (objectEnd === -1) {
		vscode.window.showErrorMessage('JSON object not closed in first line');
		return;
	}

	let jsonText = firstLine.text.substr(objectStart, objectEnd - objectStart + 1);
	let jsonObject = JSON.parse(jsonText);

	let properties: string[] = [];
	Object.keys(jsonObject).forEach((key, value) => {
		properties.push(key);
	});

	// let user pick property for sorting
	let propertyForSorting = await vscode.window.showQuickPick(properties, { canPickMany: false, placeHolder: 'Select the sort property'});
	if (propertyForSorting) {

		// assembly a line dictionary for sorting
		var lines: { [key:string]: string } = {};
		for (var i = 0; i < document.lineCount; ++i) {
			let currentLine = document.lineAt(i);

			let key = getSortKeyFromJSONObject(currentLine.text, propertyForSorting);
			if (key) {
				lines[key] = currentLine.text;
			}
		}

		let keys = Object.keys(lines);
		keys.sort();
		if (desc) {
			keys.reverse();
		}

		// construct the new content for the document
		let newContent: string = '';
		keys.forEach(key => {
			newContent += lines[key] + '\n';
		});

		// edit the document
		const edit = new vscode.WorkspaceEdit();

		let lastLine = document.lineAt(document.lineCount - 1);
		let documentRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
		edit.replace(document.uri, documentRange, newContent);
		return vscode.workspace.applyEdit(edit);
	}
}

function getSortKeyFromJSONObject(line: string, propertyName: string): string | undefined {
	let objectStart = line.indexOf("{");
	if (objectStart === -1) {
		return undefined;
	}

	let objectEnd = line.lastIndexOf("}");
	if (objectEnd === -1) {
		return undefined;
	}

	let jsonText = line.substr(objectStart, objectEnd - objectStart + 1);
	let jsonObject = JSON.parse(jsonText);

	return jsonObject[propertyName];
}

// this method is called when your extension is deactivated
export function deactivate() {}
