
import { ConfirmForm } from "./confirm-form.js";
import { Connection } from "./connection.js";
import { Form } from "./form.js";
import { MDSplusPanel } from "./mdsplus-panel.js";
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
    trace_type: 'line',
    trace_color: 'steelblue',
    point_type: null,
    point_color: null,
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

    static autosave_timeout = null;

    static queueAutosave() {
        clearTimeout(Scope.autosave_timeout);
        Scope.autosave_timeout = setTimeout(Scope.autosave, 1000);
    }

    static autosave() {
        console.info('Autosave at', performance.now().toFixed(2));
        localStorage.setItem("ws-autosave", Export.exportJSON());
    }

    static init()
    {
        window.location.hash = 'scope';
        
        document.querySelector('*[data-action="add-panel"]')
            .addEventListener('click', (e) => {
                Scope.addPanel(new MDSplusPanel(), null, true).edit();
            });
    
        document.querySelector('*[data-action="prev-shot"]')
            .addEventListener('click', async (e) => {
                --Scope.shot_expr_offset;

                document.querySelectorAll('*[data-action="reset-shot"]')
                    .forEach((button) => button.disabled = (Scope.shot_expr_offset == 0));

                Scope.refresh();
            });
    
        document.querySelector('*[data-action="next-shot"]')
            .addEventListener('click', async (e) => {
                ++Scope.shot_expr_offset;

                document.querySelectorAll('*[data-action="reset-shot"]')
                    .forEach((button) => button.disabled = (Scope.shot_expr_offset == 0));

                Scope.refresh();
            });
    
        document.querySelector('*[data-action="reset-shot"]')
            .addEventListener('click', async (e) => {
                Scope.shot_expr_offset = 0;

                document.querySelectorAll('*[data-action="reset-shot"]')
                    .forEach((button) => button.disabled = true);

                Scope.refresh();
            });
    
        document.querySelector('*[data-action="reset"]')
            .addEventListener('click', async (e) => {
                ConfirmForm.ask(
                    'Remove all panels and reset settings?',
                    () => {
                        Scope.reset().then(Scope.refresh);
                    }
                );
            });
    
        document.querySelector('*[data-action="export"]')
            .addEventListener('click', async (e) => {
                Export.exportFile();
            });
    
        document.querySelector('*[data-action="import"]')
            .addEventListener('click', async (e) => {
                // TODO: ????
                try {
                    const pickerOpts = {
                        types: [
                            {
                                description: "dwscope",
                                accept: {
                                    "*": [".dat"],
                                },
                            },
                            {
                                description: "jScope",
                                accept: {
                                    "*": [".dat", ".jscp"],
                                },
                            },
                            {
                                description: "Web Scope",
                                accept: {
                                    "*": [".json"],
                                },
                            },
                        ],
                        excludeAcceptAllOption: true,
                        multiple: false,
                    }
    
                    let fileHandle;
                    [fileHandle] = await window.showOpenFilePicker(pickerOpts);
                    
                    // TODO: Investigate
                }
                catch {
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
                }
            })
    
        document.querySelector('*[data-action="refresh"]')
            .addEventListener('click', async (e) => {
                Scope.refresh();
            });
    
        document.querySelector('*[data-action="settings"]')
            .addEventListener('click', (e) => {
                Scope.edit();
            });

        let scopePage = document.querySelector('#scope-page');
    
        scopePage.addEventListener('drop', async (e) => {
            e.preventDefault();
            
            scopePage.classList.remove('drag');

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

        scopePage.addEventListener('dragenter', (e) => {
            console.log('enter', e.target);

            scopePage.classList.add('drag');
        });

        scopePage.addEventListener('dragleave', (e) => {
            console.log('leave', e.target);

            if (e.target == scopePage) {
                scopePage.classList.remove('drag');
            }
        });

        scopePage.addEventListener('dragover', (e) => {
            // Allow us to handle 'drop' events
            e.preventDefault();
        });

        function finishResize() {
            Scope.panels.forEach(panel => {
                panel.render();
            });
        }

        let previousWindowWidth = window.innerWidth;

        window.addEventListener('resize', (e) => {
            clearTimeout(window.resizeTimeout);
            window.resizeTimeout = setTimeout(finishResize, 100);

            if (window.innerWidth > previousWindowWidth) {
                clearTimeout(window.updateTimeout);
                window.updateTimeout = setTimeout(Scope.refresh, 1000);
            }
            previousWindowWidth = window.innerWidth;
        })

        // document.querySelector('#parallel')
        //     .addEventListener('change', (e) => { setParallel(e.target.checked); });
    
        TraverserSidebar.init();
        
        Scope.initGrid();
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

        await Scope.closeAllTrees()
            .then(() => Scope.updateMetadata());

        Scope.initGrid();

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

    static async updateMetadata() {
        let request = [];

        if (Scope.whoami === null) {
            request.push(['whoami', 'whoami()']);
        }

        if (Scope.title_expr !== null && Scope.title_expr !== '') {
            request.push(['title', Scope.title_expr]);
        }

        if (Scope.defaults.shot_expr !== null && Scope.defaults.shot_expr !== '') {
            request.push(['shot', Scope.defaults.shot_expr + '+' + Scope.shot_expr_offset]);
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
                        document.querySelector('#current-shot').innerText = response.getValue('shot');
                    }
                });
            }
            catch (e) {
                if (!e.message.startsWith('%TREE-W-NOT_OPEN')) {
                    Utils.showErrorMessage(e.message);
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