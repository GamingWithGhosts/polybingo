#!/bin/sh

#Stop previously runner docker instances
docker stop polybingo-api ipfs
docker rm polybingo-api ipfs

#Build Docker
docker build -t polybingo-api .

#Start IPFS & API Docker
docker run --name ipfs -p 4001:4001 -p 5001:5001 -p 8080:8080 -v /root/ipfs:data/ipfs -d ipfs/go-ipfs:v0.7.0 && \
docker run --name polybingo-api --add-host=host.docker.internal:host-gateway --network="host" -p 5000:5000 -v /root/tickets:/flaskapp/tickets polybingo-api