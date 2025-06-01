import { Plugin, TAbstractFile, TFolder, TFile, App } from 'obsidian'

export default class FactoryPlugin extends Plugin {
    async onload() {
        this.registerEvent(
            this.app.workspace.on('file-menu', (menu, file) => {
                if (isMarkdownFile(file)) {
                    menu.addItem((item) => {
                        item.setTitle('Create Child Note')
                            .setIcon('git-branch-plus')
                            .onClick(() => console.log('Hello!'))
                    })
                }

                if (isDesktopCanvasFile(file)) {
                    menu.addItem((item) => {
                        item.setTitle('Clear Desktop')
                            .setIcon('square-x')
                            .onClick(() => clearCanvas(file as TFile, this.app))
                    })
                }
            })
        )
    }
}

function isFolder(file: TAbstractFile): boolean {
    return file instanceof TFolder
}

function isMarkdownFile(file: TAbstractFile): boolean {
    return file instanceof TFile && file.extension === 'md'
}

function isDesktopCanvasFile(file: TAbstractFile): boolean {
    return file instanceof TFile && file.path === 'Desktop.canvas'
}

async function clearCanvas(canvasFile: TFile, app: App): Promise<void> {
    const emptyCanvas = {
        nodes: [],
        edges: [],
    }

    await app.vault.modify(canvasFile, JSON.stringify(emptyCanvas, null, 2))
}
