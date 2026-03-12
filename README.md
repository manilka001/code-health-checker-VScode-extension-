# 🩺 Code Health Checker

A lightweight VS Code extension designed to keep your codebase clean by detecting and helping you remove debug statements (`console.log`, `debugger`) before they reach production.



## 🚀 Features

- **Real-time Detection**: Automatically scans your code as you type to find `console.log` and `debugger` statements.
- **Visual Feedback**: 
  - **Inline Squiggles**: Highlights problematic lines with a warning.
  - **Dynamic Status Bar**: Displays a "Health Score" (count of debug statements) in the bottom right with a yellow warning background.
- **One-Click Quick Fix**: Hover over a warning to see a "Quick Fix" lightbulb that lets you delete the offending line instantly.

## 🛠️ Technical Implementation

### Architecture
- **Diagnostics API**: Used to create a `DiagnosticCollection` that syncs with the editor's lifecycle (`onDidOpenTextDocument`, `onDidChangeTextDocument`).
- **CodeActions Provider**: Implements a `QuickFix` provider that interacts with `WorkspaceEdit` to automate code removal.
- **Status Bar API**: Provides global state visibility regardless of where you are in the file.

### Build Tools
- **Language**: TypeScript
- **Bundler**: [esbuild](https://esbuild.github.io/) (for lightning-fast compilation)
- **Engine**: VS Code Extension API

## 💻 Local Development

### Prerequisites
- [Node.js](https://nodejs.org/) (v20+)
- [Visual Studio Code](https://code.visualstudio.com/)

### Installation
1. Clone the repository.
2. Run `npm install` to install dependencies.

### Running the Extension
1. Open the project in VS Code.
2. Compile the TypeScript:
   ```bash
   npm run compile