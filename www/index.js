import "./d3.v7.min.js";
window.d3 = d3; // TODO: Investigate

import { Connection } from "./connection.js";
import * as Import from "./import.js";

import { Panel } from "./panel.js";
import { Scope } from "./scope.js";
import { GlobalDefaults } from "./defaults.js";

// TODO: Have better handling (helper functions?) for null and '' from input values

window.onload = () => {
    window.scope = Scope;

    document.querySelector('*[data-action="add-panel"]')
        .addEventListener('click', (e) => {
            Scope.addPanel().edit();
        });

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

    document.querySelector('#use-canvas')
        .addEventListener('change', (e) => {
            Scope.defaults.useCanvas = e.target.checked;
            Scope.panels.forEach(panel => panel.render());
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

    let p = Scope.addPanel("'SIN()'", { x: 0, y: 0, width: 12, height: 6 });
    p.addTrace(null, null, null, "sin(0 : 100 : 0.1)", "0 : 1000");
    p.update();

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
    p.update();

    p = Scope.addPanel("$SHOT", { x: 6, y: 2, width: 6, height: 6 });
    p.addTrace(
        "cmod", 0,
        null,
        "abs(\\IP)", null,
        null, "steelblue",
        null, "steelblue",
    );
    p.update();

    Scope.setTitle("$SHOT");
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
    Scope.panels.forEach(panel => panel.render());
}

window.addEventListener('resize', (e) => {
    clearTimeout(window.resizeTimeout);
    window.resizeTimeout = setTimeout(finishResize, 100);
})