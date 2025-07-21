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
        this.update();
    };

    update = (
        tree = null,
        shot = null,
        default_node = null,
        title = null,
        y_expr = null,
        x_expr = null,
    ) => {
        if (!!tree) {
            this.tree = tree;
        }
        if (!!shot) {
            this.shot = shot;
        }
        if (!!default_node) {
            this.default_node = default_node;
        }
        if (!!title) {
            this.title = title;
        }
        if (!!y_expr) {
            this.y_expr = y_expr;
            if (!x_expr) {
                this.x_expr = null; // Panel hanldes null by using dim_of(y)
            }
        }
        if (!!x_expr) {
            this.x_expr = x_expr;
        }

        s.update(
            `${this.id}`,
            this.tree,
            this.shot, 
            this.default_node,
            this.title,
            this.y_expr,
            this.x_expr,
        );
    }

    
    get_panel_element = () => {
        let p = document.createElement("div");
        p.classList.add('panel');
        p.setAttribute("id", `panel-${this.id}`);

        let button = document.createElement("button");
        button.setAttribute("id", `open-options-${this.id}`);
        button.addEventListener("click", () => {
            document.querySelector("body").appendChild(this.display_options());
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

    display_options = () => {
        let options_bg = document.createElement("div");
        options_bg.classList.add("click-off", "background");

        
        let o = document.createElement("div");
        o.setAttribute("id", "options");
        o.classList.add("options", "panel-form");
        options_bg.appendChild(o);

        let tree = this.tree;
        let t = document.createElement("div");
        t.classList.add("form-element");
        t.innerText = "Tree: ";
        let ti = document.createElement("input");
        ti.type = "text";
        ti.value = this.tree;
        ti.addEventListener("change", (e) => tree = e.target.value);
        t.appendChild(ti);
        o.appendChild(t);
        
        let shot = this.shot;
        let s = document.createElement("div");
        s.classList.add("form-element");
        s.innerText = "Shot: ";
        let si = document.createElement("input");
        si.type = "text";
        si.value = shot;
        si.addEventListener("change", (e) => shot = e.target.value);
        s.appendChild(si);
        o.appendChild(s);
        
        let default_node = this.default_node;
        let dn = document.createElement("div");
        dn.classList.add("form-element");
        dn.innerText = "Default Node: ";
        let dni = document.createElement("input");
        dni.type = "text";
        dni.value = default_node;
        dni.addEventListener("change", (e) => default_node = e.target.value);
        dn.appendChild(dni);
        o.appendChild(dn);
        
        let y_expr = this.y_expr;
        let y = document.createElement("div");
        y.classList.add("form-element");
        y.innerText = "Y: ";
        let yi = document.createElement("input");
        yi.type = "text";
        yi.value = y_expr;
        yi.addEventListener("change", (e) => y_expr = e.target.value);
        y.appendChild(yi);
        o.appendChild(y);
        
        let x_expr = this.x_expr;
        let x = document.createElement("div");
        x.classList.add("form-element");
        x.innerText = "X: ";
        let xi = document.createElement("input");
        xi.type = "text";
        xi.value = x_expr;
        xi.addEventListener("change", (e) => x_expr = e.target.value);
        x.appendChild(xi);
        o.appendChild(x);

        let button = document.createElement("button");
        button.setAttribute("id", `update-${this.id}`);
        button.addEventListener("click", () => {
            // TODO: Make sure x_exper is updated correctly. 
            this.update(
                tree, shot, default_node, this.title, y_expr, x_expr
            )
        });
        button.innerText = `Update panel-${this.id}`;

        function closeEvent() {
            options_bg.remove();
        }

        function outerClick(event){
            if (!o.contains(event.target)) {
                options_bg.remove();
            }
        }

        let close = document.createElement("button");
        close.setAttribute("id", "close");
        close.innerText="close";
        close.addEventListener("click", closeEvent, true);


        options_bg.addEventListener("click", outerClick, true);

        o.appendChild(button);
        o.appendChild(close);

        return(options_bg);
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
        // await p.update();
    }

    static panels = []
}