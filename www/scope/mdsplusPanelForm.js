
import { D3Renderer } from "../common/d3Renderer.js";
import { Form, ConfirmForm } from "../common/form.js";
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

        document.querySelectorAll('#panel-form input')
            .forEach((input) => {
                input.addEventListener('change', (e) => {
                    this.unsaved = true;
                });
            });

        document.querySelectorAll('#panel-form *[data-action="add-trace"]')
            .forEach((button) => {
                button.addEventListener('click', (e) => {
                    let id = this.addTraceForm();
                    this.showTraceForm(id);
                })
            });
    }

    cancel() {
        this.unsaved = false;
        super.cancel();
    }

    close() {
        console.log('MDSplusPanelForm close');
        if (this.unsaved) {
            new ConfirmForm(
                'You have unsaved changes, are you sure you want to close?',
                () => {
                    super.close();
                }
            )
        }
        else {
            super.close();
        }
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
        this.unsaved = false;
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

    removeTraceForm(id) {
        document.getElementById(`trace-form-${id}`).remove();
        document.getElementById(`trace-tab-${id}`).remove();

        let index = this.trace_form_ids.indexOf(id);
        this.trace_form_ids.splice(index, 1);
    }

    addTraceForm(trace=null)
    {
        let id = this.next_trace_id++;
        this.trace_form_ids.push(id);

        let $trace_form = Utils.inflateTemplate(document.getElementById('trace-form-template'));
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
                        this.close();
                    }

                });
            });

        $trace_form.querySelectorAll('*[data-action="remove-trace-form"]')
            .forEach((button) => {
                button.addEventListener('click', (e) => {
                    new ConfirmForm(
                        `Remove Trace #${id + 1}?`,
                        () => {
                            this.removeTraceForm(id);

                            // HACK:
                            if (this.trace_form_ids.length > 0) {
                                this.showTraceForm(this.trace_form_ids[0]);
                            }
                        }
                    );
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
        this.setupGlobalDefaults('x_expr', trace, id);
        this.setupGlobalDefaults('tree', trace, id);
        this.setupGlobalDefaults('shot_expr', trace, id);
        this.setupGlobalDefaults('default_node_expr', trace, id);

        // HACK:
        if (trace === null) {
            trace = {};
        }

        this.getInput('y_expr', id).value = this.valueOr(trace.y_expr, MDSplusTrace.Defaults.y_expr);
        this.getInput('x_expr', id).value = this.valueOr(trace.x_expr, MDSplusTrace.Defaults.x_expr);
        this.getInput('tree', id).value = this.valueOr(trace.tree, MDSplusTrace.Defaults.tree);
        this.getInput('shot_expr', id).value = this.valueOr(trace.shot_expr, MDSplusTrace.Defaults.shot_expr);
        this.getInput('default_node_expr', id).value = this.valueOr(trace.default_node_expr, MDSplusTrace.Defaults.default_node_expr);
        this.getInput('trace_color', id).value = this.valueOr(trace.trace_color, MDSplusTrace.Defaults.trace_color);
        
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
        let initialEdit = (this.panel.widget === null);
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
                    needUpdate = true;
                    this.panel.traces[index][name] = value;
                }
            }
            else {
                if (this.panel[name] != value) {
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
        this.unsaved = false;

        return true;
    }

    setupGlobalDefaults(name, trace=null, trace_id=null)
    {
        let $input = this.getInput(name, trace_id);
        let $checkbox = this.getInput(`${name}-default`, trace_id);

        $input.addEventListener('dblclick', (e) => {
            console.log(e);
            $checkbox.checked = false;
            $input.removeAttribute('readonly');
        });
        
        $checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                $input.setAttribute('readonly', 'readonly');
                $input.placeholder = Scope.defaults[name] ? Scope.defaults[name] : '';
            }
            else {
                $input.removeAttribute('readonly');
                $input.placeholder = '';
            }
        });

        try {
            let value = null;

            if (trace_id === null) {
                value = this.panel[name];
            }
            else {
                if (trace === null) {
                    value = MDSplusTrace.Defaults[name];
                }
                else {
                    value = trace[name];
                }
            }

            $checkbox.checked = (value === null);
            
        } catch(e) {
            console.error(e);
            $checkbox.checked = true;
        }

        // TODO: Remove, this should be automatic when onchange is called
        if ($checkbox.checked) {
            $input.setAttribute('readonly', 'readonly');
            $input.placeholder = Scope.defaults[name] ? Scope.defaults[name] : '';
        }
    }

};