
import * as Utils from "./utils.js";

export class Form
{
    static active_form = null;

    static show(form) {
        Form.active_form = form;
    }

    constructor(templateId) {
        let $overlay = Utils.showOverlay();
        this.$element = Utils.inflateTemplate(templateId);
        $overlay.append(this.$element);

        this.$element.querySelectorAll('*[data-action="save"]')
            .forEach((node) => this.save());

        this.$element.querySelectorAll('*[data-action="apply"]')
            .forEach((node) => this.apply());

        this.$element.querySelectorAll('*[data-action="reset"]')
            .forEach((node) => this.reset());

        this.$element.querySelectorAll('*[data-action="cancel"]')
            .forEach((node) => this.cancel());
    }

    close() {
        Utils.hideOverlay();
        Form.active_form = null;
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
        if (value === null || typeof value == "undefined"){
            return defaultValue;
        }
        return value
    }

};