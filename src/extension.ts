import * as vscode from "vscode";

const isASCII = (s: string): boolean => {
  return Boolean(s.match(/[\x00-\x7f]/));
};

const joinLines = (ss: string[]): string => {
  return ss.reduce((joined: string, cur: string) => {
    if (joined.length < 1) {
      return cur.trimEnd();
    }
    const line = cur.trim();
    const lastChar = joined.slice(-1);
    if (lastChar == "-") {
      const l = joined.substring(0, joined.length - 1);
      if (l.slice(-1).match(/\d/)) {
        return joined + line;
      }
      return l + line;
    }
    if (isASCII(lastChar) || isASCII(line.charAt(0))) {
      return joined + " " + line;
    }
    return joined + line;
  }, "");
};

const toLineRange = (editor: vscode.TextEditor, sel: vscode.Selection): vscode.Range => {
  const cursor = sel.active;
  const start = new vscode.Position(cursor.line, 0);
  const nextLine = Math.min(cursor.line + 1, editor.document.lineCount - 1);
  const end = new vscode.Position(nextLine, editor.document.lineAt(nextLine).text.length);
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
  const linebreak = editor.document.eol == vscode.EndOfLine.LF ? "\n" : "\r\n";
  const workspaceEdit = new vscode.WorkspaceEdit();

  const sels: vscode.Range[] = editor.selections.map((sel) => {
    if (sel.isSingleLine) {
      return toLineRange(editor, sel);
    }
    return sel;
  });

  getUniqueRanges(sels).forEach((range) => {
    const text = editor.document.getText(range);
    workspaceEdit.replace(editor.document.uri, range, joinLines(text.split(linebreak)));
  });

  vscode.workspace.applyEdit(workspaceEdit);
};

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand("smartJoinLines.join", (editor: vscode.TextEditor) => {
      formatSelections(editor);
    })
  );
}

export function deactivate() {}
