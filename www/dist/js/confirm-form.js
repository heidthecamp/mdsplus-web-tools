
import { Form } from "./form.js";

export class ConfirmForm extends Form
{
    // TODO: Change below a certain screen threshold or on mobile?
    static useBuiltIn = true;

    static ask(text, onAccept=null, onReject=null) {
        if (ConfirmForm.useBuiltIn) {
            if (confirm(text)) {
                if (onAccept !== null) {
                    onAccept();
                }
            }
            else {
                if (onReject !== null) {
                    onReject();
                }
            }
        }
        else {
            new ConfirmForm(text, onAccept, onReject);
        }
    }

    constructor(text, onAccept=null, onReject=null)
    {
        super('confirm-form-template');

        this.onAccept = onAccept;
        this.onReject = onReject;
        
        document.querySelector('#confirm-message').innerText = text;
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