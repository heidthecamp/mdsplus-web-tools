
let gopts;


export default class Global_Optinos {


    constructor (
        update = false,
        x_grid_labels = null,
        y_grid_lables = null,
        show_mode = null,
        step_plot = null,
        x_grid_lines = null,
        y_grid_lines = null,
        tree = null,
        shot = null,
        default_node = null,
        x_label = null,
        y_label = null,
        xmin = null,
        ymin = null,
        xmax = null,
        ymax = null,
        title = null,
        y_expr = null,
        x_expr = null,
        trace_type = "line",
        trace_color = "steelblue",
        point_type = "none",
        point_color = "red",
    ) {
        if (gopts) {
            console.error("There can only be one instance of global options")
            return gopts;
        }

        this.update        = update,
        this.x_grid_labels = x_grid_labels,
        this.y_grid_lables = y_grid_lables,
        this.show_mode     = show_mode,
        this.step_plot     = step_plot,
        this.x_grid_lines  = x_grid_lines,
        this.y_grid_lines  = y_grid_lines
        this.tree          = tree;
        this.shot          = shot;
        this.x_label       = x_label
        this.y_label       = y_label
        this.xmin          = xmin
        this.ymin          = ymin
        this.xmax          = xmax
        this.ymax          = ymax
        this.default_node  = default_node;
        this.title         = title;
        this.trace_type    = trace_type;
        this.trace_color   = trace_color;
        this.point_type    = point_type;
        this.point_color   = point_color;

        gopts = this;
    }

    static get_instance() {
        if (!gopts) {
            new Global_Optinos();
        }
        return gopts;
    }

    static display_options(update, parent) {


        // function outerClick(event){
        //     if (!o.contains(event.target)) {
        //         options_bg.remove();
        //     }
        // }

        let options_bg = document.createElement("div");
        options_bg.classList.add("click-off", "options-background");
        options_bg.setAttribute("id", "options_bg");

        parent.appendChild(options_bg);
        
        options_bg.innerHTML = `
        <div class="options panel-form" id="form">
            <form >
                <div class="form-element">
                    <label for="global-title">Title</label>
                    <input  id="global-title">
                </div>
                <div class="form-element y-values">
                    <span>
                    <label for="global-y-label">Y Label</label>
                    <input  id="global-y-label">
                    </span><span>
                        <label for="global-y-min">Y min</label>
                        <input size=5 id="global-y-min">
                    </span><span>
                        <label for="global-y-max">Y max</label>
                        <input size=5 id="global-y-max">
                    </span>
                </div>
                <div class="form-element x-values">
                    <span>
                        <label for="global-x-label">X Label</label>
                        <input  id="global-x-label">
                    </span><span>
                    <label for="global-x-min">X min</label>
                        <input  size=5 id="global-x-min">
                    </span><span>
                    <label for="global-x-max">X max</label>
                        <input size=5 id="global-x-max">
                    </span>
                </div>
                <div class="form-element">
                    <span>
                    <label for="global-tree-input">Tree:</label> 
                    <input id="global-tree-input" name="global-tree-input" type="text" value="${this.tree}">
                    </span><span>
                    <label for="global-shot-input">Shot:</label>
                        <input type="number" id="global-shot-input" name="global-shot-input" type="text" value="${this.shot}">
                    </span>
                </div>
                <div class="form-element">
                    <span>
                    <label for="global-update-event">Update event</label>
                    <input disabled id="global-update-event">
                    </span><span>
                        <label for="global-default-node-input">Default Node:</label>
                        <input id="global-default-node-input" name="global-default-node-input" type="text">
                    </span>
                </div>
                <div class="form-element grid-values">
                    <span>
                        <label for="lines-x">Lines x</label>
                        <input min=1 max=1 type="number" id="lines-x">
                    </span><span>
                        <label for="lines-y">Lines y</label>
                        <input min=1 max=1 type="number" id="lines-y">
                    </span><span>
                        <label for="vertical-offset">Vertical offset</label>
                        <input min=1 max=1 type="number" id="lines-x">
                    </span><span>
                        <label for="horizontal-offset">Horizontal offset</label>
                        <input min=1 max=1 type="number" id="horizontal-offset">
                    </span><span>
                </div>
                <div class="form-element trace-values">
                    <span>
                        <label for="reversed">Reversed</label>
                        <input type="checkbox" id="reversed">
                    </span><span>
                        <label for="grid-mode">Grid mode</label>
                        <select size=1 id="grid-mode">
                            <option value="dotted">dotted</option>
                        </select>
                    </span><span>
                        <label for="legend">Legend</label>
                        <select size=1 id="legend">
                            <option value="in-graphics">In Graphics</option>
                        </select>
                    </span><span>
                        <label for="auto-color">Auto color</label>
                        <select size=1 id="auto-color">
                            <option value="on-shot">on shot</option>
                        </select>
                    </span><span>
                        <label for="upd-lims">Upd. limits</label>
                        <input type="checkbox" size=1 id="upd-lims">
                    </span>
                </div>

            </form>
            <div>
                <button id="ok-button">Ok</button>
                <button id="apply-button">Apply</button>
                <button id="reset-button">Reset</button>
                <button id="erase-button">Erase</button>
                <button id="close-button">Close</button>
            </div>
        </div>`

        function apply() {
            console.error("Implement Apply")
        }

        function erase() {
            console.error("Implement Erase")
        }

        function reset() {
            console.error("Implement Reset")
        }

        function closeEvent(e) {
            e.preventDefault();
            // options_bg = document.getElementById("options_bg");
            options_bg.remove();
        }

        function outerClick(event){
            if (!document.getElementById("form").contains(event.target)) {
                options_bg.remove();
            }
        }

        options_bg.addEventListener("click", outerClick, true);
        
        document.getElementById("close-button").addEventListener("click", closeEvent);
    }
}
