
import { Bounds } from "./bounds.js";
import { Connection } from "./connection.js";
import { Form } from "./form.js";
import { MDSplusPanelForm } from "./mdsplus-panel-form.js";
import { Panel } from "./panel.js";
import { Scope } from "./scope.js";

import * as Utils from "./utils.js";

export class MDSplusPanel extends Panel
{
    constructor(
        title_expr = null,
        y_min_expr = null,
        y_max_expr = null,
        x_min_expr = null,
        x_max_expr = null,
    ) {
        super(title_expr);

        this.setConnection(Connection.current);

        this.title_expr = title_expr;
        this.y_min_expr = y_min_expr;
        this.y_max_expr = y_max_expr;
        this.x_min_expr = x_min_expr;
        this.x_max_expr = x_max_expr;

        this.traces = [];
    }

    // TODO: Remove?
    setConnection(conn) {
        if (conn == null) {
            this.connection = new Connection();
        }
        else {
            this.connection = conn;
        }
    }

    async calculateBounds()
    {
        let bounds = new Bounds();

        let request = [];

        // TODO: try/catch parseFloat to avoid call to getMany

        let x_min_expr = this.getPropertyOrDefault('x_min_expr');
        if (x_min_expr !== null) {
            request.push([ 'x_min', `${x_min_expr}` ]);
        }
        
        let x_max_expr = this.getPropertyOrDefault('x_max_expr');
        if (x_max_expr !== null) {
            request.push([ 'x_max', `${x_max_expr}` ]);
        }

        let y_min_expr = this.getPropertyOrDefault('y_min_expr');
        if (y_min_expr !== null) {
            request.push([ 'y_min', `${y_min_expr}` ]);
        }
        
        let y_max_expr = this.getPropertyOrDefault('y_max_expr');
        if (y_max_expr !== null) {
            request.push([ 'y_max', `${y_max_expr}` ]);
        }

        try {
            // TODO: Move to Panel.update()
            if (request.length > 0) {
                await this.connection.getMany(request)
                .then((response) => {
                    response.checkForErrors();

                    if (response.hasValue('x_min')) {
                        bounds.xMin = response.getValue('x_min');
                    }

                    if (response.hasValue('x_max')) {
                        bounds.xMax = response.getValue('x_max');
                    }

                    if (response.hasValue('y_min')) {
                        bounds.yMin = response.getValue('y_min');
                    }

                    if (response.hasValue('y_max')) {
                        bounds.yMax = response.getValue('y_max');
                    }
                });
            }
        }
        catch (e) {
            Utils.showErrorMessage(e.message, () => {
                this.edit();

                // TODO: Cleanup
                let input = Form.activeForm.getInput(e.field);
                Utils.focusElement(input);
            });
            bounds = null;
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

    async edit() {
        Form.show(new MDSplusPanelForm(this));
    }

    showError(message) {
        console.error(message);
        this.widget.querySelector('.plot').innerHTML = `<div class="error">${message}</div>`;
        this.widget.style.opacity = 1;
    }

    async update()
    {
        if (this.widget === null) {
            return;
        }

        // TODO: Fix conflit with preview
        this.widget.style.opacity = 0.2;
        let error = this.widget.querySelector('.error');
        if (error != null) {
            error.remove();
        }

        // TODO: Improve?
        let count = this.widget.querySelector('.plot').getBoundingClientRect().width * 2;

        let bounds = this.viewport();
        let initialZoom = (bounds == null);

        if (initialZoom) {
            bounds = await this.calculateBounds();
        }

        let updateFailed = false;
        let view = new Bounds();
        for (var i = 0; i < this.traces.length; ++i) {
            try {
                if (initialZoom) {
                    this.traces[i].initialData = null; // HACK:
                }
                await this.traces[i].update(this.connection, bounds, count);
            }
            catch (e) {
                updateFailed = true;
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

        let title = this.widget.querySelector('.title');
        if (updateFailed) {
            title.innerText = '';
        }
        else {

            let request = [];
            if (this.title_expr !== null) {
                request.push([ 'title', this.title_expr ]);
            }
            else if (Scope.defaults.title_expr !== null) {
                request.push([ 'title', Scope.defaults.title_expr ]);
            }

            if (request.length > 0) {
                try {
                    await this.connection.getMany(request)
                    .then((response) => {
                        response.checkForErrors();

                        this.title = response.getValue('title');
                    });
                }
                catch (e) {
                    Utils.showErrorMessage(e.message, () => {
                        this.edit();
                        
                        // TODO: Cleanup
                        let input = Form.activeForm.getInput('title_expr');
                        Utils.focusElement(input);
                    });
                }
        
                title.innerText = this.title;
            }
            else {
                title.innerText = '';
            }
        }
    }

    async render()
    {
        if (this.widget === null) {
            return;
        }
        
        if (this.widget.querySelector('.error') != null) {
            return;
        }

        if (this.traces.length == 0) {
            return;
        }
        
        this.renderer.render(this.traces);

        this.widget.style.opacity = 1;
    }

    // TODO: Rename?
    getPropertyOrDefault(name, index=null) {
        // null indicates a panel default
        if (index !== null) {
            if (this.traces[index].hasOwnProperty(name) && this.traces[index][name] !== null) {
                if (this.traces[index][name] === '') {
                    return null;
                }
    
                return this.traces[index][name];
            }
        }
        else {
            if (this.hasOwnProperty(name) && this[name] !== null) {
                if (this[name] === '') {
                    return null;
                }

                return this[name];
            }
        }
        
        if (Scope.defaults.hasOwnProperty(name) && Scope.defaults[name] !== null) {
            if (Scope.defaults[name] === '') {
                return null;
            }

            return Scope.defaults[name];
        }

        return null;
    }

};