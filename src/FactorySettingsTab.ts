import { App, PluginSettingTab, Setting } from 'obsidian'
import { default as FactoryPlugin } from './main'

export interface FactorySettings {
    templatesFolder: string
    defaultTemplate: string
    upFieldName: string
    showRecentBadges: boolean
    recentBadgesDays: number
    childNotesFolder: string // <-- Новый параметр
}

export const DEFAULT_SETTINGS: FactorySettings = {
    templatesFolder: 'Templates',
    defaultTemplate: '',
    upFieldName: 'up',
    showRecentBadges: true,
    recentBadgesDays: 7,
    childNotesFolder: 'O/_Pool', // <-- Дефолтное значение
}

export class FactorySettingTab extends PluginSettingTab {
    plugin: FactoryPlugin

    constructor(app: App, plugin: FactoryPlugin) {
        super(app, plugin)
        this.plugin = plugin
    }

    display(): void {
        const { containerEl } = this
        containerEl.empty()

        containerEl.createEl('h2', { text: 'Настройки дочерних заметок' })

        new Setting(containerEl)
            .setName('Папка с темплейтами')
            .setDesc('Путь к папке с темплейтами')
            .addText((text) =>
                text
                    .setPlaceholder('Templates')
                    .setValue(this.plugin.settings.templatesFolder)
                    .onChange(async (value) => {
                        this.plugin.settings.templatesFolder = value
                        await this.plugin.saveSettings()
                    })
            )

        new Setting(containerEl)
            .setName('Папка для новых заметок')
            .setDesc('Путь к папке, куда будут сохраняться дочерние заметки')
            .addText((text) =>
                text
                    .setPlaceholder('O/_Pool')
                    .setValue(this.plugin.settings.childNotesFolder)
                    .onChange(async (value) => {
                        this.plugin.settings.childNotesFolder = value
                        await this.plugin.saveSettings()
                    })
            )

        new Setting(containerEl)
            .setName('Название поля связи')
            .setDesc(
                'Название поля для ссылки на родительскую заметку в frontmatter'
            )
            .addText((text) =>
                text
                    .setPlaceholder('up')
                    .setValue(this.plugin.settings.upFieldName)
                    .onChange(async (value) => {
                        this.plugin.settings.upFieldName = value
                        await this.plugin.saveSettings()
                    })
            )

        containerEl.createEl('h2', { text: 'Отображение недавних файлов' })

        new Setting(containerEl)
            .setName('Показывать бейджи недавних файлов')
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.showRecentBadges)
                    .onChange(async (value) => {
                        this.plugin.settings.showRecentBadges = value
                        await this.plugin.saveSettings()
                        this.plugin.updateRecentBadges()
                    })
            )

        new Setting(containerEl)
            .setName('Количество дней для бейджа')
            .addText((text) =>
                text
                    .setPlaceholder('7')
                    .setValue(this.plugin.settings.recentBadgesDays.toString())
                    .onChange(async (value) => {
                        const days = parseInt(value, 10)
                        this.plugin.settings.recentBadgesDays = isNaN(days)
                            ? 7
                            : days
                        await this.plugin.saveSettings()
                        this.plugin.updateRecentBadges()
                    })
            )
    }
}
