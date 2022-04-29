const Discord = require('discord-user-bots');
require('dotenv').config();
const client = new Discord.Client(process.env.DISCORD_ALT_TOKEN);
client.on.ready = function() {
    console.log("Client online");
};

client.on.message_create = function(message) {
    console.log(message.content);
    if (message.channel_id === "967134443393400922" && message.author.username === "PogpegaBot") {
        client.send(
            "967134443393400922", // Channel to send in
            {
                content: message.content, // Content of the message to send (Optional when sending stickers) (Default null)
                embeds: [], // Embeds to send with your message (Not optional, must be an array, can be unset for default) (Default empty array)
                allowed_mentions: {
                    // Allow mentions settings (Not optional, but can be unset for default) (Default all true mentions object)
                    allowUsers: true, // Allow message to ping user (Default true)
                    allowRoles: true, // Allow message to ping roles (Default true)
                    allowEveryone: true, // Allow message to ping @everyone and @here (Default true)
                    allowRepliedUser: true, // If the message is a reply, ping the user you are replying to (Default true)
                },
                components: [], // Message components (Not optional, must be an array, can be unset for default) (Default empty array)
                stickers: [], // Stickers to go with your message (Not optional, must be an array, can be unset for default) (Default empty array)
            }
        );
    }
}