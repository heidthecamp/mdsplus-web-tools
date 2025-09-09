
let gopts;


export default class Global_Optinos {


    constructor (
        tree = null,
        shot = null,
        default_node = null,
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

        this.tree         = tree;
        this.shot         = shot;
        this.default_node = default_node;
        this.title        = title;
        this.y_expr       = y_expr;
        this.x_expr       = x_expr;
        this.trace_type   = trace_type;
        this.trace_color  = trace_color;
        this.point_type   = point_type;
        this.point_color  = point_color;

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

        // options_bg.addEventListener("click", outerClick, true);

        function closeEvent(e) {
            e.preventDefault();
            options_bg = document.getElementById("options_bg");
            options_bg.remove();
        }
        
        options_bg.innerHTML = `
        <div class="options panel-form">
            <form >
                <div class="form-element">
                    <label for="global-title">Title</label>
                    <input  id="global-title">
                </div>
                <div class="form-element">
                    <label for="global-x-label">X Label</label>
                    <input  id="global-x-label">
                </div>
                <div class="form-element">
                    <label for="global-y-label">Y Label</label>
                    <input  id="global-y-label">
                </div>
                <div class="form-element">
                    <label for="global-x-min">X min</label>
                    <input  id="global-x-min">
                </div>
                <div class="form-element">
                    <label for="global-y-min">Y min</label>
                    <input  id="global-y-min">
                </div>
                <div class="form-element">
                    <label for="global-x-max">X max</label>
                    <input  id="global-x-max">
                </div>
                <div class="form-element">
                    <label for="global-y-max">X max</label>
                    <input  id="global-y-max">
                </div>
                <div class="form-element">
                    <label for="global-tree-input">Tree:</label> 
                    <input id="global-tree-input" name="global-tree-input" type="text" value="${this.tree}">
                </div>
                <div class="form-element">
                    <label for="global-shot-input">Shot:</label>
                    <input id="global-shot-input" name="global-shot-input" type="text" value="${this.shot}">
                </div>
                <div class="form-element">
                    <label for="global-update-event">Update event</label>
                    <input disabled id="global-update-event">
                </div>
                <div class="form-element">
                    <label for="global-default-node-input">Default Node:</label>
                    <input id="global-default-node-input" name="global-default-node-input" type="text">
                </div>
                <div class="form-element">
                    <label for=""></label>
                    <input  id="">
                </div>

                <button id="update onclick="update">Update</button>
                <button id="apply-close" onclick="() => update(); closeEvent();">Update and close</button>
            </form>

            <button id="close-button" >Close</button>
            </div>
            `
            
            document.getElementById("close-button").addEventListener("click", closeEvent);

        // let o = document.createElement("div");
        // o.setAttribute("id", "options");
        // o.classList.add("options", "panel-form");
        // options_bg.appendChild(o);

        // let tree = this.tree;
        // let t = document.createElement("div");
        // t.classList.add("form-element");
        // t.innerText = "Tree: ";
        // let ti = document.createElement("input");
        // ti.type = "text";
        // ti.value = this.tree;
        // ti.addEventListener("change", (e) => tree = e.target.value);
        // t.appendChild(ti);
        // o.appendChild(t);
        
        // let shot = this.shot;
        // let s = document.createElement("div");
        // s.classList.add("form-element");
        // s.innerText = "Shot: ";
        // let si = document.createElement("input");
        // si.type = "text";
        // si.value = shot;
        // si.addEventListener("change", (e) => shot = e.target.value);
        // s.appendChild(si);
        // o.appendChild(s);
        
        // let default_node = this.default_node;
        // let dn = document.createElement("div");
        // dn.classList.add("form-element");
        // dn.innerText = "Default Node: ";
        // let dni = document.createElement("input");
        // dni.type = "text";
        // dni.value = default_node;
        // dni.addEventListener("change", (e) => default_node = e.target.value);
        // dn.appendChild(dni);
        // o.appendChild(dn);
        
        // let y_expr = this.y_expr;
        // let y = document.createElement("div");
        // y.classList.add("form-element");
        // y.innerText = "Y: ";
        // let yi = document.createElement("input");
        // yi.type = "text";
        // yi.value = y_expr;
        // yi.addEventListener("change", (e) => y_expr = e.target.value);
        // y.appendChild(yi);
        // o.appendChild(y);
        
        // let x_expr = this.x_expr;
        // let x = document.createElement("div");
        // x.classList.add("form-element");
        // x.innerText = "X: ";
        // let xi = document.createElement("input");
        // xi.type = "text";
        // xi.value = x_expr;
        // xi.addEventListener("change", (e) => x_expr = e.target.value);
        // x.appendChild(xi);
        // o.appendChild(x);

        // button.innerText = `Update panel-${id}`;

        // let close = document.createElement("button");
        // close.setAttribute("id", "close");
        // close.innerText="close";
        // close.addEventListener("click", closeEvent, true);

        // o.appendChild(button);
        // o.appendChild(close);

        // return(options_bg);
    }
}
