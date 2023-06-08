import { Settings } from './Config.js';
import { world, DynamicPropertiesDefinition, system, ItemStack } from '@minecraft/server';
import { ActionFormData, ModalFormData } from '@minecraft/server-ui';
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
    const settingsSave = new DynamicPropertiesDefinition()
        .defineBoolean('Initialized')
        .defineBoolean('Debug Longest Tick')
        .defineBoolean('Debug TPS')
        .defineBoolean('Debug Smart Longest Tick')
        .defineBoolean('Debug Entity Counter')
        .defineBoolean('Debug Entity Change')
        .defineBoolean('Debug Script Uptime')
        .defineString('Debug Settings Item', 36)
        .defineString('Debug Settings Item Prefix', 36)
        .defineString('Debug Command Prefix', 1);
    eventData.propertyRegistry.registerWorldDynamicProperties(settingsSave);
    if (!world.getDynamicProperty('Initialized')) {
        world.setDynamicProperty('Initialized', true);
        world.setDynamicProperty('Debug TPS', Settings.TPS);
        world.setDynamicProperty('Debug Longest Tick', Settings['Longest Tick']);
        world.setDynamicProperty('Debug Smart Longest Tick', Settings['Smart Longest Tick']);
        world.setDynamicProperty('Debug Entity Counter', Settings['Entity Counter']);
        world.setDynamicProperty('Debug Entity Change', Settings['Entity Change']);
        world.setDynamicProperty('Debug Script Uptime', Settings['Script Uptime']);
        world.setDynamicProperty('Debug Settings Item', Settings['Settings Item']);
        world.setDynamicProperty('Debug Command Prefix', Settings['Command Prefix']);
    }
    else {
        Settings.TPS = world.getDynamicProperty('Debug TPS');
        Settings['Longest Tick'] = world.getDynamicProperty('Debug Longest Tick');
        Settings['Smart Longest Tick'] = world.getDynamicProperty('Debug Smart Longest Tick');
        Settings['Entity Counter'] = world.getDynamicProperty('Debug Entity Counter');
        Settings['Entity Change'] = world.getDynamicProperty('Debug Entity Change');
        Settings['Script Uptime'] = world.getDynamicProperty('Debug Script Uptime');
        Settings['Settings Item'] = world.getDynamicProperty('Debug Settings Item');
        Settings['Command Prefix'] = world.getDynamicProperty('Debug Command Prefix');
    }
});
world.beforeEvents.chatSend.subscribe(m => {
    const player = m.sender;
    if (!m.message.startsWith(Settings['Command Prefix']))
        return;
    const cmd = m.message.substring(Settings['Command Prefix'].length);
    switch (cmd) {
        case 'tools':
            m.cancel = true;
            system.run(() => {
                player.getComponent('inventory').container.addItem(new ItemStack(Settings['Settings Item']));
            });
            break;
        case 'gmc':
            m.cancel = true;
            player.runCommandAsync(`gamemode creative @s`);
            break;
        case 'gms':
            m.cancel = true;
            player.runCommandAsync(`gamemode survival @s`);
            break;
        case 'gma':
            m.cancel = true;
            player.runCommandAsync(`gamemode adventure @s`);
            break;
        case 'gmsp':
            m.cancel = true;
            player.runCommandAsync(`gamemode spectator @s`);
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
    if (event.itemStack.typeId !== Settings['Settings Item'])
        return;
    const player = event.source;
    new ActionFormData()
        .title('Debug Tools')
        .body('§bCreated by Gassayping')
        .button('Performance', 'textures/ui/Ping_Green')
        .button('Entities', 'textures/ui/icon_multiplayer')
        .button('Settings', 'textures/ui/gear')
        .show(player).then((result) => {
        if (result.canceled)
            return;
        switch (result.selection) {
            case 0:
                performanceSettings(player);
                break;
            case 1:
                entitySettings(player);
                break;
            case 2:
                configSettings(player);
                break;
            default: break;
        }
    });
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
            tickTotals -= tickLengths.pop();
        }
        if (tickLengths.length <= 5)
            titleArr.push(`TPS: §c${tickLengths.length}/20`);
        else if (tickLengths.length < 15)
            titleArr.push(`TPS: §e${tickLengths.length}/20`);
        else
            titleArr.push(`TPS: §2${tickLengths.length}/20`);
    }
    if (Settings['Longest Tick'] || Settings['Smart Longest Tick']) {
        const shouldChange = deltaTime > longestTick.tickLength || ++longestTick.time == longestTick.max;
        if (shouldChange) {
            longestTick.time = 0;
            longestTick.tickLength = parseFloat(deltaTime.toFixed(2));
        }
        if (Settings['Smart Longest Tick']) {
            if (longestTick.tickLength >= 0.1)
                titleArr.push(`§rLongest Tick: §9${longestTick.tickLength}`);
        }
        else
            titleArr.push(`§rLongest Tick: §9${longestTick.tickLength}`);
    }
    if (Settings['Entity Counter'] || Settings['Entity Change']) {
        const entityCount = overworld.getEntities().length;
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
function performanceSettings(player) {
    new ModalFormData()
        .title('Ticks Settings')
        .toggle('§aTPS Counter', Settings.TPS)
        .toggle('§aLongest Tick', Settings['Longest Tick'])
        .toggle('§aSmart Tick', Settings['Smart Longest Tick'])
        .toggle('§aScript Uptime', Settings['Script Uptime'])
        .show(player).then(r => {
        if (r.canceled)
            return;
        const responses = r.formValues;
        Settings.TPS = responses[0];
        world.setDynamicProperty('Debug TPS', Settings.TPS);
        Settings['Longest Tick'] = responses[1];
        world.setDynamicProperty('Debug Longest Tick', Settings['Longest Tick']);
        Settings['Smart Longest Tick'] = responses[2];
        world.setDynamicProperty('Debug Smart Longest Tick', Settings['Smart Longest Tick']);
        Settings['Script Uptime'] = responses[3];
        world.setDynamicProperty('Debug Script Uptime', Settings['Script Uptime']);
    });
}
function entitySettings(player) {
    new ModalFormData()
        .title('Entity Settings')
        .toggle('Entity Counter', Settings['Entity Counter'])
        .toggle('Entity Change', Settings['Entity Change'])
        .show(player).then(r => {
        if (r.canceled)
            return;
        const responses = r.formValues;
        Settings['Entity Counter'] = responses[0];
        world.setDynamicProperty('Debug Entity Counter', Settings['Entity Counter']);
        Settings['Entity Change'] = responses[1];
        world.setDynamicProperty('Debug Entity Change', Settings['Entity Change']);
    });
}
function configSettings(player) {
    new ModalFormData()
        .title('Config Settings')
        .textField('Menu Item', 'eg: minecraft: compass', Settings['Settings Item'])
        .textField('Custom Command Prefix', 'eg: .', Settings['Command Prefix'])
        .show(player).then(r => {
        if (r.canceled)
            return;
        const responses = r.formValues;
        Settings['Settings Item'] = responses[0];
        world.setDynamicProperty('Debug Settings Item', Settings['Settings Item']);
        Settings['Command Prefix'] = responses[1];
        world.setDynamicProperty('Debug Command Prefix', Settings['Command Prefix']);
    });
}
