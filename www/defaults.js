
// TODO: Improve
export var GlobalDefaultMask = {
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

export class GlobalDefaultsFlags
{
    constructor() {
        // Legacy defaults
        // TODO: Determine reasonable set of default defaults
        this.tree = true;
        this.update = true;
        this.tree = true;
        this.shot = true;
        this.default_node = true;
        this.x_expr = false;
        this.y_expr = false;
        this.x_min = true;
        this.x_max = true;
        this.y_min = true;
        this.y_max = true;
        this.title = true;
        this.event = true;

        // Expanded defaults
        this.useCanvas = true;
    }

    static fromMask(mask, useCanvas = true) {
        let flags = new GlobalDefaultsFlags();

        // Legacy defaults
        flags.tree = ((mask & GlobalDefaultMask.tree) > 0);
        flags.update = ((mask & GlobalDefaultMask.update) > 0);
        flags.tree = ((mask & GlobalDefaultMask.tree) > 0);
        flags.shot = ((mask & GlobalDefaultMask.shot) > 0);
        flags.default_node = ((mask & GlobalDefaultMask.default_node) > 0);
        flags.x_expr = ((mask & GlobalDefaultMask.x_expr) > 0);
        flags.y_expr = ((mask & GlobalDefaultMask.y_expr) > 0);
        flags.x_min = ((mask & GlobalDefaultMask.x_min) > 0);
        flags.x_max = ((mask & GlobalDefaultMask.x_max) > 0);
        flags.y_min = ((mask & GlobalDefaultMask.y_min) > 0);
        flags.y_max = ((mask & GlobalDefaultMask.y_max) > 0);
        flags.title = ((mask & GlobalDefaultMask.title) > 0);
        flags.event = ((mask & GlobalDefaultMask.event) > 0);

        // Expanded defaults
        flags.useCanvas = useCanvas;

        return flags;
    }

    toMask() {
        return (
            (this.tree ? GlobalDefaultMask.tree : 0)
            | (this.update ? GlobalDefaultMask.update : 0)
            | (this.tree ? GlobalDefaultMask.tree : 0)
            | (this.shot ? GlobalDefaultMask.shot : 0)
            | (this.default_node ? GlobalDefaultMask.default_node : 0)
            | (this.x_expr ? GlobalDefaultMask.x_expr : 0)
            | (this.y_expr ? GlobalDefaultMask.y_expr : 0)
            | (this.x_min ? GlobalDefaultMask.x_min : 0)
            | (this.x_max ? GlobalDefaultMask.x_max : 0)
            | (this.y_min ? GlobalDefaultMask.y_min : 0)
            | (this.y_max ? GlobalDefaultMask.y_max : 0)
            | (this.title ? GlobalDefaultMask.title : 0)
            | (this.event ? GlobalDefaultMask.event : 0)
        );
    }

}

export class GlobalDefaults
{
    constructor() {
        // Backwards Compatible Defaults
        this.tree = null;
        this.shot = null;
        this.default_node = null;
        this.title_expr = null;
        this.y_expr = null;
        this.y_min = null;
        this.y_max = null;
        this.x_expr = null;
        this.x_min = null;
        this.x_max = null;
        this.trace_type = 'line';
        this.trace_color = 'steelblue';
        this.point_type = null;
        this.point_color = null;

        // New Defaults
        this.useCanvas = document.querySelector('#use-canvas').checked;
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
        document.getElementById('global-defaults-y-min').value = this.y_min;
        document.getElementById('global-defaults-y-max').value = this.y_max;
        document.getElementById('global-defaults-x_expr').value = this.x_expr;
        document.getElementById('global-defaults-x-min').value = this.x_min;
        document.getElementById('global-defaults-x-max').value = this.x_max;
        document.getElementById('global-defaults-tree').value = this.tree;
        document.getElementById('global-defaults-shot').value = this.shot;
        document.getElementById('global-defaults-default_node').value = this.default_node;

        document.querySelectorAll(`#panel-form *[data-action="save"]`)
            .forEach((node) => {
                node.addEventListener('click', (e) => {

                    this.title_expr = document.getElementById('global-defaults-title_expr').value;
                    this.y_expr = document.getElementById('global-defaults-y_expr').value;
                    this.y_min = document.getElementById('global-defaults-y-min').value;
                    this.y_max = document.getElementById('global-defaults-y-max').value;
                    this.x_expr = document.getElementById('global-defaults-x_expr').value;
                    this.x_min = document.getElementById('global-defaults-x-min').value;
                    this.x_max = document.getElementById('global-defaults-x-max').value;
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

        function outerClick(event){
            if (!document.querySelector(`#panel-form`).contains(event.target)) {
                $overlay.innerHTML = '';
                $overlay.classList.remove('shown');
            }
        }
        $overlay.addEventListener("click", outerClick, true);
        function keyPress (event) {
            if(event.key === "Escape") {
                $overlay.innerHTML = '';
                $overlay.classList.remove('shown');
            }
        }
        $overlay.addEventListener("keypress", keyPress)
    }
};