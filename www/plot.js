import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { symbol, symbolDiamond } from 'https://esm.sh/d3-shape';
import * as shape from 'https://esm.sh/d3-shape';
import * as c from "./connection.js";

export async function update(
    // TODO: only x_expr can be null.
    id = "",
    tree = null,
    shot = null,
    default_node = null,
    title = null,
    y_expr = null,
    x_expr = null,
    line_type = "line",
    line_color="steelblue",
    point_type="circle",
    point_color="red"
){
    let u_data;

    if (x_expr == null || x_expr.trim() == '') {
        x_expr = `dim_of(${y_expr})`;
    }

    if (!default_node) {
        default_node = '\\TOP';
    }
    
    let y_data;
    let x_data;

    await c.get_request({
        'open': `TreeOpen("${tree}",${shot})`,
        'title': title,
        'set_default': `TreeSetDefault("${default_node.replace('\\', '\\\\')}")`,
        'y': y_expr,
        'x': x_expr
    })
    .then(response => {

        if( !response || !response.open ) {
            return;
        }
        else if (response.open.hasOwnProperty('error')) {
            // Error Message
            // alert(response.open.error);
            console.error(response.open.error);
        }
        else {
            let status = response.open.value;
            if ((status & 1) == 0) {
                // Error Status Code
                // alert(response);
                console.error(response);
            }
        }

        if (response.hasOwnProperty('title')) {
            if (response.title.hasOwnProperty('error')) {
                console.error('Title: ' + response.title.error);
                return;
            }
            
            document.getElementById(`title-${id}`).innerText = response.title.value;
        }

        if (response.hasOwnProperty('y')) {
            if (response.y.hasOwnProperty('error')) {
                // alert('Y: ' + response.y.error);
                console.error('Y: ' + response.y.error);
                return;
            }

            y_data = response.y.value;
        }

        if (response.hasOwnProperty('x')) {
            if (response.x.hasOwnProperty('error')) {
                // alert('X: ' + response.x.error);
                console.error('X: ' + response.x.error);
                return;
            }

            x_data = response.x.value;
        }

        u_data = [];
        
        if (!x_data  || !y_data) {
            console.warn('X or Y have not been set yet');
            console.info(`X: ${x_data}\nY:${y_data}`);
        } else if (x_data.length === y_data.length) {
            for (let i = 0; i < x_data.length; i++) {
                u_data.push({"x_data": x_data[i], "y_data": y_data[i]});
            }
        } else {
            console.error()
        }
    });

    let y_max = y_data[0];
    let y_min = y_data[0];
    let x_max = x_data[0];
    let x_min = x_data[0];
    for (let i = 0; i < y_data.length; ++i) {
        if (y_data[i] > y_max) {
            y_max = y_data[i];
        }
        if (y_data[i] < y_min) {
            y_min = y_data[i];
        }
        if (x_data[i] > x_max) {
            x_max = x_data[i];
        }
        if (x_data[i] < x_min) {
            x_min = x_data[i];
        }
    }

    var margin = {top: 10, right: 30, bottom: 30, left: 60},
        width = 500 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;

    
    const svg = d3.select(`#container${id === "" ? "" : "-" + id}`)
    .html(null)
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform",
            `translate(${margin.left}, ${margin.top})`
        );

    // Add the x-axis.
    const x = d3.scaleLinear()
        .domain([x_data[0], x_data[x_data.length - 1]])
        .range([0, width]);
    let xAxis = svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    let y_padding = (y_max - y_min) / 100;
    // Add the y-axis.
    const y = d3.scaleLinear()
        // .domain([Math.floor(y_min), Math.ceil(y_max)])
        .domain([(y_min - y_padding), (y_max + y_padding)])
        .range([height, 0]);
    let yAxis = svg.append("g")
        .call(d3.axisLeft(y));
    
    var clip = svg.append("defs").append("SVG:clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("width", width )
        .attr("height", height )
        .attr("x", 0)
        .attr("y", 0);

    // var brush = d3.brush()
    //     .extent([[0,0], [width,height]])
    //     .on("end", zoomChart)
    
    // var zoom_brush = svg.append("g")
    //     .attr("clip-path", "url(#clip)")
    //     .append("g")
    //     .attr("class", "brush")
    //     .call(brush);
        

    var line = svg.append("g")
    .attr("clip-path", "url(#clip)")
    // Handle line attributes here
    // .attr("class", "dashed")
    
    switch (line_type){
        case "line":
            line.append("path")
                .datum(u_data)
                .attr("class", "line")
                .attr("fill", "none")
                .attr("stroke", line_color)
                .attr("stroke-width", 1.5)
                .attr("d", d3.line()
                    .x(function(d) { return x(d.x_data) })
                    .y(function(d) { return y(d.y_data) })
        )
            break;
        case "step_after":
            line.append("path")
                .datum(u_data)
                .attr("class", "line")
                .attr("fill", "none")
                .attr("stroke", line_color)
                .attr("stroke-width", 1.5)
                .attr("d", d3.line()
                    .curve(d3.curveStepAfter)
                    .x(function(d) { return x(d.x_data) })
                    .y(function(d) { return y(d.y_data) })
                )
            break;
        default:
            break;

    }

    // line.append("g")
    //     .attr("class", "brush")
    //     .call(brush);

    // const points = svg.append("g")
    //     .attr("stroke-width", 1)
    //     .attr("font-family", "sans-serif")
    //     .attr("font-size", 10)
    //     .selectAll("path")
    //     .data(u_data)
    //     .join("path")
    //     .attr("fill", "red")
    //     .attr(
    //         "transform",
    //         d => `translate(${x(d.x_data)}, ${y(d.y_data)})`
    //     )
    //     .attr("d", symbol().type(symbolDiamond))

    var idleTimeout
    function idled() { idleTimeout = null; }

    // A function that update the chart for given boundaries
    function zoomChart(e) {

        // What are the selected boundaries?
        let extent = e.selection;

        // If no selection, back to initial coordinate. Otherwise, update X axis domain
        if(!extent){
            if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
            x.domain([ x_min, x_max ]);
            y.domain([ y_min, y_max ]);
        } else {
            x.domain([ x.invert(extent[0][0]), x.invert(extent[1][0]) ]);
            y.domain([ y.invert(extent[1][1]), y.invert(extent[0][1]) ]);
            zoom_brush.select(".brush").call(brush.move, null); // This remove the grey brush area as soon as the selection has been done
        }

        // Update axis and line position
        xAxis.transition().duration(500).call(d3.axisBottom(x));
        yAxis.transition().duration(500).call(d3.axisLeft(y));
        line
            .select('.line')
            .transition()
            .attr("d", d3.line()
                .curve(d3.curveStepAfter)
                .x(function(d) { return x(d.x_data) })
                .y(function(d) { return y(d.y_data) })
            );

        transform = d3.ZoomTransform(k, x, y);

        // points.selectAll("path")
        //     // .transition()
        //     .attr(
        //         "transform",
        //         d => `translate(${transform.rescaleX(d.x_data)}, ${transform.rescaleY(d.y_data)})`
        //     )
            // .attr("d", symbol().type(symbolDiamond));
    }

    // If user double click, reinitialize the chart
    svg.on("dblclick",function(){
        x.domain(d3.extent(u_data, function(d) { return d.x_data }));
        y.domain(d3.extent(u_data, function(d) { return d.y_data }));
        xAxis.transition().call(d3.axisBottom(x))
        line
            .select('.line')
            .transition()
            .attr("d", d3.line()
            .x(function(d) { return x(d.x_data) })
            .y(function(d) { return y(d.y_data) })
        )
        // points
        //     .selectAll("path")
        //     .transition()
        //     .attr(
        //         "transform",
        //         d => `translate(${x(d.x_data)}, ${y(d.y_data)})`
        //     );
        // zoom_brush.select(".brush").call(brush.move, null);
    });
}
