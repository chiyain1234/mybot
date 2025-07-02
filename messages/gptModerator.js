const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const AIchannel = "1294663943046041681";

const handleMod = async (message) => {
    if (message.author.bot) return;

    const contents = message.content;

    if (message.channel.id === AIchannel) {
        message.channel.sendTyping();
        const chatCompletion = await groq.chat.completions.create({
            messages: [{
                    "role": "system",
                    "content": "日本語で回答してください。",
                }, {
                    role: "user",
                    content: "discord.js v13のメインの index.js コードを生成してください。discord token, Guild IDはそれぞれ process.env.TOKEN, process.env.GUILD から取得するつもりです。また、モジュールはdiscord.jsのみを使用します。Intentsの指定はintents: [Intents.FLAGS.GUILDS,Intents.FLAGS.GUILD_MESSAGES,Intents.FLAGS.GUILD_VOICE_STATES,Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,Intents.FLAGS.GUILD_INTEGRATIONS,Intents.FLAGS.GUILD_INVITES,Intents.FLAGS.GUILD_MESSAGE_REACTIONS,Intents.FLAGS.GUILD_MESSAGES]でお願いします。また生成するコードは```と```で括って表示してください。discordに送信するメッセージはconst { MessageEmbed } をdiscord.jsから読み込んでembedを使えるようにしてください。以下に実現したいことを言います。" +
                        "\n" +
                        contents,
                },

                {
                    "role": "assistant",
                    "content": "```json"
                }

            ],
            model: "llama-3.3-70b-versatile",
            "stop": "```"
        });
        const response = chatCompletion.choices[0]?.message?.content || "";
        console.log(response);
        try {
            const result = await executeCode(response, message);
          console.log("e" + result)
            const consoleMessage = result.output.join("\n"); // capture the output from console.log

            if (result.success) {
                await message.reply(`完了: ${consoleMessage}`);
            } else {
                await message.reply(`Processing...: ${consoleMessage}`);
            }
        } catch (error) {
            await message.reply(`エラーが発生しました: ${error.message}`);
        }
    }
};

const executeCode = async (code, message) => {
    let success = false;
    const originalLog = console.log;
    let output = [];
    console.log = function (...args) {
        output.push(args.join(' ')); // capturing console.log output
    };

    try {
        await eval(code); // Execute the generated code
        success = true;
    } catch (error) {
        output.push(`エラーが発生しました: ${error.message}`); // Capturing any execution error
    }

    console.log = originalLog; // Restore original console.log
    console.log("Captured Output:", output);

    return { success, output };
};

module.exports = {
    handleMod,
};
