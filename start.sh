#!/bin/bash
docker run --rm=true -w /code -v `pwd`:/code itszero/bsbase:4.2 npm run remote:start
