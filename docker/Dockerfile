FROM tatsushid/tinycore-node:4.2

USER tc
RUN tce-load -wic freetype fontconfig \
    && rm -rf /tmp/tce/optional/*

USER root
RUN npm install -g phantomjs
