import { Plugin, TAbstractFile, TFolder, TFile, App } from 'obsidian'

import { PromiseConfirmModal } from './modals/PromiseConfirmModal'
import { TemplateSelectorModal } from './modals/TemplateSelectorModal'
import { FileNameModal } from './modals/FileNameModal'

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
                                createChildNote(file as TFile, this)
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

async function createChildNote(parentFile: TFile, plugin: FactoryPlugin) {
    const { app, settings } = plugin
    const templateFolder = app.vault.getAbstractFileByPath(
        settings.templatesFolder
    )

    if (!(templateFolder instanceof TFolder)) {
        console.error('Template folder not found')
        return
    }

    const templates = templateFolder.children.filter(
        (f): f is TFile => f instanceof TFile && f.extension === 'md'
    )

    const modal = new TemplateSelectorModal(
        app,
        templates,
        async (template: TFile) => {
            // Вызов окна ввода имени после выбора шаблона
            const nameModal = new FileNameModal(app)
            const inputName = await nameModal.openAndWait()

            // Прерывание, если нажата "Отмена" или введено пустое имя
            if (!inputName) return

            try {
                const rawContent = await app.vault.read(template)

                // Парсинг тегов шаблона {{title}}, {{date:FORMAT}}, {{time:FORMAT}}
                const content = rawContent
                    .replace(/{{title}}/g, inputName)
                    .replace(/{{(?:date|time):?(.*?)}}/g, (_, format) => {
                        return window.moment().format(format || 'YYYY-MM-DD')
                    })

                const targetFolderPath = settings.childNotesFolder || ''

                if (targetFolderPath) {
                    const folderExists =
                        app.vault.getAbstractFileByPath(targetFolderPath)
                    if (!folderExists) {
                        await app.vault.createFolder(targetFolderPath)
                    }
                }

                const newFileName = `${inputName}.md`
                let newFilePath = targetFolderPath
                    ? `${targetFolderPath}/${newFileName}`
                    : newFileName

                // Защита от перезаписи существующего файла
                let counter = 1
                while (app.vault.getAbstractFileByPath(newFilePath)) {
                    const incrementalName = `${inputName} (${counter}).md`
                    newFilePath = targetFolderPath
                        ? `${targetFolderPath}/${incrementalName}`
                        : incrementalName
                    counter++
                }

                const newFile = await app.vault.create(newFilePath, content)

                await app.fileManager.processFrontMatter(
                    newFile,
                    (frontmatter) => {
                        frontmatter[settings.upFieldName] =
                            `[[${parentFile.basename}]]`
                    }
                )

                await app.workspace.getLeaf('tab').openFile(newFile)
            } catch (error) {
                console.error('Error creating child note:', error)
            }
        }
    )

    modal.open()
}

