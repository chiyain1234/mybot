const { MessageEmbed, Permissions } = require("discord.js");

const createErrorEmbed = (client, description, interaction) => {
    return new MessageEmbed()
        .setTitle("エラー")
        .setDescription(description)
        .setColor("RED")
        .setAuthor({ name: `${client.user.tag}`, iconURL: `${client.user.displayAvatarURL()}` })
        .setTimestamp()
        .setFooter({ text: interaction.toString() });
};

const checkConditions = (command, interaction, client) => {
    if (!client || !client.user) {
        console.error("Client object or client.user is undefined");
        return false;
    }

    const subcommandName = interaction.options.getSubcommand(false);
    const subcommand = command.subcommands?.find(subcmd => subcmd.data.name === subcommandName);

    const target = subcommand || command;

    if (target.guildOnly && !interaction.inGuild()) {
        interaction.reply({ embeds: [createErrorEmbed(client, "このコマンドはDMでは実行できません。", interaction)], ephemeral: true });
        return false;
    }

    if (target.adminOnly && !interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
        interaction.reply({ embeds: [createErrorEmbed(client, "あなたはこのコマンドを使う権限をもっていません。\n必要な権限: **管理者 | ADMINISTRATOR**", interaction)], ephemeral: true });
        return false;
    }

    if (target.nsfwOnly && !interaction.channel.nsfw) {
        interaction.reply({ embeds: [createErrorEmbed(client, "NSFWチャンネルではないので、このコマンドは使用できません。", interaction)], ephemeral: true });
        return false;
    }

    return true;
};

module.exports = checkConditions;
