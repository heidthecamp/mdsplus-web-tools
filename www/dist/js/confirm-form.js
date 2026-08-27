
import { Form } from "./form.js";

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