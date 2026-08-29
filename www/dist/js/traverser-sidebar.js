
import { ConfirmForm } from "./confirm-form.js";
import { Connection } from "./connection.js";
import { Form } from "./form.js";
import { MDSplusPanel } from "./mdsplus-panel.js";
import { MDSplusTrace } from "./mdsplus-trace.js";
import { Scope } from "./scope.js";
import { Traverser } from "./traverser.js";

import * as Utils from "./utils.js";

class TraverserRevealForm extends Form
{
    constructor() {
        super('traverser-reveal-form-template');
        document.querySelector('#reveal-node').focus();
    }

    apply() {
        let node = document.querySelector('#reveal-node').value;
        if (node !== null) {
            TraverserSidebar.active_traverser.reveal(node);
        }
        this.close();
    }
}

class TraverserOpenForm extends Form
{
    constructor() {
        super('traverser-open-form-template');

        document.querySelector('#traverser-tree').focus();
    }

    apply() {
        let tree = document.querySelector('#traverser-tree').value;
        let shot = document.querySelector('#traverser-shot').value;

        TraverserSidebar.findOrOpen(tree, shot);

        return true;
    }

};

export class TraverserSidebar
{
    static element = null;
    static select = null;

    static traversers = [];
    static active_traverser = null;

    static init()
    {
        TraverserSidebar.element = document.querySelector('#traverser-sidebar');
        TraverserSidebar.select = document.querySelector('#traverser-select');

        TraverserSidebar.element.querySelectorAll('*[data-action="traverser-sidebar-open"]')
            .forEach((button) => {
                button.addEventListener('click', () => TraverserSidebar.collapse());
            });
    
        TraverserSidebar.element.querySelectorAll('*[data-action="traverser-sidebar-close"]')
            .forEach((button) => {
                button.addEventListener('click', () => TraverserSidebar.expand());
            });
    
        TraverserSidebar.element.querySelectorAll('*[data-action="traverser-sidebar-toggle"]')
            .forEach((button) => {
                button.addEventListener('click', () => TraverserSidebar.toggle());
            });
    
        TraverserSidebar.element.querySelectorAll('*[data-action="traverser-sidebar-close"]')
            .forEach((button) => {
                button.addEventListener('click', (e) => {
                    let id = parseInt(document.querySelector('#traverser-select').value);
            
                    for (let i = 0; i < TraverserSidebar.traversers.length; ++i) {
                        let traverser = TraverserSidebar.traversers[i];
                        if (traverser.id == id) {
                            ConfirmForm.ask(
                                `Close Traverser ${traverser.tree}/${traverser.shot}?`,
                                () => {
                                    TraverserSidebar.close(traverser);
                                }
                            );
                            break;
                        }
                    }
                });
            });

        TraverserSidebar.element.querySelectorAll('*[data-action="traverser-sidebar-reveal"]')
            .forEach((button) => {
                button.addEventListener('click', (e) => Form.show(new TraverserRevealForm()));
            });

        TraverserSidebar.element.querySelectorAll('*[data-action="traverser-sidebar-open-tree"]')
            .forEach((button) => {
                button.addEventListener('click', (e) => {
                    Form.show(new TraverserOpenForm());
                });
            });

        TraverserSidebar.select.value = 0;
        TraverserSidebar.select.addEventListener('change', (e) => {
            let id = parseInt(e.target.value);
            if (id == 0) {
                return;
            }

            if (id == -1) {
                e.target.value = 0;
                if (TraverserSidebar.active_traverser !== null) {
                    TraverserSidebar.show(TraverserSidebar.active_traverser);
                }

                Form.show(new TraverserOpenForm());
            }
            else {
                for (let i = 0; i < TraverserSidebar.traversers.length; ++i) {
                    let traverser = TraverserSidebar.traversers[i];
                    if (traverser.id == id) {
                        TraverserSidebar.show(traverser);
                        break;
                    }
                }
            }
        });

        TraverserSidebar.load();
    }

    static toggle() {
        TraverserSidebar.element.classList.toggle('hidden');
        Scope.render();
    }

    static expand() {
        TraverserSidebar.element.classList.remove('hidden');
        Scope.render();
    }

    static collapse() {
        TraverserSidebar.element.classList.add('hidden');
        Scope.render();
    }

    static show(traverser)
    {
        document.querySelectorAll('.traverser')
            .forEach((node) => node.classList.remove('active'));

        traverser.$element.classList.add('active');

        document.querySelector('#traverser-select').value = traverser.id;

        TraverserSidebar.active_traverser = traverser;
    }

    static async findOrOpen(tree, shot_expr)
    {
        let traverser = null;

        // TODO: Collect a list of connections from each Traverser and try each of them, rather than using Connection.current
        // In most scenarios, it will just be [Connection.current]
        // Maybe only do this if mode != 'readonly' ?

        let request = [
            ['open', `TreeOpen("${tree}",${shot_expr})`],
            ['tree', '$EXPT'],
            ['shot', '$SHOT'],
        ];

        try {
            await Connection.current.getMany(request)
            .then(async (response) => {
                response.checkForErrors();
    
                tree = response.getValue('tree');
                let shot = response.getValue('shot');
    
                let found = false;
                for (let i = 0; i < TraverserSidebar.traversers.length; ++i) {
                    traverser = TraverserSidebar.traversers[i];
                    if (traverser.tree == tree && traverser.shot == shot) {
                        TraverserSidebar.show(traverser);
                        found = true;
                        break;
                    }
                }
    
                if (!found) {
                    traverser = new Traverser(tree, shot, TraverserSidebar.onDoubleClick);
                    TraverserSidebar.traversers.push(traverser);

                    await traverser.open_promise;

                    traverser.option = document.createElement('option');
                    traverser.option.value = traverser.id;
                    traverser.option.innerText = `${tree}/${shot}`;
            
                    TraverserSidebar.select.prepend(traverser.option);

                    TraverserSidebar.show(traverser);
                }
    
                TraverserSidebar.expand();

                TraverserSidebar.save();
    
            });
        }
        catch (e) {
            Utils.showErrorMessage(e.message);
        }

        return traverser;
    }

    // TODO: Rename
    static async onDoubleClick(tree, shot, name, path) {
        let panel = Scope.addPanel(
            new MDSplusPanel(`"${name}"`),
            { width: 6, height: 6 },
            true
        );
        panel.addTrace(
            new MDSplusTrace(tree, shot, null, path)
        );

        panel.edit();
    }

    static close(traverser)
    {
        traverser.option.remove();
        traverser.removeElement();

        let index = TraverserSidebar.traversers.indexOf(traverser);
        TraverserSidebar.traversers.splice(index, 1);

        if (TraverserSidebar.active_traverser == traverser) {
            if (TraverserSidebar.traversers.length == 0) {
                TraverserSidebar.active_traverser = null;
                TraverserSidebar.select.value = 0;
            }
            else {
                TraverserSidebar.active_traverser = TraverserSidebar.traversers.at(-1);
            }
        }

        if (TraverserSidebar.active_traverser !== null) {
            TraverserSidebar.show(TraverserSidebar.active_traverser);
        }

        TraverserSidebar.save();
    }

    static reset() {
        TraverserSidebar.active_traverser = null;

        for (var traverser of TraverserSidebar.traversers) {
            traverser.option.remove();
            traverser.removeElement();
        }
        TraverserSidebar.traversers = [];

        TraverserSidebar.save();
    }

    static save()
    {
        let info = [];
        for (var traverser of TraverserSidebar.traversers) {
            info.push({
                tree: traverser.tree,
                shot: traverser.shot,
            });
        }

        localStorage.setItem('ws-traversers', JSON.stringify(info));
    }

    static load()
    {
        try {
            let info = JSON.parse(localStorage.getItem('ws-traversers'));
    
            for (var traverser of info) {
                console.log(traverser);
                TraverserSidebar.findOrOpen(traverser.tree, traverser.shot);
            }
        }
        catch (e)
        { }
    }
}