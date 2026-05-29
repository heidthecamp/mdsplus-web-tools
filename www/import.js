
import { Panel } from "./panel.js";
import { Scope } from "./scope.js";
import { GlobalDefaults } from "./defaults.js";

export async function importFile(file) {
    if (!file.name.endsWith("dat") && !file.name.endsWith("jscp")) {
        console.error("Unsupported file type")
    }

    let panels = [];

    const reader = new FileReader();

    // TODO: Add a confirmation
    reader.onload = async () => {
        let data = {
            title: '',
            columns: 1,
            global: {
                experiment: null,
                shot: null,
                default_node: null,
                title: null,
                y_expr: null,
                x_expr: null,
            },
            plots: [],
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
                var [_, rowString, colString] = plotIndex.split('_', 3);
                let row = parseInt(rowString) - 1;
                let col = parseInt(colString) - 1;

                var offset = rows_in_column.slice(0, col).reduce((sum, x) => sum + x, 0);
                var index = offset + row;

                while (data['plots'].length <= index) {
                    data['plots'].push({
                        experiment: null,
                        shot: null,
                        default_node: null,
                        title_expr: null,
                        y_expr: null,
                        x_expr: null,
                        row: null,
                        col: null,
                    });
                }

                data['plots'][index]['row'] = row;
                data['plots'][index]['col'] = col;

                let fixNewlines = (value) => {
                    // TODO: Add support for textareas and uncomment this
                    // return value.replaceAll('|||', '\n');
                    return value.replaceAll('|||', '');
                }

                switch (plotKey) {
                    case 'height':
                        data['plots'][index]['height'] = parseInt(value);
                        break;
                    case 'experiment':
                        data['plots'][index]['experiment'] = value;
                        break;
                    case 'y':
                        data['plots'][index]['y_expr'] = fixNewlines(value);
                        break;
                    case 'x':
                        data['plots'][index]['x_expr'] = fixNewlines(value);
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
                        data['plots'][index]['event'] = fixNewlines(value);
                        break;
                    case 'title':
                        data['plots'][index]['title_expr'] = fixNewlines(value);
                        break;
                    case 'label':
                        data['plots'][index]['label'] = fixNewlines(value);
                        break;
                    case 'global_defaults':
                        data['plots'][index]['global_defaults'] = parseInt(value);
                        break;
                    default:
                        console.info(`Ignoring ${key}`)
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
                        data['title_expr'] = value;
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
                    case 'global_1_1.experiment':
                        data['global']['experiment'] = value;
                        break;
                    case 'global_1_1.shot':
                        data['global']['shot'] = value;
                        break;
                    case 'global_1_1.xmin':
                        data['global']['xmin'] = value;
                        break;
                    case 'global_1_1.xmax':
                        data['global']['xmax'] = value;
                        break;
                    case 'global_1_1.ymin':
                        data['global']['ymin'] = value;
                        break;
                    case 'global_1_1.ymax':
                        data['global']['ymax'] = value;
                        break;
                    case 'global_1_1.global_defaults':
                        data['global']['global_defaults'] = parseInt(value);
                        break;
                    default:
                        console.info(`Ignoring ${key}`)
                }
            }
        }
        
        Scope.defaults.tree = data['global'].experiment;
        Scope.defaults.shot = data['global'].shot;
        Scope.defaults.default_node = data['global'].default_node;
        Scope.defaults.title_expr = data['global'].title_expr;
        Scope.defaults.y_expr = data['global'].y_expr;
        Scope.defaults.x_expr = data['global'].x_expr;
        Scope.defaults.x_min = data['global'].xmin;
        Scope.defaults.x_max = data['global'].xmax;
        Scope.defaults.y_min = data['global'].ymin;
        Scope.defaults.y_max = data['global'].ymax;

        let columnWidth = Math.floor(Math.max(1, 12 / data['columns']));

        let row = 0;
        let column = 0;
        
        for (var i = 0; i < data['plots'].length; ++i) {
            let plot = data['plots'][i];

            let rowHeight = Math.ceil(Math.max(1, 16 / rows_in_column[column]) * 2);
            
            // TODO: Take the title from the first trace that has one
            let title = data['plots'][i].title_expr;
            // TODO: Use plot.row, plot.col to set _ROW and _COL
            let panel = Scope.addPanel(
                title,
                {
                    x: column * columnWidth,
                    y: row * rowHeight,
                    width: columnWidth,
                    height: rowHeight,
                },
                plot.y_min,
                plot.y_max,
                plot.x_min,
                plot.x_max,
                false,
                plot.global_defaults
            );

            panel.addTrace(
                plot.experiment,
                plot.shot,
                plot.default_node,
                plot.y_expr,
                plot.x_expr,
            );
            panels.push(panel);
            panel.update();

            ++row;
            if (row >= rows_in_column[column]) {
                row = 0;
                ++column;
            }
        }

        Scope.setTitle(data['title_expr']);
    };

    reader.onerror = () => {
        console.error('Failed to read file', file.name);
    };

    reader.readAsText(file);
    return panels;
};