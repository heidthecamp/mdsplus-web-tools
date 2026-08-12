import "../resources/d3.v7.min.js";
window.d3 = d3; // TODO: Investigate

import { Connection } from "../common/connection.js";
import * as Import from "./import.js";

import { Panel } from "../common/panel.js";
import { Scope } from "../common/scope.js";
import { Traverser } from "../common/traverser.js";
import { GlobalDefaults } from "./defaults.js";

import { D3Renderer, CanvasRenderer, Renderer } from "../common/renderer.js";

// TODO: Have better handling (helper functions?) for null and '' from input values

window.onload = () => {
    window.scope = Scope;

    document.querySelector('*[data-action="add-panel"]')
        .addEventListener('click', (e) => {
            Scope.addPanel().edit();
        });

    document.querySelector('*[data-action="upload"]')
        .addEventListener('click', async (e) => {
            try {
                const pickerOpts = {
                    types: [
                        {
                            description: "Legacy Scopes",
                            accept: {
                                "*": [".dat", ".jscp"],
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
                felement.setAttribute('accept', '.dat,.jscp'); // only accept scope files
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
            Scope.refresh(); // TODO: Remove
        });

    document.querySelector('*[data-action="traverser-expand"]')
        .addEventListener('click', (e) => {
            document.querySelector('#traverser-panel').classList.remove('hidden');
            Scope.refresh(); // TODO: Remove
        });

    document.querySelector('*[data-action="traverser-open"]')
        .addEventListener('click', (e) => {
            let $overlay = document.getElementById('overlay');
            $overlay.innerHTML = '';
            $overlay.classList.add('shown');

            let $traverserOpenTemplate = document.querySelector('#traverser-open-form-template');
            $overlay.appendChild($traverserOpenTemplate.content.cloneNode(true));

            document.querySelectorAll(`#traverser-open-form *[data-action="open"]`)
                .forEach((node) => {
                    node.addEventListener('click', (e) => {
                        let tree = document.querySelector('#traverser-tree').value;
                        let shot = document.querySelector('#traverser-shot').value;

                        // TODO: Improve
                        new Traverser(tree, shot); // TODO: Mode

                        $overlay.innerHTML = '';
                        $overlay.classList.remove('shown');
                    });
                });

            document.querySelectorAll(`#traverser-open-form *[data-action="cancel"]`)
                .forEach((node) => {
                    node.addEventListener('click', (e) => {
                        $overlay.innerHTML = '';
                        $overlay.classList.remove('shown');
                    });
                });
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
            for (let i = 0; i < Traverser.traversers.length; ++i) {
                let traverser = Traverser.traversers[i];
                if (traverser.id == id) {
                    traverser.show();
                    break;
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

    let sin = Scope.addPanel(
        "'SIN(), COS()'",
        { x: 0, y: 0, width: 12, height: 6 },
        -1, 1, null, null,
        0x0381
    );
    sin.addTrace(
        null, null, null,
        "sin(0 : 50 : 0.05) * 0.8",
        "0 : 1000",
        null,
        "red"
    );
    sin.addTrace(
        null, null, null,
        "cos(0 : 50 : 0.05) * 0.8",
        "0 : 1000",
        null,
        "blue"
    );
    sin.addTrace(
        null, null, null,
        "sin((0 : 50 : 0.05) - $PI) * 0.8",
        "0 : 1000",
        null,
        "green"
    );

    Scope.setTitle("if_error($SHOT,'No Shot Open') // ' - Running as ' // whoami()");
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
