const { Collection, MessageEmbed } = require("discord.js");
const fs = require("fs").promises;
const config = require("./config.js");

const loadFiles = async (path, handler) => {
    const folders = await fs.readdir(path);
    const fileLoadPromises = folders.flatMap(folder =>
        fs.readdir(`${path}/${folder}`)
        .then(files => files.filter(file => file.endsWith('.js')))
        .then(files => files.map(file => handler(require(`${path}/${folder}/${file}`))))
    );
    await Promise.all(fileLoadPromises);
};

const loadCommands = async client => {
    client.commands = new Collection();
    await loadFiles('./commands', command => client.commands.set(command.data.name, command));
};

const loadEvents = async client => {
    const eventFiles = (await fs.readdir('./events')).filter(file => file.endsWith('.js'));
    await Promise.all(eventFiles.map(file => {
        const event = require(`./events/${file}`);
        const eventMethod = event.once ? 'once' : 'on';
        client[eventMethod](event.name, (...args) => event.run(...args, client));
    }));
};

const logError = async (client, type, error) => {
    console.error(error.stack);
    const embed = new MessageEmbed()
        .setTitle(`ERROR - ${type}`)
        .setDescription(`\`\`\`\n${error.stack}\n\`\`\``)
        .setColor('RED')
        .setTimestamp();
    try {
        const channel = await client.channels.fetch(config.logch.error);
        if (channel) channel.send({ embeds: [embed] });
    } catch (err) {
        console.error('Error logging to channel:', err);
    }
};

module.exports = { loadCommands, loadEvents, logError };