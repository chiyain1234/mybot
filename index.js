const { Client, Intents, Collection } = require("discord.js");
const config = require("./config.js");
const { loadCommands, loadEvents, logError } = require("./handlers.js");
const { handleMessage } = require('./messages/gptHandler');
const { handleMod } = require('./messages/gptModerator');
const { handleEvent } = require('./messages/handleEvent');
const { handleDeleteEvent } = require('./messages/handleDeleteEvent');
const { guessNumber } = require('./messages/guessNumber');
const { allChatLog } = require('./messages/allChatLog');
const { AIchat } = require('./messages/AIchat');
const { Reasoning } = require('./messages/reasoning');
const { TTS } = require('./messages/tts');
const { handleFactCheck } = require('./messages/factcheck');
const { handleExplanation } = require('./messages/explain');
const { handleSummary } = require('./messages/summarize');
const { handleExplain } = require('./messages/exp');
const { handleLookup } = require('./messages/lookup');
const { handleSumCommand } = require('./messages/sum');
const { handleAnalyze } = require('./messages/analyze');
const { handleBadAnalyze } = require('./messages/badanalyze');
const { Client: UnbClient } = require('unb-api');
const { serve } = require('@hono/node-server');
const healthCheckServer = require('./server');

const unb = new UnbClient(process.env.UNB_TOKEN);

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
        Intents.FLAGS.GUILD_INTEGRATIONS,
        Intents.FLAGS.GUILD_INVITES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_SCHEDULED_EVENTS,
        Intents.FLAGS.GUILD_MEMBERS
    ],
});

// メッセージ作成イベントで不適切な発言をチェック
client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.content) return;

    // そのほかの処理（GPT関連など）
    await AIchat(message);
    await Reasoning(message);
    await TTS(message);
    await handleMessage(message);
    await handleFactCheck(message);
    await handleExplanation(message);
    await handleSummary(message);
    await handleExplain(message);
    await handleMod(message);
    await handleLookup(message);
    await handleAnalyze(message);
    await handleSumCommand(message);
    await handleBadAnalyze(message);
    await guessNumber(client, message);
    await allChatLog(client, message);
});

client.on('guildScheduledEventCreate', async (event) => {
    await handleEvent(client, event);
});

client.on('guildScheduledEventDelete', async (event) => {
    await handleDeleteEvent(client, event);
});

client.setMaxListeners(0);
client.cooldowns = new Collection();
client.queues = new Collection();

(async () => {
    await Promise.all([loadCommands(client), loadEvents(client)]);

    process.on('uncaughtException', error => logError(client, 'uncaughtException', error));
    process.on('unhandledRejection', reason => logError(client, 'unhandledRejection', reason));

    const token = process.env.TOKEN;
    if (token) {
        client.login(token).catch(() => {
            console.error("The Bot Token You Entered Is Incorrect Or Your Bot's INTENTS Are OFF!");
        });
    } else {
        console.error("Please Provide A Valid Bot Token In The Environment Variables Or Config File!");
    }
})();
serve({
  fetch: healthCheckServer.fetch,
  port: 8000,
});
module.exports = client;
