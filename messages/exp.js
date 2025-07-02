const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// 文末にピリオドがあり、メンションされた場合のみ処理
const isExplainCommand = (content) => content.endsWith(".");

// 直接メッセージからのテキスト抽出
const extractText = (content) => content.replace(/<@!?(\d+)>/, "").trim();

const handleExplain = async (message) => {
    if (message.author.bot || !message.mentions.has(message.client.user)) return false;

    const content = message.content.replace(/<@!?(\d+)>/, "").trim();

    // 文末にピリオドがない場合は無視
    if (!content.endsWith(".")) return false;

    const textToExplain = content.slice(0, -1).trim(); // 最後のピリオドを取り除く

    if (!textToExplain) {
        await message.reply("説明する内容が見つかりませんでした。");
        return true;
    }

    try {
        await message.channel.sendTyping();

        // 画像が添付されている場合のURL取得
        const attachmentImage = message.attachments.find(att => att.contentType?.startsWith("image/"));
        const imageUrl = attachmentImage ? attachmentImage.url : null;

        const prompt = textToExplain;

        const messages = imageUrl
            ? [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { type: "image_url", image_url: { url: imageUrl } },
                    ],
                },
            ]
            : [
                {
                    role: "system",
                    content: "あなたは明確で簡潔な説明を行うアシスタントです。",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ];

        const model = imageUrl
            ? "meta-llama/llama-4-scout-17b-16e-instruct"
            : "llama-3.3-70b-versatile";

        const res = await groq.chat.completions.create({
            messages,
            model,
            temperature: 0.7,
            max_tokens: 512,
        });

        const explanation = res.choices[0]?.message?.content || "説明に失敗しました。";
        await message.reply(explanation);
        return true;

    } catch (err) {
        console.error("説明エラー:", err);
        await message.reply("説明中にエラーが発生しました。");
        return true;
    }
};

module.exports = { handleExplain };
