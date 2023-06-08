//@ts-expect-error
import { Settings } from './Config.js';
import { world, DynamicPropertiesDefinition, system, ItemStack, Vector, Player } from '@minecraft/server';
import { ModalFormData } from '@minecraft/server-ui';

console.warn('___Scripts and functions reloaded!___');
const overworld = world.getDimension('overworld');
const startTime = Date.now();
let lastTick = startTime;
const tickLengths = [];
let tickTotals = 0;
const longestTick = {
	tickLength: 0,
	time: 0,
	max: 5 * 20
};
const entityChange = {
	last: overworld.getEntities().length,
	delta: 0,
	timeout: 20
};

world.afterEvents.worldInitialize.subscribe(eventData => {
	let settingsSave = new DynamicPropertiesDefinition();
	settingsSave.defineBoolean('Initialized');
	settingsSave.defineBoolean('Debug TPS');
	settingsSave.defineBoolean('Debug Longest Tick');
	settingsSave.defineBoolean('Debug Smart Longest Tick');
	settingsSave.defineBoolean('Debug Entity Counter');
	settingsSave.defineBoolean('Debug Entity Change');
	settingsSave.defineBoolean('Debug Script Uptime');
	settingsSave.defineString('Debug Item', 36);
	settingsSave.defineString('Debug Item Namespace', 36);
	settingsSave.defineString('Debug Prefix', 1);
	eventData.propertyRegistry.registerWorldDynamicProperties(settingsSave);
	if (!world.getDynamicProperty('Initialized')) {
		world.setDynamicProperty('Initialized', true);
		world.setDynamicProperty('Debug TPS', Settings.TPS);
		world.setDynamicProperty('Debug Longest Tick', Settings['Longest Tick']);
		world.setDynamicProperty('Debug Smart Longest Tick', Settings['Smart Longest Tick']);
		world.setDynamicProperty('Debug Entity Counter', Settings['Entity Counter']);
		world.setDynamicProperty('Debug Entity Change', Settings['Entity Change']);
		world.setDynamicProperty('Debug Script Uptime', Settings['Script Uptime']);
		world.setDynamicProperty('Debug Item', Settings['Settings Item']);
		world.setDynamicProperty('Debug Item Namespace', Settings['Settings Item Prefix']);
		world.setDynamicProperty('Debug Prefix', Settings['Command Prefix']);
	} else {
		Settings.TPS = world.getDynamicProperty('Debug TPS');
		Settings['Longest Tick'] = world.getDynamicProperty('Debug Longest Tick');
		Settings['Smart Longest Tick'] = world.getDynamicProperty('Debug Smart Longest Tick');
		Settings['Entity Counter'] = world.getDynamicProperty('Debug Entity Counter');
		Settings['Entity Change'] = world.getDynamicProperty('Debug Entity Change');
		Settings['Script Uptime'] = world.getDynamicProperty('Debug Script Uptime');
		Settings['Settings Item'] = world.getDynamicProperty('Debug Item');
		Settings['Settings Item Prefix'] = world.getDynamicProperty('Debug Item Namespace');
		Settings['Command Prefix'] = world.getDynamicProperty('Debug Prefix');
	}
})

world.beforeEvents.chatSend.subscribe(m => {
	const player = m.sender
	if (!m.message.startsWith(Settings['Command Prefix'])) return;
	const cmd = m.message.substring(Settings['Command Prefix'].length);
	switch (cmd) {
		case 'tools':
			m.cancel = true;
			//@ts-ignore
			player.getComponent('inventory').container.addItem(new ItemStack(Settings['Settings Item']));
			break;
		case 'gmc':
			m.cancel = true;
			overworld.runCommandAsync(`gamemode creative ${player.name} `);
			break;
		case 'gms':
			m.cancel = true;
			overworld.runCommandAsync(`gamemode survival ${player.name} `);
			break;
		case 'gma':
			m.cancel = true;
			overworld.runCommandAsync(`gamemode adventure ${player.name} `);
			break;
		case 'gmsp':
			m.cancel = true;
			overworld.runCommandAsync(`gamemode spectator ${player.name} `);
			break;
		case 'tags':
			m.cancel = true;
			const tags = player.getTags();
			const response = (tags.length > 0) ? `Your tags: ${tags.join(', ')}` : 'You have no tags.';
			player.sendMessage(response);
			break;
		default: break;
	}
});
world.afterEvents.itemUse.subscribe(event => {
	if (event.itemStack.typeId === Settings['Settings Item Prefix'] + Settings['Settings Item']) {
		const settingsMenu = new ModalFormData()
			.title('Debug Settings')
			.toggle('§aTPS Counter      §o§bDebug Tools', Settings.TPS)
			.toggle('§aLongest Tick      §o§bCreated by:', Settings['Longest Tick'])
			.toggle('§aSmart Tick         §o§bGassayping', Settings['Smart Longest Tick'])
			.toggle('§aEntity Counter', Settings['Entity Counter'])
			.toggle('§aEntity Change', Settings['Entity Change'])
			.toggle('§aScript Uptime', Settings['Script Uptime']);
		settingsMenu.show(event.source as Player).then(r => {
			if (r.canceled) return;
			const responses = r.formValues;
			Settings.TPS = responses[0];
			world.setDynamicProperty('Debug TPS', Settings.TPS);
			Settings['Longest Tick'] = responses[1];
			world.setDynamicProperty('Debug Longest Tick', Settings['Longest Tick']);
			Settings['Smart Longest Tick'] = responses[2];
			world.setDynamicProperty('Debug Smart Longest Tick', Settings['Smart Longest Tick']);
			Settings['Entity Counter'] = responses[3];
			world.setDynamicProperty('Debug Entity Counter', Settings['Entity Counter']);
			Settings['Entity Change'] = responses[4];
			world.setDynamicProperty('Debug Entity Change', Settings['Entity Change']);
			Settings['Script Uptime'] = responses[5];
			world.setDynamicProperty('Debug Script Uptime', Settings['Script Uptime']);
		})
	}
});

system.runInterval(() => tick());

function tick() {
	const now = Date.now();
	const deltaTime = (now - lastTick) / 1000;
	const titleArr = [];
	if (Settings.TPS) {
		tickLengths.unshift(deltaTime);
		tickTotals += deltaTime;
		while (tickTotals > 1) {
			tickTotals -= tickLengths[tickLengths.length - 1];
			tickLengths.pop();
		}
		if (tickLengths.length <= 5) titleArr.push(`TPS: §c${tickLengths.length}/20`);
		else if (tickLengths.length < 15) titleArr.push(`TPS: §e${tickLengths.length}/20`);
		else titleArr.push(`TPS: §2${tickLengths.length}/20`);
	}
	if (Settings['Longest Tick'] || Settings['Smart Longest Tick']) {
		const shouldChange = deltaTime > longestTick.tickLength || ++longestTick.time == longestTick.max;
		if (shouldChange) {
			longestTick.time = 0;
			longestTick.tickLength = parseFloat(deltaTime.toFixed(2));
		}
		if (Settings['Smart Longest Tick']) {
			if (longestTick.tickLength >= 0.1) titleArr.push(`§rLongest Tick: §9${longestTick.tickLength}`);
		} else titleArr.push(`§rLongest Tick: §9${longestTick.tickLength}`);
	}
	if (Settings['Entity Counter'] || Settings['Entity Change']) {
		const entityCount = overworld.getEntities().length


		if (entityCount !== entityChange.last && Settings['Entity Change']) {
			const delta = entityCount - entityChange.last;
			entityChange.delta += delta;
			entityChange.last = entityCount;
			system.runTimeout(() => {
				entityChange.delta -= delta;
			}, entityChange.timeout);
		}

		titleArr.push(`§rEntities: §g${entityCount}${(entityChange.delta !== 0) ? ` (${((entityChange.delta > 0) ? '+' : '') + entityChange.delta})` : ''}`);
	}
	if (Settings['Script Uptime']) {
		const uptime = ((now - startTime) / 1000).toFixed(1);
		titleArr.push(`§rScript Uptime: §b${uptime}s`);
	}
	lastTick = now;
	titleArr[Math.floor((titleArr.length - 1) / 2)] += '\n';
	for (const player of world.getAllPlayers()) {
		player.onScreenDisplay.setActionBar(titleArr.join(' '));
	}
}
