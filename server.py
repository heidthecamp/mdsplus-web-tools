# import MDSplus
# import asyncio
# from websockets.server import serve

# async def echo(websocket):
#     async for message in websocket:
#         try:
#             result = MDSplus.mdsdata.TdiExecute(message)
#             await websocket.send(str(result))
#         except MDSplus.mdsExceptions.MdsException as e:
#             await websocket.send(str(e))

# async def main():
#     async with serve(echo, "localhost", 8123):
#         await asyncio.Future()  # run forever

# asyncio.run(main())

import json
from http.server import HTTPServer, SimpleHTTPRequestHandler
import numpy
import mdsthin
import asyncio
import threading
from websockets.legacy.server import serve

async def handle_connection(websocket):
    # print(f"New websocket connection from {websocket.host}:{websocket.port}")
    print(f"New websocket connection from {websocket.origin}")
    conn = mdsthin.Connection('alcdata-archives')

    async for message in websocket:
        request = json.loads(message)
        response = {}

        action = request.get('action', 'get')

        if action == 'get':
#            gm = conn.getMany()
#            for name, expr in request.items():
#                gm.append(name, expr)
#            gm.execute()

#            for name in request.keys():
            for name, expr in request.items():
                try:
#                    value = gm.get(name).data()
                    value = conn.get(expr).data()
                    
                    # Convert to native python type
                    if isinstance(value, numpy.number):
                        value = value.item()
                    elif isinstance(value, numpy.ndarray):
                        value = value.tolist()
                    else:
                        # TODO:
                        value = str(value)

                    response[name] = { 'value': value }
                except mdsthin.MdsException as e:
                    response[name] = { 'error': str(e) }

        elif action == 'put':
            pass

        try:
            response = json.dumps(response)
        except:
            response = ''

        await websocket.send(response)

    conn.disconnect()

url = "0.0.0.0"
websocket_port = 8123
webserver_port = 8888

async def asyncio_main():
    print(f"Serving websocket on http://{url}:{websocket_port}")
    async with serve(handle_connection, url, websocket_port):
        await asyncio.Future()  # run forever

class HTTPRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs, directory='www')

def websocket_main():
    asyncio.run(asyncio_main())

def webserver_main():
    print(f"Serving on http://{url}:{webserver_port}")
    server = HTTPServer((url, webserver_port), HTTPRequestHandler)
    server.serve_forever()

threading.Thread(target=websocket_main).start()
threading.Thread(target=webserver_main).start()
