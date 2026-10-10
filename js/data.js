'use strict';
// ---------- static game data ----------
const W = 480, H = 270, CX = 240, CY = 135;
const MAX_WAVE = 30;
const TUNE = { hp: 1.2, vol: 1 };

const HEROES = {
  pyro: {
    name: 'Pyromancer', title: 'Lord of Embers', col: '#ff8a2e', unlock: 0,
    atk: { kind: 'fireball', dmg: 9, cd: 0.85, range: 150, speed: 190, splash: 20, tgt: 'near' },
    spell: { name: 'Meteor Storm', cd: 20, aim: true, desc: 'Rain of flaming meteors at the cursor.' },
    desc: 'Fireballs explode in an area.'
  },
  cryo: {
    name: 'Frost Witch', title: 'Queen of Rime', col: '#7fdcff', unlock: 0,
    atk: { kind: 'frost', dmg: 7, cd: 0.7, range: 150, speed: 210, tgt: 'near' },
    spell: { name: 'Blizzard', cd: 22, aim: true, desc: 'Freezing storm zone. Shatters at the end.' },
    desc: 'Frost bolts slow enemies.'
  },
  storm: {
    name: 'Stormcaller', title: 'Thunder Sage', col: '#ffe94a', unlock: 0,
    atk: { kind: 'bolt', dmg: 8, cd: 1.0, range: 135, chains: 3, tgt: 'rand' },
    spell: { name: 'Thunder Tempest', cd: 18, aim: false, desc: 'Dozens of lightning strikes smite foes.' },
    desc: 'Lightning chains between foes.'
  },
  necro: {
    name: 'Necromancer', title: 'Soul Reaper', col: '#6dff8a', unlock: 20,
    atk: { kind: 'skull', dmg: 10, cd: 0.9, range: 150, speed: 120, tgt: 'strong' },
    spell: { name: 'Soul Harvest', cd: 24, aim: false, desc: 'Death wave. Slain foes become hunting souls.' },
    desc: 'Homing skulls. Kills may raise souls.'
  },
  sage: {
    name: 'Star Sage', title: 'Arcane Oracle', col: '#ff9bf2', unlock: 40,
    atk: { kind: 'arcane', dmg: 13, cd: 1.1, range: 190, speed: 270, pierce: 4, tgt: 'strong' },
    spell: { name: 'Black Hole', cd: 26, aim: true, desc: 'Singularity drags enemies in, then detonates.' },
    desc: 'Long range piercing missiles.'
  },
  druid: {
    name: 'Gaia Druid', title: 'Voice of Terra', col: '#9aff5a', unlock: 70,
    atk: { kind: 'thorn', dmg: 5, cd: 0.42, range: 125, speed: 230, tgt: 'near' },
    spell: { name: "Gaia's Embrace", cd: 30, aim: false, desc: 'Heal Earth, shield it, entangle enemies in thorns.' },
    desc: 'Rapid thorns. Slowly mends Earth.'
  },
  chrono: {
    name: 'Chronomancer', title: 'Keeper of Time', col: '#41e8d6', unlock: 110,
    atk: { kind: 'chrono', dmg: 8, cd: 0.8, range: 150, speed: 200, tgt: 'near' },
    spell: { name: 'Time Stop', cd: 42, aim: false, desc: 'Freeze time. Foes take extra damage.' },
    desc: 'Time bolts. Aura slows nearby foes.'
  },
  summoner: {
    name: 'Dragon Caller', title: 'Wyrm Binder', col: '#ff5a3a', unlock: 160,
    atk: { kind: 'flame', dmg: 4, cd: 0.45, range: 95, speed: 150, tgt: 'near' },
    spell: { name: 'Summon Dragon', cd: 40, aim: false, desc: 'A huge dragon circles Earth, burning everything.' },
    desc: 'Short range flame shotgun.'
  }
};
const HERO_ORDER = ['pyro', 'cryo', 'storm', 'necro', 'sage', 'druid', 'chrono', 'summoner'];

// minW: first wave; w: spawn weight; cost: wave budget cost
const ENEMIES = {
  imp:    { spr: 'imp', r: 5, hp: 14, spd: 22, dmg: 5, cost: 1, gold: 2, minW: 1, w: 10, col: '#e0453a' },
  bat:    { spr: 'bat', r: 5, hp: 8, spd: 40, dmg: 3, cost: 1, gold: 2, minW: 2, w: 7, col: '#b06af0', wave: true },
  skull:  { spr: 'skull', r: 5, hp: 42, spd: 16, dmg: 8, cost: 3, gold: 5, minW: 3, w: 6, col: '#e8e2d0' },
  bomber: { spr: 'bomber', r: 4, hp: 22, spd: 56, dmg: 20, cost: 4, gold: 5, minW: 6, w: 3, col: '#ff7a2a', bomb: true },
  eye:    { spr: 'eye', r: 6, hp: 30, spd: 26, dmg: 6, cost: 4, gold: 6, minW: 5, w: 4, col: '#c04ad6', stop: 100, shoot: 2.2 },
  slime:  { spr: 'slime', r: 5, hp: 34, spd: 17, dmg: 7, cost: 3, gold: 4, minW: 7, w: 5, col: '#4fd45a', split: true },
  slimeS: { spr: 'slimeS', r: 4, hp: 14, spd: 24, dmg: 4, cost: 1, gold: 1, minW: 99, w: 0, col: '#4fd45a' },
  healer: { spr: 'healer', r: 5, hp: 32, spd: 19, dmg: 5, cost: 5, gold: 8, minW: 10, w: 3, col: '#c8fff0', heal: true },
  golem:  { spr: 'golem', r: 7, hp: 130, spd: 11, dmg: 18, cost: 9, gold: 14, minW: 9, w: 3, col: '#9a8fa8', armor: 3 }
};
const BOSSES = [
  { id: 'demon', name: 'DEMON LORD', spr: 'demon', hp: 480, spd: 10, r: 14, dmg: 40, gold: 120, ai: ['summon'] },
  { id: 'eyeboss', name: 'EYE OF THE VOID', spr: 'eyeboss', hp: 1250, spd: 12, r: 14, dmg: 40, gold: 160, stop: 115, ai: ['ring'] },
  { id: 'dragon', name: 'BONE WYRM', spr: 'dragon', hp: 2300, spd: 13, r: 14, dmg: 50, gold: 220, ai: ['spread'] }
];

const SPEC = {
  // relic: id, name, icon, rarity (0 common, 1 rare, 2 legendary), max stacks, text
};
const RELICS = [
  { id: 'focus', n: 'Arcane Focus', i: '🔮', r: 0, max: 99, t: '+15% all damage' },
  { id: 'haste', n: 'Quickened Wands', i: '⚡', r: 0, max: 8, t: '+10% attack speed' },
  { id: 'reach', n: 'Eagle Eye Lens', i: '🔭', r: 0, max: 5, t: '+10% attack range' },
  { id: 'gold', n: 'Goblin Purse', i: '💰', r: 0, max: 8, t: '+20% gold from kills' },
  { id: 'cdr', n: 'Hourglass', i: '⏳', r: 0, max: 6, t: 'Spells recharge 10% faster' },
  { id: 'spellpow', n: 'Spellbook of Ruin', i: '📕', r: 0, max: 8, t: '+20% spell damage' },
  { id: 'hp', n: 'Planet Ward', i: '🛡️', r: 0, max: 8, t: '+25 max Earth HP and heal 25' },
  { id: 'crit', n: 'Lucky Clover', i: '🍀', r: 1, max: 6, t: '+8% crit chance (crits deal x2)' },
  { id: 'burn', n: 'Ember Touch', i: '🔥', r: 1, max: 5, t: 'Hits ignite foes (burn dmg)' },
  { id: 'chill', n: 'Frost Touch', i: '❄️', r: 1, max: 4, t: 'Hits slow foes 15%' },
  { id: 'double', n: 'Twin Cast', i: '✨', r: 1, max: 5, t: '12% chance attacks fire twice' },
  { id: 'chain', n: 'Chain Reaction', i: '💥', r: 1, max: 5, t: 'Slain foes explode' },
  { id: 'vamp', n: 'Life Siphon', i: '🩸', r: 1, max: 5, t: 'Kills heal Earth a bit' },
  { id: 'siphon', n: 'Mana Siphon', i: '🌀', r: 1, max: 5, t: 'Cataclysm charges 25% faster' },
  { id: 'rift', n: 'Time Rift', i: '🕳️', r: 1, max: 5, t: 'All enemies 7% slower' },
  { id: 'echo', n: 'Spell Echo', i: '🔁', r: 2, max: 3, t: '20% chance spells cast twice' },
  { id: 'stars', n: 'Starfall', i: '🌠', r: 2, max: 4, t: 'Stars fall on foes regularly' },
  { id: 'phoenix', n: 'Phoenix Feather', i: '🦅', r: 2, max: 1, t: 'Earth is reborn once at 50% HP' },
  { id: 'ally', n: "Wizard's Oath", i: '🧙', r: 2, max: 3, t: 'A free wizard joins you' },
  { id: 'midas', n: 'Midas Touch', i: '👑', r: 2, max: 3, t: '+50% gold, +10% damage' }
];
const RELIC = {}; RELICS.forEach(r => RELIC[r.id] = r);

const PERKS = [
  { id: 'hp', n: 'Stone Foundations', t: '+12 Earth HP per level', max: 8, cost: l => 25 + l * 20 },
  { id: 'gold', n: 'Treasure Sense', t: '+25 starting gold per level', max: 6, cost: l => 30 + l * 25 },
  { id: 'dmg', n: 'Ancient Tomes', t: '+4% damage per level', max: 8, cost: l => 40 + l * 30 },
  { id: 'cd', n: 'Mana Fountain', t: 'Spells recharge 3% faster per level', max: 6, cost: l => 40 + l * 30 },
  { id: 'ult', n: 'Cataclysm Seed', t: 'Start waves with +8 charge per level', max: 5, cost: l => 35 + l * 25 }
];

const DIFFS = {
  apprentice: { n: 'APPRENTICE', hp: 0.8, earth: 1.4, gold: 1.2, c: '#7dff7a', crystal: 0.7 },
  wizard: { n: 'WIZARD', hp: 1.0, earth: 1.0, gold: 1.0, c: '#ffe14a', crystal: 1 },
  archmage: { n: 'ARCHMAGE', hp: 1.45, earth: 0.8, gold: 0.9, c: '#ff5a5a', crystal: 1.6 }
};

// ---------- save ----------
const SAVE_KEY = 'spellbound_orbit_v1';
function loadSave() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { }
  s = s && typeof s === 'object' ? s : {};
  s.crystals = Math.max(0, +s.crystals || 0);
  s.unlocked = Array.isArray(s.unlocked) ? s.unlocked.filter(id => HEROES[id]) : [];
  ['pyro', 'cryo', 'storm'].forEach(id => { if (!s.unlocked.includes(id)) s.unlocked.push(id); });
  s.perks = s.perks && typeof s.perks === 'object' ? s.perks : {};
  s.best = { apprentice: 0, wizard: 0, archmage: 0, ...(s.best || {}) };
  s.wins = +s.wins || 0; s.diff = DIFFS[s.diff] ? s.diff : 'wizard';
  s.sfx = s.sfx !== false; s.music = s.music !== false;
  s.runs = +s.runs || 0; s.kills = +s.kills || 0;
  return s;
}
let SAVE = loadSave();
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) { } }
