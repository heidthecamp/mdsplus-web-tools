
import json
import numpy
import mdsthin
import asyncio
import threading

from websockets.sync.server import ServerConnection, serve
from http.server import HTTPServer, SimpleHTTPRequestHandler

def handle_connection(ws: ServerConnection):
    origin = ws.request.headers['Origin']
    print(f"New websocket connection from {origin}")

    # conn = mdsthin.Connection('localhost')
    # conn = mdsthin.Connection('sshp://heidcamp@mfews-heidcamp-public.psfc.mit.edu', ssh_port=9224, sshp_host='alcdata-archives')
    conn = mdsthin.Connection('mfedata01')

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
                    if isinstance(value.dtype, (numpy.dtypes.StrDType, numpy.dtypes.BytesDType)):
                        value = value.tolist()
                    else:
                        data_packets.append(value)
                        value = { 'type': str(value.dtype), 'size': len(value) }
                elif value is not None:
                    value = str(value)

                response[name] = { 'value': value }
            
            except mdsthin.MdsException as e:
                response[name] = { 'error': str(e) }
        
        try:
            response = json.dumps(response)
        except Exception as e:
            response = json.dumps({ 'error': str(e) })
        
        ws.send(response)

        for data in data_packets:
            ws.send(data.tobytes())
    
    conn.disconnect()

address = '0.0.0.0'
websocket_port = 8123
webserver_port = 8888

class HTTPRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs, directory='www')

def websocket_main():
    print(f'Serving websocket on http://{address}:{websocket_port}')

    server = serve(handle_connection, address, websocket_port)
    server.serve_forever()

def webserver_main():
    print(f'Serving on http://{address}:{webserver_port}')

    server = HTTPServer((address, webserver_port), HTTPRequestHandler)
    server.serve_forever()

threading.Thread(target=websocket_main).start()
threading.Thread(target=webserver_main).start()
