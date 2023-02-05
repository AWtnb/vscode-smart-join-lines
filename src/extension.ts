import * as vscode from "vscode";

const isASCII = (s: string): boolean => {
  return Boolean(s.match(/[\x00-\x7f]/));
};

const joinLines = (ss: string[]): string => {
  return ss.reduce((accum, cur) => {
    if (accum.length < 1) {
      return cur.trimEnd();
    }
    const line = cur.trim();
    const accumTail = accum.slice(-1);
    if (accumTail == "-") {
      return accum.substring(0, accum.length - 1) + line;
    }
    if (isASCII(accumTail) || isASCII(line.charAt(0))) {
      return accum + " " + line;
    }
    return accum + line;
  }, "");
};

const getRange = (editor: vscode.TextEditor, sel: vscode.Selection): vscode.Range => {
  const cursor = sel.active;
  const start = new vscode.Position(cursor.line, 0);
  const endLine = Math.min(editor.document.lineCount - 1, cursor.line + 1);
  const end = new vscode.Position(endLine, editor.document.lineAt(endLine).text.length);
  return new vscode.Range(start, end);
};

const formatSelections = (editor: vscode.TextEditor) => {
  editor.edit((editBuilder) => {
    editor.selections
      .map((sel) => {
        if (sel.isSingleLine) {
          return getRange(editor, sel);
        }
        return sel;
      })
      .forEach((target) => {
        const text = editor.document.getText(target);
        const linebreak = editor.document.eol == 1 ? "\n" : "\r\n";
        const newText = joinLines(text.split(linebreak));
        if (text != newText) {
          editBuilder.replace(target, newText);
        }
      });
  });
};

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand("smartJoinLines.join", (editor: vscode.TextEditor) => {
      formatSelections(editor);
    })
  );
}

export function deactivate() {}
