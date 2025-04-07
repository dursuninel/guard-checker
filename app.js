const express = require("express");
const steamRoute = require("./routes/steam");
const app = express();
const PORT = process.env.PORT || 3000;

app.use("/api/steam", steamRoute);

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});
