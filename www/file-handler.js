
let data = {
    "title": '',
    "columns": 1,
    "global": { },
    "plots": [],
};

import Panel from "./panel.js";

// Drag and drop and select file.
export async function dropHandler(ev) {

    console.log("File(s) dropped");

    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();

    const file = ev.dataTransfer.items[0].getAsFile();


    if (!file.name.endsWith("dat") && !file.name.endsWith("jscp")) {
        console.error("Unsupported file type")
    }

    const reader = new FileReader();
    reader.onload = async () => {
        let rows_in_column = [];
        var lines = reader.result.split('\n');
        lines.forEach((line) => {
            line = line.trim();
            if (line.length == 0) {
                return;
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
                    data['plots'].push({});
                }

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
                    case 'global_1_1.global_defaults':
                        data['global']['global_defaults'] = parseInt(value);
                        break;
                    default:
                        console.log(`Ignoring ${key}`)
                }
            }
        })

        // TODO: Tim should probably improve this
        document.getElementById("table").innerHTML = '';

        for (var i = 0; i < data['plots'].length; ++i) {
            await Panel.add_panel(data['plots'][i]);
        }

    };
    reader.onerror = () => {
        console.error("Error reading the file. Please try again.", "error");
    };
    reader.readAsText(file);
}

export function dragOverHandler(ev) {
    // console.log("File(s) in drop zone");

    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();
}
