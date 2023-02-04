import * as vscode from "vscode";

const isASCII = (s: string): boolean => {
  return Boolean(s.match(/[\x00-\x7f]/));
};

const joinLines = (s: string, linebreak: string): string => {
  return s.split(linebreak).reduce((accum, cur) => {
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

const formatSelections = (editor: vscode.TextEditor) => {
  editor.edit((editBuilder) => {
    editor.selections
      .filter((sel) => !sel.isEmpty)
      .forEach((sel) => {
        if (sel.isSingleLine) {
          return;
        }
        const text = editor.document.getText(sel);
        const linebreak = editor.document.eol == 1 ? "\n" : "\r\n";
        const newText = joinLines(text, linebreak);
        if (text != newText) {
          editBuilder.replace(sel, newText);
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
