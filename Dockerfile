FROM node:8.9.0-stretch

RUN apt-get update && apt-get install -y chromium openjdk-8-jre-headless libgconf-2-4
ADD . /code
RUN chown -Rf node:node /code

USER node
RUN cd /code && yarn
