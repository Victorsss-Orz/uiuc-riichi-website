import { Client, GatewayIntentBits } from "discord.js";

let started = false;
export async function startBot() {
  if (started) return;
  started = true;

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once("ready", () => {
    console.log(`Bot logged in as ${client.user?.tag}`);
  });

  await client.login(process.env.DISCORD_TOKEN);
}
