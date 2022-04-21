const { Console } = require('console');
const tmi = require('tmi.js');
var XMLHttpRequest = require('xhr2');
var offline = false;
const Http = new XMLHttpRequest();
require('dotenv').config();
var exec = require('child_process').exec;
var pogpegaBot;

// Ping an api to see if BTMC is live
function ping() 
{
  var url = 'https://decapi.me/twitch/uptime/btmc?' + Date.now();
  Http.open("GET", url);
  Http.send();
  if (Http.responseText.includes("offline")) 
  {
    if (offline === false) 
    {
      offline = true;
      console.log("BTMC is now offline");
    }
  }
  else if (!Http.responseText.includes("offline")) 
  {
    if (offline === true) 
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
    'ThatOneBotWhoPingsPogpega',
    'btmc',
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
  ping(); // Check to see if ed is online

  // Remove whitespace from message
  var commandName = msg.trim();

  // Remove starting pogpegas from messages so i can use the bot
  if (commandName.startsWith('Pogpega IceCold ') | commandName.startsWith('Pogpega SoSnowy')) 
  {
    commandName = commandName.slice(16);
  }
  else if (commandName.startsWith('Pogpega  IceCold ')) 
  {
    commandName = commandName.slice(17);
  }
  else if (commandName.startsWith('Pogpega ')) 
  {
    commandName = commandName.slice(8);
  }
  /*if (commandName.startsWith('Chatting ')) {
    commandName = commandName.slice(9);
  }*/

  if (!offline)
  {
    if (target === "#btmc") 
    {
      target = "#thatonebotwhospamspogpega";
    }
  }
  if (/*context.username === 'streamelements' && */commandName.startsWith('Use code') && chance(15)) 
  {
    client.say(target, '/me Pogpega 👆 Turn it off and on again !!! ');
    console.log(`* gfuel`);
  } 
  else if (commandName === ">restart") 
  {
    client.say(target, "/me Pogpega Restarting PogpegaBot TriFi");
    pogpegaBot = exec('sh Start_PogpegaBot.sh');
    console.log("Started PogpegaBot");
  }
}

function chance(outOf) 
{
  var result = Math.floor(Math.random() * outOf);
  if (result === 1) 
  {
    return true;
  }
  else 
  {
    return false;
  }
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
}
