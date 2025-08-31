import "dotenv/config";
import {
  Client,
  Events,
  GatewayIntentBits,
  Interaction,
  MessageFlags,
  Options,
} from "discord.js";
import { commandMap, deployCommands } from "./deploy-commands.js";

let started = false;
export async function startBot() {
  if (started) return;
  started = true;

  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
    partials: [],
    makeCache: Options.cacheWithLimits({
      // turn off the heavy stuff
      GuildMemberManager: 0,
      MessageManager: 0,
      ReactionManager: 0,
      PresenceManager: 0,
      ThreadManager: 0,
      GuildScheduledEventManager: 0,
      VoiceStateManager: 0,
      AutoModerationRuleManager: 0,
    }),
    sweepers: {
      // no periodic sweeping if nothing is cached
      messages: { interval: 0, lifetime: 0 },
    },
    presence: { status: "online", activities: [] }, // skip frequent presence updates
  });

  client.once(Events.ClientReady, async () => {
    console.log(`Bot logged in as ${client.user?.tag}`);
    if (process.env.DEPLOY_COMMANDS === "1") {
      await deployCommands({ guildId: "1292212177171779657" });
    }
  });

  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const cmd = commandMap.get(interaction.commandName);

    if (!cmd) {
      await interaction.reply({
        content: "Unknown command.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      await cmd.execute(interaction);
    } catch (err) {
      console.error(err);
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({
          content: "Error while executing command.",
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: "Error while executing command.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  });

  await client.login(process.env.DISCORD_TOKEN);
}
