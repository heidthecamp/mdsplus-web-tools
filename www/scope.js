
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
        
        // TODO: Figure out how/why this keeps adding padding at the bottom
        this.grid = GridStack.init({
            itemClass: 'panel',
            column: 12,
            handle: '.handle',
            animate: false,
            margin: 1,
            cellHeight: 50,
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

    static addPanel(title = null, position = null,
        y_min = null, y_max = null, x_min = null, x_max = null,
        use_canvas = null, global_defaults_mask = 0xFFFF,) {
        if (position == null) {
            position = {
                width: 6,
                height: 2,
            };
        }
        const newPanel = new Panel(title, position,
            y_min, y_max, x_min, x_max,
            use_canvas, global_defaults_mask,);
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