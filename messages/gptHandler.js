const { MessageEmbed, MessageAttachment, WebhookClient } = require('discord.js');
const Groq = require('groq-sdk');

const AIchannel = "1307306863460749344"; // 通常の要約チャンネル
const globalSummarizeChannel = "1315280901898375248"; // すべての人に対して要約を行うチャンネル
const translationChannel = "1317167346317787176"; // 英語翻訳を行う特定のチャンネル
const pseudoChineseChannel = "1320353316160405505"; // 偽中国語変換を行うチャンネル
const globalWebhookUrl = process.env.WEB; // Webhook URL
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// グローバルウェブフッククライアント
const globalWebhookClient = new WebhookClient({ url: globalWebhookUrl });

const targetUserIds = ["1087145168374861845", "1261503592016248845"]; // 特定のユーザーID

const handleMessage = async (message) => {
    if (message.author.bot || message.author.system) return;

    const isSummarizeThread = message.channel.isThread() && message.channel.name.toLowerCase().includes("#要約");
    const shouldSummarize =
        (message.channel.id === AIchannel && targetUserIds.includes(message.author.id)) ||
        (message.channel.id === globalSummarizeChannel) ||
        isSummarizeThread;

    const hasImage = message.attachments.size > 0 && message.attachments.first()?.contentType?.startsWith("image/");
    const content = message.content?.trim().replace(/[「」]/g, "");

      if (message.channel.id === pseudoChineseChannel) {
        const pseudoChineseText = await convertToPseudoChinese(content);
        await sendPseudoChineseWebhookMessage(message, pseudoChineseText);
        return;
    }
  
        // 翻訳が必要なチャンネルでメッセージが送信された場合
        if (message.channel.id === translationChannel) {
            const translatedText = await translateToEnglish(content);
            await sendTranslatedWebhookMessage(message, translatedText);
        }
    // 要約条件に合致しない場合は終了
    if (!shouldSummarize) return;

    try {

        // スレッド名に基づいて「意味を反転する」か通常の要約かを分ける
        let summary;
        if (isSummarizeThread) {
            summary = await reverseMeaning(content);
        } 
        else if (content) {
            summary = await summarizeText(content);
        }

        // グローバル要約チャンネルの場合
        if (message.channel.id === globalSummarizeChannel) {
            await sendGlobalWebhookMessage(message, summary);
        } else if (message.channel.id === AIchannel) {
            await sendWebhookForTargetUser(message, summary);
        } else {
            await sendEmbed(message, summary, hasImage);
        }

    } catch (error) {
        console.error("メッセージ処理中にエラーが発生しました:", error);
    }
};





const convertToPseudoChinese = async (text) => {
    const chatCompletion = await groq.chat.completions.create({
        messages: [
            { role: "system", content: `与えられた文章を標準語に直し、小中学校で学ぶ教育漢字のみを使って漢字のみの文章を作って。平仮名や片仮名を用いてはいけません。変換結果だけを送信してください。例は「明日どこに行きますか？」「貴方明日何処行？」に変換されます。`},
            { role: "user", content: `${text}` },
        ],
        model: "llama-3.3-70b-versatile",
    });
    return chatCompletion.choices[0]?.message?.content || "翻訳に失敗しました。";
};


const sendPseudoChineseWebhookMessage = async (message, pseudoChineseText) => {
    const sendPseudoChineseWebhookClient = new WebhookClient({ url: process.env.CHINESE_WEBHOOK_URL });
    const response = pseudoChineseText.replace(/[ぁ-んァ-ン]/g, '');
    
    const attachments = message.attachments.map(attachment => attachment.url); // 添付ファイルURLを配列で取得
    
    try {
        await sendPseudoChineseWebhookClient.send({
            ...(response ? { content: response || "()" } : {}),
            username: message.member?.nickname || message.author.globalName,
            avatarURL: message.author.displayAvatarURL({ dynamic: true }),
            files: attachments.length > 0 ? attachments : undefined, // 添付ファイルがあれば送信
        });

        // 元のメッセージを削除
        await message.delete();
    } catch (error) {
        console.error("Webhook送信中にエラーが発生しました:", error);
    }
};






const translateToEnglish = async (text) => {
    const chatCompletion = await groq.chat.completions.create({
        messages: [
            { role: "system", content: `You are a translation expert. Please translate the following Japanese text into English.` },
            { role: "user", content: `次の文章の英訳結果だけを出力してください。 \n「 ${text} 」` },
        ],
        model: "llama-3.3-70b-versatile",
    });

    return chatCompletion.choices[0]?.message?.content || "翻訳に失敗しました。";
};


const sendTranslatedWebhookMessage = async (message, translatedText) => {
    const translatedWebhookClient = new WebhookClient({ url: process.env.TRANSLATED_WEBHOOK_URL });
    
    const attachments = message.attachments.map(attachment => attachment.url); // 添付ファイルURLを取得
    
    try {
        await translatedWebhookClient.send({
            ...(translatedText ? { content: translatedText || "()"  } : {}),
            username: message.member?.nickname || message.author.globalName,
            avatarURL: message.author.displayAvatarURL({ dynamic: true }),
            files: attachments.length > 0 ? attachments : undefined, // 添付ファイルがあれば送信
        });

        // 元のメッセージを削除
        await message.delete();
    } catch (error) {
        console.error("Webhook送信中にエラーが発生しました:", error);
    }
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

// AIによる意味を反転する処理
const reverseMeaning = async (text) => {
    const chatCompletion = await groq.chat.completions.create({
        messages: [
            { 
                role: "system", 
                content: `You are a Japanese language expert. Your task is to take the following message and change its meaning to the opposite in Japanese only. If you can't reverse the meaning, just send the text as is.` 
            },
            { 
                role: "user", 
                content: `You should output a message with the opposite meaning concisely and clearly.\n${text}` 
            },
        ],
        model: "llama-3.3-70b-versatile",
    });
    return chatCompletion.choices[0]?.message?.content || "意味の反転に失敗しました。";
};

// AIによる画像説明処理
const describeImage = async (imageUrl) => {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "この画像を500字以内で日本語で説明して。" },
                        { type: "image_url", image_url: { url: imageUrl } },
                    ],
                },
            ],
            model: "llama-3.2-90b-vision-preview",
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

// Embedの送信（通常の要約チャンネル用）
const sendEmbed = async (message, description, includeImage) => {
    const embed = new MessageEmbed()
        .setAuthor({
            name: message.author.username,
            iconURL: message.author.displayAvatarURL({ dynamic: true }),
        })
        .setColor('#FFFFFF')
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .setDescription(description || "(メッセージ無し)")
        .setTimestamp();

    const options = { embeds: [embed] };

    if (includeImage) {
        const attachment = message.attachments.first();
        const file = new MessageAttachment(attachment.url, 'image.png');
        embed.setImage('attachment://image.png');
        options.files = [file];
    }

    await message.channel.send(options);
    await message.delete();
};

// Webhookメッセージの送信（グローバル要約チャンネル用）
const sendGlobalWebhookMessage = async (message, description) => {
    const attachments = message.attachments.map(attachment => attachment.url); // 添付ファイルURLを取得

    try {
        await globalWebhookClient.send({
            ...(description ? { content: description || "()"  } : {}), // descriptionが存在する場合のみcontentを含める
            username: message.member?.nickname || message.author.globalName,
            avatarURL: message.author.displayAvatarURL({ dynamic: true }),
            files: attachments.length > 0 ? attachments : undefined, // 添付ファイルがあれば送信
        });

        // 元のメッセージを削除
        await message.delete();
    } catch (error) {
        console.error("Webhook送信中にエラーが発生しました:", error);
    }
};


const sendWebhookForTargetUser = async (message, summarizedText, hasImage) => {
    const shouldSummarize = message.channel.id === AIchannel && targetUserIds.includes(message.author.id);

    if (!shouldSummarize) return;

    const userWebhook = new WebhookClient({ url: process.env.USER_WEBHOOK_URL });
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



module.exports = { handleMessage };
