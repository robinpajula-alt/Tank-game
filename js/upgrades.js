export const UPGRADES = {
    rapid: {
        name: 'Rapid Loader',
        text: 'Fire 35% faster.',
        cost: 'Your shots fly a bit slower.',
    },
    twin: {
        name: 'Twin Barrel',
        text: 'Every shot fires two shells side by side.',
        cost: 'Reloading takes 20% longer.',
    },
    armor: {
        name: 'Reinforced Hull',
        text: 'Your tank can take one extra hit per life.',
        cost: 'Your tank drives 12% slower.',
    },
    treads: {
        name: 'Turbo Treads',
        text: 'Drive 20% faster.',
        cost: 'No downside, but it is easier to crash.',
    },
    crew: {
        name: 'Spare Crew',
        text: 'Get two extra lives right away.',
        cost: 'No downside.',
    },
};

export function rollUpgradeChoices(owned = []) {
    const pool = Object.keys(UPGRADES).filter((key) => !owned.includes(key));
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 2);
}
