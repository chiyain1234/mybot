const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const handleLookup = async (message) => {
    if (message.author.bot || !message.content.startsWith(".lookup")) return false;

    const args = message.content.split(/\s+/);
    let targetId;

    if (args[1]) {
        // メンション形式（<@123> や <@!123>）の対応
        const mentionMatch = args[1].match(/^<@!?(\d+)>$/);
        if (mentionMatch) {
            targetId = mentionMatch[1];
        } else if (/^\d+$/.test(args[1])) {
            targetId = args[1];
        } else {
            await message.reply("正しいユーザーIDまたはメンションを指定してください。例: `.lookup 123456789012345678` または `.lookup @ユーザー`");
            return true;
        }
    } else {
        // 引数がなければ実行者を対象
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

        const combinedText = collectedMessages.join(" ");
        const textWithoutLinks = combinedText.replace(/https?:\/\/\S+/g, "");

        const wordCounts = {};
        textWithoutLinks
            .replace(/[^\p{L}\p{N}_]+/gu, " ")
            .split(/\s+/)
            .filter(word =>
                word.length >= 2 &&
                /^[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]+$/u.test(word)
            )
            .forEach(word => {
                wordCounts[word] = (wordCounts[word] || 0) + 1;
            });

        const sortedWords = Object.entries(wordCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        const wordList = sortedWords
            .map(([word, count], index) => `${index + 1}位: ${word}（${count}回）`)
            .join("\n");

        const prompt = `以下は、あるユーザーの発言から抽出した頻出単語のランキングです。\n` +
            `英数字・リンクは除外済みで、日本語（ひらがな・カタカナ・漢字）のみを対象にしています。\n` +
            `次のフォーマットに厳密に従って、**ランキング形式のみで**結果を出力してください。\n` +
            `説明や分析は不要です。\n\n` +
            `【出力形式の例】\n` +
            `1位: ○○（n回）\n` +
            `2位: ○○（n回）\n` +
            `…（以下略）\n\n` +
            `【頻出ワードランキング】\n${wordList}`;

        const chatCompletion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: "あなたは分析力に優れたアシスタントです。日本語で簡潔かつ鋭い分析をしてください。",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.6,
            max_tokens: 800,
        });

        const result = chatCompletion.choices[0]?.message?.content || "分析に失敗しました。";

        await message.reply({ content: result });

        return true;
    } catch (error) {
        console.error("lookupエラー:", error);
        await message.reply("ユーザー発言の分析中にエラーが発生しました。");
        return true;
    }
};

module.exports = { handleLookup };
