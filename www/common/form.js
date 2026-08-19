
import * as Utils from "./utils.js";

export class Form
{
    static active_form = null;

    static show(form) {
        if (Form.active_form !== null) {
            Form.active_form.close();
        }
        Form.active_form = form;
    }

    constructor(templateId) {
        let $overlay = Utils.showOverlay();
        this.$element = Utils.inflateTemplate(templateId).firstElementChild;
        $overlay.append(this.$element);

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
        Form.active_form = null;
        Utils.hideOverlay();
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
        if (value === null || typeof value == "undefined"){
            return defaultValue;
        }
        return value
    }

};