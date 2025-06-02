import { Modal, App, Setting } from 'obsidian'

export class PromiseConfirmModal extends Modal {
    private resolvePromise: (value: boolean) => void = () => undefined

    constructor(
        app: App,
        private message: string
    ) {
        super(app)
    }

    onOpen() {
        const { contentEl } = this

        contentEl.createEl('p', { text: this.message })

        new Setting(contentEl)
            .addButton((btn) =>
                btn
                    .setButtonText('Yes')
                    .setCta()
                    .onClick(() => {
                        this.resolvePromise(true)
                        this.close()
                    })
            )
            .addButton((btn) =>
                btn.setButtonText('No').onClick(() => {
                    this.resolvePromise(false)
                    this.close()
                })
            )
    }

    async openAndWait(): Promise<boolean> {
        return new Promise((resolve) => {
            this.resolvePromise = resolve
            this.open()
        })
    }

    onClose() {
        this.contentEl.empty()
        if (this.resolvePromise) {
            this.resolvePromise(false)
        }
    }
}
