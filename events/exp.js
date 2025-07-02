const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const handleExplain = async (message) => {
    if (message.author.bot || !message.mentions.has(message.client.user)) return false;

    const match = message.content.match(/(?:とは|って何)(?:？|\?)?$/);
    if (!match) return false;

    const topic = message.content
        .replace(/<@!?(\d+)>/, "") // メンション除去
        .replace(/[\s\n]+/g, "")
        .replace(/とは.*$/, "")
        .trim();

    if (!topic) {
        await message.reply("何について説明すればいいか教えてね！");
        return true;
    }

    try {
        await message.channel.sendTyping();

        const prompt = `「${topic}」とは何か、日本語でわかりやすく簡潔に説明してください。初心者向けにやさしい表現でお願いします。`;

        const res = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 512,
            messages: [
                { role: "system", content: "あなたは初心者向けに丁寧でやさしい説明をするアシスタントです。" },
                { role: "user", content: prompt }
            ]
        });

        const explanation = res.choices[0]?.message?.content || "説明できませんでした。";
        await message.reply(`${message.author.toString()}\n${explanation}`);
        return true;
    } catch (err) {
        console.error("説明エラー:", err);
        await message.reply("説明中にエラーが発生しました。");
        return true;
    }
};

module.exports = { handleExplain };
