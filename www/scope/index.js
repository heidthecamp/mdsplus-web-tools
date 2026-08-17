import "../resources/d3.v7.min.js";
window.d3 = d3; // TODO: Investigate

import { Connection } from "../common/connection.js";
import * as Import from "./import.js";
import * as Export from "./export.js";

import { Panel } from "../common/panel.js";
import { Scope } from "../common/scope.js";
import { Traverser } from "../common/traverser.js";
import { GlobalDefaults } from "./defaults.js";

import { D3Renderer, CanvasRenderer, Renderer } from "../common/renderer.js";

// TODO: Have better handling (helper functions?) for null and '' from input values

window.autosaveTimeout = null;

window.autosave = () => {
    console.log('Autosave');
    localStorage.setItem("ws-autosave", Export.exportJSON());
}

window.onload = () => {
    window.scope = Scope;

    document.querySelector('*[data-action="add-panel"]')
        .addEventListener('click', (e) => {
            Scope.addPanel().edit(true);
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

                clearTimeout(window.autosaveTimeout);
                window.autosaveTimeout = setTimeout(window.autosave, 1000);
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
            Scope.defaults.edit();
        });

    // document.querySelector('#parallel')
    //     .addEventListener('change', (e) => { setParallel(e.target.checked); });

    document.querySelector('*[data-action="traverser-collapse"]')
        .addEventListener('click', (e) => {
            document.querySelector('#traverser-panel').classList.add('hidden');
            Scope.render();
        });

    document.querySelector('*[data-action="traverser-expand"]')
        .addEventListener('click', (e) => {
            document.querySelector('#traverser-panel').classList.remove('hidden');
            Scope.render();
        });

    document.querySelector('*[data-action="traverser-close"]')
        .addEventListener('click', (e) => {
            let id = parseInt(document.querySelector('#traverser-select').value);
            for (let i = 0; i < Traverser.traversers.length; ++i) {
                let traverser = Traverser.traversers[i];
                if (traverser.id == id) {
                    traverser.close();
                    break;
                }
            }

            if (Traverser.traversers.length > 0) {
                Traverser.traversers.at(-1).show();
            }
        });

    document.querySelector('#traverser-select')
        .addEventListener('change', (e) => {
            let id = parseInt(e.target.value);
            console.log(id);
            if (id == 0) {
                return;
            }
            if (id == -1) {
                e.target.value = 0;
                if (Traverser.activeTraverser !== null) {
                    Traverser.activeTraverser.show();
                }

                let $overlay = document.getElementById('overlay');
                $overlay.innerHTML = '';
                $overlay.classList.add('shown');

                let $traverserOpenForm = document.createElement('form');

                let $traverserOpenTemplate = document.querySelector('#traverser-open-form-template');
                $traverserOpenForm.appendChild($traverserOpenTemplate.content.cloneNode(true));

                $overlay.append($traverserOpenForm);

                document.querySelector('#traverser-tree').focus();

                let openTraverser = (e) => {
                    let tree = document.querySelector('#traverser-tree').value;
                    let shot = document.querySelector('#traverser-shot').value;

                    // TODO: Improve
                    new Traverser(tree, shot); // TODO: Mode

                    $overlay.innerHTML = '';
                    $overlay.classList.remove('shown');

                    e.preventDefault();
                    return false;
                }

                $traverserOpenForm.addEventListener('submit', openTraverser);

                document.querySelectorAll(`#traverser-open-form *[data-action="open"]`)
                    .forEach((node) => {
                        node.addEventListener('click', openTraverser);
                    });

                document.querySelectorAll(`#traverser-open-form *[data-action="cancel"]`)
                    .forEach((node) => {
                        node.addEventListener('click', (e) => {
                            $overlay.innerHTML = '';
                            $overlay.classList.remove('shown');
                        });
                    });
            }
            else {
                for (let i = 0; i < Traverser.traversers.length; ++i) {
                    let traverser = Traverser.traversers[i];
                    if (traverser.id == id) {
                        traverser.show();
                        break;
                    }
                }
            }
        });

    let $overlay = document.getElementById('overlay');

    $overlay.addEventListener('mousedown', (e) => {
        if (e.target == $overlay) {
            $overlay.innerHTML = '';
            $overlay.classList.remove('shown');
        }
    });

    document.body.addEventListener('keyup', (e) => {
        if (e.key === "Escape") {
            $overlay.innerHTML = '';
            $overlay.classList.remove('shown');
        }
    });

    Scope.initGrid();

    let lastSave = localStorage.getItem("ws-autosave");
    if (lastSave !== null) {
        try {
            Import.importJSON(lastSave);
        }
        catch (e) {

        }
    }
    else {
        let sin = Scope.addPanel(
            "'Sample Data with ' // size(_data1) + size(_data2) + size(_data3) // ' points'",
            { x: 0, y: 0, width: 12, height: 6 },
            -1, 1, null, null,
            0x0381
        );
        sin.addTrace(
            null, null, null,
            "_data1 = sin(0 : 50 : 0.05) * 0.9",
            null,
            null,
            "red"
        );
        sin.addTrace(
            null, null, null,
            "_data2 = cos(0 : 50 : 0.05) * 0.8",
            null,
            null,
            "blue"
        );
        sin.addTrace(
            null, null, null,
            "_data3 = sin((0 : 50 : 0.05) - $PI) * 0.7",
            null,
            null,
            "green"
        );
    
        
    
        Scope.setTitle("if_error($SHOT,'No Shot Open') // ' - Running as ' // whoami()");
    }

    Scope.refresh();
}

document.addEventListener('drop', async (e) => {
    e.preventDefault();

    const file = e.dataTransfer.items[0].getAsFile();

    for (var i = 0; i < Scope.panels.length; ++i) {
        Scope.panels[i].removeElement();
    }
    document.getElementById('panels').innerHTML = ''; // HACK:

    await Import.importFile(file);

    clearTimeout(window.autosaveTimeout);
    window.autosaveTimeout = setTimeout(window.autosave, 1000);
});

document.addEventListener("dragover", (e) => {
    e.preventDefault();
});

function finishResize() {
    // Renderer.renderers.forEach(ren => ren.render());
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
