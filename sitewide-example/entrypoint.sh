#!/bin/bash

# TODO: Improve
#nginx
nginx -g "daemon off;" &

python3 -m venv /tmp/venv
source /tmp/venv/bin/activate

cd /mdsplus-web-tools
python3 -m pip install -r requirements.txt
python3 server.py ${MDS_HOST}
