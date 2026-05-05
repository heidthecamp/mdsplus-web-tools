
// TODO: Replace 0 with null
export class Bounds {
    constructor(
        xMin = Number.MAX_SAFE_INTEGER,
        xMax = Number.MIN_SAFE_INTEGER,
        yMin = Number.MAX_SAFE_INTEGER,
        yMax = Number.MIN_SAFE_INTEGER,
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
        
        if (bounds.xMax > this.xMax) {
            this.xMax = bounds.xMax;
        }

        if (bounds.yMin < this.yMin) {
            this.yMin = bounds.yMin;
        }
        
        if (bounds.yMax > this.yMax) {
            this.yMax = bounds.yMax;
        }
    }

    extend(x, y) {
        if (x < this.xMin || !isFinite(this.xMin)) {
            this.xMin = x;
        }
        
        if (x > this.xMax || !isFinite(this.xMax)) {
            this.xMax = x;
        }

        if (y < this.yMin || !isFinite(this.yMin)) {
            this.yMin = y;
        }
        
        if (y > this.yMax || !isFinite(this.yMax)) {
            this.yMax = y;
        }
    }
};