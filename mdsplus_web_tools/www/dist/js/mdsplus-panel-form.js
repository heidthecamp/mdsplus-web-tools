
import { ConfirmForm } from "./confirm-form.js";
import { D3Renderer } from "./d3-renderer.js";
import { Form } from "./form.js";
import { MDSplusTrace } from "./mdsplus-trace.js";
import { Scope } from "./scope.js";
import { TraverserSidebar } from "./traverser-sidebar.js";

import * as Utils from "./utils.js";

export class MDSplusPanelForm extends Form
{
    constructor(panel)
    {
        super('panel-form-template')
        this.panel = panel;
        this.previewRenderer = null;

        this.nextTraceID = 0;
        this.traceFormIDs = [];

        this.reset();

        // TODO: Needs to happen after reset()
        this.previewRenderer = new D3Renderer(this.element.querySelector('.preview'));
        this.previewRenderer.render(this.panel.traces);

        let resizeTimeout = null;
        window.addEventListener('resize', (e) => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.previewRenderer.render(this.panel.traces);
            }, 100);
        });

        // TODO: Call after addTraceForm?
        this.element.querySelectorAll('input')
            .forEach((input) => {
                input.addEventListener('keyup', (e) => {
                    // TODO: Remove event listener after first trigger
                    this.unsaved = true;
                });
            });

        Utils.bindActions('add-trace',
            () => {
                let id = this.addTraceForm();
                this.showTraceForm(id);
            },
            { element: this.element });

        Utils.bindTooltips(this.element);
    }

    cancel() {
        this.unsaved = false;
        super.cancel();
    }

    close() {
        if (this.unsaved) {
            ConfirmForm.ask(
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
        if (this.previewRenderer !== null) {
            this.previewRenderer.render(this.panel.traces);
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

        while (this.traceFormIDs.length > 0) {
            this.removeTraceForm(this.traceFormIDs.at(-1));
        }

        this.nextTraceID = 0;
        this.traceFormIDs = [];

        if (this.panel.traces.length > 0) {
            for (let i = 0; i < this.panel.traces.length; ++i) {
                this.addTraceForm(this.panel.traces[i]);
            }
        }
        else {
            this.addTraceForm();
        }

        this.showTraceForm(0);

        // Has to follow calls to add/removeTraceForm which set unsaved=true
        this.unsaved = false;
    }

    getInput(name, trace_id=null) {
        if (trace_id === null) {
            return this.element.querySelector(`#panel-form-${name}`);
        }
        else {
            return this.element.querySelector(`#trace-form-${name}-${trace_id}`);
        }
    }

    removeTraceForm(id) {
        document.getElementById(`trace-form-${id}`).remove();
        document.getElementById(`trace-tab-${id}`).remove();

        let index = this.traceFormIDs.indexOf(id);
        this.traceFormIDs.splice(index, 1);

        this.unsaved = true;
    }

    addTraceForm(trace=null)
    {
        let id = this.nextTraceID++;
        this.traceFormIDs.push(id);

        let traceForm = Utils.inflateTemplate(document.getElementById('trace-form-template'));
        traceForm.id = `trace-form-${id}`;
        traceForm.dataset.id = id;

        // Append the trace ID to the input IDs
        traceForm.querySelectorAll('input')
            .forEach(node => {
                node.id += `-${id}`;
            });

        // Update the labels to match the new input IDs
        traceForm.querySelectorAll('label')
            .forEach(node => {
                node.htmlFor += `-${id}`;
            });

        Utils.bindTooltips(traceForm);

        Utils.bindActions('trace-duplicate', () => this.cloneTraceForm(id),
            { element: traceForm });

        Utils.bindActions('trace-reveal',
            () => {
                let doReveal = async () => {
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
                        node = node.replaceAll(/([\s;,]_[a-zA-Z_]+)/g, '');

                        // Filter out scientific notation
                        node = node.replaceAll(/([0-9]e[0-9]+)/g, '');

                        // Find first thing that looks like a node
                        let matches = node.match(/(\\?\\?[a-zA-Z][a-zA-Z0-9_:\.]+)/);
                        node = matches[0];

                        let default_node_expr = this.valueOr(this.getInput('default_node_expr', id).value);
                        if (this.getInput('default_node_expr-default', id).checked) {
                            default_node_expr = Scope.defaults.default_node_expr;
                        }

                        traverser.reveal(node, default_node_expr);

                        // HACK: Effectively "cancel"
                        this.close();
                    }
                }

                if (this.unsaved) {
                    ConfirmForm.ask('You have unsaved changes, proceed?', doReveal);
                }
                else {
                    doReveal();
                }
            },
        { element: traceForm });

        Utils.bindActions('trace-remove',
            () => {
                ConfirmForm.ask(
                    `Remove Trace #${id + 1}?`,
                    () => {
                        this.removeTraceForm(id);

                        // HACK:
                        if (this.traceFormIDs.length > 0) {
                            this.showTraceForm(this.traceFormIDs[0]);
                        }
                    }
                );
            },
            { element: traceForm });

        // TODO: Improve
        document.querySelector('#trace-forms').append(traceForm);

        // Add a tab for the trace
        let traceTab = document.createElement('li');
        traceTab.id = `trace-tab-${id}`;
        traceTab.classList.add('trace-tab', 'nav-item');

        // Loop and update trace link names upon adding/removing
        
        let traceLink = document.createElement('a');
        traceLink.classList.add('nav-link');
        traceLink.innerText = `Trace #${id + 1}`;
        traceLink.role = 'button';
        traceTab.append(traceLink);

        // TODO: Improve
        document.querySelector('#trace-form-tabs').append(traceTab);

        traceTab.addEventListener('click', (e) => {
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
        this.getInput('color', id).value = this.valueOr(trace.color, MDSplusTrace.Defaults.color);

        this.unsaved = true;

        return id;
    }

    cloneTraceForm(other_id)
    {
        let id = this.addTraceForm();

        this.copyTraceInput('y_expr', id, other_id);
        this.copyTraceInput('x_expr', id, other_id);
        this.copyTraceInput('tree', id, other_id);
        this.copyTraceInput('shot_expr', id, other_id);
        this.copyTraceInput('default_node_expr', id, other_id);
        this.copyTraceInput('color', id, other_id);

        this.showTraceForm(id);

        let traceTab = document.querySelector(`#trace-tab-${id}`);
        Utils.focusElement(traceTab);

        this.unsaved = true;

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
            this.panel.addElement(this.panel.initialPosition);
        }

        let needUpdate = initialEdit;

        while (this.panel.traces.length > this.traceFormIDs.length) {
            this.panel.removeTrace(-1);
        }
        while (this.panel.traces.length < this.traceFormIDs.length) {
            this.panel.addTrace(new MDSplusTrace());
        }

        let updateValue = (name, index=null) => {
            let id = null;
            if (index !== null) {
                id = this.traceFormIDs[index];
            }

            let input = this.getInput(name, id);
            let checkbox = this.getInput(`${name}-default`, id);

            let value = input.value.trim();
            if (checkbox !== null) {
                if (checkbox.checked) {
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

        for (var i = 0; i < this.traceFormIDs.length; ++i) {
            updateValue('tree', i);
            updateValue('shot_expr', i);
            updateValue('default_node_expr', i);
            updateValue('y_expr', i);
            updateValue('x_expr', i);
            updateValue('color', i);
        }

        if (needUpdate) {
            this.panel.refresh()
                .then(() => this.previewRenderer.render(this.panel.traces));
        }

        Scope.queueAutosave();
        this.unsaved = false;

        return true;
    }

    copyTraceInput(name, trace_id, old_trace_id) {
        let input = this.getInput(name, trace_id);
        let checkbox = this.getInput(`${name}-default`, trace_id);

        input.value = this.getInput(name, old_trace_id).value;
        if (checkbox !== null) { // TODO: Remove if everything has a global default
            checkbox.checked = this.getInput(`${name}-default`, old_trace_id).checked;

            if (checkbox.checked) {
                input.setAttribute('readonly', 'readonly');
            }
            else {
                input.removeAttribute('readonly');
            }
        }
    }

    setupGlobalDefaults(name, trace=null, trace_id=null)
    {
        let input = this.getInput(name, trace_id);
        let checkbox = this.getInput(`${name}-default`, trace_id);

        input.addEventListener('dblclick', (e) => {
            checkbox.checked = false;
            input.removeAttribute('readonly');
            
            input.value = input.getAttribute('placeholder');
            input.removeAttribute('placeholder');
        });
        
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                input.setAttribute('readonly', 'readonly');
                input.placeholder = Scope.defaults[name] ? Scope.defaults[name] : '';
            }
            else {
                input.removeAttribute('readonly');
                input.placeholder = '';
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

            checkbox.checked = (value === null);
            
        } catch(e) {
            console.error(e);
            checkbox.checked = true;
        }

        // TODO: Remove, this should be automatic when onchange is called
        if (checkbox.checked) {
            input.setAttribute('readonly', 'readonly');
            input.placeholder = Scope.defaults[name] ? Scope.defaults[name] : '';
        }
    }

};