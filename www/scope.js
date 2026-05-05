
import { Panel } from "./panel.js";
import { GlobalDefaults } from "./defaults.js";
import "./gridstack-all.js";
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
        
        this.grid = GridStack.init({
            itemClass: 'panel',
            column: 12,
            handle: '.navbar',
            animate: false,
            margin: 1,
        });

        this.grid.on("resizestop", (e) => {
            let id = e.target.ddElement.el.getAttribute('gs-id');
            let panel = this.getPanelById(id);
            panel.render();
        });
    };

    static async refresh() {
        for (var i = 0; i < this.panels.length; ++i) {
            await this.panels[i].update();
        }

        await this.updateTitle();
    }

    static getPanelById(id) {
        id = parseInt(id);

        for (let i = 0; i < this.panels.length; ++i) {
            if (this.panels[i].id == id) {
                return this.panels[i];
            }
        }

        return null;
    }

    static addPanel(title = null, size = null) {
        if (size == null) {
            size = {
                width: 6,
                height: 2,
            };
        }
        const newPanel = new Panel(title, size);
        this.panels.push(newPanel);
        return newPanel;
    }

    static async setTitle(title_expr) {
        this.title_expr = title_expr;
        await this.updateTitle();
    }

    static async updateTitle() {
        if (this.title_expr != '' && this.title_expr != null) {
            await Connection.current.getMany([ ['title', this.title_expr] ])
            .then((response) => {
                if (response.title.hasOwnProperty('value')) {
                    this.title = response.title.value;

                    document.title = this.title;
                    document.querySelectorAll('.window-title')
                        .forEach((e) => {
                            e.innerText = this.title;
                        });
                }
            });
        }

    }

};