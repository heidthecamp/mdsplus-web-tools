import Bounds from "./bounds.js";
import Connection from "./connection.js";
import { GlobalDefaultFlags, useDefault } from "./globalDefaults.js";

let NextId = 1;

export default class Panel {
    static panels = [];

    constructor(title = null, row = null, col = null, global_defaults = 0xFFFF) {
        this.id = NextId++;
        this.title_expr = title;
        this.row = row;
        this.col = col;

        this.setConnection(window.globalConnection);

        this.global_defaults = global_defaults;

        this.tree = [];
        this.shot = [];
        this.default_node = [];
        this.y_expr = [];
        this.x_expr = [];
        this.trace_type = [];
        this.trace_color = [];
        this.point_type = [];
        this.point_color = [];

        
        this.title = null;
        this.data = [];
        this.viewStack = [];
        this.viewport = new Bounds();

        this.line = [];

        this.addElement();
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
    }

    addElement() {
        let $panel = document.createElement('div');
        $panel.id = `panel-${this.id}`;
        $panel.classList.add('panel');

        $panel.appendChild(document.getElementById('panel-template').content.cloneNode(true));

        if (this.row === null && this.col === null) {
            document.getElementById('panels').appendChild($panel);
        }
        else {
            document.getElementById(`cell-${this.row}-${this.col}`).appendChild($panel);
        }

        document.querySelectorAll(`#panel-${this.id} *[data-action="edit"]`)
            .forEach((node) => {
                node.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.edit();
                });
            });

        document.querySelectorAll(`#panel-${this.id} *[data-action="remove"]`)
            .forEach((node) => {
                node.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.removeElement();
                });
            });

        document.querySelectorAll(`#panel-${this.id} *[data-action="auto-x"]`)
            .forEach((node) => {
                node.addEventListener('click', async (e) => {
                    e.preventDefault();
                    this.autoX();
                    this.render();
                })
            })
        document.querySelectorAll(`#panel-${this.id} *[data-action="auto-y"]`)
            .forEach((node) => {
                node.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.autoY();
                    this.render();
                })
            })
        document.querySelectorAll(`#panel-${this.id} *[data-action="all-x-auto-y"]`)
            .forEach((node) => {
                node.addEventListener('click', (e) => {
                    e.preventDefault();
                    let v = this.getViewport();
                    for(let i = 0; i < Panel.panels.length; ++i) {
                        Panel.panels[i].setViewport(v);
                        Panel.panels[i].autoY();
                        Panel.panels[i].render();
                    }
                })
            })
    }

    async calculateBounds(boundArray) {
        let bounds = boundArray[0];
        for (var i = 1; i < boundArray.length; ++i) {
            bounds.join(boundArray[i]);
        }

        if (this.useDefault("x_min")){
            if (!! globalDefaults.x_min) {
                bounds.xMin = globalDefaults.x_min;
            }
        }
        else if (!!this.x_min) {
            bounds.xMin = this.x_min;
        }
        if (this.useDefault("x_max")){
            if (!! globalDefaults.x_max) {
                bounds.xMax = globalDefaults.x_max;
            }
        }
        else if (!!this.x_max) {
            bounds.xMax = this.x_max;
        }
        if (this.useDefault("y_min")){
            if (!!globalDefaults.y_min) {
                bounds.yMin = globalDefaults.y_min;
            }
        }
        else if (!!this.y_min) {
            bounds.yMin = this.y_min;
        }
        if (this.useDefault("y_max")){
            if (!!globalDefaults.y_max) {
                bounds.yMax = globalDefaults.y_max;
            }
        }
        else if (!!this.y_max) {
            bounds.yMax = this.y_max;
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

    autoX() {
        let b = new Bounds()
        b.yMin = this.viewport.yMin;
        b.yMax = this.viewport.yMax;
        
        for (let h = 0; h < this.data.length; h++){
            for (let i = 0; i < this.data[h].length; ++i) {
                for (let j = 0; j < this.data[h][i].length; ++j){
                    let val = this.data[h][i][j];
                    b.extend(val[0], null);
                }
            }
        }
        
        this.viewStack.push(b);
        this.viewport = this.viewStack[ this.viewStack.length -1 ]
    }

    autoY() {
        let b = new Bounds()
        b.xMin = this.viewport.xMin;
        b.xMax = this.viewport.xMax;
        for (let h = 0; h < this.data.length; h++){
            for (let i = 0; i < this.data[h].length; ++i) {
                for (let j = 0; j < this.data[h][i].length; ++j){
                    let val = this.data[h][i][j];
                    if (
                        this.viewport.xMin < val[0] &&
                        val[0] < this.viewport.xMax
                    ) {
                        b.extend(val[0], val[1]);
                    }
                }
            }
        }
        
        this.viewStack.push(b);
        this.viewport = this.viewStack[ this.viewStack.length -1 ]
    }

    removeElement() {
        document.getElementById(`panel-${this.id}`).remove();
    }

    // TODO: Improve by adding more general event listeners and using data-id

    // TODO: Improve
    addTraceForm(id) {
        let traceFormTemplate = document.getElementById('trace-form-template');

        // Create a form for the trace
        let $traceForm = document.createElement('div');
        $traceForm.id = `trace-form-${id}`;
        $traceForm.dataset.id = id;
        $traceForm.classList.add('trace-form');
        $traceForm.appendChild(traceFormTemplate.content.cloneNode(true));

        // You can't call .forEach() on the result of .getElements***()
        
        // Append the trace ID to the input IDs
        let $inputs = [...$traceForm.getElementsByTagName('input')];
        $inputs.forEach(node => {
            node.id += `-${id}`;
        });
        // Update the labels to match the new input IDs
        let $labels = [...$traceForm.getElementsByTagName('label')];
        $labels.forEach(node => {
            node.htmlFor += `-${id}`;
        });

        let $traceForms = document.getElementById('trace-forms');
        $traceForms.appendChild($traceForm);

        // Add a tab for the trace
        let $traceTab = document.createElement('button');
        $traceTab.id = `trace-tab-${id}`;
        $traceTab.classList.add('trace-tab');
        $traceTab.innerText = `Trace #${id}`;

        let $traceFormTabs = document.getElementById('trace-form-tabs');
        $traceFormTabs.appendChild($traceTab);

        document.getElementById(`trace-tab-${id}`)
            .addEventListener('click', (e) => {

                var $traceTabs = [...document.getElementsByClassName('trace-tab')];
                $traceTabs.forEach(node => {
                    node.disabled = false;
                });

                var $traceForms = [...document.getElementsByClassName('trace-form')];
                $traceForms.forEach(node => {
                    node.classList.remove('shown');
                });

                document.getElementById(`trace-tab-${id}`).disabled = true;
                document.getElementById(`trace-form-${id}`).classList.add('shown');
            });


        this.setupGlobalDefaults('y_expr', `trace-y_expr-${id}`, `trace-y_expr-default-${id}`);
        this.setupGlobalDefaults('x_expr', `trace-x_expr-${id}`, `trace-x_expr-default-${id}`);
        this.setupGlobalDefaults('tree', `trace-tree-${id}`, `trace-tree-default-${id}`);
        this.setupGlobalDefaults('shot', `trace-shot-${id}`, `trace-shot-default-${id}`);
        this.setupGlobalDefaults('default_node', `trace-default_node-${id}`, `trace-default_node-default-${id}`);

        let valueOrEmpty = (value) => {
            if (value === null || typeof value == "undefined"){
                return "";
            }
            return value
        }

        document.getElementById('panel-title_expr').value = valueOrEmpty(this.title_expr);
        document.getElementById('panel-y-min').value = valueOrEmpty(this.y_min);
        document.getElementById('panel-y-max').value = valueOrEmpty(this.y_max);
        document.getElementById('panel-x-min').value = valueOrEmpty(this.x_min);
        document.getElementById('panel-x-max').value = valueOrEmpty(this.x_max);

        // Update the form values
        // TODO: Improve
        document.getElementById(`trace-y_expr-${id}`).value = valueOrEmpty(this.y_expr[id - 1]);
        document.getElementById(`trace-x_expr-${id}`).value = valueOrEmpty(this.x_expr[id - 1]);
        document.getElementById(`trace-tree-${id}`).value = valueOrEmpty(this.tree[id - 1]);
        document.getElementById(`trace-shot-${id}`).value = valueOrEmpty(this.shot[id - 1]);
        document.getElementById(`trace-default_node-${id}`).value = valueOrEmpty(this.default_node[id - 1]);
        let color = valueOrEmpty(this.trace_color[id - 1]);
        if (color == ""){
            color = "steelblue"
        }
        document.getElementById(`trace-color-${id}`).value = color;
        
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
                    let numberOrNull = (value) => {
                        if (value === null){
                            return null;
                        }
                        return Number(value);
                    }

                    let $traceForms = document.getElementsByClassName('trace-form');

                    let _global_defaults = 0;
                    if (document.getElementById('panel-title_expr-default').checked) {
                        _global_defaults |= GlobalDefaultFlags['title'];
                    }
                    if (document.getElementById('panel-y-min-default').checked){
                        _global_defaults |= GlobalDefaultFlags['y_min'];
                    }
                    if (document.getElementById('panel-y-max-default').checked){
                        _global_defaults |= GlobalDefaultFlags['y_max'];
                    }
                    if (document.getElementById('panel-x-min-default').checked){
                        _global_defaults |= GlobalDefaultFlags['x_min'];
                    }
                    if (document.getElementById('panel-x-max-default').checked){
                        _global_defaults |= GlobalDefaultFlags['x_max'];
                    }
                    this.global_defaults = _global_defaults;

                    this.title_expr = valueOrNull(document.getElementById('panel-title_expr').value);
                    this.y_min = numberOrNull(valueOrNull(document.getElementById('panel-y-min').value));
                    this.y_max = numberOrNull(valueOrNull(document.getElementById('panel-y-max').value));
                    this.x_min = numberOrNull(valueOrNull(document.getElementById('panel-x-min').value));
                    this.x_max = numberOrNull(valueOrNull(document.getElementById('panel-x-max').value));
                    
                    for (var i = 0; i < $traceForms.length; ++i) {
                        let id = parseInt($traceForms[i].dataset.id);
                        let t_global_defaults = _global_defaults;
                        if (document.getElementById(`trace-tree-default-${id}`).checked) {
                            t_global_defaults |= GlobalDefaultFlags['tree'];
                        }
                        if (document.getElementById(`trace-shot-default-${id}`).checked) {
                            t_global_defaults |= GlobalDefaultFlags['shot'];
                        }
                        if (document.getElementById(`trace-default_node-default-${id}`).checked) {
                            t_global_defaults |= GlobalDefaultFlags['default_node'];
                        }
                        if (document.getElementById('panel-title_expr-default').checked) {
                            t_global_defaults |= GlobalDefaultFlags['title_expr'];
                        }
                        if (document.getElementById(`trace-y_expr-default-${id}`).checked) {
                            t_global_defaults |= GlobalDefaultFlags['y_expr'];
                        }
                        if (document.getElementById(`trace-x_expr-default-${id}`).checked) {
                            t_global_defaults |= GlobalDefaultFlags['x_expr'];
                        }

                        this.global_defaults = t_global_defaults;
                        
                        this.tree[i] = valueOrNull(document.getElementById(`trace-tree-${id}`).value);
                        this.shot[i] = valueOrNull(document.getElementById(`trace-shot-${id}`).value);
                        this.default_node[i] = valueOrNull(document.getElementById(`trace-default_node-${id}`).value);
                        this.y_expr[i] = valueOrNull(document.getElementById(`trace-y_expr-${id}`).value);
                        this.x_expr[i] = valueOrNull(document.getElementById(`trace-x_expr-${id}`).value);
                        this.trace_color[i] = valueOrNull(document.getElementById(`trace-color-${id}`).value);
                    }

                    $overlay.innerHTML = '';
                    $overlay.classList.remove('shown');

                    this.update();
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

        let primed = false;

        $overlay.addEventListener('mousedown', (event) => {
            if (!document.querySelector(`#panel-form`).contains(event.target)) {
                primed = true;
                console.log("primed")
            } else {
                primed = false;
            }
        }, true);

        function outerClick(event){
            if (primed && !document.querySelector(`#panel-form`).contains(event.target)) {
                    $overlay.innerHTML = '';
                    $overlay.classList.remove('shown');
            }
            primed = false;
        }
        $overlay.addEventListener("mouseup", outerClick, true);

        $overlay.addEventListener("keydown", (event) => {
            if (event.key === 'Escape') {
                $overlay.innerHTML = '';
                $overlay.classList.remove('shown');
            }
        });
    }

    // TODO: Replace this.tree.length with traceCount or something

    async update() {
        let tree;
        let shot;
        let default_node;

        let boundsArray = [];
        this.data = [];
        for (var i = 0; i < this.tree.length; ++i) {
            let request = [];

            if (this.useDefault('tree')) {
                tree = globalDefaults.tree;
            }
            else if (this.tree[i]) {
                tree = this.tree[i];
            }

            if (this.useDefault('shot')) {
                shot = globalDefaults.shot;
            }
            else if (this.shot[i]) {
                shot = this.shot[i];
            }

            // TODO: Only call if needed?
            request.push(['open', `TreeOpen("${tree}",${shot})`])
            
            default_node = 'TreeSetDefault("\\\\TOP")';
            if(this.useDefault('default_node')) {
                if (globalDefaults.default_node) {
                    default_node = `TreeSetDefault("${globalDefaults.default_node.replace('\\', '\\\\')}")`;
                }
            }
            else if (this.default_node[i]) {
                default_node = `TreeSetDefault("${this.default_node[i].replace('\\', '\\\\')}")`;
            }

            // TODO: Only call if needed?
            request.push([ 'default_node', default_node ]);

            let y_expr = null;
            let x_expr = null;

            if(this.useDefault('y_expr')) {
                y_expr = globalDefaults.y_expr;
            }
            else if (this.y_expr[i]) {
                y_expr = this.y_expr[i];
            }

            if (request.y == null) {
                // Freak out
            }

            if(this.useDefault('x_expr')) {
                x_expr = globalDefaults.x_expr;
            }
            else if (this.x_expr[i]) {
                x_expr = this.x_expr[i];
            }
            
            // TODO: Improve
            // Fallback default
            if (x_expr == null || x_expr == '') {
                y_expr = `_wssig=${y_expr}`;
                x_expr = 'dim_of(_wssig)';
            }

            request.push([ 'y', y_expr ]);
            request.push([ 'x', x_expr ]);

            await this.connection.ready();
            await this.connection.getMany(request)
            .then((response) => {

                let y_data = null;
                if (response.hasOwnProperty('y')) {
                    if (response.y.hasOwnProperty('error')) {
                        console.error('y', response.y.error);
                        return;
                    }
                    
                    y_data = response.y.value;
                }

                let x_data = null;
                if (response.hasOwnProperty('x')) {
                    if (response.x.hasOwnProperty('error')) {
                        console.error('x', response.x.error);
                        return;
                    }
                    
                    x_data = response.x.value;
                }

                // y truncates to match x.
                if (y_data.length < x_data.length) {
                    console.error('Length mismatch len(y) < len(x)');
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
            });
        }
        
        this.viewStack = [];
        this.viewStack.push(await this.calculateBounds(boundsArray));
        this.viewport = this.viewStack[0];

        this.render();
    }

    async render() {
        // let m = this.margin();
        let width = this.width();
        let height = this.height();

        if (this.tree.length == 0) {
            return;
        }

        // TODO: Replace .plot
        // data-role? data-id?
        const svg = d3.select(`#panel-${this.id} .plot`)
            .html(null)
            .append('svg')
                // .attr('width', width + m.left + m.right)
                // .attr('height', height + m.top + m.bottom)
                .attr('width', '100%')
                .attr('height', '100%')
            .append('g')
                .attr('transform',
                    `translate(60,10)`
                );


        const xScale = d3.scaleLinear()
            .domain([ this.viewport.xMin, this.viewport.xMax ])
            .range([ 0, width ]);

        let xAxis = svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale));

        const yScale = d3.scaleLinear()
            .domain([ this.viewport.yMin, this.viewport.yMax ])
            .range([ height, 0 ]);
        
        let yAxis = svg.append('g')
            .call(d3.axisLeft(yScale));
            
        let clip = svg.append('defs').append('SVG:clipPath')
            .attr('id', 'clip')
            .append('svg:rect')
            .attr('width', width)
            .attr('height', height)
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
                    console.log('point');
                }
                let line = svg.append('g')
                    .attr('clip-path', 'url(#clip)')
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
            .extent([[0, 0],[width, height]]);
            // .on('end', zoomChart);
        
        var zoom_brush = svg.append('g')
            .attr('clip-path', 'url(#clip)')
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

        document.getElementById(`panel-${this.id}`).style.opacity = 1;

        let request = [];
        if (this.useDefault("title")){
            request.push([ 'title_expr', globalDefaults.title_expr ]);
        }
        else if (this.title_expr) {
            request.push([ 'title_expr', this.title_expr ]);
        }

        if (request.length > 0) {
            await this.connection.getMany(request)
            .then((response) => {
                if (response.title_expr.hasOwnProperty('error')) {
                    console.error('Title', response.title_expr.error);
                    return;
                }
                this.title = response.title_expr.value;
            });
    
            document.querySelector(`#panel-${this.id} .title`).innerText = this.title;
        }
        else {
            document.querySelector(`#panel-${this.id} .title`).innerText = '';
        }

    }

    // margin() {
    //     return {
    //         'top': 10,
    //         'left': 90,
    //         'bottom': 30,
    //         'right': 30,
    //     }
    // }

    width() {
        return 500;
    }

    height() {
        return 300;
    }

    setupGlobalDefaults(property, inputId=null, checkboxId=null) {
        let $input = document.getElementById(inputId);
        let $checkbox = document.getElementById(checkboxId);

        $checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                $input.disabled = true;
                $input.placeholder = globalDefaults[property] ? globalDefaults[property] : '';
            }
            else {
                $input.disabled = false;
                $input.placeholder = '';
            }
        });


        try {
            $checkbox.checked = this.useDefault(property);
        } catch(e) {
            console.error(e);
            $checkbox.checked = true;
        }
        
        // TODO: Remove, this should be automatic when onchange is called
        if ($checkbox.checked) {
            $input.disabled = true;
            $input.placeholder = globalDefaults[property] ? globalDefaults[property] : '';
        }
    }

    useDefault(property) {
        // HACK: Need to sort out Panels and Global Defaults
        try {
            return useDefault(property, this.global_defaults);
        } catch(e) {
            console.error("Could not resolve", e);
        }
    }
};