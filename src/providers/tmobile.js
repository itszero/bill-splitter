import { addSharedCost, createLogger, readConfig, mergeSamePersonLines } from '../utils';
import webdriverio from 'webdriverio';

const log = createLogger('T-mobile');

export const name = 'T-mobile';
export default async function main(webdriverOptions) {
  const {
    secrets: {
      tmobile: secrets
    }
  } = readConfig();
  const client = webdriverio.remote(webdriverOptions);

  log('opening login page');
  await client.init().url('https://my.t-mobile.com')
    .waitUntil(function() {
      return this.getCssProperty('#spinner', 'display').then((display) => display.value === 'none');
    }, 2000);
  log('logging in');
  await client.click('#msisdn').setValue('#msisdn', secrets.username)
    .click('#password').setValue('#password', secrets.password)
    .click('#primary_button');
  log('loading billing page');
  await client.url('https://my.t-mobile.com/billing/summary.html').waitForExist('.billing-amount', 10000);

  const promise = client.execute(() => {
    function ArrayFrom(arr) {
      const out = [];
      for (var i=0;i<arr.length;i++) {
        out.push(arr[i]);
      }
      return out;
    }

    const charges = ArrayFrom(document.querySelectorAll('.currentChargesRow'))
      .map((chargeRow) => {
        return {
          name: chargeRow.querySelector("[id^='subscriberName']")
            .innerText.replace(',', '').trim(),
          number: chargeRow.querySelector("[id^='subscriberMsisdn']").innerText,
          amount: parseFloat(
            chargeRow.querySelector(".billing-amount").innerText.slice(1)
          )
        };
      });

    const isAccount = (c) => c.name === 'Account';
    const account = charges.filter(isAccount)[0];
    const users = charges.filter((c) => !isAccount(c));

    return {
      period: $('#billPeriod').text().slice(1).trim(),
      account,
      lines: users
    };
  });

  return promise.then(
    (ret) => {
      client.end();
      const data = ret.value;
      data.lines = addSharedCost(mergeSamePersonLines(data.lines), data.account.amount);
      return data;
    },
    (err) => {
      client.end();
      throw err;
    }
  );
}
