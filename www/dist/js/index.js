
import { Scope } from "./scope.js";
import { Connection } from "./connection.js";

import * as Utils from "./utils.js";
import * as Import from "./import.js";
import * as Export from "./export.js";

import "../external/d3.v7.min.js";
window.d3 = d3; // TODO: Investigate

function initTheme() {
    let theme = localStorage.getItem('ws-theme') ?? 'light';
    document.documentElement.setAttribute('data-bs-theme', theme);

    Utils.bindActions('toggle-theme', () => {
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
}

window.onload = () => {
    initTheme();

    window.scope = Scope;
    window.connection = Connection.current;

    Scope.init();

    Scope.refresh();
}
