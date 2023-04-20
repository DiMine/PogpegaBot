const tmi = require('tmi.js'); // Send messages to twitch chat
const { google } = require('googleapis'); // Interact with apis through google
var XMLHttpRequest = require('xhr2'); // Secondary live checker
var { PythonShell } = require('python-shell'); // Run python scripts in java (used for the >chat command)
const LED = require('onoff').Gpio; // Interface with gpio pins to turn the leds on and off
//const { Server } = require("socket.io");
//const io = new Server(7270);
const { Client, Intents } = require('discord.js'); // Interface with a discord bot
const sqlite3 = require('sqlite3').verbose(); // Interact with .db files
const copypastas = new sqlite3.Database('CopypastaLibrary.sqlite3'); // Object to store the copypasta library
var similarity = require('string-similarity'); // Npm package to detect the similarity between strings
const dcClient = new Client({
  intents: [
    Intents.FLAGS.GUILDS, // Lets the bot see which servers it is in
    Intents.FLAGS.GUILD_MESSAGES, // Lets the bot read messages from servers it is in
    Intents.FLAGS.DIRECT_MESSAGES // Lets the bot read messages sent in dms
  ]
});
var offline = false; // Whether or not BTMC is currently live
var pinged = true; // True when someone types >ping, false when the PingerBot responds
var startup = true; // True until the first message is sent after the script starts running
var soTure = false; // Usually false, becomes true for 4 seconds when someone says !stoic
var fitbitActivity; // Store fitbit activity data
var fitbitSleep; // Store fitbit sleep data
var fitbitTokens; // Store fitbit oauth tokens
var status = ""; // A custom status that I can set
var wordle; // Store the id and status for the wordle api
var discordTarget = "#btmc"; // The channel where scorepost messages should be sent
var guess; // The wordle guess to be sent to the api
var correctPogu = false; // True when the wordle is successfully guessed
var guessCounter = 0; // Counter for the wordle guesses
var wordleActive = false; // Whether or not a wordle game is currently active
var servoLocation = 0; // The current location of the servo motor
var today; // The current day
var letters = []; // An array of 0, 1, 2 for determining the leftover letters in wordle
var startTime = Date.now(); // The time at which PogpegaBot starts running
const fs = require('fs'); // Reads files on the pi
var Gpio = require('pigpio').Gpio; // Interfaces with gpio pins on the pi to interact with the servo
const Http = new XMLHttpRequest(); // Secondary live checker
const cleverbot = require("cleverbot-free"); // A way to use cleverbot for free
const fetch = require('sync-fetch'); // Synchronous api fetching
var count; // Object to store all the pogpega counts
fs.readFile('count.json', (err, data) =>
{
  if (err) console.error(err);
  else count = new Map(Object.entries(JSON.parse(data)));
});
var osuUsernames; // Object to store the links between osu usernames and twitch usernames
fs.readFile('osuUsernames.json', (err, data) =>
{
  if (err) console.error(err);
  else osuUsernames = new Map(Object.entries(JSON.parse(data)));
});
var emojiDatabase;
fs.readFile('emojiMapping.json', (err, data) =>
{
  if (err) console.error(err);
  else emojiDatabase = JSON.parse(data);
});
fs.readFile('fitbit.json', (err, data) =>
{
  if (err) console.error(err);
  else fitbitTokens = JSON.parse(data);
});
require('dotenv').config(); // Use environment variables
refreshDate();
/*const oauth2Client = new google.auth.OAuth(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://pogpe.ga/"
)*/
var cbotHistory = []; // Array to store the chat history with cleverbot
var cbotCooldown = 0; // Cooldown to prevent the cleverbot api from being spammed
var blacklist // Object to store list of blacklisted words for >generate
fs.readFile('blacklist.json', (err, data) =>
{
  if (err) console.error(err);
  else blacklist = JSON.parse(data);
});

copypastas.run("CREATE TABLE IF NOT EXISTS copypastas (pasta)"); // Create the squlite table for the copypasta database

// Declare variables and stuff for the LEDs
const ledLive = new LED(17, 'out'); // Blue led that lights up when BTMC is live
const ledPing = new LED(27, 'out'); // Red led that lights up when someone types >ping
const ledChat = new LED(22, 'out'); // Green led that is controlled with >led on and >led off
var ledR = new Gpio(16, { mode: Gpio.OUTPUT }); // Red channel for the RGB led
var ledG = new Gpio(20, { mode: Gpio.OUTPUT }); // Green channel for the RGB led
var ledB = new Gpio(21, { mode: Gpio.OUTPUT }); // Blue channel for the RGB led
var color = ""; // Current color of the RGB led
var statusRGB = ""; // Emoji version of the RGB led color
const motor = new Gpio(18, { mode: Gpio.OUTPUT }); // The servo motor

function saveCounter() // Save the pogpega count of users to a .json file
{
  console.log(`* Saving pogpega counter, DO NOT CLOSE`);
  var data = JSON.stringify(Object.fromEntries(count))
  fs.writeFile("count.json", data, (err) =>
  {
    if (err) console.error(err);
    else console.log(`* Saved`);
  });
}
function saveUsernames() // Save the osu username database
{
  console.log(`* Saving osu usernames`);
  var data = JSON.stringify(Object.fromEntries(osuUsernames))
  fs.writeFile("osuUsernames.json", data, (err) =>
  {
    if (err) console.error(err);
    else console.log(`* Saved osu usernames`);
  });
}
const commandList = [">led", ">pogpegafarm", ">deceit", "!prefix", "Use code", "!bored", "Get 20% off Manscaped with code", "Pogpega /", ">maxfarm", "!pull", "!skin", ">repeat", "!roll", ">online", ">rice", "!rice", ">ping", "!math 9+10" + "!rea" + ">pogpegas", ">give", ">generate", ">translate", ">chat", ">homies"];
var guessing = false;
var guessIndex = 0;

const owobotCommands = [">rs", ">c", ">sc", ">osu", ">osutop", ">mania", ">maniatop", ">taiko", ">taikotop", ">ctb", ">ctbtop", ">map"];
const owobotCommandsSpace = [">rs ", ">c ", ">sc ", ">osu ", ">osutop ", ">mania ", ">maniatop ", ">taiko ", ">taikotop ", ">ctb ", ">ctbtop ", ">map "];
const moderators = ["dimine0704", "thatoneguywhospamspogpega", "nekopavel", "enyoti"];
/*io.on("connection", (socket) =>
{
  socket.emit("test", "does this work now?") // lol no it doesnt
})*/

// Ping an api to see if BTMC is live
function ping() 
{
  var checkIfLive = fetch("https://api.twitch.tv/helix/streams?user_id=46708418" + "&?" + Date.now(), {
    headers: {
      Authorization: process.env.TWITCH_TOKEN,
      "Client-Id": process.env.TWITCH_CLIENT_ID,
    },
    method: "GET"
  }).json();
  try
  {
    if (checkIfLive.data.length == 0) 
    {
      if (offline === false) 
      {
        offline = true;
        console.log("BTMC is now offline");
        ledLive.writeSync(0);
        dcClient.channels.cache.get("972643128613933156").send("<:Botpega:972646249578762280> My sources say BTMC is now offline");
      }
    }
    else 
    {
      if (offline === true) 
      {
        offline = false;
        console.log("BTMC is now online");
        ledLive.writeSync(1);
        dcClient.channels.cache.get("972643128613933156").send("<:Botpega:972646249578762280> My sources say BTMC is now online");
      }
    }
  }
  catch (erratic) 
  {
    dcClient.channels.cache.get("972643128613933156").send("<:Botpega:972646249578762280> My sources are useless, checking secondary source TriFi");
    ping2();
  }
}
function ping2() 
{
  var url = 'https://decapi.me/twitch/uptime/btmc?' + Date.now();
  Http.open("GET", url);
  Http.send();
  console.log(Http.responseText);
  if (Http.responseText.includes("offline")) 
  {
    if (offline === false) 
    {
      offline = true;
      console.log("BTMC is now offline");
      ledLive.writeSync(0);
      dcClient.channels.cache.get("972643128613933156").send("<:Botpega:972646249578762280> My secondary source says BTMC is now offline");
    }
  }
  else if (Http.responseText.includes("second") || Http.responseText.includes("minute") || Http.responseText.includes("hour")) 
  {
    if (offline === true) 
    {
      offline = false;
      console.log("BTMC is now online");
      ledLive.writeSync(1);
      dcClient.channels.cache.get("972643128613933156").send("<:Botpega:972646249578762280> My secondary source says BTMC is now online");
    }
  }
  else if (Http.responseText.includes("many requests")) 
  {
    dcClient.channels.cache.get("972643128613933156").send("<:Botpega:972646249578762280> My sources say to stop pinging them so much :Chatting:");
  }
  else
  {
    dcClient.channels.cache.get("972643128613933156").send("<:Botpega:972646249578762280> My sources say absolutely nothing :Chatting:");
  }
}
function checkFollow(userID)
{
  return true; //JUST DO THIS FOR NOW BECAUSE TWITCH API KINDA SUCKS AND ISNT WORKING
  if (userID === '726306594') return true; // Returns true if I use the command myself
  var following = fetch("https://api.twitch.tv/helix/users/follows?to_id=726306594&from_id=" + userID + "&?" + Date.now(), {
    headers: {
      Authorization: process.env.TWITCH_TOKEN,
      "Client-Id": process.env.TWITCH_CLIENT_ID,
    },
    method: "GET"
  }).json();
  console.log("Checked follower status");
  if (following.total === 1) return true;
  else return false;
}

const deepai = require('deepai');
deepai.setApiKey(process.env.TOKEN_DEEPAI);

fetch("https://api.fitbit.com/1/user/" + process.env.FITBIT_USER_ID + "/activities/date/" + today + ".json", {
  headers: {
    Authorization: process.env.FITBIT_AUTHORIZATION
  }
})

Http.onreadystatechange = (e) =>
{
  //console.log(Http.responseText)
}
// Define configuration options
const opts = {
  identity: {
    username: "PogpegaBot",
    password: process.env.TOKEN
  },
  channels: [
    'ThatOneGuyWhoSpamsPogpega',
    'ThatOneBotWhoPingsPogpega',
    'pogpegabot',
    'btmc',
    'schip3s',
    'NekoPavel',
    'NekoChattingBot',
    'DiMine0704',
    'Styx_E_Clap',
    'MochisHarvey'
  ]
};

dcClient.once('ready', () =>
{
  console.log("Discord client ready");
  dcClient.user.setActivity("Spamming Pogpega");
})
dcClient.login(process.env.DISCORD_TOKEN);
dcClient.on('messageCreate', (message) =>
{
  console.log(message);
  try 
  {
    console.log(message.embeds);
    if (message.content.includes(" no recent plays in") || message.content.includes("no scores on the map")) 
    {
      client.action(discordTarget, "Pogpega Chatting " + message.content.substring(2, message.content.length - 2).replace(/`/g, ''));
    }
    else if (message.content.includes("**Error, please try again later.**")) 
    {
      client.action(discordTarget, "Pogpega Chatting the owobot is down");
    }
    else 
    {
      scorepost = message.embeds[0].author.name;
      scorepost = scorepost.concat(" ").concat(message.embeds[0].description.replace(/\*/g, ''));
      if (scorepost.startsWith("**Recent osu")) 
      {
        scorepost = scorepost.substring(message.embeds[0].description.indexOf(">") + 1);
      }
      scorepost = scorepost.concat(" | ").concat(message.embeds[0].footer.text);
      scorepost = scorepost.replace(/\n/g, '').replace(/▸/g, '|').replace(/_/g, '').replace(/Score Set /g, '').replace(/<:rankingS:462313719762911233>/g, 'S').replace(/<:rankingSH:462313722732347401>/g, 'SH').replace(/<:rankingA:462313719083565066>/g, 'A').replace(/<:rankingB:462313719574167562>/g, 'B').replaceAll("<:rankingX:462313722736672780>", 'X').replaceAll("<:rankingXH:462313722556186626>", 'XH').replaceAll("<:rankingF:462313719741808670>", 'F').replaceAll("<:rankingC:462313719511121921>", 'C').replaceAll("<:rankingD:462313719767105536>", 'D');
      scorepost = scorepost.replace("1. ", '| 1⃣').replace("2. ", '| 2⃣').replace("3. ", '| 3⃣').replace("4. ", '| 4⃣').replace("5. ", '| 5⃣');
      if (scorepost.startsWith("Top 5 osu! Standard Plays for")) 
      {
        scorepost = scorepost.replace("Top 5 osu! Standard Plays for", "").replaceAll('(https://osu.ppy.sh/b', " | ");
        scorepost = scorepost.split("|");
        scorepost[2] = scorepost[2].substring(scorepost[2].indexOf("+") - 1);
        scorepost[6] = "";
        scorepost[9] = "";
        scorepost[11] = scorepost[11].substring(scorepost[11].indexOf("+") - 1);
        scorepost[15] = "";
        scorepost[18] = "";
        scorepost[20] = scorepost[20].substring(scorepost[20].indexOf("+") - 1);
        scorepost[24] = "";
        scorepost[27] = "";
        scorepost[29] = scorepost[29].substring(scorepost[29].indexOf("+") - 1);
        scorepost[33] = "";
        scorepost[36] = "";
        scorepost[38] = scorepost[38].substring(scorepost[38].indexOf("+") - 1);
        scorepost[42] = "";
        scorepost[45] = "";
        console.log(scorepost);
        scorepost = scorepost.join('|');
        scorepost = scorepost.replaceAll("||", "|");
      }
      else if (scorepost.includes("**Download:**")) 
      {
        scorepost = scorepost.replace("**Download:**", "");
        scorepost = scorepost.split(" | ");
        scorepost[0] = scorepost[0].substring(0, scorepost.indexOf("[map]("));
        scorepost[1] = "";
        scorepost[2] = "";
        scorepost[3] = "";
        scorepost[4] = scorepost[4].substring(scorepost[4].indexOf("[sayobot](https://") + 43)

        scorepost = scorepost.join('|');
        scorepost = scorepost.replaceAll("||", "|");
      }
      console.log(scorepost);
      client.action(discordTarget, "Pogpega " + scorepost);
    }
  }
  catch (err) { console.log(err.message); }
})

// Create a client with our options
const client = new tmi.client(opts);

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:
client.connect();

// Called every time a message comes in
function onMessageHandler(target, context, msg, self)
{
  if (self) { return; } // Ignore messages from the bot
  if (offline) if (chance(20)) ping();
  if (!offline) if (chance(100)) ping();

  if (startup)
  {
    startup = false;
    dcClient.channels.cache.get("972643128613933156").send("<:Botpega:972646249578762280> PogpegaBot restarted");
    ping();
    client.action("#pogpegabot", "Pogpega Starting PogpegaBot TriFi");
  }
  // Remove whitespace from message
  var commandName = msg.trim().replaceAll('󠀀', "").replaceAll('￼', "");
  try
  {
    // Count pogpegas
    var pogpegaCount = occurrences(commandName, "Pogpega") - occurrences(commandName, "ThatOneGuyWhoSpamsPogpega");
    if (count.has(context.username)) // Check if the person is already in the database
    {
      count.set(context.username, count.get(context.username) + pogpegaCount); // Add new pogpegas to the user
    }
    else // If the person is not in the database
    {
      count.set(context.username, pogpegaCount); // Add them to it
    }
    /*
    // If someone donates $7.27
    if (context.username === 'streamelements' && commandName.includes('just tipped $7.27 PogU HYPERCLAP')) 
    {
      sleep(1000);
      client.say(target, 'Pogpega WYSI '); 
      console.log(`* I SEE IT`);
    }*/

    // Remove the trigger for >ping when there's a response from the pinger bot
    if (context.username === 'thatonebotwhopingspogpega')
    {
      pinged = true;
      console.log("pinged");
    }

    // Remove starting pogpegas from messages so i can use the bot
    if (commandName.startsWith('Pogpega IceCold ') | commandName.startsWith('Pogpega SoSnowy')) commandName = commandName.slice(16);
    else if (commandName.startsWith('Pogpega  IceCold ')) commandName = commandName.slice(17);
    else if (commandName.startsWith('Pogpega ')) commandName = commandName.slice(8);
    /*if (commandName.startsWith('Chatting ')) {
      commandName = commandName.slice(9);
    }*/
    commandName = commandName.trim(); // Remove excess whitespace from the ends of the message

    if (!offline) // If BTMC is online
    {
      if (target === "#btmc") // If a message is going to BTMC's chat
      {
        target = "#pogpegabot"; // Redirect it to the bot's chat
      }
    }

    // >scramble
    if (guessing) // If >scramble is currently active
    {
      if (commandName === commandList[guessIndex]) // If someone says the correct command
      {
        client.action(target, "Pogpega no wae Pogpega thats correct its " + commandList[guessIndex]);
        console.log(`* Guessed correctly (` + commandList[guessIndex] + ')');
        guessing = false;
      }
    }

    if (commandName.startsWith(">")) // If the message is a command
    {
      if (commandName.toLowerCase().startsWith(">badtranslate ")) // Puts the message through a translator a bunch of times and back to english
      {
        commandName = commandName.substring(14);
        client.action(target, "Pogpega Translating message TriFi");
        commandName = mess(commandName);
        client.action(target, "Pogpega Chatting " + commandName);
      }
      else if (commandName.toLowerCase() === ">cam" || commandName.toLowerCase() === ">camera") 
      {
        //client.action(target, "Pogpega @" + context['display-name'] + " The camera for the led and servo is at pogpe.ga/camera");
        client.action(target, "Pogpega @" + context['display-name'] + " Instructions to see the camera are at pogpe.ga/rtsp (can't keep the twitch stream on 24/7)");
      }
      else if (commandName.toLowerCase().startsWith(">cam @"))
      {
        commandName = commandName.substring(5);
        //client.action(target, "Pogpega @" + commandName + " The camera for the led and servo can be found at pogpe.ga/camera");
        client.action(target, "Pogpega @" + commandName + " Instructions to see the camera are at pogpe.ga/rtsp (can't keep the twitch stream on 24/7)");
      }
      else if (commandName.toLowerCase().startsWith(">camera @"))
      {
        commandName = commandName.substring(8);
        //client.action(target, "Pogpega @" + commandName + " The camera for the led and servo can be found at pogpe.ga/camera");
        client.action(target, "Pogpega @" + commandName + " Instructions to see the camera are at pogpe.ga/rtsp (can't keep the twitch stream on 24/7)");
      }
      else if (commandName.toLowerCase().startsWith(">cbot ")) // Sends a message to cleverbot
      {
        if (cbotCooldown + 4000 < new Date().getTime()) 
        {
          commandName = commandName.substring(6);
          cleverbot(commandName, cbotHistory).then(resp =>
          {
            cbotHistory.push(commandName);
            client.action(target, "Pogpega @" + context['display-name'] + " " + resp);
            console.log(resp);
            cbotHistory.push(resp);
          }).catch(err => client.action(target, "Pogpega Chatting Error: " + err.message));
          cbotCooldown = new Date().getTime();
        }
        else 
        {
          //client.say(target, "/me Pogpega pepeMeltdown too many requests (4s cooldown)");
        }
      }
      else if (commandName.toLowerCase().startsWith(">chat ")) // Sends a message to chatterbot (it sucks compared to cleverbot)
      {
        commandName = commandName.substring(6);
        //chatterbotTarget = target;
        //chatterBot.send(commandName);
        PythonShell.run('ChatterBot.py', { pythonOptions: ['-u'], args: commandName }, function (err, results)
        {
          if (err) client.action(target, "Pogpega Chatting Error: " + err.message);
          client.action(target, "Pogpega " + results[0]);
          console.log(results[0]);
        });
      }
      else if (commandName.toLowerCase().startsWith(">code")) // Send the link to the pogpegabot github
      {
        client.action(target, "Pogpega @" + context['display-name'] + " Code for the PogpegaBot can be found at pogpe.ga/code");
      }
      else if (commandName === '>commands' || commandName.toLowerCase().startsWith(">help")) // Send the link to the commands list
      {
        client.action(target, '@' + context['display-name'] + ' List of commands for the Pogpega bots: https://pogpe.ga/bots');
        console.log(`* command doc sent`);
      }
      else if (commandName.toLowerCase().startsWith(">deadchat")) // Chatting
      {
        client.action(target, "Pogpega Chatting 𝐿𝑀𝒜𝒪. 𝒟𝐸𝒜𝒟 𝒞𝐻𝒜𝒯? 𝐼 𝒞𝒜𝒩𝒯 𝐵𝐸𝐿𝐼𝐸𝒱𝐸 𝐼𝒯. 𝒯𝐻𝐼𝒮 𝐼𝒮 𝒮𝒰𝒫𝐸𝑅 𝐹𝒰𝒩𝒩𝒴!! 𝒳𝒟𝒳𝒟𝒳𝒟. 𝐼𝐹 𝐼𝒯 𝐼𝒮 𝒯𝑅𝒰𝐸 𝒯𝐻𝒜𝒯 𝐼 𝒜𝑀 𝒯𝐻𝐸 𝒪𝒩𝐿𝒴 𝒪𝒩𝐸 𝐼𝒩 𝒯𝐻𝐼𝒮 𝒞𝒰𝑅𝑅𝐸𝒩𝒯 𝒞𝐻𝒜𝒯𝑅𝒪𝒪𝑀 𝒯𝐻𝐸𝒩 𝐼 𝒲𝐼𝐿𝐿 𝒞𝒪𝒩𝒮𝐼𝒟𝐸𝑅 𝒮𝐸𝒩𝒟𝐼𝒩𝒢 𝑅𝒜𝒩𝒟𝒪𝑀 𝑀𝐸𝒮𝒮𝒜𝒢𝐸𝒮 𝐿𝒪𝐿!!!! 𝒩𝒪 𝒪𝒩𝐸 𝐻𝒜𝒮 𝒯𝒜𝐿𝒦𝐸𝒟 𝐼𝒩 𝑀𝐼𝒩𝒰𝒯𝐸𝒮 𝒮𝒪 𝒯𝐻𝒜𝒯 𝑀𝒰𝒮𝒯 𝑀𝐸𝒜𝒩 𝐼 𝒜𝑀 𝒯𝐻𝐸 𝒪𝒩𝐿𝒴 𝒪𝒩𝐸 𝐻𝐸𝑅𝐸. 𝒟𝐸𝒜𝒟 𝒞𝐻𝒜𝒯 𝒳𝒟𝒟𝒟𝒟𝒟𝒟𝒟");
        console.log(`* dead chat lmao`);
      }
      else if (commandName.toLowerCase() === '>deceit') // 𝒟𝐼𝒟 𝒴𝒪𝒰 𝒥𝒰𝒮𝒯 𝒮𝒜𝒴 𝒯𝐻𝐸 𝒟𝐸𝒞𝐸𝐼𝒯
      {
        client.action(target, 'Pogpega 𝒟𝐼𝒟 𝒴𝒪𝒰 𝒥𝒰𝒮𝒯 𝒮𝒜𝒴 𝒯𝐻𝐸 𝒟𝐸𝒞𝐸𝐼𝒯');
        console.log('* deceit has been said');
      }
      else if (commandName.toLowerCase().startsWith(">dm ")) // Sends a discord dm to me
      {
        commandName = commandName.substring(4);
        dcClient.users.fetch("317080059003273217").then(user => user.send(context["display-name"] + ": " + commandName));
        client.action(target, "Pogpega DMed the Pogpega MaN on discord");
        console.log(context['display-name'] + " sent dm: " + commandName);
      }
      else if (commandName.toLowerCase().startsWith(">dm2 ")) // Sends a disccord dm to nekopavel
      {
        commandName = commandName.substring(5);
        dcClient.users.fetch("211923182456668162").then(user => user.send(context["display-name"] + ": " + commandName)).catch(heDisabledDms => console.log(heDisabledDms.message));
        client.action(target, "Pogpega DMed NekoPavel on discord");
        console.log(context['display-name'] + " sent dm to NekoPavel: " + commandName);
      }
      else if (commandName.toLowerCase().startsWith(">emit")) // This doesnt work
      {
        //io.emit("test", "does this work") // no it does not work
        client.action(target, "Pogpega Chatting you found an easter egg, good job. This command doesnt actually do anything");
      }
      else if (commandName.toLowerCase().startsWith('>emojify ')) // Add a bunch of emojis to a message
      {
        commandName = commandName.substring(9).trim();
        var newText = "";
        var tempWords = commandName.split(" ");
        for (const word of tempWords)
        {
          newText = newText.concat(word + " ");
          if (emojiDatabase[word.toLowerCase()] != undefined) 
          {
            newText = newText.concat(emojiDatabase[word.toLowerCase()])
            newText = newText.concat(" ");
          }
        }
        client.say(target, "/me Pogpega Chatting " + newText);
      }
      else if (commandName.toLowerCase() === ">follow") // Check to see if the specified user is following me
      {
        if (checkFollow(context['user-id'])) 
        {
          client.say(target, "/me Pogpega PointYou @" + context['display-name'] + " is following");
        }
        else
        {
          client.say(target, "/me Pogpega Tssk @" + context['display-name'] + " is not following");
        }
      }
      else if (commandName.toLowerCase().startsWith(">gamba ")) {
        // add gamba code
      }
      else if (commandName.toLowerCase().startsWith(">generate ")) // Send a prompt to an AI to generate a bunch of text
      {
        if (checkFollow(context['user-id'])) 
        {
          commandName = commandName.substring(10);
          var contains = false;
          for (const text of blacklist.blacklist) 
          {
            if (commandName.toLowerCase().includes(text)) contains = true;
          }
          if (contains) client.action(target, "Pogpega Tssk @" + context['display-name'] + " that contains blacklisted words");
          else 
          {
            client.action(target, "Pogpega Generating text TriFi");
            try 
            {
              (async function () 
              {
                var resp = await deepai.callStandardApi("text-generator", {
                  text: commandName,
                }).catch((errorus) => console.log(errorus.message));
                contains = false;
                var tempString = "";
                tempString = tempString.concat(resp.output);
                for (const text of blacklist.blacklist) 
                {
                  if (tempString.includes(text)) 
                  {
                    contains = true;
                  }
                }
                if (contains) 
                {
                  client.say(target, '/me Pogpega OuttaPocket Tssk you almost made me say blacklisted words');
                }
                else 
                {
                  var tempOut = resp.output;
                  if (tempOut.length > 500)
                  {
                    tempOut = tempOut.substring(0, 450);
                  }
                  console.log(tempOut);
                  client.action(target, `Pogpega Chatting ` + tempOut);
                }
              })()
            }
            catch (err) 
            {
              client.action(target, "Pogpega Chatting error: " + err.message);
              console.err(err.message)
            }
          }
        }
        else 
        {
          client.action(target, "Pogpega Tssk @" + context['display-name'] + " This command requires you to be following the Pogpega MaN (the api actually costs real money so I don't want it spammed)");
          console.log("Tssk no >generate for non-followers");
        }
      }
      else if (commandName.toLowerCase().startsWith(">give ")) // Give pogpegas to another user
      {
        commandName = commandName.slice(6).trim();
        if (commandName.startsWith("@"))
        {
          commandName = commandName.slice(1);
        }
        var request = commandName.split(" ");
        request[0] = request[0].toLowerCase();
        if (parseInt(request[1]) > 0)
        {
          if (count.has(request[0]) && count.has(context.username) && count.get(context.username) >= parseInt(request[1]) && request[0] != "kexiv_" && request[0] != "hrfarmer_")
          {
            count.set(context.username, count.get(context.username) - parseInt(request[1]));
            count.set(request[0], count.get(request[0]) + parseInt(request[1]));
            client.action(target, "Pogpega transferred " + parseInt(request[1]) + " Pogpegas from @" + context['display-name'] + " to @" + request[0]);
          }
          else if (request[0] === 'kexiv_')
          {
            client.action(target, "Pogpega Tssk kexiv has his thingy disabled");
          }
          else if (request[0] === 'hrfarmer_')
          {
            client.action(target, "Pogpega Tssk hr parmer has the thing disabled");
          }
          else 
          {
            client.action(target, "Pogpega FeelsDankMan something went wrong, either you don't have enough pogpegas, typed an invalid number, or the user you're giving it to has never sent a message.");
          }
        }
        else
        {
          client.action(target, "Pogpega Tssk @" + context['display-name'] + " you cant give negative pogpegas");
        }
      }
      else if (commandName.toLowerCase().startsWith(">guess ")) // Guess a word in wordle
      {
        if (wordleActive)
        {
          commandName = commandName.substring(7).toLowerCase().trim();
          try
          {
            guess = fetch("https://word.digitalnook.net/api/v1/guess/", {
              method: "POST",
              body: JSON.stringify({
                id: wordle.id,
                key: wordle.key,
                guess: commandName,
              })
            }).json();
            var temp = parseWordle(guess);
            var temp2 = "";
            var avaliableLetters = " (Letters left: " + parseLetters() + ")";
            guessCounter++;
            var end;
            if (correctPogu) 
            {
              avaliableLetters = "";
              end = fetch("https://word.digitalnook.net/api/v1/finish_game/", {
                method: "POST",
                body: JSON.stringify({
                  id: wordle.id,
                  key: wordle.key,
                })
              }).json();
              temp2 = " Pogpega HYPERCLAP +50 Pogpegas @" + context['display-name'];
              console.log(`* ${context['display-name']} guessed correctly (word: ` + end.answer + `)`);
              wordleActive = false;
              addPogpegas(context.username, 50);
              correctPogu = false;
            }
            client.action(target, "Pogpega " + guessCounter + "/6 " + temp + " (guess: " + commandName + ")" + avaliableLetters + temp2);
            console.log(`* guessed a word (` + commandName + `)`)

          }
          catch (err)
          {
            client.action(target, "Pogpega Tssk invalid word");
            console.error(err.message)
          }
        }
        else
        {
          client.action(target, "Pogpega there is no active wordle game (use >wordle to start one)")
        }
        try
        {
          if (guessCounter === 6 && wordleActive)
          {
            end = fetch("https://word.digitalnook.net/api/v1/finish_game/", {
              method: "POST",
              body: JSON.stringify({
                id: wordle.id,
                key: wordle.key,
              })
            }).json();
            console.log(end);
            client.action(target, "Pogpega PainsChamp out of guesses, the word was " + end.answer)
            console.log(`* out of guesses (word: ` + end.answer + `)`)
            wordleActive = false;
          }
        }
        catch (err)
        {
          console.log(err.message)
        }
      }
      else if (commandName.toLowerCase().startsWith('>homies')) // @homies
      {
        client.action(target, "Pogpega Can't see THISS ? Download Chatterino Homies now PogU 👉 https://chatterinohomies.com/");
        console.log(`* Homies`);
      }
      else if (commandName.toLowerCase().startsWith(">led")) // Commands for the led
      {
        if (commandName.toLowerCase() === '>led on') // Turn on the green led
        {
          switch (ledChat.readSync()) 
          {
            case 0:
              ledChat.writeSync(1);
              client.say(target, "/me Pogpega the led is now on");
              break;
            case 1:
              client.say(target, "/me Pogpega the led is already on");
              break;
          }
        }
        else if (commandName.toLowerCase() === '>led off') // Turn off the green led
        {
          switch (ledChat.readSync()) 
          {
            case 0:
              client.say(target, "/me Pogpega the led is already off");
              break;
            case 1:
              ledChat.writeSync(0);
              client.say(target, "/me Pogpega the led is now off");
              break;
          }
        }
        else if (commandName.toLowerCase() === '>led status') // Show the status of the leds
        {
          var statusLED;
          switch (ledChat.readSync())
          {
            case 0:
              statusLED = "⬛ (off)";
              break;
            case 1:
              statusLED = "🟩 (on)";
              break;
          }
          client.say(target, "/me Pogpega @" + context['display-name'] + " current status: " + statusLED + ", " + statusRGB + " (" + color + ")");
        }
        else if (commandName.toLowerCase() === '>led toggle') // Toggle the green led
        {
          switch (ledChat.readSync())
          {
            case 0:
              ledChat.writeSync(1);
              client.say(target, "/me Pogpega the led was off and now its on");
              break;
            case 1:
              ledChat.writeSync(0);
              client.say(target, "/me Pogpega the led was on and now its off");
              break;
          }
        }
        else if (commandName.toLowerCase().startsWith(">led rgb ")) // Change the color of the rgb led
        {
          color = commandName.substring(9).toLowerCase();
          var failed = false;
          switch (color) 
          {
            case "red":
              ledRgbControl(0, 1, 1);
              statusRGB = "🟥";
              break;
            case "green":
              ledRgbControl(1, 0, 1);
              statusRGB = "🟩";
              break;
            case "blue":
              ledRgbControl(1, 1, 0);
              statusRGB = "🟦";
              break;
            case "white":
              ledRgbControl(0, 0, 0);
              statusRGB = "⬜";
              break;
            case "on":
              ledRgbControl(0, 0, 0);
              statusRGB = "⬜";
              color = "white";
              break;
            case "yellow":
              ledRgbControl(0, 0, 1);
              statusRGB = "🟨";
              break;
            case "purple":
              ledRgbControl(0, 1, 0);
              statusRGB = "🟪";
              break;
            case "teal":
              ledRgbControl(1, 0, 0);
              statusRGB = "🟦+🟩";
              break;
            case "off":
              ledRgbControl(1, 1, 1);
              statusRGB = "⬛";
              break;
            default:
              client.say(target, "/me Pogpega @" + context['display-name'] + " enter a valid color (look at >commands to see the colors)");
              failed = true;
              break;
          }
          if (!failed) 
          {
            client.say(target, "/me Pogpega @" + context['display-name'] + " changed the color to " + color);
            console.log(`* color changed`);

          }
        }
        else if (commandName.toLowerCase() === ">led color") // Get the current color of the rgb led
        {
          client.say(target, "/me Pogpega @" + context['display-name'] + " the color is currently " + color);
        }
        else if (commandName.toLowerCase() === ">led") // Explain what to do with the led
        {
          client.say(target, "/me Pogpega @" + context['display-name'] + " use >led on and >led off to change an led connected to my pi. >led status to check current status.");
        }
      }
      else if (commandName.toLowerCase() === ">link") // Tells the user what osu username they are linked to (if any)
      {
        if (osuUsernames.has(context.username)) 
        {
          client.say(target, "/me Pogpega @" + context['display-name'] + " is currently linked to osu user " + osuUsernames.get(context.username));
        }
        else
        {
          client.say(target, "/me Pogpega @" + context['display-name'] + " is not currently linked to any osu user. Use >link {username} to link it");
        }
      }
      else if (commandName.toLowerCase().startsWith(">link ")) // Link an osu username to the user's twitch account
      {
        commandName = commandName.substring(6);
        osuUsernames.set(context.username, commandName);
        saveUsernames();
        client.say(target, "/me Pogpega @" + context['display-name'] + " has been linked to osu user " + commandName);
      }
      else if (commandName.toLowerCase() === '>manualcheck' && moderators.includes(context.username)) 
      {
        ping();
        console.log("* Manually triggered an online check");
      }
      else if (commandName.toLowerCase() === '>manualoffline' && moderators.includes(context.username)) 
      {
        offline = true;
        console.log("I have been told that BTMC is now offline");
        ledLive.writeSync(0);
        dcClient.channels.cache.get("972643128613933156").send("<:Botpega:972646249578762280> I have been told BTMC is now offline");
      }
      else if (commandName.toLowerCase() === '>manualonline' && moderators.includes(context.username)) 
      {
        offline = false;
        console.log("I have been told that BTMC is now online");
        ledLive.writeSync(1);
        dcClient.channels.cache.get("972643128613933156").send("<:Botpega:972646249578762280> I have been told BTMC is now online");
      }
      else if (commandName.toLowerCase() === '>maxfarm') // Farm the max amount of pogpegas in a single message
      {
        client.say(target, 'Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega');
        console.log('* Max Pogpegas farmed');
      }
      else if (commandName.toLowerCase() === '>online') // Check if BTMC is online
      {
        ping();
        client.say(target, "/me Pogpega Chatting if you can see this message, ed is offline");
      }
      else if (commandName.toLowerCase().startsWith('>pasta')) 
      {
        try 
        {
          commandName = commandName.substring(7).replaceAll('"', "'");
        }
        catch (outOfBounds) 
        {
          client.action(target, "Pogpega This is the copypasta library. insert more info here Chatting");
        }
        if (commandName.toLowerCase().startsWith("new "))
        {
          commandName = commandName.substring(4);
          var alreadyIn = false;
          copypastas.each("SELECT * FROM copypastas", (errr, row) =>
          {
            if (errr) console.error(errr);
            if (similarity.compareTwoStrings(commandName, row.pasta) >= 0.7) alreadyIn = true;
          }, (errr, rows) =>
          {
            if (errr) console.error(errr);
            if (!alreadyIn)
            {
              copypastas.run('INSERT INTO copypastas (pasta) VALUES ("' + commandName + '")');
              client.action(target, "Pogpega " + context['display-name'] + " Added copypasta to the library");
            }
            else client.action(target, "Pogpega Tssk " + context['display-name'] + " That copypasta is already in the library");
          });
        }
        else if (commandName.toLowerCase().startsWith("print according to all known laws of aviation, there is no way a bee should be able to fly") && moderators.includes(context.username))
        {
          copypastas.each("SELECT * FROM copypastas", (errr, row) =>
          {
            if (errr) console.error(errr);
            //console.log(row.pasta);
            client.action(target, "Pogpega " + row.pasta);
          });
        }
        else if (commandName.toLowerCase().startsWith("random"))
        {
          copypastas.get('SELECT * FROM copypastas ORDER BY RANDOM() LIMIT 1', (errr, row) =>
          {
            if (errr) console.error(errr);
            //console.log(row.pasta);
            client.action(target, "Pogpega " + row.pasta);
          });
        }
        else if (commandName.toLowerCase().startsWith("search "))
        {
          commandName = commandName.substring(7);
          copypastas.all("SELECT * FROM copypastas", (errr, rows) =>
          {
            if (errr) console.error(errr);
            var pastaResult = "";
            pastaResult = similarity.findBestMatch(commandName, rows.map(a => a.pasta));
            console.log(pastaResult.bestMatch);
            client.action(target, "Pogpega " + pastaResult.bestMatch.target);
          });
        }
        else if (commandName.toLowerCase().startsWith("delete ") && moderators.includes(context.username))
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
        }
      }
      if (commandName.toLowerCase().startsWith(">ping")) // See if the >ping command is used and turn on the red led
      {
        pinged = false;
        // Light the red LED for 5 seconds
        ledPing.writeSync(1);
        setTimeout(() =>
        {
          ledPing.writeSync(0);
        }, 5000);
        // If the pinger bot does not send any response within 2 seconds show the offline message
        setTimeout(() =>
        {
          if (!pinged && offline) 
          {
            client.say(target, "/me Pogpega modCheck pogpega guy? Chatting looks like hes asleep");
            console.log(`* not pinged lmao`);
          }
        }, 2000);
      }
      else if (commandName.toLowerCase() === '>pogpegafarm') // POGPEGA FARMING
      {
        client.say(target, `/me Pogpega POGPEGA FARMING`);
        console.log(`* POGPEGA FARMING`);
      }
      else if (commandName.toLowerCase() === ">pogpegas" || commandName.toLowerCase() === ">bal") // Tells the user their pogpega count
      {
        client.say(target, "/me Pogpega @" + context['display-name'] + " has " + count.get(context.username) + " Pogpegas");
      }
      else if (commandName.toLowerCase().startsWith(">pogpegas ")) // Shows the pogpega count for the specified user
      {
        var request = commandName.slice(10).toLowerCase().trim();
        if (request.toLowerCase().startsWith("@")) 
        {
          request = request.slice(1);
        }
        if (count.has(request)) 
        {
          if (count.get(request) <= 0) 
          {
            client.say(target, "/me Pogpega @" + request + " has 0 Pogpegas reeferSad");
          }
          else
          {
            client.say(target, "/me Pogpega @" + request + " has " + count.get(request) + " Pogpegas");
          }
        }
        else 
        {
          client.say(target, "/me Pogpega @" + request + " has 0 Pogpegas reeferSad");
        }
      }
      else if (commandName.toLowerCase().startsWith('>pyramid ')) // Make a pyramid with the message
      {
        commandName = commandName.substring(9);
        var length = parseInt(commandName);
        try 
        {
          commandName = commandName.substring(2) + " ";
        }
        catch (err)
        {
          client.action("Pogpega Chatting " + err.message)
          commandName = "Pogpega ";
        }
        if (commandName == "" || commandName == " ") commandName = "Pogpega ";
        if (length > 10 || length < 2)
        {
          client.say(target, "/me Pogpega @" + context['display-name'] + " enter a number from 2 to 10 (inclusive)");
        }
        else 
        {
          for (let i = 1; i <= length; i++) 
          {
            var tempLine = "";
            console.log("line " + i);
            for (let j = 0; j < i; j++) 
            {
              tempLine += commandName;
            }
            if (target != "#thatoneguywhospamspogpega" && target != "#pogpegabot") 
            {
              sleep(2001);
            }
            client.say(target, tempLine);
          }
          for (let i = length; i >= 1; i--) 
          {
            var tempLine = "";
            console.log("line " + i);
            for (let j = i - 1; j > 0; j--)
            {
              tempLine += commandName;
            }
            if (target != "#thatoneguywhospamspogpega" && target != "#pogpegabot") 
            {
              sleep(2001);
            }
            client.say(target, tempLine);
          }
          console.log(`* Pogpega pyramid width ` + length);
        }
      }
      else if (commandName.toLowerCase().startsWith('>remind ')) // Remind the user of something in a set amount of time
      {
        commandName = commandName.substring(8);
        setTimeout(function () { if (offline) client.say(target, "/me Pogpega @" + context['display-name'] + " " + commandName.substring(commandName.indexOf(" "))) }, parseInt(commandName) * 1000);
      }
      else if (commandName.toLowerCase().startsWith('>repeat ')) // Make the bot repeat the message
      {
        client.say(target, "/me Pogpega " + commandName.substring(7));
        console.log('* Chatting');
      }
      else if (commandName.toLowerCase().startsWith(">reset")/* || commandName.startsWith("GunL >reset"))*/ && moderators.includes(context.username))
      {
        cbotHistory = [];
        client.say(target, "/me Pogpega Cleared the conversation");
        console.log(`* Cleared Cleverbot history`);
      }
      /*else if (commandName.startsWith(">restart") && (context.username === "thatoneguywhospamspogpega" || context.username === "nekopavel" || context.username === "dimine0704")) 
      {
        throw new Error("INITIATE_SELF_DESTRUCT");
      }*/
      else if (commandName.toLowerCase() === '>rice') // !rice
      {
        client.say(target, "/me Pogpega *!rice");
        console.log(`* rice`);
      }
      else if (commandName.toLowerCase() === ">scramble") // Scramble a command
      {
        if (!guessing) 
        {
          guessIndex = Math.floor(Math.random() * commandList.length);
          client.say(target, "/me Pogpega Unscramble this command: " + shuffle(commandList[guessIndex]));
          guessing = true;
          console.log(`* Scrambled word (` + commandList[guessIndex] + `)`);
        }
      }
      else if (commandName.toLowerCase() === ">servo") // Say what to do with the servo
      {
        client.say(target, "/me Pogpega Input a number between 500 and 2500 to rotate a servo connected to the pi");
      }
      else if (commandName.toLowerCase().startsWith(">servo ")) // Control the servo
      {
        commandName = commandName.substring(7);
        if (commandName.toLowerCase() === "location") // Get the location of the servo
        {
          client.say(target, "/me Pogpega The servo is at location " + servoLocation);
        }
        else if (commandName.toLowerCase() === "seizure") // Make the servo have a seizure
        {
          client.action(target, "Pogpega Giving the servo a seizure ppCrazy");
          console.log("Giving servo a seizure");
          const servoDelay = 175;
          motor.servoWrite(500);
          sleep(servoDelay);
          motor.servoWrite(2500);
          sleep(servoDelay);
          motor.servoWrite(500);
          sleep(servoDelay);
          motor.servoWrite(2500);
          sleep(servoDelay);
          motor.servoWrite(500);
          sleep(servoDelay);
          motor.servoWrite(2500);
          sleep(servoDelay);
          motor.servoWrite(500);
          sleep(servoDelay);
          motor.servoWrite(2500);
          sleep(servoDelay);
          motor.servoWrite(500);
          sleep(servoDelay);
          motor.servoWrite(2500);
          sleep(servoDelay);
          motor.servoWrite(500);
          sleep(servoDelay);
          motor.servoWrite(2500);
          sleep(servoDelay);
          console.log("Finished servo seizure");
        }
        else
        {
          try
          {
            commandName = parseInt(commandName);
            if (commandName != 0) 
            {
              motor.servoWrite(commandName); // Range 500-2500
              client.say(target, "/me Pogpega Moving servo from " + servoLocation + " to " + commandName);
              servoLocation = commandName;
              console.log("Moved servo to " + commandName);
            }
            else
            {
              client.action(target, "Pogpega Tssk number has to be from 500-2500");
            }
          }
          catch (erroneous)
          {
            client.action(target, "Pogpega Chatting Error: " + erroneous.message);
          }
        }
      }
      else if (commandName.toLowerCase().startsWith(">similarity ")) 
      {
        commandName = commandName.substring(12);
        try 
        {
          commandName = commandName.match(/(?<=(["']\b))(?:(?=(\\?))\2.)*?(?=\1)/g); // I have no idea what this means
          console.log(commandName);
          var similarScore = similarity.compareTwoStrings(commandName[0], commandName[1]);
          client.action(target, "Pogpega @" + context['display-name'] + " Similarity: " + similarScore);
        }
        catch (errr) 
        {
          console.error(errr);
          client.action(target, "Pogpega @" + context['display-name'] + " Chatting something went wrong, probably invalid syntax (did you put the stuff in quotes?)");
        }
      }
      else if (commandName.toLowerCase() === ">status") // Get a status that I can set
      {
        client.say(target, "/me Pogpega " + status);
      }
      else if (commandName.toLowerCase().startsWith(">status ") && context.username === "thatoneguywhospamspogpega") 
      {
        commandName = commandName.substring(8);
        status = commandName;
      }
      else if (commandName.toLowerCase() === '>tab') // Remind users that they can use tab to autocomplete emotes
      {
        client.action(target, "Pogpega @" + context['display-name'] + " Reminder that you can use [tab] to autocomplete emotes");
      }
      else if (commandName.toLowerCase().startsWith(">tab @")) // Remind a specific user that they can use tab to autocomplete emotes
      {
        commandName = commandName.substring(6);
        client.action(target, "Pogpega @" + commandName + " Reminder that you can use [tab] to autocomplete emotes");
      }
      else if (commandName.toLowerCase().startsWith(">toxic ")) // Check the toxicity of the message
      {
        commandName = commandName.substring(6);
        checkToxic(target, context['display-name'], commandName);
      }
      else if (commandName.toLowerCase().startsWith(">translate ")) // Translate a message to another language
      {
        var lang = commandName.substring(11, 13);
        commandName = commandName.substring(14);
        try
        {
          commandName = translator(lang, commandName);
          if (commandName != undefined) client.say(target, "/me Pogpega " + commandName);
          else client.say(target, "/me Pogpega Chatting Enter a valid language");
        }
        catch (err)
        {
          client.say(target, "/me Pogpega Chatting " + err.message);
          console.error(err);
        }
      }
      else if (commandName.toLowerCase().startsWith(">uptime")) 
      {
        timeSinceStart = Date.now() - startTime;
        timeSinceStart /= 60000
        timeSinceStart = minParse(timeSinceStart)
        client.action(target, "Pogpega PogpegaBot Uptime: " + timeSinceStart);

      }
      else if (commandName.toLowerCase() === ">wordle") // Play wordle
      {
        if (!wordleActive) 
        {
          wordle = fetch("https://word.digitalnook.net/api/v1/start_game/", { method: "POST" }).json();
          wordleActive = true;
          guessCounter = 0;
          resetLetters();
          correctPogu = false;
          client.action(target, "Pogpega wordle has started, use >guess to guess a 5 letter word");
        }
        else
        {
          client.action(target, "Pogpega there is already a wordle active");
        }
      }
      else if (commandName.toLowerCase() === ">wordle stop" && moderators.includes(context.username)) // Stop the currently active wordle
      {
        wordleActive = false;
        client.say(target, "/me Pogpega wordle stopped");
      }
      else if (commandName.toLowerCase().startsWith(">calories")) // Output the number of calories I've burned today
      {
        client.say(target, "/me Pogpega Current calories burned today: " + fitbitActivity.summary.caloriesOut);
        console.log(`* said calories (` + fitbitActivity.summary.caloriesOut + `)`);
      }
      else if (commandName.toLowerCase().startsWith(">refresh")) // Refresh the fitbit stats
      {
        updateFitbit();
        client.say(target, "/me Pogpega Refreshed fitbit stats");
        console.log(`Manually refreshed fitbit`)
      }
      else if (commandName.toLowerCase().startsWith(">sleep")) // Output the amount of sleep I got last night
      {
        var timeSlept = fitbitSleep.summary.totalTimeInBed - fitbitSleep.summary.stages.wake;
        client.say(target, "/me Pogpega Amount of sleep last night: " + minParse(timeSlept));
        console.log(`* said sleep (` + minParse(timeSlept) + `)`);
      }
      else if (commandName.toLowerCase().startsWith(">steps")) // Output the number of steps I've gotten today
      {
        client.say(target, "/me Pogpega Current step count for today: " + fitbitActivity.summary.steps);
        console.log(`* said steps (` + fitbitActivity.summary.steps + `)`);
      }
      else if (owobotCommands.includes(commandName)) // Discord osu bot commands
      {
        if (osuUsernames.has(context.username)) // If the user has a linked osu username
        {
          discordTarget = target;
          dcClient.channels.cache.get("967134443393400922").send(commandName + ' "' + osuUsernames.get(context.username) + '"');
        }
        else
        {
          client.say(target, "/me Pogpega @" + context['display-name'] + " is not currently linked to an osu user, do >link {osu username} to link it");
        }
      }
      else if (owobotCommandsSpace.includes(commandName.split(" ")[0].concat(" ")))
      {
        var tempMsg = commandName.split(" ");
        commandName = tempMsg[0];
        tempMsg.splice(0, 1);
        if (tempMsg[0].startsWith("-") && osuUsernames.has(context.username)) 
        {
          tempMsg = tempMsg.join(" ");
          discordTarget = target;
          dcClient.channels.cache.get("967134443393400922").send(commandName + ' "' + osuUsernames.get(context.username) + '" ' + tempMsg);
        }
        else 
        {
          tempMsg = tempMsg.join(" ");
          discordTarget = target;
          dcClient.channels.cache.get("967134443393400922").send(commandName + " " + tempMsg);
        }
      }
    }
    else if (commandName.toLowerCase().startsWith("!")) // If the message is a command for another bot
    {
      if (commandName === '!bored') // Imagine being bored
      {
        client.say(target, '/me Pogpega @' + context['display-name'] + ' spam pogpega ');
        console.log(`* imagine being bored`);
      }
      else if (commandName === '!prefix') // Say what the pogpegabot prefix is
      {
        client.say(target, '/me Pogpega @' + context['display-name'] + ' prefix is >{command}');
        console.log(`* !prefix`);
      }
      else if (commandName.toLowerCase().includes('!pull') && chance(15)) // :tf:
      {
        client.say(target, '/me Pogpega @' + context['display-name'] + ' You pulled on these nuts lmao gottem Chatting');
        console.log('* lmao gottem');
      }
      else if (commandName.toLowerCase().startsWith('!roll') && chance(15)) // :tf:
      {
        client.say(target, '/me Pogpega @' + context['display-name'] + ' You rolled these nuts lmao gottem Chatting');
      }
      else if (commandName.toLowerCase().startsWith('!skin') && chance(10)) // We are not the same
      {
        client.say(target, "/me Pogpega Chatting You chat here because you want Ed's skin. I chat here because I am a bot. We are not the same. ");
        console.log('* skin frogs');
      }
      else if (commandName.toLowerCase() === "!stoic") // reeferSad so ture
      {
        soTure = true;
        setTimeout(function () { soTure = false }, 4000);
      }
    }
    else // If the message is not a command
    {
      if (commandName.toLowerCase().includes("@homies") && chance(20)) // PINGED
      {
        client.say(target, "/me Pogpega PINGED");
        console.log(`* PINGED`);
      }
      else if (context.username === "fossabot" && commandName.includes(" \"") && soTure) // reeferSad so ture
      {
        client.say(target, "/me Pogpega reeferSad so ture")
        console.log("this is so so ture");
        soTure = false;
      }
      else if (context.username === "mrdutchboi" && commandName.includes("Boolin ?") && chance(3)) // Boolin
      {
        client.say(target, '/me Pogpega Boolin we boolin');
        console.log(`* we boolin`);
      }
      else if (commandName === 'FRICK' && context.username === 'soran2202' && chance(5)) // FRICK
      {
        client.say(target, '/me Pogpega @soran2202 FRICK');
        console.log(`* soran fricked`);
      }
      else if (commandName.startsWith('Get 20% off Manscaped with code ')) // PogU
      {
        client.say(target, '/me Pogpega 👆 Use code "Pogpega" !!! ');
        console.log(`* balls`);
      }
      else if (commandName.startsWith("Looks like the >rs function isnt working.") && context.username === 'thatonebotwhostartpogpega') // Second half of the >shock command
      {
        client.say(target, "/me Pogpega ⚡ pepeMeltdown ⚡");
      }
      else if (msg === 'Pogpega /' && chance(3)) // Pogpega /
      {
        client.say(target, '/me Pogpega / @' + context['display-name']);
        console.log(`* Pogpega /`);
      }
      else if (context.username === "nekochattingbot" && commandName.startsWith("The rice cooker is off.")) // reeferSad no rice
      {
        client.say(target, "/me Pogpega reeferSad no rice");
        console.log(`* reeferSad no rice`);
      }
      else if (/*context.username === 'streamelements' && */commandName.startsWith('Use code') && chance(5)) // PogU
      {
        client.say(target, '/me Pogpega 👆 Use code "Pogpega" !!! ');
        console.log(`* gfuel`);
      }
      else // The message did not trigger any commands
      {
        console.log(`Unknown command ${commandName}`);
      }
    }

    // Random Chance
    if (offline)
    {
      if (chance(40)) saveCounter();
      if (chance(1000)) refreshDate();
      if (chance(100)) updateFitbit();
      if (chance(300)) refreshFitbit();
    }
    else
    {
      if (chance(500)) saveCounter();
      if (chance(5000)) refreshDate();
      if (chance(1000)) updateFitbit();
      if (chance(5000)) refreshFitbit();
    }
  }
  catch (errororor)
  {
    /*if (errororor.message === "INITIATE_SELF_DESTRUCT") {
      throw new Error("SELF_DESTRUCT_INITIATED");
    } 
    else 
    {*/
    if (offline) client.say(target, "/me Pogpega Chatting Error: " + errororor.message);
    else client.say('#pogpegabot', "/me Pogpega Chatting Error: " + errororor.message);
    //}
  }
}

function chance(outOf) // Return true 1/x times, where x is the input
{
  var result = Math.floor(Math.random() * outOf);
  if (result === 1) return true;
  else return false;
}

function addPogpegas(user, amount) 
{
  if (count.has(user)) count.set(user, count.get(user) + amount);
  else count.set(user, amount);
}

function ledRgbControl(r, g, b) 
{
  ledR.digitalWrite(r);
  ledG.digitalWrite(g);
  ledB.digitalWrite(b);
}

function updateFitbit() // Update my fitbit stats
{
  fs.readFile('fitbit.json', (err, data) =>
  {
    if (err) console.log(err.message);
    fitbitTokens = JSON.parse(data);
  });
  fitbitActivity = fetch("https://api.fitbit.com/1/user/" + process.env.FITBIT_USER_ID + "/activities/date/" + today + ".json", {
    headers: {
      Authorization: "Bearer " + fitbitTokens.access_token
    }
  }).json();
  fitbitSleep = fetch("https://api.fitbit.com/1/user/" + process.env.FITBIT_USER_ID + "/sleep/date/" + today + ".json", {
    headers: {
      Authorization: "Bearer " + fitbitTokens.access_token
    }
  }).json();
  console.log(`Updated Fitbit stats`);
}
function refreshFitbit() // Update my fitbit refresh/access token
{
  console.log("Refreshing Fitbit token");
  var token = fetch("https://api.fitbit.com/oauth2/token", {
    body: "grant_type=refresh_token&refresh_token=" + fitbitTokens.refresh_token,
    headers: {
      Authorization: process.env.FITBIT_REFRESH_AUTH,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    method: "POST"
  }).json();
  var data = JSON.stringify(token);
  fs.writeFile("fitbit.json", data, (err) =>
  {
    if (err) console.error(err);
    else console.log(`Refreshed Fitbit token`);
  });
  fitbitTokens = token;
}

function shuffle(string) // Shuffle the letters in a string
{
  var array = string.split("");
  var tmp, current, top = array.length;

  if (top) while (--top)
  {
    current = Math.floor(Math.random() * (top + 1));
    tmp = array[current];
    array[current] = array[top];
    array[top] = tmp;
  }
  return array.join('');
}

function checkToxic(target, user, sentence) // Send a message to the Perspective API to check the toxicity of a message
{
  google.discoverAPI("https://commentanalyzer.googleapis.com/$discovery/rest?version=v1alpha1").then(clint =>
  {
    const analyzeRequest = {
      comment: {
        text: sentence
      },
      requestedAttributes: {
        SEVERE_TOXICITY: {},
        IDENTITY_ATTACK: {},
        PROFANITY: {},
        THREAT: {},
        SEXUALLY_EXPLICIT: {}
      }
    };
    clint.comments.analyze(
      {
        key: process.env.PERSPECTIVE_API_KEY,
        resource: analyzeRequest
      },
      (err, response) =>
      {
        if (err) console.log(err.message);
        try
        {
          console.log(JSON.stringify(response.data, null, 2));
          var scores2 = [
            response.data.attributeScores.SEVERE_TOXICITY.summaryScore.value,
            response.data.attributeScores.PROFANITY.summaryScore.value,
            response.data.attributeScores.IDENTITY_ATTACK.summaryScore.value,
            response.data.attributeScores.THREAT.summaryScore.value,
            response.data.attributeScores.SEXUALLY_EXPLICIT.summaryScore.value
          ]
          var scores = [
            "Toxicity: " + parseFloat((response.data.attributeScores.SEVERE_TOXICITY.summaryScore.value * 100).toFixed(2)) + "%",
            "Profanity: " + parseFloat((response.data.attributeScores.PROFANITY.summaryScore.value * 100).toFixed(2)) + "%",
            "Identity attack: " + parseFloat((response.data.attributeScores.IDENTITY_ATTACK.summaryScore.value * 100).toFixed(2)) + "%",
            "Threat: " + parseFloat((response.data.attributeScores.THREAT.summaryScore.value * 100).toFixed(2)) + "%",
            "Sexual: " + parseFloat((response.data.attributeScores.SEXUALLY_EXPLICIT.summaryScore.value * 100).toFixed(2)) + "%"
          ]
          var tempEmote = " ";
          var maxStat = scores2.indexOf(Math.max.apply(null, scores2));
          if (scores2[maxStat] > 0.9)
          {
            switch (maxStat)
            {
              case 0:
                tempEmote = " PogO ";
                break;
              case 1:
                tempEmote = " D: "
                break;
              case 2:
                tempEmote = " WeirdChamp ";
                break;
              case 3:
                tempEmote = " monkaW ";
                break;
              case 4:
                tempEmote = " SUSSY ";
                break;
              default:
                break;
            }
          }
          client.say(target, "/me Pogpega @" + user + tempEmote + scores);
        }
        catch (eerrro) 
        {
          console.log(eerrro.message);
          client.say(target, "/me Pogpega Chatting invalid message (the bot thinks its not in english) @" + user);
        }
      });
  }).catch(err => { console.log(err.message); });
}

// Peak inefficient coding right here
function resetLetters() // Reset the letter array for wordle
{
  letters = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,];
}

// given a letter, return the index of the letter in the alphabet
function getLetterIndex(letter)
{
  return letter.charCodeAt(0) - 'a'.charCodeAt(0);
}

function l2n(letter) // Change characters to numbers 0-25 in the most inefficient way possible
{
  switch (letter)
  {
    case 'a':
      return 0;
    case 'b':
      return 1;
    case 'c':
      return 2;
    case 'd':
      return 3;
    case 'e':
      return 4;
    case 'f':
      return 5;
    case 'g':
      return 6;
    case 'h':
      return 7;
    case 'i':
      return 8;
    case 'j':
      return 9;
    case 'k':
      return 10;
    case 'l':
      return 11;
    case 'm':
      return 12;
    case 'n':
      return 13;
    case 'o':
      return 14;
    case 'p':
      return 15;
    case 'q':
      return 16;
    case 'r':
      return 17;
    case 's':
      return 18;
    case 't':
      return 19;
    case 'u':
      return 20;
    case 'v':
      return 21;
    case 'w':
      return 22;
    case 'x':
      return 23;
    case 'y':
      return 24;
    case 'z':
      return 25;
    default:
      return 0;
  }
}

function n2l(number) // Change numbers 0-25 to characters in the most inefficient way possible
{
  switch (number)
  {
    case 0:
      return 'a';
    case 1:
      return 'b';
    case 2:
      return 'c';
    case 3:
      return 'd';
    case 4:
      return 'e';
    case 5:
      return 'f';
    case 6:
      return 'g';
    case 7:
      return 'h';
    case 8:
      return 'i';
    case 9:
      return 'j';
    case 10:
      return 'k';
    case 11:
      return 'l';
    case 12:
      return 'm';
    case 13:
      return 'n';
    case 14:
      return 'o';
    case 15:
      return 'p';
    case 16:
      return 'q';
    case 17:
      return 'r';
    case 18:
      return 's';
    case 19:
      return 't';
    case 20:
      return 'u';
    case 21:
      return 'v';
    case 22:
      return 'w';
    case 23:
      return 'x';
    case 24:
      return 'y';
    case 25:
      return 'z';
    default:
      return " Chatting error lmao ";
  }
}

/*
/** Check if a word from an array is in a string;
 * @param {String} phrase  The string to search
 * @param {String[]} list   The list of blacklisted words
 *
function has(phrase, list) {
  var contains = false;
  for (const text of list) 
  {
    if (phrase.includes(text)) 
    {
      contains = true;
    }
  }
  return contains;
}*/

function mess(text) // Put the input text through a translator a bunch of times
{
  var response = "";
  var res = fetch("https://libretranslate.de/translate", {
    method: "POST",
    body: JSON.stringify({
      q: cutDown(text),
      source: "en",
      target: "es",
      format: "text"
    }),
    headers: { "Content-Type": "application/json" }
  }).json();
  response = cutDown(res.translatedText);
  console.log(response);
  var res2 = fetch("https://libretranslate.de/translate", {
    method: "POST",
    body: JSON.stringify({
      q: response,
      source: "es",
      target: "fr",
      format: "text"
    }),
    headers: { "Content-Type": "application/json" }
  }).json();
  response = cutDown(res2.translatedText);
  console.log(response);
  var res3 = fetch("https://libretranslate.de/translate", {
    method: "POST",
    body: JSON.stringify({
      q: response,
      source: "fr",
      target: "hu",
      format: "text"
    }),
    headers: { "Content-Type": "application/json" }
  }).json();
  response = cutDown(res3.translatedText);
  console.log(response);
  var res4 = fetch("https://libretranslate.de/translate", {
    method: "POST",
    body: JSON.stringify({
      q: response,
      source: "hu",
      target: "az",
      format: "text"
    }),
    headers: { "Content-Type": "application/json" }
  }).json();
  response = cutDown(res4.translatedText);
  console.log(response);
  const res5 = fetch("https://libretranslate.de/translate", {
    method: "POST",
    body: JSON.stringify({
      q: response,
      source: "az",
      target: "en",
      format: "text"
    }),
    headers: { "Content-Type": "application/json" }
  }).json();
  response = cutDown(res5.translatedText);
  console.log(response);
  return response;
}
function cutDown(text) // Cut down a message length to make sure it can be sent in twitch chat
{
  try
  {
    var temp = text
    if (temp.length > 250) temp = temp.substring(0, 248);
    return temp;
  }
  catch (err) { console.error(err); }
}
function translator(traget, text) // Translate text into the specified language
{
  var res = fetch("https://libretranslate.de/translate", {
    method: "POST",
    body: JSON.stringify({
      q: cutDown(text),
      source: "auto",
      target: traget,
      format: "text"
    }),
    headers: { "Content-Type": "application/json" }
  }).json();
  return res.translatedText;
}

function parseWordle(resp) // Parse the response from the wordle api to turn it into colored boxes
{
  var result = "";
  for (const letter of resp) 
  {
    switch (letter.state) 
    {
      case 0:
        result = result.concat("⬛");
        letters[l2n(letter.letter)] = 0;
        break;
      case 1:
        result = result.concat("🟨");
        letters[l2n(letter.letter)] = 2;
        break;
      case 2:
        result = result.concat("🟩");
        letters[l2n(letter.letter)] = 2;
        break;
      default:
        break;
    }
  }
  if (result === "🟩🟩🟩🟩🟩") correctPogu = true;
  return result;
}

function parseLetters() // Parse the letters from the letter array to list which are still avaliable in wordle
{
  var result = "";
  var result2 = "";
  letters.forEach((letter, index) =>
  {
    if (letter === 1) result = result.concat(n2l(index));
    else if (letter === 2) result2 = result2.concat(n2l(index));
  })
  return result + ", " + result2;
}

function sleep(miliseconds) // Do nothing for an amount of time
{
  var currentTime = new Date().getTime();
  while (currentTime + miliseconds >= new Date().getTime()) { }
}

function refreshDate() // Refresh the current date
{
  today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0
  var yyyy = today.getFullYear();

  today = yyyy + '-' + mm + '-' + dd;
  console.log("* Refreshed Date");
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler(addr, port)
{
  console.log(`* Connected to ${addr}:${port}`);
  updateFitbit();
}

function minParse(totalMinutes) // Parse minutes into minutes and hours (for the fitbit api)
{
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);
  var timeSleep = timeParse(hours) + "h" + timeParse(minutes) + "m";
  if (timeSleep.charAt(0) == '0') timeSleep = timeSleep.substring(1);
  return timeSleep;
}

function timeParse(num) // Parse a time to have 2 decimal points
{
  return num.toString().padStart(2, '0');
}

// I literally yoinked the following code from stackoverflow

/** Function that count occurrences of a substring in a string;
 * @param {String} string               The string
 * @param {String} subString            The sub string to search for
 * @param {Boolean} [allowOverlapping]  Optional. (Default:false)
 *
 * @author Vitim.us https://gist.github.com/victornpb/7736865
 * @see Unit Test https://jsfiddle.net/Victornpb/5axuh96u/
 * @see https://stackoverflow.com/a/7924240/938822
 */
function occurrences(string, subString, allowOverlapping)
{

  string += "";
  subString += "";
  if (subString.length <= 0) return (string.length + 1);

  var n = 0,
    pos = 0,
    step = allowOverlapping ? 1 : subString.length;

  while (true)
  {
    pos = string.indexOf(subString, pos);
    if (pos >= 0)
    {
      ++n;
      pos += step;
    } else break;
  }
  return n;
}