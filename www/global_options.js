
// TODO: Improve
export var GlobalDefaultFlags = {
    update: (1 << 0),
    tree: (1 << 7),
    shot: (1 << 8),
    default_node: (1 << 9),
    x_expr: (1 << 10),
    y_expr: (1 << 11),
    x_min: (1 << 12),
    x_max: (1 << 13),
    y_min: (1 << 14),
    y_max: (1 << 15),
    title: (1 << 16),
    event: (1 << 17),
};

// TODO: Improve?
export function useDefault(property, global_defaults) {
    return ((global_defaults & GlobalDefaultFlags[property]) > 0);
}

export default class GlobalDefaults {
    constructor() {
        this.tree = null;
        this.shot = null;
        this.default_node = null;
        this.title_expr = null;
        this.y_expr = null;
        this.x_expr = null;
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

        // Update the form values
        document.getElementById('global-defaults-title_expr').value = this.title_expr; // TODO: Move to Panel
        document.getElementById('global-defaults-y_expr').value = this.y_expr;
        document.getElementById('global-defaults-x_expr').value = this.x_expr;
        document.getElementById('global-defaults-tree').value = this.tree;
        document.getElementById('global-defaults-shot').value = this.shot;
        document.getElementById('global-defaults-default_node').value = this.default_node;

        document.querySelectorAll(`#panel-form *[data-action="save"]`)
            .forEach((node) => {
                node.addEventListener('click', (e) => {

                    this.title_expr = document.getElementById('global-defaults-title_expr').value;
                    this.y_expr = document.getElementById('global-defaults-y_expr').value;
                    this.x_expr = document.getElementById('global-defaults-x_expr').value;
                    this.tree = document.getElementById('global-defaults-tree').value;
                    this.shot = document.getElementById('global-defaults-shot').value;
                    this.default_node = document.getElementById('global-defaults-default_node').value;

                    $overlay.innerHTML = '';
                    $overlay.classList.remove('shown');

                    // HACK: Replace with function for refreshing
                    document.getElementById('refresh').click();
                });
            });

        document.querySelectorAll(`#panel-form *[data-action="reset"]`)
            .forEach((node) => {
                node.addEventListener('click', (e) => {
                    debugger;
                });
            });

        document.querySelectorAll(`#panel-form *[data-action="cancel"]`)
            .forEach((node) => {
                node.addEventListener('click', (e) => {
                    $overlay.innerHTML = '';
                    $overlay.classList.remove('shown');
                });
            });
    }
};