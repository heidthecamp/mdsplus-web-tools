
import { Scope } from "../common/scope.js";

// TODO: Improve
export var GlobalDefaultMask = {
    update: (1 << 0),
    tree: (1 << 7),
    shot_expr: (1 << 8),
    default_node_expr: (1 << 9),
    x_expr: (1 << 10),
    y_expr: (1 << 11),
    x_min_expr: (1 << 12),
    x_max_expr: (1 << 13),
    y_min_expr: (1 << 14),
    y_max_expr: (1 << 15),
    title_expr: (1 << 16),
    event: (1 << 17),
};

export class GlobalDefaultsFlags
{
    constructor() {
        // Legacy defaults
        // TODO: Determine reasonable set of default defaults
        this.update = true;
        this.tree = true;
        this.shot_expr = true;
        this.default_node_expr = true;
        this.x_expr = false;
        this.y_expr = false;
        this.x_min_expr = true;
        this.x_max_expr = true;
        this.y_min_expr = true;
        this.y_max_expr = true;
        this.title_expr = true;
        this.event = true;
    }

    static fromMask(mask) {
        let flags = new GlobalDefaultsFlags();

        // Legacy defaults
        flags.update = ((mask & GlobalDefaultMask.update) > 0);
        flags.tree = ((mask & GlobalDefaultMask.tree) > 0);
        flags.shot_expr = ((mask & GlobalDefaultMask.shot_expr) > 0);
        flags.default_node_expr = ((mask & GlobalDefaultMask.default_node_expr) > 0);
        flags.x_expr = ((mask & GlobalDefaultMask.x_expr) > 0);
        flags.y_expr = ((mask & GlobalDefaultMask.y_expr) > 0);
        flags.x_min_expr = ((mask & GlobalDefaultMask.x_min_expr) > 0);
        flags.x_max_expr = ((mask & GlobalDefaultMask.x_max_expr) > 0);
        flags.y_min_expr = ((mask & GlobalDefaultMask.y_min_expr) > 0);
        flags.y_max_expr = ((mask & GlobalDefaultMask.y_max_expr) > 0);
        flags.title_expr = ((mask & GlobalDefaultMask.title_expr) > 0);
        flags.event = ((mask & GlobalDefaultMask.event) > 0);

        return flags;
    }

    toMask() {
        return (
            (this.update ? GlobalDefaultMask.update : 0)
            | (this.tree ? GlobalDefaultMask.tree : 0)
            | (this.shot_expr ? GlobalDefaultMask.shot_expr : 0)
            | (this.default_node_expr ? GlobalDefaultMask.default_node_expr : 0)
            | (this.x_expr ? GlobalDefaultMask.x_expr : 0)
            | (this.y_expr ? GlobalDefaultMask.y_expr : 0)
            | (this.x_min_expr ? GlobalDefaultMask.x_min_expr : 0)
            | (this.x_max_expr ? GlobalDefaultMask.x_max_expr : 0)
            | (this.y_min_expr ? GlobalDefaultMask.y_min_expr : 0)
            | (this.y_max_expr ? GlobalDefaultMask.y_max_expr : 0)
            | (this.title_expr ? GlobalDefaultMask.title_expr : 0)
            | (this.event ? GlobalDefaultMask.event : 0)
        );
    }

}

export class GlobalDefaults
{
    constructor() {
        // Backwards Compatible Defaults
        this.tree = null;
        this.shot_expr = null;
        this.default_node_expr = null;
        this.title_expr = null;
        this.y_expr = null;
        this.y_min_expr = null;
        this.y_max_expr = null;
        this.x_expr = null;
        this.x_min_expr = null;
        this.x_max_expr = null;
        this.trace_type = 'line';
        this.trace_color = 'steelblue';
        this.point_type = null;
        this.point_color = null;
    }

    edit() {
        let $overlay = document.getElementById('overlay');
        
        // Clear out the overlay
        $overlay.innerHTML = '';
        
        // Show the overlay
        $overlay.classList.add('shown');
        
        let globalDefaultsFormTemplate = document.getElementById('global-defaults-form-template');
        $overlay.appendChild(globalDefaultsFormTemplate.content.cloneNode(true));

        document.getElementById('scope-title_expr').value = Scope.title_expr; // TODO: Move to Panel

        // Update the form values
        document.getElementById('global-defaults-title_expr').value = this.title_expr;
        document.getElementById('global-defaults-y_expr').value = this.y_expr;
        document.getElementById('global-defaults-y-min').value = this.y_min_expr;
        document.getElementById('global-defaults-y-max').value = this.y_max_expr;
        document.getElementById('global-defaults-x_expr').value = this.x_expr;
        document.getElementById('global-defaults-x-min').value = this.x_min_expr;
        document.getElementById('global-defaults-x-max').value = this.x_max_expr;
        document.getElementById('global-defaults-tree').value = this.tree;
        document.getElementById('global-defaults-shot_expr').value = this.shot_expr;
        document.getElementById('global-defaults-default_node_expr').value = this.default_node_expr;

        document.querySelectorAll(`#global-defaults-form *[data-action="save"]`)
            .forEach((node) => {
                node.addEventListener('click', (e) => {
                    
                    Scope.title_expr = document.getElementById('scope-title_expr').value;

                    this.title_expr = document.getElementById('global-defaults-title_expr').value;
                    this.y_expr = document.getElementById('global-defaults-y_expr').value;
                    this.y_min_expr = document.getElementById('global-defaults-y-min').value;
                    this.y_max_expr = document.getElementById('global-defaults-y-max').value;
                    this.x_expr = document.getElementById('global-defaults-x_expr').value;
                    this.x_min_expr = document.getElementById('global-defaults-x-min').value;
                    this.x_max_expr = document.getElementById('global-defaults-x-max').value;
                    this.tree = document.getElementById('global-defaults-tree').value;
                    this.shot_expr = document.getElementById('global-defaults-shot_expr').value;
                    this.default_node_expr = document.getElementById('global-defaults-default_node_expr').value;

                    $overlay.innerHTML = '';
                    $overlay.classList.remove('shown');

                    Scope.refresh();
                });
            });

        document.querySelectorAll(`#global-defaults-form *[data-action="reset"]`)
            .forEach((node) => {
                node.addEventListener('click', (e) => {
                    this.edit(); // HACK
                });
            });

        document.querySelectorAll(`#global-defaults-form *[data-action="cancel"]`)
            .forEach((node) => {
                node.addEventListener('click', (e) => {
                    $overlay.innerHTML = '';
                    $overlay.classList.remove('shown');
                });
            });

    }
};