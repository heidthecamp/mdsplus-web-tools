
import { Scope } from "./scope.js";
import { MDSplusTrace } from "./mdsplus-trace.js";
import { MDSplusPanel } from "./mdsplus-panel.js";

const GlobalDefaultMask = {
    update: (1 << 0),
    experiment: (1 << 7),
    shot: (1 << 8),
    default_node: (1 << 9),
    x: (1 << 10),
    y: (1 << 11),
    xmin: (1 << 12),
    xmax: (1 << 13),
    ymin: (1 << 14),
    ymax: (1 << 15),
    title: (1 << 16),
    event: (1 << 17),
};

export function importJSON(text)
{
    let valueOrNull = (object, key) => {
        return object.hasOwnProperty(key) ? object[key] : null;
    };

    let data = JSON.parse(text);
    if (data === null) {
        throw Error('Invalid JSON');
    }

    if (data.hasOwnProperty('global_defaults')) {
        for (const [key, value] of Object.entries(data['global_defaults'])) {
            Scope.defaults[key] = value;
        }
    }

    for (var i = 0; i < data['panels'].length; ++i) {
        let panel = data['panels'][i];

        let newPanel = Scope.addPanel(
            new MDSplusPanel(
                valueOrNull(panel, 'title_expr'),
                valueOrNull(panel, 'y_min_expr'),
                valueOrNull(panel, 'y_max_expr'),
                valueOrNull(panel, 'x_min_expr'),
                valueOrNull(panel, 'x_max_expr'),
            ),
            valueOrNull(panel, 'position'),
        );

        if (panel.hasOwnProperty('traces')) {
            for (var j = 0; j < panel['traces'].length; ++j) {
                let trace = panel['traces'][j];

                newPanel.addTrace(
                    new MDSplusTrace(
                        valueOrNull(trace, 'tree'),
                        valueOrNull(trace, 'shot_expr'),
                        valueOrNull(trace, 'default_node_expr'),
                        valueOrNull(trace, 'y_expr'),
                        valueOrNull(trace, 'x_expr'),
                        valueOrNull(trace, 'type'),
                        valueOrNull(trace, 'color'),
                        valueOrNull(trace, 'marker'),
                    )
                );
            }
        }
    }

    if (data.hasOwnProperty('title_expr')) {
        Scope.setTitle(data['title_expr']);
    }
    if (data.hasOwnProperty('resample')) {
        Scope.resample = data['resample'];
    }
}

export async function importFile(file)
{
    if (!file.name.endsWith("dat") && !file.name.endsWith("jscp") && !file.name.endsWith("json")) {
        console.error("Unsupported file type")
    }

    let panels = [];

    const reader = new FileReader();


    // TODO: Add a confirmation
    reader.onload = async () => {
        Scope.reset();

        if (file.name.endsWith('json')) {
            importJSON(reader.result);
        }
        else {
            let data = {
                title: '',
                columns: 1,
                global: {
                    experiment: null,
                    shot: null,
                    default_node: null,
                    title: null,
                    y: null,
                    x: null,
                    xmin: null,
                    xmax: null,
                    ymin: null,
                    ymax: null,
                },
                plots: [],
            };

            let rowsInColumn = [];
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
                    rowsInColumn.push(parseInt(value));
                }
                else if (key.startsWith('plot_')) {
                    var [plotIndex, plotKey] = key.split('.', 2);
                    var [_, rowString, colString] = plotIndex.split('_', 3);
                    let row = parseInt(rowString) - 1;
                    let col = parseInt(colString) - 1;

                    var offset = rowsInColumn.slice(0, col).reduce((sum, x) => sum + x, 0);
                    var index = offset + row;

                    while (data['plots'].length <= index) {
                        data['plots'].push({
                            experiment: null,
                            shot: null,
                            default_node: null,
                            title: null,
                            y: null,
                            x: null,
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
                        case 'shot':
                            data['plots'][index]['shot'] = value;
                            break;
                        case 'y':
                            data['plots'][index]['y'] = fixNewlines(value);
                            break;
                        case 'x':
                            data['plots'][index]['x'] = fixNewlines(value);
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
                            data['plots'][index]['title'] = fixNewlines(value);
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
                        case 'global_1_1.experiment':
                            data['global']['experiment'] = value;
                            break;
                        case 'global_1_1.shot':
                            data['global']['shot'] = value;
                            break;
                        case 'global_1_1.default_node':
                            data['global']['default_node'] = value;
                            break;
                        case 'global_1_1.title':
                            data['global']['title'] = value;
                            break;
                        case 'global_1_1.y':
                            data['global']['y'] = value;
                            break;
                        case 'global_1_1.x':
                            data['global']['x'] = value;
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
            
            Scope.defaults.tree = data['global']['experiment'];
            Scope.defaults.shot_expr = data['global']['shot'];
            Scope.defaults.default_node_expr = data['global']['default_node'];
            Scope.defaults.title_expr = data['global']['title'];
            Scope.defaults.y_expr = data['global']['y'];
            Scope.defaults.x_expr = data['global']['x'];
            Scope.defaults.x_min_expr = data['global']['xmin'];
            Scope.defaults.x_max_expr = data['global']['xmax'];
            Scope.defaults.y_min_expr = data['global']['ymin'];
            Scope.defaults.y_max_expr = data['global']['ymax'];

            let columnWidth = Math.floor(Math.max(1, 12 / data['columns']));

            let row = 0;
            let column = 0;
            
            for (var i = 0; i < data['plots'].length; ++i) {
                let plot = data['plots'][i];
                let mask = plot.global_defaults;

                let rowHeight = Math.ceil(Math.max(1, 16 / rowsInColumn[column]) * 2);

                // if (((mask & GlobalDefaultMask.update) > 0)) {
                //     plot.update = null;
                // }

                if (((mask & GlobalDefaultMask.xmin) > 0)) {
                    plot.x_min = null;
                }
                else if (plot.x_min === null) {
                    plot.x_min = '';
                }

                if (((mask & GlobalDefaultMask.xmax) > 0)) {
                    plot.x_max = null;
                }
                else if (plot.x_max === null) {
                    plot.x_max = '';
                }

                if (((mask & GlobalDefaultMask.ymin) > 0)) {
                    plot.y_min = null;
                }
                else if (plot.y_min === null) {
                    plot.y_min = '';
                }

                if (((mask & GlobalDefaultMask.ymax) > 0)) {
                    plot.y_max = null;
                }
                else if (plot.y_max === null) {
                    plot.y_max = '';
                }

                if (((mask & GlobalDefaultMask.title) > 0)) {
                    plot.title = null;
                }
                else if (plot.title === null) {
                    plot.title = '';
                }

                // if (((mask & GlobalDefaultMask.event) > 0)) {
                //     plot.event = null;
                // }
                
                // TODO: Take the title from the first trace that has one
                // TODO: Use plot.row, plot.col to set _ROW and _COL
                let panel = Scope.addPanel(
                    new MDSplusPanel(
                        plot.title,
                        plot.ymin,
                        plot.ymax,
                        plot.xmin,
                        plot.xmax,
                    ),
                    {
                        x: column * columnWidth,
                        y: row * rowHeight,
                        width: columnWidth,
                        height: rowHeight,
                    },
                );

                if (((mask & GlobalDefaultMask.experiment) > 0)) {
                    plot.experiment = null;
                }
                else if (plot.experiment === null) {
                    plot.experiment = '';
                }

                if (((mask & GlobalDefaultMask.shot) > 0)) {
                    plot.shot = null;
                }
                else if (plot.shot === null) {
                    plot.shot = '';
                }

                if (((mask & GlobalDefaultMask.default_node) > 0)) {
                    plot.default_node = null;
                }
                else if (plot.default_node === null) {
                    plot.default_node = '';
                }

                if (((mask & GlobalDefaultMask.x) > 0)) {
                    plot.x = null;
                }
                else if (plot.x === null) {
                    plot.x = '';
                }

                if (((mask & GlobalDefaultMask.y) > 0)) {
                    plot.y = null;
                }
                else if (plot.y === null) {
                    plot.y = '';
                }

                // TODO: Support jScope multi-plot format
                panel.addTrace(new MDSplusTrace(
                    plot.experiment,
                    plot.shot,
                    plot.default_node,
                    plot.y,
                    plot.x,
                ));
                panels.push(panel);

                ++row;
                if (row >= rowsInColumn[column]) {
                    row = 0;
                    ++column;
                }
            }

            await Scope.setTitle(data['title']);
        }

        Scope.refresh();
    };

    reader.onerror = () => {
        console.error('Failed to read file', file.name);
    };

    reader.readAsText(file);
    return panels;
};