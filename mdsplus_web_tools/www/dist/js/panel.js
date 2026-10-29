
import { Bounds } from "./bounds.js";
import { ConfirmForm } from "./confirm-form.js";
import { D3Renderer } from "./d3-renderer.js";
import { Form } from "./form.js";
import { Position } from "./position.js";
import { Scope } from "./scope.js";
import { Trace } from "./trace.js";

import * as Utils from "./utils.js";

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

    async update() {
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
            for (let j = 0; j < this.traces[i].initialData.length; ++j) {
                // For every point...
                for (let k = 0; k < this.traces[i].initialData[j].length; ++k){
                    let val = this.traces[i].initialData[j][k];
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
            for (let j = 0; j < this.traces[i].initialData.length; ++j) {
                // For every point...
                for (let k = 0; k < this.traces[i].initialData[j].length; ++k){
                    let val = this.traces[i].initialData[j][k];
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

        Utils.bindActions('panel-refresh', () => this.refresh(),
            { element: this.widget });

        Utils.bindActions('panel-edit', () => this.edit(),
            { element: this.widget });

        Utils.bindActions('panel-remove',
            () => ConfirmForm.ask("Delete panel?", () => this.removeElement()),
            { element: this.widget });

        Utils.bindActions('panel-all-x-auto-y',
            async () => {
                let viewport = this.viewport();
                for (var panel of Scope.panels) {
                    panel.setViewport(panel.autoY(viewport));
                    await panel.update();
                    panel.render();
                }
            },
            { element: this.widget });
            
        Utils.bindActions('panel-auto-xy',
            () => {
                this.setViewport(this.autoXY(this.viewport()));
                this.update()
                    .then(() => this.render());
            },
            { element: this.widget });
        
        Utils.bindActions('panel-auto-x',
            () => {
                this.setViewport(this.autoX(this.viewport()));
                this.update()
                    .then(() => this.render());
            },
            { element: this.widget });
        
        Utils.bindActions('panel-auto-y',
            () => {
                this.setViewport(this.autoY(this.viewport()));
                // await this.update(); // TODO: Is this needed?
                this.render();
            },
            { element: this.widget });

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
