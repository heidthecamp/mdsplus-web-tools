import Trace from "./trace.js";

export function display_options(id, traces, update, parent, index = 0) {
    let options_bg = document.createElement("div");
    options_bg.classList.add("click-off", "options-background");
    options_bg.setAttribute("id", "options_bg");


    parent.appendChild(options_bg);

    let title = traces[index].title;
    let tree = traces[index].tree;
    let shot = traces[index].shot;
    let default_node = traces[index].default_node;
    let y_expr = traces[index].y_expr;
    let x_expr = traces[index].x_expr;


    options_bg.innerHTML = `
    <div class="options panel-form" id="form">
        <form>
            <div class="form-element">
                <span>
                    <input type="checkbox" id="title-default>
                    <label for="title">Title</label>
                    <input  id="title" value=${title}>
                </span>
            </div>
            <div class="form-element">
                <span>
                    <label for="signal-label">Signal label</label>
                    <input  id="signal-label">
                </span>
            </div>
            <div>
                <label
            </div>
            <div class="form-element y-values">
                <div>
                    <label for="y-expr">Y</label>
                    <input id="y-expr" value=${y_expr}>
                    <label for"y-scale>Log scale</label>
                    <input type="checkbox" id=y-scale>
                </div>
                <div>
                    <span>
                    <input type="checkbox" id="y-label-default">
                    <label for="y-label">Y Label</label>
                    <input  id="y-label">
                </span><span>
                    <input type="checkbox" id="y-min-default">
                    <label for="y-min">Y min</label>
                    <input size=5 id="y-min">
                </span><span>
                    <input type="checkbox" id="y-max-default">
                    <label for="y-max">Y max</label>
                    <input size=5 id="y-max">
                </span>
                </div>
            </div>
            <div class="form-element x-values">
                <div>
                    <label for="x-expr">X</label>
                    <input id="x-expr" value=${x_expr}>
                    <label for"x-scale>Log scale</label>
                    <input type="checkbox" id=x-scale>
                </div>
                <span>
                    <input type="checkbox" id="x-label-default">
                    <label for="x-label">X Label</label>
                    <input  id="x-label">
                </span><span>
                    <input type="checkbox" id="x-min-default">
                    <label for="x-min">X min</label>
                    <input  size=5 id="x-min">
                </span><span>
                    <input type="checkbox" id="x-max-default">
                    <label for="x-max">X max</label>
                    <input size=5 id="x-max">
                </span>
            </div>
            <div class="form-element">
                <span>
                    <input type="checkbox" id="tree-default">
                    <label for="tree-input">Tree:</label> 
                    <input id="tree-input" name="tree-input" type="text" value="${tree}">
                </span><span>
                    <input type="checkbox" id="shot-default">
                    <label for="shot-input">Shot:</label>
                    <input type="number" id="shot-input" name="shot-input" type="text" value="${shot}">
                </span>
            </div>
            <div class="form-element">
                <span>
                    <input type="checkbox" id="update-event-default">
                    <label for="update-event">Update event</label>
                    <input id="update-event" value="${default_node}>
                </span><span>
                    <input type="checkbox" id="default-node-default">
                    <label for="default-node-input">Default Node:</label>
                    <input id="default-node-input" name="default-node-input" type="text">
                </span>
            </div>
            ${
                null
                // <div class="form-element grid-values">
                //     <span>
                //         <label for="lines-x">Lines x</label>
                //         <input min=1 max=1 type="number" id="lines-x">
                //     </span><span>
                //         <label for="lines-y">Lines y</label>
                //         <input min=1 max=1 type="number" id="lines-y">
                //     </span><span>
                //         <label for="vertical-offset">Vertical offset</label>
                //         <input min=1 max=1 type="number" id="lines-x">
                //     </span><span>
                //         <label for="horizontal-offset">Horizontal offset</label>
                //         <input min=1 max=1 type="number" id="horizontal-offset">
                //     </span><span>
                // </div>
                // <div class="form-element trace-values">
                //     <span>
                //         <label for="reversed">Reversed</label>
                //         <input type="checkbox" id="reversed">
                //     </span><span>
                //         <label for="grid-mode">Grid mode</label>
                //         <select size=1 id="grid-mode">
                //             <option value="dotted">dotted</option>
                //         </select>
                //     </span><span>
                //         <label for="legend">Legend</label>
                //         <select size=1 id="legend">
                //             <option value="in-graphics">In Graphics</option>
                //         </select>
                //     </span><span>
                //         <label for="auto-color">Auto color</label>
                //         <select size=1 id="auto-color">
                //             <option value="on-shot">on shot</option>
                //         </select>
                //     </span><span>
                //         <label for="upd-lims">Upd. limits</label>
                //         <input type="checkbox" size=1 id="upd-lims">
                //     </span>
                // </div>
            }
        </form>
        <div>
            <button id="ok-button">Ok</button>
            <button id="apply-button">Apply</button>
            <button id="reset-button">Reset</button>
            <button id="erase-button">Erase</button>
            <button id="close-button">Close</button>
        </div>
    </div>`

    function outerClick(event){
        if (!document.getElementById("form").contains(event.target)) {
            options_bg.remove();
        }
    }

    options_bg.addEventListener("click", outerClick, true);
    
    // let o = document.createElement("div");
    // o.setAttribute("id", "options");
    // o.classList.add("options", "panel-form");
    // options_bg.appendChild(o);

    // let tree = traces[index].tree;
    // let t = document.createElement("div");
    // t.classList.add("form-element");
    // t.innerText = "Tree: ";
    // let ti = document.createElement("input");
    // ti.type = "text";
    // ti.value = traces[index].tree;
    // ti.addEventListener("change", (e) => tree = e.target.value);
    // t.appendChild(ti);
    // o.appendChild(t);
    
    // let shot = traces[index].shot;
    // let s = document.createElement("div");
    // s.classList.add("form-element");
    // s.innerText = "Shot: ";
    // let si = document.createElement("input");
    // si.type = "text";
    // si.value = shot;
    // si.addEventListener("change", (e) => shot = e.target.value);
    // s.appendChild(si);
    // o.appendChild(s);
    
    // let default_node = traces[index].default_node;
    // let dn = document.createElement("div");
    // dn.classList.add("form-element");
    // dn.innerText = "Default Node: ";
    // let dni = document.createElement("input");
    // dni.type = "text";
    // dni.value = default_node;
    // dni.addEventListener("change", (e) => default_node = e.target.value);
    // dn.appendChild(dni);
    // o.appendChild(dn);
    
    // let y_expr = traces[index].y_expr;
    // let y = document.createElement("div");
    // y.classList.add("form-element");
    // y.innerText = "Y: ";
    // let yi = document.createElement("input");
    // yi.type = "text";
    // yi.value = y_expr;
    // yi.addEventListener("change", (e) => y_expr = e.target.value);
    // y.appendChild(yi);
    // o.appendChild(y);
    
    // let x_expr = traces[index].x_expr;
    // let x = document.createElement("div");
    // x.classList.add("form-element");
    // x.innerText = "X: ";
    // let xi = document.createElement("input");
    // xi.type = "text";
    // xi.value = x_expr;
    // xi.addEventListener("change", (e) => x_expr = e.target.value);
    // x.appendChild(xi);
    // o.appendChild(x);

    // let button = document.createElement("button");
    // button.setAttribute("id", `update-${id}`);
    // button.addEventListener("click", () => {
    //     // TODO: Fix this to work with multi trace
    //     update(
    //         [new Trace(tree, shot, default_node, traces[index].title, y_expr, x_expr)],
    //         // new Trace(tree, shot, default_node, traces[index].title, `abs(y_expr)`, x_expr)
    //     )
    // });
    // button.innerText = `Update panel-${id}`;

    // function closeEvent() {
    //     options_bg.remove();
    // }

    // function outerClick(event){
    //     if (!o.contains(event.target)) {
    //         options_bg.remove();
    //     }
    // }

    // let close = document.createElement("button");
    // close.setAttribute("id", "close");
    // close.innerText="close";
    // close.addEventListener("click", closeEvent, true);


    // options_bg.addEventListener("click", outerClick, true);

    // o.appendChild(button);
    // o.appendChild(close);

    // return(options_bg);
}