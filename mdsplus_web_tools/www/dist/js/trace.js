
import { Bounds } from "./bounds.js";

export class Trace
{
    constructor(
        type = "line", // line, step, none
        color = "black",
        marker = null, // circle, triangle, cross, etc
    ) {
        this.type = type;
        this.color = color;
        this.marker = marker;

        this.bounds = new Bounds();
        this.initialData = null; // for auto**
        this.data = []; // an array of arrays of [x,y] points :(
    }

    viewport() {
        // Virtual
    }

    update() {
        // Virtual
    }
};
