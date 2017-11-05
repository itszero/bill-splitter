#!/usr/bin/env node
const path = require("path");
const push = require("./push").default;
const { readConfig } = require("./utils");
const selenium = require('selenium-standalone');

const config = readConfig();
const webdriverOptions = {
  desiredCapabilities: {
    browserName: "chrome",
    chromeOptions: {
      args: ["headless", "disable-gpu", "no-sandbox"]
    }
  }
};

function runProviders() {
  return config.providers.reduce(
    (promise, provider) =>
      promise.then(async () => {
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
      }),
    Promise.resolve()
  );
}

function seleniumInstall(opts) {
  return new Promise((resolve, reject) => {
    console.log("> Installing selenium");
    selenium.install(opts, (err) => {
      err && reject(err) || resolve();
    });
  });
}

function seleniumStart(opts) {
  let seleniumProcess = undefined;
  return new Promise((resolve, reject) => {
    console.log("> Starting selenium");
    selenium.start(opts, (err, child) => {
      selneiumProcess = child;
      err && reject(err) || resolve(child);
    });
  });
}

const defaultSeleniumOptions = require('selenium-standalone/lib/default-config');
const standaloneSeleniumOptions = {
  ...defaultSeleniumOptions,
  drivers: {
    chrome: defaultSeleniumOptions['drivers']['chrome']
  }
};

seleniumInstall(standaloneSeleniumOptions)
  .then(() => seleniumStart(standaloneSeleniumOptions))
  .then((child) => {
    const killProcess = () => child && child.kill();
    return runProviders().then(killProcess, killProcess);
  })
  .then(() => process.exit(0))
  .catch(err => {
    console.log(err);
    console.log(err.stack);
    process.exit(1);
  });

