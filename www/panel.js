import * as s from "./scope.js";

export default class Panel {
    constructor (
        id = -1,
        tree = null, 
        shot = null,
        default_node = null,
        title = null,
        y_expr = null,
        x_expr = null,
    ) {
        this.id = id;
        this.tree = tree;
        this.shot = shot;
        this.default_node = default_node;
        this.title = title;
        this.y_expr = y_expr;
        this.x_expr = x_expr;
        Panel.panels.push(this);
    };

    update = () => {
        s.update(`${this.id}`, this.tree, this.shot, this.default_node, this.title, this.y_expr, this.x_expr);
    }

    
    get_panel_element = () => {
        let p = document.createElement("div");
        p.classList.add('panel');
        p.setAttribute("id", `panel-${this.id}`);

        let t = document.createElement("div");
        t.innerText = "Tree: ";
        let ti = document.createElement("input");
        ti.type = "text";
        ti.value = this.tree;
        ti.addEventListener("change", (e) => this.tree = e.target.value);
        t.appendChild(ti);
        p.appendChild(t);
        
        let s = document.createElement("div");
        s.innerText = "Shot: ";
        let si = document.createElement("input");
        si.type = "text";
        si.value = this.shot;
        si.addEventListener("change", (e) => this.shot = e.target.value);
        s.appendChild(si);
        p.appendChild(s);
        
        let dn = document.createElement("div");
        dn.innerText = "Default Node: ";
        let dni = document.createElement("input");
        dni.type = "text";
        dni.value = this.default_node;
        dni.addEventListener("change", (e) => this.default_node = e.target.value);
        dn.appendChild(dni);
        p.appendChild(dn);
        
        let y = document.createElement("div");
        y.innerText = "Y: ";
        let yi = document.createElement("input");
        yi.type = "text";
        yi.value = this.y_expr;
        yi.addEventListener("change", (e) => this.y_expr = e.target.value);
        y.appendChild(yi);
        p.appendChild(y);
        
        let x = document.createElement("div");
        x.innerText = "X: ";
        let xi = document.createElement("input");
        xi.type = "text";
        xi.value = this.x_expr;
        xi.addEventListener("change", (e) => this.x_expr = e.target.value);
        x.appendChild(xi);
        p.appendChild(x);

        let button = document.createElement("button");
        button.setAttribute("id", `update-${this.id}`);
        button.addEventListener("click", this.update);
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
        let p = new Panel(new_id, experiment, shot, default_node, title, y, x);
        // panels.push(p);
        panel.replaceWith(p.get_panel_element());
        await p.update();
    }

    static panels = []
}