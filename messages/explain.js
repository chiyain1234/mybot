const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const isExplanationCommand = (content) => {
    const normalized = content.toLowerCase().replace(/\s+/g, "");
    return /(?:\解説|explain)/i.test(normalized);
};

const extractExplanationText = (content) => {
    const match = content.match(/(?:解説|explain)\s*(.+)/i);
    return match ? match[1].trim() : null;
};

const handleExplanation = async (message) => {
    if (message.author.bot || !message.mentions.has(message.client.user) || !isExplanationCommand(message.content)) return false;

    try {
        await message.channel.sendTyping();

        const directText = extractExplanationText(message.content);
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

        const text = hasDirectText
            ? directText
            : repliedText;

        const imageUrl = hasDirectText
            ? (hasAttachmentImage || null)
            : (attachmentImage?.url || repliedImage || null);

        if (!text && !imageUrl) {
            await message.reply("解説するテキストまたは画像が見つかりませんでした。");
            return true;
        }

        const prompt = text
            ? `以下の内容${imageUrl ? "と画像" : ""}について、初心者にも分かりやすく日本語で解説してください。\n\n【内容】\n${text}`
            : `この画像の内容を初心者にも分かりやすく日本語で解説してください。`;

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
                    content: "あなたは分かりやすく説明する解説者です。常に日本語で、簡潔かつ正確に答えてください。",
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

        const result = chatCompletion.choices[0]?.message?.content || "解説に失敗しました。";

        // 空白行を除外し、各行に "-# " を追加
        const formattedResult = result
            .split("\n")
            .filter(line => line.trim() !== "")
            .map(line => `-# ${line}`)
            .join("\n");

        await message.reply({ content: formattedResult });

        return true;
    } catch (error) {
        console.error("解説エラー:", error);
        await message.reply("解説中にエラーが発生しました。");
        return true;
    }
};

module.exports = { handleExplanation };
