#!/bin/bash
cd /home/zero/src/bill-splitter
docker run --rm=true -w /code -v `pwd`:/code itszero/bill-splitter npm run remote:start
