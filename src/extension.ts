import * as vscode from "vscode";

/**
 * Entry point: This runs once when your extension is activated.
 * We use this to set up listeners and register our tools.
 */
export function activate(context: vscode.ExtensionContext) {
  // 1. Create a "container" for our warnings. VS Code manages the UI for these.
  const diagnosticCollection =
    vscode.languages.createDiagnosticCollection("healthBuddy");
  context.subscriptions.push(diagnosticCollection);

  // 2. Register the Quick Fix feature. The '*' means it works on all file types.
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider("*", new LogFixer(), {
      providedCodeActionKinds: [vscode.CodeActionKind.QuickFix],
    }),
  );

  // 3. Watch for file events: when opened, changed, or closed.
  // This ensures our warnings are always up-to-date.
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((doc) =>
      refreshDiagnostics(doc, diagnosticCollection),
    ),
    vscode.workspace.onDidChangeTextDocument((e) =>
      refreshDiagnostics(e.document, diagnosticCollection),
    ),
    vscode.workspace.onDidCloseTextDocument((doc) =>
      diagnosticCollection.delete(doc.uri),
    ),
  );

  // If a file is already open when the extension starts, scan it immediately.
  if (vscode.window.activeTextEditor) {
    refreshDiagnostics(
      vscode.window.activeTextEditor.document,
      diagnosticCollection,
    );
  }

  // 4. Create the Status Bar Item in the bottom-right corner.
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );
  context.subscriptions.push(statusBarItem);

  // Update the status bar whenever the user switches files or types.
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(() =>
      updateStatusBar(statusBarItem),
    ),
  );
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(() =>
      updateStatusBar(statusBarItem),
    ),
  );

  /**
   * Logic to calculate and display the 'Health Score' in the status bar.
   */
  function updateStatusBar(item: vscode.StatusBarItem) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      item.hide(); // Hide if no file is open
      return;
    }

    const text = editor.document.getText();
    // Regex search for console.log or debugger statements
    const count = (text.match(/console\.log|debugger/g) || []).length;

    if (count > 0) {
      item.text = `$(warning) Debug Statements: ${count}`;
      item.backgroundColor = new vscode.ThemeColor(
        "statusBarItem.warningBackground",
      );
      item.show();
    } else {
      item.hide(); // Keep it clean if the file is healthy
    }
  }
}

/**
 * Scans the document line-by-line to find forbidden debug statements.
 * This is the "Engine" of your extension.
 */
export function refreshDiagnostics(
  doc: vscode.TextDocument,
  diagnosticCollection: vscode.DiagnosticCollection,
): void {
  const diagnostics: vscode.Diagnostic[] = [];

  for (let lineIndex = 0; lineIndex < doc.lineCount; lineIndex++) {
    const lineOfText = doc.lineAt(lineIndex);

    // Check if the current line contains our target keywords
    if (
      lineOfText.text.includes("console.log") ||
      lineOfText.text.includes("debugger")
    ) {
      // Define exactly where the squiggle should appear
      const range = new vscode.Range(
        lineIndex,
        0,
        lineIndex,
        lineOfText.text.length,
      );

      const diagnostic = new vscode.Diagnostic(
        range,
        "Clean up: Remove debug statements before committing!",
        vscode.DiagnosticSeverity.Warning,
      );

      // This 'code' acts as an ID to link this warning to our Quick Fix provider
      diagnostic.code = "debug_cleanup";
      diagnostics.push(diagnostic);
    }
  }
  // Update the UI with the found warnings
  diagnosticCollection.set(doc.uri, diagnostics);
}

/**
 * Provider class that handles the "Quick Fix" (lightbulb) menu.
 */
export class LogFixer implements vscode.CodeActionProvider {
  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
  ): vscode.CodeAction[] {
    // Only suggest a fix if the warning was created by our 'debug_cleanup' logic
    return context.diagnostics
      .filter((diagnostic) => diagnostic.code === "debug_cleanup")
      .map((diagnostic) => this.createFix(document, diagnostic));
  }

  /**
   * Creates the actual workspace edit that deletes the line.
   */
  private createFix(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic,
  ): vscode.CodeAction {
    const fix = new vscode.CodeAction(
      `Remove this debug line`,
      vscode.CodeActionKind.QuickFix,
    );
    fix.edit = new vscode.WorkspaceEdit();

    // Define the range of the entire line (from start of line to start of next line)
    const lineRange = new vscode.Range(
      diagnostic.range.start.line,
      0,
      diagnostic.range.start.line + 1,
      0,
    );
    fix.edit.delete(document.uri, lineRange);

    return fix;
  }
}

// Called when your extension is disabled or VS Code is closed.
export function deactivate() {}
