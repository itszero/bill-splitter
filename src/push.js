const fs = require("fs");
const request = require("request");
const { readConfig, round } = require("./utils");

exports.default = function push(provider, data) {
  const { period, account, lines } = data;

  const noteTitle = `${provider} (${period})`;
  const noteBodyAccount = `Shared: ${account.amount}`;
  const noteBodyLines = lines
    .map(line => {
      line.amount = round(line.amount, -1);
      line.shared = round(line.shared, -1);
      line.total = round(line.total, -1);

      return `${line.name}: ${line.amount} + ${line.shared} = ${line.total}`;
    })
    .filter(d => !!d)
    .join("\n");
  const pushBody = {
    type: "note",
    title: noteTitle,
    body: `${noteBodyAccount}\n${noteBodyLines}`
  };
  console.log("sending", JSON.stringify(pushBody));

  return new Promise((resolve, reject) => {
    request(
      {
        method: "POST",
        url: "https://api.pushbullet.com/v2/pushes",
        body: pushBody,
        json: true,
        headers: {
          "Access-Token": readConfig().secrets.pushbullet.token
        }
      },
      (err, resp, body) => {
        console.log("push sent");
        if (err) {
          console.log("error", err);
          reject(err);
        } else {
          resolve(resp);
        }
      }
    );
  });
};
