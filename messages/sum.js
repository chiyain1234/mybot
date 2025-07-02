const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const handleSumCommand = async (message) => {
    if (message.author.bot || !message.content.startsWith(".sum")) return false;

    try {
        await message.channel.sendTyping();

const messages = [];
let lastMessageId = null;

while (messages.length < 200) {
    const fetched = await message.channel.messages.fetch({
        limit: 100,
        ...(lastMessageId && { before: lastMessageId })
    });

    if (fetched.size === 0) break;

    messages.push(...fetched.values());
    lastMessageId = fetched.last().id;
}

// フィルタと逆順は元のまま
const contents = messages
    .filter(msg => !msg.author.bot && msg.content.trim().length > 0)
    .map(msg => msg.content)
    .reverse();


        if (contents.length === 0) {
            await message.reply("要約する会話内容が見つかりませんでした。");
            return true;
        }

        const conversationText = contents.join("\n");

        const prompt = `
以下は、Discord チャンネルで行われた直近の会話です。
この会話の内容がどのようなトピックについて話されていたかを短くまとめてください。
会話の要点、話題、意見のやり取りなどが分かるように詳細に日本語で要約してください。

【会話ログ】
${conversationText}
`;

        const chatCompletion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: "あなたは優れた日本語要約アシスタントです。内容を端的に要約してください。",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.5,
            max_tokens: 600,
        });

        const summary = chatCompletion.choices[0]?.message?.content || "要約に失敗しました。";

        await message.reply({ content: summary });

        return true;
    } catch (error) {
        console.error("要約エラー:", error);
        await message.reply("会話の要約中にエラーが発生しました。");
        return true;
    }
};

module.exports = { handleSumCommand };
