import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
window.d3 = d3; // TODO: Investigate

import * as MDSplus from "./connection.js";
window.MDSplus = MDSplus; // HACK: For use with the console
import * as Import from "./import.js";

import Panel from "./panel.js";
import Trace from "./trace.js";
import GlobalDefaults from "./globalDefaults.js";

// TODO: Have better handling (helper functions?) for null and '' from input values

// TODO: Improve
window.globalDefaults = new GlobalDefaults();
let panels = [];

window.onload = () => {
    document.querySelector('*[data-action="add-panel"]')
        .addEventListener('click', (e) => {
            panels.push(new Panel());
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
        panels.push(new Panel(new Trace(
            "cmod", 1090909010,
            null,
            // null, // title
            "\\IP", null,
            0x0000
        )));
    });
}

document.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer.items[0].getAsFile();

    for (var i = 0; i < panels.length; ++i) {
        panels[i].removeElement();
    }
    panels = Import.importFile(file);
});

document.addEventListener("dragover", (e) => {
    e.preventDefault();
});