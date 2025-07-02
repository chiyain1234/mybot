const client = require('../index.js');
const config = require("../config.js");
const checkPermissions = require('./checkPermissions');
const checkCooldown = require('./checkCooldown');
const checkConditions = require('./checkConditions');
const logCommandExecution = require('./logCommandExecution');

client.on("interactionCreate", async (i) => {
    if (!i.isCommand()) return;
    const command = client.commands.get(i.commandName);
    if (!command) return;

    const subcommandName = i.options.getSubcommand(false);
    let subcommand;

    if (subcommandName) {
        subcommand = command.subcommands?.find(subcmd => subcmd.data.name === subcommandName);
    }

    if (!checkConditions(command, i, client)) return;
    if (subcommand && !checkConditions(subcommand, i, client)) return;

    if (!checkPermissions(command, i, client)) return;
    if (subcommand && !checkPermissions(subcommand, i, client)) return;

    if (!checkCooldown(command, i, client)) return;
    if (subcommand && !checkCooldown(subcommand, i, client)) return;

    client.config = config;

    try {
        if (subcommand) {
            await subcommand.execute(i, client);
        } else {
            await command.execute(i, client);
        }
        await logCommandExecution(i, client);
    } catch (error) {
        console.error(error);
    }
});
