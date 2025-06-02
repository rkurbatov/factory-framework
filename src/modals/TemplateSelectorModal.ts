import { App, Modal, TFile } from 'obsidian'

export class TemplateSelectorModal extends Modal {
    templates: TFile[]
    onChoose: (template: TFile) => void

    constructor(
        app: App,
        templates: TFile[],
        onChoose: (template: TFile) => void
    ) {
        super(app)
        this.templates = templates
        this.onChoose = onChoose
    }

    onOpen() {
        this.contentEl.empty()

        this.contentEl.createEl('h2', { text: 'Choose Template' })

        const templateList = this.contentEl.createEl('div', {
            cls: 'template-list',
        })

        this.templates.forEach((template) => {
            const templateItem = templateList.createEl('div', {
                cls: 'template-item',
                text: template.basename,
            })

            templateItem.onclick = () => {
                this.onChoose(template)
                this.close()
            }
        })
    }

    onClose() {
        this.contentEl.empty()
    }
}
