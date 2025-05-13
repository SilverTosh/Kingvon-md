import fs from "fs";
import path from "path";

const config = JSON.parse(fs.readFileSync("./config/config.json", "utf-8"));
const prefix = config.prefix;
const ownerNumber = ["+254720326316@s.whatsapp.net"];

export default async function caseHandler(sock, msg) {
  const from = msg.key.remoteJid;
  const sender = msg.key.fromMe ? sock.user.id : msg.key.participant || from;
  const isGroup = from.endsWith("@g.us");
  const isOwner = ownerNumber.includes(sender);
  const pushName = msg.pushName || "Pengguna";

  const body = msg.message?.conversation ||
               msg.message?.extendedTextMessage?.text ||
               msg.message?.imageMessage?.caption ||
               msg.message?.videoMessage?.caption ||
               "";

  const pesan = body.toLowerCase();
  if (!pesan.startsWith(prefix)) return;

  const fullCmd = pesan.slice(prefix.length).trim();
  const [command, ...args] = fullCmd.split(" ");
  const text = args.join(" ");

  function reply(teks) {
    return sock.sendMessage(from, { text: teks }, { quoted: msg });
  }

  console.log(`\x1b[32m[CMD]\x1b[0m ${command} => ${sender}`);

  switch (command) {
    case "menu":
      return reply(`Halo *${pushName}*, BOT kingvon md󱢏 BY KINGVON:

• ${prefix}menu
• ${prefix}ping
• ${prefix}owner`);

    case "ping":
      return reply("Pong!");

    case "owner":
      return reply("Owner: wa.me/+254720326316");

    default:
      return reply("❌sorry command not recognized");
  }
}
case "hello":
  return reply(`Hello, *${pushName}*! How can I assist you today?`);
  case "broadcast":
  if (!isOwner) return reply("Only the owner can use this command.");
  if (args.length === 0) return reply("Please provide the message you want to broadcast.");
  
  const broadcastMessage = args.join(" ");
  const contacts = await sock.getContacts(); // Fetching contacts
  contacts.forEach(async contact => {
    await sock.sendMessage(contact.id, { text: broadcastMessage });
  });
  return reply("Broadcast sent to all contacts.");
  case "welcome":
  if (!isGroup) return reply("This command can only be used in groups.");
  if (!isOwner) return reply("Only the owner can set a welcome message.");
  
  if (args.length === 0) return reply("Please provide a welcome message.");
  
  const welcomeMessage = args.join(" ");
  // Save the welcome message to a file or database to persist it (not shown in this example)
  config.welcomeMessage = welcomeMessage;
  fs.writeFileSync("./config/config.json", JSON.stringify(config, null, 2));
  
  // Additional style for the welcome message
  const styledMessage = `
  *Welcome to the group, ${pushName}!* 🎉

  We're excited to have you here! Here's a warm greeting for you:

  💬 *${welcomeMessage}*

  If you need help, type *${prefix}help*.

  Please read the group rules and enjoy your stay! 🌟`;

  return reply(styledMessage);
  
