
import { Scope } from "./scope.js";
import { Bounds } from "./bounds.js";

export class Trace
{
    constructor(
        trace_type = "line",
        trace_color = "black",
        point_type = null,
        point_color = null
    ) {
        this.trace_type = trace_type;
        this.trace_color = trace_color;
        this.point_type = point_type;
        this.point_color = point_color;

        this.bounds = new Bounds();
        this.initial_data = null; // for auto**
        this.data = []; // an array of arrays of [x,y] points :(
    }

    update() {
        // Virtual
    }
};

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

        // let points = [];
        // for (let i = 0; i < y.length; ++i) {
        //     points.push([x[i], y[i]]);
        // }
        // this.data = [points];
    }
}

export class MDSplusTrace extends Trace
{
    constructor(
        tree = null,
        shot_expr = null,
        default_node_expr = null,
        y_expr = null,
        x_expr = null,
        trace_type = "line",
        trace_color = "black",
        point_type = null,
        point_color = null,
    ) {
        super(trace_type, trace_color, point_type, point_color);
        this.tree = tree;
        this.shot_expr = shot_expr;
        this.default_node_expr = default_node_expr;
        this.y_expr = y_expr;
        this.x_expr = x_expr;

        this.data = [];
    }

    async update(conn, bounds, count, global_defaults_flags)
    {
        let getValueOrDefault = (property) => {
            if (global_defaults_flags[property] && Scope.defaults[property] !== null) {
                return Scope.defaults[property];
            }

            return this[property];
        }

        let request = [];

        let tree = getValueOrDefault('tree');
        let shot_expr = getValueOrDefault('shot_expr');

        // TODO: Figure out why !== doesn't work
        if (tree != null) {
            if (shot_expr != null) {
                request.push(['open', `TreeOpen("${tree}",${shot_expr})`])
            }
            else {
                request.push(['open', `TreeOpen("${tree}",0)`])
            }
        }

        let default_node_expr = getValueOrDefault('default_node_expr');
        if (default_node_expr == null) {
            default_node_expr = 'TreeSetDefault("\\\\TOP")';
        }
        else {
            default_node_expr = `TreeSetDefault("${default_node_expr.replace('\\', '\\\\')}")`;
        }

        // TODO: Only call if needed?
        request.push([ 'default_node_expr', default_node_expr ]);

        let y_expr = getValueOrDefault('y_expr');
        let x_expr = getValueOrDefault('x_expr');

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

        // TODO: Improve
        // Fallback default
        if (x_expr == null || x_expr == '') {
            y_expr = `_wssig=(${y_expr};), _wssig=CropAndResample(_wssig,${res_start},${res_stop},${count})`;
            x_expr = 'dim_of(_wssig)';
        }
        else {
            y_expr = `_wssig=(${y_expr};), _wssig=make_signal(data(_wssig), *, (${x_expr};)), _wssig=CropAndResample(_wssig,${res_start},${res_stop},${count})`;
            x_expr = 'dim_of(_wssig)';
        }

        request.push([ 'y_expr', y_expr ]);
        request.push([ 'x_expr', x_expr ]);
        // TODO: Include xmin/ymin/xmax/ymax in this request rather than in calculate bounds? maybe?

        await conn.getMany(request)
        .then((response) => {

            let y_data = null;
            if (response.hasOwnProperty('y_expr')) {
                if (response.y_expr.hasOwnProperty('error')) {
                    throw Error(response.y_expr.error);
                    return;
                }
                
                y_data = response.y_expr.value;
            }

            let x_data = null;
            if (response.hasOwnProperty('x_expr')) {
                if (response.x_expr.hasOwnProperty('error')) {
                    throw Error(response.x_expr.error);
                    return;
                }
                
                x_data = response.x_expr.value;
            }

            if (y_data === null || x_data === null) {
                throw Error(`Could not retrieve x or y data\ny_data: ${y_data}\nx_data: ${x_data}`);
                return
            }
            // y truncates to match x.
            else if (y_data.length < x_data.length) {
                throw Error('Length mismatch len(y) < len(x)');
                return;
            }

            this.data = [[]];
            this.bounds = new Bounds(bounds.xMin, bounds.xMax, bounds.yMin, bounds.yMax);
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

                let outOfView = (
                    (isFinite(bounds.xMin) && x < bounds.xMin) ||
                    (isFinite(bounds.xMax) && x > bounds.xMax) ||
                    (isFinite(bounds.yMin) && y < bounds.yMin) ||
                    (isFinite(bounds.yMax) && y > bounds.yMax)
                );

                if (!outOfView) {
                    this.bounds.extend(x, y);
                }
            }

            if (this.data.at(-1).length == 0) {
                this.data.pop();
            }
        });

        if (this.initial_data == null) {
            this.initial_data = this.data;
        }
    }

}