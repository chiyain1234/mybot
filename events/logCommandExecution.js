const { MessageEmbed } = require("discord.js");
const config = require("../config.js");

const logCommandExecution = async (i, client) => {
    const group = i.options._group ? ` ${i.options._group}` : "";
    const subcommand = i.options._subcommand ? ` ${i.options._subcommand}` : "";
    
    const log = new MessageEmbed()
        .setTitle("Command log")
        .setColor("YELLOW")
        .setTimestamp()
        .setThumbnail(i.user.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: "Command", value: `\`\`\`\n${i.toString()}\n\`\`\`` },
            { name: `Server(${i.guild.memberCount})`, value: `\`\`\`\n${i.guild ? i.guild.name : "DM"}(${i.guild?.id ?? "DM"})\n\`\`\``, inline: true },
            { name: "User", value: `\`\`\`\n${i.user.tag}(${i.user.id})\n\`\`\``, inline: true },
            { name: "ID", value: `</${i.commandName}${group}${subcommand}:${i.commandId}>` })
        .setFooter({ text: String(i.commandId) });

    try {
        const channel = await client.channels.fetch(config.logch.command);
        if (channel) {
            await channel.send({ embeds: [log] });
        }
    } catch (error) {
        console.error("Failed to log command execution:", error);
    }
};

module.exports = logCommandExecution;
