const { MessageEmbed } = require("discord.js");
const { Client: UnbClient } = require('unb-api');
const unb = new UnbClient(process.env.UNB_TOKEN);

// イベントのキャンセル処理
const handleDeleteEvent = async (client, event) => {
    const user = event.creator.id; // イベント作成者のID
    const guildId = event.guildId; // guildIdを使用

    try {
        // 収益の計算
        const randomPercentage = 5;
        const userBalance = await unb.getUserBalance(guildId, user);
        const revenue = Math.floor((randomPercentage / 100) * userBalance.total);

        // ユーザーのバランスを更新
        await unb.editUserBalance(guildId, user, { cash: -revenue });

        const member = await client.users.fetch(user);
        const avatarUrl = member.displayAvatarURL({ dynamic: true, size: 1024 });

        // 収益ログの作成
        const logChannelId = '1298436968702541896'; // 収益ログを送信するチャンネルのID
        const logChannel = await client.channels.fetch(logChannelId);

        const embed = new MessageEmbed()
            .setColor("0xd2b48c")
            .setTitle("イベントキャンセル")
            .setAuthor({ name: `${client.user.tag}`, iconURL: `${client.user.displayAvatarURL()}` })
            .setThumbnail(avatarUrl)
            .setFooter({ text: `収益: -${revenue.toLocaleString()} (${randomPercentage}%)`, iconURL: '' })
            .setTimestamp();

        // 収益ログをチャンネルに送信
        await logChannel.send({ content: `<@${member.id}> がイベントをキャンセルしました！`, embeds: [embed] });

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
    handleDeleteEvent,
};
