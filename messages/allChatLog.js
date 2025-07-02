const { MessageEmbed } = require("discord.js");
const LOG_CHANNEL_ID = '1313348612956229673';

const allChatLog = async (client, message) => {
    if (message.author.bot) return;

    // ログ用チャンネルを取得
    const logChannel = message.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (!logChannel || !logChannel.isText()) return;

    const avatarUrl = message.author.displayAvatarURL({ dynamic: true, size: 1024 });

    // メッセージに添付された画像を取得
    const attachment = message.attachments.find(att => att.contentType && att.contentType.startsWith("image/"));
    const imageUrl = attachment ? attachment.url : null;

    // メッセージの情報を埋め込みにまとめる
    const embed = new MessageEmbed()
        .setAuthor({
            name: message.author.tag,
            iconURL: avatarUrl,
        })
        .setTitle('メッセージログ')
        .setColor("#ffffff")
        .setThumbnail(avatarUrl)
        .addFields(
            { name: 'チャンネル', value: `${message.channel.name} (${message.channel.id})`, inline: true },
            { name: 'ユーザーID', value: message.author.id, inline: true },
            { name: '内容', value: message.content || '*[メッセージなし]*' }
        )
        .setTimestamp();

    // 添付画像がある場合、埋め込みに追加
    if (imageUrl) {
        embed.setImage(imageUrl);
    }

    // ログチャンネルに埋め込みを送信
    logChannel.send({ embeds: [embed] });
};

module.exports = {
    allChatLog,
};
