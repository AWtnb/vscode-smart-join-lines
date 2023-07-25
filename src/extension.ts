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

const toLineRange = (editor: vscode.TextEditor, sel: vscode.Selection): vscode.Range => {
  const cursor = sel.active;
  const start = new vscode.Position(cursor.line, 0);
  const endLine = Math.min(editor.document.lineCount - 1, cursor.line + 1);
  const end = new vscode.Position(endLine, editor.document.lineAt(endLine).text.length);
  return new vscode.Range(start, end);
};

const getUniqueRanges = (ranges: vscode.Range[]): vscode.Range[] => {
  const sortedRanges = ranges.sort((a, b) => {
    if (a.start.isBefore(b.start)) {
      return -1;
    }
    if (a.start.isAfter(b.start)) {
      return 1;
    }
    return 0;
  });
  const stack: vscode.Range[] = [];
  for (let i = 0; i < sortedRanges.length; i++) {
    const range = sortedRanges[i];
    if (i == 0) {
      stack.push(range);
      continue;
    }
    const last = sortedRanges[i - 1];
    if (range.intersection(last)) {
      continue;
    }
    stack.push(range);
  }
  return stack;
};

const formatSelections = (editor: vscode.TextEditor) => {
  editor.edit((editBuilder) => {
    const sels = editor.selections.map((sel) => {
      if (sel.isSingleLine) {
        return toLineRange(editor, sel);
      }
      return sel;
    });
    getUniqueRanges(sels).forEach((target) => {
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
