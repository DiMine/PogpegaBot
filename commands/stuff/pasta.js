const { SlashCommandBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose(); // Interact with .db files
const copypastas = new sqlite3.Database('CopypastaLibrary.sqlite3'); // Object to store the copypasta library
var similarity = require('string-similarity'); // Npm package to detect the similarity between strings

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pasta')
        .setDescription('Access the copypasta library')
        .addSubcommand(subcommand =>
            subcommand
                .setName('random')
                .setDescription('Get a random copypasta'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('search')
                .setDescription('Search for a copypasta')
                .addStringOption(option =>
                    option.setName('query')
                        .setDescription('What to search for')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('legacysearch')
                .setDescription('Search for a copypasta using the legacy search algorithm (not recommended)')
                .addStringOption(option =>
                    option.setName('query')
                        .setDescription('What to search for')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('length')
                .setDescription('Get the number of copypastas in the library')),
    async execute(interaction)
    {
        if (interaction.options.getSubcommand() === 'random')
        {
            copypastas.get('SELECT * FROM copypastas ORDER BY RANDOM() LIMIT 1', (errr, row) =>
            {
                if (errr) console.error(errr);
                interaction.reply(row.pasta);
            });
        }
        else if (interaction.options.getSubcommand() === 'search')
        {
            copypastas.all("SELECT * FROM copypastas WHERE pasta LIKE '%' || ? || '%'", interaction.options.getString('query').replace(/\s/g, '%'), (errr, rows) =>
            {
                if (errr) console.error(errr);
                if (rows.length == 0) interaction.reply("No copypastas found <:reeferSad:1114360913718411354>");
                else interaction.reply(rows[0].pasta);
            });
        }
        else if (interaction.options.getSubcommand() === 'legacysearch')
        {
            query = interaction.options.getString('query')
            copypastas.all("SELECT * FROM copypastas", (errr, rows) =>
            {
                if (errr) console.error(errr);
                var pastaResult = "";
                pastaResult = similarity.findBestMatch(query, rows.map(a => a.pasta));
                interaction.reply(pastaResult.bestMatch.target);
            });
        }
        else if (interaction.options.getSubcommand() === 'length')
        {
            copypastas.get("SELECT COUNT(*) AS count FROM copypastas", (errr, row) =>
            {
                if (errr) console.error(errr);
                interaction.reply("There are " + row.count + " copypastas in the library");
            });
        }
    },
};