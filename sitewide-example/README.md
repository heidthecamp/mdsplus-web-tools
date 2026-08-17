
# Installing for an entire site

Installing for a site will allow anyone on your network to access your MDSplus data. With a site-wide install and a standard `mdsip.hosts` on your MDSplus data server, any access from the Scope should be mapped to the `nobody` user. However, it is still not recommended to open this tool up to the internet.

1. Replace all instances of mdsplus.example.com with the domain you wish to host this at in `docker-compose.yml` and `default.conf`.
2. Provide the .crt and .key files expected by `docker-compose.yml`.
3. Update `MDS_HOST` to point at your dataserver in `docker-compose.yml`
4. `docker compose up -d`

## Future Plans

Currently this is run through a single websocket server in server.py, this should be upgraded to use some method of parallelization.