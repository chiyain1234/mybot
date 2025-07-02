const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const isFactCheckCommand = (content) => {
    const normalized = content.toLowerCase().replace(/\s+/g, "");
    return /(?:ファクトチェック|factcheck|factチェック|ふぁくとちぇっく)/i.test(normalized);
};

const extractFactCheckText = (content) => {
    const match = content.match(/(?:ファクトチェック|factcheck|factチェック|ふぁくとちぇっく)\s*(.+)/i);
    return match ? match[1].trim() : null;
};

const handleFactCheck = async (message) => {
    if (message.author.bot || !message.mentions.has(message.client.user) || !isFactCheckCommand(message.content)) return false;

    try {
        await message.channel.sendTyping();

        const directText = extractFactCheckText(message.content);
        const hasDirectText = !!directText;

        // 添付画像（コマンドメッセージ自体）
        const attachmentImage = message.attachments.find(att => att.contentType?.startsWith("image/"));
        const hasAttachmentImage = attachmentImage?.url;

        // 返信元のメッセージ
        const referencedMessage = message.reference
            ? await message.channel.messages.fetch(message.reference.messageId).catch(() => null)
            : null;

        const repliedText =
            referencedMessage?.embeds?.[0]?.description?.trim() ||
            referencedMessage?.content?.trim() || null;

        const repliedImage =
            referencedMessage?.attachments.find(att => att.contentType?.startsWith("image/"))?.url ||
            referencedMessage?.embeds?.[0]?.image?.url ||
            null;

        // 検査対象の文と画像
        const text = hasDirectText
            ? directText
            : repliedText;

        const imageUrl = hasDirectText
            ? (hasAttachmentImage || null) // 文があるときはそのメッセージの添付画像
            : (attachmentImage?.url || repliedImage || null); // 文がないならどちらかの画像を優先

        if (!text && !imageUrl) {
            await message.reply("ファクトチェックするテキストまたは画像が見つかりませんでした。");
            return true;
        }

        const prompt = text
            ? `以下の文${imageUrl ? "と画像" : ""}が事実かどうかファクトチェックしてください。事実なら「✅正しい」、誤りなら「❌誤り」としてください。また理由も日本語で詳しく解説してください。\n\n【文】\n${text}`
            : `この画像の内容が事実かどうかファクトチェックしてください。事実なら「✅正しい」、誤りなら「❌誤り」としてください。日本語で理由も説明してください。`;

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
                    content: "あなたは優秀なファクトチェッカーです。常に日本語で簡潔かつ正確に答えてください。",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ];

        const model = imageUrl ? "meta-llama/llama-4-scout-17b-16e-instruct" : "llama-3.3-70b-versatile";

        const chatCompletion = await groq.chat.completions.create({
            messages,
            model,
            temperature: 0.7,
            max_tokens: 1024,
        });

        const result = chatCompletion.choices[0]?.message?.content || "ファクトチェックに失敗しました。";
       // 空白行を除外して、各行頭に "-# " を追加
const formattedResult = result
    .split("\n")
    .filter(line => line.trim() !== "")  // 空白行を除外
    .map(line => `-# ${line}`)           // 各行頭に "-# " を追加
    .join("\n");

await message.reply({ content: formattedResult });

        return true;
    } catch (error) {
        console.error("ファクトチェックエラー:", error);
        await message.reply("ファクトチェック中にエラーが発生しました。");
        return true;
    }
};

module.exports = { handleFactCheck };
