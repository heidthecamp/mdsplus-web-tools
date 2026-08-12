
# Installing for an entire site

1. Replace all instances of mdsplus.example.com with the domain you wish to host this at in `docker-compose.yml` and `default.conf`.
2. Provide the .crt and .key files expected by `docker-compose.yml`.
3. Update `MDS_HOST` to point at your dataserver in `docker-compose.yml`
4. `docker compose up -d`

## TODO

Currently this is run through a single websocket server in server.py, this should be upgraded to use some method of parallelization.