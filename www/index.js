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
            const newPanel = new Panel();
            Panel.panels.push(newPanel);
            newPanel.edit()
        });

    document.querySelector('*[data-action="refresh"]')
        .addEventListener('click', (e) => {
            for (var i = 0; i < Panel.panels.length; ++i) {
                Panel.panels[i].render();
            }
        });

    document.querySelector('*[data-action="global-defaults"]')
        .addEventListener('click', (e) => {
            globalDefaults.edit();
        });

    document.querySelector('#parallel')
        .addEventListener('change', (e) => { setParallel(e.target.checked); })

    let p = new Panel("", null, null, 62976);
    p.addTrace(
        "cmod", 1090909010,
        null,
        "\\IP", null,
    );
    Panel.panels.push(p);
}

document.addEventListener('drop', async (e) => {
    e.preventDefault();

    const file = e.dataTransfer.items[0].getAsFile();

    setParallel(false);

    for (var i = 0; i < panels.length; ++i) {
        Panel.panels[i].removeElement();
    }
    document.getElementById('panels').innerHTML = ''; // HACK:

    Panel.panels = await Import.importFile(file);
});

document.addEventListener("dragover", (e) => {
    e.preventDefault();
});