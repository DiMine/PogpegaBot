const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pogpega')
        .setDescription('Pogpega'),
    async execute(interaction)
    {
        await interaction.reply('POGPEGA FARMING');
    },
};