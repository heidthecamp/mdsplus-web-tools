import Trace from "./trace.js";

export function display_options(id, traces, update, index = 0) {
    let options_bg = document.createElement("div");
    options_bg.classList.add("click-off", "options-background");
    
    let o = document.createElement("div");
    o.setAttribute("id", "options");
    o.classList.add("options", "panel-form");
    options_bg.appendChild(o);

    let tree = traces[index].tree;
    let t = document.createElement("div");
    t.classList.add("form-element");
    t.innerText = "Tree: ";
    let ti = document.createElement("input");
    ti.type = "text";
    ti.value = traces[index].tree;
    ti.addEventListener("change", (e) => tree = e.target.value);
    t.appendChild(ti);
    o.appendChild(t);
    
    let shot = traces[index].shot;
    let s = document.createElement("div");
    s.classList.add("form-element");
    s.innerText = "Shot: ";
    let si = document.createElement("input");
    si.type = "text";
    si.value = shot;
    si.addEventListener("change", (e) => shot = e.target.value);
    s.appendChild(si);
    o.appendChild(s);
    
    let default_node = traces[index].default_node;
    let dn = document.createElement("div");
    dn.classList.add("form-element");
    dn.innerText = "Default Node: ";
    let dni = document.createElement("input");
    dni.type = "text";
    dni.value = default_node;
    dni.addEventListener("change", (e) => default_node = e.target.value);
    dn.appendChild(dni);
    o.appendChild(dn);
    
    let y_expr = traces[index].y_expr;
    let y = document.createElement("div");
    y.classList.add("form-element");
    y.innerText = "Y: ";
    let yi = document.createElement("input");
    yi.type = "text";
    yi.value = y_expr;
    yi.addEventListener("change", (e) => y_expr = e.target.value);
    y.appendChild(yi);
    o.appendChild(y);
    
    let x_expr = traces[index].x_expr;
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
    button.setAttribute("id", `update-${id}`);
    button.addEventListener("click", () => {
        // TODO: Fix this to work with multi trace
        update(
            [new Trace(tree, shot, default_node, traces[index].title, y_expr, x_expr)],
            // new Trace(tree, shot, default_node, traces[index].title, `abs(y_expr)`, x_expr)
        )
    });
    button.innerText = `Update panel-${id}`;

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