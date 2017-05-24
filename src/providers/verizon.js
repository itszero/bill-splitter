import { addSharedCost, createLogger, readConfig, mergeSamePersonLines } from '../utils';
import webdriverio from 'webdriverio';

const log = createLogger('Verizon');

export const name = 'Verizon';
export default async function main(webdriverOptions) {
  const {
    secrets: {
      verizon: secrets
    }
  } = readConfig();
  const client = webdriverio.remote(webdriverOptions);

  log('opening login page');
  await client.init().url('https://login.verizonwireless.com/amserver/UI/Login?realm=vzw');
  log('logging in: username');
  await client
    .waitForExist('#IDToken1', 100000)
    .click('#IDToken1')
    .setValue('#IDToken1', secrets.username)
    .click('#login-submit');
  log('logging in: security question');
  await client
    .waitForExist('#challengequestion', 100000)
    .click('#IDToken1')
    .setValue('#IDToken1', secrets.securityQuestion)
    .click('#rememberComputer') /* uncheck the box */
    .click('button.o-red-button');
  log('logging in: password');
  await client
    .waitForExist('#IDToken2', 100000)
    .click('#IDToken2')
    .setValue('#IDToken2', secrets.password)
    .click('button.o-red-button');

  log('loading billing page');
  await client.url('https://ebillpay.verizonwireless.com/vzw/accountholder/mybill/mybill.action')
    .waitForExist('.o-charge-line-filter', 100000)
    .click('.o-charge-line-filter');

  const promise = client.execute(() => {
    function ArrayFrom(arr) {
      const out = [];
      for (var i=0;i<arr.length;i++) {
        out.push(arr[i]);
      }
      return out;
    }

    function parseMoney(str) {
      return parseFloat(str.replace('$', ''));
    }

    const period = document.querySelector('bill-select').attributes['selected-bill'].value;
    const account = {
      name: 'Account',
      amount: (
        parseMoney(document.querySelector('[ng-if=balanceForwardDetails]').querySelector('.o-float-right.ng-binding').innerText) +
        parseMoney(document.querySelector('[ng-if="breakdown.account"]').querySelector('.o-float-right.ng-binding').innerText)
      )
    };
    const lineDivs = ArrayFrom(document.querySelector('[ng-if="breakdown.mtns"]').querySelectorAll('[ng-repeat]'));
    const users = lineDivs.map((row) => {
      const amount = parseMoney(row.querySelector('.o-float-right.ng-binding').innerText);
      return {
        name: row.querySelector('.o-bold.ng-binding').innerText.trim(),
        amount
      };
    });

    return {
      period,
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

