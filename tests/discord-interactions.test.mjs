import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { once } from "node:events";
import test from "node:test";
import express from "express";
import { createInteractionsRouter } from "../dist/lib/bot.js";
import { createHttpInteraction } from "../dist/lib/discord-interaction.js";

const { publicKey, privateKey } = generateKeyPairSync("ed25519");
const publicKeyHex = publicKey
  .export({ format: "der", type: "spki" })
  .subarray(-32)
  .toString("hex");
const command = {
  type: 2,
  id: "123456789012345678",
  application_id: "223456789012345678",
  token: "test-token",
  member: { user: { id: "323456789012345678", username: "tester" } },
  data: { type: 1, name: "help" },
};
function transport() {
  const calls = [];
  return {
    calls,
    async post(route, options) {
      calls.push({ method: "POST", route, ...options });
    },
    async patch(route, options) {
      calls.push({ method: "PATCH", route, ...options });
    },
  };
}
async function endpoint(t, options = {}) {
  const app = express();
  app.use(
    "/discord/interactions",
    createInteractionsRouter({ publicKey: publicKeyHex, ...options }),
  );
  app.use(express.json());
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(
    () =>
      new Promise((resolve) => {
        server.close(resolve);
        server.closeAllConnections();
      }),
  );
  return async (
    payload,
    {
      body = JSON.stringify(payload),
      signature,
      timestamp = "1793116800",
    } = {},
  ) => {
    signature ??= sign(
      null,
      Buffer.from(timestamp + body),
      privateKey,
    ).toString("hex");
    return fetch(
      `http://127.0.0.1:${server.address().port}/discord/interactions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Signature-Ed25519": signature,
          "X-Signature-Timestamp": timestamp,
        },
        body,
      },
    );
  };
}

test("signed PING succeeds; unsigned, malformed and tampered signatures fail before dispatch", async (t) => {
  let executions = 0;
  const send = await endpoint(t, { execute: async () => executions++ });
  const response = await send({ type: 1 });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { type: 1 });
  for (const signature of ["", "00", "00".repeat(64)]) {
    assert.equal((await send(command, { signature })).status, 401);
  }
  const body = JSON.stringify(command);
  const signature = sign(
    null,
    Buffer.from("1793116800" + body),
    privateKey,
  ).toString("hex");
  assert.equal(
    (await send(command, { signature, body: body + " " })).status,
    401,
  );
  assert.equal(executions, 0);
});

test("signed invalid JSON and unsupported payloads return 400", async (t) => {
  const send = await endpoint(t);
  for (const body of [
    "{",
    "null",
    JSON.stringify({ type: 3 }),
    JSON.stringify({ ...command, token: undefined }),
  ]) {
    assert.equal((await send(null, { body })).status, 400);
  }
});

test("missing public key disables the endpoint", async (t) => {
  const send = await endpoint(t, { publicKey: "" });
  assert.equal((await send({ type: 1 })).status, 503);
});

test("defers through the callback API and keeps the HTTP request active until command completion", async (t) => {
  const rest = transport();
  let release;
  const work = new Promise((resolve) => {
    release = resolve;
  });
  let acknowledged;
  const started = new Promise((resolve) => {
    acknowledged = resolve;
  });
  const send = await endpoint(t, {
    rest,
    execute: async (name, interaction) => {
      assert.equal(name, "help");
      await interaction.deferReply({ flags: 64 });
      acknowledged();
      await work;
      await interaction.editReply("Finished");
    },
  });
  let completed = false;
  const response = send(command).then((response) => {
    completed = true;
    return response;
  });
  await started;
  assert.equal(completed, false);
  assert.equal(rest.calls[0].body.type, 5);
  assert.deepEqual(rest.calls[0].body.data, { flags: 64 });
  release();
  assert.equal((await response).status, 202);
  assert.equal(rest.calls[1].method, "PATCH");
  assert.match(
    decodeURIComponent(rest.calls[1].route),
    /\/messages\/@original$/,
  );
  assert.equal(rest.calls[1].body.content, "Finished");
  assert.ok(rest.calls.every((call) => call.auth === false));
});

test("errors after defer replace the loading response", async (t) => {
  const rest = transport();
  const send = await endpoint(t, {
    rest,
    execute: async (_, interaction) => {
      await interaction.deferReply({ flags: 64 });
      throw new Error("database unavailable");
    },
  });
  assert.equal((await send(command)).status, 202);
  assert.equal(rest.calls[1].method, "PATCH");
  assert.equal(rest.calls[1].body.content, "Error while executing command.");
});

test("adapter resolves subcommands, typed options, users and ephemeral followups", async () => {
  const rest = transport();
  const interaction = createHttpInteraction(
    {
      ...command,
      data: {
        ...command.data,
        options: [
          {
            type: 1,
            name: "add",
            options: [
              { type: 3, name: "name", value: "fa26" },
              { type: 4, name: "score", value: 30000 },
              { type: 6, name: "player", value: "42" },
            ],
          },
        ],
        resolved: {
          users: {
            42: { id: "42", username: "username", global_name: "Display name" },
          },
        },
      },
    },
    rest,
  );
  assert.equal(interaction.user.id, command.member.user.id);
  assert.equal(interaction.options.getSubcommand(), "add");
  assert.equal(interaction.options.getString("name", true), "fa26");
  assert.equal(interaction.options.getInteger("score", true), 30000);
  assert.deepEqual(interaction.options.getUser("player", true), {
    id: "42",
    displayName: "Display name",
  });
  assert.throws(() => interaction.options.getInteger("name", true));
  await interaction.deferReply({ flags: 64 });
  await interaction.editReply({ content: "Saved", flags: 64 });
  await interaction.followUp({ content: "Private notice", flags: 64 });
  assert.equal(rest.calls[1].body.flags, undefined);
  assert.equal(rest.calls[2].body.flags, 64);
  assert.deepEqual(rest.calls[2].body.allowed_mentions, { parse: [] });
  await assert.rejects(
    interaction.reply({ content: "Again" }),
    /already acknowledged/,
  );
});

test("real help and unknown commands dispatch without a Gateway connection or bot token", async (t) => {
  const rest = transport();
  const send = await endpoint(t, { rest });
  assert.equal((await send(command)).status, 202);
  assert.equal(rest.calls[0].body.type, 4);
  assert.match(rest.calls[0].body.data.content, /\/result:/);
  assert.equal(rest.calls[0].body.data.flags, 64);
  assert.equal(
    (await send({ ...command, data: { type: 1, name: "unknown" } })).status,
    202,
  );
  assert.equal(rest.calls[1].body.data.content, "Unknown command.");
});

test("real result validation stays private and does not access the database", async (t) => {
  const rest = transport();
  const send = await endpoint(t, { rest });
  const options = [1, 2, 3, 4].flatMap((index) => [
    { type: 6, name: `player${index}`, value: "42" },
    { type: 4, name: `score${index}`, value: 25000 },
  ]);
  const response = await send({
    ...command,
    data: {
      type: 1,
      name: "result",
      options,
      resolved: { users: { 42: { id: "42", username: "tester" } } },
    },
  });
  assert.equal(response.status, 202);
  assert.equal(rest.calls.length, 1);
  assert.equal(rest.calls[0].body.type, 4);
  assert.equal(rest.calls[0].body.data.flags, 64);
  assert.match(
    rest.calls[0].body.data.content,
    /distinct|unique|duplicate|different/i,
  );
});
