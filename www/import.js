
import Panel from "./panel.js";
import Trace from "./trace.js";

export async function importFile(file) {
    if (!file.name.endsWith("dat") && !file.name.endsWith("jscp")) {
        console.error("Unsupported file type")
    }

    let panels = [];

    const reader = new FileReader();

    // TODO: Add a confirmation
    reader.onload = async () => {
        let data = {
            "title": '',
            "columns": 1,
            "global": {
                "experiment": null,
                "shot": null,
                "default_node": null,
                "title": null,
                "y": null,
                "x": null,
            },
            "plots": [],
        };

        let rows_in_column = [];
        var lines = reader.result.split('\n');

        for (var i = 0; i < lines.length; ++i) {
            let line = lines[i].trim();
            if (line.length == 0) {
                continue;
            }

            if (line.startsWith('Scope.')) {
                line = line.substring('Scope.'.length);
            }

            // Using maxsplit=2 still splits on all remaining :, but discards the extras
            var parts = line.split(':');
            var key = parts.shift();
            var value = parts.join(':');
            key = key.trim();
            value = value.trim();

            if (key.startsWith('rows_in_column_')) {
                // TODO: Parse the column index
                rows_in_column.push(parseInt(value));
            }
            else if (key.startsWith('plot_')) {
                var [plotIndex, plotKey] = key.split('.', 2);
                var [_, row, col] = plotIndex.split('_', 3);
                row = parseInt(row) - 1;
                col = parseInt(col) - 1;

                var offset = rows_in_column.slice(0, col).reduce((sum, x) => sum + x, 0);
                var index = offset + row;

                while (data['plots'].length <= index) {
                    data['plots'].push({
                        'experiment': null,
                        'shot': null,
                        'default_node': null,
                        'title': null,
                        'y': null,
                        'x': null,
                        'row': null,
                        'col': null,
                    });
                }

                data['plots'][index]['row'] = row;
                data['plots'][index]['col'] = col;

                switch (plotKey) {
                    case 'height':
                        data['plots'][index]['height'] = parseInt(value);
                        break;
                    case 'experiment':
                        data['plots'][index]['experiment'] = value;
                        break;
                    case 'y':
                        data['plots'][index]['y'] = value.replaceAll('|||', '\n'); // TODO: Make a wrapper function?
                        break;
                    case 'x':
                        data['plots'][index]['x'] = value.replaceAll('|||', '\n');
                        break;
                    case 'ymin':
                        data['plots'][index]['ymin'] = parseFloat(value);
                        break;
                    case 'ymax':
                        data['plots'][index]['ymax'] = parseFloat(value);
                        break;
                    case 'xmin':
                        data['plots'][index]['xmin'] = parseFloat(value);
                        break;
                    case 'xmax':
                        data['plots'][index]['xmax'] = parseFloat(value);
                        break;
                    case 'default_node':
                        data['plots'][index]['default_node'] = value;
                        break;
                    case 'event':
                        data['plots'][index]['event'] = value.replaceAll('|||', '\n');
                        break;
                    case 'title':
                        data['plots'][index]['title'] = value.replaceAll('|||', '\n');
                        break;
                    case 'label':
                        data['plots'][index]['label'] = value.replaceAll('|||', '\n');
                        break;
                    case 'global_defaults':
                        data['plots'][index]['global_defaults'] = parseInt(value);
                        break;
                    default:
                        console.log(`Ignoring ${key}`)
                }
            }
            else {
                switch (key) {
                    case 'geometry':
                        data['geometry'] = value.split(/x|\+/, 4).map((e) => {
                            return parseInt(e);
                        });
                        break;
                    case 'title':
                        window.title = value;
                        data['title'] = value;
                        break;
                    // case 'icon_name': break;
                    // case 'title_event': break;
                    // case 'print_file': break;
                    // case 'print_event': break;
                    // case 'print_portrait': break;
                    // case 'print_window_title': break;
                    // case 'printer': break;
                    // case 'font': break;
                    case 'columns':
                        data['columns'] = parseInt(value);
                        break;
                    case 'global_1_1.shot':
                        data['global']['shot'] = value;
                        break;
                    case 'global_1_1.xmin':
                        data['global']['xmin'] = parseFloat(value);
                        break;
                    case 'global_1_1.xmax':
                        data['global']['xmax'] = parseFloat(value);
                        break;
                    case 'global_1_1.ymin':
                        data['global']['ymin'] = parseFloat(value);
                        break;
                    case 'global_1_1.ymax':
                        data['global']['ymax'] = parseFloat(value);
                        break;
                    case 'global_1_1.global_defaults':
                        data['global']['global_defaults'] = parseInt(value);
                        break;
                    default:
                        console.log(`Ignoring ${key}`)
                }
            }
        }
        
        globalDefaults.tree = data['global'].experiment;
        globalDefaults.shot = data['global'].shot;
        globalDefaults.default_node = data['global'].default_node;
        globalDefaults.title_expr = data['global'].title;
        globalDefaults.y_expr = data['global'].y;
        globalDefaults.x_expr = data['global'].x;
        globalDefaults.x_min = data['global'].xmin;
        globalDefaults.x_max = data['global'].xmax;
        globalDefaults.y_min = data['global'].ymin;
        globalDefaults.y_max = data['global'].ymax;

        let $panels = document.getElementById('panels');
        console.log(rows_in_column);
        for (var i = 0; i < rows_in_column.length; ++i) {
            let $column = document.createElement('table');
            $column.id = `column-${i}`;

            for (var j = 0; j < rows_in_column[i]; ++j) {
                let $row = document.createElement('tr');
                $row.id = `row-${j}`;

                let $cell = document.createElement('td');
                $cell.id = `cell-${j}-${i}`;

                $row.appendChild($cell);
                $column.appendChild($row);
            }

            $panels.appendChild($column);
        }

        for (var i = 0; i < data['plots'].length; ++i) {
            let plot = data['plots'][i];
            
            let trace = new Trace(
                plot.experiment,
                plot.shot,
                plot.default_node,
                plot.y,
                plot.x,
                plot.global_defaults,
            );
            // TODO: Take the title from the first trace that has one
            let title = data['plots'][i].title;
            panels.push(new Panel(title, plot.row, plot.col, trace));
        }
    };

    reader.onerror = () => {
        console.error('Failed to read file', file.name);
    };

    reader.readAsText(file);
    return panels;
};