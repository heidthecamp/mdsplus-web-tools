
// TODO: Replace 0 with null
export class Bounds {
    constructor(
        xMin = -Infinity,
        xMax = Infinity,
        yMin = -Infinity,
        yMax = Infinity,
    ) {
        this.xMin = xMin;
        this.xMax = xMax;
        this.yMin = yMin;
        this.yMax = yMax;
    };

    join(bounds) {
        this.extend(bounds.xMin, bounds.yMin);
        this.extend(bounds.xMax, bounds.yMax);
    }

    extend(x, y) {
        if (!isFinite(this.xMin) || (isFinite(x) && x < this.xMin)) {
            this.xMin = x;
        }
        
        if (!isFinite(this.xMax) || (isFinite(x) && x > this.xMax)) {
            this.xMax = x;
        }

        if (!isFinite(this.yMin) || (isFinite(y) && y < this.yMin)) {
            this.yMin = y;
        }
        
        if (!isFinite(this.yMax) || (isFinite(y) && y > this.yMax)) {
            this.yMax = y;
        }
    }

    equals(other) {
        return (
            this.xMin == other.xMin &&
            this.xMax == other.xMax &&
            this.yMin == other.yMin &&
            this.yMax == other.yMax
        );
    }
};