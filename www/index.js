import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
window.d3 = d3; // TODO: Investigate

import * as MDSplus from "./connection.js";
window.MDSplus = MDSplus; // HACK: For use with the console
import * as Import from "./import.js";

import Panel from "./panel.js";
import GlobalDefaults from "./globalDefaults.js";

// TODO: Have better handling (helper functions?) for null and '' from input values

// TODO: Improve
window.globalDefaults = new GlobalDefaults();
let panels = [];

window.onload = () => {
    document.querySelector('*[data-action="add-panel"]')
        .addEventListener('click', (e) => {
            const newPanel = new Panel();
            panels.push(newPanel);
            newPanel.edit()
        });

    document.querySelector('*[data-action="refresh"]')
        .addEventListener('click', (e) => {
            for (var i = 0; i < panels.length; ++i) {
                panels[i].render();
            }
        });

    document.querySelector('*[data-action="global-defaults"]')
        .addEventListener('click', (e) => {
            globalDefaults.edit();
        });

    MDSplus.connect()
    .then((e) => {
        let p = new Panel("", null, null, 62976);
        p.addTrace(
            "cmod", 1090909010,
            null,
            "\\IP", null
        );
        panels.push(p);
    });
}

document.addEventListener('drop', async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.items[0].getAsFile();

    for (var i = 0; i < panels.length; ++i) {
        panels[i].removeElement();
    }
    panels = await Import.importFile(file);
});

document.addEventListener("dragover", (e) => {
    e.preventDefault();
});