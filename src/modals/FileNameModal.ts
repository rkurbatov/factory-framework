import { App, Modal, Setting } from 'obsidian'

export class FileNameModal extends Modal {
    private resolvePromise: (value: string | null) => void = () => undefined
    private result: string = ''

    constructor(app: App) {
        super(app)
    }

    onOpen() {
        const { contentEl } = this
        contentEl.createEl('h2', { text: 'Введите название заметки' })

        const setting = new Setting(contentEl)
            .setName('Название (без .md)')
            .addText((text) => {
                text.onChange((value) => {
                    this.result = value.trim()
                })
                text.inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
                    if (e.key === 'Enter') {
                        e.preventDefault()
                        this.resolvePromise(this.result)
                        this.close()
                    }
                })
                // Фокус на поле ввода при открытии
                window.setTimeout(() => text.inputEl.focus(), 10)
            })

        new Setting(contentEl)
            .addButton((btn) =>
                btn
                    .setButtonText('Создать')
                    .setCta()
                    .onClick(() => {
                        this.resolvePromise(this.result)
                        this.close()
                    })
            )
            .addButton((btn) =>
                btn.setButtonText('Отмена').onClick(() => {
                    this.resolvePromise(null)
                    this.close()
                })
            )
    }

    async openAndWait(): Promise<string | null> {
        return new Promise((resolve) => {
            this.resolvePromise = resolve
            this.open()
        })
    }

    onClose() {
        this.contentEl.empty()
        if (this.resolvePromise) {
            this.resolvePromise(null)
        }
    }
}
