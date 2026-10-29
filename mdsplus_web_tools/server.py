
import os
import json
import numpy
import threading
import argparse
import warnings

from websockets.sync.server import ServerConnection, serve
from http.server import HTTPServer, SimpleHTTPRequestHandler

# Static web assets are shipped alongside this module, so resolve them relative
# to this file rather than the current working directory.
WWW_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'www')

parser = argparse.ArgumentParser()

parser.add_argument(
    'server',
    nargs='?'
)

parser.add_argument(
    '--ssh_port',
    help='ssh_port for use with ssh:// sshp://',
)

parser.add_argument(
    '--sshp_host',
    help='sshp_host for use with sshp://'
)

parser.add_argument(
    '--address',
    nargs='?',
    default='0.0.0.0',
    help='Address that the web and websocket servers will use when listening, defaults to 0.0.0.0',
)

parser.add_argument(
    '-p', '--port',
    nargs='?',
    default=8888,
    help='Port that the web server will use when listening, defaults to 8888',
)

# TODO: Make configurable or somehow switch to /ws
# parser.add_argument(
#     '--ws-port',
#     nargs='?',
#     default=8123,
#     help='Port that the websocket server will use when listening, defaults to 8123',
# )

def handle_connection(ws: ServerConnection):
    origin = ws.request.headers['Origin']
    print(f"New websocket connection from {origin}")

    print('MDSplus Connection to', args.server, 'with arguments:', ', '.join([ f'{k}={v}' for k,v in connection_kwargs.items() ]))
    conn = MDSplus.Connection(args.server, **connection_kwargs)

    # TODO: Add this to the TDI standard library
    conn.get(
    'public fun CropAndResample(in _sig, optional in _start, optional in _end, optional in _count) {' +
        '_crop = (present(_start) || present(_end));' +
        '_dim = data(dim_of(_sig));' +
        'if (not present(_start)) _start = set_range(1,_dim)[0];' +
        'if (not present(_end)) _end = _dim[size(_dim) - 1];' +
        'if (_crop) {' +
            '_data = data(_sig);' +
            '_mask = (_dim >= _start && _dim <= _end);' +
            '_dim = pack(_dim,_mask);' +
            '_data = pack(_data,_mask);' +
            '_sig = make_signal(_data, *, _dim);' +
        '} else {' +
            '_sig = make_signal(data(_sig), *, _dim);' + # HACK: To prevent resample giving us the dim?
        '}' +
        'if (!present(_count)) {' +
            '_count = size(_sig);' +
        '}' +
        'if (size(_sig) > _count) {' +
            '_delta = (float(_end) - float(_start)) / float(_count);' +
            '_result = resample(_sig, _start, _end, _delta);' +
            'if (kind(_result) != 14) {' +
                '_sig = _result;' # HACK: Filter errors from resample() which just returns a string...
            '}' +
        '}' +
        'return(_sig);' +
    '}; 42') # if we return the function itself it gets called, so we return some dummy data

    conn.get(
    'public fun TreeDecompileRecord(in _nid) {' +
        '_out=1;' +
        '_status=TreeShr->TreeGetRecord(val(_nid), xd(_out));' +
        'return(execute("decompile(`_out)"));' +
    '}; 42') # if we return the function itself it gets called, so we return some dummy data

    conn.get(
    'public fun TreeFindAllNodeTags(in _nid) {' +
        '_tags=[];' +
        '_nidlocal=getnci(_nid,"nid_number");' +
        '_ctx=0q;' +
        '_tagnam=repeat(" ",64);' +
        '_status=TreeShr->TreeFindNodeTagsDsc(val(_nidlocal),ref(_ctx),descr(_tagnam));' +
        'while (_status & 1) {' +
            '_tags=[_tags, _tagnam];' +
            '_status=TreeShr->TreeFindNodeTagsDsc(val(_nidlocal),ref(_ctx),descr(_tagnam));' +
        '}' +
        'return(_tags);' +
    '}; 42') # if we return the function itself it gets called, so we return some dummy data

    for message in ws:
        request = json.loads(message)
        response = {}

        data_packets = []

        # Get many breaks logic of chaining scopes.
        # gm = conn.getMany()
        # for name, expr in request.items():
        #     gm.append(name, expr)
        # gm.execute()

        for item in request:
            name, expr = item
            if name is None:
                pass
            try:
                print(name, expr)
                if expr is None:
                    value = None
                else:
                    value = conn.get(expr).data()

                # Convert to native python type
                if isinstance(value, numpy.number):
                    value = value.item()
                elif isinstance(value, numpy.ndarray):
                    print(value.dtype)
                    if isinstance(value.dtype, numpy.dtypes.StrDType):
                        value = [ item.strip() for item in value.tolist() ]
                    elif isinstance(value.dtype, numpy.dtypes.BytesDType):
                        value = [ item.decode().strip() for item in value.tolist() ]
                    else:
                        if value.dtype in ['int64', 'uint64']:
                            warnings.warn('int64 and uint64 are not supported, casting to float64')
                            value = value.astype('float64')

                        data_packets.append(value)
                        value = { 'type': str(value.dtype), 'size': len(value) }
                elif value is not None:
                    value = str(value)

                response[name] = { 'value': value }
            
            except Exception as e:
                response[name] = { 'error': str(e) }
        
        try:
            response = json.dumps(response)
        except Exception as e:
            response = json.dumps({ 'error': str(e) })
        
        ws.send(response)

        for data in data_packets:
            ws.send(data.tobytes())
    
    conn.disconnect()

class HTTPRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs, directory=WWW_DIR)

def websocket_main():
    print(f'Serving websocket on ws://{address}:{websocket_port}')

    server = serve(handle_connection, address, websocket_port)
    server.serve_forever()

def webserver_main():
    print(f'Serving on http://{address}:{webserver_port}')
    print(f'Serving scope on http://{address}:{webserver_port}#scope')

    server = HTTPServer((address, webserver_port), HTTPRequestHandler)
    server.serve_forever()

def main():
    global args, connection_kwargs, MDSplus
    global address, websocket_port, webserver_port

    args = parser.parse_args()

    connection_kwargs = {}

    if args.ssh_port is not None:
        connection_kwargs['ssh_port'] = args.ssh_port
    if args.sshp_host is not None:
        connection_kwargs['sshp_host'] = args.sshp_host

    if args.server is None or args.server in ['local', 'local://0', 'thread://0']:
        import MDSplus
        args.server = 'local://0'
    else:
        try:
            from mdsthin import MDSplus

        except:
            print('Unable to import mdsthin, trying MDSplus')

            import MDSplus

            if args.ssh_port is not None:
                raise Exception('ssh_port is not supported without mdsthin')
            if args.sshp_host is not None:
                raise Exception('sshp_host is not supported without mdsthin')

    address = args.address
    websocket_port = 8123 # args.ws_port
    webserver_port = args.port

    threading.Thread(target=websocket_main).start()
    threading.Thread(target=webserver_main).start()

if __name__ == '__main__':
    main()
