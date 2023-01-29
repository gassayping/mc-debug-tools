import { Settings } from "./Config.js";
import { world, DynamicPropertiesDefinition } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";

console.warn("____________________Scripts and functions reloaded!____________________");
const overworld = world.getDimension("overworld");
const startTime = Date.now();
let tickLengths = [];
let tickTotals = 0;
let longestTick = { tickLength: 0, time: 0, max: 5 * 20 };

world.events.worldInitialize.subscribe(eventData => {
	let settingsSave = new DynamicPropertiesDefinition();
	settingsSave.defineBoolean("Initialized");
	settingsSave.defineBoolean("Debug TPS");
	settingsSave.defineBoolean("Debug Longest Tick");
	settingsSave.defineBoolean("Debug Smart Longest Tick");
	settingsSave.defineBoolean("Debug Entity Counter");
	settingsSave.defineBoolean("Debug Script Uptime");
	settingsSave.defineString("Debug Item", 36);
	settingsSave.defineString("Debug Item Namespace", 36);
	settingsSave.defineString("Debug Prefix", 1);
	eventData.propertyRegistry.registerWorldDynamicProperties(settingsSave);
	if (!world.getDynamicProperty("Initialized")) {
		world.setDynamicProperty("Initialized", true);
		world.setDynamicProperty("Debug TPS", Settings["TPS"]);
		world.setDynamicProperty("Debug Longest Tick", Settings["Longest Tick"]);
		world.setDynamicProperty("Debug Smart Longest Tick", Settings["Smart Longest Tick"]);
		world.setDynamicProperty("Debug Entity Counter", Settings["Entity Counter"]);
		world.setDynamicProperty("Debug Script Uptime", Settings["Script Uptime"]);
		world.setDynamicProperty("Debug Item", Settings["Settings Item"]);
		world.setDynamicProperty("Debug Item Namespace", Settings["Settings Item Prefix"]);
		world.setDynamicProperty("Debug Prefix", Settings["Command Prefix"]);
	} else {
		Settings["TPS"] = world.getDynamicProperty("Debug TPS");
		Settings["Longest Tick"] = world.getDynamicProperty("Debug Longest Tick");
		Settings["Smart Longest Tick"] = world.getDynamicProperty("Debug Smart Longest Tick");
		Settings["Entity Counter"] = world.getDynamicProperty("Debug Entity Counter");
		Settings["Script Uptime"] = world.getDynamicProperty("Debug Script Uptime");
		Settings["Settings Item"] = world.getDynamicProperty("Debug Item");
		Settings["Settings Item Prefix"] = world.getDynamicProperty("Debug Item Namespace");
		Settings["Command Prefix"] = world.getDynamicProperty("Debug Prefix");
	}
})

world.events.beforeChat.subscribe(m => {
	const player = m.sender.name
	switch (m.message) {
		case `${Settings["Command Prefix"]}tools`:
			m.cancel = true;
			overworld.runCommandAsync(`give ${player} ${Settings["Settings Item"]}`);
			break;
		case `${Settings["Command Prefix"]}gmc`:
			m.cancel = true;
			overworld.runCommandAsync(`gamemode creative ${player} `);
			break;
		case `${Settings["Command Prefix"]}gms`:
			m.cancel = true;
			overworld.runCommandAsync(`gamemode survival ${player} `);
			break;
		case `${Settings["Command Prefix"]}gma`:
			m.cancel = true;
			overworld.runCommandAsync(`gamemode adventure ${player} `);
			break;
		case `${Settings["Command Prefix"]}gmsp`:
			m.cancel = true;
			overworld.runCommandAsync(`gamemode spectator ${player} `);
			break;
		default: break;
	}
});
world.events.beforeItemUse.subscribe(event => {
	if (event.item.typeId == Settings["Settings Item Prefix"] + Settings["Settings Item"]) {
		const settingsMenu = new ModalFormData()
			.title("Debug Settings")
			.toggle("§aTPS Counter      §o§bDebug Tools", Settings["TPS"])
			.toggle("§aLongest Tick      §o§bCreated by:", Settings["Longest Tick"])
			.toggle("§aSmart Tick         §o§bGassayping", Settings["Smart Longest Tick"])
			.toggle("§aEntity Counter", Settings["Entity Counter"])
			.toggle("§aScript Uptime", Settings["Script Uptime"]);
		settingsMenu.show(event.source).then(r => {
			if (r.canceled) { return }
			const responses = r.formValues;
			Settings.TPS = responses[0];
			world.setDynamicProperty("Debug TPS", Settings["TPS"]);
			Settings["Longest Tick"] = responses[1];
			world.setDynamicProperty("Debug Longest Tick", Settings["Longest Tick"]);
			Settings["Smart Longest Tick"] = responses[2];
			world.setDynamicProperty("Debug Smart Longest Tick", Settings["Smart Longest Tick"]);
			Settings["Entity Counter"] = responses[3];
			world.setDynamicProperty("Debug Longest Tick", Settings["Entity Counter"]);
			Settings["Script Uptime"] = responses[4];
			world.setDynamicProperty("Debug Longest Tick", Settings["Script Uptime"]);
		})
	}
});

world.events.tick.subscribe(e => tick(e))

function tick(t) {
	let title = "title @a actionbar "
	if (Settings.TPS) {
		tickLengths.unshift(t.deltaTime);
		tickTotals += t.deltaTime;
		while (tickTotals > 1) {
			tickTotals -= tickLengths[tickLengths.length - 1];
			tickLengths.pop();
		}
		if (tickLengths.length <= 5) {
			title += `TPS: §c${tickLengths.length}/20 `
		} else if (tickLengths.length < 15) {
			title += `TPS: §e${tickLengths.length}/20 `
		} else {
			title += `TPS: §2${tickLengths.length}/20 `
		}
	}
	if (Settings["Longest Tick"] || Settings["Smart Longest Tick"]) {
		longestTick.time += 1;
		if (t.deltaTime > longestTick.tickLength || longestTick.time == longestTick.max) {
			longestTick.time = 0;
			longestTick.tickLength = t.deltaTime.toFixed(2);
		}
		if (Settings["Smart Longest Tick"]) {
			if (longestTick.tickLength >= 0.1) {
				title += `§rLongest Tick: §9${longestTick.tickLength}\n`
			}
		} else {
			title += `§rLongest Tick: §9${longestTick.tickLength}\n`
		}
	}
	if (Settings["Entity Counter"]) {
		const entityCount = Array.from(overworld.getEntities()).length
		title += `§rEntities: §g${entityCount} `;
	}
	if (Settings["Script Uptime"]) {
		const uptime = ((Date.now() - startTime) / 1000).toFixed(1);
		title += `§rScript Uptime: §b${uptime}s`
	}
	overworld.runCommandAsync(title);
}
