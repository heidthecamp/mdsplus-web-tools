// import update from "./scope.js";

let ws = null;
let requests = [];

function establish_connection(cb ) {
    let host = window.location.host;
    if (window.location.protocol == 'https:') {
        host = 'wss://' + host + '/ws';
    }
    else {
        host = 'ws://' + host.split(':', 1) + ':8123';// TODO: Parameterize
    }
    ws = new WebSocket(host);

    // TODO: Implement
    ws.onopen = e => {  }
    ws.onclose = e => {
        console.log("Socket is closed and will attempt to reconnect in" 
            + " 1 second.", e.reason);
        setTimeout(
            () => establish_connection(),
            1000
        );
    }
    ws.onmessage = e => {
        if (requests.length > 0) {
            let response = JSON.parse(e.data);
            let request = requests.shift();
            console.log(request.request);
            request.resolve(response, e)
        }
    }
    ws.onerror = e => {
        console.error("Soccet encountered an error: ", e.message, "\nClosing soccket");
        ws.close();
    }

    // ws.onerror = e => {
    //     ws.onmessage = null;
    //     ws.onerror = null;
    //     console.error(e);
    //     reject(e);
    // }

    return ws;
}

async function get_request(request)
{
    if (ws === undefined) {
        return false;
    }

    let promise = new Promise((resolve, reject) => {
        requests.push({
            'request': request, // TODO: Remove
            'resolve': resolve,
            'reject': reject,
        });

        ws.send(JSON.stringify(request));
    });

    return promise;
}

export {establish_connection, get_request };