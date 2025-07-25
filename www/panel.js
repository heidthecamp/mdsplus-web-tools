import * as s from "./plot.js";
import { display_options } from "./options.js";
import Line from "./trace.js";

export default class Panel {
    constructor (
        id = -1,
        lines = [],
    ) {
        this.id = id;
        this.lines = lines;
        Panel.panels.push(this);
        this.update();
    };

    update = (
        lines = []
    ) => {

        if (lines.length > 0){
            this.lines = lines;
        }

        s.update(
            `${this.id}`,
            this.lines[0].tree,
            this.lines[0].shot, 
            this.lines[0].default_node,
            this.lines[0].title,
            this.lines[0].y_expr,
            this.lines[0].x_expr,
        );
    }

    
    get_panel_element = () => {
        let p = document.createElement("div");
        p.classList.add('panel');
        p.setAttribute("id", `panel-${this.lines[0].id}`);

        let button = document.createElement("button");
        button.setAttribute("id", `open-options-${this.lines[0].id}`);
        button.addEventListener("click", () => {
            document.querySelector("body").appendChild(display_options({
                "tree": this.lines[0].tree,
                "shot": this.lines[0].shot,
                "default_node": this.lines[0].default_node,
                "title": this.lines[0].title,
                "y_expr": this.lines[0].y_expr,
                "x_expr": this.lines[0].x_expr,
                "id": this.id,
            }, this.update));
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
info
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
        let l = new Line(experiment, shot, default_node, title, y, x)
        let p = new Panel(new_id, [l]);
        // panels.push(p);
        panel.replaceWith(p.get_panel_element());
        // await p.update();
    }

    static panels = []
}