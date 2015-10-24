#!/bin/sh
rm -rf billsplitter.zip node_modules
zip -r billsplitter.zip .
iron worker upload -zip billsplitter.zip -name billspliter itszero/bsbase:4.2 "npm run remote:start"
