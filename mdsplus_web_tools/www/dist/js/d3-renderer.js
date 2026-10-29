
import { Bounds } from "./bounds.js";
import { Renderer } from "./renderer.js";

// HACK:
let NextId = 1;

export class D3Renderer extends Renderer
{
    render(traces)
    {
        let plotRect = this.element.getBoundingClientRect();
        this.element.innerHTML = ''; // Before?

        if ((plotRect.width + plotRect.height) == 0) {
            return;
        }

        if (traces.length == 0) {
            return;
        }

        // HACK: ?
        let viewport = traces[0].viewport();
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
        for (var i = 0; i < traces.length; ++i) {
            let trace = traces[i];

            let lines = [];

            // For every line...
            for (var j = 0; j < trace.data.length; ++j) {
                let line = svg.append('g')
                    .attr('fill', 'none')
                    .attr('stroke', trace.color)
                    .attr('stroke-width', 1.5)
                    .attr('class', 'data-line')
                    .attr('clip-path', `url(#clip-${id})`);

                if (trace.data[j].length == 1) {
                    line.append('circle')
                        .attr('r', .75)
                        .data(trace.data[j]) // For a single point...
                        .attr('cx', d => xScale(d[0]))
                        .attr('cy', d => yScale(d[1]));
                }
                else {
                    line.append('path')
                        .datum(trace.data[j]) // For every point...
                        .attr('d', d3.line()
                            .x((d) => xScale(d[0]))
                            .y((d) => yScale(d[1]))
                        );
                }

                lines.push(line);
            }
            this.line.push(lines);
        }

        if (this.onZoomIn) {
            const brush = d3.brush()
                .extent([[0, 0],[dataWidth, dataHeight]]);
                // .on('end', zoomChart);
            
                var zoomBrush = svg.append('g')
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
                        zoomBrush.call(brush.move, null);

                    if (this.onZoomIn !== null) {
                        let bounds = new Bounds(
                            xScale.invert(extent[0][0]),
                            xScale.invert(extent[1][0]),
                            yScale.invert(extent[1][1]),
                            yScale.invert(extent[0][1]),
                        );

                        this.onZoomIn(bounds);
                    }

                }

                // svg.selectAll('circle')
                //     .attr('cx', function(d) { return xScale(d[0])})
                //     .attr('cy', function(d) { return yScale(d[1])})
                //     .transition();

                // for (var i = 0; i < traces.length; ++i) {
                //     for (var j = 0; j < traces[i].data.length; ++j) {
                //         if (traces[i].data[j].length != 1) {
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

                svg.on('dblclick', async () => {
                    zoomBrush.call(brush.move, null);

                if (this.onZoomOut !== null) {
                    this.onZoomOut();
                }

                // svg.selectAll('circle')
                //     .attr('cx', function(d) { return xScale(d[0])})
                //     .attr('cy', function(d) { return yScale(d[1])})
                //     .transition();

                // for (var i = 0; i < traces.length; ++i) {
                //     for (var j = 0; j < traces[i].data.length; ++j) {
                //         if (traces[i].data[j].length != 1) {
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
}
