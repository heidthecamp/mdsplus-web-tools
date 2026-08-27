
import { Bounds } from "./bounds.js";
import { Connection } from "./connection.js";
import { D3Renderer } from "./d3-renderer.js";
import { Trace } from "./trace.js";

import * as Utils from "./utils.js";

let NextId = 1;

// HACK: Replace with modifications to MDSplusTrace
export class PreviewTrace extends Trace
{
    constructor(y_data, x_data) {
        super();

        if (y_data.length != x_data.length) {
            console.error('array length mismatch');
        }

        // TODO: Dedup
        this.data = [[]];
        this.bounds = new Bounds();
        for (var i = 0; i < x_data.length; ++i) {
            let x = x_data[i];
            let y = y_data[i];

            // Check for NaN and Infinity
            if (!isFinite(x) || !isFinite(y)) {
                if (this.data.at(-1).length > 0) {
                    this.data.push([]);
                }
                continue;
            }

            this.data.at(-1).push([x, y]);
            this.bounds.extend(x, y);
        }

        if (this.data.at(-1).length == 0) {
            this.data.pop();
        }
    }

    viewport() {
        return this.bounds;
    }
}

export class Traverser
{
    constructor(tree, shot_expr, on_double_click = null)
    {
        this.id = NextId++;
        this.on_double_click = on_double_click;

        this.timeout = null;

        this.renderer = new D3Renderer(document.querySelector('#traverser-preview .plot'));

        this.setConnection(Connection.current);

        this.addElement();

        // HACK: Improve
        this.open_promise = this.open(tree, shot_expr);
    }

    async open(tree, shot_expr) {
        if (shot_expr == "model") {
            shot_expr = "\"model\"";
        }
        
        let request = [
            ['open', `TreeOpen("${tree}",${shot_expr})`],
            ['tree', '$EXPT'],
            ['shot', '$SHOT'],
        ];

        try {
            await this.connection.getMany(request)
            .then((response) => {
                response.checkForErrors();
    
                // TODO: Error handling
                this.tree = response.getValue('tree');
                this.shot = response.getValue('shot');
    
                this.addNode(this.$element, 0, `\\${this.tree.toUpperCase()}::TOP`, 'SPECIAL', 1); // TODO: Calculate correct number of descendants
                this.dir(0);
            });
        }
        catch (e) {
            Utils.showErrorMessage(e.message);
            this.close();
        }
    }

    async close() {
        await this.connection.getMany([
            ['close', `TreeClose("${this.tree}", ${this.shot})`]
        ]);

        this.removeElement();
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
        this.$element = document.createElement('div');
        this.$element.dataset.id = this.id;
        this.$element.classList.add('traverser');
        
        // TODO: Remove?
        this.$element.dataset.tree = this.tree;
        this.$element.dataset.shot = this.shot;

        document.querySelector('#traversers').append(this.$element);
    }

    removeElement() {
        this.$element.remove();
    }

    async reveal(node, default_node_expr = null)
    {
        if (default_node_expr == null) {
            default_node_expr = 'TreeSetDefault("\\\\TOP")';
        }
        else {
            default_node_expr = `TreeSetDefault("${default_node_expr.replace('\\', '\\\\')}")`;
        }

        let request = [
            ['open', `TreeOpen("${this.tree}",${this.shot})`],
            ['default_node', default_node_expr], // TODO: Fix
            ['nid', `_wsnid=getnci((${node}), "NID_NUMBER")`],
            ['path', `getnci(_wsnid, "FULLPATH")`],
        ];

        try {
            await this.connection.getMany(request)
            .then(async (response) => {
                response.checkForErrors();
    
                let path = response.getValue('path');
                path = path.split('::')[1];
                
                let used = [];
                let parts = path.split(/[:\.]/);
                for (let i = 1; i < parts.length - 1; ++i) {
                    used.push(parts[i]);
                    await this.dir(used.join(':'));
                }

                let focused_node = this.$element.querySelector(`*[data-nid="${response.getValue('nid')}"]`);
                focused_node.classList.add('focused');
                setTimeout(() => focused_node.classList.remove('focused'), 2000);
            });
        }
        catch (e) {
            Utils.showErrorMessage(e.message);
        }
    }

    addNode(parent, nid, path, usage, num_descendants) {
        usage = usage.split('TreeUSAGE_').at(-1);

        let name = path.split(/[:\.]/).at(-1);
        let $node = Utils.inflateTemplate(document.getElementById('traverser-node-template'));
        
        $node.dataset.nid = nid;

        if (num_descendants > 0) {
            $node.classList.add('expandable');
        }
        
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

        $name.addEventListener('mouseenter', (e) => {
            this.timeout = setTimeout(async (e) => {
                let description = e.target.getAttribute('data-description');

                let $traverserPreview = document.querySelector('#traverser-preview');
                $traverserPreview.classList.add('shown');
                $traverserPreview.style.top = e.clientY;
                $traverserPreview.style.left = e.clientX + 20;

                let request = [
                    ['open', `TreeOpen("${this.tree}",${this.shot})`],
                ];

                if (description == null) { // TODO:
                    request = request.concat([
                        ['name', `trim(getnci(${nid}, "NODE_NAME"))`],
                        ['status', `getnci(${nid}, "STATUS")`],
                        ['flags', `getnci(${nid}, "GET_FLAGS")`],
                        ['decompile', `TreeDecompileRecord(${nid})`],
                        ['tags', `TreeFindAllNodeTags(${nid})`]
                    ]);

                    document.querySelector('#traverser-preview .description').innerText = 'Loading...';
                }
                else {
                    document.querySelector('#traverser-preview .description').innerHTML = description;
                }

                if (usage == 'SIGNAL') {
                    request = request.concat([
                        ['y', `TreeGetRecord(${nid}, _wssig), _wssig=toms510(_wssig)`],
                        ['x', `dim_of(_wssig)`],
                    ]);
                }

                if (request.length > 1) {
                    try {
                        await this.connection.getMany(request)
                        .then((response) => {
                            try {
                                response.checkForErrors();
                            }
                            catch (e) {
                                if (!e.message.startsWith('%TDI')) {
                                    throw e;
                                }
                            }
    
                            if (description == null) {
                                let onOff = (response.getValue('status') == 0 ? 'On' : 'Off');
                                description = `<b>${response.getValue('name')}</b> (${onOff})<br>`;

                                if (usage == 'SIGNAL') {
                                    description += 'Double click to add scope panel<br>';
                                }
                                
                                description += `<b>Usage:</b> ${usage}<br>`;
    
                                let tags = response.getValue('tags');
                                if (tags !== null) {
                                    for (var i = 0; i < tags.length; ++i) {
                                        tags[i] = '\\' + tags[i];
                                    }
                                    description += `<b>Tags:</b> ${tags.join(', ')}<br>`;
                                }
    
                                // TODO: Truncate when really long
                                let expression = response.getValue('decompile');
                                if (expression != '*') {
                                    if (expression.length < 200) {
                                        if (expression.length > 20) {
                                            description += `<b>Expression:</b><div class="expression">${expression}</div>`;
                                        }
                                        else {
                                            description += `<b>Expression:</b> <span class="expression">${expression}</span>`;
                                        }
                                    }
                                    else {
                                        description += `<b>Expression:</b> <span class="expression">...</span>`;
                                    }
                                }
                                
                                e.target.dataset.description = description;
                                document.querySelector('#traverser-preview .description').innerHTML = description;
                            }
    
                            if (response.hasValue('y') && response.hasValue('x')) {
                                document.querySelector('#traverser-preview').classList.add('plot-shown');
    
                                let trace = new PreviewTrace(response.getValue('y'), response.getValue('x'));
                                this.renderer.render([trace]);
                            }

                            // Move the preview up onto the screen
                            let previewBottom = $traverserPreview.getBoundingClientRect().bottom;
                            let screenBottom = window.innerHeight;
                            let footerHeight = document.querySelector('footer').getBoundingClientRect().height;
                            if (previewBottom > (screenBottom - footerHeight)) {
                                $traverserPreview.style.top = e.clientY - (previewBottom - screenBottom) - footerHeight;
                            }
                        });
                    }
                    catch (e) {
                        Utils.showErrorMessage(e.message);
                    }
                }
            }, 500, e);
        });

        $name.addEventListener('mouseleave', (e) => {
            clearTimeout(this.timeout);
            document.querySelector('#traverser-preview .plot').innerHTML = '';
            document.querySelector('#traverser-preview').classList.remove('shown', 'plot-shown');
        });

        if (usage == 'SIGNAL') {
            $node.classList.add('signal');
            if (this.on_double_click !== null) {
                // HACK:
                $name.addEventListener('dblclick', (e) => this.on_double_click(this.tree, this.shot, name, path));
            }

        }

        parent.append($node);
    }

    getNode(nid) {
        return this.$element.querySelector(`*[data-nid="${nid}"]`);
    }

    async dir(node) {
        let request = [
            ['open', `TreeOpen("${this.tree}",${this.shot})`],
            ['default_node', 'SetDefaultNid(0)'],
            ['nid', `_wsnid=getnci(${node}, "NID_NUMBER")`],
            ['child_nids', `_wscnids=getnci(getnci(_wsnid,"CHILDREN_NIDS"),"NID_NUMBER")`],
            ['member_nids', `_wsmnids=getnci(getnci(_wsnid,"MEMBER_NIDS"),"NID_NUMBER")`],
            ['child_names', `getnci(_wscnids,"FULLPATH")`],
            ['member_names', `getnci(_wsmnids,"FULLPATH")`],
            ['child_usages', `getnci(_wscnids,"USAGE_STR")`],
            ['member_usages', `getnci(_wsmnids,"USAGE_STR")`],
            ['child_num_descendants', `getnci(_wscnids,"NUMBER_OF_CHILDREN")+getnci(_wscnids,"NUMBER_OF_MEMBERS")`],
            ['member_num_descendants', `getnci(_wsmnids,"NUMBER_OF_CHILDREN")+getnci(_wsmnids,"NUMBER_OF_MEMBERS")`],
        ];

        await Connection.current.getMany(request)
        .then((response) => {
            try {
                response.checkForErrors();
            }
            catch (e) {
                // A node could have just children or just members
                if (!e.message.startsWith('%TREE-W-NNF')) {
                    throw e;
                }
            }

            let nid = response.getValue('nid');

            let $parent = this.getNode(nid);

            let $members = $parent.querySelector(`.members`);
            let $children = $parent.querySelector(`.children`);

            $members.innerHTML = '';
            $children.innerHTML = '';

            let count = 0;
            if (response.hasValue('member_nids')) {
                const member_nids = response.getValue('member_nids');
                const member_names = response.getValue('member_names');
                const member_usages = response.getValue('member_usages');
                const member_num_descendants = response.getValue('member_num_descendants');

                count += member_nids.length;

                for (let i = 0; i < member_nids.length; ++i) {
                    this.addNode($members, member_nids[i], member_names[i], member_usages[i], member_num_descendants[i]);
                }
            }

            if (response.hasValue('child_nids')) {
                const child_nids = response.getValue('child_nids');
                const child_names = response.getValue('child_names');
                const child_usages = response.getValue('child_usages');
                const child_num_descendants = response.getValue('child_num_descendants');

                count += child_nids.length;
                
                for (let i = 0; i < child_nids.length; ++i) {
                    this.addNode($children, child_nids[i], child_names[i], child_usages[i], child_num_descendants[i]);
                }
            }

            if (count > 0) {
                $parent.classList.add('expanded');
            }
        });
    }

}