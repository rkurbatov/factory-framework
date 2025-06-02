import { Plugin, TAbstractFile, TFolder, TFile, App } from 'obsidian'

import { PromiseConfirmModal } from './modals/PromiseConfirmModal'
import { TemplateSelectorModal } from './modals/TemplateSelectorModal'

import {
    FactorySettings,
    DEFAULT_SETTINGS,
    FactorySettingTab,
} from './FactorySettingsTab'

export default class FactoryPlugin extends Plugin {
    settings: FactorySettings = DEFAULT_SETTINGS

    async onload() {
        await this.loadSettings()

        this.registerEvent(
            this.app.workspace.on('file-menu', (menu, file) => {
                if (isMarkdownFile(file)) {
                    menu.addItem((item) => {
                        item.setTitle('Create Child Note')
                            .setIcon('git-branch-plus')
                            .onClick(() =>
                                createChildNote(file as TFile, this.app)
                            )
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

        this.addSettingTab(new FactorySettingTab(this.app, this))
    }

    async loadSettings() {
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.loadData()
        )
    }

    async saveSettings() {
        await this.saveData(this.settings)
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
    const modal = new PromiseConfirmModal(
        app,
        'Do you want to clear your Desktop?'
    )
    const confirmed = await modal.openAndWait()
    if (confirmed) {
        const emptyCanvas = {
            nodes: [],
            edges: [],
        }
        await app.vault.modify(canvasFile, JSON.stringify(emptyCanvas, null, 2))
    }
}

async function createChildNote(file: TFile, app: App) {
    const modal = new TemplateSelectorModal(app, [], () => {})
    await modal.open()
}
