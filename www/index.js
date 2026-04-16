import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
window.d3 = d3; // TODO: Investigate

import Connection from "./connection.js";
import * as Import from "./import.js";

import Panel from "./panel.js";
import GlobalDefaults from "./globalDefaults.js";

// TODO: Have better handling (helper functions?) for null and '' from input values

// TODO: Improve
window.globalDefaults = new GlobalDefaults();

window.globalConnection = null;

function setParallel(parallel) {
    if (parallel) {
        for (var i = 0; i < Panel.panels.length; ++i) {
            Panel.panels[i].setConnection(null);
        }
    }
    else {
        window.globalConnection = new Connection();
        for (var i = 0; i < Panel.panels.length; ++i) {
            Panel.panels[i].setConnection(window.globalConnection);
        }
    }

    document.getElementById('parallel').checked = parallel;
}

window.onload = () => {
    document.querySelector('*[data-action="add-panel"]')
        .addEventListener('click', (e) => {
            const newPanel = new Panel(null, {
                width: 6,
                height: 2,
            });
            Panel.panels.push(newPanel);
            newPanel.edit();
        });

    document.querySelector('*[data-action="refresh"]')
        .addEventListener('click', (e) => {
            for (var i = 0; i < Panel.panels.length; ++i) {
                Panel.panels[i].update();
            }
        });

    document.querySelector('*[data-action="global-defaults"]')
        .addEventListener('click', (e) => {
            globalDefaults.edit();
        });

    document.querySelector('#parallel')
        .addEventListener('change', (e) => { setParallel(e.target.checked); });

    Panel.initGrid();

    let p = new Panel("'SIN()'", { x: 0, y: 0, width: 12, height: 2 });
    p.addTrace(null, null, null, "sin(0 : 100 : 0.1)", "0 : 1000");
    p.update();

    p = new Panel("$SHOT", { x: 0, y: 2, width: 6, height: 2 }, 62976);
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

    p = new Panel("$SHOT", { x: 6, y: 2, width: 6, height: 2 }, 62976);
    p.addTrace(
        "cmod", 0,
        null,
        "abs(\\IP)", null,
        null, "steelblue",
        null, "steelblue",
    );
    p.update();
}

document.addEventListener('drop', async (e) => {
    e.preventDefault();

    const file = e.dataTransfer.items[0].getAsFile();

    setParallel(false);

    for (var i = 0; i < Panel.panels.length; ++i) {
        Panel.panels[i].removeElement();
    }
    document.getElementById('panels').innerHTML = ''; // HACK:

    Panel.panels = await Import.importFile(file);
});

document.addEventListener("dragover", (e) => {
    e.preventDefault();
});

function finishResize() {
    Panel.panels.forEach(panel => panel.render());
}

window.addEventListener('resize', (e) => {
    clearTimeout(window.resizeTimeout);
    window.resizeTimeout = setTimeout(finishResize, 100);
})