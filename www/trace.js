import Bounds from "./bounds.js";
import { useDefault } from "./globalDefaults.js";

import * as MDSplus from "./connection.js";

export default class Trace {
    constructor(
        tree = null,
        shot = null,
        default_node = null,
        y_expr = null,
        x_expr = null,
        global_defaults = 0xFFFF,
        trace_type = "line",
        trace_color = "steelblue",
        point_type = null,
        point_color = null,
    ) {
        this.tree = tree;
        this.shot = shot;
        this.default_node = default_node;
        this.y_expr = y_expr;
        this.x_expr = x_expr;
        this.global_defaults = global_defaults;
        this.trace_type = trace_type;
        this.trace_color = trace_color;
        this.point_type = point_type;
        this.point_color = point_color;

        this.data = null;
        this.bounds = new Bounds();
        this.line = null;
    }

    useDefault(property) {
        return useDefault(property, this.global_defaults);
    }

    async update() {
        
        let tree = this.tree;
        if (this.useDefault('tree')) {
            tree = globalDefaults.tree;
        }

        let shot = this.shot;
        if (this.useDefault('shot')) {
            shot = globalDefaults.shot;
        }

        let request = [
            ['open', `TreeOpen("${tree}",${shot})`],
        ];
        
        let default_node = 'TreeSetDefault("\\\\TOP")';
        if(this.useDefault('default_node')) {
            if (globalDefaults.default_node) {
                default_node = `TreeSetDefault("${globalDefaults.default_node.replace('\\', '\\\\')}")`;
            }
        }
        else if (this.default_node) {
            if (this.default_node) {
                default_node = `TreeSetDefault("${this.default_node.replace('\\', '\\\\')}")`;
            }
        }

        request.push([ 'default_node', default_node ]);

        let y_expr = null;
        let x_expr = null;

        if(this.useDefault('y_expr')) {
            y_expr = globalDefaults.y_expr;
        }
        else if (this.y_expr) {
            y_expr = this.y_expr;
        }

        if (request.y == null) {
            // Freak out
        }

        if(this.useDefault('x_expr')) {
            x_expr = globalDefaults.x_expr;
        }
        else if (this.x_expr) {
            x_expr = this.x_expr;
        }
        
        // TODO: Improve
        // Fallback default
        if (x_expr == null || x_expr == '') {
            y_expr = `_wssig=${y_expr}`;
            x_expr = 'dim_of(_wssig)';
        }

        request.push([ 'y', y_expr ]);
        request.push([ 'x', x_expr ]);

        await MDSplus.getMany(request)
        .then((response) => {

            let y_data = null;
            if (response.hasOwnProperty('y')) {
                if (response.y.hasOwnProperty('error')) {
                    console.error('y', response.y.error);
                    return;
                }
                
                y_data = response.y.value;
            }

            let x_data = null;
            if (response.hasOwnProperty('x')) {
                if (response.x.hasOwnProperty('error')) {
                    console.error('x', response.x.error);
                    return;
                }
                
                x_data = response.x.value;
            }

            if (y_data.length != x_data.length) {
                console.error('Length mismatch len(y) != len(x)');
                return;
            }

            this.data = [];
            this.bounds = new Bounds(x_data[0], x_data[0], y_data[0], y_data[0]);
            for (var i = 0; i < y_data.length; ++i) {
                let x = x_data[i];
                let y = y_data[i];

                // Check for NaN and Infinity
                if (!isFinite(x) || !isFinite(y)) {
                    continue;
                }

                this.data.push([x, y]);
                this.bounds.extend(x, y);
            }
        });
    }

    render(svg, xScale, yScale) {
        if (this.data == null) {
            return;
        }

        this.line = svg.append('g')
            .attr('clip-path', 'url(#clip)')
            .append('path')
                .datum(this.data)
                .attr('class', 'line')
                .attr('fill', 'none')
                .attr('stroke', this.trace_color)
                .attr('stroke-width', 1.5)
                .attr('d', d3.line()
                    .x((d) => xScale(d[0]))
                    .y((d) => yScale(d[1]))
                );
    }

    zoom(xScale, yScale) {

        console.log("hello");
        console.log(xScale);

        this.line
            .transition()
            .attr('d', d3.line()
                .x(function (d) { return xScale(d[0])} )
                .y(function (d) { return yScale(d[1])} )
            );
    }
};
