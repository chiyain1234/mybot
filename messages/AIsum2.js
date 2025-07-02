/* const { MessageEmbed, MessageAttachment, WebhookClient } = require('discord.js');
const Groq = require('groq-sdk');

const AIchannel = "1306236565743337472"; // 通常の要約チャンネル
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const targetUserIds = ["1004534712414519357",]; // 特定のユーザーID

const AIsum2 = async (message) => {
    if (message.author.bot || message.author.system) return;

    const shouldSummarize =
        (message.channel.id === AIchannel && targetUserIds.includes(message.author.id))

    const hasImage = message.attachments.size > 0 && message.attachments.first()?.contentType?.startsWith("image/");
    const content = message.content?.trim().replace(/[「」]/g, "");
    const summary = await summarizeText(content);
  if (message.channel.id === AIchannel) {
            await sendWebhookForTargetUser(message, summary);
  }
    if (!shouldSummarize) return;

};



// AIによる要約処理
const summarizeText = async (text) => {
    const chatCompletion = await groq.chat.completions.create({
        messages: [
            { role: "system", content: `あなたは全ての与えられたテキストを適切な日本語を用いて話し言葉で要約します。文量は元のテキストの量と比べて増えすぎず、減らしすぎないようにしてください。あなたはただ要約しさえすれば良い。質問文も要約の対象になり、あなたは答えてはいけない。そして変換結果だけを送信してください。また、要約するに値しない文、記号等は、そのまま送り返してください。言葉の解説は不要です。` },
            { role: "user", content: `以下の文章を要約してください。\n${text}` },
        ],
        model: "llama-3.3-70b-versatile",
    });
    return chatCompletion.choices[0]?.message?.content || "要約に失敗しました。";
};

const sendWebhookForTargetUser = async (message, summarizedText, hasImage) => {
    const shouldSummarize = message.channel.id === AIchannel && targetUserIds.includes(message.author.id);

    if (!shouldSummarize) return;

    const userWebhook = new WebhookClient({ url: process.env.USER_WEBHOOK_URL2 });
    const content = message.content?.trim();
    const attachments = message.attachments.map(attachment => attachment.url); // 添付ファイルURLを取得

    try {
        if (!content) {
            // 画像のみの場合
            await userWebhook.send({
                username: message.member?.nickname || message.author.globalName,
                avatarURL: message.author.displayAvatarURL({ dynamic: true }),
                files: attachments, // 添付ファイルをそのまま送信
            });
        } else {
            // 通常の要約処理
            const summarizedText = await summarizeText(content);
            await userWebhook.send({
                ...(summarizedText ? { content: summarizedText || "()" } : {}),
                username: message.member?.nickname || message.author.globalName,
                avatarURL: message.author.displayAvatarURL({ dynamic: true }),
                files: attachments.length > 0 ? attachments : undefined, // 添付ファイルがあれば送信
            });
        }

        // 元のメッセージを削除
        await message.delete();
    } catch (error) {
        console.error("Webhook送信中にエラーが発生しました:", error);
    }
};


module.exports = { AIsum2 };
*/