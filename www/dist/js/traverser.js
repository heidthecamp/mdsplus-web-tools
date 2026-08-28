
import { Bounds } from "./bounds.js";
import { Connection } from "./connection.js";
import { D3Renderer } from "./d3-renderer.js";
import { Form } from "./form.js";
import { Trace } from "./trace.js";

import * as Utils from "./utils.js";

let NextId = 1;

const NciM = {
    STATE: 0x00000001,
    PARENT_STATE: 0x00000002,
    ESSENTIAL: 0x00000004,
    CACHED: 0x00000008,
    VERSIONS: 0x00000010,
    SEGMENTED: 0x00000020,
    SETUP_INFORMATION: 0x00000040,
    WRITE_ONCE: 0x00000080,
    COMPRESSIBLE: 0x00000100,
    DO_NOT_COMPRESS: 0x00000200,
    COMPRESS_ON_PUT: 0x00000400,
    NO_WRITE_MODEL: 0x00000800,
    NO_WRITE_SHOT: 0x00001000,
    PATH_REFERENCE: 0x00002000,
    NID_REFERENCE: 0x00004000,
    INCLUDE_IN_PULSE: 0x00008000,
    COMPRESS_SEGMENTS: 0x00010000,
};


// HACK: Replace with modifications to MDSplusTrace
export class PreviewTrace extends Trace
{
    constructor(y_data, x_data) {
        super();

        this.trace_color = 'white';

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

class NodeEditForm extends Form
{
    constructor(traverser, nid, readonly=true)
    {
        super('traverser-node-edit-form-template');

        this.traverser = traverser;
        this.nid = nid;
        this.readonly = readonly;

        if (!this.readonly && !this.traverser.open_for_write) {
            this.readonly = true;
        }

        if (this.readonly) {
            this.$element.classList.add('read');
            
            this.$element.querySelectorAll('input')
                .forEach((input) => input.disabled = true);

            this.$element.querySelectorAll('select')
                .forEach((select) => select.disabled = true);

            this.$element.querySelectorAll('textarea')
                .forEach((textarea) => textarea.disabled = true);
        }
        else if (this.traverser.open_for_write) {
            this.$element.classList.add('write');

            if (this.traverser.open_for_edit) {
                this.$element.classList.add('edit');
            }
        }

        this.reset();
    }

    reset() {
        this.traverser.connection.getMany([
            ['path', `getnci(${this.nid}, "PATH")`],
            ['flags', `getnci(${this.nid}, "GET_FLAGS")`],
            ['usage', `getnci(${this.nid}, "USAGE_STR")`],
            ['decompile', `TreeDecompileRecord(${this.nid})`],
        ])
        .then((response) => {
            let path = response.getValue('path');
            this.$element.querySelector('#traverser-node-form-path').innerText = `Editing ${path} in ${this.traverser.tree} shot ${this.traverser.shot}`;

            let flags = response.getValue('flags');
            this.$element.querySelector('#traverser-flag-state').checked = ((flags & NciM.STATE) > 0);
            this.$element.querySelector('#traverser-flag-parent_state').checked = ((flags & NciM.PARENT_STATE) > 0);
            this.$element.querySelector('#traverser-flag-essential').checked = ((flags & NciM.ESSENTIAL) > 0);
            this.$element.querySelector('#traverser-flag-cached').checked = ((flags & NciM.CACHED) > 0);
            this.$element.querySelector('#traverser-flag-versions').checked = ((flags & NciM.VERSIONS) > 0);
            this.$element.querySelector('#traverser-flag-segmented').checked = ((flags & NciM.SEGMENTED) > 0);
            this.$element.querySelector('#traverser-flag-setup_information').checked = ((flags & NciM.SETUP_INFORMATION) > 0);
            this.$element.querySelector('#traverser-flag-write_once').checked = ((flags & NciM.WRITE_ONCE) > 0);
            this.$element.querySelector('#traverser-flag-compressible').checked = ((flags & NciM.COMPRESSIBLE) > 0);
            this.$element.querySelector('#traverser-flag-do_not_compress').checked = ((flags & NciM.DO_NOT_COMPRESS) > 0);
            this.$element.querySelector('#traverser-flag-compress_on_put').checked = ((flags & NciM.COMPRESS_ON_PUT) > 0);
            this.$element.querySelector('#traverser-flag-no_write_model').checked = ((flags & NciM.NO_WRITE_MODEL) > 0);
            this.$element.querySelector('#traverser-flag-no_write_shot').checked = ((flags & NciM.NO_WRITE_SHOT) > 0);
            this.$element.querySelector('#traverser-flag-path_reference').checked = ((flags & NciM.PATH_REFERENCE) > 0);
            this.$element.querySelector('#traverser-flag-nid_reference').checked = ((flags & NciM.NID_REFERENCE) > 0);
            this.$element.querySelector('#traverser-flag-include_in_pulse').checked = ((flags & NciM.INCLUDE_IN_PULSE) > 0);
            this.$element.querySelector('#traverser-flag-compress_segments').checked = ((flags & NciM.COMPRESS_SEGMENTS) > 0);

            let usage = response.getValue('usage').split('TreeUSAGE_').at(-1);
            this.$element.querySelector('#traverser-node-usage').value = usage;

            this.$element.querySelector('#traverser-node-form-data').value = response.getValue('decompile');
        });
    }

    apply() {
        if (this.readonly) {
            return;
        }
    }
};

export class Traverser
{
    constructor(tree, shot_expr, on_double_click = null)
    {
        this.id = NextId++;
        this.on_double_click = on_double_click;
        this.open_for_write = false;
        this.open_for_edit = false;

        this.timeout = null;

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

        // TODO: Parameterize / Rename
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

    addNode(parent, nid, path, usage, num_descendants, prefix='') {
        usage = usage.split('TreeUSAGE_').at(-1);

        let name = path.split(/[:\.]/).at(-1);
        let $node = Utils.inflateTemplate(document.getElementById('traverser-node-template'));
        $node.dataset.nid = nid;

        if (num_descendants > 0) {
            $node.classList.add('expandable');
        }
        
        $node.querySelector('.name').innerText = `${prefix}${name}`;

        let $handle = $node.querySelector('.handle');

        $handle.addEventListener('click', (e) => {
            if ($node.classList.contains('expanded')) {
                $node.classList.remove('expanded');
            }
            else {
                this.dir(nid);
            }
        });

        $node.querySelectorAll('*[data-action="traverser-display"')
            .forEach((button) => {
                button.addEventListener('click', () => {
                    Form.show(new NodeEditForm(this, nid, true));
                });
            });

        $node.querySelectorAll('*[data-action="traverser-modify"')
            .forEach((button) => {
                button.addEventListener('click', () => {
                    Form.show(new NodeEditForm(this, nid, false));
                });
            });

        let classes = `tooltip-${nid} traverser-tooltip`;
        let title = '<div class="description">Loading...</div>';
        if (usage == 'SIGNAL') {
            title = '<div class="plot"></div>' + title;
            classes += ' plot-shown';
        }
        
        let tooltip = bootstrap.Tooltip.getOrCreateInstance($handle, {
            customClass: classes,
            title: title,
            html: true,
            delay: { 
                show: 1000,
                hide: 100
            },
        });

        $handle.addEventListener('show.bs.tooltip', (e) => {
            let hasDescription = $node.getAttribute('data-has-description');

            let request = [
                ['open', `TreeOpen("${this.tree}",${this.shot})`],
            ];

            if (!hasDescription) {
                request = request.concat([
                    ['name', `trim(getnci(${nid}, "NODE_NAME"))`],
                    ['status', `getnci(${nid}, "STATUS")`],
                    ['flags', `getnci(${nid}, "GET_FLAGS")`],
                    ['decompile', `TreeDecompileRecord(${nid})`],
                    ['tags', `TreeFindAllNodeTags(${nid})`],
                ]);
            }

            if (usage == 'SIGNAL') {
                request = request.concat([
                    ['y', `TreeGetRecord(${nid}, _wssig), _wssig=toms510(_wssig)`],
                    ['x', `dim_of(_wssig)`],
                ]);
            }

            if (request.length > 1) {
                try {
                    this.connection.getMany(request)
                    .then((response) => {
                        try {
                            response.checkForErrors();
                        }
                        catch (e) {
                            if (!e.message.startsWith('%TDI')) {
                                throw e;
                            }
                        }

                        if (!hasDescription) {
                            let onOff = (response.getValue('status') == 0 ? 'On' : 'Off');
                            let html = `<b>${response.getValue('name')}</b> (${onOff})<br>`;
                            
                            html += `<b>Usage:</b> ${usage}<br>`;

                            let tags = response.getValue('tags');
                            if (tags !== null) {
                                for (var i = 0; i < tags.length; ++i) {
                                    tags[i] = '\\' + tags[i];
                                }
                                html += `<b>Tags:</b> ${tags.join(', ')}<br>`;
                            }

                            // TODO: Truncate when really long
                            let expression = response.getValue('decompile');
                            if (expression != '*') {
                                if (expression.length < 200) {
                                    if (expression.length > 20) {
                                        html += `<b>Expression:</b><div class="expression">${expression}</div>`;
                                    }
                                    else {
                                        html += `<b>Expression:</b> <span class="expression">${expression}</span>`;
                                    }
                                }
                                // else {
                                //     html += `<b>Expression:</b> <span class="expression">...</span>`;
                                // }
                            }

                            tooltip.setContent({ '.description': html });
                            $node.setAttribute('data-has-description', true);
                        }

                        if (response.hasValue('y') && response.hasValue('x')) {
                            let trace = new PreviewTrace(response.getValue('y'), response.getValue('x'));
                            let renderer = new D3Renderer(document.querySelector(`.tooltip-${nid} .plot`));
                            renderer.render([trace]);
                        }
                    });
                }
                catch (e) {
                    Utils.showErrorMessage(e.message);
                }
            }
        });

        if (usage == 'SIGNAL') {
            $node.classList.add('signal');

            $node.querySelectorAll('*[data-action="traverser-add-to-dashboard"')
                .forEach((button) => {
                    button.addEventListener('click', () => {
                        // HACK:
                        if (this.on_double_click !== null) {
                            this.on_double_click(this.tree, this.shot, name, path);
                        }
                    });
                });

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
                    this.addNode($members, member_nids[i], member_names[i], member_usages[i], member_num_descendants[i], ':');
                }
            }

            if (response.hasValue('child_nids')) {
                const child_nids = response.getValue('child_nids');
                const child_names = response.getValue('child_names');
                const child_usages = response.getValue('child_usages');
                const child_num_descendants = response.getValue('child_num_descendants');

                count += child_nids.length;
                
                for (let i = 0; i < child_nids.length; ++i) {
                    this.addNode($children, child_nids[i], child_names[i], child_usages[i], child_num_descendants[i], '.');
                }
            }

            if (count > 0) {
                $parent.classList.add('expanded');
            }
        });
    }

}
