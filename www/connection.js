let ws = null;
let requests = [];

export async function connect() {
    let host = window.location.host;
    if (window.location.protocol == 'https:') {
        host = 'wss://' + host + '/ws';
    }
    else {
        // For local development
        host = 'ws://' + host.split(':', 1) + ':8123';
    }

    let promise = new Promise((resolve, reject) => {
        ws = new WebSocket(host);

        ws.onopen = (e) => {
            resolve(e);
        };

        ws.onclose = (e) => {
            console.log('Socket is closed and will attempt to reconnect in 1 second', e.reason);
            setTimeout(connect, 1000);
        };

        ws.onmessage = (e) => {
            if (requests.length > 0) {
                // HACK: Fix the server and remove this
                let data = e.data.replaceAll('NaN', '0');
                let response = JSON.parse(data);
                let request = requests.shift();
                console.log(request.request);
                request.resolve(response, e);
            }
        };

        ws.onerror = (e) => {
            console.error('Socket encountered an error, closing', e.message);
            ws.close();

            reject(e);
        }
    });

    return promise;
}

// TODO: Ensure request objects are in-order, maybe switch to lists from dictionaries
export async function getMany(request) {
    if (ws === undefined) {
        return false;
    }

    let promise = new Promise(
        (resolve, reject) => {
            requests.push({
                'request': request, // TODO: Remove
                'resolve': resolve,
                'reject': reject,
            });

            ws.send(JSON.stringify(request));
        }
    );

    return promise;
}