import "./ReloadScript";
import {overworld} from "./Exports";
import {world} from "@minecraft/server";

let tickLengths = [];
let tickTotals = 0;
let longestTick = {tickLength: 0, time: 0};

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
    if (tickLengths.length-1 < 5) {
        overworld.runCommandAsync(`title @a actionbar TPS: §c${tickLengths.length}/20 §rLongest Tick: ${longestTick.tickLength}s`);
    } else if(tickLengths.length-1 < 15) {
        overworld.runCommandAsync(`title @a actionbar TPS: §e${tickLengths.length}/20 §rLongest Tick: ${longestTick.tickLength}s`);
    } else {
        overworld.runCommandAsync(`title @a actionbar TPS: §2${tickLengths.length}/20 §rLongest Tick: ${longestTick.tickLength}s`);
    }
}