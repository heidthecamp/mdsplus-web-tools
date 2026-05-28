import { Bounds } from "./bounds.js";
import { Connection } from "./connection.js";
import { Scope } from "./scope.js";
import { GlobalDefaults, GlobalDefaultsFlags } from "./defaults.js";

let NextId = 1;

export class Panel
{
    constructor(
        title = null,
        position = {},
        y_min = null,
        y_max = null,
        x_min = null,
        x_max = null,
        use_canvas = null,
        global_defaults_mask = 0xFFFF,
    ) {
        this.id = NextId++;
        this.title_expr = title;

        this.setConnection(Connection.current);

        this.global_defaults_flags = GlobalDefaultsFlags.fromMask(global_defaults_mask);

        if (y_min !== null) {
            this.global_defaults_flags.y_min = false;
        }
        if (y_max !== null) {
            this.global_defaults_flags.y_max = false;
        }
        if (x_min !== null) {
            this.global_defaults_flags.x_min = false;
        }
        if (x_max !== null) {
            this.global_defaults_flags.x_max = false;
        }
        if (use_canvas !== null) {
            this.global_defaults_flags.useCanvas = false;
        }

        this.tree = [];
        this.shot = [];
        this.default_node = [];
        this.y_expr = [];
        this.y_min = y_min;
        this.y_max = y_max;
        this.x_expr = [];
        this.x_min = x_min;
        this.x_max = x_max;
        this.trace_type = [];
        this.trace_color = [];
        this.point_type = [];
        this.point_color = [];

        this.useCanvas = !!use_canvas;
        this.title = null;
        this.data = [];
        this.viewStack = [];
        this.viewport = new Bounds();

        this.line = [];

        this.addElement(position);
    }

    setConnection(conn) {
        if (conn == null) {
            this.connection = new Connection();
        }
        else {
            this.connection = conn;
        }
    }

    addTrace(
        tree = null,
        shot = null,
        default_node = null,
        y_expr = null,
        x_expr = null,
        trace_type = "line",
        trace_color = "steelblue",
        point_type = null,
        point_color = null,
    ) {
        this.tree.push(tree);
        this.shot.push(shot);
        this.default_node.push(default_node);
        this.y_expr.push(y_expr);
        this.x_expr.push(x_expr);
        this.trace_type.push(trace_type);
        this.trace_color.push(trace_color);
        this.point_type.push(point_type);
        this.point_color.push(point_color);

        if (tree !== null) {
            this.global_defaults_flags.tree = false;
        }
        if (shot !== null) {
            this.global_defaults_flags.shot = false;
        }
        if (default_node !== null) {
            this.global_defaults_flags.default_node = false;
        }
        if (y_expr !== null) {
            this.global_defaults_flags.y_expr = false;
        }
        if (x_expr !== null) {
            this.global_defaults_flags.x_expr = false;
        }
    }

    addElement(position = {}) {
        if (!position.hasOwnProperty('x')) {
            position.x = null;
        }

        if (!position.hasOwnProperty('y')) {
            position.y = null;
        }

        if (!position.hasOwnProperty('width')) {
            position.width = 6;
        }

        if (!position.hasOwnProperty('height')) {
            position.height = 2;
        }

        this.widget = Scope.grid.addWidget({
            w: position.width,
            h: position.height,
            x: position.x,
            y: position.y,
            id: this.id,
            // This wants a string, not an HTML Element
            content: document.getElementById('panel-template').innerHTML,
        });

        this.widget.querySelectorAll('*[data-action="edit"]')
            .forEach((node) => {
                node.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.edit();
                });
            });

        this.widget.querySelectorAll('*[data-action="remove"]')
            .forEach((node) => {
                node.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.removeElement();
                });
            });
            
        this.widget.querySelectorAll('*[data-action="auto-x-y"]')
            .forEach((node) => {
                node.addEventListener('click', async (e) => {
                    e.preventDefault();
                    this.setViewport(this.autoXY(this.viewport));
                    this.render();
                })
            });

        this.widget.querySelectorAll('*[data-action="auto-x"]')
            .forEach((node) => {
                node.addEventListener('click', async (e) => {
                    e.preventDefault();
                    this.setViewport(this.autoX(this.viewport));
                    this.render();
                })
            });

        this.widget.querySelectorAll('*[data-action="auto-y"]')
            .forEach((node) => {
                node.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.setViewport(this.autoY(this.viewport));
                    this.render();
                })
            });

        this.widget.querySelectorAll('*[data-action="all-x-auto-y"]')
            .forEach((node) => {
                node.addEventListener('click', (e) => {
                    e.preventDefault();
                    let v = this.getViewport();
                    for(let i = 0; i < Scope.panels.length; ++i) {
                        Scope.panels[i].setViewport(Scope.panels[i].autoY(v));
                        Scope.panels[i].render();
                    }
                })
            });
    }

    removeElement() {
        // TODO: call Scope.grid.removeWidget, and null out widget
        // TODO: 
        // document.getElementById(`panel-${this.id}`).remove();

        Scope.grid.removeWidget(this.widget, true, true);

        // TODO: Move into Scope.removePanel or something
        let index = Scope.panels.indexOf(this);
        Scope.panels.splice(index, 1);
    }

    async calculateBounds(boundArray) {
        let bounds = boundArray[0];
        for (var i = 1; i < boundArray.length; ++i) {
            bounds.join(boundArray[i]);
        }

        let request = [];

        let xMin = this.getValueOrDefault('x_min');
        if (!!xMin) {
            request.push([ 'x_min', xMin ]);
        }
        
        let xMax = this.getValueOrDefault('x_max');
        if (!!xMax) {
            request.push([ 'x_max', xMax ]);
        }

        let yMin = this.getValueOrDefault('y_min');
        if (!!yMin) {
            request.push([ 'y_min', yMin ]);
        }
        
        let yMax = this.getValueOrDefault('y_max');
        if (!!yMax) {
            request.push([ 'y_max', yMax ]);
        }

        // TODO: Move to Panel.update()
        if (request.length > 0) {
            await this.connection.getMany(request)
            .then((response) => {
                // TODO: error handling
                if (response.hasOwnProperty('x_min')) {
                    bounds.xMin = response.x_min.value;
                }

                if (response.hasOwnProperty('x_max')) {
                    bounds.xMax = response.x_max.value;
                }

                if (response.hasOwnProperty('y_min')) {
                    bounds.yMin = response.y_min.value;
                }

                if (response.hasOwnProperty('y_max')) {
                    bounds.yMax = response.y_max.value;
                }

            });
        }

        if (! (!!yMin || !!yMax)){
            return this.autoY(bounds);
        }
        return bounds;
    }

    getViewport() {
        return this.viewport;
    }

    setViewport(view) {
        this.viewStack.push(view);
        this.viewport = this.viewStack[this.viewStack.length - 1];
    }

    autoX(view) {
        let b = new Bounds()
        b.yMin = view.yMin;
        b.yMax = view.yMax;
        
        for (let h = 0; h < this.data.length; h++){
            for (let i = 0; i < this.data[h].length; ++i) {
                for (let j = 0; j < this.data[h][i].length; ++j){
                    let val = this.data[h][i][j];
                    b.extend(val[0], NaN);
                }
            }
        }
        
        return b;
    }

    autoY(view) {
        let b = new Bounds()
        b.xMin = view.xMin;
        b.xMax = view.xMax;
        for (let h = 0; h < this.data.length; h++){
            for (let i = 0; i < this.data[h].length; ++i) {
                for (let j = 0; j < this.data[h][i].length; ++j){
                    let val = this.data[h][i][j];
                    if (
                        view.xMin < val[0] &&
                        val[0] < view.xMax
                    ) {
                        b.extend(val[0], val[1]);
                    }
                }
            }
        }
        
        return b;
    }

    autoXY(view) {
        let b = new Bounds()
        b.yMin = view.yMin;
        b.yMax = view.yMax;
        b.xMin = view.xMin;
        b.xMax = view.xMax;
        
        for (let h = 0; h < this.data.length; h++){
            for (let i = 0; i < this.data[h].length; ++i) {
                for (let j = 0; j < this.data[h][i].length; ++j){
                    let val = this.data[h][i][j];
                    b.extend(val[0], val[1]);
                }
            }
        }
        
        return b;
    }

    // TODO: Improve by adding more general event listeners and using data-id

    // TODO: Improve
    addTraceForm(id) {
        let traceFormTemplate = document.querySelector('#trace-form-template');

        // Create a form for the trace
        let $traceForm = document.createElement('li');
        $traceForm.id = `trace-form-${id}`;
        $traceForm.dataset.id = id;
        $traceForm.classList.add('trace-form');
        $traceForm.appendChild(traceFormTemplate.content.cloneNode(true));

        // Append the trace ID to the input IDs
        $traceForm.querySelectorAll('input').forEach(node => {
            node.id += `-${id}`;
        });
        // Update the labels to match the new input IDs
        $traceForm.querySelectorAll('label').forEach(node => {
            node.htmlFor += `-${id}`;
        });

        document.querySelector('#trace-forms').appendChild($traceForm);

        // Add a tab for the trace
        let $traceTab = document.createElement('li');
        $traceTab.id = `trace-tab-${id}`;
        $traceTab.classList.add('trace-tab');
        $traceTab.classList.add('nav-item');
        
        let $traceLink = document.createElement('a');
        $traceLink.innerText = `Trace #${id}`;
        $traceLink.classList.add('nav-link', 'active');
        $traceLink.role = 'button';

        $traceTab.appendChild($traceLink);

        document.querySelector('#trace-form-tabs').appendChild($traceTab);

        document.querySelector(`#trace-tab-${id}`)
            .addEventListener('click', (e) => {

                document.querySelectorAll('.trace-tab a').forEach(node => {
                    node.classList.remove('active');
                });
                $traceLink.classList.add('active');

                document.querySelectorAll('.trace-form').forEach(node => {
                    node.classList.remove('shown');
                });
                $traceForm.classList.add('shown');
            });


        this.setupGlobalDefaults('y_expr', `trace-y_expr-${id}`, `trace-y_expr-default`);
        this.setupGlobalDefaults('x_expr', `trace-x_expr-${id}`, `trace-x_expr-default`);
        this.setupGlobalDefaults('tree', `trace-tree-${id}`, `trace-tree-default`);
        this.setupGlobalDefaults('shot', `trace-shot-${id}`, `trace-shot-default`);
        this.setupGlobalDefaults('default_node', `trace-default_node-${id}`, `trace-default_node-default`);

        let valueOrEmpty = (value) => {
            if (value === null || typeof value == "undefined"){
                return "";
            }
            return value
        }

        document.querySelector('#panel-title_expr').value = valueOrEmpty(this.title_expr);
        document.querySelector('#panel-y-min').value = valueOrEmpty(this.y_min);
        document.querySelector('#panel-y-max').value = valueOrEmpty(this.y_max);
        document.querySelector('#panel-x-min').value = valueOrEmpty(this.x_min);
        document.querySelector('#panel-x-max').value = valueOrEmpty(this.x_max);
        document.querySelector('#panel-use-canvas').checked = this.useCanvas;

        // Update the form values
        // TODO: Improve
        document.querySelector(`#trace-y_expr-${id}`).value = valueOrEmpty(this.y_expr[id - 1]);
        document.querySelector(`#trace-x_expr-${id}`).value = valueOrEmpty(this.x_expr[id - 1]);
        document.querySelector(`#trace-tree-${id}`).value = valueOrEmpty(this.tree[id - 1]);
        document.querySelector(`#trace-shot-${id}`).value = valueOrEmpty(this.shot[id - 1]);
        document.querySelector(`#trace-default_node-${id}`).value = valueOrEmpty(this.default_node[id - 1]);
        let color = valueOrEmpty(this.trace_color[id - 1]);
        if (color == ""){
            color = "steelblue"
        }
        document.querySelector(`#trace-color-${id}`).value = color;
        
    }

    edit() {
        let $overlay = document.getElementById('overlay');

        // Clear out the overlay
        $overlay.innerHTML = '';

        // Show the overlay
        $overlay.classList.add('shown');

        // Fill the overlay with the default panel form
        let panelFormTemplate = document.getElementById('panel-form-template');
        $overlay.appendChild(panelFormTemplate.content.cloneNode(true));

        for (var i = 0; i < this.tree.length; ++i) {
            let id = i + 1;

            // Add the form to the document
            this.addTraceForm(id);
        }

        if (this.tree.length == 0) {
            this.addTraceForm(1);
        }

        // TODO: Improve
        // Create classes / functions? setTraceFormActive() ?
        document.getElementById(`trace-tab-1`).click();

        let $panelForm = document.getElementById('panel-form');
        $panelForm.dataset.nextDataId = this.tree.length + 1;

        this.setupGlobalDefaults('title_expr', 'panel-title_expr', 'panel-title_expr-default');
        this.setupGlobalDefaults('y_min', 'panel-y-min', 'panel-y-min-default');
        this.setupGlobalDefaults('y_max', 'panel-y-max', 'panel-y-max-default');
        this.setupGlobalDefaults('x_min', 'panel-x-min', 'panel-x-min-default');
        this.setupGlobalDefaults('x_max', 'panel-x-max', 'panel-x-max-default');
        this.setupGlobalDefaults('useCanvas', 'panel-use-canvas', 'panel-use-canvas-default');

        // TODO: Improve
        document.querySelectorAll(`#panel-form *[data-action="add-trace"]`)
            .forEach((node) => {
                node.addEventListener('click', (e) => {
                    let id = parseInt($panelForm.dataset.nextDataId);
                    $panelForm.dataset.nextDataId = id + 1;

                    // Add the form to the document
                    this.addTraceForm(id);

                    // HACK: Set the form as active
                    document.getElementById(`trace-tab-${id}`).click();
                });
            });

        document.querySelectorAll(`#panel-form *[data-action="save"]`)
            .forEach((node) => {
                node.addEventListener('click', (e) => {
                    let valueOrNull = (value) => {
                        if (value.trim() == ""){
                            return null;
                        }
                        return value
                    }

                    let needUpdate = false;

                    let updateValue = (property, id, index = null) => {
                        let value = valueOrNull(document.getElementById(id).value);
                        if (index != null) {
                            if (this[property][index] != value) {
                                console.log(property, index, 'changed');
                                needUpdate = true;
                                this[property][index] = value;
                            }
                        }
                        else {
                            if (this[property] != value) {
                                console.log(property, 'changed');
                                needUpdate = true;
                                this[property] = value;
                            }
                        }
                    };

                    let updateDefault = (property, id) => {
                        let checked = document.getElementById(id).checked;
                        if (this.global_defaults_flags[property] != checked) {
                            console.log(property, 'default changed');
                            needUpdate = true;
                            this.global_defaults_flags[property] = checked;
                        }
                    }

                    let $traceForms = document.querySelectorAll('.trace-form');

                    updateDefault('title_expr', 'panel-title_expr-default');
                    updateDefault('y_min', 'panel-y-min-default');
                    updateDefault('y_max', 'panel-y-max-default');
                    updateDefault('x_min', 'panel-x-min-default');
                    updateDefault('x_max', 'panel-x-max-default');

                    updateDefault('tree', 'trace-tree-default');
                    updateDefault('shot', 'trace-shot-default');
                    updateDefault('default_node', 'trace-default_node-default');
                    updateDefault('y_expr', 'trace-y_expr-default');
                    updateDefault('x_expr', 'trace-x_expr-default');

                    updateValue('title_expr', 'panel-title_expr');
                    updateValue('y_min', 'panel-y-min');
                    updateValue('y_max', 'panel-y-max');
                    updateValue('x_min', 'panel-x-min');
                    updateValue('x_max', 'panel-x-max');

                    for (var i = 0; i < $traceForms.length; ++i) {
                        let id = parseInt($traceForms[i].dataset.id);
                        
                        updateValue('tree', `trace-tree-${id}`, i);
                        updateValue('shot', `trace-shot-${id}`, i);
                        updateValue('default_node', `trace-default_node-${id}`, i);
                        updateValue('y_expr', `trace-y_expr-${id}`, i);
                        updateValue('x_expr', `trace-x_expr-${id}`, i);
                        updateValue('trace_color', `trace-color-${id}`, i);
                    }

                    // Note: To avoid updating when only changing the value of useCanvas
                    let needRender = false;

                    let checked = document.getElementById('panel-use-canvas-default').checked;
                    if (this.global_defaults_flags['useCanvas'] != checked) {
                        needRender = true;
                        this.global_defaults_flags['useCanvas'] = checked;
                    }

                    checked = document.getElementById('panel-use-canvas').checked;
                    if (this.useCanvas != checked) {
                        needRender = true;
                        this.useCanvas = checked;
                    }

                    $overlay.innerHTML = '';
                    $overlay.classList.remove('shown');

                    if (needUpdate) {
                        this.update();
                    }
                    else if (needRender) {
                        this.render();
                    }
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
    }

    // TODO: Replace this.tree.length with traceCount or something

    showError(message) {
        console.error(message);
        this.widget.querySelector('.plot').innerHTML = `<div class="error">${message}</div>`;
        this.widget.style.opacity = 1;
    }

    async update() {
        let tree;
        let shot;
        let default_node;

        this.widget.style.opacity = 0.2;
        let $error = this.widget.querySelector('.error');
        if ($error != null) {
            $error.remove();
        }

        let boundsArray = [];
        this.data = [];
        for (var i = 0; i < this.tree.length; ++i) {
            let request = [];

            tree = this.getValueOrDefault('tree', i);
            shot = this.getValueOrDefault('shot', i);

            // TODO: Figure out why !== doesn't work
            if (tree != null) {
                if (shot != null) {
                    request.push(['open', `TreeOpen("${tree}",${shot})`])
                }
                else {
                    request.push(['open', `TreeOpen("${tree}",0)`])
                }
            }

            default_node = this.getValueOrDefault('default_node', i);
            if (default_node == null) {
                default_node = 'TreeSetDefault("\\\\TOP")';
            }
            else {
                default_node = `TreeSetDefault("${default_node.replace('\\', '\\\\')}")`;
            }

            // TODO: Only call if needed?
            request.push([ 'default_node', default_node ]);

            let y_expr = this.getValueOrDefault('y_expr', i);
            let x_expr = this.getValueOrDefault('x_expr', i);

            if (request.y_expr == null) {
                // Freak out
            }

            // TODO: Improve
            // Fallback default
            if (x_expr == null || x_expr == '') {
                y_expr = `_wssig=(${y_expr})`;
                x_expr = 'dim_of(_wssig)';
            }

            request.push([ 'y_expr', y_expr ]);
            request.push([ 'x_expr', x_expr ]);
            // TODO: Include xmin/ymin/xmax/ymax in this request rather than in calculate bounds? maybe?

            await this.connection.getMany(request)
            .then((response) => {

                let y_data = null;
                if (response.hasOwnProperty('y_expr')) {
                    if (response.y_expr.hasOwnProperty('error')) {
                        this.showError(response.y_expr.error);
                        return;
                    }
                    
                    y_data = response.y_expr.value;
                }

                let x_data = null;
                if (response.hasOwnProperty('x_expr')) {
                    if (response.x_expr.hasOwnProperty('error')) {
                        this.showError(response.x_expr.error);
                        return;
                    }
                    
                    x_data = response.x_expr.value;
                }

                if (y_data === null || x_data === null) {
                    this.showError(`Could not retrieve x or y data\ny_data: ${y_data}\nx_data: ${x_data}`);
                    return
                }
                // y truncates to match x.
                else if (y_data.length < x_data.length) {
                    this.showError('Length mismatch len(y) < len(x)');
                    return;
                }

                let data = [[]];
                let bounds = new Bounds(x_data[0], x_data[0], y_data[0], y_data[0]);
                for (var i = 0; i < x_data.length; ++i) {
                    let x = x_data[i];
                    let y = y_data[i];

                    // Check for NaN and Infinity
                    if (!isFinite(x) || !isFinite(y)) {
                        if (data.at(-1).length > 0) {
                            data.push([]);
                        }
                        continue;
                    }

                    data.at(-1).push([x, y]);
                    bounds.extend(x, y);
                }
                
                this.data.push(data);
                boundsArray.push(bounds);

                window.data = this.data;

            });
        
            this.viewStack = [];
            this.viewStack.push(await this.calculateBounds(boundsArray));
            this.viewport = this.viewStack[0];

            this.render();
        }
    }

    async render() {
        if (this.widget.querySelector('.error') != null) {
            return;
        }

        if (this.tree.length == 0) {
            return;
        }

        let $plot = this.widget.querySelector('.plot');
        $plot.innerHTML = '';
        
        let plotRect = $plot.getBoundingClientRect();

        let margin = {
            left: 60,
            right: 10,
            top: 10,
            bottom: 30,
        };

        let svgWidth = plotRect.width;
        let svgHeight = plotRect.height;

        let dataWidth = plotRect.width - margin.left - margin.right;
        let dataHeight = plotRect.height - margin.top - margin.bottom;

        if (this.getValueOrDefault('useCanvas')) {
            $plot.innerHTML = '';

            let canvas = document.createElement('canvas');
            // canvas.style.marginLeft = 60;
            // canvas.style.marginTop = 10;
            canvas.width = svgWidth;
            canvas.height = svgHeight;
            $plot.appendChild(canvas);

            /** @{CanvasRenderingContext2D} */
            let ctx = canvas.getContext('2d');
            // ctx.fillStyle = 'black';
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            // ctx.fill();

            let viewportWidth = (this.viewport.xMax - this.viewport.xMin);
            let viewportHeight = (this.viewport.yMax - this.viewport.yMin);

            let scaleX = (value) => {
                return (((value - this.viewport.xMin) / viewportWidth) * dataWidth) + margin.left;
            };
            let scaleY = (value) => {
                return ((1 - ((value - this.viewport.yMin) / viewportHeight)) * dataHeight) + margin.top;
            };

            ctx.lineWidth = 1.5;

            for (var i = 0; i < this.data.length; ++i) {
                if (this.trace_color[i] == null) {
                    // ctx.strokeStyle = 'white';
                    ctx.strokeStyle = 'black';
                }
                else {
                    ctx.strokeStyle = this.trace_color[i];
                }

                for (var j = 0; j < this.data[i].length; ++j) {
                    if (this.data[i][j].length == 0) {
                        continue;
                    }
                    
                    ctx.beginPath();

                    let point = this.data[i][j][0];
                    ctx.moveTo(scaleX(point[0]), scaleY(point[1]));
                    
                    for (var k = 1; k < this.data[i][j].length; ++k) {
                        point = this.data[i][j][k];
                        ctx.lineTo(scaleX(point[0]), scaleY(point[1]));
                    }

                    ctx.stroke();
                }
            }

            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, margin.top);
            ctx.fillRect(0, dataHeight + margin.top, canvas.width, margin.bottom);
            ctx.fillRect(0, 0, margin.left, canvas.height);
            ctx.fillRect(canvas.width - margin.right, 0, margin.right, canvas.height);
            // ctx.fill();

            // ctx.strokeStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(margin.left - 10, margin.top - 1);
            ctx.lineTo(margin.left, margin.top - 1);
            ctx.lineTo(margin.left, canvas.height - margin.bottom + 1 + 10);
            ctx.moveTo(margin.left - 10, canvas.height - margin.bottom + 1);
            ctx.lineTo(canvas.width - margin.right - 1, canvas.height - margin.bottom + 1);
            ctx.lineTo(canvas.width - margin.right - 1, canvas.height - margin.bottom + 1 + 10);
            ctx.stroke();

            ctx.font = 'normal 10px sans-serif';
            ctx.textBaseline = 'middle';
            // ctx.fillStyle = 'white';
            ctx.fillStyle = 'black';

            // TODO: Prefer more natural steps such as 0.5 or 10's or 0.1

            let range = (this.viewport.yMax - this.viewport.yMin);
            let midpoint = parseFloat((range / 2).toPrecision(3));
            if (this.viewport.yMax > 0 && this.viewport.yMin < 0) {
                midpoint = 0;
            }
            
            // TODO: Improve
            let gridLines = Math.floor(dataHeight / 20);
            let step = parseFloat((range / (gridLines - 1)).toPrecision(3));
            let linesAbove = Math.floor((gridLines - 1) * ((this.viewport.yMax - midpoint) / range));
            let linesBelow = Math.floor((gridLines - 1) * ((midpoint - this.viewport.yMin) / range));

            let markers = [midpoint];
            for (let i = 1; i <= linesAbove; ++i) {
                markers.push(midpoint + (i * step));
            }
            for (let i = 1; i <= linesBelow; ++i) {
                markers.push(midpoint - (i * step));
            }
            markers.sort((a, b) => a - b); // By default this sorts them as text

            for (let i = 0; i < markers.length; ++i) {
                let value = parseFloat(markers[i].toPrecision(3));

                let text = value.toLocaleString();
                // let text = value.toFixed(3).toString();
                
                let size = ctx.measureText(text);
                // if (size.width > (margin.left - 20)) {
                //     text = value.toExponential().toString();
                //     size = ctx.measureText(text);
                // }
                
                let offset = (1.0 - ((value - this.viewport.yMin) / range)) * dataHeight;
                ctx.fillText(text, margin.left - size.width - 12, margin.top + offset);

                ctx.moveTo(margin.left - 10, margin.top + offset);
                ctx.lineTo(margin.left, margin.top + offset);
                ctx.stroke();
            }


            range = (this.viewport.xMax - this.viewport.xMin);
            midpoint = parseFloat((range / 2).toPrecision(3));
            if (this.viewport.xMax > 0 && this.viewport.xMin < 0) {
                midpoint = 0;
            }
            
            gridLines = Math.floor(dataWidth / 120);
            step = parseFloat((range / (gridLines - 1)).toPrecision(3));
            linesAbove = Math.floor((gridLines - 1) * ((this.viewport.xMax - midpoint) / range));
            linesBelow = Math.floor((gridLines - 1) * ((midpoint - this.viewport.xMin) / range));

            markers = [midpoint];
            for (let i = 1; i <= linesAbove; ++i) {
                markers.push(midpoint + (i * step));
            }
            for (let i = 1; i <= linesBelow; ++i) {
                markers.push(midpoint - (i * step));
            }
            markers.sort((a, b) => a - b); // By default this sorts them as text

            for (let i = 0; i < markers.length; ++i) {
                let value = parseFloat(markers[i].toPrecision(3));

                let text = value.toLocaleString();
                // let text = value.toFixed(3).toString();
                
                let size = ctx.measureText(text);
                // if (size.width > (margin.left - 20)) {
                //     text = value.toExponential().toString();
                //     size = ctx.measureText(text);
                // }
                
                let offset = ((value - this.viewport.xMin) / range) * dataWidth;
                ctx.fillText(text, margin.left - (size.width / 2) + offset, margin.top + dataHeight + 20);

                ctx.moveTo(margin.left + offset, margin.top + dataHeight);
                ctx.lineTo(margin.left + offset, margin.top + dataHeight + 10);
                ctx.stroke();
            }
        }
        else {
            const svg = d3.select($plot)
                .html(null)
                .append('svg')
                    .attr('width', svgWidth)
                    .attr('height', svgHeight)
                .append('g')
                    .attr('transform',
                        `translate(60,10)`
                    );

            const xScale = d3.scaleLinear()
                .domain([ this.viewport.xMin, this.viewport.xMax ])
                .range([ 0, dataWidth ]);

            let xAxis = svg.append('g')
                .attr('transform', `translate(0,${dataHeight})`)
                .call(d3.axisBottom(xScale));

            const yScale = d3.scaleLinear()
                .domain([ this.viewport.yMin, this.viewport.yMax ])
                .range([ dataHeight, 0 ]);
            
            let yAxis = svg.append('g')
                .call(d3.axisLeft(yScale));
                
            let clip = svg.append('defs').append('SVG:clipPath')
                .attr('id', `clip-${this.id}`) // Turns out that ID's within SVGs can be referenced by other SVGs
                .append('svg:rect')
                .attr('width', dataWidth)
                .attr('height', dataHeight)
                .attr('x', 0)
                .attr('y', 0);

            this.line = [];
            // TODO: Handle NaN's breaking lines
            for (var i = 0; i < this.data.length; ++i) {
                let lines = [];
                for (var j = 0; j < this.data[i].length; ++j) {
                    if (this.data[i][j].length == 1) {
                        svg.selectAll("myPoints")
                            .data(this.data[i][j])
                            .enter()
                            .append('circle')
                            .attr("stroke-width", .75)
                            .attr('fill', this.trace_color[i])
                            .attr("stroke", this.trace_color[i])
                            .attr("cx", d => xScale(d[0]))
                            .attr("cy", d => yScale(d[1]))
                            .attr("r", .75);
                    }
                    let line = svg.append('g')
                        .attr('clip-path', `url(#clip-${this.id})`)
                        .append('path')
                            .datum(this.data[i][j])
                            .attr('class', 'line')
                            .attr('fill', 'none')
                            .attr('stroke', this.trace_color[i])
                            .attr('stroke-width', 1.5)
                            .attr('d', d3.line()
                                .x((d) => xScale(d[0]))
                                .y((d) => yScale(d[1]))
                            );
                    lines.push(line);
                }
                this.line.push(lines);
            }

            const brush = d3.brush()
                .extent([[0, 0],[dataWidth, dataHeight]]);
                // .on('end', zoomChart);
            
            var zoom_brush = svg.append('g')
                .attr('clip-path', `url(#clip-${this.id})`)
                .append('g')
                .attr('class', 'brush')
                .call(brush);

            let zoomChart = (e) => {
                // the selected boundries
                let extent = e.selection;
                
                if (!extent) {
                    return;
                    // brush.end seems to be called on `call(brush.move, null)`
                    // Setting the domains here will clear zooming.
                } else {
                    let bounds = new Bounds;
                    bounds.xMin = xScale.invert(extent[0][0]);
                    bounds.xMax = xScale.invert(extent[1][0]);
                    bounds.yMin = yScale.invert(extent[1][1]);
                    bounds.yMax = yScale.invert(extent[0][1]);

                    this.viewStack.push(bounds);
                    this.viewport = this.viewStack[this.viewStack.length - 1];

                    xScale.domain([this.viewport.xMin, this.viewport.xMax]);
                    yScale.domain([this.viewport.yMin, this.viewport.yMax]);
                    
                    zoom_brush.call(brush.move, null);
                }

                xAxis.transition().call(d3.axisBottom(xScale));
                yAxis.transition().call(d3.axisLeft(yScale));

                svg.selectAll('circle')
                    .attr('cx', function(d) { return xScale(d[0])})
                    .attr('cy', function(d) { return yScale(d[1])})
                    .transition();

                for (var i = 0; i < this.line.length; ++i) {
                    for (var j = 0; j < this.line[i].length; ++j) {
                        if (this.data[i][j].length != 1) {
                            this.line[i][j]
                            .transition()
                            .attr('d', d3.line()
                                .x(function (d) { return xScale(d[0])} )
                                .y(function (d) { return yScale(d[1])} )
                            );
                        }
                    }
                }
            }

            svg.on("dblclick", async() => {
                // this.viewStack = [this.viewStack[0]];
                this.viewStack.pop();
                this.viewport = this.viewStack[this.viewStack.length - 1];

                xScale.domain([ this.viewport.xMin, this.viewport.xMax ])
                yScale.domain([ this.viewport.yMin, this.viewport.yMax ])
                xAxis.transition().call(d3.axisBottom(xScale));
                yAxis.transition().call(d3.axisLeft(yScale));

                let points = svg.selectAll('circle');

                points
                .attr('cx', function(d) { return xScale(d[0])})
                .attr('cy', function(d) { return yScale(d[1])})
                .transition();

                for (var i = 0; i < this.line.length; ++i) {
                    for (var j = 0; j < this.line[i].length; ++j) {
                        if (this.data[i][j].length != 1) {
                            this.line[i][j]
                                .transition()
                                .attr('d', d3.line()
                                    .x(function (d) { return xScale(d[0])} )
                                    .y(function (d) { return yScale(d[1])} )
                                );
                        }
                    }
                }

                zoom_brush.call(brush.move, null);
            });

            brush.on('end', zoomChart);
        }

        this.widget.style.opacity = 1;

        let request = [];
        if (this.global_defaults_flags['title']){
            request.push([ 'title', Scope.defaults.title_expr ]);
        }
        else if (this.title_expr) {
            request.push([ 'title', this.title_expr ]);
        }

        let $title = this.widget.querySelector('.title');
        if (request.length > 0) {
            await this.connection.getMany(request)
            .then((response) => {
                if (response.title.hasOwnProperty('error')) {
                    console.error('Title', response.title.error);
                    return;
                }
                this.title = response.title.value;
            });
    
            $title.innerText = this.title;
        }
        else {
            $title.innerText = '';
        }

    }

    setupGlobalDefaults(property, inputId=null, checkboxId=null) {
        let $input = document.getElementById(inputId);
        let $checkbox = document.getElementById(checkboxId);

        $checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                $input.disabled = true;
                $input.placeholder = Scope.defaults[property] ? Scope.defaults[property] : '';
            }
            else {
                $input.disabled = false;
                $input.placeholder = '';
            }
        });


        try {
            $checkbox.checked = this.global_defaults_flags[property];
        } catch(e) {
            console.error(e);
            $checkbox.checked = true;
        }
        
        // TODO: Remove, this should be automatic when onchange is called
        if ($checkbox.checked) {
            $input.disabled = true;
            $input.placeholder = Scope.defaults[property] ? Scope.defaults[property] : '';
        }
    }

    getValueOrDefault(property, trace = null) {
        if (this.global_defaults_flags[property] && Scope.defaults[property] !== null) {
            return Scope.defaults[property];
        }

        if (trace !== null) {
            return this[property][trace];
        }
        else {
            return this[property];
        }
    }
};