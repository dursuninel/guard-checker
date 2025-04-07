const Imap = require("node-imap");
const { simpleParser } = require("mailparser");

function readSteamCode({ email, password, host, port, tls }) {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: email,
      password,
      host,
      port,
      tls,
      tlsOptions: { rejectUnauthorized: false },
    });

    function openInbox(cb) {
      imap.openBox("INBOX", false, cb);
    }

    imap.once("ready", function () {
      openInbox(function (err, box) {
        if (err) return reject(err);

        const since = new Date(Date.now() - 20 * 60 * 1000); // son 10 dakikayı kontrol et
        const searchCriteria = [
          ["FROM", "noreply@steampowered.com"],
          ["SINCE", since.toDateString()],
        ];

        imap.search(searchCriteria, function (err, results) {
          if (err || !results.length) return resolve(null);

          const fetch = imap.fetch(results.slice(-1), { bodies: "" });

          fetch.on("message", function (msg) {
            msg.on("body", function (stream) {
              simpleParser(stream, async (err, parsed) => {
                if (err) return reject(err);
                const body = parsed.text;

                const match = body.match(/Giriş Kodu\s+([A-Z0-9]{5})/i);
                resolve(match ? match[1] : null);
              });
            });
          });

          fetch.once("end", function () {
            imap.end();
          });
        });
      });
    });

    imap.once("error", function (err) {
      reject(err);
    });

    imap.connect();
  });
}

module.exports = readSteamCode;
