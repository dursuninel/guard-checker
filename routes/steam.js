const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const readSteamCode = require("../services/mailReader");

// Firebase Admin SDK yapılandırması
const serviceAccount = require("../config/serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

router.get("/:username", async (req, res) => {
  const { username } = req.params;

  try {
    // Firebase'den hesap bilgilerini al
    const accountsRef = db.collection('accounts');
    const snapshot = await accountsRef.where('username', '==', username).get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "Hesap bulunamadı" });
    }

    const accountData = snapshot.docs[0].data();
    
    try {
      const code = await readSteamCode(accountData);
      if (code) {
        res.json({ code });
      } else {
        res.json({ message: "Kod bulunamadı, tekrar deneyin." });
      }
    } catch (mailError) {
      // E-posta okuma hataları için özel durum kodları
      if (mailError.message.includes('Authentication failed')) {
        res.status(401).json({ error: "E-posta kimlik doğrulama hatası" });
      } else if (mailError.message.includes('ECONNREFUSED')) {
        res.status(500).json({ error: "E-posta sunucusuna bağlanılamadı" });
      } else if (mailError.message.includes('timeout')) {
        res.status(500).json({ error: "E-posta sunucusu zaman aşımı" });
      } else {
        res.status(500).json({ error: "E-posta okuma hatası", detail: mailError.message });
      }
    }
  } catch (error) {
    res.status(500).json({ error: "Veritabanı hatası", detail: error.message });
  }
});

module.exports = router;
