import * as plot from "./plot.js";
import { display_options } from "./options.js";
import Trace from "./trace.js";

export default class Panel {
    constructor (
        id = -1,
        traces = [],
    ) {
        this.id = id;
        this.traces = traces;
        Panel.panels.push(this);
        this.update();
    };

    update = (
        traces = []
    ) => {

        if (traces.length > 0){
            this.traces = traces;
        }

        plot.update(
            `${this.id}`,
            this.traces[0].tree,
            this.traces[0].shot, 
            this.traces[0].default_node,
            this.traces[0].title,
            this.traces[0].y_expr,
            this.traces[0].x_expr,
        );
    }

    
    get_panel_element = () => {
        let p = document.createElement("div");
        p.classList.add('panel');
        p.setAttribute("id", `panel-${this.traces[0].id}`);

        let button = document.createElement("button");
        button.setAttribute("id", `open-options-${this.traces[0].id}`);
        button.addEventListener("click", () => {
            document.querySelector("body").appendChild(display_options(
                this.id,
                this.traces,
                this.update));
        });
        button.innerText = `Update panel-${this.id}`;
        p.appendChild(button);

        let title = document.createElement("div");
        title.setAttribute("id", `title-${this.id}`)
        p.appendChild(title);

        let scope = document.createElement("div");
        scope.setAttribute("id", `container-${this.id}`)
        p.appendChild(scope);

        return p;
    }
// info
    static async add_panel (info) {
        let table = document.getElementById("table");
        let panel = document.createElement("div");
        let new_id = Panel.panels.length + 1;
        panel.setAttribute("id", `panel-${new_id}`);
        table.appendChild(panel)
        // TODO: Tim should clean this up too, maybe pass info right to panel?
        if (!info) {
            info = {};
        }
        let experiment = info.hasOwnProperty('experiment') ? info['experiment'] : 'cmod';
        let shot = info.hasOwnProperty('shot') ? info['shot'] : '1090909010';
        let default_node = info.hasOwnProperty('default_node') ? info['default_node'] : null;
        let title = info.hasOwnProperty('title') ? info['title'] : '';
        let y = info.hasOwnProperty('y') ? info['y'] : '\\ip';
        let x = info.hasOwnProperty('x') ? info['x'] : '';
        let l = new Trace(experiment, shot, default_node, title, y, x)
        let p = new Panel(new_id, [l]);
        // panels.push(p);
        panel.replaceWith(p.get_panel_element());
        // await p.update();
    }

    static panels = []
}