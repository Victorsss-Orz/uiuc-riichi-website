import "dotenv/config";
import {
  Client,
  Events,
  GatewayIntentBits,
  Interaction,
  Partials,
} from "discord.js";
import { commandMap, deployCommands } from "./deploy-commands.js";

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
    await deployCommands({ guildId: "1292212177171779657" });
    await deployCommands();
  });

  // We don't need to register guild-specific commands
  // client.on(Events.GuildCreate, async (guild) => {
  //   await deployCommands({ guildId: guild.id });
  // });

  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const cmd = commandMap.get(interaction.commandName);
    console.log(`Command ${cmd?.data.name} triggered!`);

    if (!cmd) {
      await interaction.reply({ content: "Unknown command.", ephemeral: true });
      return;
    }

    try {
      await cmd.execute(interaction);
    } catch (err) {
      console.error(err);
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({
          content: "Error while executing command.",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "Error while executing command.",
          ephemeral: true,
        });
      }
    }
  });

  await client.login(process.env.DISCORD_TOKEN);
}
