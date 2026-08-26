
import * as Utils from "./utils.js";

export class Form
{
    static active_form = null;

    static show(form) {
        Form.close();
        Form.active_form = form;
    }

    static close() {
        if (Form.active_form !== null) {
            Form.active_form.close();
        }
    }

    constructor(templateId) {
        this.$overlay = Utils.showOverlay(() => this.close());
        this.$element = Utils.inflateTemplate(document.getElementById(templateId));
        this.$overlay.append(this.$element);

        this.$element.querySelectorAll('*[data-action="close"]')
            .forEach((node) => {
                node.addEventListener('click', (e) => this.close());
            });

        this.$element.querySelectorAll('*[data-action="save"]')
            .forEach((node) => {
                node.addEventListener('click', (e) => this.save());
            });

        this.$element.querySelectorAll('*[data-action="apply"]')
            .forEach((node) => {
                node.addEventListener('click', (e) => this.apply());
            });

        this.$element.querySelectorAll('*[data-action="reset"]')
            .forEach((node) => {
                node.addEventListener('click', (e) => this.reset());
            });

        this.$element.querySelectorAll('*[data-action="cancel"]')
            .forEach((node) => {
                node.addEventListener('click', (e) => this.cancel());
            });

        this.$element.addEventListener('submit',
            (e) => {
                this.save();
                e.preventDefault();
            });
    }

    close() {
        console.log('Form close');
        Utils.hideOverlay(this.$overlay);
        if (Form.active_form === this) {
            Form.active_form = null;
        }
    }

    apply() {
        // Virtual
        return true;
    }

    save() {
        console.log('Saving')
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

export class ConfirmForm extends Form
{
    constructor(html, onAccept=null, onReject=null)
    {
        super('confirm-form-template');

        this.onAccept = onAccept;
        this.onReject = onReject;
        
        document.querySelector('#confirm-message').innerHTML = html;
    }

    save() {
        if (this.onAccept !== null) {
            this.onAccept();
        }
        super.save();
    }

    cancel() {
        if (this.onReject !== null) {
            this.onReject();
        }
        super.cancel();
    }
}