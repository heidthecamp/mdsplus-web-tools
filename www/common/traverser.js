
import { Connection } from "./connection.js";
import { Scope } from "./scope.js";

import { CanvasRenderer } from "./renderer.js";
import { PreviewTrace } from "./trace.js";
import { Bounds } from "./bounds.js";
import { PreviewPanel } from "./panel.js";

let NextId = 1;

export class Traverser
{
    static traversers = [];

    constructor(tree, shot_expr)
    {
        this.id = NextId++;

        this.timeout = null;

        this.previewPanel = new PreviewPanel(document.querySelector('#traverser-preview'), new Bounds(), []);

        this.setConnection(Connection.current);

        Traverser.traversers.push(this);

        this.open(tree, shot_expr);
    }

    async open(tree, shot_expr) {
        let request = [
            ['open', `TreeOpen("${tree}",${shot_expr})`],
            ['tree', '$EXPT'],
            ['shot', '$SHOT'],
        ];
        await this.connection.getMany(request)
        .then((response) => {
            // TODO: Error handling
            this.tree = response.tree.value;
            this.shot = response.shot.value;
        });

        this.addElement();
        this.addNode(this.element, 0, `\\${this.tree.toUpperCase()}::TOP`, 'SPECIAL');
        this.dir(0);
    }

    setConnection(conn) {
        if (conn == null) {
            this.connection = new Connection();
        }
        else {
            this.connection = conn;
        }
    }

    addElement() {
        this.element = document.createElement('div');
        this.element.dataset.id = this.id;
        this.element.classList.add('traverser');
        
        // TODO: Remove?
        this.element.dataset.tree = this.tree;
        this.element.dataset.shot = this.shot;

        document.querySelector('#traversers').appendChild(this.element);

        this.option = document.createElement('option');
        this.option.value = this.id;
        this.option.innerText = `${this.tree}/${this.shot}`;

        document.querySelector('#traverser-select').appendChild(this.option);

        this.show();

        // this.tab = document.createElement('li');
        // this.tab.dataset.id = this.id;
        // this.tab.classList.add('nav-item');


        // let $link = document.createElement('span');
        // $link.innerText = `${this.tree}/${this.shot}`;
        // $link.classList.add('nav-link');
        // this.tab.appendChild($link);

        // $link.addEventListener('click', (e) => {
        //     document.querySelectorAll('#traverser-tabs .nav-link')
        //         .forEach((node) => node.classList.remove('active'));

        //     document.querySelectorAll('.traverser')
        //         .forEach((node) => node.classList.remove('active'));
            
        //     $link.classList.add('active');
        //     this.element.classList.add('active');
        // });

        // document.querySelector('#traverser-tabs').appendChild(this.tab);
        // $link.click();
    }

    removeElement() {
        this.element.remove();
        // this.tab.remove();
        this.option.remove();

        let index = Traverser.traversers.indexOf(this);
        Traverser.traversers.splice(index, 1);
    }

    show() {
        document.querySelectorAll('.traverser')
            .forEach((node) => node.classList.remove('active'));

        this.element.classList.add('active');

        document.querySelector('#traverser-select').value = this.id;
    }

    addNode(parent, nid, path, usage) {
        usage = usage.split('TreeUSAGE_').at(-1);

        let name = path.split(/[:\.]/).at(-1);
        let $node = document.createElement('div');
        $node.appendChild(document.querySelector('#traverser-node-template').content.cloneNode(true));
        
        $node.dataset.nid = nid;
        $node.title = usage;
        
        let $name = $node.querySelector('.name');
        $name.innerText = name;

        $name.addEventListener('click', (e) => {
            let $parent = e.target.parentNode;
            if ($parent.classList.contains('expanded')) {
                $parent.classList.remove('expanded');
            }
            else {
                this.dir(nid);
            }
        });

        if (usage == 'SIGNAL') {
            $node.classList.add('signal');
            $name.addEventListener('dblclick', async (e) => {
                let panel = Scope.addPanel(`"${name}"`, { width: 6, height: 6 });
                panel.addTrace(this.tree, this.shot, null, path);
                await panel.update();
                panel.render();
            });

            $name.addEventListener('mouseenter', (e) => {
                this.timeout = setTimeout(async (e) => {
                    let $traverserPreview = document.querySelector('#traverser-preview');
                    $traverserPreview.classList.add('shown');
                    $traverserPreview.style.top = e.clientY - 200;
                    $traverserPreview.style.left = e.clientX;

                    let request = [
                        ['open', `TreeOpen("${this.tree}",${this.shot})`],
                        ['nid', `getnci(${nid}, "NID_NUMBER")`],
                        ['y', `TreeGetRecord(${nid}, _wssig), _wssig=toms510(_wssig)`],
                        ['x', `dim_of(_wssig)`],
                    ];
                    await this.connection.getMany(request)
                    .then((response) => {
                        // TODO: Don't reach into preview panel
                        let trace = new PreviewTrace(response.y.value, response.x.value);
                        this.previewPanel.setViewport(trace.bounds);
                        this.previewPanel.setTraces([trace]);
                        this.previewPanel.render();
                    });
                }, 500, e);
            });

            $name.addEventListener('mouseleave', (e) => {
                clearTimeout(this.timeout);
                document.querySelector('#traverser-preview').classList.remove('shown');
            });

        }

        parent.appendChild($node);
    }

    getNode(nid) {
        return this.element.querySelector(`*[data-nid="${nid}"]`);
    }

    async dir(node) {
        let request = [
            ['open', `TreeOpen("${this.tree}",${this.shot})`],
            ['nid', `getnci(${node}, "NID_NUMBER")`],
            ['child_nids', `getnci(getnci(${node},"CHILDREN_NIDS"),"NID_NUMBER")`],
            ['member_nids', `getnci(getnci(${node},"MEMBER_NIDS"),"NID_NUMBER")`],
            ['child_names', `getnci(getnci(${node},"CHILDREN_NIDS"),"FULLPATH")`],
            ['member_names', `getnci(getnci(${node},"MEMBER_NIDS"),"FULLPATH")`],
            ['child_usages', `getnci(getnci(${node},"CHILDREN_NIDS"),"USAGE_STR")`],
            ['member_usages', `getnci(getnci(${node},"MEMBER_NIDS"),"USAGE_STR")`],
        ];

        await Connection.current.getMany(request)
        .then((response) => {
            let nid = response.nid.value;

            let $parent = this.getNode(nid);

            $parent.classList.add('expanded');

            let $members = $parent.querySelector(`.members`);
            let $children = $parent.querySelector(`.children`);

            $members.innerHTML = '';
            $children.innerHTML = '';

            if (response.member_nids.hasOwnProperty('value')) {
                for (let i = 0; i < response.member_nids.value.length; ++i) {
                    let member_nid = response.member_nids.value[i];
                    let member_path = response.member_names.value[i];
                    let member_usage = response.member_usages.value[i];

                    this.addNode($members, member_nid, member_path, member_usage);
                }
            }

            if (response.child_nids.hasOwnProperty('value')) {
                for (let i = 0; i < response.child_nids.value.length; ++i) {
                    let child_nid = response.child_nids.value[i];
                    let child_path = response.child_names.value[i];
                    let child_usage = response.child_usages.value[i];

                    this.addNode($children, child_nid, child_path, child_usage);
                }
            }
        })
    }

}