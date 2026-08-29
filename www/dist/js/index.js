
import { Scope } from "./scope.js";
import { Connection } from "./connection.js";
import { MDSplusTrace } from "./mdsplus-trace.js";
import { MDSplusPanel } from "./mdsplus-panel.js";

import * as Import from "./import.js";
import * as Export from "./export.js";

import "../external/d3.v7.min.js";
window.d3 = d3; // TODO: Investigate

function initTheme() {
    let theme = localStorage.getItem('ws-theme') ?? 'light';
    document.documentElement.setAttribute('data-bs-theme', theme);

    document.querySelectorAll('[data-action="toggle-theme"]')
        .forEach((element) => {
            element.addEventListener('click', () => {
                let html = document.documentElement;
                if (html.getAttribute('data-bs-theme') == 'dark') {
                    html.setAttribute('data-bs-theme', 'light');
                    localStorage.setItem('ws-theme', 'light');
                }
                else {
                    html.setAttribute('data-bs-theme', 'dark');
                    localStorage.setItem('ws-theme', 'dark');
                }

                Scope.render();
            });
        });
}

window.onload = () => {
    initTheme();

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
