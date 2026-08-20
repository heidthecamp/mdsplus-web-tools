import "../resources/d3.v7.min.js";
window.d3 = d3; // TODO: Investigate

import * as Import from "./import.js";
import * as Export from "./export.js";

import { Scope } from "./scope.js";
import { Connection } from "../common/connection.js";
import { MDSplusTrace } from "./mdsplusTrace.js";
import { MDSplusPanel } from "./mdsplusPanel.js";

// TODO: Have better handling (helper functions?) for null and '' from input values

window.onload = () => {
    window.scope = Scope;
    window.connection = Connection.current;

    Scope.init();

    try {
        let lastSave = localStorage.getItem("ws-autosave");
        Import.importJSON(lastSave);
    }
    catch (e) {
        localStorage.removeItem("ws-autosave");
        
        let sin = Scope.addPanel(
            new MDSplusPanel(
                "'Sample Data with ' // size(_data1) + size(_data2) + size(_data3) // ' points'",
                -1, 1, null, null,
            ),
            { x: 0, y: 0, width: 12, height: 6 }
        );
        sin.addTrace(new MDSplusTrace(
            null, null, null,
            "_data1 = sin(0 : 50 : 0.05) * 0.9",
            null,
            null,
            "red"
        ));
        sin.addTrace(new MDSplusTrace(
            null, null, null,
            "_data2 = cos(0 : 50 : 0.05) * 0.8",
            null,
            null,
            "blue"
        ));
        sin.addTrace(new MDSplusTrace(
            null, null, null,
            "_data3 = sin((0 : 50 : 0.05) - $PI) * 0.7",
            null,
            null,
            "green"
        ));
    
        Scope.setTitle("if_error($SHOT,'No Shot Open') // ' - Running as ' // whoami()");
    }

    Scope.refresh();
}

document.addEventListener('drop', async (e) => {
    e.preventDefault();

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

document.addEventListener("dragover", (e) => {
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
