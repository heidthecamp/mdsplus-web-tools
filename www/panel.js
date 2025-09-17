import Bounds from "./bounds.js";
import { GlobalDefaultFlags } from "./globalDefaults.js";
import Trace from "./trace.js";

let NextId = 1;

export default class Panel {
    constructor(...traces) {
        this.id = NextId++;
        this.traces = traces;

        this.addElement();
        this.render();
    }

    addElement() {
        let $panel = document.createElement('div');
        $panel.id = `panel-${this.id}`;
        $panel.classList.add('panel');

        $panel.appendChild(document.getElementById('panel-template').content.cloneNode(true));
        document.getElementById('panels').appendChild($panel);

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
            let $checkbox = document.getElementById(checkboxId ? inputId : `trace-${property}-default-${id}`);

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
        setupGlobalDefaults('y_expr');
        setupGlobalDefaults('x_expr');
        setupGlobalDefaults('tree');
        setupGlobalDefaults('shot');
        setupGlobalDefaults('default_node');

        if (trace) {
            // Update the form values
            document.getElementById('panel-title_expr').value = trace.title_expr; // TODO: Move to Panel
            document.getElementById(`trace-y_expr-${id}`).value = trace.y_expr;
            document.getElementById(`trace-x_expr-${id}`).value = trace.x_expr;
            document.getElementById(`trace-tree-${id}`).value = trace.tree;
            document.getElementById(`trace-shot-${id}`).value = trace.shot;
            document.getElementById(`trace-default_node-${id}`).value = trace.default_node;
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
                    for (var i = 0; i < $traceForms.length; ++i) {
                        let id = parseInt($traceForms[i].dataset.id);
                        let global_defaults = 0;
                        if (document.getElementById(`trace-tree-default-${id}`).checked) {
                            global_defaults |= GlobalDefaultFlags['tree'];
                        }
                        if (document.getElementById(`trace-shot-default-${id}`).checked) {
                            global_defaults |= GlobalDefaultFlags['shot'];
                        }
                        if (document.getElementById(`trace-default_node-default-${id}`).checked) {
                            global_defaults |= GlobalDefaultFlags['default_node'];
                        }
                        if (document.getElementById('panel-title_expr-default').checked) {
                            global_defaults |= GlobalDefaultFlags['title_expr'];
                        }
                        if (document.getElementById(`trace-y_expr-default-${id}`).checked) {
                            global_defaults |= GlobalDefaultFlags['y_expr'];
                        }
                        if (document.getElementById(`trace-x_expr-default-${id}`).checked) {
                            global_defaults |= GlobalDefaultFlags['x_expr'];
                        }

                        this.traces.push(new Trace(
                            document.getElementById(`trace-tree-${id}`).value,
                            document.getElementById(`trace-shot-${id}`).value,
                            document.getElementById(`trace-default_node-${id}`).value,
                            document.getElementById('panel-title_expr').value, // TODO: Move to Panel
                            document.getElementById(`trace-y_expr-${id}`).value,
                            document.getElementById(`trace-x_expr-${id}`).value,
                            global_defaults
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
    }

    async render() {
        let m = this.margin();
        let width = this.width();
        let height = this.height();

        if (this.traces.length == 0) {
            return;
        }

        let bounds = null;
        for (var i = 0; i < this.traces.length; ++i) {
            await this.traces[i].update();

            // TODO: Move
            if (this.traces[i].title) {
                document.querySelector(`#panel-${this.id} .title`).innerText = this.traces[i].title;
            }

            if (bounds) {
                bounds.join(this.traces[i].bounds);
            }
            else {
                bounds = this.traces[i].bounds;
            }
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

        let xScale = d3.scaleLinear()
            .domain([ bounds.xMin, bounds.xMax ])
            .range([ 0, width ]);

        let xAxis = svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale));

        let yScale = d3.scaleLinear()
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
};