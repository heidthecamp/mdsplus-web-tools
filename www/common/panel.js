import { Bounds } from "./bounds.js";
import { Position } from "./position.js";
import { Connection } from "./connection.js";
import { Scope } from "./scope.js";
import { GlobalDefaults, GlobalDefaultsFlags } from "../scope/defaults.js";

import { D3Renderer, CanvasRenderer, Renderer } from "./renderer.js";
import { MDSplusTrace } from "./trace.js";
import { Traverser } from "./traverser.js";

let NextId = 1;

export class Panel
{
    constructor(
        title = null,
        position = new Position(),
    ) {
        this.id = NextId++;

        this.title = title;

        this.traces = [];

        this.viewStack = [];

        this.addElement(position);
    }

    update() {
        // virtual
    }

    async render() {
        this.renderer.render();
    }

    edit() {
        // virtual
    }

    setRendererClass(rendererClass) {
        if (!(this.renderer instanceof rendererClass)) {
            let old_renderer = this.renderer;

            this.renderer = new rendererClass(this.widget.querySelector('.plot'), this);

            if (old_renderer != null) {
                // TODO: Think about
                // this.renderer.viewStack = old_renderer.viewStack;
                old_renderer.remove();
            }

            this.render();

            return false;
        }

        return true;
    }

    autoX(view) {
        let b = new Bounds()
        b.yMin = view.yMin;
        b.yMax = view.yMax;
        
        // For every trace...
        for (let i = 0; i < this.traces.length; i++){
            // For every line...
            for (let j = 0; j < this.traces[i].initial_data.length; ++j) {
                // For every point...
                for (let k = 0; k < this.traces[i].initial_data[j].length; ++k){
                    let val = this.traces[i].initial_data[j][k];
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

        // For every trace...
        for (let i = 0; i < this.traces.length; i++){
            // For every line...
            for (let j = 0; j < this.traces[i].data.length; ++j) {
                // For every point...
                for (let k = 0; k < this.traces[i].data[j].length; ++k){
                    let val = this.traces[i].data[j][k];
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
        
        // For every trace...
        for (let i = 0; i < this.traces.length; i++){
            // For every line...
            for (let j = 0; j < this.traces[i].initial_data.length; ++j) {
                // For every point...
                for (let k = 0; k < this.traces[i].initial_data[j].length; ++k){
                    let val = this.traces[i].initial_data[j][k];
                    b.extend(val[0], val[1]);
                }
            }
        }
        
        return b;
    }

    resetViewport() {
        this.viewStack = [];
    }

    setViewport(view) {
        this.viewStack = [view];
    }

    viewport() {
        if (this.viewStack.length > 0) {
            return this.viewStack.at(-1);
        }
        return null;
    }

    pushZoom(view) {
        if (!this.viewport().equals(view)) {
            this.viewStack.push(view);
        }
    }

    popZoom() {
        this.viewStack.pop();
    }

    position() {
        return {
            width: this.widget.gridstackNode.w,
            height: this.widget.gridstackNode.h,
            x: this.widget.gridstackNode.x,
            y: this.widget.gridstackNode.y,
        }
    }

    addElement(position = new Position()) {
        if (position.width == null) {
            position.width = 6;
        }

        if (!position.height == null) {
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
                    this.setViewport(this.autoXY(this.viewport()));
                    await this.update();
                    this.render();
                })
            });

        this.widget.querySelectorAll('*[data-action="auto-x"]')
            .forEach((node) => {
                node.addEventListener('click', async (e) => {
                    e.preventDefault();
                    this.setViewport(this.autoX(this.viewport()));
                    await this.update();
                    this.render();
                })
            });

        this.widget.querySelectorAll('*[data-action="auto-y"]')
            .forEach((node) => {
                node.addEventListener('click', async (e) => {
                    e.preventDefault();
                    this.setViewport(this.autoY(this.viewport()));
                    // await this.update(); // TODO: Is this needed?
                    this.render();
                })
            });

        this.widget.querySelectorAll('*[data-action="all-x-auto-y"]')
            .forEach((node) => {
                node.addEventListener('click', async (e) => {
                    e.preventDefault();
                    let v = this.viewport();
                    for(let i = 0; i < Scope.panels.length; ++i) {
                        Scope.panels[i].setViewport(Scope.panels[i].autoY(v));
                        await Scope.panels[i].update();
                        Scope.panels[i].render();
                    }
                })
            });
            
        this.renderer = new D3Renderer(this.widget.querySelector('.plot'), this);
    }

    removeElement() {
        // TODO: call Scope.grid.removeWidget, and null out widget
        // TODO: 
        // document.getElementById(`panel-${this.id}`).remove();

        Scope.grid.removeWidget(this.widget, true, true);

        // TODO: Move into Scope.removePanel or something
        let index = Scope.panels.indexOf(this);
        Scope.panels.splice(index, 1);

        if (this.renderer != null) {
            this.renderer.remove();
        }

        clearTimeout(window.autosaveTimeout);
        window.autosaveTimeout = setTimeout(window.autosave, 1000);
    }

}

// HACK:
export class PreviewPanel extends Panel
{
    constructor(element) {
        super();
        // TODO: Cleanup
        this.widget = element;
        this.renderer = new D3Renderer(this.widget.querySelector('.plot'), this);
    }

    addElement() {
        // override
    }

    removeElement() {
        // override
        this.renderer.remove();
    }

    setTraces(traces) {
        this.traces = traces;
    }
}

export class MDSplusPanel extends Panel
{
    constructor(
        title_expr = null,
        position = {},
        y_min_expr = null,
        y_max_expr = null,
        x_min_expr = null,
        x_max_expr = null,
        global_defaults_mask = 0xFFFF,
    ) {
        super(title_expr, position);

        this.setConnection(Connection.current);

        this.title_expr = title_expr;
        this.y_min_expr = y_min_expr;
        this.y_max_expr = y_max_expr;
        this.x_min_expr = x_min_expr;
        this.x_max_expr = x_max_expr;

        // HACK: Move away from assuming a mask
        if (global_defaults_mask instanceof GlobalDefaultsFlags) {
            this.global_defaults_flags = global_defaults_mask;
        }
        else {
            this.global_defaults_flags = GlobalDefaultsFlags.fromMask(global_defaults_mask);
        }

        if (y_min_expr !== null) {
            this.global_defaults_flags.y_min_expr = false;
        }
        if (y_max_expr !== null) {
            this.global_defaults_flags.y_max_expr = false;
        }
        if (x_min_expr !== null) {
            this.global_defaults_flags.x_min_expr = false;
        }
        if (x_max_expr !== null) {
            this.global_defaults_flags.x_max_expr = false;
        }
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
        shot_expr = null,
        default_node_expr = null,
        y_expr = null,
        x_expr = null,
        trace_type = "line",
        trace_color = "black",
        point_type = null,
        point_color = null,
    ) {
        // TODO: Improve
        if (tree !== null) {
            this.global_defaults_flags.tree = false;
        }
        if (shot_expr !== null) {
            this.global_defaults_flags.shot_expr = false;
        }
        if (default_node_expr !== null) {
            this.global_defaults_flags.default_node_expr = false;
        }
        if (y_expr !== null) {
            this.global_defaults_flags.y_expr = false;
        }
        if (x_expr !== null) {
            this.global_defaults_flags.x_expr = false;
        }

        if (shot_expr !== null && typeof shot_expr !== 'string') {
            shot_expr = shot_expr.toString();
        }

        this.traces.push(new MDSplusTrace(
            tree,
            shot_expr,
            default_node_expr,
            y_expr,
            x_expr,
            trace_type,
            trace_color,
            point_type,
            point_color
        ));
    }

    async calculateBounds()
    {
        let bounds = new Bounds();

        let request = [];

        // TODO: try/catch parseFloat to avoid call to getMany

        let x_min_expr = this.getValueOrDefault('x_min_expr');
        if (!!x_min_expr) {
            request.push([ 'x_min', `${x_min_expr}` ]);
        }
        
        let x_max_expr = this.getValueOrDefault('x_max_expr');
        if (!!x_max_expr) {
            request.push([ 'x_max', `${x_max_expr}` ]);
        }

        let y_min_expr = this.getValueOrDefault('y_min_expr');
        if (!!y_min_expr) {
            request.push([ 'y_min', `${y_min_expr}` ]);
        }
        
        let y_max_expr = this.getValueOrDefault('y_max_expr');
        if (!!y_max_expr) {
            request.push([ 'y_max', `${y_max_expr}` ]);
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

        // let b = this.autoY(bounds);
        // if (yMin == null) {
        //     bounds.yMin = b.yMin;
        // }
        // if (yMax == null) {
        //     bounds.yMax = b.yMax;
        // }

        return bounds;
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
        $traceForm.querySelector('*[data-action="open-trace-traverser"]').dataset.id = id;

        // TODO: Why is this querySelectorAll for an ID?
        $traceForm.querySelectorAll('#remove-button').forEach(element => {
            element.addEventListener('click', () => {
                this.traces.splice((id - 1), 1); // Remove current ID from list of traces
                this.update();  // Update the viewport
                let b = this.autoXY(this.viewport)
                this.bounds = b;
                this.setViewport(b);   // Refresh x and y axis
                this.render();  // Redraw the panel
                this.edit();    // Reopen edit to remove previous panel list.
            });
        });

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
        this.setupGlobalDefaults('shot_expr', `trace-shot_expr-${id}`, `trace-shot_expr-default`);
        this.setupGlobalDefaults('default_node_expr', `trace-default_node_expr-${id}`, `trace-default_node_expr-default`);

        let valueOrEmpty = (value) => {
            if (value === null || typeof value == "undefined"){
                return "";
            }
            return value
        }

        document.querySelector('#panel-title_expr').value = valueOrEmpty(this.title_expr);
        document.querySelector('#panel-y_min_expr').value = valueOrEmpty(this.y_min_expr);
        document.querySelector('#panel-y_max_expr').value = valueOrEmpty(this.y_max_expr);
        document.querySelector('#panel-x_min_expr').value = valueOrEmpty(this.x_min_expr);
        document.querySelector('#panel-x_max_expr').value = valueOrEmpty(this.x_max_expr);

        // Update the form values
        // TODO: Improve
        let trace = this.traces[id - 1];
        document.querySelector(`#trace-y_expr-${id}`).value = valueOrEmpty(trace.y_expr);
        document.querySelector(`#trace-x_expr-${id}`).value = valueOrEmpty(trace.x_expr);
        document.querySelector(`#trace-tree-${id}`).value = valueOrEmpty(trace.tree);
        document.querySelector(`#trace-shot_expr-${id}`).value = valueOrEmpty(trace.shot_expr);
        document.querySelector(`#trace-default_node_expr-${id}`).value = valueOrEmpty(trace.default_node_expr);
        let color = valueOrEmpty(trace.trace_color);
        if (color == ""){
            color = "black"
        }
        document.querySelector(`#trace-color-${id}`).value = color;
        
    }

    saveForm() {
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
                if (this.traces[index] === undefined) {
                    this.addTrace();
                }
                if (this.traces[index][property] != value) {
                    console.log(property, index, 'changed');
                    console.log(this.traces[index][property], value);
                    needUpdate = true;
                    this.traces[index][property] = value;
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
        updateDefault('y_min_expr', 'panel-y_min_expr-default');
        updateDefault('y_max_expr', 'panel-y_max_expr-default');
        updateDefault('x_min_expr', 'panel-x_min_expr-default');
        updateDefault('x_max_expr', 'panel-x_max_expr-default');

        updateDefault('tree', 'trace-tree-default');
        updateDefault('shot_expr', 'trace-shot_expr-default');
        updateDefault('default_node_expr', 'trace-default_node_expr-default');
        updateDefault('y_expr', 'trace-y_expr-default');
        updateDefault('x_expr', 'trace-x_expr-default');

        updateValue('title_expr', 'panel-title_expr');
        updateValue('y_min_expr', 'panel-y_min_expr');
        updateValue('y_max_expr', 'panel-y_max_expr');
        updateValue('x_min_expr', 'panel-x_min_expr');
        updateValue('x_max_expr', 'panel-x_max_expr');

        for (var i = 0; i < $traceForms.length; ++i) {
            let id = parseInt($traceForms[i].dataset.id);
            
            updateValue('tree', `trace-tree-${id}`, i);
            updateValue('shot_expr', `trace-shot_expr-${id}`, i);
            updateValue('default_node_expr', `trace-default_node_expr-${id}`, i);
            updateValue('y_expr', `trace-y_expr-${id}`, i);
            updateValue('x_expr', `trace-x_expr-${id}`, i);
            updateValue('trace_color', `trace-color-${id}`, i);
        }

        clearTimeout(window.autosaveTimeout);
        window.autosaveTimeout = setTimeout(window.autosave, 1000);

        return needUpdate;
    }

    async edit(initialEdit = false) {
        let $overlay = document.getElementById('overlay');

        // Clear out the overlay
        $overlay.innerHTML = '';

        // Show the overlay
        $overlay.classList.add('shown');

        // Fill the overlay with the default panel form
        let panelFormTemplate = document.getElementById('panel-form-template');
        $overlay.appendChild(panelFormTemplate.content.cloneNode(true));

        if (this.traces.length == 0) {
            this.traces.push(new MDSplusTrace());
        }

        for (var i = 0; i < this.traces.length; ++i) {
            let id = i + 1;

            // Add the form to the document
            this.addTraceForm(id);
        }

        // if (this.traces.length == 0) {
        //     this.addTraceForm(1);
        // }
        
        // TODO: Improve
        // Create classes / functions? setTraceFormActive() ?
        document.getElementById(`trace-tab-1`).click();

        document.querySelectorAll('*[data-action="open-trace-traverser"]')
            .forEach((button) => {
                button.addEventListener('click', async (e) => {
                    let id = parseInt(button.dataset.id) - 1;
                    let traverser =  await Traverser.findOrOpen(
                        this.getValueOrDefault('tree', id),
                        this.getValueOrDefault('shot_expr', id),
                    );

                    let node = this.getValueOrDefault('y_expr', id);
                    if (node !== null) {
                        // Filter out functions
                        node = node.replaceAll(/([a-zA-Z_]+\()/g, '');

                        // Filter out variables
                        node = node.replaceAll(/(_[a-zA-Z_]+)/g, '');

                        // Filter out scientific notation
                        node = node.replaceAll(/([0-9]e[0-9]+)/g, '');

                        // Find first thing that looks like a node
                        let matches = node.match(/(\\?\\?[a-zA-Z][a-zA-Z0-9_:\.]+)/);
                        node = matches[0];

                        let default_node_expr = this.getValueOrDefault('default_node_expr', id);
                        traverser.reveal(node, default_node_expr);

                        // HACK: Effectively "cancel"
                        previewRenderer.remove();
                        $overlay.innerHTML = '';
                        $overlay.classList.remove('shown');
                    }
                });
            });

        let $panelForm = document.getElementById('panel-form');
        $panelForm.dataset.nextDataId = this.traces.length + 1;

        this.setupGlobalDefaults('title_expr', 'panel-title_expr', 'panel-title_expr-default');
        this.setupGlobalDefaults('y_min_expr', 'panel-y_min_expr', 'panel-y_min_expr-default');
        this.setupGlobalDefaults('y_max_expr', 'panel-y_max_expr', 'panel-y_max_expr-default');
        this.setupGlobalDefaults('x_min_expr', 'panel-x_min_expr', 'panel-x_min_expr-default');
        this.setupGlobalDefaults('x_max_expr', 'panel-x_max_expr', 'panel-x_max_expr-default');

        let previewRenderer = new D3Renderer(document.querySelector('#panel-preview'), this);
        previewRenderer.render();

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
                node.addEventListener('click', async (e) => {
                    previewRenderer.remove();

                    let needUpdate = this.saveForm();

                    $overlay.innerHTML = '';
                    $overlay.classList.remove('shown');

                    if (needUpdate) {
                        await this.update();
                        this.render();
                    }
                });
            });

        document.querySelectorAll(`#panel-form *[data-action="apply"]`)
            .forEach(async (node) => {
                node.addEventListener('click', async (e) => {
                    let needUpdate = this.saveForm();

                    if (needUpdate) {
                        await this.update();
                        this.render();
                    }

                    previewRenderer.render();
                });
            });

        document.querySelectorAll(`#panel-form *[data-action="reset"]`)
            .forEach((node) => {
                node.addEventListener('click', (e) => {
                    this.edit(); // HACK
                });
            });

        document.querySelectorAll(`#panel-form *[data-action="cancel"]`)
            .forEach((node) => {
                node.addEventListener('click', (e) => {
                    if(initialEdit) {
                        this.removeElement();
                    }
                    previewRenderer.remove();
                    $overlay.innerHTML = '';
                    $overlay.classList.remove('shown');
                });
            });
    }

    showError(message) {
        console.error(message);
        this.widget.querySelector('.plot').innerHTML = `<div class="error">${message}</div>`;
        this.widget.style.opacity = 1;
    }

    async update() {
        // TODO: Fix conflit with preview
        this.widget.style.opacity = 0.2;
        let $error = this.widget.querySelector('.error');
        if ($error != null) {
            $error.remove();
        }

        // TODO: Improve?
        let count = this.widget.querySelector('.plot').getBoundingClientRect().width * 2;
        console.log(count);

        let bounds = this.viewport();
        let initialZoom = (bounds == null);

        if (initialZoom) {
            bounds = await this.calculateBounds();
        }

        let view = new Bounds();
        for (var i = 0; i < this.traces.length; ++i) {
            try {
                if (initialZoom) {
                    this.traces[i].initial_data = null; // HACK:
                }
                await this.traces[i].update(this.connection, bounds, count, this.global_defaults_flags);
            }
            catch (e) {
                this.showError(e);
            }
            
            view.join(this.traces[i].bounds);
        }

        if (initialZoom) {
            this.setViewport(view);
        }
        else {
            this.pushZoom(view);
        }

        this.widget.style.opacity = 1;

        // // TODO: Reuse?
        // if (this.renderer != null) {
        //     this.renderer.remove();
        // }

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

    async render() {
        if (this.widget.querySelector('.error') != null) {
            return;
        }

        if (this.traces.length == 0) {
            return;
        }

        let $plot = this.widget.querySelector('.plot');
        $plot.innerHTML = '';
        
        this.renderer.render();

        this.widget.style.opacity = 1;
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

    // TODO: Remove?
    getValueOrDefault(property, trace = null) {
        if (this.global_defaults_flags[property] && Scope.defaults[property] !== null) {
            return Scope.defaults[property];
        }

        if (trace !== null) {
            return this.traces[trace][property];
        }
        else {
            return this[property];
        }
    }
};