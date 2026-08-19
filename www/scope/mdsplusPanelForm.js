
import { D3Renderer } from "../common/d3Renderer.js";
import { Form } from "../common/form.js";
import { MDSplusTrace } from "./mdsplusTrace.js";
import { Scope } from "./scope.js";
import { TraverserSidebar } from "./traverserSidebar.js";

import * as Utils from "../common/utils.js";

export class MDSplusPanelForm extends Form
{
    constructor(panel)
    {
        super('panel-form-template')
        this.panel = panel;
        this.preview_renderer = null;

        this.next_trace_id = 0;
        this.trace_form_ids = [];

        this.reset();

        // TODO: Needs to happen after reset()
        this.preview_renderer = new D3Renderer(document.querySelector('#panel-preview'));
        this.preview_renderer.render(this.panel.traces);

        document.querySelectorAll(`#panel-form *[data-action="add-trace"]`)
            .forEach((button) => {
                button.addEventListener('click', (e) => {
                    let id = this.addTraceForm();
                    this.showTraceForm(id);
                })
            });
    }

    reset() {
        if (this.preview_renderer !== null) {
            this.preview_renderer.render(this.panel.traces);
        }

        this.setupGlobalDefaults('title_expr');
        this.setupGlobalDefaults('y_min_expr');
        this.setupGlobalDefaults('y_max_expr');
        this.setupGlobalDefaults('x_min_expr');
        this.setupGlobalDefaults('x_max_expr');

        this.getInput('title_expr').value = this.valueOr(this.panel.title_expr, '');
        this.getInput('y_min_expr').value = this.valueOr(this.panel.y_min_expr, '');
        this.getInput('y_max_expr').value = this.valueOr(this.panel.y_max_expr, '');
        this.getInput('x_min_expr').value = this.valueOr(this.panel.x_min_expr, '');
        this.getInput('x_max_expr').value = this.valueOr(this.panel.x_max_expr, '');

        while (this.trace_form_ids.length > 0) {
            this.removeTraceForm(this.trace_form_ids.at(-1));
        }

        this.next_trace_id = 0;
        this.trace_form_ids = [];

        if (this.panel.traces.length > 0) {
            for (let i = 0; i < this.panel.traces.length; ++i) {
                this.addTraceForm(this.panel.traces[i]);
            }
        }
        else {
            this.addTraceForm();
        }

        this.showTraceForm(0);

    }

    getInput(name, trace_id=null)
    {
        if (trace_id === null) {
            return document.getElementById(`panel-${name}`);
        }
        else {
            return document.getElementById(`trace-${name}-${trace_id}`);
        }
    }

    getTraceForm(id) {

    }

    addTraceForm(trace=null)
    {
        let id = this.next_trace_id++;
        this.trace_form_ids.push(id);

        let $trace_form = Utils.inflateTemplate('trace-form-template').firstElementChild;
        $trace_form.id = `trace-form-${id}`;
        $trace_form.dataset.id = id;

        // Append the trace ID to the input IDs
        $trace_form.querySelectorAll('input').forEach(node => {
            node.id += `-${id}`;
        });

        // Update the labels to match the new input IDs
        $trace_form.querySelectorAll('label').forEach(node => {
            node.htmlFor += `-${id}`;
        });

        $trace_form.querySelectorAll('*[data-action="reveal-trace-in-traverser"]')
            .forEach((button) => {
                button.addEventListener('click', async (e) => {
                    let tree = this.getInput('tree', id).value;
                    if (this.getInput('tree-default', id).checked) {
                        tree = Scope.defaults.tree;
                    }

                    let shot_expr = this.getInput('shot_expr', id).value;
                    if (this.getInput('shot_expr-default', id).checked) {
                        shot_expr = Scope.defaults.shot_expr;
                    }

                    let traverser = await TraverserSidebar.findOrOpen(tree, shot_expr);

                    let node = this.getInput('y_expr', id).value;
                    if (this.getInput('y_expr-default', id).checked) {
                        node = Scope.defaults.y_expr;
                    }

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

                        let default_node_expr = this.getInput('default_node_expr', id).value;
                        if (this.getInput('default_node_expr-default', id).checked) {
                            default_node_expr = Scope.defaults.default_node_expr;
                        }

                        traverser.reveal(node, default_node_expr);

                        // HACK: Effectively "cancel"
                        Utils.hideOverlay();
                    }

                });
            });

        $trace_form.querySelectorAll('*[data-action="remove-trace-form"]')
            .forEach((button) => {
                button.addEventListener('click', (e) => {
                    this.removeTraceForm(id);

                    // HACK:
                    if (this.trace_form_ids.length > 0) {
                        this.showTraceForm(this.trace_form_ids[0]);
                    }
                })
            });

        // TODO: Improve
        document.querySelector('#trace-forms').append($trace_form);

        // Add a tab for the trace
        let $trace_tab = document.createElement('li');
        $trace_tab.id = `trace-tab-${id}`;
        $trace_tab.classList.add('trace-tab', 'nav-item');

        // Loop and update trace link names upon adding/removing
        
        let $trace_link = document.createElement('a');
        $trace_link.classList.add('nav-link');
        $trace_link.innerText = `Trace #${id + 1}`;
        $trace_link.role = 'button';
        $trace_tab.append($trace_link);

        // TODO: Improve
        document.querySelector('#trace-form-tabs').append($trace_tab);

        $trace_tab.addEventListener('click', (e) => {
            this.showTraceForm(id);
        });

        this.setupGlobalDefaults('y_expr', trace, id);
        this.setupGlobalDefaults('x_expr', trace,id);
        this.setupGlobalDefaults('tree', trace,id);
        this.setupGlobalDefaults('shot_expr', trace,id);
        this.setupGlobalDefaults('default_node_expr', trace,id);

        if (trace !== null) {
            this.getInput('y_expr', id).value = this.valueOr(trace.y_expr, '');
            this.getInput('x_expr', id).value = this.valueOr(trace.x_expr, '');
            this.getInput('tree', id).value = this.valueOr(trace.tree, '');
            this.getInput('shot_expr', id).value = this.valueOr(trace.shot_expr, '');
            this.getInput('default_node_expr', id).value = this.valueOr(trace.default_node_expr, '');
            this.getInput('color', id).value = this.valueOr(trace.trace_color, 'black');
        }
        
        return id;
    }

    showTraceForm(id)
    {
        // TODO: Improve
        document.querySelectorAll('.trace-tab .nav-link')
            .forEach((tab) => {
                tab.classList.remove('active');
            });

        document.querySelectorAll('.trace-form')
            .forEach((form) => {
                form.classList.remove('shown');
            });

        document.querySelector(`#trace-tab-${id} .nav-link`).classList.add('active');
        document.querySelector(`#trace-form-${id}`).classList.add('shown');
    }

    apply() {
        let initialEdit = (this.panel.element === null);
        if (initialEdit) {
            this.panel.addElement();
        }

        let needUpdate = false;

        while (this.panel.traces.length > this.trace_form_ids.length) {
            this.panel.removeTrace(-1);
        }
        while (this.panel.traces.length < this.trace_form_ids.length) {
            this.panel.addTrace(new MDSplusTrace());
        }

        let updateValue = (name, index=null) => {
            let id = null;
            if (index !== null) {
                id = this.trace_form_ids[index];
            }

            let $input = this.getInput(name, id);
            let $checkbox = this.getInput(`${name}-default`, id);

            let value = $input.value.trim();
            if ($checkbox !== null) {
                if ($checkbox.checked) {
                    value = null;
                }
            }

            if (index != null) {
                // HACK?
                if (this.panel.traces[index][name] != value) {
                    console.log(name, index, 'changed');
                    console.log(this.panel.traces[index][name], value);
                    needUpdate = true;
                    this.panel.traces[index][name] = value;
                }
            }
            else {
                if (this.panel[name] != value) {
                    console.log(name, 'changed');
                    needUpdate = true;
                    this.panel[name] = value;
                }
            }
        };

        updateValue('title_expr');
        updateValue('y_min_expr');
        updateValue('y_max_expr');
        updateValue('x_min_expr');
        updateValue('x_max_expr');

        for (var i = 0; i < this.trace_form_ids.length; ++i) {
            updateValue('tree', i);
            updateValue('shot_expr', i);
            updateValue('default_node_expr', i);
            updateValue('y_expr', i);
            updateValue('x_expr', i);
            updateValue('trace_color', i);
        }

        if (needUpdate) {
            this.panel.refresh()
                .then(() => this.preview_renderer.render(this.panel.traces));
        }

        Scope.queueAutosave();

        return true;
    }

    setupGlobalDefaults(name, trace=null, trace_id=null)
    {
        let $input = this.getInput(name, trace_id);
        let $checkbox = this.getInput(`${name}-default`, trace_id);
        
        $checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                $input.disabled = true;
                $input.placeholder = Scope.defaults[name] ? Scope.defaults[name] : '';
            }
            else {
                $input.disabled = false;
                $input.placeholder = '';
            }
        });

        try {
            if (trace === null) {
                $checkbox.checked = (this.panel[name] === null);
            }
            else {
                $checkbox.checked = (trace[name] === null);
            }
        } catch(e) {
            console.error(e);
            $checkbox.checked = true;
        }

        // TODO: Remove, this should be automatic when onchange is called
        if ($checkbox.checked) {
            $input.disabled = true;
            $input.placeholder = Scope.defaults[name] ? Scope.defaults[name] : '';
        }
    }

};