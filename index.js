import express from "express";
import makeWASocket, {
  useMultiFileAuthState
} from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import fs from "fs";
import { encryptSession } from "./encrypt.js";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const SECRET = process.env.SERVER_SECRET || "TISHAN-DEFAULT-KEY";

app.get("/", (req, res) => {
  res.send(`
    <center>
      <h1>WhatsApp Pair Code Generator</h1>
      <form action="/pair" method="get">
        <input name="phone" placeholder="947XXXXXXXX" required />
        <button type="submit">Get Pair Code</button>
      </form>
    </center>
  `);
});

app.get("/pair", async (req, res) => {
  const number = req.query.phone;

  if (!number) return res.send("Phone ?phone=947XXXXXXXX");

  const { state, saveCreds } = await useMultiFileAuthState("auth");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ["Chrome", "Linux", ""]
  });

  sock.ev.on("creds.update", saveCreds);

  const code = await sock.requestPairingCode(number);
  console.log("PAIR CODE:", code);

  const qrImage = await QRCode.toDataURL(code);

  res.send(`
    <center>
      <h2>Scan This Code</h2>
      <img src="${qrImage}" />
      <p>${code}</p>
    </center>
  `);

  sock.ev.on("connection.update", async ({ connection }) => {
    if (connection === "open") {

      const sessionFile = "session.json";
      const sessionData = {
        creds: JSON.parse(fs.readFileSync("./auth/creds.json")),
        keys: JSON.parse(fs.readFileSync("./auth/keys.json"))
      };

      fs.writeFileSync(sessionFile, JSON.stringify(sessionData));

      // Encrypt session file
      const encryptedData = encryptSession(sessionFile, SECRET);
      fs.writeFileSync("session.enc", encryptedData);

      // Send session.enc to WhatsApp
      await sock.sendMessage(number + "@s.whatsapp.net", {
        document: fs.readFileSync("session.enc"),
        mimetype: "application/octet-stream",
        fileName: "session.enc",
        caption: "Your encrypted WhatsApp session"
      });

      console.log("Session sent to user!");
    }
  });
});

app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);