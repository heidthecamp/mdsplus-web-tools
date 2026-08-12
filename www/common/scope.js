
import { Panel, MDSplusPanel } from "./panel.js";
import { GlobalDefaults } from "../scope/defaults.js";
import "../resources/gridstack-all.js";
import { Connection } from "./connection.js";

export class Scope
{
    static title_expr = '$SHOT';

    static defaults = new GlobalDefaults();

    static grid = null;

    static panels = [];

    static initGrid() {
        // Otherwise it will render the HTML as text :(
        GridStack.renderCB = function(el, w) {
            el.innerHTML = w.content;
        };
        
        // TODO: Figure out how/why this keeps adding padding at the bottom
        Scope.grid = GridStack.init({
            itemClass: 'panel',
            column: 12,
            handle: '.handle',
            animate: false,
            margin: 1,
            cellHeight: 50,
        });

        Scope.grid.on("resizestop", async (e) => {
            let id = e.target.ddElement.el.getAttribute('gs-id');
            let panel = Scope.getPanelById(id);
            await panel.update();
            await panel.render();
        });
    };

    static updating = false;

    static async refresh() {
        if (Scope.updating) {
            return;
        }

        Scope.updating = true;

        for (var i = 0; i < Scope.panels.length; ++i) {
            Scope.panels[i].resetViewport();
            await Scope.panels[i].update(true);
            await Scope.panels[i].render();
        }

        await Scope.updateTitle();

        Scope.updating = false;
    }

    static getPanelById(id) {
        id = parseInt(id);

        for (let i = 0; i < Scope.panels.length; ++i) {
            if (Scope.panels[i].id == id) {
                return Scope.panels[i];
            }
        }

        return null;
    }

    static addPanel(
        title_expr = null,
        position = null,
        y_min_expr = null,
        y_max_expr = null,
        x_min_expr = null,
        x_max_expr = null,
        global_defaults_mask = 0xFFFF,
    ) {
        if (position == null) {
            position = {
                width: 6,
                height: 2,
            };
        }
        const newPanel = new MDSplusPanel(
            title_expr,
            position,
            y_min_expr,
            y_max_expr,
            x_min_expr,
            x_max_expr,
            global_defaults_mask
        );
        Scope.panels.push(newPanel);
        return newPanel;
    }

    static async setTitle(title_expr) {
        Scope.title_expr = title_expr;
        await Scope.updateTitle();
    }

    static async updateTitle() {
        if (Scope.title_expr != '' && Scope.title_expr != null) {
            await Connection.current.getMany([ ['title', Scope.title_expr] ])
            .then((response) => {
                if (response.title.hasOwnProperty('value')) {
                    Scope.title = response.title.value;

                    document.title = Scope.title;
                    document.querySelectorAll('.window-title')
                        .forEach((e) => {
                            e.innerText = Scope.title;
                        });
                }
            });
        }

    }

};