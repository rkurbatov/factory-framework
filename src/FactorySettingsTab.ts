import { App, PluginSettingTab, Setting } from 'obsidian'

import { default as FactoryPlugin } from './main'

export interface FactorySettings {
    templatesFolder: string
    defaultTemplate: string
    upFieldName: string
    showRecentBadges: boolean // Флаг включения/отключения
    recentBadgesDays: number // Количество дней
}

export const DEFAULT_SETTINGS: FactorySettings = {
    templatesFolder: 'Templates',
    defaultTemplate: '',
    upFieldName: 'up',
    showRecentBadges: true,
    recentBadgesDays: 7,
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
            .setName('Название поля связи')
            .setDesc('Название поля для ссылки на родительскую заметку')
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
            .setDesc(
                'Отображать метку возраста для недавно созданных заметок в файловом менеджере'
            )
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
            .setDesc('Максимальный возраст файла в днях для отображения метки')
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
