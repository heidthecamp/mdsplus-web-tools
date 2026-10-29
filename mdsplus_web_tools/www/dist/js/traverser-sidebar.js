
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
            TraverserSidebar.activeTraverser.reveal(node);
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
    static activeTraverser = null;

    static init()
    {
        TraverserSidebar.element = document.querySelector('#traverser-sidebar');
        TraverserSidebar.select = document.querySelector('#traverser-select');

        Utils.bindActions('traverser-sidebar-open', () => TraverserSidebar.collapse(),
            { element: TraverserSidebar.element });

        Utils.bindActions('traverser-sidebar-close', () => TraverserSidebar.expand(),
            { element: TraverserSidebar.element });

        Utils.bindActions('traverser-sidebar-toggle', () => TraverserSidebar.toggle(),
            { element: TraverserSidebar.element });

        Utils.bindActions('traverser-sidebar-close', () => TraverserSidebar.toggle(),
            { element: TraverserSidebar.element });

        Utils.bindActions('traverser-sidebar-close-tree',
            () => {
                let traverser = TraverserSidebar.activeTraverser;
                ConfirmForm.ask(
                    `Close Traverser ${traverser.tree}/${traverser.shot}?`,
                    () => {
                        TraverserSidebar.close(traverser);
                    }
                );
            },
            { element: TraverserSidebar.element });

        Utils.bindActions('traverser-sidebar-reveal', () => Form.show(new TraverserRevealForm()),
            { element: TraverserSidebar.element });

        Utils.bindActions('traverser-sidebar-open-tree', () => Form.show(new TraverserOpenForm()),
            { element: TraverserSidebar.element });

        Utils.bindActions('traverser-sidebar-close-all', () => TraverserSidebar.reset(),
            { element: TraverserSidebar.element });

        TraverserSidebar.select.value = 0;
        TraverserSidebar.select.addEventListener('change', (e) => {
            let id = parseInt(e.target.value);
            if (id == 0) {
                return;
            }

            if (id == -1) {
                e.target.value = 0;
                if (TraverserSidebar.activeTraverser !== null) {
                    TraverserSidebar.show(TraverserSidebar.activeTraverser);
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

        TraverserSidebar.activeTraverser = traverser;

        if (traverser !== null) {
            traverser.element.classList.add('active');
            TraverserSidebar.select.value = traverser.id;
        }
        else {
            TraverserSidebar.select.value = 0;
        }
    }

    static async findOrOpen(tree, shot_expr)
    {
        let traverser = null;

        // TODO: Collect a list of connections from each Traverser and try each of them, rather than using Connection.current
        // In most scenarios, it will just be [Connection.current]
        // Maybe only do this if mode != 'readonly' ?

        let request = [
            ['open', `getmsg(TreeOpen("${tree}",${shot_expr}))`],
            ['tree', '$EXPT'],
            ['shot', '$SHOT'],
        ];

        try {
            await Connection.current.getMany(request)
            .then(async (response) => {
                response.checkForErrors();

                let open = response.getValue('open');
                if (open.startsWith('%TREE-E')) {
                    throw Error(open);
                }
    
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
                    traverser = new Traverser(tree, shot);
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

            TraverserSidebar.show(null);
        }

        return traverser;
    }

    static close(traverser)
    {
        traverser.option.remove();
        traverser.removeElement();

        let index = TraverserSidebar.traversers.indexOf(traverser);
        TraverserSidebar.traversers.splice(index, 1);

        if (TraverserSidebar.activeTraverser == traverser) {
            if (TraverserSidebar.traversers.length == 0) {
                TraverserSidebar.activeTraverser = null;
                TraverserSidebar.select.value = 0;
            }
            else {
                TraverserSidebar.activeTraverser = TraverserSidebar.traversers.at(-1);
            }
        }

        if (TraverserSidebar.activeTraverser !== null) {
            TraverserSidebar.show(TraverserSidebar.activeTraverser);
        }

        TraverserSidebar.save();
    }

    static reset() {
        TraverserSidebar.activeTraverser = null;

        for (var traverser of TraverserSidebar.traversers) {
            traverser.option.remove();
            traverser.removeElement();
        }
        TraverserSidebar.traversers = [];

        TraverserSidebar.select.value = 0;

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
                TraverserSidebar.findOrOpen(traverser.tree, traverser.shot);
            }
        }
        catch (e)
        { }
    }
}