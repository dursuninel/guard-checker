/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const Imap = require("node-imap");
const {simpleParser} = require("mailparser");

admin.initializeApp();

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// Steam Guard kodunu e-postadan oku
function readSteamGuardCode(emailConfig) {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: emailConfig.email,
      password: emailConfig.password,
      host: emailConfig.host,
      port: emailConfig.port,
      tls: emailConfig.tls,
      tlsOptions: {rejectUnauthorized: false}
    });

    const openInbox = (cb) => {
      imap.openBox("INBOX", false, cb);
    };

    imap.once("ready", () => {
      openInbox((err) => {
        if (err) return reject(err);

        const since = new Date();
        since.setMinutes(since.getMinutes() - 20); // Son 20 dakikayı kontrol et

        const searchCriteria = [
          ["FROM", "noreply@steampowered.com"],
          ["SINCE", since.toDateString()]
        ];

        imap.search(searchCriteria, (err, results) => {
          if (err || !results.length) return resolve(null);

          const fetch = imap.fetch(results.slice(-1), {bodies: ""});

          fetch.on("message", (msg) => {
            msg.on("body", (stream) => {
              simpleParser(stream, async(err, parsed) => {
                if (err) return reject(err);
                const body = parsed.text;

                const match = body.match(/Giriş Kodu\s+([A-Z0-9]{5})/i);
                resolve(match ? match[1] : null);
              });
            });
          });

          fetch.once("end", () => {
            imap.end();
          });
        });
      });
    });

    imap.once("error", (err) => {
      reject(err);
    });

    imap.connect();
  });
}

// Steam Guard kodunu getir
exports.getSteamGuardCode = onCall(async(request) => {
  try {
    const data = request.data;
    console.log("Gelen veri:", {
      data: data,
      type: typeof data,
      hasData: !!data,
      isObject: typeof data === "object",
      username: data && data.username
    });

    // Kullanıcı adı kontrolü
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      console.error("Geçersiz veri formatı:", {
        data: data,
        type: typeof data,
        isArray: Array.isArray(data)
      });
      throw new Error("Geçersiz veri formatı");
    }

    const username = data.username;
    if (!username || typeof username !== "string" || username.trim() === "") {
      console.error("Geçersiz kullanıcı adı:", {
        username: username,
        type: typeof username
      });
      throw new Error("Geçerli bir kullanıcı adı gerekli");
    }

    // Kullanıcı adına göre hesap bilgilerini al
    const accountsRef = admin.firestore().collection("accounts");
    console.log("Firestore sorgusu yapılıyor:", username);
    const snapshot = await accountsRef.where("username", "==", username).get();

    if (snapshot.empty) {
      console.log("Hesap bulunamadı:", username);
      throw new Error("Hesap bulunamadı");
    }

    const accountData = snapshot.docs[0].data();
    console.log("Hesap bulundu:", {
      username: accountData.username,
      gamename: accountData.gamename,
      email: accountData.email,
      host: accountData.host,
      port: accountData.port,
      tls: accountData.tls
    });
    
    try {
      const code = await readSteamGuardCode(accountData);
      if (code) {
        console.log("Steam Guard kodu bulundu:", code);
        return {code, gamename: accountData.gamename};
      } else {
        console.log("Steam Guard kodu bulunamadı");
        return {message: "Kod bulunamadı, tekrar deneyin."};
      }
    } catch (mailError) {
      console.error("E-posta okuma hatası:", {
        message: mailError.message,
        stack: mailError.stack
      });
      if (mailError.message.includes("Authentication failed")) {
        throw new Error("E-posta kimlik doğrulama hatası");
      } else if (mailError.message.includes("ECONNREFUSED")) {
        throw new Error("E-posta sunucusuna bağlanılamadı");
      } else if (mailError.message.includes("timeout")) {
        throw new Error("E-posta sunucusu zaman aşımı");
      } else {
        throw new Error("E-posta okuma hatası: " + mailError.message);
      }
    }
  } catch (error) {
    console.error("Genel hata:", {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw new Error(error.message);
  }
});
