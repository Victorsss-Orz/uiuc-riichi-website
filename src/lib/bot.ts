import "dotenv/config";
import { createPublicKey, verify } from "node:crypto";
import express from "express";
import {
  APIChatInputApplicationCommandInteraction,
  ApplicationCommandType,
  InteractionType,
  MessageFlags,
  REST,
} from "discord.js";
import {
  createHttpInteraction,
  CommandInteraction,
} from "./discord-interaction.js";

interface InteractionsOptions {
  publicKey?: string;
  rest?: Pick<REST, "post" | "patch">;
  execute?: (name: string, interaction: CommandInteraction) => Promise<unknown>;
}

/** Mount before JSON/session/site middleware: signatures cover the raw bytes. */
export function createInteractionsRouter({
  publicKey = process.env.DISCORD_PUBLIC_KEY,
  rest = new REST({ version: "10", timeout: 2500, retries: 0 }),
  execute = async (name, interaction) => {
    const { commandMap } = await import("./deploy-commands.js");
    const command = commandMap.get(name);
    if (!command) {
      return interaction.reply({
        content: "Unknown command.",
        flags: MessageFlags.Ephemeral,
      });
    }
    return command.execute(interaction);
  },
}: InteractionsOptions = {}) {
  const router = express.Router();
  const key =
    publicKey && /^[a-f\d]{64}$/i.test(publicKey)
      ? createPublicKey({
          key: Buffer.concat([
            Buffer.from("302a300506032b6570032100", "hex"),
            Buffer.from(publicKey, "hex"),
          ]),
          format: "der",
          type: "spki",
        })
      : undefined;
  if (!key)
    console.warn("Discord HTTP interactions disabled: set DISCORD_PUBLIC_KEY.");

  router.post(
    "/",
    express.raw({ type: "application/json", limit: "256kb", inflate: false }),
    async (req, res) => {
      if (!key) {
        res.status(503).send("Discord interactions are not configured.");
        return;
      }
      const signature = req.get("X-Signature-Ed25519") ?? "";
      const timestamp = req.get("X-Signature-Timestamp") ?? "";
      if (
        !Buffer.isBuffer(req.body) ||
        !/^[a-f\d]{128}$/i.test(signature) ||
        !/^\d+$/.test(timestamp) ||
        !verify(
          null,
          Buffer.concat([Buffer.from(timestamp), req.body]),
          key,
          Buffer.from(signature, "hex"),
        )
      ) {
        res.status(401).send("Invalid request signature.");
        return;
      }
      let payload;
      try {
        payload = JSON.parse(req.body.toString("utf8"));
      } catch {
        res.status(400).send("Invalid JSON.");
        return;
      }
      if (payload?.type === InteractionType.Ping) {
        res.json({ type: 1 });
        return;
      }
      if (
        payload?.type !== InteractionType.ApplicationCommand ||
        payload.data?.type !== ApplicationCommandType.ChatInput ||
        typeof payload.data.name !== "string" ||
        typeof payload.id !== "string" ||
        typeof payload.application_id !== "string" ||
        typeof payload.token !== "string" ||
        !(payload.member?.user ?? payload.user)
      ) {
        res.status(400).send("Unsupported interaction.");
        return;
      }
      const interaction = createHttpInteraction(
        payload as APIChatInputApplicationCommandInteraction,
        rest,
      );
      try {
        await execute(payload.data.name, interaction);
      } catch {
        // Do not log Discord REST errors: their request URLs contain interaction tokens.
        console.error("Discord command failed:", payload.data.name);
        try {
          const message = { content: "Error while executing command." };
          if (interaction.deferred && !interaction.replied) {
            await interaction.editReply(message);
          } else if (interaction.replied) {
            await interaction.followUp({
              ...message,
              flags: MessageFlags.Ephemeral,
            });
          } else {
            await interaction.reply({
              ...message,
              flags: MessageFlags.Ephemeral,
            });
          }
        } catch {
          console.error("Could not deliver Discord command error response.");
        }
      }
      // Acknowledge via Discord's callback API while keeping this request active
      // through command completion, so Passenger sees work rather than an idle app.
      res.status(202).end();
    },
  );
  return router;
}
