
// TODO: Replace 0 with null
export default class Bounds {
    constructor(
        xMin = 0,
        xMax = 0,
        yMin = 0,
        yMax = 0,
    ) {
        this.xMin = xMin;
        this.xMax = xMax;
        this.yMin = yMin;
        this.yMax = yMax;
    };

    join(bounds) {
        if (bounds.xMin < this.xMin) {
            this.xMin = bounds.xMin;
        }
        else if (bounds.xMax > this.xMax) {
            this.xMax = bounds.xMax;
        }

        if (bounds.yMin < this.yMin) {
            this.yMin = bounds.yMin;
        }
        else if (bounds.yMax > this.yMax) {
            this.yMax = bounds.yMax;
        }
    }

    extend(x, y) {
        if (x < this.xMin) {
            this.xMin = x;
        }
        else if (x > this.xMax) {
            this.xMax = x;
        }

        if (y < this.yMin) {
            this.yMin = y;
        }
        else if (y > this.yMax) {
            this.yMax = y;
        }
    }
};