# Discord commands over HTTP

Slash commands now arrive at `POST /discord/interactions`. There is no Discord
Gateway connection or bot singleton database lock. Passenger can start the web
application when Discord sends a command, just as it does for a website visit.

## Deploy and configure

1. In the Discord Developer Portal, open the existing application's **General
   Information** page and copy its **Public Key**.
2. Set `DISCORD_PUBLIC_KEY` to that 64-character hexadecimal value in the cPanel
   application's environment. This is the public key, not the bot token or client
   secret. Keep the existing database environment settings.
3. Run `npm install` and `npm run build`, deploy the code and built output, and
   restart the cPanel application. Stop any separately running old Gateway bot
   process as part of the migration.
4. Set the application's **Interactions Endpoint URL** to
   `https://uiucriichi.web.illinois.edu/discord/interactions` and save it. Discord
   checks the endpoint with a signed PING and invalid-signature probes. The route
   must be publicly reachable over HTTPS without login or redirect interception.
5. Try `/help`, `/website`, `/semesters show`, and a valid `/result` in a test
   environment. Check that names, results, and private responses behave as expected.
   Let the application go idle, then try another command to check cold-start timing.

Existing registered slash commands remain registered; switching delivery does not
require re-registering them. `DISCORD_TOKEN` and `DISCORD_CLIENT_ID` are only needed
when registering command definitions. The existing `DEPLOY_COMMANDS=1` startup
option still registers guild commands; `DISCORD_GUILD_ID` overrides the existing
club guild ID. Leave `DEPLOY_COMMANDS` unset or `0` during normal operation so cold
starts do not repeatedly clear and register commands.

A missing or invalid `DISCORD_PUBLIC_KEY` disables only this endpoint with HTTP 503
and logs a startup warning; the rest of the website still starts.

## Response lifecycle and hosting limits

The endpoint verifies Ed25519 signatures over the exact raw body before parsing
JSON or executing commands. PING receives an inline JSON PONG. Command replies and
deferrals use Discord's interaction callback API; edits and follow-ups use the
interaction webhook token, without a bot login. Private reply flags are preserved.
Player mentions are rendered without sending notifications.

Commands that query the database defer before database work. The incoming HTTP
request stays open until the command finishes, then returns an empty HTTP 202 as
specified by Discord for out-of-band callback responses. This keeps work attached
to an active Passenger request instead of leaving it running after the HTTP
response ends. A reverse proxy timeout, forced process termination, or host
resource limit can still interrupt that request.

Discord requires an initial reply or deferral within **3 seconds**, including
cold-start time and the outbound callback request. Deferring permits edits and
follow-ups for up to **15 minutes**; it does not extend the initial deadline.
Measure this on the actual cPanel host after idle shutdown. If startup is too slow,
ask the host about keeping an application instance warm or place a fast external
interaction handler in front of the application. HTTP delivery does not guarantee
that an arbitrarily slow cold start can satisfy Discord's deadline.

## Verification

Run `npm run test:discord`. Tests generate local Ed25519 keys and use a mock Discord
REST transport; they do not connect to Discord or require a database. They cover
signature failures, PING, command dispatch, deferred responses, request lifetime,
error responses, option resolution, and private follow-ups. Production credentials
and Developer Portal validation still need to be checked during deployment.

References:

- [Discord endpoint setup and signature verification](https://docs.discord.com/developers/interactions/overview)
- [Discord callbacks, response deadlines, and follow-ups](https://docs.discord.com/developers/interactions/receiving-and-responding)
