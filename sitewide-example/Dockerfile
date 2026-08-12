FROM ubuntu:24.04

EXPOSE 80
EXPOSE 443

RUN apt update \
    && apt install -y \
        nginx \
        python3 \
        python3-pip \
        python3-venv \
    && rm -rf /tmp/* \
    && apt-get clean

ADD entrypoint.sh /

CMD [ "/bin/bash", "/entrypoint.sh" ]