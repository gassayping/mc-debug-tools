import "./ReloadScript";
import {overworld} from "./Exports";
import {world} from "@minecraft/server";

let tickLengths = [];
let tickTotals = 0;
let longestTick = {tickLength: 0, time: 0};
let countingPlayer;
try{countingPlayer = world.getAllPlayers()[0].name;} catch{}
try{world.scoreboard.removeObjective("entityCounter");} catch{}
try{world.scoreboard.addObjective("entityCounter", "Entities");} catch{}

world.events.playerJoin.subscribe(f => {
    if (countingPlayer == null) {
        countingPlayer = world.getAllPlayers()[0].name;
    }
});
world.events.playerLeave.subscribe(f => {
    if (f.playerName == countingPlayer) {
        countingPlayer = world.getAllPlayers()[0].name;
    }
});

world.events.tick.subscribe(e => tick(e))

function tick(t) {
    tickLengths.unshift(t.deltaTime);
    tickTotals += t.deltaTime;
    longestTick.time += .05;
    while (tickTotals > 1) {
        tickTotals -= tickLengths[tickLengths.length-1];
        tickLengths.pop();
    }
    if(t.deltaTime > longestTick.tickLength || longestTick.time >= 5) {
        longestTick.time=0;
        longestTick.tickLength = (Math.round(t.deltaTime * 100))/100;
    }
    overworld.runCommandAsync(`scoreboard players set ${countingPlayer} entityCounter 0`);
    overworld.runCommandAsync(`execute as @e run scoreboard players add ${countingPlayer} entityCounter 1`);
    try{var entityCount = world.scoreboard.getObjective("entityCounter").getScores()[0].score;} catch{}
    if (tickLengths.length <= 5) {
        overworld.runCommandAsync(`title @a actionbar TPS: §c${tickLengths.length}/20 §rLongest Tick: §9${longestTick.tickLength}s \n§gEntities: ${entityCount}`);
    } else if(tickLengths.length < 15) {
        overworld.runCommandAsync(`title @a actionbar TPS: §e${tickLengths.length}/20 §rLongest Tick: §9${longestTick.tickLength}s \n§gEntities: ${entityCount}`);
    } else {
        overworld.runCommandAsync(`title @a actionbar TPS: §2${tickLengths.length}/20 §rLongest Tick: §9${longestTick.tickLength}s \n§gEntities: ${entityCount}`);
    }
}