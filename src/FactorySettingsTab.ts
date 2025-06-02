import { App, PluginSettingTab, Setting, Plugin } from 'obsidian'

import { default as FactoryPlugin } from './main'

export interface FactorySettings {
    templatesFolder: string
    defaultTemplate: string
    upFieldName: string
}

export const DEFAULT_SETTINGS: FactorySettings = {
    templatesFolder: 'Templates',
    defaultTemplate: '',
    upFieldName: 'up',
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
    }
}
