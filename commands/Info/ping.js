const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");

module.exports = {
    guildOnly: false,
    adminGuildOnly: true,
    data: new SlashCommandSubcommandBuilder()
        .setName("ping")
        .setDescription("ボットのPing値を測定する。"),

    async execute(i, client) {        
    const sent = await i.reply({ content: 'Pinging...', fetchReply: true });
    const timeTaken = sent.createdTimestamp - i.createdTimestamp;
    const wsPing = client.ws.ping;
        const embed = new Discord.MessageEmbed()
            .setTitle("Ping test")
            .addFields({name: "WebSocket",value:  `**${timeTaken} ms**`,inline:  true})
            .addFields({name: "Round-trip latency",value:  `**${wsPing} ms**`, inline: true})
            .setColor(client.config.color)
            .setTimestamp();
        await i.editReply({ embeds: [embed] });
    }
}