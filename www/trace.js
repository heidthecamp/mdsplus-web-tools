export default class Line {
    constructor (
        tree = null,
        shot = null,
        default_node = null,
        title = null,
        y_expr = null,
        x_expr = null,
    ) {
        this.tree = tree;
        this.shot = shot;
        this.default_node = default_node;
        this.title =title;
        this.y_expr =y_expr;
        this.x_expr =x_expr;
    }
}