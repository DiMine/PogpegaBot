// Import the "Client" class from the revolt.js package
const { Client } = require("revolt.js");
// Import the values of "token" and "prefix" declared in the config.json file
require('dotenv').config(); // Use environment variables
const sqlite3 = require('sqlite3').verbose(); // Interact with .db files
const copypastas = new sqlite3.Database('CopypastaLibrary.sqlite3'); // Object to store the copypasta library

// Emote ID of the Pogpega emote
const pogpega = ":01H184R4VKBG3YAFTW16HYDKCV:";

// Create a new client instance
let client = new Client();

// Once the client is ready, this code will be executed
client.on("ready", async () =>
{
    console.info(`Logged in as ${client.user.username}!`); // Tell the console that the bot is ready
    client.api.patch("/users/@me", {
        status:
        {
            text: "Spamming Pogpega",
            presence: "Online"
        }
    });
});

client.on("messageCreate", async (message) =>
{
    if (message.content) // Check if the message has content
    {
        console.log(message.content); // Send the message to the console

        msg = message.content.trim().toLowerCase(); // Make the message lowercase
        if (msg === "pogpega")
        {
            message.react("01H184R4VKBG3YAFTW16HYDKCV");
        }
        else if (msg === pogpega.toLowerCase()) 
        {
            message.react("01H184R4VKBG3YAFTW16HYDKCV");
        }
        else if (msg.startsWith("/announcement"))
        {
            message.channel.sendMessage(`I've come to make an announcement; Discord's a bitch ass motherfucker, it pissed on my fucking username. That's right, it took its blurple stupid blog out and it pissed on my fucking username, and it said the improvements were "This big" and I said that's completely untrue, so I'm making a callout post on my revolt dot chat, Discord, the new username system is terrible, it's the same as twitter except WAY worse, and guess what? Here's what my username looks like: PFFFT, THAT'S RIGHT, BABY. ALL LETTERS, NO NUMBERS, NO CASE SENSITIVITY. Look at that, it looks like two strings and a hashtag. It fucked my username so guess what? I'm gonna fuck the platform. THAT'S RIGHT THIS IS WHAT YOU GET, MY SUPER NITRO CANCELLATION! Except I'm not gonna just cancel my nitro. I'm gonna go higher. I'M PISSING ON THE DEVS! HOW DO YOU LIKE THAT, JASON? I PISSED ON THE DEVS YOU IDIOT! YOU HAVE 23 HOURS BEFORE THE REFUND REQUEST GOES THROUGH, NOW GET OUT OF MY FUCKING WALLET BEFORE I PISS ON YOU TOO.`);
        }
        else if (msg.startsWith("/ping"))
        {
            let now = Date.now();
            message.channel.sendMessage(`:01H184RDAGV2XMDRCQ1JRGQP1X: Pinging`).then((sentMessage) =>
            {
                sentMessage.edit({ content: `Bot Latency: ${Date.now() - now}ms` })
            });
        }
        else if (msg.startsWith('/pasta')) 
        {
            let query = ''
            try 
            {
                query = message.content.substring(7).replaceAll('"', "'");
            }
            catch (outOfBounds) 
            {
                message.channel.sendMessage("This is the copypasta library. insert more info here Chatting");
            }
            if (query.toLowerCase().startsWith("length")) 
            {
                copypastas.get("SELECT COUNT(*) AS count FROM copypastas", (errr, row) =>
                {
                    if (errr) console.error(errr);
                    message.channel.sendMessage("There are " + row.count + " copypastas in the library");
                });

            }
            /*else if (query.toLowerCase().startsWith("new "))
            {
                query = query.substring(4);
                var alreadyIn = false;
                copypastas.each("SELECT * FROM copypastas", (errr, row) =>
                {
                    if (errr) console.error(errr);
                    if (similarity.compareTwoStrings(query, row.pasta) >= 0.7) alreadyIn = true;
                }, (errr, rows) =>
                {
                    if (errr) console.error(errr);
                    if (!alreadyIn)
                    {
                        copypastas.run('INSERT INTO copypastas (pasta) VALUES ("' + query + '")');
                        message.channel.sendMessage("Added copypasta to the library");
                    }
                    else client.action(target, "Pogpega Tssk " + context['display-name'] + " That copypasta is already in the library");
                });
            }*/
            else if (query.toLowerCase().startsWith("random"))
            {
                copypastas.get('SELECT * FROM copypastas ORDER BY RANDOM() LIMIT 1', (errr, row) =>
                {
                    if (errr) console.error(errr);
                    //console.log(row.pasta);
                    message.channel.sendMessage(row.pasta);
                });
            }
            else if (query.toLowerCase().startsWith("search "))
            {
                query = query.substring(7);
                copypastas.all("SELECT * FROM copypastas WHERE pasta LIKE '%' || ? || '%'", query.replace(/\s/g, '%'), (errr, rows) =>
                {
                    if (errr) console.error(errr);
                    console.log(rows);
                    /*rows.forEach(row => {
                      console.log(row);
                    });*/
                    if (rows.length == 0) message.channel.sendMessage("No copypastas found reeferSad");
                    else message.channel.sendMessage(rows[0].pasta_index + " " + rows[0].pasta);
                });
            }
            else if (query.toLowerCase().startsWith("legacysearch ")) 
            {
                query = query.substring(13);
                copypastas.all("SELECT * FROM copypastas", (errr, rows) =>
                {
                    if (errr) console.error(errr);
                    var pastaResult = "";
                    pastaResult = similarity.findBestMatch(query, rows.map(a => a.pasta));
                    console.log(pastaResult.bestMatch);
                    message.channel.sendMessage(pastaResult.bestMatch.target);
                });
            }
            /*else if (commandName.toLowerCase().startsWith("delete ") && moderators.includes(context.username))
            {
                commandName = commandName.substring(7);
                copypastas.each("SELECT * FROM copypastas", (errr, row) =>
                {
                    if (errr) console.error(errr);
                    if (similarity.compareTwoStrings(commandName, row.pasta) >= 0.9)
                    {
                        copypastas.run('DELETE FROM copypastas WHERE pasta = "' + row.pasta + '"');
                        client.action(target, "Pogpega " + context['display-name'] + " Deleted copypasta from the library");
                    }
                }, (errr, rows) =>
                {
                    if (errr) console.error(errr);
                    client.action(target, "Pogpega Tssk " + context['display-name'] + " That copypasta is not in the library");
                });
            }*/
        }
        else if (msg.startsWith('/discrim'))
        {
            if (msg.length == 8) message.channel.sendMessage('Enter a discriminator');
            else
            {
                let discrim = msg.substring(9);
                let usernames = await getLoungeUsernames();
                /*let matchingUsernames = usernames
                    .filter((username) => username.endsWith(discrim))
                    .map((username) => username);*/
                message.channel.sendMessage(usernames.join(', '));
            }
        }
    }
});

async function getLoungeUsernames() 
{
    const loungeServer = await client.servers.fetch('01H17HE0X647H1AP5SP8NWESPP');//01F7ZSBSFHQ8TA81725KQCSDDP
    const loungeMembers = await loungeServer.fetchMembers();
    const loungeUsernames = loungeMembers.users.map((user) => user.username);
    console.log(loungeIDs)
    return loungeUsernames;
}

// Log in to Revolt with the bot token
client.loginBot(process.env.REVOLT_TOKEN);