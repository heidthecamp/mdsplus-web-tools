
import { Renderer } from "./renderer.js";

export class CanvasRenderer extends Renderer
{
    render(traces)
    {
        this.element.innerHTML = '';

        let plotRect = this.element.getBoundingClientRect();
        
        let dataWidth = plotRect.width - this.margin.left - this.margin.right;
        let dataHeight = plotRect.height - this.margin.top - this.margin.bottom;

        if (traces.length == 0) {
            return;
        }

        // HACK: ?
        let viewport = traces[0].viewport();
        if (viewport === null) {
            return;
        }

        let viewportWidth = (viewport.xMax - viewport.xMin);
        let viewportHeight = (viewport.yMax - viewport.yMin);

        let canvas = document.createElement('canvas');
        canvas.width = plotRect.width;
        canvas.height = plotRect.height;
        this.element.append(canvas);

        /** @{CanvasRenderingContext2D} */
        let ctx = canvas.getContext('2d');

        // ctx.fillStyle = 'black';
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // ctx.fill();

        let scaleX = (value) => {
            return (((value - viewport.xMin) / viewportWidth) * dataWidth) + this.margin.left;
        };
        let scaleY = (value) => {
            return ((1 - ((value - viewport.yMin) / viewportHeight)) * dataHeight) + this.margin.top;
        };

        ctx.lineWidth = 1.5;

        // For every trace...
        for (var i = 0; i < traces.length; ++i) {
            let trace = traces[i];

            if (trace.color === null) {
                // ctx.strokeStyle = 'white';
                ctx.strokeStyle = 'black';
            }
            else {
                ctx.strokeStyle = trace.color;
            }

            // For every line...
            for (var j = 0; j < trace.data.length; ++j) {
                if (trace.data[j].length == 0) {
                    continue;
                }

                if (trace.data[j].length == 1) {
                    // TODO:
                    // trace.point_color
                }
                else {
                    ctx.beginPath();

                    let point = trace.data[j][0];
                    ctx.moveTo(scaleX(point[0]), scaleY(point[1]));
                    
                    // For every point...
                    for (var k = 1; k < trace.data[j].length; ++k) {
                        point = trace.data[j][k];
                        ctx.lineTo(scaleX(point[0]), scaleY(point[1]));
                    }

                    ctx.stroke();
                }
            }
        }

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, this.margin.top);
        ctx.fillRect(0, dataHeight + this.margin.top, canvas.width, this.margin.bottom);
        ctx.fillRect(0, 0, this.margin.left, canvas.height);
        ctx.fillRect(canvas.width - this.margin.right, 0, this.margin.right, canvas.height);
        // ctx.fill();

        // ctx.strokeStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.margin.left - 10, this.margin.top - 1);
        ctx.lineTo(this.margin.left, this.margin.top - 1);
        ctx.lineTo(this.margin.left, canvas.height - this.margin.bottom + 1 + 10);
        ctx.moveTo(this.margin.left - 10, canvas.height - this.margin.bottom + 1);
        ctx.lineTo(canvas.width - this.margin.right - 1, canvas.height - this.margin.bottom + 1);
        ctx.lineTo(canvas.width - this.margin.right - 1, canvas.height - this.margin.bottom + 1 + 10);
        ctx.stroke();

        ctx.font = 'normal 10px sans-serif';
        ctx.textBaseline = 'middle';
        // ctx.fillStyle = 'white';
        ctx.fillStyle = 'black';

        // TODO: Prefer more natural steps such as 0.5 or 10's or 0.1

        let range = (viewport.yMax - viewport.yMin);
        let midpoint = parseFloat((range / 2).toPrecision(3));
        if (viewport.yMax > 0 && viewport.yMin < 0) {
            midpoint = 0;
        }
        
        // TODO: Improve
        let gridLines = Math.floor(dataHeight / 20);
        let step = parseFloat((range / (gridLines - 1)).toPrecision(3));
        let linesAbove = Math.floor((gridLines - 1) * ((viewport.yMax - midpoint) / range));
        let linesBelow = Math.floor((gridLines - 1) * ((midpoint - viewport.yMin) / range));

        let markers = [midpoint];
        for (let i = 1; i <= linesAbove; ++i) {
            markers.push(midpoint + (i * step));
        }
        for (let i = 1; i <= linesBelow; ++i) {
            markers.push(midpoint - (i * step));
        }
        markers.sort((a, b) => a - b); // By default this sorts them as text

        for (let i = 0; i < markers.length; ++i) {
            let value = parseFloat(markers[i].toPrecision(3));

            let text = value.toLocaleString();
            // let text = value.toFixed(3).toString();
            
            let size = ctx.measureText(text);
            // if (size.width > (this.margin.left - 20)) {
            //     text = value.toExponential().toString();
            //     size = ctx.measureText(text);
            // }
            
            let offset = (1.0 - ((value - viewport.yMin) / range)) * dataHeight;
            ctx.fillText(text, this.margin.left - size.width - 12, this.margin.top + offset);

            ctx.moveTo(this.margin.left - 10, this.margin.top + offset);
            ctx.lineTo(this.margin.left, this.margin.top + offset);
            ctx.stroke();
        }


        range = (viewport.xMax - viewport.xMin);
        midpoint = parseFloat((range / 2).toPrecision(3));
        if (viewport.xMax > 0 && viewport.xMin < 0) {
            midpoint = 0;
        }
        
        gridLines = Math.floor(dataWidth / 120);
        step = parseFloat((range / (gridLines - 1)).toPrecision(3));
        linesAbove = Math.floor((gridLines - 1) * ((viewport.xMax - midpoint) / range));
        linesBelow = Math.floor((gridLines - 1) * ((midpoint - viewport.xMin) / range));

        markers = [midpoint];
        for (let i = 1; i <= linesAbove; ++i) {
            markers.push(midpoint + (i * step));
        }
        for (let i = 1; i <= linesBelow; ++i) {
            markers.push(midpoint - (i * step));
        }
        markers.sort((a, b) => a - b); // By default this sorts them as text

        for (let i = 0; i < markers.length; ++i) {
            let value = parseFloat(markers[i].toPrecision(3));

            let text = value.toLocaleString();
            // let text = value.toFixed(3).toString();
            
            let size = ctx.measureText(text);
            // if (size.width > (this.margin.left - 20)) {
            //     text = value.toExponential().toString();
            //     size = ctx.measureText(text);
            // }
            
            let offset = ((value - viewport.xMin) / range) * dataWidth;
            ctx.fillText(text, this.margin.left - (size.width / 2) + offset, this.margin.top + dataHeight + 20);

            ctx.moveTo(this.margin.left + offset, this.margin.top + dataHeight);
            ctx.lineTo(this.margin.left + offset, this.margin.top + dataHeight + 10);
            ctx.stroke();
        }
    }
}