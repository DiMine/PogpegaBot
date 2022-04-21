//const GoogleTranslator = require('@translate-tools/core/translators/GoogleTranslator').GoogleTranslator;
const { google } = require('googleapis');
const tmi = require('tmi.js');
var XMLHttpRequest = require('xhr2');
var { PythonShell } = require('python-shell');
//var chatterBot = new PythonShell('ChatterBot.py');
const LED = require('onoff').Gpio;
//var rpio = require('rpio');
//const { Server } = require("socket.io");
//const io = new Server(7270);
//var makePwn = require("adafruit-pca9685");
var offline = false;
var pinged = true;
var startup = true;
var soTure = false;
var fitbitActivity;
var fitbitSleep;
var fitbitTokens;
var status = "";
var wordle;
var guess;
var correctPogu = false;
var guessCounter = 0;
var wordleActive = false;
var servoLocation = 0;
var today;
var letters = [];
const fs = require('fs');
var Gpio = require('pigpio').Gpio;
const Http = new XMLHttpRequest();
const cleverbot = require("cleverbot-free");
//const fetch = require("node-fetch");
const fetch = require('sync-fetch');
//const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
//translate.engine = "libre";
var count;
fs.readFile('count.json', (err, data) =>
{
  if (err) throw err;
  count = new Map(Object.entries(JSON.parse(data)));
});
var emojiDatabase;
fs.readFile('emojiMapping.json', (err, data) =>
{
  if (err) throw err;
  emojiDatabase = JSON.parse(data);
});
fs.readFile('fitbit.json', (err, data) =>
{
  if (err) throw err;
  fitbitTokens = JSON.parse(data);
});
require('dotenv').config();
refreshDate();
/*const oauth2Client = new google.auth.OAuth(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://pogpe.ga/"
)*/
var cbotHistory = [];
var cbotCooldown = 0;
var blacklist
fs.readFile('blacklist.json', (err, data) =>
{
  if (err) throw err;
  blacklist = JSON.parse(data);
});
//var buttonOutput = "#thatoneguywhospamspogpega";

// Declare variables and stuff for the LEDs
const ledLive = new LED(17, 'out');
const ledPing = new LED(27, 'out');
const ledChat = new LED(22, 'out');
var ledR = new Gpio(16, { mode: Gpio.OUTPUT });
var ledG = new Gpio(20, { mode: Gpio.OUTPUT });
var ledB = new Gpio(21, { mode: Gpio.OUTPUT });
var color = "";
var statusRGB = "";
const motor = new Gpio(18, { mode: Gpio.OUTPUT });
/*const button = new Gpio(12, {
  mode: Gpio.INPUT,
  pullUpDown: Gpio.PUD_DOWN,
  edge: Gpio.RISING_EDGE
});
button.glitchFilter(100);*/
//var pwm = makePwn();

// A function to save the pogpega count of users to a .json file
function saveCounter() 
{
  console.log(`* Saving pogpega counter, DO NOT CLOSE`);
  var data = JSON.stringify(Object.fromEntries(count))
  fs.writeFile("count.json", data, (err) =>
  {
    if (err) throw err;
    console.log(`* Saved`);
  });
}
const commandList = [">led", ">pogpegafarm", ">deceit", "!prefix", "Use code", "!bored", "Get 20% off Manscaped with code", "Pogpega /", ">maxfarm", "!pull", "!skin", ">repeat", "!roll", ">online", "!cock", ">cock", ">rice", "!rice", ">ping", "!math 9+10" + "!rea" + ">pogpegas", ">give", ">generate", ">translate", ">chat", ">homies"];
var guessing = false;
var guessIndex = 0;

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
      ledLive.writeSync(0);
    }
  }
  else if (!Http.responseText.includes("offline")) 
  {
    if (offline === true) 
    {
      offline = false;
      console.log("BTMC is now online");
      ledLive.writeSync(1);
    }
  }
}

/*const {tokens} = await oauth2Client.getToken();
oauth2Client.on('tokens', (tokens) => {
  if (tokens.refresh_token) {
    googleToken = 
  }
})*/

const deepai = require('deepai');
const { text } = require('express');
const { getSystemErrorMap } = require('util');
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
    username: "ThatOneBotWhoSpamsPogpega",
    password: process.env.TOKEN
  },
  channels: [
    'ThatOneGuyWhoSpamsPogpega',
    'ThatOneBotWhoSpamsPogpega',
    'ThatOneBotWhoPingsPogpega',
    'btmc',
    'schip3s',
    'NekoPavel',
    'NekoChattingBot',
    'DiMine0704',
    'DiMineosu'
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

  if (startup)
  {
    refreshFitbit();
    updateFitbit();
    startup = false;
  }
  // Remove whitespace from message
  var commandName = msg.trim();
  try
  {
    // Count pogpegas
    if (count.has(context.username)) // Check if the person is already in the database
    {
      count.set(context.username, count.get(context.username) + occurrences(commandName, "Pogpega") - occurrences(commandName, "ThatOneGuyWhoSpamsPogpega")); // Add new pogpegas to the user
    }
    else // If the person is not in the database
    {
      count.set(context.username, occurrences(commandName, "Pogpega") - occurrences(commandName, "ThatOneGuyWhoSpamsPogpega")); // Add them to it
    }

    // If someone donates $7.27
    if (context.username === 'streamelements' && commandName.includes('just tipped $7.27 PogU HYPERCLAP')) 
    {
      sleep(1000);
      client.say(target, 'Pogpega WYSI '); // This is the only thing that works in online chat
      console.log(`* I SEE IT`);
    }
    /*else if (context.username === 'streamelements' && commandName.includes('is currently 7:27')) 
    {
      client.say(target, '/me Pogpega WYSI');
      console.log('* I SEE IT');
    }*/

    /*if (commandName.includes('Pogpega /')) {
      client.say(target, '/me Pogpega / @' + context.username);
      console.log(`* Pogpega /`);
    }
    else if (commandName.includes('Pogpega 7')) {
      client.say(target, '/me Pogpega 7 @' + context.username);
      console.log(`* Executed ${commandName} command`);
    }
    else */

    // Remove the trigger for >ping when there's a response from the pinger bot
    if (context.username === 'thatonebotwhopingspogpega')
    {
      pinged = true;
      console.log("pinged");
    }

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
    commandName = commandName.trim();

    // >scramble
    if (guessing) // If >scramble is currently active
    {
      if (commandName === commandList[guessIndex]) // If someone says the correct command
      {
        client.say(target, "/me Pogpega no wae Pogpega thats correct its " + commandList[guessIndex]);
        console.log(`* Guessed correctly`);
        guessing = false;
      }
    }

    // Offline ping message
    if (commandName.startsWith(">ping")) 
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

    // Control the led
    if (commandName.startsWith(">led")) 
    {
      if (commandName === '>led on') 
      {
        switch (ledChat.readSync()) 
        {
          case 0:
            ledChat.writeSync(1);
            if (offline) { client.say(target, "/me Pogpega the led is now on"); }
            break;
          case 1:
            if (offline) { client.say(target, "/me Pogpega the led is already on"); }
            break;
        }
      }
      else if (commandName === '>led off') 
      {
        switch (ledChat.readSync()) 
        {
          case 0:
            if (offline) { client.say(target, "/me Pogpega the led is already off"); }
            break;
          case 1:
            ledChat.writeSync(0);
            if (offline) { client.say(target, "/me Pogpega the led is now off"); }
            break;
        }
      }
      else if (commandName === '>led status') 
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
        if (offline) { client.say(target, "/me Pogpega @" + context.username + " current status: " + statusLED + ", " + statusRGB + " (" + color + ")"); }
      }
      else if (commandName === '>led toggle') 
      {
        switch (ledChat.readSync())
        {
          case 0:
            ledChat.writeSync(1);
            if (offline) { client.say(target, "/me Pogpega the led was off and now its on"); }
            break;
          case 1:
            ledChat.writeSync(0);
            if (offline) { client.say(target, "/me Pogpega the led was on and now its off"); }
            break;
        }
      }
      else if (commandName.startsWith(">led rgb ")) 
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
            if (offline) { client.say(target, "/me Pogpega @" + context.username + " enter a valid color (look at >commands to see the colors)"); }
            failed = true;
            break;
        }
        if (!failed) 
        {
          if (offline) { client.say(target, "/me Pogpega @" + context.username + " changed the color to " + color); }
          console.log(`* color changed`);
        }
      }
      else if (commandName === ">led color")
      {
        if (offline) { client.say(target, "/me Pogpega @" + context.username + " the color is currently " + color); }
      }
      else if (commandName === ">led") 
      {
        if (offline) { client.say(target, "/me Pogpega @" + context.username + " use >led on and >led off to change an led connected to my pi. >led status to check current status."); }
      }
    }

    if (!offline)
    {
      if (target === "#btmc") 
      {
        target = "#thatonebotwhospamspogpega";
      }
    }
    // Else-If hell
    if (commandName === '>pogpegafarm') 
    {
      client.say(target, `/me Pogpega POGPEGA FARMING`);
      console.log(`* POGPEGA FARMING`);
    }
    else if (commandName === '>deceit') 
    {
      client.say(target, '/me Pogpega 𝒟𝐼𝒟 𝒴𝒪𝒰 𝒥𝒰𝒮𝒯 𝒮𝒜𝒴 𝒯𝐻𝐸 𝒟𝐸𝒞𝐸𝐼𝒯');
      console.log('* deceit has been said');
    }
    else if (commandName === '!prefix') 
    {
      client.say(target, '/me Pogpega @' + context.username + ' prefix is >{command}');
      console.log(`* !prefix`);
    }
    else if (/*context.username === 'streamelements' && */commandName.startsWith('Use code') && chance(5)) 
    {
      client.say(target, '/me Pogpega 👆 Use code "Pogpega" !!! ');
      console.log(`* gfuel`);
    }
    else if (commandName === ">servo")
    {
      client.say(target, "/me Pogpega Input a number between 500 and 2500 to rotate a servo connected to the pi");
    }
    else if (commandName.startsWith(">servo ")) 
    {
      commandName = commandName.substring(7);
      if (commandName.toLowerCase() === "location")
      {
        client.say(target, "/me Pogpega The servo is at location " + servoLocation);
      } else
      {
        try
        {
          commandName = parseInt(commandName);
          motor.servoWrite(commandName); // Range 500-2500
          client.say(target, "/me Pogpega Moving servo from " + servoLocation + " to " + commandName);
          servoLocation = commandName;
        }
        catch (erroneous)
        {
          client.say(target, "/me Pogpega Chatting Error: " + erroneous.message);
        }
      }
    }
    else if (commandName === '!bored') 
    {
      client.say(target, '/me Pogpega @' + context.username + ' spam pogpega ');
      console.log(`* imagine being bored`);
    }
    else if (commandName === ">pogpegas") 
    {
      client.say(target, "/me Pogpega @" + context.username + " has " + count.get(context.username) + " Pogpegas");
    }
    else if (commandName.startsWith(">pogpegas ")) 
    {
      var request = commandName.slice(10).toLowerCase().trim();
      if (request.startsWith("@")) 
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
    else if (commandName.startsWith(">give "))
    {
      commandName = commandName.slice(6).trim();
      if (commandName.startsWith("@"))
      {
        commandName = commandName.slice(1);
      }
      var request = commandName.split(" ");
      request[0] = request[0].toLowerCase();
      if (count.has(request[0]) && count.has(context.username) && count.get(context.username) >= parseInt(request[1]))
      {
        count.set(context.username, count.get(context.username) - parseInt(request[1]));
        count.set(request[0], count.get(request[0]) + parseInt(request[1]));
        client.say(target, "/me Pogpega transferred " + parseInt(request[1]) + " Pogpegas from @" + context.username + " to @" + request[0]);
      }
    }
    else if (commandName === 'FRICK' && context.username === 'soran2202' && chance(5)) 
    {
      client.say(target, '/me Pogpega @soran2202 FRICK');
      console.log(`* soran fricked`);
    }
    else if (commandName.startsWith('Get 20% off Manscaped with code ')) 
    {
      client.say(target, '/me Pogpega 👆 Use code "Pogpega" !!! ');
      console.log(`* balls`);
    }
    else if (msg === 'Pogpega /' && chance(3)) 
    {
      client.say(target, '/me Pogpega / @' + context.username);
      console.log(`* Pogpega /`);
    }
    else if (context.username === "mrdutchboi" && commandName.includes("Boolin ?") && chance(3)) 
    {
      client.say(target, '/me Pogpega Boolin we boolin');
      console.log(`* we boolin`);
    }
    else if (commandName === '>maxfarm') 
    {
      client.say(target, 'Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega Pogpega');
      console.log('* Max Pogpegas farmed');
    }
    else if (commandName.includes('!pull') && chance(15)) 
    {
      client.say(target, '/me Pogpega @' + context.username + ' You pulled on these nuts lmao gottem Chatting');
      console.log('* lmao gottem');
    }
    else if (commandName.startsWith('!skin') && chance(10))
    {
      client.say(target, "/me Pogpega Chatting You chat here because you want Ed's skin. I chat here because I am a bot. We are not the same. ");
      console.log('* skin frogs');
    }
    else if (commandName.startsWith('>repeat ')) 
    {
      client.say(target, "/me Pogpega " + commandName.substring(7));
      console.log('* Chatting');
    }
    else if (commandName.startsWith('!roll') && chance(15)) 
    {
      client.say(target, '/me Pogpega @' + context.username + ' You rolled these nuts lmao gottem Chatting');
    }
    else if (commandName === '>online') 
    {
      client.say(target, "/me Pogpega Chatting if you can see this message, ed is offline");
    }
    else if (commandName === '!cock' || commandName === '>cock') 
    {
      client.say(target, "/me Pogpega Chatting ed's cock is 72.7mm (2.86 inches)");
      console.log(`* nice cock`);
    }
    else if (commandName.toLowerCase().includes("@homies") && chance(20)) 
    {
      client.say(target, "/me Pogpega PINGED");
      console.log(`* PINGED`);
    }
    else if (context.username === "fossabot" && commandName.includes(" \"") && soTure)
    {
      client.say(target, "/me Pogpega reeferSad so ture")
      console.log("this is so so ture");
      soTure = false;
    }
    else if (commandName.startsWith(">test "))
    {
      commandName = commandName.substring(6);
      checkToxic(target, context.username, commandName);
    }
    else if (commandName === "!stoic") 
    {
      soTure = true;
      setTimeout(function () { soTure = false }, 4000);
    }
    else if (commandName.startsWith('>homies')) 
    {
      client.say(target, "/me Pogpega Can't see THISS ? Download Chatterino Homies now PogU 👉 https://chatterinohomies.com/");
      console.log(`* Homies`);
    }
    else if (commandName === ">wordle") 
    {
      if (!wordleActive) 
      {
        wordle = fetch("https://word.digitalnook.net/api/v1/start_game/", { method: "POST" }).json();
        wordleActive = true;
        guessCounter = 0;
        resetLetters();
        correctPogu = false;
        client.say(target, "/me Pogpega wordle has started, use >guess to guess a 5 letter word");
      } else
      {
        client.say(target, "/me Pogpega there is already a wordle active");
      }
    }
    else if (commandName === ">wordle stop" && context.username === "thatoneguywhospamspogpega")
    {
      wordleActive = false;
      client.say(target, "/me Pogpega wordle stopped");
    }
    else if (commandName.toLowerCase().startsWith(">guess ")) 
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
            temp2 = " Pogpega HYPERCLAP +50 Pogpegas"
            console.log(`* guessed correctly (word: ` + end.answer + `)`);
            wordleActive = false;
            addPogpegas(context.username, 50);
            correctPogu = false;
          }
          client.say(target, "/me Pogpega " + guessCounter + "/6 " + temp + " (guess: " + commandName + ")" + avaliableLetters + temp2);
          console.log(`* guessed a word (` + commandName + `)`)

        }
        catch (err)
        {
          client.say(target, "/me Pogpega Tssk invalid word");
          console.error(err.message)
        }
      }
      else
      {
        client.say(target, "/me Pogpega there is no active wordle game (use >wordle to start one)")
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
          client.say(target, "/me Pogpega PainsChamp out of guesses, the word was " + end.answer)
          console.log(`* out of guesses (word: ` + end.answer + `)`)
          wordleActive = false;
        }
      }
      catch (err)
      {
        console.log(err.message)
      }
    }
    else if (commandName.startsWith('>emojify ')) 
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
    else if (commandName === '>rice') 
    {
      client.say(target, "/me Pogpega *!rice");
      console.log(`* rice`);
    }
    else if (commandName.startsWith(">steps"))
    {
      client.say(target, "/me Pogpega Current step count for today: " + fitbitActivity.summary.steps);
      console.log(`* said steps (` + fitbitActivity.summary.steps + `)`);
    }
    else if (commandName.startsWith(">calories")) 
    {
      client.say(target, "/me Pogpega Current calories burned today: " + fitbitActivity.summary.caloriesOut);
      console.log(`* said calories (` + fitbitActivity.summary.caloriesOut + `)`);
    }
    else if (commandName.startsWith(">sleep"))
    {
      var timeSlept = fitbitSleep.summary.totalTimeInBed - fitbitSleep.summary.stages.wake;
      client.say(target, "/me Pogpega Amount of sleep last night: " + minParse(timeSlept));
      console.log(`* said sleep (` + minParse(timeSlept) + `)`);
    }
    else if (commandName.startsWith(">refresh")) 
    {
      updateFitbit();
      client.say(target, "/me Pogpega Refreshed fitbit stats");
      console.log(`Manually refreshed fitbit`)
    }
    else if (context.username === "nekochattingbot" && commandName.startsWith("The rice cooker is off."))
    {
      client.say(target, "/me Pogpega reeferSad no rice");
      console.log(`* reeferSad no rice`);
    }
    /*else if (commandName.startsWith(">output ")) 
    {
      buttonOutput = commandName.substring(8).toLowerCase();
      if (buttonOutput.charAt(0) != '#')
      {
        buttonOutput = "#" + buttonOutput;
      }
      client.say(target, "/me Pogpega Button output channel changed to " + buttonOutput);
    }*/
    else if (commandName === '>commands') 
    {
      client.say(target, '@' + context.username + ' List of commands for the Pogpega bots: https://pogpe.ga/bots');
      console.log(`* command doc sent`);
    }
    else if (commandName === ">scramble") 
    {
      if (!guessing) 
      {
        guessIndex = Math.floor(Math.random() * commandList.length);
        client.say(target, "/me Pogpega Unscramble this command: " + shuffle(commandList[guessIndex]));
        guessing = true;
        console.log(`* Scrambled word (` + commandList[guessIndex] + `)`);
      }
    }
    else if (commandName.startsWith(">badtranslate ")) 
    {
      commandName = commandName.substring(14);
      client.say(target, "/me Pogpega Translating message TriFi");
      commandName = mess(commandName);
      client.say(target, "/me Pogpega Chatting " + commandName);
    }
    else if (commandName.startsWith(">translate "))
    {
      var lang = commandName.substring(11, 13);
      commandName = commandName.substring(14);
      try
      {
        commandName = translator(lang, commandName);
        if (commandName != undefined)
        {
          client.say(target, "/me Pogpega " + commandName);
        }
        else
        {
          client.say(target, "/me Pogpega Chatting Enter a valid language");
        }
      }
      catch (err)
      {
        client.say(target, "/me Pogpega Chatting " + err.message);
      }
    }
    else if (commandName.startsWith(">generate ")) 
    {
      commandName = commandName.substring(10);
      var contains = false;
      for (const text of blacklist) 
      {
        if (commandName.toLowerCase().includes(text)) 
        {
          contains = true;
        }
      }
      if (contains) 
      {
        client.say(target, "/me Pogpega Tssk @" + context.username + " that contains blacklisted words");
      }
      else 
      {
        client.say(target, "/me Pogpega Generating text TriFi");
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
            for (const text of blacklist) 
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
              client.say(target, `/me Pogpega Chatting ` + tempOut);
            }
          })()
        } catch (err) 
        {
          client.say(target, "/me Pogpega Chatting error: " + err);
        }
      }
    }
    else if (commandName === ">status")
    {
      client.say(target, "/me Pogpega " + status);
    } 
    else if (commandName.startsWith(">status ") && context.username === "thatoneguywhospamspogpega") 
    {
      commandName = commandName.substring(8);
      status = commandName;
    }
    else if (commandName.startsWith(">chat "))
    {
      commandName = commandName.substring(6);
      //chatterbotTarget = target;
      //chatterBot.send(commandName);
      PythonShell.run('ChatterBot.py', { pythonOptions: ['-u'], args: commandName }, function (err, results)
      {
        if (err)
        {
          client.say(target, "/me Pogpega Chatting Error: " + err.message);
        }
        client.say(target, "/me Pogpega " + results[0]);
        console.log(results[0]);
      });
    }
    else if (commandName.startsWith(">cbot "))
    {
      if (cbotCooldown + 4000 < new Date().getTime()) 
      {
        commandName = commandName.substring(6);
        cleverbot(commandName, cbotHistory).then(resp =>
        {
          cbotHistory.push(commandName);
          client.say(target, "/me Pogpega @" + context.username + " " + resp);
          console.log(resp);
          cbotHistory.push(resp);
        }).catch(err => client.say(target, "/me Pogpega Chatting Error: " + err.message));
        cbotCooldown = new Date().getTime();
      }
      else 
      {
        //client.say(target, "/me Pogpega pepeMeltdown too many requests (4s cooldown)");
      }
    }
    else if (commandName.startsWith(">reset") && context.username === "thatoneguywhospamspogpega")
    {
      cbotHistory = [];
      client.say(target, "/me Pogpega Cleared the conversation");
      console.log(`* Cleared Cleverbot history`);
    }
    else if (commandName.startsWith('>pyramid ')) 
    {
      commandName = commandName.substring(9);
      var length = parseInt(commandName);
      if (length > 6 || length < 2) 
      {
        client.say(target, "/me Pogpega @" + context.username + " enter a number from 2 to 6 (inclusive)");
      }
      else 
      {
        var c = target != "#thatoneguywhospamspogpega" && target != "#thatonebotwhospamspogpega";
        /*switch (length) 
        {
          case 2:
            client.say(target, "Pogpega ");
            if (c) {sleep(2001);}
            client.say(target, "Pogpega Pogpega");
            if (c) {sleep(2001);}
            client.say(target, "Pogpega ");
            break;
          case 3:
            client.say(target, "Pogpega ");
            sleep(2001);
            client.say(target, "Pogpega Pogpega");
            sleep(2001);
            client.say(target, "Pogpega Pogpega Pogpega");
            sleep(2001);
            client.say(target, "Pogpega Pogpega ");
            if (c) {sleep(2001);}
            client.say(target, "Pogpega ");
            break;
        }*/
        for (let i = 1; i <= length; i++) 
        {
          var tempLine = "";
          console.log("line " + i);
          for (let j = 0; j < i; j++) 
          {
            tempLine += "Pogpega ";
          }
          if (target != "#thatoneguywhospamspogpega" && target != "#thatonebotwhospamspogpega") 
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
            tempLine += "Pogpega ";
          }
          if (target != "#thatoneguywhospamspogpega" && target != "#thatonebotwhospamspogpega") 
          {
            sleep(2001);
          }
          client.say(target, tempLine);
        }
        console.log(`* Pogpega pyramid width ` + length);
      }
    }
    else 
    {
      console.log(`Unknown command ${commandName}`);
    }
    if (offline)
    {
      if (chance(20))
      {
        saveCounter();
      }
      if (chance(200))
      {
        refreshDate();
      }
      if (chance(50))
      {
        updateFitbit();
      }
      if (chance(100))
      {
        refreshFitbit();
      }
    } 
    else
    {
      if (chance(200))
      {
        saveCounter();
      }
      if (chance(1000))
      {
        refreshDate();
      }
      if (chance(250))
      {
        updateFitbit();
      }
      if (chance(500))
      {
        refreshFitbit();
      }
    }
  } 
  catch (errororor)
  {
    client.say(target, "/me Pogpega Chatting Error: " + errororor.message);
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

/*chatterBot.on('message', function (message)
{
  client.say(chatterbotTarget, "/me Pogpega " + message);
})*/

function addPogpegas(user, amount) 
{
  if (count.has(user)) // Check if the person is already in the database
  {
    count.set(user, count.get(user) + amount); // Add new pogpegas to the user
  }
  else // If the person is not in the database
  {
    count.set(user, amount); // Add them to it
  }
}

function ledRgbControl(r, g, b) 
{
  ledR.digitalWrite(r);
  ledG.digitalWrite(g);
  ledB.digitalWrite(b);
}

function updateFitbit()
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
function refreshFitbit()
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
    if (err) throw err;
  });
  fitbitTokens = token;
  console.log(`Refreshed Fitbit token`);
}

/*button.on('interrupt', (level) => {
  client.say(buttonOutput, "Pogpega");
  console.log(`* Button pressed`);
})*/

/*String.prototype.shuffle = function () 
{
  var a = this.split(""),
      n = a.length;

  for(var i = n - 1; i > 0; i--) 
  {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
  }
  return a.join("");
}*/
function shuffle(string)
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

function checkToxic(target, user, sentence)
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
        try{
        console.log(JSON.stringify(response.data, null, 2));
        var scores = [
          "Toxicity: " + response.data.attributeScores.SEVERE_TOXICITY.summaryScore.value,
          "Profanity: " + response.data.attributeScores.PROFANITY.summaryScore.value,
          "Identity attack: " + response.data.attributeScores.IDENTITY_ATTACK.summaryScore.value,
          "Threat: " + response.data.attributeScores.THREAT.summaryScore.value,
          "Sexual: " + response.data.attributeScores.SEXUALLY_EXPLICIT.summaryScore.value
        ]
        console.log(scores);
        client.say(target, "/me Pogpega @" + user + " " + scores);
      } catch (eerrro) {
        console.log(eerrro.message);
        client.say(target, "/me Pogpega Chatting invalid message (the bot thinks its not in english) @" + user);
      }
      });
  }).catch(err =>
  {
    console.log(err.message);
  });
}

function resetLetters() 
{
  letters = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,];
}

function l2n(letter)
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
function n2l(number)
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

/*function mess(text) 
{
  var result = "";
  translate(text, {from: 'en', to: 'es'}).then(res => {
    result = res.text;
  }).catch(err => {
    console.error(err);
  })
  console.log(result);
  translate(result, {from: 'es', to: 'fr'}).then(res => {
    result = res.text;
  }).catch(err => {
    console.error(err);
  })
  console.log(result);
  translate(result, {from: 'fr', to: 'hu'}).then(res => {
    result = res.text;
  }).catch(err => {
    console.error(err);
  })
  console.log(result);
  translate(result, {from: 'hu', to: 'az'}).then(res => {
    result = res.text;
  }).catch(err => {
    console.error(err);
  })
  console.log(result);
  translate(result, {from: 'az', to: 'ga'}).then(res => {
    result = res.text;
  }).catch(err => {
    console.error(err);
  })
  console.log(result);
  translate(result, {from: 'ga', to: 'sv'}).then(res => {
    result = res.text;
  }).catch(err => {
    console.error(err);
  })
  console.log(result);
  translate(result, {from: 'sv', to: 'vi'}).then(res => {
    result = res.text;
  }).catch(err => {
    console.error(err);
  })
  console.log(result);
  translate(result, {from: 'vi', to: 'ko'}).then(res => {
    result = res.text;
  }).catch(err => {
    console.error(err);
  })
  console.log(result);
  translate(result, {from: 'ko', to: 'pl'}).then(res => {
    result = res.text;
  }).catch(err => {
    console.error(err);
  })
  console.log(result);
  translate(result, {from: 'pl', to: 'ja'}).then(res => {
    result = res.text;
  }).catch(err => {
    console.error(err);
  })
  console.log(result);
  translate(result, {from: 'ja', to: 'en'}).then(res => {
    result = res.text;
  }).catch(err => {
    console.error(err);
  })
  return result;
}*/

/*function mess(text) {
  var result = "";
  translate.translate(text, 'en', 'fr').then((response) => {
    result = response;
  }).catch(err => console.error(err));
  translate.translate(result, 'fr', 'ms').then((response) => {
    result = response;
  }).catch(err => console.error(err));
  translate.translate(result, 'ms', 'az').then((response) => {
    result = response;
  }).catch(err => console.error(err));
  translate.translate(result, 'az', 'gl').then((response) => {
    result = response;
  }).catch(err => console.error(err));
  translate.translate(result, 'gl', 'lt').then((response) => {
    result = response;
  }).catch(err => console.error(err));
  translate.translate(result, 'lt', 'no').then((response) => {
    result = response;
  }).catch(err => console.error(err));
  translate.translate(result, 'no', 'mn').then((response) => {
    result = response;
  }).catch(err => console.error(err));
  translate.translate(result, 'mn', 'pl').then((response) => {
    result = response;
  }).catch(err => console.error(err));
  translate.translate(result, 'pl', 'ja').then((response) => {
    result = response;
  }).catch(err => console.error(err));
  translate.translate(result, 'ja', 'nl').then((response) => {
    result = response;
  }).catch(err => console.error(err));
  translate.translate(result, 'nl', 'en').then((response) => {
    result = response;
  });
  return result;
}*/
function mess(text)
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
  console.log(response);/*
  const res6 = fetch("https://libretranslate.de/translate", {
    method: "POST",
    body: JSON.stringify({
      q: response,
      source: "ga",
      target: "sv",
      format: "text"
    }),
    headers: { "Content-Type": "application/json" }
  }).json();
  response = cutDown(res6.translatedText);
  console.log(response);
  const res7 = fetch("https://libretranslate.de/translate", {
    method: "POST",
    body: JSON.stringify({
      q: response,
      source: "sv",
      target: "vi",
      format: "text"
    }),
    headers: { "Content-Type": "application/json" }
  }).json();
  response = cutDown(res7.translatedText);
  console.log(response);
  const res8 = fetch("https://libretranslate.de/translate", {
    method: "POST",
    body: JSON.stringify({
      q: response,
      source: "vi",
      target: "fi",
      format: "text"
    }),
    headers: { "Content-Type": "application/json" }
  }).json();
  response = cutDown(res8.translatedText);
  console.log(response);
  const res9 = fetch("https://libretranslate.de/translate", {
    method: "POST",
    body: JSON.stringify({
      q: response,
      source: "fi",
      target: "pl",
      format: "text"
    }),
    headers: { "Content-Type": "application/json" }
  }).json();
  response = cutDown(res9.translatedText);
  console.log(response);
  const res10 = fetch("https://libretranslate.de/translate", {
    method: "POST",
    body: JSON.stringify({
      q: response,
      source: "pl",
      target: "nl",
      format: "text"
    }),
    headers: { "Content-Type": "application/json" }
  }).json();
  response = cutDown(res10.translatedText);
  console.log(response);
  const res11 = fetch("https://libretranslate.de/translate", {
    method: "POST",
    body: JSON.stringify({
      q: response,
      source: "nl",
      target: "en",
      format: "text"
    }),
    headers: { "Content-Type": "application/json" }
  }).json();
  response = res11.translatedText;*/
  console.log(response);
  return response;
}
function cutDown(text) 
{
  try
  {
    var temp = text
    if (temp.length > 250) 
    {
      temp = temp.substring(0, 248);
    }
    return temp;
  } catch (err)
  {
    console.error(err);
  }
}
function translator(traget, text) 
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

function parseWordle(resp)
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
  if (result === "🟩🟩🟩🟩🟩")
  {
    correctPogu = true;
  }
  return result;
}

function parseLetters()
{
  var result = "";
  var result2 = "";
  letters.forEach((letter, index) =>
  {
    if (letter === 1)
    {
      result = result.concat(n2l(index));
    } else if (letter === 2)
    {
      result2 = result2.concat(n2l(index));
    }
  })
  return result + ", " + result2;
}

function sleep(miliseconds)
{
  var currentTime = new Date().getTime();
  while (currentTime + miliseconds >= new Date().getTime())
  {
    // Do absolutely nothing
  }
}

function refreshDate()
{
  today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
  var yyyy = today.getFullYear();

  today = yyyy + '-' + mm + '-' + dd;
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler(addr, port)
{
  console.log(`* Connected to ${addr}:${port}`);
}

function minParse(totalMinutes)
{
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);
  var timeSleep = timeParse(hours) + "h" + timeParse(minutes) + "m";
  if (timeSleep.charAt(0) == '0')
  {
    timeSleep = timeSleep.substring(1);
  }
  return timeSleep;
}

function timeParse(num)
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