import { REST, Routes } from "discord.js";
import "dotenv/config";
import { commands } from "./bot-commands/index.js";

const commandsData = Object.values(commands).map((command) => command.data);
export const commandMap = new Map(
  Object.values(commands).map((c) => [c.data.name, c])
);

const rest = new REST({ version: "10" }).setToken(
  process.env.DISCORD_TOKEN ?? ""
);

export async function deployCommands({
  guildId,
}: {
  guildId?: string;
} = {}) {
  const appId = process.env.DISCORD_CLIENT_ID!;
  if (guildId) {
    await rest.put(Routes.applicationGuildCommands(appId, guildId), {
      body: [],
    });
    console.log("Cleared all guild commands");

    await rest.put(Routes.applicationGuildCommands(appId, guildId), {
      body: commandsData,
    });
    console.log(
      `Registered ${commandsData.length} command(s) to guild ${guildId}`
    );
  } else {
    await rest.put(Routes.applicationCommands(appId), { body: [] });
    console.log("Cleared all global commands");

    await rest.put(Routes.applicationCommands(appId), { body: commandsData });
    console.log(`Registered ${commandsData.length} global command(s)`);

    const globalCmds = await rest.get(Routes.applicationCommands(appId));
    console.log("Global commands:", globalCmds);
  }
}
