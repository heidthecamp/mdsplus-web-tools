export default class Trace {
    constructor (
        tree = null,
        shot = null,
        default_node = null,
        title = null,
        y_expr = null,
        x_expr = null,
        trace_type = "line",
        trace_color = "steelblue",
        point_type = "none",
        point_color = "red",
    ) {
        this.tree = tree;
        this.shot = shot;
        this.default_node = default_node;
        this.title =title;
        this.y_expr =y_expr;
        this.x_expr =x_expr;
        this.trace_type =trace_type;
        this.trace_color=trace_color;
        this.point_type=point_type;
        this.point_color=point_color;

    }
}