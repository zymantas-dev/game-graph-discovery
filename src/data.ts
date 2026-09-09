export type Attribute = { id: string; name: string; kind: 'developer' | 'genre' | 'tag' };
export type Game = { id: string; name: string; image: string; year: string; description: string; attributes: Attribute[]; url: string };
const attribute = (kind: Attribute['kind'], name: string): Attribute => ({ kind, name, id: name.toLowerCase().replaceAll(' ', '-') });
const entries: [string, string, number, string, string, string[], string[]][] = [
  ['elden-ring', 'Elden Ring', 1245620, '2022', 'FromSoftware', ['RPG', 'Action'], ['Open World', 'Souls-like', 'Dark Fantasy']],
  ['dark-souls-iii', 'Dark Souls III', 374320, '2016', 'FromSoftware', ['RPG', 'Action'], ['Souls-like', 'Dark Fantasy']],
  ['sekiro', 'Sekiro: Shadows Die Twice', 814380, '2019', 'FromSoftware', ['Action'], ['Souls-like', 'Exploration']],
  ['witcher-3', 'The Witcher 3: Wild Hunt', 292030, '2015', 'CD PROJEKT RED', ['RPG'], ['Open World', 'Dark Fantasy', 'Story Rich']],
  ['hollow-knight', 'Hollow Knight', 367520, '2017', 'Team Cherry', ['Action', 'Adventure'], ['Souls-like', 'Exploration', 'Metroidvania']],
  ['dragons-dogma-2', 'Dragon’s Dogma 2', 2054970, '2024', 'CAPCOM', ['RPG', 'Action'], ['Open World', 'Dark Fantasy']],
  ['lies-of-p', 'Lies of P', 1627720, '2023', 'NEOWIZ', ['RPG', 'Action'], ['Souls-like', 'Dark Fantasy']],
  ['armored-core-vi', 'Armored Core VI', 1888160, '2023', 'FromSoftware', ['Action'], ['Mechs', 'Difficult']],
  ['cyberpunk-2077', 'Cyberpunk 2077', 1091500, '2020', 'CD PROJEKT RED', ['RPG', 'Action'], ['Open World', 'Story Rich', 'Sci-fi']],
  ['baldurs-gate-3', 'Baldur’s Gate 3', 1086940, '2023', 'Larian Studios', ['RPG', 'Strategy'], ['Story Rich', 'Fantasy']],
  ['skyrim', 'The Elder Scrolls V: Skyrim', 489830, '2016', 'Bethesda Game Studios', ['RPG'], ['Open World', 'Fantasy', 'Exploration']],
  ['monster-hunter-world', 'Monster Hunter: World', 582010, '2018', 'CAPCOM', ['RPG', 'Action'], ['Co-op', 'Fantasy']],
  ['dead-cells', 'Dead Cells', 588650, '2018', 'Motion Twin', ['Action'], ['Metroidvania', 'Roguelike', 'Difficult']],
  ['hades', 'Hades', 1145360, '2020', 'Supergiant Games', ['RPG', 'Action'], ['Roguelike', 'Story Rich']],
  ['outer-wilds', 'Outer Wilds', 753640, '2019', 'Mobius Digital', ['Adventure'], ['Exploration', 'Open World', 'Sci-fi']],
  ['no-mans-sky', 'No Man’s Sky', 275850, '2016', 'Hello Games', ['Adventure'], ['Exploration', 'Open World', 'Sci-fi']],
  ['disco-elysium', 'Disco Elysium', 632470, '2019', 'ZA/UM', ['RPG'], ['Story Rich', 'Choices Matter']],
  ['divinity-original-sin-2', 'Divinity: Original Sin 2', 435150, '2017', 'Larian Studios', ['RPG', 'Strategy'], ['Fantasy', 'Choices Matter']],
  ['ori', 'Ori and the Will of the Wisps', 1057090, '2020', 'Moon Studios', ['Action', 'Adventure'], ['Metroidvania', 'Exploration']],
  ['red-dead-redemption-2', 'Red Dead Redemption 2', 1174180, '2019', 'Rockstar Games', ['Action', 'Adventure'], ['Open World', 'Story Rich']],
];
const descriptions: Record<string, string> = {
  'elden-ring': 'A fractured world. A forgotten grace. Find your own way through the Lands Between, where every distant silhouette is an invitation to get lost.',
  'dark-souls-iii': 'Follow the fading flame through a kingdom at the edge of ruin. Deliberate combat and intricate paths reward those who keep looking.',
  'witcher-3': 'Take the long road through a world of tangled loyalties, old monsters, and choices that rarely have a simple answer.',
  'hollow-knight': 'Descend into a beautiful, forgotten kingdom. Every new ability opens another passage through its interconnected underground world.',
  'sekiro': 'Master the rhythm of the blade in a reimagined Sengoku Japan. Precision, patience, and a second chance shape every encounter.',
};
export const catalog: Game[] = entries.map(([id, name, steam, year, developer, genres, tags]) => ({
  id, name, year, image: `https://cdn.akamai.steamstatic.com/steam/apps/${steam}/header.jpg`,
  description: descriptions[id] ?? `Explore ${name} through its creators, genres, and the ideas it shares with other games. Follow a connection to find your next world.`,
  attributes: [attribute('developer', developer), ...genres.map(name => attribute('genre', name)), ...tags.map(name => attribute('tag', name))],
  url: `https://store.steampowered.com/app/${steam}/`,
}));
