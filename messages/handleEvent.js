const { MessageEmbed } = require("discord.js");
const { Client: UnbClient } = require('unb-api');
const unb = new UnbClient(process.env.UNB_TOKEN);

const handleEvent = async (client, event) => {
    const user = event.creator.id; // イベント作成者のID
    const guildId = event.guildId; // guildIdを使用

    try {
        const randomPercentage = getRandomInt(100, 250);
        const userBalance = await unb.getUserBalance(guildId, user);
        const revenue = Math.floor((randomPercentage / 100) * userBalance.total);

        // ユーザーのバランスを更新
        await unb.editUserBalance(guildId, user, { cash: revenue });

        const member = await client.users.fetch(user);
        const avatarUrl = member.displayAvatarURL({ dynamic: true, size: 1024 });

        // 収益ログの作成
        const logChannelId = '1298436968702541896'; // 収益ログを送信するチャンネルのID
        const logChannel = await client.channels.fetch(logChannelId);

        // イベントの詳細情報を取得
        const eventName = event.name; // イベント名
        const eventDescription = event.description || "説明がありません"; // イベント説明
        const eventStartTimestamp = Math.floor(event.scheduledStartTimestamp / 1000); // 開始日時（Unix時間に変換）
        const eventEndTimestamp = event.scheduledEndTimestamp ? Math.floor(event.scheduledEndTimestamp / 1000) : null; // 終了日時（Unix時間に変換）

        // Discordのタイムスタンプフォーマット
        const eventStart = `<t:${eventStartTimestamp}:F>`; // フル形式
        const eventEnd = eventEndTimestamp ? `<t:${eventEndTimestamp}:F>` : "未定"; // フル形式または未定
        
        // 場所の取得
        const eventLocation = event.entityMetadata?.location || "場所が指定されていません"; // 場所が指定されているか確認

        const embed = new MessageEmbed()
            .setColor("0xd2b48c")
            .setTitle("イベント作成")
            .setAuthor({ name: `${client.user.tag}`, iconURL: `${client.user.displayAvatarURL()}` })
            .setThumbnail(avatarUrl)
            .setFooter({ text: `収益: +${revenue.toLocaleString()} (${randomPercentage / 100}%)`, iconURL: '' })
            .setTimestamp()
            .addFields(
                { name: "イベント名", value: eventName, inline: true }, // イベント名
                { name: "説明", value: eventDescription, inline: true }, // イベント説明
                { name: "開始日時", value: eventStart, inline: true }, // Discordのタイムスタンプフォーマット
                { name: "終了日時", value: eventEnd, inline: true }, // Discordのタイムスタンプフォーマットまたは未定
                { name: "場所", value: eventLocation, inline: true } // 場所
            );

        // 収益ログをチャンネルに送信
        await logChannel.send({ content: `<@${member.id}> が新しいイベントを作成しました！`, embeds: [embed] });

    } catch (error) {
        console.error(error);
    }
}

// ランダムな整数を生成する関数
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
    handleEvent,
};
