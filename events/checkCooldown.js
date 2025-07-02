const { MessageEmbed,Collection } = require("discord.js");

const checkCooldown = (command, interaction, client) => {
    if (!client.cooldowns.has(command.name)) {
        client.cooldowns.set(command.name,  new Collection());
    }
    const timestamps = client.cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 0) * 1000;

    if (timestamps.has(interaction.user.id)) {
        const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
        if (Date.now() < expirationTime) {
            const timeLeft = (expirationTime - Date.now()) / 1000;
            const Deembed = new MessageEmbed()
                .setTitle("エラー")
                .setDescription(`クールダウン | \n**${timeLeft.toFixed(1)}**秒後にまた実行してください。`)
                .setColor("RED")
                .setAuthor({ name: `${client.user.tag}`, iconURL: `${client.user.displayAvatarURL()}` })
                .setTimestamp()
                .setFooter({ text: interaction.toString() });
            interaction.reply({ embeds: [Deembed], ephemeral: true });
            return false;
        }
    }

    if (cooldownAmount > 0) {
        timestamps.set(interaction.user.id, Date.now());
        setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
    }

    return true;
};

module.exports = checkCooldown;
