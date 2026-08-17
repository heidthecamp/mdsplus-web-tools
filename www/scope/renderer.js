
import { Bounds } from "./bounds.js";

let NextId = 1;

export class Renderer
{
    static renderers = [];

    constructor(
        element,
        panel,
        margin = {
            left: 60,
            right: 10,
            top: 10,
            bottom: 30,
        }
    ) {
        this.element = element;
        this.panel = panel;
        this.margin = margin;

        Renderer.renderers.push(this);
    }

    remove() {
        let index = Renderer.renderers.indexOf(this);
        Renderer.renderers.splice(index, 1);
    }

    render() {
        // virtual
    }

}

export class D3Renderer extends Renderer
{
    render()
    {
        let plotRect = this.element.getBoundingClientRect();
        this.element.innerHTML = ''; // Before?

        if ((plotRect.width + plotRect.height) == 0) {
            return;
        }

        let viewport = this.panel.viewport();
        if (viewport === null) {
            return;
        }
        
        let dataWidth = plotRect.width - this.margin.left - this.margin.right;
        let dataHeight = plotRect.height - this.margin.top - this.margin.bottom;

        let viewportWidth = (viewport.xMax - viewport.xMin);
        let viewportHeight = (viewport.yMax - viewport.yMin);

        // TODO: Improve
        let id = NextId++;

        const svg = d3.select(this.element)
            .html(null)
            .append('svg')
                .attr('width', plotRect.width)
                .attr('height', plotRect.height)
            .append('g')
                .attr('transform',
                    `translate(${this.margin.left},${this.margin.top})`
                );

        const xScale = d3.scaleLinear()
            .domain([ viewport.xMin, viewport.xMax ])
            .range([ 0, dataWidth ]);

        let xAxis = svg.append('g')
            .attr('transform', `translate(0,${dataHeight})`)
            .call(d3.axisBottom(xScale));

        const yScale = d3.scaleLinear()
            .domain([ viewport.yMin, viewport.yMax ])
            .range([ dataHeight, 0 ]);
        
        let yAxis = svg.append('g')
            .call(d3.axisLeft(yScale));
        
        let clip = svg.append('defs').append('SVG:clipPath')
            .attr('id', `clip-${id}`) // Turns out that ID's within SVGs can be referenced by other SVGs
            .append('svg:rect')
            .attr('width', dataWidth)
            .attr('height', dataHeight)
            .attr('x', 0)
            .attr('y', 0);

        // TODO: Move to ctor?
        this.line = [];

        // TODO: Handle NaN's breaking lines
        // Isn't this done?

        // For every trace...
        for (var i = 0; i < this.panel.traces.length; ++i) {
            let trace = this.panel.traces[i];

            let lines = [];

            // For every line...
            for (var j = 0; j < trace.data.length; ++j) {
                if (trace.data[j].length == 1) {
                    // TODO: Investigate
                    svg.selectAll("myPoints")
                        .data(trace.data[j])
                        .enter()
                        .append('circle')
                        .attr("stroke-width", .75)
                        .attr('fill', trace.point_color)
                        .attr("stroke", trace.point_color)
                        .attr("cx", d => xScale(d[0]))
                        .attr("cy", d => yScale(d[1]))
                        .attr("r", .75);
                }
                let line = svg.append('g')
                    .attr('clip-path', `url(#clip-${id})`)
                    .append('path')
                        .datum(trace.data[j]) // For every point...
                        .attr('class', 'line')
                        .attr('fill', 'none')
                        .attr('stroke', trace.trace_color)
                        .attr('stroke-width', 1.5)
                        .attr('d', d3.line()
                            .x((d) => xScale(d[0]))
                            .y((d) => yScale(d[1]))
                        );
                lines.push(line);
            }
            this.line.push(lines);
        }

        const brush = d3.brush()
            .extent([[0, 0],[dataWidth, dataHeight]]);
            // .on('end', zoomChart);
        
        var zoom_brush = svg.append('g')
            .attr('clip-path', `url(#clip-${id})`)
            .append('g')
            .attr('class', 'brush')
            .call(brush);

        let zoomChart = async (e) => {
            // the selected boundries
            let extent = e.selection;
            
            if (!extent) {
                return;
                // brush.end seems to be called on `call(brush.move, null)`
                // Setting the domains here will clear zooming.
            } else {
                zoom_brush.call(brush.move, null);

                let bounds = new Bounds(
                    xScale.invert(extent[0][0]),
                    xScale.invert(extent[1][0]),
                    yScale.invert(extent[1][1]),
                    yScale.invert(extent[0][1]),
                );

                // TODO: Prevent pushing duplicate vieports
                this.panel.pushZoom(bounds);
                await this.panel.update();
                this.panel.render();

                // let viewport = this.panel.viewport();

                // xScale.domain([viewport.xMin, viewport.xMax]);
                // yScale.domain([viewport.yMin, viewport.yMax]);
                
            }

            // xAxis.transition().call(d3.axisBottom(xScale));
            // yAxis.transition().call(d3.axisLeft(yScale));

            // svg.selectAll('circle')
            //     .attr('cx', function(d) { return xScale(d[0])})
            //     .attr('cy', function(d) { return yScale(d[1])})
            //     .transition();

            // for (var i = 0; i < this.panel.traces.length; ++i) {
            //     for (var j = 0; j < this.panel.traces[i].data.length; ++j) {
            //         if (this.panel.traces[i].data[j].length != 1) {
            //             this.line[i][j]
            //                 .transition()
            //                 .attr('d', d3.line()
            //                     .x(function (d) { return xScale(d[0])} )
            //                     .y(function (d) { return yScale(d[1])} )
            //                 );
            //         }
            //     }
            // }
        }

        svg.on("dblclick", async () => {
            zoom_brush.call(brush.move, null);

            this.panel.popZoom();
            await this.panel.update();
            this.panel.render();

            // let viewport = this.panel.viewport();

            // xScale.domain([ viewport.xMin, viewport.xMax ])
            // yScale.domain([ viewport.yMin, viewport.yMax ])
            // xAxis.transition().call(d3.axisBottom(xScale));
            // yAxis.transition().call(d3.axisLeft(yScale));

            // svg.selectAll('circle')
            //     .attr('cx', function(d) { return xScale(d[0])})
            //     .attr('cy', function(d) { return yScale(d[1])})
            //     .transition();

            // for (var i = 0; i < this.panel.traces.length; ++i) {
            //     for (var j = 0; j < this.panel.traces[i].data.length; ++j) {
            //         if (this.panel.traces[i].data[j].length != 1) {
            //             this.line[i][j]
            //                 .transition()
            //                 .attr('d', d3.line()
            //                     .x(function (d) { return xScale(d[0])} )
            //                     .y(function (d) { return yScale(d[1])} )
            //                 );
            //         }
            //     }
            // }

        });

        brush.on('end', zoomChart);
    }
}

export class CanvasRenderer extends Renderer
{
    render()
    {
        this.element.innerHTML = '';

        let plotRect = this.element.getBoundingClientRect();
        
        let dataWidth = plotRect.width - this.margin.left - this.margin.right;
        let dataHeight = plotRect.height - this.margin.top - this.margin.bottom;

        let viewport = this.panel.viewport();
        if (viewport == null) {
            return;
        }

        let viewportWidth = (viewport.xMax - viewport.xMin);
        let viewportHeight = (viewport.yMax - viewport.yMin);

        let canvas = document.createElement('canvas');
        canvas.width = plotRect.width;
        canvas.height = plotRect.height;
        this.element.appendChild(canvas);

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
        for (var i = 0; i < this.panel.traces.length; ++i) {
            let trace = this.panel.traces[i];

            if (trace.trace_color == null) {
                // ctx.strokeStyle = 'white';
                ctx.strokeStyle = 'black';
            }
            else {
                ctx.strokeStyle = trace.trace_color;
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