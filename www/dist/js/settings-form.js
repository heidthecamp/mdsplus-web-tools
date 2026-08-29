
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
        document.getElementById("scope-title_expr").value = Scope.title_expr;
        document.getElementById("scope-resample").checked = Scope.resample;
        document.getElementById("global-defaults-title_expr").value = Scope.defaults.title_expr;
        document.getElementById("global-defaults-y-min").value = Scope.defaults.y_min_expr;
        document.getElementById("global-defaults-y-max").value = Scope.defaults.y_max_expr;
        document.getElementById("global-defaults-x-min").value = Scope.defaults.x_min_expr;
        document.getElementById("global-defaults-x-max").value = Scope.defaults.x_max_expr;
        document.getElementById("global-defaults-y_expr").value = Scope.defaults.y_expr;
        document.getElementById("global-defaults-x_expr").value = Scope.defaults.x_expr;
        document.getElementById("global-defaults-tree").value = Scope.defaults.tree;
        document.getElementById("global-defaults-shot_expr").value = Scope.defaults.shot_expr;
        document.getElementById("global-defaults-default_node_expr").value = Scope.defaults.default_node_expr;
    }

    apply() {
        // TODO: null variables on empty string
        Scope.title_expr = document.getElementById('scope-title_expr').value;
        Scope.resample = document.getElementById('scope-resample').checked;
        Scope.defaults.title_expr = document.getElementById('global-defaults-title_expr').value;
        Scope.defaults.y_expr = document.getElementById('global-defaults-y_expr').value;
        Scope.defaults.y_min_expr = document.getElementById('global-defaults-y-min').value;
        Scope.defaults.y_max_expr = document.getElementById('global-defaults-y-max').value;
        Scope.defaults.x_expr = document.getElementById('global-defaults-x_expr').value;
        Scope.defaults.x_min_expr = document.getElementById('global-defaults-x-min').value;
        Scope.defaults.x_max_expr = document.getElementById('global-defaults-x-max').value;
        Scope.defaults.tree = document.getElementById('global-defaults-tree').value;
        Scope.defaults.shot_expr = document.getElementById('global-defaults-shot_expr').value;
        Scope.defaults.default_node_expr = document.getElementById('global-defaults-default_node_expr').value;
        
        // TODO: Should this happen here?
        Scope.shot_expr_offset = 0;

        Scope.queueAutosave();
        Scope.refresh();
        
        return true;
    }
};
