
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

    viewport() {
        // Virtual
    }

    update() {
        // Virtual
    }
};
