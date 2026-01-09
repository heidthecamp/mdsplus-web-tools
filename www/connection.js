let ws = null;
let requests = [];
let response = null;

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
        ws.binaryType = 'arraybuffer';

        ws.onopen = (e) => {
            resolve(e);
        };

        ws.onclose = (e) => {
            // TODO: Implement backoff and exponential wait
            console.warn('Socket is closed and will attempt to reconnect in 1 second', e.reason);
            setTimeout(connect, 1000);
        };

        ws.onmessage = (e) => {
            if (requests.length > 0) {
                if (response == null) {
                    // TODO: Possibly remove?
                    let data = e.data.replaceAll('NaN', '0');
                    response = JSON.parse(data);

                    // TODO: Improve
                    if (response.hasOwnProperty('error')) {
                        console.error(response.error);
                        let request = requests.shift();
                        request.reject(response.error);
                        return;
                    }

                    let outstanding = 0;
                    for (const [key, value] of Object.entries(response)) {
                        if (Object.getPrototypeOf(value.value) === Object.prototype) {
                            ++outstanding;
                        }
                    }

                    // No outstanding data messages, resolve immediately
                    if (outstanding == 0) {
                        let request = requests.shift();
                        request.resolve(response, e);
                        response = null;
                    }
                }
                else {
                    let data = e.data;

                    // Handle one outstanding data message
                    let outstanding = 0;
                    for (const [key, value] of Object.entries(response)) {
                        if (Object.getPrototypeOf(value.value) === Object.prototype) {
                            if (data == null) {
                                ++outstanding;
                            }
                            else {
                                switch (value.value.type) {
                                case 'int8':
                                    response[key].value = new Int8Array(data);
                                    break;
                                case 'int16':
                                    response[key].value = new Int16Array(data);
                                    break;
                                case 'int32':
                                    response[key].value = new Int32Array(data);
                                    break;
                                case 'int64':
                                    response[key].value = new Int64Array(data);
                                    break;
                                case 'uint8':
                                    response[key].value = new Uint8Array(data);
                                    break;
                                case 'uint16':
                                    response[key].value = new Uint16Array(data);
                                    break;
                                case 'uint32':
                                    response[key].value = new Uint32Array(data);
                                    break;
                                case 'uint64':
                                    response[key].value = new Uint64Array(data);
                                    break;
                                case 'float32':
                                    response[key].value = new Float32Array(data);
                                    break;
                                case 'float64':
                                    response[key].value = new Float64Array(data);
                                    break;
                                }

                                data = null;
                            }
                        }
                    }

                    // If all outstanding data messages are received, then resolve
                    if (outstanding == 0) {
                        let request = requests.shift();
                        request.resolve(response, e);
                        response = null;
                    }
                }
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
window.getMany = getMany;