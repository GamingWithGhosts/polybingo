
FROM python:3.9-alpine

WORKDIR /flaskapp
COPY requirements.txt .

RUN apk add bash
RUN apk update && \
    apk add --no-cache \
        --virtual .build-deps \
        gcc linux-headers musl-dev xvfb \
        openssl-dev cargo rust redis && \
    pip install -r requirements.txt && \
    rm -rf /root/.cargo && \
    apk del .build-deps
COPY . .
CMD sh start.sh
