
export class Connection
{
    static current = new Connection();

    constructor() {
        this.ws = null;
        this.open = false;
        this.requests = [];
        this.response = null;
        this.promise = null;

        this.connect();
    }

    connect() {
        let host = window.location.host;
        if (window.location.protocol == 'https:') {
            host = 'wss://' + host + '/ws';
        }
        else {
            // For local development
            host = 'ws://' + host.split(':', 1) + ':8123';
        }

        this.promise = new Promise(
            (resolve, reject) => {
                this.ws = new WebSocket(host);
                this.ws.binaryType = 'arraybuffer';

                this.ws.onopen = (e) => {
                    this.open = true;
                    resolve();
                }

                this.ws.onclose = (e) => {
                    this.open = false;
                    this.response = null;

                    // TODO: Implement backoff and exponential wait
                    console.warn('Socket is closed and will attempt to reconnect in 1 second', e.reason);
                    setTimeout(this.connect, 1000);
                }

                this.ws.onerror = (e) => {
                    console.error('Socket encountered an error, closing', e.message);
                    this.ws.close();

                    reject();
                }

                this.ws.onmessage = (e) => {
                    this.handleMessage(e.data);
                }
            }
        )

        return this.promise;
    }

    ready() {
        return this.promise;
    }

    handleMessage(data) {
        if (this.requests.length > 0) {
            if (this.response == null) {
                // TODO: Possibly remove?
                // data = data.replaceAll('NaN', '0');
                this.response = JSON.parse(data);

                // TODO: Improve
                if (this.response.hasOwnProperty('error')) {
                    console.error(this.response.error);
                    let request = this.requests.shift();
                    request.reject(this.response.error);
                    return;
                }

                let outstanding = 0;
                for (const [key, value] of Object.entries(this.response)) {
                    if (!!value.value && Object.getPrototypeOf(value.value) === Object.prototype) {
                        ++outstanding;
                    }
                }

                // No outstanding data messages, resolve immediately
                if (outstanding == 0) {
                    let request = this.requests.shift();
                    request.resolve(this.response);
                    this.response = null;
                }
            }
            else {
                // Handle one outstanding data message
                let outstanding = 0;
                for (const [key, value] of Object.entries(this.response)) {
                    if (!!value.value && Object.getPrototypeOf(value.value) === Object.prototype) {
                        if (data == null) {
                            ++outstanding;
                        }
                        else {
                            switch (value.value.type) {
                            case 'int8':
                                this.response[key].value = new Int8Array(data);
                                break;
                            case 'int16':
                                this.response[key].value = new Int16Array(data);
                                break;
                            case 'int32':
                                this.response[key].value = new Int32Array(data);
                                break;
                            // case 'int64':
                            //     this.response[key].value = new BigInt64Array(data);
                            //     break;
                            case 'uint8':
                                this.response[key].value = new Uint8Array(data);
                                break;
                            case 'uint16':
                                this.response[key].value = new Uint16Array(data);
                                break;
                            case 'uint32':
                                this.response[key].value = new Uint32Array(data);
                                break;
                            // case 'uint64':
                            //     this.response[key].value = new BigUint64Array(data);
                            //     break;
                            case 'float32':
                                this.response[key].value = new Float32Array(data);
                                break;
                            case 'float64':
                                this.response[key].value = new Float64Array(data);
                                break;
                            }

                            data = null;
                        }
                    }
                }

                // If all outstanding data messages are received, then resolve
                if (outstanding == 0) {
                    let request = this.requests.shift();
                    request.resolve(this.response);
                    this.response = null;
                }
            }
        }
    }

    async getMany(request) {
        if (this.ws === undefined) {
            return false;
        }

        let promise = new Promise(
            async (resolve, reject) => {
                this.requests.push({
                    'request': request, // TODO: Remove
                    'resolve': resolve,
                    'reject': reject,
                });

                await this.ready();
                this.ws.send(JSON.stringify(request));
            }
        );

        return promise;
    }
}
