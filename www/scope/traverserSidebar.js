
import { Connection } from "../common/connection.js";
import { Traverser } from "../common/traverser.js";
import * as Utils from "../common/utils.js";
import { Scope } from "./scope.js";

export class TraverserSidebar
{
    static traversers = [];
    static active_traverser = null;

    static getTraverserBy(id) {

        return null;
    }

    static init()
    {
        document.querySelector('*[data-action="traverser-collapse"]')
            .addEventListener('click', TraverserSidebar.collapse);
    
        document.querySelector('*[data-action="traverser-expand"]')
            .addEventListener('click', TraverserSidebar.expand);
    
        document.querySelector('*[data-action="traverser-close"]')
            .addEventListener('click', (e) => {
                let id = parseInt(document.querySelector('#traverser-select').value);
        
                for (let i = 0; i < TraverserSidebar.traversers.length; ++i) {
                    if (TraverserSidebar.traversers[i].id == id) {
                        TraverserSidebar.close(TraverserSidebar.traversers[i]);
                        break;
                    }
                }
    
            });

            document.querySelector('#traverser-select').value = 0;
    
            document.querySelector('#traverser-select')
            .addEventListener('change', (e) => {
                let id = parseInt(e.target.value);
                if (id == 0) {
                    return;
                }

                if (id == -1) {
                    e.target.value = 0;
                    if (TraverserSidebar.active_traverser !== null) {
                        TraverserSidebar.show(TraverserSidebar.active_traverser);
                    }
    
                    let $overlay = Utils.showOverlay();

                    let $traverserOpenForm = document.createElement('form');
                    $traverserOpenForm.append(Utils.inflateTemplate('traverser-open-form-template'));
    
                    $overlay.append($traverserOpenForm);
    
                    document.querySelector('#traverser-tree').focus();
    
                    let openTraverser = (e) => {
                        let tree = document.querySelector('#traverser-tree').value;
                        let shot = document.querySelector('#traverser-shot').value;

                        TraverserSidebar.findOrOpen(tree, shot);
    
                        Utils.hideOverlay();
    
                        e.preventDefault();
                        return false;
                    }
    
                    $traverserOpenForm.addEventListener('submit', openTraverser);
    
                    document.querySelectorAll(`#traverser-open-form *[data-action="open"]`)
                        .forEach((node) => {
                            node.addEventListener('click', openTraverser);
                        });
    
                    document.querySelectorAll(`#traverser-open-form *[data-action="cancel"]`)
                        .forEach((node) => {
                            node.addEventListener('click', (e) => {
                                Utils.hideOverlay();
                            });
                        });
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
    }

    static expand() {
        document.querySelector('#traverser-panel').classList.remove('hidden');
        Scope.render();
    }

    static collapse() {
        document.querySelector('#traverser-panel').classList.add('hidden');
        Scope.render();
    }

    static show(traverser)
    {
        document.querySelectorAll('.traverser')
            .forEach((node) => node.classList.remove('active'));

        traverser.element.classList.add('active');

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
            .then((response) => {
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
                    traverser = new Traverser(tree, shot);
                    TraverserSidebar.traversers.push(traverser);

                    traverser.option = document.createElement('option');
                    traverser.option.value = traverser.id;
                    traverser.option.innerText = `${tree}/${shot}`;
            
                    document.querySelector('#traverser-select').prepend(traverser.option);

                    TraverserSidebar.show(traverser);
                }
    
                TraverserSidebar.expand();
    
            });
        }
        catch (e) {
            Utils.showErrorMessage(e.message);
        }

        return traverser;
    }

    close(traverser)
    {
        traverser.option.remove();
        traverser.removeElement();

        let index = TraverserSidebar.traversers.indexOf(traverser);
        TraverserSidebar.traversers.splice(index, 1);

        if (TraverserSidebar.active_traverser == this) {
            if (TraverserSidebar.traversers.length == 0) {
                TraverserSidebar.active_traverser = null;
                document.querySelector('#traverser-select').value = 0;
            }
            else {
                TraverserSidebar.active_traverser = TraverserSidebar.traversers.at(-1);
            }
        }

        if (TraverserSidebar.active_traverser !== null) {
            TraverserSidebar.show(TraverserSidebar.active_traverser);
        }
    }

}