const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// 要約判定
const isSummaryCommand = (content) => {
    const normalized = content.toLowerCase().replace(/\s+/g, "");
    return /(?:要約|summary)/i.test(normalized);
};

// 要約テキスト抽出
const extractSummaryText = (content) => {
    const match = content.match(/(?:要約|summary)\s*(.+)/i);
    return match ? match[1].trim() : null;
};

const handleSummary = async (message) => {
    if (message.author.bot || !message.mentions.has(message.client.user) || !isSummaryCommand(message.content)) return false;

    try {
        await message.channel.sendTyping();

        const directText = extractSummaryText(message.content);
        const hasDirectText = !!directText;

        // 添付画像
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

        const text = hasDirectText ? directText : repliedText;
        const imageUrl = hasDirectText ? (hasAttachmentImage || null) : (attachmentImage?.url || repliedImage || null);

        if (!text && !imageUrl) {
            await message.reply("要約するテキストまたは画像が見つかりませんでした。");
            return true;
        }

        const prompt = text
            ? `以下の内容${imageUrl ? "と画像" : ""}について、日本語で要点を簡潔に要約してください。\n\n【内容】\n${text}`
            : `この画像の内容を日本語で簡潔に要約してください。`;

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
                    content: "あなたは要点を簡潔にまとめる要約者です。常に日本語で、明瞭で短くまとめてください。",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ];

        const model = imageUrl
            ? "meta-llama/llama-4-scout-17b-16e-instruct"
            : "llama-3.3-70b-versatile";

        const chatCompletion = await groq.chat.completions.create({
            messages,
            model,
            temperature: 0.7,
            max_tokens: 1024,
        });

        const result = chatCompletion.choices[0]?.message?.content || "要約に失敗しました。";

        const formattedResult = result
            .split("\n")
            .filter(line => line.trim() !== "")
            .map(line => `-# ${line}`)
            .join("\n");

        await message.reply({
            content: `${formattedResult}`,
        });

        return true;
    } catch (error) {
        console.error("要約エラー:", error);
        await message.reply("要約中にエラーが発生しました。");
        return true;
    }
};

module.exports = { handleSummary };
