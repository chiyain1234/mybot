/* const { MessageEmbed } = require("discord.js");
const { Client } = require('unb-api');
const unb = new Client(process.env.UNB_TOKEN);

const bumpNotification = async (client, message) => {
    const keyword = 'をアップしたよ';

    if (message.author.id === '761562078095867916' || message.author.id === '302050872383242240') {
        const channelId = message.channel.id;
        const messageId = message.id;

        try {
         const fetchedMessage = await waitForEmbed(client, channelId, messageId);
            if (fetchedMessage && fetchedMessage.embeds.length > 0) {
                const embedDescription = fetchedMessage.embeds[0].description || "";
                const embedField = (fetchedMessage.embeds[0] && fetchedMessage.embeds[0].fields[0] && fetchedMessage.embeds[0].fields[0].name) 
                ? fetchedMessage.embeds[0].fields[0].name 
                : "TEST"; // ここに代わりの値を指定
                if (embedDescription.includes(keyword)||embedField.includes(keyword)) {
                    if (fetchedMessage.interaction) {
                        const user = fetchedMessage.interaction.user.id;
                        const guildId = fetchedMessage.guild.id;

                        const randomNumber = getRandomInt(50, 150);
                        const userBalance = await unb.getUserBalance(guildId, user);
                        const addMoney = Math.floor(randomNumber * 0.0001 * userBalance.total);

                        await unb.editUserBalance(guildId, user, { cash: addMoney });

                        const member = await client.users.fetch(user);
                        const avatarUrl = member.displayAvatarURL({ dynamic: true, size: 1024 });

                        const Embed = new MessageEmbed()
                            .setColor("0xd2b48c")
                            .setTitle("Up!")
                            .setDescription(`<@${member.id}> は \`/${fetchedMessage.interaction.commandName}\` 報酬で <:oyo_coin:1296975543140483103>${addMoney.toLocaleString()} (${(randomNumber * 0.01).toFixed(2)}%) を獲得しました！`)
                            .setAuthor({ name: `${client.user.tag}`, iconURL: `${client.user.displayAvatarURL()}`, url: '' })
                            .setThumbnail(avatarUrl)
                            .setTimestamp();

                        return message.reply({ content: `<@${member.id}>`, embeds: [Embed] });
                    } else {
                        console.error("fetchedMessageにinteractionがありません");
                    }
                }
            }
        } catch (error) {
            console.error(error);
        }
    }
};

// ランダムな整数を生成する関数
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


// embeds が表示されるまで待機する関数
const waitForEmbed = async (client, channelId, messageId, maxTries = 10, delay = 500) => {
    let tries = 0;

    while (tries < maxTries) {
        const fetchedMessage = await client.channels.cache.get(channelId).messages.fetch(messageId);

        if (fetchedMessage.embeds.length > 0) {
            return fetchedMessage; // embeds が見つかったらメッセージを返す
        }

        // 待機時間を設定
        await new Promise(resolve => setTimeout(resolve, delay));
        tries++;
    }

    return null; // embeds が見つからなかった場合
};

module.exports = {
    bumpNotification,
};
//
*/