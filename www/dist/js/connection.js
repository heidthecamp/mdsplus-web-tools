
export class Response
{
    constructor(json) {
        try {
            this.data = JSON.parse(json);
            this.outstanding = [];

            // TODO: Improve
            for (const [key, value] of Object.entries(this.data)) {
                if (!!value.value && Object.getPrototypeOf(value.value) === Object.prototype) {
                    this.outstanding.push(key);
                }
            }
        }
        catch (e) {
            this.data = { error: e.message };
        }
    }

    checkForErrors() {
        if (this.data.hasOwnProperty('error')) {
            throw Error(this.data.error);
        }

        for (let key in this.data) {
            if (this.data[key].hasOwnProperty('error')) {
                // TODO: Custom error class?
                let error = Error(this.data[key].error);
                error.field = key;
                throw error;
            }
        }
    }

    hasError(name = null) {
        if (name === null) {
            return this.data.hasOwnProperty('error');
        }
        return this.data[name].hasOwnProperty('error');
    }

    getError(name = null) {
        if (name === null) {
            if (this.data.hasOwnProperty('error')) {
                return this.data.error;
            }
        }

        if (this.data[name].hasOwnProperty('error')) {
            return this.data[name].error;
        }

        return null;
    }

    hasValue(name) {
        return (this.data.hasOwnProperty(name) && this.data[name].hasOwnProperty('value'));
    }

    getValue(name) {
        return this.data[name].value;
    }
}

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
                this.response = new Response(data);

                if (this.response.hasError()) {
                    let request = this.requests.shift();
                    request.reject(this.response.getError());
                }
                else if (this.response.outstanding.length == 0) {
                    // No outstanding data messages, resolve immediately
                    let request = this.requests.shift();
                    request.resolve(this.response);
                    this.response = null;
                }
            }
            else {
                // Handle one outstanding data message
                let key = this.response.outstanding.shift();

                if (data === null) {
                    this.response.data[key].value = null;
                }
                else {
                    let info = this.response.data[key].value;

                    let array = null;
                    switch (info.type) {
                    case 'int8':
                        array = new Int8Array(data);
                        break;
                    case 'int16':
                        array = new Int16Array(data);
                        break;
                    case 'int32':
                        array = new Int32Array(data);
                        break;
                    // case 'int64':
                    // array = new BigInt64Array(data);
                    //     break;
                    case 'uint8':
                        array = new Uint8Array(data);
                        break;
                    case 'uint16':
                        array = new Uint16Array(data);
                        break;
                    case 'uint32':
                        array = new Uint32Array(data);
                        break;
                    // case 'uint64':
                    // array = new BigUint64Array(data);
                    //     break;
                    case 'float32':
                        array = new Float32Array(data);
                        break;
                    case 'float64':
                        array = new Float64Array(data);
                        break;
                    }

                    if (array.length != info.length) {
                        // Freak out
                    }

                    this.response.data[key] = { value: array };

                    data = null;
                }

                // If all outstanding data messages are received, then resolve
                if (this.response.outstanding.length == 0) {
                    let request = this.requests.shift();
                    request.resolve(this.response);
                    this.response = null;
                }
            }
        }
        else {
            console.error('Unexpected response packet', data);
        }
    }

    async getMany(request) {
        if (this.ws === undefined) {
            throw Error('WebSocket is closed');
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
