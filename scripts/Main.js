import "./ReloadScript";
import {overworld} from "./Exports";
import { world } from "@minecraft/server";

let tickLengths = [];
let tickTotals = 0;

world.events.tick.subscribe(e => tick(e))

function tick(t) {
    tickLengths.unshift(t.deltaTime);
    tickTotals += t.deltaTime;
    if (tickLengths.length >= 100) {
        tickLengths.pop();
    }
    try{tickTotals -= tickLengths[20];} catch{}
    let tps = tickTotals/20;
    overworld.runCommandAsync(`title @a actionbar TPS:${tps}/20`);
}