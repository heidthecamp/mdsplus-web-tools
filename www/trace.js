import Bounds from "./bounds.js";
import { useDefault } from "./globalDefaults.js";

import * as MDSplus from "./connection.js";

export default class Trace {
    constructor(
        tree = null,
        shot = null,
        default_node = null,
        title = null, // TODO: Move to Panel
        y_expr = null,
        x_expr = null,
        global_defaults = 0xFFFF,
        // TODO: global_defaults, ymin, ymax, xmin, xmax
        trace_type = "line",
        trace_color = "steelblue",
        point_type = null,
        point_color = null,
    ) {
        this.tree = tree;
        this.shot = shot;
        this.default_node = default_node;
        this.title_expr = title;
        this.y_expr = y_expr;
        this.x_expr = x_expr;
        this.global_defaults = global_defaults;
        this.trace_type = trace_type;
        this.trace_color = trace_color;
        this.point_type = point_type;
        this.point_color = point_color;

        this.title = null;
        this.data = null;
        this.bounds = new Bounds();
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

        let request = {
            'open': `TreeOpen("${tree}",${shot})`,
        };

        // TODO: Move?
        if(this.useDefault('title_expr')) {
            if (globalDefaults.title_expr) {
                request.title = globalDefaults.title_expr;
            }
        }
        else if (this.title_expr) {
            request.title = this.title_expr;
        }
        
        request.default_node = 'TreeSetDefault("\\\\TOP")';
        if(this.useDefault('default_node')) {
            if (globalDefaults.default_node) {
                request.default_node = `TreeSetDefault("${globalDefaults.default_node.replace('\\', '\\\\')}")`;
            }
        }
        else if (this.default_node) {
            if (this.default_node) {
                request.default_node = `TreeSetDefault("${this.default_node.replace('\\', '\\\\')}")`;
            }
        }

        if(this.useDefault('y_expr')) {
            request.y = globalDefaults.y_expr;
        }
        else if (this.y_expr) {
            request.y = this.y_expr;
        }

        if (request.y == null) {
            // Freak out
        }

        if(this.useDefault('x_expr')) {
            request.x = globalDefaults.x_expr;
        }
        else if (this.x_expr) {
            request.x = this.x_expr;
        }
        
        // TODO: Improve
        // Fallback default
        if (request.x == null || request.x == '') {
            request.y = `_wssig=${request.y}`;
            request.x = 'dim_of(_wssig)';
        }

        await MDSplus.getMany(request)
        .then((response) => {
            if (response.hasOwnProperty('title')) {
                if (response.title.hasOwnProperty('error')) {
                    console.error('Title', response.title.error);
                    return;
                }

                this.title = response.title.value;
            }

            let y_data = null;
            if (response.hasOwnProperty('y')) {
                if (response.y.hasOwnProperty('error')) {
                    console.error('Y', response.y.error);
                    return;
                }
                
                y_data = response.y.value;
            }

            let x_data = null;
            if (response.hasOwnProperty('x')) {
                if (response.x.hasOwnProperty('error')) {
                    console.error('X', response.x.error);
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

                this.data.push([x, y]);
                this.bounds.extend(x, y);
            }
        });
    }

    render(svg, xScale, yScale) {
        if (this.data == null) {
            return;
        }

        let line = svg.append('g')
            .attr('clip-path', 'url(#clip)')
            .append('path')
                .datum(this.data)
                .attr('class', 'line')
                .attr('fill', 'none')
                .attr('stroke', this.trace_color)
                .attr('stroke-width', 1.5)
                .attr('d', d3.line()
                    .x((d) => { return xScale(d[0]); })
                    .y((d) => { return yScale(d[1]); })
                );
    }
};
