import "./ReloadScript";
import {overworld} from "./Exports";
import {world} from "@minecraft/server";

let tickLengths = [];
let tickTotals = 0;

world.events.tick.subscribe(e => tick(e))

function tick(t) {
    tickLengths.unshift(t.deltaTime);
    tickTotals += t.deltaTime;
    while (tickTotals > 1) {
        tickTotals -= tickLengths[tickLengths.length-1];
        tickLengths.pop();
    }
    if (tickLengths.length-1 < 5) {
        overworld.runCommandAsync(`title @a actionbar TPS: §c${tickLengths.length}/20`);
    } else if(tickLengths.length-1 < 15) {
        overworld.runCommandAsync(`title @a actionbar TPS: §e${tickLengths.length}/20`);
    } else {
        overworld.runCommandAsync(`title @a actionbar TPS: §2${tickLengths.length}/20`);
    }
}