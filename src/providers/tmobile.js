const {
  addSharedCost,
  createLogger,
  readConfig,
  mergeSamePersonLines
} = require("../utils");
const webdriverio = require("webdriverio");

const log = createLogger("T-mobile");

exports.name = "T-mobile";
exports.default = async function main(webdriverOptions) {
  const { secrets: { tmobile: secrets } } = readConfig();
  const client = webdriverio.remote(webdriverOptions);

  log("opening login page");
  await client
    .init()
    .url("https://my.t-mobile.com")
    .waitForExist("#username", 15000);
  log("logging in");
  await client
    .click("#username")
    .setValue("#username", secrets.username)
    .click("#password")
    .setValue("#password", secrets.password)
    .click(".login-btn");
  log("loading billing page");
  await client
    .waitForExist("#showLabel", 15000)
    .url("https://my.t-mobile.com/billing/summary.html")
    .waitForExist(".currentChargesRow .billing-amount", 15000);

  const promise = client.execute(() => {
    function ArrayFrom(arr) {
      const out = [];
      for (var i = 0; i < arr.length; i++) {
        out.push(arr[i]);
      }
      return out;
    }

    const charges = ArrayFrom(
      document.querySelectorAll(".currentChargesRow")
    ).map(chargeRow => {
      return {
        name: chargeRow
          .querySelector("[id^='subscriberName']")
          .innerText.replace(",", "")
          .trim(),
        amount: parseFloat(
          chargeRow.querySelector(".billing-amount").innerText.slice(1)
        )
      };
    });

    const isAccount = c => c.name === "Account";
    const account = charges.filter(isAccount)[0];
    const users = charges.filter(c => !isAccount(c));

    return {
      period: $("#selectedBillingCycle")
        .text()
        .slice(1)
        .trim(),
      account,
      lines: users
    };
  });

  return promise.then(
    ret => {
      client.end();
      const data = ret.value;
      data.lines = addSharedCost(
        mergeSamePersonLines(data.lines),
        data.account.amount
      );
      return data;
    },
    err => {
      client.end();
      throw err;
    }
  );
};
