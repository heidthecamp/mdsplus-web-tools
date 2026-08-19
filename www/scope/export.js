
import { Scope } from "./scope.js";

export function exportJSON() {
    let clean = (object) => {
        let newObject = {};
        for (const [name, value] of Object.entries(object)) {
            if (value !== null) {
                newObject[name] = value;
            }
        }
        return newObject;
    };

    let data = {};

    data['title_expr'] = Scope.title_expr;
    data['global_defaults'] = clean({
        'tree': Scope.defaults.tree,
        'shot_expr': Scope.defaults.shot_expr,
        'default_node_expr': Scope.defaults.default_node_expr,
        'title_expr': Scope.defaults.title_expr,
        'y_expr': Scope.defaults.y_expr,
        'y_min_expr': Scope.defaults.y_min_expr,
        'y_max_expr': Scope.defaults.y_max_expr,
        'x_expr': Scope.defaults.x_expr,
        'x_min_expr': Scope.defaults.x_min_expr,
        'x_max_expr': Scope.defaults.x_max_expr,
        'trace_type': Scope.defaults.trace_type,
        'trace_color': Scope.defaults.trace_color,
        'point_type': Scope.defaults.point_type,
        'point_color': Scope.defaults.point_color,
    });

    data['panels'] = [];
    for (var i = 0; i < Scope.panels.length; ++i) {
        let panel = Scope.panels[i];

        let traces = [];
        for (var j = 0; j < panel.traces.length; ++j) {
            let trace = panel.traces[j];

            traces.push(clean({
                'tree': trace.tree,
                'shot_expr': trace.shot_expr,
                'default_node_expr': trace.default_node_expr,
                'y_expr': trace.y_expr,
                'x_expr': trace.x_expr,
                'trace_type': trace.trace_type,
                'trace_color': trace.trace_color,
                'point_type': trace.point_type,
                'point_color': trace.point_color,
            }));
        }

        data['panels'].push(clean({
            'title_expr': panel.title_expr,
            'position': panel.position(),
            'y_min_expr': panel.y_min_expr,
            'y_max_expr': panel.y_max_expr,
            'x_min_expr': panel.x_min_expr,
            'x_max_expr': panel.x_max_expr,
            'traces': traces,
        }));
    }

    return JSON.stringify(data);
}

export async function exportFile(type) {
    // TODO: Implement when the functionality is available
    // if (Window.showSaveFilePicker) {
    //     let fileInfo = await Window.showSaveFilePicker({
    //         types: [
    //             {
    //                 description: "Web Scope File",
    //                 accept: { "application/json": [ ".json" ] },
    //             },
    //             {
    //                 description: "dwscope File",
    //                 accept: { "text/plain": [ ".dat" ] },
    //             },
    //             {
    //                 description: "jScope File",
    //                 accept: { "text/plain": [ ".jscp" ] },
    //             },
    //         ]
    //     });

    //     console.log(fileInfo);
    //     return;
    // }

    let blob = null;

    if (type == 'dwscope') {
    }
    else if (type == 'jScope') {
    }
    else {
        blob = new Blob([exportJSON()], { type: 'application/json' });
    }

    if (blob != null) {
        var link = document.createElement('a');

        link.setAttribute('href', window.URL.createObjectURL(blob));
        link.setAttribute('download', 'scope.json');

        link.style.display = 'none';
        document.body.append(link);
        
        link.click();

        document.body.removeChild(link);
    }
};