#!/bin/bash

# confira o seu ip usando ifconfig docker0|grep 'inet addr:'
export DOCKER_LAN_IP=172.17.0.1

# porta que será feito o bind
export LISTEN_PORT=8181

docker run --name gastos-abertos-chatbot \
 -p $DOCKER_LAN_IP:$LISTEN_PORT:8080 \
 --cpu-shares=512 \
 --memory 1800m -dit --restart unless-stopped appcivico/gastos-abertos-chatbot
