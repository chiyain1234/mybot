const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const handleBadAnalyze = async (message) => {
    if (message.author.bot || !message.content.startsWith(".critical")) return false;

    const args = message.content.split(/\s+/);
    let targetId;

    if (args[1]) {
        const mentionMatch = args[1].match(/^<@!?(\d+)>$/);
        if (mentionMatch) {
            targetId = mentionMatch[1];
        } else if (/^\d+$/.test(args[1])) {
            targetId = args[1];
        } else {
            await message.reply("正しいユーザーIDまたはメンションを指定してください。例: `.critical 123456789012345678` または `.critical @ユーザー`");
            return true;
        }
    } else {
        targetId = message.author.id;
    }

    try {
        await message.channel.sendTyping();

        const guild = message.guild;
        let collectedMessages = [];

        for (const channel of guild.channels.cache.values()) {
            if (
                !channel.isText() ||
                !channel.viewable ||
                !channel.permissionsFor(guild.me)?.has("READ_MESSAGE_HISTORY")
            ) continue;

            try {
                const messages = await channel.messages.fetch({ limit: 100 });
                const userMessages = messages
                    .filter(msg => msg.author.id === targetId && !msg.author.bot)
                    .map(msg => msg.content)
                    .filter(Boolean);

                collectedMessages.push(...userMessages);

                if (collectedMessages.length >= 200) break;
            } catch (err) {
                console.warn(`チャンネル ${channel.name} の取得中にエラー:`, err.message);
                continue;
            }
        }

        collectedMessages = collectedMessages.slice(0, 200);

        if (collectedMessages.length === 0) {
            await message.reply("指定したユーザーの発言が見つかりませんでした。");
            return true;
        }

        const combinedText = collectedMessages.join("\n");

        const prompt = `以下は、あるDiscordユーザーの発言内容の抜粋です。突然の話題の転換やコマンド使用については議論しないでください．\n` + 
           `このユーザーの発言から読み取れる「表現上の欠点」や「他者とのコミュニケーションにおいて改善すべき点」を丁寧な日本語で具体的に指摘してください。\n` +
            `批判的になりすぎず、建設的かつ相手の成長を促すような視点で、5〜8点程度の改善点を挙げてください。\n` +
            `また、発言内容だけから判断できないことには言及しないでください。\n\n` +
            `【発言ログ】\n${combinedText}`;

        const chatCompletion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: "あなたはユーザーの発言から表現上の欠点や改善点を指摘する日本語アシスタントです。建設的かつ配慮ある文体で書いてください。",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 800,
        });

        const result = chatCompletion.choices[0]?.message?.content || "分析に失敗しました。";

        await message.reply({ content: result });

        return true;
    } catch (error) {
        console.error("analyzeエラー:", error);
        await message.reply("ユーザーの分析中にエラーが発生しました。");
        return true;
    }
};

module.exports = { handleBadAnalyze };
