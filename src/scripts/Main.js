import {Settings} from "./Config.js";
import {world} from "@minecraft/server";
import {ActionFormData} from "@minecraft/server-ui";

console.warn("____________________Scripts and functions reloaded!____________________");
const overworld = world.getDimension("overworld");
let tickLengths = [];
let tickTotals = 0;
let longestTick = {tickLength: 0, time: 0};
let timer = {hasFirst: false, firstTick: 0};
let countingPlayer;
try{countingPlayer = world.getAllPlayers()[0].name;} catch{}
try{world.scoreboard.removeObjective("entityCounter");} catch{}
try{world.scoreboard.addObjective("entityCounter", "Entities");} catch{}

const settingsMenu = new ActionFormData()
    .title("Debug Settings")
    .body("Toggle Specific Trackers\n§4WARNING§r: Will NOT save on /reload\nEdit config.js file for persistent settings")
    .button("TPS Counter", "textures/ui/dev_glyph_color")
    .button("Longest Tick", "textures/ui/Ping_Red")
    .button("Entity Counter", "textures/ui/World")
    .button("Script Uptime", "textures/ui/clock");

world.events.beforeChat.subscribe(m =>{
switch (m.message) {
    case `${Settings["Command Prefix"]}tools`:
    m.cancel = true;
    overworld.runCommandAsync(`give ${m.sender.name} ${Settings["Settings Item"]}`);
    break;
    case `${Settings["Command Prefix"]}gmc`:
    m.cancel = true;
    overworld.runCommandAsync(`gamemode creative ${m.sender.name} `);
    break;
    case `${Settings["Command Prefix"]}gms`:
    m.cancel = true;
    overworld.runCommandAsync(`gamemode survival ${m.sender.name} `);
    break;
    case `${Settings["Command Prefix"]}gma`:
    m.cancel = true;
    overworld.runCommandAsync(`gamemode adventure ${m.sender.name} `);
    break;
    case `${Settings["Command Prefix"]}gmsp`:
    m.cancel = true;
    overworld.runCommandAsync(`gamemode spectator ${m.sender.name} `);
    break;
default: break;
}
});
world.events.beforeItemUse.subscribe(event => {
    if (event.item.typeId == Settings["Settings Item Prefix"]+Settings["Settings Item"]) {
        settingsMenu.show(event.source).then(r => {
            if (r.canceled) {return}
            switch(r.selection){
                case 0: Settings.TPS = !Settings.TPS; world.say("Toggled TPS Counter"); break;
                case 1: Settings["Longest Tick"] = !Settings["Longest Tick"]; world.say("Toggled Longest Tick Tracker"); break;
                case 2: Settings["Entity Counter"] = !Settings["Entity Counter"]; world.say("Toggled Entity Counter"); break;
                case 3: Settings["Script Uptime"] = !Settings["Script Uptime"]; world.say("Toggled Script Uptime"); break;
            }
        })
    }
});
world.events.playerJoin.subscribe(f => {
    if (countingPlayer == null) {
        try{countingPlayer = world.getAllPlayers()[0].name;} catch{}
    }
});
world.events.playerLeave.subscribe(f => {
    if (f.playerName == countingPlayer) {
        countingPlayer = world.getAllPlayers()[0].name;
    }
});

world.events.tick.subscribe(e => tick(e))

function tick(t) {
    if (countingPlayer == null) {
        try{countingPlayer = world.getAllPlayers()[0].name;} catch{}
    }
    let title = `title @a actionbar `
    if(Settings.TPS){
        tickLengths.unshift(t.deltaTime);
        tickTotals += t.deltaTime;
        longestTick.time += .05;
        while (tickTotals > 1) {
            tickTotals -= tickLengths[tickLengths.length-1];
            tickLengths.pop();
        }
        if (tickLengths.length <= 5) {
            title += `TPS: §c${tickLengths.length}/20 `
        } else if(tickLengths.length < 15) {
            title += `TPS: §e${tickLengths.length}/20 `
        } else {
            title += `TPS: §2${tickLengths.length}/20 `
        }
    }
    if(Settings["Longest Tick"]){
        if(t.deltaTime > longestTick.tickLength || longestTick.time >= 5) {
            longestTick.time=0;
            longestTick.tickLength = (Math.round(t.deltaTime * 100))/100;
        }
        title += `§rLongest Tick: §9${longestTick.tickLength}\n`
    }
    if(Settings["Entity Counter"]){
        overworld.runCommandAsync(`scoreboard players set ${countingPlayer} entityCounter 0`);
        overworld.runCommandAsync(`execute as @e run scoreboard players add ${countingPlayer} entityCounter 1`);
        try{var entityCount = world.scoreboard.getObjective("entityCounter").getScores()[0].score;} catch{}
        title += `§rEntities: §g${entityCount} `;
    }
    if(Settings["Script Uptime"]){
        if(!timer.hasFirst){
            timer.firstTick = t.currentTick;
            timer.hasFirst = true;
        }
        title += `§rScript Uptime: §b${(Math.round((t.currentTick-timer.firstTick)/2)/10).toFixed(1)}s `
    }
    overworld.runCommandAsync(title);
}