const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('announcement')
        .setDescription("Send eggman's announcement"),
    async execute(interaction) {
        await interaction.reply(`I've come to make an announcement; Discord's a bitch ass motherfucker, it pissed on my fucking username. That's right, it took its blurple stupid blog out and it pissed on my fucking username, and it said the improvements were "This big" and I said that's completely untrue, so I'm making a callout post on my revolt dot chat, Discord, the new username system is terrible, it's the same as twitter except WAY worse, and guess what? Here's what my username looks like: PFFFT, THAT'S RIGHT, BABY. ALL LETTERS, NO NUMBERS, NO CASE SENSITIVITY. Look at that, it looks like two strings and a hashtag. It fucked my username so guess what? I'm gonna fuck the platform. THAT'S RIGHT THIS IS WHAT YOU GET, MY SUPER NITRO CANCELLATION! Except I'm not gonna just cancel my nitro. I'm gonna go higher. I'M PISSING ON THE DEVS! HOW DO YOU LIKE THAT, JASON? I PISSED ON THE DEVS YOU IDIOT! YOU HAVE 23 HOURS BEFORE THE REFUND REQUEST GOES THROUGH, NOW GET OUT OF MY FUCKING WALLET BEFORE I PISS ON YOU TOO.`);
    },
};