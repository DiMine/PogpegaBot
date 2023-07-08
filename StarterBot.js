//const { Console } = require('console');
const tmi = require('tmi.js');
var XMLHttpRequest = require('xhr2');
var offline = false;
var broken = false;
const Http = new XMLHttpRequest();
require('dotenv').config();
//var { exec, spawn } = require('child_process');
//const fs = require('fs');
//var pogpegaBot;
const Discord = require('discord-user-bots');
var dcClient = new Discord.Client(process.env.DISCORD_ALT_TOKEN);
const moderators = ["dimine0704", "thatoneguywhospamspogpega", "nekopavel", "enyoti"];
//var osupingBot = exec('osupingbot.js');
var lastTime = Date.now();
// Ping an api to see if BTMC is live
function ping() 
{
  var url = 'https://decapi.me/twitch/uptime/btmc?' + Date.now();
  Http.open("GET", url);
  Http.send();
  if (Http.responseText.includes("offline")) 
  {
    if (!offline) 
    {
      offline = true;
      console.log("BTMC is now offline");
    }
  }
  else if (!Http.responseText.includes("offline")) 
  {
    if (offline) 
    {
      offline = false;
      console.log("BTMC is now online");
    }
  }
}

Http.onreadystatechange = (e) =>
{
  //console.log(Http.responseText)
}
// Define configuration options
const opts = {
  identity: {
    username: "ThatOneBotWhoStartPogpega",
    password: process.env.TOKEN_STARTER
  },
  channels: [
    'ThatOneGuyWhoSpamsPogpega',
    'ThatOneBotWhoSpamsPogpega',
    'pogpegabot',
    'ThatOneBotWhoPingsPogpega',
    'btmc',
    'nekochattingbot',
    'nekopavel',
    'dimine0704'
  ]
};

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
  if (chance(20)) ping(); // Check to see if ed is online

  if (context.username == 'thatonebotwhospamspogpega' || context.username == 'pogpegabot') broken = false;

  // Remove whitespace from message
  var commandName = msg.trim();

  // Remove starting pogpegas from messages so i can use the bot
  if (commandName.startsWith('Pogpega IceCold ') | commandName.startsWith('Pogpega SoSnowy')) commandName = commandName.slice(16);
  else if (commandName.startsWith('Pogpega  IceCold ')) commandName = commandName.slice(17);
  else if (commandName.startsWith('Pogpega ')) commandName = commandName.slice(8);
  /*if (commandName.startsWith('Chatting ')) {
    commandName = commandName.slice(9);
  }*/

  if (!offline && target === "#btmc") target = "#thatonebotwhospamspogpega";

  if (commandName.startsWith('>manualonline') && moderators.includes(context.username)) 
  {
    offline = false;
    console.log("BTMC is now online");
    sendMessage('<:Botpega:972646249578762280> I have been told BTMC is now online', "972643128613933156");
  }
  else if (commandName.startsWith('>manualoffline') && moderators.includes(context.username)) 
  {
    offline = true;
    console.log("BTMC is now offline");
    sendMessage('<:Botpega:972646249578762280> I have been told BTMC is now offline', "972643128613933156");
  }
  else if (/*context.username === 'streamelements' && */commandName.startsWith('Use code') && chance(15)) 
  {
    client.say(target, '/me Pogpega 👆 Turn it off and on again !!! ');
    console.log(`* gfuel`);
  }
  /*else if (commandName === ">restart") 
  {
    client.say(target, "/me Pogpega Restarting PogpegaBot TriFi");
    pogpegaBot = exec('sh Start_PogpegaBot.sh');
    console.log("Started PogpegaBot");
  }*/ else if (commandName.startsWith(">shock")) 
  {
    if (lastTime + 300000 < Date.now()) 
    {
      client.say(target, "/me Pogpega Looks like the >rs function isnt working. Lets fix that with a controlled shock MEGALUL Stab MrDestructoid");
      throw new Error("Chatting");
      //dcClient.discord_reconnect();
      //Program.restart();
      //dcClient = "";
      //dcClient = new Discord.Client(process.env.DISCORD_ALT_TOKEN);
      /*osupingBot = exec('osupingbot.js');*/
      //console.log("Restarted osupingbot");
      //lastTime = Date.now();
    }
    else 
    {
      client.say(target, "/me Pogpega Tssk theres still " + Math.ceil(((lastTime + 300000 - Date.now()) / 1000)) + " seconds left on the cooldown");
      console.log("nopers im not restarting yet");
    }
  }
  else if (commandName.startsWith(">rs")) 
  {
    broken = true;
    setTimeout(() =>
    {
      if (broken) client.action(target, "Pogpega @" + context['display-name'] + " is >rs not working? Try typing >shock to restart its function");
    }, 10000);
  }
}

function chance(outOf) 
{
  var result = Math.floor(Math.random() * outOf);
  if (result === 1) return true;
  else return false;
}

dcClient.on.ready = function ()
{
  console.log("Client online");
  sendMessage('<:Botpega:972646249578762280> StarterBot Online', "972643128613933156")
  dcClient.change_status('online');
  dcClient.set_custom_status({ text: `t; Discord's a bitch ass motherfucker, it pissed on my fucking username. That's right, it took its blurple stupid blog out and i`,})
}

dcClient.on.message_create = function (message) 
{
  console.log(message.content);
  if (message.channel_id === "967134443393400922" && message.author.username === "PogpegaBot") 
  {
    sendMessage(message.content, "967134443393400922")
  }
}


function sendMessage(text, channel) 
{
  dcClient.send(
    channel, // Channel to send in
    {
      content: text, // Content of the message to send (Optional when sending stickers) (Default null)
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

dcClient.on.discord_disconnect = function () 
{
  //dcClient.discord_reconnect();
  client.action('#pogpegabot', "Botpega API disconnected, auto-restarting script");
  throw new Error("Chatting");
}

function sleep(miliseconds)
{
  var currentTime = new Date().getTime();
  while (currentTime + miliseconds >= new Date().getTime())
  {
    // Do absolutely nothing
  }
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler(addr, port)
{
  console.log(`* Connected to ${addr}:${port}`);
  client.action('#pogpegabot', "Botpega Starting StarterBot TriFi");
}

// Use setInterval to call sendMessage every 40 minutes
setInterval(function () {
  sendMessage('<:Botpega:972646249578762280>', '967134443393400922')
}, 2400000);