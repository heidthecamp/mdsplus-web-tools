
import { Form } from "./form.js";
import { Scope } from "./scope.js";

export class SettingsForm extends Form
{
    constructor()
    {
        super('settings-form-template');

        this.reset();
    }

    reset() { 
        document.getElementById("settings-form-title_expr").value = Scope.title_expr;
        document.getElementById("settings-form-resample").checked = Scope.resample;

        document.getElementById("panel-defaults-form-title_expr").value = Scope.defaults.title_expr;
        document.getElementById("panel-defaults-form-y-min").value = Scope.defaults.y_min_expr;
        document.getElementById("panel-defaults-form-y-max").value = Scope.defaults.y_max_expr;
        document.getElementById("panel-defaults-form-x-min").value = Scope.defaults.x_min_expr;
        document.getElementById("panel-defaults-form-x-max").value = Scope.defaults.x_max_expr;

        document.getElementById("trace-defaults-form-y_expr").value = Scope.defaults.y_expr;
        document.getElementById("trace-defaults-form-x_expr").value = Scope.defaults.x_expr;
        document.getElementById("trace-defaults-form-tree").value = Scope.defaults.tree;
        document.getElementById("trace-defaults-form-shot_expr").value = Scope.defaults.shot_expr;
        document.getElementById("trace-defaults-form-default_node_expr").value = Scope.defaults.default_node_expr;
    }

    apply() {
        // TODO: null variables on empty string
        Scope.title_expr = document.getElementById("settings-form-title_expr").value;
        Scope.resample = document.getElementById("settings-form-resample").checked;

        Scope.defaults.title_expr = document.getElementById("panel-defaults-form-title_expr").value;
        Scope.defaults.y_min_expr = document.getElementById("panel-defaults-form-y-min").value;
        Scope.defaults.y_max_expr = document.getElementById("panel-defaults-form-y-max").value;
        Scope.defaults.x_min_expr = document.getElementById("panel-defaults-form-x-min").value;
        Scope.defaults.x_max_expr = document.getElementById("panel-defaults-form-x-max").value;

        Scope.defaults.y_expr = document.getElementById("trace-defaults-form-y_expr").value;
        Scope.defaults.x_expr = document.getElementById("trace-defaults-form-x_expr").value;
        Scope.defaults.tree = document.getElementById("trace-defaults-form-tree").value;
        Scope.defaults.shot_expr = document.getElementById("trace-defaults-form-shot_expr").value;
        Scope.defaults.default_node_expr = document.getElementById("trace-defaults-form-default_node_expr").value;
        
        // TODO: Should this happen here?
        Scope.shot_expr_offset = 0;

        Scope.queueAutosave();
        Scope.refresh();
        
        return true;
    }
};
