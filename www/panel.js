import Bounds from "./bounds.js";
import { getMany } from "./connection.js";
import { GlobalDefaultFlags, useDefault } from "./globalDefaults.js";
import Trace from "./trace.js";

let NextId = 1;

export default class Panel {
    constructor(title = null, row = null, col = null, ...traces) {
        this.id = NextId++;
        this.title_expr = title;
        // this.y_min;
        // this.y_max;
        // this.yGridLines;
        // this.x_min;
        // this.x_max;
        // this.xGridLines;
        // this.global_defaults;
        this.row = row;
        this.col = col;
        this.traces = traces;
        
        this.title = null;

        this.addElement();
        this.render();
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

        document.querySelectorAll(`#panel-${this.id} *[data-action="remove]"`)
            .forEach((node) => {
                node.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.removeElement();
                });
            });
    }

    removeElement() {
        document.getElementById(`panel-${this.id}`).remove();
    }

    // TODO: Improve by adding more general event listeners and using data-id

    // TODO: Improve
    addTraceForm(id, trace=null) {
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

        let setupGlobalDefaults = (property, inputId=null, checkboxId=null) => {
            // TODO: Remove when title gets moved
            let $input = document.getElementById(inputId ? inputId : `trace-${property}-${id}`);
            let $checkbox = document.getElementById(checkboxId ? checkboxId : `trace-${property}-default-${id}`);

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

            $checkbox.checked = trace ? trace.useDefault(property) : true;
            // TODO: Remove, this should be automatic when onchange is called
            if ($checkbox.checked) {
                $input.disabled = true;
                $input.placeholder = globalDefaults[property] ? globalDefaults[property] : '';
            }
        }

        setupGlobalDefaults('title_expr', 'panel-title_expr', 'panel-title_expr-default');
        setupGlobalDefaults('y_min', 'panel-y-min', 'panel-y-min-default');
        setupGlobalDefaults('y_max', 'panel-y-max', 'panel-y-max-default');
        setupGlobalDefaults('x_min', 'panel-x-min', 'panel-x-min-default');
        setupGlobalDefaults('x_max', 'panel-x-max', 'panel-x-max-default');
        setupGlobalDefaults('y_expr');
        setupGlobalDefaults('x_expr');
        setupGlobalDefaults('tree');
        setupGlobalDefaults('shot');
        setupGlobalDefaults('default_node');

        let valueOrEmpty = (value) => {
            if (value === null){
                return "";
            }
            return value
        }

        document.getElementById('panel-title_expr').value = valueOrEmpty(this.title_expr);
        document.getElementById('panel-y-min').value = valueOrEmpty(this.y_min);
        document.getElementById('panel-y-max').value = valueOrEmpty(this.y_max);
        document.getElementById('panel-x-min').value = valueOrEmpty(this.x_min);
        document.getElementById('panel-x-max').value = valueOrEmpty(this.x_max);

        if (trace) {
            // Update the form values
            document.getElementById(`trace-y_expr-${id}`).value = valueOrEmpty(trace.y_expr);
            document.getElementById(`trace-x_expr-${id}`).value = valueOrEmpty(trace.x_expr);
            document.getElementById(`trace-tree-${id}`).value = valueOrEmpty(trace.tree);
            document.getElementById(`trace-shot-${id}`).value = valueOrEmpty(trace.shot);
            document.getElementById(`trace-default_node-${id}`).value = valueOrEmpty(trace.default_node);
        }
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

        for (var i = 0; i < this.traces.length; ++i) {
            let id = i + 1;
            let trace = this.traces[i];

            // Add the form to the document
            this.addTraceForm(id, trace);
        }

        if (this.traces.length == 0) {
            this.addTraceForm(1);
        }

        // TODO: Improve
        // Create classes / functions? setTraceFormActive() ?
        document.getElementById(`trace-tab-1`).click();

        let $panelForm = document.getElementById('panel-form');
        $panelForm.dataset.nextDataId = this.traces.length + 1;

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
                    this.traces = [];
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
                        
                        if (! this.useDefault("x_min")){
                            this.title_expr = valueOrNull(valueOrNull(document.getElementById('panel-title_expr').value));
                        }
                        this.y_min = numberOrNull(valueOrNull(document.getElementById('panel-y-min').value));
                        this.y_max = numberOrNull(valueOrNull(document.getElementById('panel-y-max').value));
                        this.x_min = numberOrNull(valueOrNull(document.getElementById('panel-x-min').value));
                        this.x_max = numberOrNull(valueOrNull(document.getElementById('panel-x-max').value));
                        this.traces.push(new Trace(
                            document.getElementById(`trace-tree-${id}`).value,
                            document.getElementById(`trace-shot-${id}`).value,
                            document.getElementById(`trace-default_node-${id}`).value,
                            // document.getElementById('panel-title_expr').value, // TODO: Move to Panel
                            document.getElementById(`trace-y_expr-${id}`).value,
                            document.getElementById(`trace-x_expr-${id}`).value,
                            t_global_defaults
                        ))
                    }

                    $overlay.innerHTML = '';
                    $overlay.classList.remove('shown');

                    this.render();
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

        function outerClick(event){
            if (!document.querySelector(`#panel-form`).contains(event.target)) {
                    $overlay.innerHTML = '';
                    $overlay.classList.remove('shown');
            }
        }
        $overlay.addEventListener("click", outerClick, true);
    }

    async render() {
        let m = this.margin();
        let width = this.width();
        let height = this.height();

        if (this.traces.length == 0) {
            return;
        }

        let bounds = null;
        
        let request = null;

        
        if (this.useDefault("title")){
            request = {
                'title_expr': this.globalDefaults.title_expr
            };
        }
        else if (this.title_expr) {
            request = {
                'title_expr': this.title_expr
            };
        }

        if (request) {
            console.log(request.title_expr);
            await MDSplus.getMany(request)
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

        for (var i = 0; i < this.traces.length; ++i) {
            await this.traces[i].update(this.title_expr, (t) => {
                console.log(t);
                this.title = t;
            });

            // TODO: Move
            if (bounds) {
                bounds.join(this.traces[i].bounds);
            }
            else {
                bounds = this.traces[i].bounds;
            }
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
            .domain([ bounds.xMin, bounds.xMax ])
            .range([ 0, width ]);

        let xAxis = svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale));

        const yScale = d3.scaleLinear()
            .domain([ bounds.yMin, bounds.yMax ])
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

        for (var i = 0; i < this.traces.length; ++i) {
            this.traces[i].render(svg, xScale, yScale);
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
            // console.log("zoomies")
            let extent = e.selection;

            
            if (!extent) {
                return;
                // brush.end seems to be called on `call(brush.move, null)`
                // Setting the domains here will clear zooming.
            } else {
                // console.log('extent')
                xScale.domain([xScale.invert(extent[0][0]), xScale.invert(extent[1][0])]);
                yScale.domain([yScale.invert(extent[1][1]), yScale.invert(extent[0][1])]);
                
                zoom_brush.call(brush.move, null);
            }

            xAxis.transition().call(d3.axisBottom(xScale));
            yAxis.transition().call(d3.axisLeft(yScale));

            for (var i = 0; i < this.traces.length; ++i) {
                this.traces[i].zoom(xScale, yScale);
            }
        }

        svg.on("dblclick",() => {

            xScale.domain([ bounds.xMin, bounds.xMax ])
            yScale.domain([ bounds.yMin, bounds.yMax ])
            xAxis.transition().call(d3.axisBottom(xScale));
            yAxis.transition().call(d3.axisLeft(yScale));
            for (var i = 0; i < this.traces.length; ++i) {
                this.traces[i].zoom(xScale, yScale);
            }
            zoom_brush.call(brush.move, null);
        });

        brush.on('end', zoomChart);
    }

    margin() {
        return {
            'top': 10,
            'left': 90,
            'bottom': 30,
            'right': 30,
        }
    }

    width() {
        return 500;
    }

    height() {
        return 300;
    }


    useDefault(property) {
        // HACK: Need to sort out Panels and Global Defaults
        return useDefault(property, this.traces[0].global_defaults);
    }
};