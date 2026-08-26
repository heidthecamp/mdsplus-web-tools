
import { Bounds } from "../common/bounds.js";
import { Position } from "../common/position.js";
import { D3Renderer } from "../common/d3Renderer.js";
import * as Utils from "../common/utils.js";

import { Scope } from "./scope.js";
import { Trace } from "../common/trace.js";
import { ConfirmForm, Form } from "../common/form.js";

let NextId = 1;

export class Panel
{
    constructor(
        title = null,
    ) {
        this.id = NextId++;

        this.widget = null;

        this.title = title;

        this.traces = [];

        this.viewStack = [];
    }

    addTrace(trace) {
        trace.setPanel(this);
        this.traces.push(trace);
    }

    removeTrace(traceOrIndex) {
        if (traceOrIndex instanceof Trace) {
            let index = this.traces.indexOf(trace);
            if (index != -1) {
                this.traces.splice(index, 1);
            }
        }
        else {
            this.traces.splice(traceOrIndex, 1);
        }
    }

    async refresh()
    {
        let index = Scope.updating.indexOf(this);
        if (index != -1) {
            Scope.updating.splice(index, 1);
        }
        
        Utils.showStatusMessage(`Refreshing panel...`);
        let before = performance.now();

        await this.update();
        await this.render();

        let after = performance.now();
        let duration = (after - before) / 1000.0;
        Utils.showStatusMessage(`Panel refresh took ${duration.toFixed(1)}s`);
    }

    update() {
        // virtual
    }

    async render() {
        if (this.renderer !== null) {
            this.renderer.render(this.traces);
        }
    }

    edit() {
        // virtual
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

    async onZoomIn(bounds) {
        this.pushZoom(bounds);
        await this.update();
        this.render();
    }

    async onZoomOut() {
        this.popZoom();
        await this.update();
        this.render();
    }

    position() {
        if (this.widget === null) {
            return null;
        }

        return {
            width: this.widget.gridstackNode.w,
            height: this.widget.gridstackNode.h,
            x: this.widget.gridstackNode.x,
            y: this.widget.gridstackNode.y,
        }
    }

    // addToGrid
    // something else
    addElement(position=null)
    {
        if (position === null) {
            position = new Position();
        }

        if (position.width === null) {
            position.width = 12;
        }

        if (position.height === null) {
            position.height = 6;
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

        this.widget.querySelectorAll('*[data-action="refresh-panel"]')
            .forEach((node) => {
                node.addEventListener('click', async (e) => {
                    e.preventDefault();
                    await this.refresh();
                });
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
                    Form.show(new ConfirmForm("Delete panel?",
                        () => {
                            this.removeElement()
                        }
                    ));
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

        this.renderer = new D3Renderer(
            this.widget.querySelector('.plot'),
            (bounds) => this.onZoomIn(bounds),
            () => this.onZoomOut()
        );
    }

    removeElement() {
        // TODO: call Scope.grid.removeWidget, and null out widget
        // TODO: 
        // document.getElementById(`panel-${this.id}`).remove();

        Scope.grid.removeWidget(this.widget, true, true);

        // TODO: Move into Scope.removePanel or something
        let index = Scope.panels.indexOf(this);
        Scope.panels.splice(index, 1);

        Scope.queueAutosave();
    }
}
