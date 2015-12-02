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
    .click('#IDToken1')
    .setValue('#IDToken1', secrets.username)
    .click('#signInButton')
    .waitForExist('iframe[name=login_overlay]', 100000);
  await client.element('iframe[name=login_overlay]').then((res) => client.frame(res.value));
  log('logging in: security question');
  await client
    .waitForExist('#IDToken1', 100000)
    .click('#IDToken1')
    .setValue('#IDToken1', secrets.securityQuestion)
    .click('button.o-red-button');
  log('logging in: password');
  await client
    .waitForExist('#IDToken2', 100000)
    .click('#IDToken2')
    .setValue('#IDToken2', secrets.password)
    .click('button.o-red-button');

  log('loading billing page');
  await client.frame(null).url('https://ebillpay.verizonwireless.com/vzw/accountholder/mybill/BillViewLine.action');

  const promise = client.execute(() => {
    function ArrayFrom(arr) {
      const out = [];
      for (var i=0;i<arr.length;i++) {
        out.push(arr[i]);
      }
      return out;
    }

    const period = document.querySelector('.cc_content_wt h2').innerText.match(/\w+ \d{1,2}, \d{4}/g).slice(-1)[0];
    const account = {
      name: 'Account',
      amount: parseFloat(document.getElementById('acctchrgsLink').parentNode.parentNode.parentNode.querySelector('[align="right"]').innerText.trim().slice(1))
    };
    const lineDivs = ArrayFrom(document.querySelectorAll('[id^="div_1_"]'));
    const users = lineDivs.map((row) => {
      const amount = parseFloat(ArrayFrom(row.querySelectorAll('b')).slice(-1)[0].innerText.trim().slice(1));
      return {
        name: row.querySelector('.mybillNickName').innerText.trim(),
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

