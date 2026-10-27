import {
  APIChatInputApplicationCommandInteraction,
  ApplicationCommandOptionType,
  InteractionResponseType,
  REST,
  Routes,
} from "discord.js";

interface Message {
  content: string;
  flags?: number;
}

/** The command surface shared by HTTP interactions and the command handlers. */
export interface CommandInteraction {
  user: { id: string };
  options: {
    getString(name: string, required: true): string;
    getInteger(name: string, required: true): number;
    getUser(name: string, required: true): { id: string; displayName: string };
    getSubcommand(): string;
  };
  deferred: boolean;
  replied: boolean;
  reply(message: Message): Promise<unknown>;
  deferReply(message?: { flags?: number }): Promise<unknown>;
  editReply(message: string | Message): Promise<unknown>;
  followUp(message: Message): Promise<unknown>;
}

export function createHttpInteraction(
  payload: APIChatInputApplicationCommandInteraction,
  rest: Pick<REST, "post" | "patch">,
): CommandInteraction {
  const user = payload.member?.user ?? payload.user;
  if (!user) throw new Error("Interaction has no user.");
  const rootOptions = payload.data.options ?? [];
  const subcommand = rootOptions.find(
    (option) => option.type === ApplicationCommandOptionType.Subcommand,
  );
  const options = subcommand?.options ?? rootOptions;
  function option(name: string, type: ApplicationCommandOptionType) {
    const value = options.find((option) => option.name === name);
    if (!value || value.type !== type || !("value" in value)) {
      throw new Error(`Missing or invalid command option: ${name}`);
    }
    return value;
  }
  const messageBody = (message: string | Message) => ({
    ...(typeof message === "string" ? { content: message } : message),
    // Render player mentions without pinging players or allowing @everyone.
    allowed_mentions: { parse: [] },
  });
  const callback = (type: InteractionResponseType, data: object) =>
    rest.post(Routes.interactionCallback(payload.id, payload.token), {
      auth: false,
      body: { type, data },
    });
  const interaction: CommandInteraction = {
    user,
    options: {
      getString: (name) =>
        option(name, ApplicationCommandOptionType.String).value as string,
      getInteger: (name) =>
        option(name, ApplicationCommandOptionType.Integer).value as number,
      getUser: (name) => {
        const id = option(name, ApplicationCommandOptionType.User)
          .value as string;
        const user = payload.data.resolved?.users?.[id];
        if (!user) throw new Error(`Unresolved user option: ${name}`);
        return { id, displayName: user.global_name ?? user.username };
      },
      getSubcommand: () => {
        if (!subcommand) throw new Error("Missing subcommand.");
        return subcommand.name;
      },
    },
    deferred: false,
    replied: false,
    async reply(message) {
      if (interaction.deferred || interaction.replied)
        throw new Error("Interaction already acknowledged.");
      const result = await callback(
        InteractionResponseType.ChannelMessageWithSource,
        messageBody(message),
      );
      interaction.replied = true;
      return result;
    },
    async deferReply(message = {}) {
      if (interaction.deferred || interaction.replied)
        throw new Error("Interaction already acknowledged.");
      const result = await callback(
        InteractionResponseType.DeferredChannelMessageWithSource,
        message,
      );
      interaction.deferred = true;
      return result;
    },
    async editReply(message) {
      const body = messageBody(message);
      // Ephemerality is established by the initial reply/defer, not an edit.
      delete body.flags;
      const result = await rest.patch(
        Routes.webhookMessage(
          payload.application_id,
          payload.token,
          "@original",
        ),
        { auth: false, body },
      );
      interaction.replied = true;
      return result;
    },
    followUp: (message) =>
      rest.post(Routes.webhook(payload.application_id, payload.token), {
        auth: false,
        body: messageBody(message),
      }),
  };
  return interaction;
}
