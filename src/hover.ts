import * as vscode from "vscode"
import * as path from "path"

export const hoverProvider = () => {
    return vscode.languages.registerHoverProvider([{ language: "vue" }], {
        async provideHover(document, position, token) {
            const wordRange = document.getWordRangeAtPosition(position, /<[^>]*>/)
            if (!wordRange) {
                console.log("No word range found between <> tags")
                return
            }

            const word = document.getText(wordRange)
            if (!word) {
                console.log("No word found in the word range")
                return
            }

            console.log("Word:", word)
            const wordWithoutSpace = word.split(" ")[0]
            const wordWithoutTags = wordWithoutSpace.replace(/<|>|\/|/g, "")
            console.log("Word without tags:", wordWithoutTags)

            const workspaceFolders = vscode.workspace.workspaceFolders
            if (!workspaceFolders) {
                console.log("No workspace folders found")
                return
            }

            const rootPath = workspaceFolders[0].uri.fsPath
            const possiblePaths = [
                path.join(rootPath, ".nuxt", "components.d.ts"),
                path.join(rootPath, ".nuxt", "types", "components.d.ts"),
                // Add more paths here for other possible locations
            ]

            // Search for layer directories
            const layerDirs = await vscode.workspace.findFiles("**/layers/*/", "**/node_modules/**")
            for (const layerDir of layerDirs) {
                possiblePaths.push(path.join(layerDir.fsPath, ".nuxt", "components.d.ts"))
                possiblePaths.push(path.join(layerDir.fsPath, ".nuxt", "types", "components.d.ts"))
            }

            for (const possiblePath of possiblePaths) {
                try {
                    const componentInfo = await findComponentInFile(possiblePath, wordWithoutTags)
                    if (componentInfo) {
                        return createHoverInfo(componentInfo)
                    }
                } catch (error) {
                    console.log(`Error processing ${possiblePath}:`, error)
                }
            }

            console.log(`'${wordWithoutTags}' not found in any components.d.ts file`)
        },
    })
}

async function findComponentInFile(
    filePath: string,
    componentName: string
): Promise<string | null> {
    try {
        const doc = await vscode.workspace.openTextDocument(filePath)
        const content = doc.getText()
        const index = content.indexOf(componentName)
        if (index === -1) {
            return null
        }

        const line = doc.lineAt(doc.positionAt(index).line)
        const lineText = line.text
        console.log("Line text:", lineText)

        const path = lineText
            .split("import(")[1]
            .split(")")[0]
            .replace(/'|"/g, "")
            .replace(/\.\./g, "")

        console.log("Component path:", path)
        return path
    } catch (error) {
        console.log(`Error reading file ${filePath}:`, error)
        return null
    }
}

async function createHoverInfo(componentPath: string): Promise<vscode.Hover | null> {
    const pathWithWildCards = componentPath.replace("/", "**/")
    const files = await vscode.workspace.findFiles(pathWithWildCards, null, 1)
    if (files.length === 0) {
        return null
    }

    const file = files[0]
    const doc = await vscode.workspace.openTextDocument(file)
    const text = doc.getText()

    if (text.includes("<!-- @PopDoc")) {
        const popDocText = text.split("<!-- @PopDoc")[1].split("-->")[0]
        const popDocTextWithFilePath = `[Go To File](${file.uri}) ${popDocText}`
        return new vscode.Hover(popDocTextWithFilePath)
    }

    return null
}
