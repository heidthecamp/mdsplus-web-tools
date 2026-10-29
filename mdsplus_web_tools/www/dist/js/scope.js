
import { ConfirmForm } from "./confirm-form.js";
import { Connection } from "./connection.js";
import { Form } from "./form.js";
import { MDSplusPanel } from "./mdsplus-panel.js";
import { MDSplusTrace } from "./mdsplus-trace.js";
import { SettingsForm } from "./settings-form.js";
import { TraverserSidebar } from "./traverser-sidebar.js";

import * as Export from "./export.js";
import * as Import from "./import.js";
import * as Utils from "./utils.js";

import "../external/gridstack-all.js";

const InitialDefaults = {
    tree: null,
    shot_expr: null,
    default_node_expr: null,
    title_expr: null,
    y_expr: null,
    y_min_expr: null,
    y_max_expr: null,
    x_expr: null,
    x_min_expr: null,
    x_max_expr: null,
    type: 'line',
    color: 'steelblue',
    marker: null,
};

export class Scope
{
    static whoami = null;

    static title_expr = '$SHOT';

    static defaults = Utils.cloneObject(InitialDefaults);

    static shot_expr_offset = 0;
    static resample = true;

    static grid = null;

    static panels = [];
    static updating = [];

    static autosaveTimeout = null;

    static queueAutosave() {
        clearTimeout(Scope.autosaveTimeout);
        Scope.autosaveTimeout = setTimeout(Scope.autosave, 1000);
    }

    static autosave() {
        console.info('Autosave at', performance.now().toFixed(2));
        localStorage.setItem("ws-autosave", Export.exportJSON());
    }

    static load() {
        try {
            Import.importJSON(localStorage.getItem("ws-autosave"));
        }
        catch (e) {
            Utils.showErrorMessage(e);
            
            localStorage.removeItem("ws-autosave");
            
            let sin = Scope.addPanel(
                new MDSplusPanel(
                    "'Sample Data with ' // size(_data1) + size(_data2) + size(_data3) // ' points'",
                    -1, 1, null, null,
                ),
                { x: 0, y: 0, width: 12, height: 6 }
            );
            sin.addTrace(new MDSplusTrace(
                null, null, null,
                "_data1 = sin(0 : 50 : 0.05) * 0.9",
                null,
                null,
                "red"
            ));
            sin.addTrace(new MDSplusTrace(
                null, null, null,
                "_data2 = cos(0 : 50 : 0.05) * 0.8",
                null,
                null,
                "blue"
            ));
            sin.addTrace(new MDSplusTrace(
                null, null, null,
                "_data3 = sin((0 : 50 : 0.05) - $PI) * 0.7",
                null,
                null,
                "green"
            ));
        
            Scope.setTitle("if_error($SHOT,'No Shot Open') // ' - Running as ' // whoami()");
        }
    }

    static init()
    {
        window.location.hash = 'scope';
        
        Utils.bindActions('add-panel',
            () => Scope.addPanel(new MDSplusPanel(), { width: 6, height: 6 }, true).edit());
    
        let resetShotTriggers = Utils.bindActions('reset-shot', 
            (e) => {
                Scope.shot_expr_offset = 0;

                resetShotTriggers.forEach((button) => button.disabled = true);

                Scope.refresh();
            });
    
        Utils.bindActions('prev-shot',
            (e) => {
                --Scope.shot_expr_offset;

                resetShotTriggers.forEach((button) => button.disabled = (Scope.shot_expr_offset == 0));

                Scope.refresh();
            });
    
        Utils.bindActions('next-shot',
            (e) => {
                ++Scope.shot_expr_offset;

                resetShotTriggers.forEach((button) => button.disabled = (Scope.shot_expr_offset == 0));

                Scope.refresh();
            });
    
        Utils.bindActions('reset', 
            () => {
                ConfirmForm.ask(
                    'Remove all panels and reset settings?',
                    () => Scope.reset().then(Scope.refresh)
                );
            }
        );
    
        Utils.bindActions('export', () => Export.exportFile());
    
        Utils.bindActions('import',
            async (e) => {
                console.log(e);
                // TODO: Use when widely supported
                // try {
                    // let fileHandle;
                    // [fileHandle] = await window.showOpenFilePicker({
                    //     types: [
                    //         {
                    //             description: "Scope files",
                    //             accept: {
                    //                 "text/*": [".dat", ".jscp", ".json"],
                    //             },
                    //         },
                    //     ],
                    //     excludeAcceptAllOption: true,
                    //     multiple: false,
                    // });
                    // console.log(fileHandle);
                // }
                // catch (err) {
                    // console.log(err);

                    let felement = document.createElement('input');
                    felement.setAttribute('type', 'file');
                    felement.setAttribute('accept', '.dat,.jscp,.json'); // only accept scope files
                    felement.addEventListener("change", () => {
                        for (var i = 0; i < Scope.panels.length; ++i) {
                            Scope.panels[i].removeElement();
                        }
                        document.getElementById('panels').innerHTML = ''; // HACK:
    
                        let file = felement.files[0];
                        Import.importFile(file);
                        felement.remove();
                    });
                    felement.click();
    
                    Scope.queueAutosave();
                // }
            });
    
        Utils.bindActions('refresh', () => Scope.refresh());
    
        Utils.bindActions('settings', () => Scope.edit());

        let root = document.querySelector('#scope-root');
    
        root.addEventListener('drop', async (e) => {
            e.preventDefault();
            
            root.classList.remove('drag');

            const file = e.dataTransfer.items[0].getAsFile();
            if (file === null) {
                return;
            }

            // TODO: Additional filtering

            for (var i = 0; i < Scope.panels.length; ++i) {
                Scope.panels[i].removeElement();
            }
            document.getElementById('panels').innerHTML = ''; // HACK:

            await Import.importFile(file);

            Scope.queueAutosave();
        });

        root.addEventListener('dragenter', (e) => {
            root.classList.add('drag');
        });

        root.addEventListener('dragleave', (e) => {
            if (e.target == root) {
                root.classList.remove('drag');
            }
        });

        root.addEventListener('dragover', (e) => {
            // Allow us to handle 'drop' events
            e.preventDefault();
        });


        let resizeTimeout = null;
        let updateTimeout = null;
        let previousWindowWidth = window.innerWidth;
        window.addEventListener('resize', (e) => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(Scope.render, 100);

            if (window.innerWidth > previousWindowWidth) {
                clearTimeout(updateTimeout);
                updateTimeout = setTimeout(Scope.refresh, 1000);
            }
            previousWindowWidth = window.innerWidth;
        });

        // document.querySelector('#parallel')
        //     .addEventListener('change', (e) => { setParallel(e.target.checked); });
    
        TraverserSidebar.init();
        
        Scope.initGrid();

        Scope.load();

        Utils.bindTooltips(); // TODO: Limit to .scope
    }

    static initGrid() {
        // Otherwise it will render the HTML as text :(
        GridStack.renderCB = function(el, w) {
            el.innerHTML = w.content;
        };
        
        // TODO: Figure out how/why this keeps adding padding at the bottom
        Scope.grid = GridStack.init({
            itemClass: 'panel',
            column: 12,
            handle: '.handle',
            animate: false,
            margin: 1,
            cellHeight: 50,
        });

        Scope.grid.on('dragstop', async (e) => {
            Scope.queueAutosave();
        });

        Scope.grid.on('resizestop', async (e) => {
            let id = e.target.ddElement.el.getAttribute('gs-id');
            let panel = Scope.getPanelById(id);
            await panel.update();
            await panel.render();

            Scope.queueAutosave();
        });
    };

    static async reset() {

        Utils.showErrorMessage(null);
        Utils.showStatusMessage(null);

        Scope.title_expr = "\"MDSplus Scope\"";
        Scope.defaults = Utils.cloneObject(InitialDefaults);
        Scope.shot_expr_offset = 0;

        let panelsToRemove = Scope.panels;
        Scope.panels = [];

        for (var i = 0; i < panelsToRemove.length; ++i) {
            panelsToRemove[i].removeElement();
        }

        // TODO: Should this be here?
        await Scope.closeAllTrees()
            .then(() => Scope.updateMetadata(true));

        Scope.initGrid();

        Utils.displayValue('current-shot', 'No Current');

        Scope.queueAutosave();
    }

    static async refresh() {
        if (Scope.updating.length > 0) {
            await Scope.updateMetadata();
            Scope.updating = Utils.cloneArray(Scope.panels);
            return;
        }

        Utils.showStatusMessage(`Refreshing...`);
        let before = performance.now();

        Scope.updating = Utils.cloneArray(Scope.panels);
        
        // HACK:
        await Scope.updateMetadata();

        while (Scope.updating.length > 0) {
            let panel = Scope.updating.shift();
            panel.resetViewport();
            await panel.update(true);
            await panel.render();
        }

        await Scope.updateMetadata();

        let after = performance.now();
        let duration = (after - before) / 1000.0;
        Utils.showStatusMessage(`Refresh took ${duration.toFixed(1)}s`);
    }

    static async render() {
        for (var i = 0; i < Scope.panels.length; ++i) {
            let panel = Scope.panels[i];
            if (Scope.updating.indexOf(panel) == -1) {
                await panel.render();
            }
        }
    }

    static getPanelById(id) {
        id = parseInt(id);

        for (let i = 0; i < Scope.panels.length; ++i) {
            if (Scope.panels[i].id == id) {
                return Scope.panels[i];
            }
        }

        return null;
    }

    static addPanel(panel, position=null, initialEdit=false) {
        Scope.panels.push(panel);
        if (!initialEdit) {
            panel.addElement(position);
        }
        else {
            panel.initialPosition = position;
        }
        return panel;
    }
    
    static async setTitle(title_expr) {
        Scope.title_expr = title_expr;
        await Scope.updateMetadata();

        this.queueAutosave();
    }

    static async updateMetadata(force=false) {
        let request = [];

        if (force || Scope.whoami === null) {
            request.push(['whoami', 'whoami()']);
        }

        if (force || Scope.title_expr !== null && Scope.title_expr !== '') {
            request.push(['title', Scope.title_expr]);
        }

        if (force || Scope.defaults.shot_expr !== null && Scope.defaults.shot_expr !== '') {
            request.push(['shot', Scope.defaults.shot_expr]);
            request.push(['shot_with_offset', Scope.defaults.shot_expr + '+' + Scope.shot_expr_offset]);
        }

        if (request.length > 0) {
            try {
                await Connection.current.getMany(request)
                .then((response) => {
                    if (response.hasValue('whoami')) {
                        Scope.whoami = response.getValue('whoami');

                        document.querySelector('#username').innerText = `Connected as ${Scope.whoami}`;
                    }

                    if (response.hasValue('title')) {
                        Scope.title = response.getValue('title', 'MDSplus Scope');

                        document.title = Scope.title;
                        document.querySelectorAll('.window-title')
                            .forEach((e) => {
                                e.innerText = Scope.title;
                            });
                    }

                    if (response.hasValue('shot')) {
                        let shot_expr = response.getValue('shot');
                        let shot_with_offset = response.getValue('shot_with_offset');
                        if (shot_expr === null || shot_with_offset === null) {
                            shot_expr = 'No Current';
                            shot_with_offset = 'No Current';
                        }
                        else {
                            shot_expr = shot_expr.toString();
                            if (Scope.shot_expr_offset > 0) {
                                shot_expr += '+' + Scope.shot_expr_offset;
                            }
                            else if (Scope.shot_expr_offset < 0) {
                                shot_expr += Scope.shot_expr_offset;
                            }
                        }

                        Utils.displayValue('current-shot', shot_with_offset)
                            .forEach((element) => {
                                let tooltip = bootstrap.Tooltip.getOrCreateInstance(element);
                                tooltip.setContent({ '.tooltip-inner': shot_expr });
                            });
                    }
                });
            }
            catch (e) {
                // if (!e.message.startsWith('%TREE-W-NOT_OPEN')) {
                if (e !== null) {
                    Utils.showErrorMessage(e.message, () => {
                        Scope.edit()
                        
                        // TODO: Highlight problematic field
                    });
                }
            }
        }
    }

    static async closeAllTrees() {
        await Connection.current.getMany([
            ['close', '_i=0;WHILE(IAND(TreeClose(),1)) _i++;_i'],
        ]);
    }

    static edit() {
        Form.show(new SettingsForm());
    }
};