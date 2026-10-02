
import { Bounds } from "./bounds.js";
import { Form } from "./form.js";
import { Scope } from "./scope.js";
import { Trace } from "./trace.js";

import * as Utils from "./utils.js";

export class MDSplusTrace extends Trace
{
    // TODO: Improve
    static Defaults = {
        tree: null,
        shot_expr: null,
        default_node_expr: null,
        y_expr: null,
        x_expr: null,
        type: "line",
        color: "black",
        marker: null,
    };

    constructor(
        tree = MDSplusTrace.Defaults.tree,
        shot_expr = MDSplusTrace.Defaults.shot_expr,
        default_node_expr = MDSplusTrace.Defaults.default_node_expr,
        y_expr = MDSplusTrace.Defaults.y_expr,
        x_expr = MDSplusTrace.Defaults.x_expr,
        type = MDSplusTrace.Defaults.type,
        color = MDSplusTrace.Defaults.color,
        marker = MDSplusTrace.Defaults.marker,
    ) {
        super(type, color, marker);

        if (shot_expr !== null && typeof shot_expr !== 'string') {
            shot_expr = shot_expr.toString();
        }

        this.tree = tree;
        this.shot_expr = shot_expr;
        this.default_node_expr = default_node_expr;
        this.y_expr = y_expr;
        this.x_expr = x_expr;

        this.data = [];
    }

    // HACK:
    setPanel(panel) {
        this.panel = panel;
    }

    // TODO:
    async update(conn, bounds, count)
    {
        let request = [];

        let tree = this.getPropertyOrDefault('tree');
        let shot_expr = this.getPropertyOrDefault('shot_expr');

        if (this.shot_expr === null) {
            // If we are using the default shot expression, modify it with the shot offset
            shot_expr += "+" + Scope.shot_expr_offset;
        }

        // TODO: Figure out why !== doesn't work
        if (tree != null) {
            if (shot_expr != null) {
                request.push(['open', `getmsg(TreeOpen("${tree}",${shot_expr}))`])
            }
            else {
                request.push(['open', `getmsg(TreeOpen("${tree}",0))`])
            }
        }

        let default_node_expr = this.getPropertyOrDefault('default_node_expr');
        if (default_node_expr == null) {
            default_node_expr = 'TreeSetDefault("\\\\TOP")';
        }
        else {
            default_node_expr = `TreeSetDefault("${default_node_expr.replace('\\', '\\\\')}")`;
        }

        // TODO: Only call if needed?
        request.push([ 'default_node', default_node_expr ]);

        let y_expr = this.getPropertyOrDefault('y_expr');
        let x_expr = this.getPropertyOrDefault('x_expr');

        if (request.y_expr == null) {
            // Freak out
        }

        let res_start = '*';
        if (isFinite(bounds.xMin)) {
            res_start = bounds.xMin;
        }

        let res_stop = '*';
        if (isFinite(bounds.xMax)) {
            res_stop = bounds.xMax;
        }

        count = Math.ceil(count); // TODO: Improve?

        // let res_delta = '*';
        // if (res_start != '*' && res_stop != '*') {
        //     // Fernando's edge case
        //     if (res_stop < res_start) {
        //         let temp = res_start;
        //         res_start = res_stop;
        //         res_stop = temp;
        //     }
        //     res_delta = (res_stop - res_start) / count;
        // }

        // // TODO: Investigate what exactly this does
        // request.push([ 'stc', `SetTimeContext(${res_start}, ${res_stop}, ${res_delta}, "MinMax")` ]);

        if (!Scope.resample) {
            count = '*';
        }

        // TODO: Improve
        // Fallback default
        if (x_expr == null || x_expr == '') {
            y_expr = `_wssig=(${y_expr};), _wssig=CropAndResample(_wssig,${res_start},${res_stop},${count}), data(_wssig)`;
            x_expr = 'dim_of(_wssig)';
        }
        else {
            y_expr = `_wssig=(${y_expr};), _wssig=make_signal(data(_wssig), *, (${x_expr};)), _wssig=CropAndResample(_wssig,${res_start},${res_stop},${count}), data(_wssig)`;
            x_expr = 'dim_of(_wssig)';
        }

        request.push([ 'y', y_expr ]);
        request.push([ 'x', x_expr ]);
        // TODO: Include xmin/ymin/xmax/ymax in this request rather than in calculate bounds? maybe?

        try {
            await conn.getMany(request)
            .then((response) => {
                // TODO: Improve, For errors from Resample()
                if (typeof response.getValue('y') === 'string') {
                    let error = Error(response.getValue('y'));
                    error.field = 'y_expr';
                    throw error;
                }

                response.checkForErrors();

                if (response.hasOwnProperty('open')) {
                    let open = response.getValue('open');
                    if (open.startsWith('%TREE-E')) {
                        let error = Error(open);
                        error.field = 'open';
                        throw error;
                    }
                }

                let y = response.getValue('y');
                let x = response.getValue('x');

                if (y === null || x === null) {
                    throw Error(`Could not retrieve x or y data\ny: ${y}\nx: ${x}`);
                }
                else if (y.length < x.length) {
                    throw Error('Length mismatch len(y) < len(x)');
                }

                this.data = [[]];
                this.bounds = new Bounds(bounds.xMin, bounds.xMax, bounds.yMin, bounds.yMax);
                for (var i = 0; i < x.length; ++i) {

                    // Check for NaN and Infinity
                    if (!isFinite(x[i]) || !isFinite(y[i])) {
                        if (this.data.at(-1).length > 0) {
                            this.data.push([]);
                        }
                        continue;
                    }

                    this.data.at(-1).push([x[i], y[i]]);

                    let outOfView = (
                        (isFinite(bounds.xMin) && x[i] < bounds.xMin) ||
                        (isFinite(bounds.xMax) && x[i] > bounds.xMax) ||
                        (isFinite(bounds.yMin) && y[i] < bounds.yMin) ||
                        (isFinite(bounds.yMax) && y[i] > bounds.yMax)
                    );

                    if (!outOfView) {
                        this.bounds.extend(x[i], y[i]);
                    }
                }

                if (this.data.at(-1).length == 0) {
                    this.data.pop();
                }

                if (this.initialData == null) {
                    this.initialData = this.data;
                }
            });
        }
        catch (e) {
            this.data = [[]];
            Utils.showErrorMessage(e.message, () => {
                this.panel.edit();

                // TODO: Cleanup
                const Mapping = {
                    open: ['tree', 'shot_expr'],
                    default_node: ['default_node_expr'],
                    y: ['y_expr'],
                    x: ['x_expr'],
                }

                let index = this.panel.traces.indexOf(this);
                Form.activeForm.showTraceForm(index);

                let fields = Mapping[e.field];
                for (var field of fields) {
                    let input = Form.activeForm.getInput(field, index);
                    Utils.focusElement(input);
                }
            });
            throw e;
        }
    }

    viewport() {
        if (this.hasOwnProperty('panel') && this.panel !== null) {
            return this.panel.viewport();
        }
        return null;
    }
    
    getPropertyOrDefault(name) {
        // null indicates a panel default
        if (this.hasOwnProperty(name) && this[name] !== null) {
            if (this[name] === '') {
                return null;
            }

            return this[name];
        }
        else if (Scope.defaults.hasOwnProperty(name) && Scope.defaults[name] !== null) {
            if (Scope.defaults[name] === '') {
                return null;
            }

            return Scope.defaults[name];
        }

        return null;
    }
}