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

    updateRecentBadges() {
        const now = Date.now()
        const fileExplorers =
            this.app.workspace.getLeavesOfType('file-explorer')

        for (const leaf of fileExplorers) {
            const fileItems = Object.entries((leaf.view as any).fileItems)

            for (const [path, item] of fileItems) {
                const el = (item as any).el as HTMLElement

                // Всегда очищаем старый бейдж перед проверками
                const existingBadge = el.querySelector('.factory-recent-badge')
                if (existingBadge) {
                    existingBadge.remove()
                }

                // Если показ отключен в настройках, просто идем к следующему файлу
                if (!this.settings.showRecentBadges) {
                    continue
                }

                const file = (item as any).file

                if (
                    !(file instanceof TFile) ||
                    file.extension !== 'md' ||
                    path.startsWith(this.settings.templatesFolder)
                ) {
                    continue
                }

                const diffTime = Math.abs(now - file.stat.ctime)
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

                // Используем значение из конфига вместо хардкода
                if (diffDays <= this.settings.recentBadgesDays) {
                    const titleInner = el.querySelector('.nav-file-title')
                    if (titleInner) {
                        const badge = document.createElement('span')
                        badge.addClass('factory-recent-badge')
                        badge.setAttribute('data-age', diffDays.toString())
                        badge.setText(diffDays === 0 ? 'new' : `${diffDays}d`)

                        titleInner.appendChild(badge)
                    }
                }
            }
        }
    }

    async onload() {
        await this.loadSettings()

        this.app.workspace.onLayoutReady(() => {
            this.updateRecentBadges()
        })

        // Обновление при создании новых файлов
        this.registerEvent(
            this.app.vault.on('create', () => {
                this.updateRecentBadges()
            })
        )

        this.registerInterval(
            window.setInterval(
                () => {
                    this.updateRecentBadges()
                },
                60 * 60 * 1000
            )
        )

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

    onunload() {
        // Удаляем все созданные бейджи из DOM при выключении плагина
        const badges = document.querySelectorAll('.factory-recent-badge')
        badges.forEach((badge) => badge.remove())
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

