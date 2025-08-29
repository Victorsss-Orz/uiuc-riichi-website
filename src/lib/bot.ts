import "dotenv/config";
import {
  Client,
  Events,
  GatewayIntentBits,
  Interaction,
  Partials,
} from "discord.js";
import { deployCommands } from "./deploy-commands.js";

let started = false;
export async function startBot() {
  if (started) return;
  started = true;

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages],
    partials: [Partials.Channel], // needed to receive DMs
  });

  client.once(Events.ClientReady, async () => {
    console.log(`Bot logged in as ${client.user?.tag}`);
    await deployCommands();
  });

  // We don't need to register guild-specific commands
  // client.on(Events.GuildCreate, async (guild) => {
  //   await deployCommands({ guildId: guild.id });
  // });

  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === "hi") {
      await interaction.reply({
        content: "Hello! 👋",
      });
    }
  });

  await client.login(process.env.DISCORD_TOKEN);
}
