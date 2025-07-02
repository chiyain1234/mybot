const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const path = require('path');

const cmdName = 'info';
const subcommandFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.js') && file !== `0_${cmdName}.js`);
const subcommands = subcommandFiles.map(file => require(path.join(__dirname, file)));
const command = new SlashCommandBuilder()
    .setName(cmdName)
    .setDescription('Info');

subcommands.forEach(subcmd => {
    if (subcmd.data) {
        command.addSubcommand(subcmd.data);
    }
});

module.exports = {
    data: command,
    subcommands: subcommands,
    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();
        const subcommandFile = subcommands.find(subcmd => subcmd.data.name === subcommand);
        if (!subcommandFile) return;
        try {
            await subcommandFile.execute(interaction, client);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'コマンドの実行中にエラーが発生しました。', ephemeral: true });
        }
    },
};
