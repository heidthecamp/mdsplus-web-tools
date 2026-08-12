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
        .addEventListener('click', async(e) => {
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

    let p = Scope.addPanel("'SIN()'", { x: 0, y: 0, width: 12, height: 6 },
        null, null, null, null,
        0x0381);
    p.addTrace(null, null, null, "sin(0 : 100 : 0.1)", "0 : 1000");

    p = Scope.addPanel("$SHOT", { x: 0, y: 2, width: 6, height: 6 });
    p.addTrace(
        "cmod", 1090909010,
        null,
        "\\IP", null,
        null, "steelblue",
        null, "steelblue",
    );
    p.addTrace("cmod", 1090909010,
        null,
        "abs(\\IP)", null,
        null, "red",
        null, "red",
    );

    p = Scope.addPanel("$SHOT", { x: 6, y: 2, width: 6, height: 6 },
        "200000", "1500000", "0.0", "1.5");
    p.addTrace(
        "cmod", 0,
        null,
        "abs(\\IP)", null,
        null, "steelblue",
        null, "steelblue",
    );

    Scope.setTitle("$SHOT");
    Scope.refresh();

    let traverser = new Traverser('cmod', 0);
    new Traverser('analysis', 1090909010);
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
