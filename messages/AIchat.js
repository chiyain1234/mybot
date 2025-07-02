const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const AIchannel = "1319619768151572542";

// AIによる画像説明処理
const describeImage = async (imageUrl, userPrompt) => {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: userPrompt || "この画像を200字以内で日本語で説明して。" },
                        { type: "image_url", image_url: { url: imageUrl } },
                    ],
                },
            ],
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            temperature: 1,
            max_tokens: 1024,
            top_p: 1,
        });

        return chatCompletion.choices[0]?.message?.content || "画像の説明に失敗しました。";
    } catch (error) {
        console.error("画像の説明処理中にエラーが発生しました:", error);
        return "画像の説明に失敗しました。";
    }
};

// メッセージ処理
const AIchat = async (message) => {
    if (message.author.bot) return;
    if (message.channel.id !== AIchannel) return;

    // 画像が送信された場合
    if (message.attachments.size > 0) {
        const imageAttachment = message.attachments.first();
        console.log("受け取った画像:", imageAttachment);

        const isImage =
            imageAttachment.contentType?.startsWith("image/") ||
            /\.(png|jpe?g|gif|webp|heic|heif)$/i.test(imageAttachment.url);

        if (imageAttachment && isImage) {
            message.channel.sendTyping();

            // メッセージが空か空白だけの場合はデフォルトプロンプトにする
            let userPrompt = message.content?.trim();
            if (!userPrompt || userPrompt.length === 0) {
                userPrompt = "この画像を200字以内で日本語で説明して。";
            }

            const description = await describeImage(imageAttachment.url, userPrompt);
            return message.reply({ content: description });
        } else {
            console.log("画像が無効または未対応の形式です。");
        }
    }

    const contents = message.content;

    // 「.」で始まるメッセージは無視
    if (contents.startsWith(".")) return;

    const isEnglish = contents.includes("-en");
    const cleanedContents = contents.replace("-en", "").trim();

    message.channel.sendTyping();

    const systemMessage = isEnglish
        ? "You will answer in English."
        : "あなたはAIです。あなたはすべて日本語で答えます。";

    const chatCompletion = await groq.chat.completions.create({
        messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: cleanedContents },
        ],
        model: "llama-3.3-70b-versatile",
    });

    const response = chatCompletion.choices[0]?.message?.content || "";
    await message.reply({ content: response });
};

module.exports = { AIchat };
