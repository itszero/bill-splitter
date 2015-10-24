require('babel/polyfill');
import childProcess from 'child_process';
import path from 'path';
import phantomjs from 'phantomjs';
import push from './push';
import { readConfig, wait } from './utils';

const config = readConfig();
const webdriverOptions = {
  port: 8910, // 9515 for local ChromeDriver
  path: '/'
};
const phantomPath = phantomjs.path;
const phantomProc = childProcess.spawn(
  phantomPath,
  ['--load-images=false', '--webdriver=8910'],
  {
    stdio: 'pipe'
  }
);

process.stdin.resume();
function exitHandler(options, err) {
    phantomProc.kill('SIGKILL');
    if (options.exit) process.exit();
}
process.on('exit', exitHandler.bind(null, {cleanup: true}));
process.on('SIGINT', exitHandler.bind(null, {exit: true}));

function runProviders() {
  return Promise.all(
    config.providers.map(async (provider) => {
      const f = require(`./providers/${provider}.js`);
      console.log(`Provider: ${f.name}`);
      try {
        const data = await f.default(webdriverOptions);
        console.log(JSON.stringify(data));
        console.log(`${f.name}: Sending a push`);
        return push(f.name, data);
      } catch (err) {
        console.log(err);
        console.log(err.stack);
        return Promise.reject(err);
      }
    })
  );
}

console.log('wait 1000ms for phantomjs');
setTimeout(() => {
  runProviders()
    .then(() => process.exit(0))
    .catch((err) => {
      console.log(err);
      console.log(err.stack);
      process.exit(1)
    });
}, 1000);
