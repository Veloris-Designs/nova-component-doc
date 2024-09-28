import * as vscode from "vscode"

// const commentTemplate =
//   '<!-- @PopDoc \n ### Component Name \n This is a short description of how to use the component. \n \n ### Props \n - example list of props \n \n ### Emits \n - example list of events \n \n ### Slots \n - example list of slots \n \n ### Examples \n ```vue \n<template>\n <div>Test</div> \n</template> \n ``` \n \n --> \n';

export const createPopDocComment = () => {
    return vscode.commands.registerCommand("nuxtcomponentpopdoc.createPopDocComment", () => {
        // Retrieving settings here to ensure that changes to settings are reflected in the extension.
        // Get commentTemplate from settings
        const commentTemplate = vscode.workspace
            .getConfiguration("nuxtcomponentpopdoc")
            .get("commentTemplate") as string

        const editor = vscode.window.activeTextEditor

        if (!editor) {
            return
        }

        // Check the current file is a vue file
        if (editor.document.languageId !== "vue") {
            vscode.window.showErrorMessage(
                "Nuxt Component Pop Doc: Please open a vue file to use this command."
            )
            return
        }

        const selection = editor.selection
        editor
            .edit((editBuilder) => {
                editBuilder.replace(selection, commentTemplate)
            })
            .then(() => {
                // Select the text on line 2, starting at char 5 and ending at char 19
                const line2 = new vscode.Position(1, 5)
                const line2End = new vscode.Position(1, 19)

                // Create a new selection
                const newSelection = new vscode.Selection(line2, line2End)

                // And finally, set the new selection
                editor.selection = newSelection
            })
    })
}

export const watchForPopDocCommentKeypress = () => {
    return vscode.workspace.onDidChangeTextDocument((event) => {
        const commentInsertKeys = vscode.workspace
            .getConfiguration("nuxtcomponentpopdoc")
            .get("commentInsertKeys") as string

        const editor = vscode.window.activeTextEditor
        if (!editor) {
            return
        }

        const document = editor.document
        const selection = editor.selection
        const line = document.lineAt(selection.active.line)
        const lineText = line.text

        if (lineText.includes(commentInsertKeys)) {
            editor
                .edit((editBuilder) => {
                    editBuilder.replace(
                        new vscode.Range(
                            new vscode.Position(selection.active.line, 0),
                            new vscode.Position(selection.active.line, commentInsertKeys.length)
                        ),
                        ""
                    )
                })
                .then(() => {
                    // Delay to ensure the document is updated
                    setTimeout(() => {
                        vscode.commands.executeCommand("nuxtcomponentpopdoc.createPopDocComment")
                    }, 50) // 50ms delay
                })
        }
    })
}
