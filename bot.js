import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, jidNormalizedUser } from "@whiskeysockets/baileys";
import pino from "pino";
import readline from "readline";
import fs from "fs";
import path from "path";
import caseHandler from "./case.js";

function question(text = "question") {
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question(`\x1b[32;1m?\x1b[0m\x20\x1b[1m${text}\x1b[0m`, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

(async function start(usePairingCode = true) {
  const { version } = await fetchLatestBaileysVersion();
  const session = await useMultiFileAuthState("session");

  const bot = makeWASocket({
    version,
    printQRInTerminal: !usePairingCode,
    auth: session.state,
    logger: pino({ level: "silent" })
  });

  if (usePairingCode && !bot.user?.id && !bot.authState.creds.registered) {
    usePairingCode = (await question("Connect via pairing code? [Y/n]: ")).toLowerCase() !== "n";
    if (!usePairingCode) return start(false);

    const waNumber = await question("Enter your WhatsApp number: +");
    const code = await bot.requestPairingCode(waNumber.replace(/\D/g, ""));
    console.log(`\x1b[44;1m PAIRING CODE \x1b[0m ${code}`);
  }

  bot.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
      if (shouldReconnect) start();
      else {
        console.log("❌ Unauthorized or session expired.");
        await fs.promises.rm("session", { recursive: true, force: true });
        start();
      }
    }

    if (connection === "open") {
      console.log("✅ Connected as:", bot.user.id.split(":")[0]);
    }
  });

  // Simpan kredensial bila update
  bot.ev.on("creds.update", session.saveCreds);

  // === Handler pesan utama ===
  bot.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg?.message) return;

    try {
      await bot.readMessages([msg.key]);
      await caseHandler(bot, msg);
      
    } catch (err) {
      console.error("❗ error when handling", err);
    }
  });
})();
