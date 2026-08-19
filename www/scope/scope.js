
import { Connection } from "../common/connection.js";
import { MDSplusPanel } from "./mdsplusPanel.js";
import { TraverserSidebar } from "./traverserSidebar.js";

import * as Import from "./import.js";
import * as Export from "./export.js";
import * as Utils from "../common/utils.js";

import "../resources/gridstack-all.js";

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
    static title_expr = '$SHOT';

    static defaults = InitialDefaults;

    static shot_expr_offset = 0;

    static grid = null;

    static panels = [];
    static updating = false;

    static autosave_timeout = null;

    static queueAutosave() {
        clearTimeout(Scope.autosave_timeout);
        Scope.autosave_timeout = setTimeout(Scope.autosave, 1000);
    }

    static autosave() {
        console.info('Autosave at', performance.now());
        localStorage.setItem("ws-autosave", Export.exportJSON());
    }

    static init()
    {
        document.querySelector('*[data-action="add-panel"]')
            .addEventListener('click', (e) => {
                Scope.addPanel(new MDSplusPanel(), null, true).edit();
            });
    
        document.querySelector('*[data-action="prev-shot"]')
            .addEventListener('click', async (e) => {
                --Scope.shot_expr_offset;
                Scope.refresh();
            });
    
        document.querySelector('*[data-action="next-shot"]')
            .addEventListener('click', async (e) => {
                ++Scope.shot_expr_offset;
                Scope.refresh();
            });
    
        document.querySelector('*[data-action="reset"]')
            .addEventListener('click', async (e) => {
                await Scope.reset();
                Scope.refresh();
            });
    
        document.querySelector('*[data-action="export"]')
            .addEventListener('click', async (e) => {
                Export.exportFile();
            });
    
        document.querySelector('*[data-action="import"]')
            .addEventListener('click', async (e) => {
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
                e.target.classList.remove('active');
                await Scope.refresh();
                e.target.classList.add('active');
            });
    
        document.querySelector('*[data-action="settings"]')
            .addEventListener('click', (e) => {
                Scope.edit();
            });
    
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

    static reset() {
        Utils.showErrorMessage('');
        Utils.showStatusMessage('');

        Scope.setTitle("\"MDSplus Scope\"");
        Scope.defaults = InitialDefaults;

        let panelsToRemove = Scope.panels;
        Scope.panels = [];

        for (var i = 0; i < panelsToRemove.length; ++i) {
            panelsToRemove[i].removeElement();
        }

        Scope.initGrid();

        Scope.queueAutosave();
    }

    static async refresh() {
        if (Scope.updating) {
            return;
        }

        Utils.showStatusMessage(`Refreshing...`);
        let before = performance.now();

        Scope.updating = true;
        
        // HACK:
        await Scope.updateMetadata();

        for (var i = 0; i < Scope.panels.length; ++i) {
            Scope.panels[i].resetViewport();
            await Scope.panels[i].update(true);
            await Scope.panels[i].render();
        }

        await Scope.updateMetadata();

        Scope.updating = false;

        let after = performance.now();
        let duration = (after - before) / 1000.0;
        Utils.showStatusMessage(`Refresh took ${duration.toFixed(1)}s`);
    }

    static async render() {
        if (Scope.updating) {
            return;
        }
        
        for (var i = 0; i < Scope.panels.length; ++i) {
            await Scope.panels[i].render();
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
        return panel;
    }
    
    static async setTitle(title_expr) {
        Scope.title_expr = title_expr;
        await Scope.updateMetadata();

        this.queueAutosave();
    }

    static async updateMetadata() {
        let request = [];

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

    static edit() {
        let $overlay = Utils.showOverlay();
        $overlay.append(Utils.inflateTemplate('global-defaults-form-template'));

        document.getElementById('scope-title_expr').value = Scope.title_expr; // TODO: Move to Panel

        // Update the form values
        document.getElementById('global-defaults-title_expr').value = Scope.defaults.title_expr ?? '';
        document.getElementById('global-defaults-y_expr').value = Scope.defaults.y_expr ?? '';
        document.getElementById('global-defaults-y-min').value = Scope.defaults.y_min_expr ?? '';
        document.getElementById('global-defaults-y-max').value = Scope.defaults.y_max_expr ?? '';
        document.getElementById('global-defaults-x_expr').value = Scope.defaults.x_expr ?? '';
        document.getElementById('global-defaults-x-min').value = Scope.defaults.x_min_expr ?? '';
        document.getElementById('global-defaults-x-max').value = Scope.defaults.x_max_expr ?? '';
        document.getElementById('global-defaults-tree').value = Scope.defaults.tree ?? '';
        document.getElementById('global-defaults-shot_expr').value = Scope.defaults.shot_expr ?? '';
        document.getElementById('global-defaults-default_node_expr').value = Scope.defaults.default_node_expr ?? '';

        document.querySelectorAll(`#global-defaults-form *[data-action="save"]`)
            .forEach((node) => {
                node.addEventListener('click', (e) => {
                    
                    Scope.title_expr = document.getElementById('scope-title_expr').value;

                    Scope.defaults.title_expr = document.getElementById('global-defaults-title_expr').value;
                    Scope.defaults.y_expr = document.getElementById('global-defaults-y_expr').value;
                    Scope.defaults.y_min_expr = document.getElementById('global-defaults-y-min').value;
                    Scope.defaults.y_max_expr = document.getElementById('global-defaults-y-max').value;
                    Scope.defaults.x_expr = document.getElementById('global-defaults-x_expr').value;
                    Scope.defaults.x_min_expr = document.getElementById('global-defaults-x-min').value;
                    Scope.defaults.x_max_expr = document.getElementById('global-defaults-x-max').value;
                    Scope.defaults.tree = document.getElementById('global-defaults-tree').value;
                    Scope.defaults.shot_expr = document.getElementById('global-defaults-shot_expr').value;
                    Scope.defaults.default_node_expr = document.getElementById('global-defaults-default_node_expr').value;

                    Utils.hideOverlay();

                    Scope.queueAutosave();
                    Scope.refresh();
                });
            });

        document.querySelectorAll(`#global-defaults-form *[data-action="reset"]`)
            .forEach((node) => {
                node.addEventListener('click', (e) => {
                    Scope.defaults.edit(); // HACK
                });
            });

        document.querySelectorAll(`#global-defaults-form *[data-action="cancel"]`)
            .forEach((node) => {
                node.addEventListener('click', (e) => {
                    Utils.hideOverlay();
                });
            });

    }
};