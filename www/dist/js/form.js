
import * as Utils from "./utils.js";

export class Form
{
    static activeForm = null;

    static show(form) {
        Form.close();
        Form.activeForm = form;
    }

    static close() {
        if (Form.activeForm !== null) {
            Form.activeForm.close();
        }
    }

    constructor(templateId) {
        this.overlay = Utils.showOverlay(() => this.close());
        this.element = Utils.inflateTemplate(document.getElementById(templateId));
        this.overlay.append(this.element);

        Utils.bindActions('close', () => this.close(),
            { element: this.element });

        Utils.bindActions('save', () => this.save(),
            { element: this.element });

        Utils.bindActions('apply', () => this.apply(),
            { element: this.element });

        Utils.bindActions('reset', () => this.reset(),
            { element: this.element });

        Utils.bindActions('cancel', () => this.cancel(),
            { element: this.element });

        this.element.addEventListener('submit',
            (e) => {
                this.save();
                e.preventDefault();
            });
    }

    close() {
        Utils.hideOverlay(this.overlay);
        if (Form.activeForm === this) {
            Form.activeForm = null;
        }
    }

    apply() {
        // Virtual
        return true;
    }

    save() {
        if (this.apply()) {
            this.close();
        }
    }

    reset() {
        // Virtual
    }

    cancel() {
        this.close();
    }

    valueOr(value, defaultValue=null) {
        if (value === null || value === undefined || typeof value == "undefined"){
            return defaultValue;
        }
        return value
    }

};
