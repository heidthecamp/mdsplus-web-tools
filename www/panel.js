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
}