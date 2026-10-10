'use strict';
// ================= CORE GAME =================
const cv = document.getElementById('cv');
const ctx = cv.getContext('2d', { alpha: false });
ctx.imageSmoothingEnabled = false;
const G = { on: false, mx: CX + 80, my: CY, mouseIn: false, parts: [], pops: [], fx: [], actors: [], enemies: [], projs: [], eprojs: [], heroes: [], t: 0 };
let M = {};
const rnd = Math.random, TAU = Math.PI * 2;
const R = (a, b) => a + rnd() * (b - a);
const perk = id => (SAVE.perks[id] || 0);

// ---------- run setup ----------
function newRun(diffKey, startHero) {
  const D = DIFFS[diffKey];
  Object.assign(G, {
    on: true, over: false, dying: 0, won: false, endless: false, diffKey, D, t: 0, wave: 0, phase: 'inter',
    gold: 60 + 25 * perk('gold'), earth: { hp: 100, max: 100, shield: 0, shieldT: 0, flash: 0, phoenix: false },
    heroes: [], relics: {}, enemies: [], projs: [], eprojs: [], parts: [], pops: [], fx: [], actors: [],
    ult: perk('ult') * 8, ultCast: 0, timeStop: 0, shake: 0, flash: 0, flashCol: '#fff', slowmo: 1, speed: 1, paused: false,
    spawnQ: [], waveT: 0, kills: 0, bossesKilled: 0, aim: null, nextId: 1, rerolls: 0, auto: false, starT: 4,
    minions: [], pickups: [], frenzy: 0, goldEarned: 0, spellCasts: 0, boss: null, cardsPending: false, hurtT: 0, overShown: false, counted: false, paid: 0, winCounted: false, bossDef: null, _cards: null
  });
  recalc();
  G.earth.hp = G.earth.max;
  addHero(startHero);
  G.heroes[0].scd = 0;
}
function recalc() {
  const r = id => G.relics[id] || 0;
  M = {
    dmg: (1 + 0.15 * r('focus') + 0.1 * r('midas')) * (1 + 0.04 * perk('dmg')),
    spell: 1 + 0.2 * r('spellpow'),
    cdMul: Math.max(0.3, 1 - 0.1 * r('cdr') - 0.03 * perk('cd')),
    gold: (1 + 0.2 * r('gold') + 0.5 * r('midas')) * G.D.gold,
    range: 1 + 0.1 * r('reach'), haste: 1 + 0.1 * r('haste'),
    crit: 0.05 + 0.08 * r('crit'), dbl: 0.12 * r('double'), burn: r('burn'), chill: r('chill'),
    chain: r('chain'), vamp: r('vamp'), siphon: 1 + 0.25 * r('siphon'), rift: 1 - 0.07 * r('rift'),
    echo: 0.2 * r('echo'), stars: r('stars'), phoenix: r('phoenix'),
    sumDmg: 1 + 0.25 * r('bond'), rune: 1 + 0.6 * r('runes')
  };
  const mx = (100 + 12 * perk('hp') + 25 * r('hp')) * G.D.earth;
  G.earth.max = Math.round(mx);
}
const hmax = 6;
function heroCount() { return G.heroes.length; }
function addHero(id) {
  if (G.heroes.length >= hmax || G.heroes.some(h => h.id === id)) return false;
  const h = { id, sum: { lvl: 1, n: 1, skill: 0 }, lvl: 1, cd: R(0, 0.5), scd: 0, ang: rnd() * TAU, x: CX, y: CY, castT: 0, face: 1, tx: 0, ty: 0 };
  G.heroes.push(h); UI.spellbar(); return true;
}
function hstat(h) {
  const a = HEROES[h.id].atk, L = h.lvl;
  return {
    dmg: a.dmg * 1.25 * (1 + 0.3 * (L - 1)) * M.dmg, cd: a.cd / (M.haste * (1 + 0.04 * (L - 1))),
    range: a.range * M.range * (1 + 0.012 * (L - 1)), shots: 1 + (L >= 5 ? 1 : 0) + (L >= 10 ? 1 : 0), chains: (a.chains || 0) + (L >= 5 ? 1 : 0) + (L >= 10 ? 2 : 0)
  };
}
const spellPow = h => 0.8 * (1 + 0.14 * (h.lvl - 1)) * M.spell * M.dmg;
const spellCd = h => HEROES[h.id].spell.cd * M.cdMul * (h.lvl >= 10 ? 0.75 : 1);
const upCost = h => Math.round(28 * Math.pow(1.5, h.lvl - 1));
const HIRE = [0, 50, 130, 280, 520, 860];
const hireCost = () => HIRE[Math.min(G.heroes.length, 5)];

// ---------- particles / popups / fx ----------
function P(x, y, vx, vy, life, col, size, grav, add) {
  if (G.parts.length > 950) return;
  G.parts.push({ x, y, vx, vy, l: life, m: life, c: col, s: size || 1, g: grav || 0, a: !!add });
}
function burst(x, y, n, col, sp, life, size, grav, add) {
  for (let i = 0; i < n; i++) {
    const a = rnd() * TAU, s = R(0.2, 1) * sp;
    P(x, y, Math.cos(a) * s, Math.sin(a) * s, life * R(0.6, 1.2), col, size, grav, add);
  }
}
function pop(x, y, v, col, sc) {
  if (G.pops.length > 55) return;
  G.pops.push({ x: x + R(-4, 4), y, s: fmt(v), c: col, sc: sc || 1, l: 0.7, t: 0 });
}
function lightning(x0, y0, x1, y1, col, life) {
  const pts = [{ x: x0, y: y0 }], n = Math.max(2, Math.floor(Math.hypot(x1 - x0, y1 - y0) / 9));
  for (let i = 1; i < n; i++) {
    const t = i / n; pts.push({ x: x0 + (x1 - x0) * t + R(-5, 5), y: y0 + (y1 - y0) * t + R(-5, 5) });
  }
  pts.push({ x: x1, y: y1 });
  if (G.fx.length < 80) G.fx.push({ pts, col: col || '#fff59a', l: life || 0.18, m: life || 0.18 });
}
function shake(a) { G.shake = Math.min(10, Math.max(G.shake, a)); }
function flash(a, col) { G.flash = Math.max(G.flash, a); G.flashCol = col || '#fff'; }
function actor(o) { o.t = 0; G.actors.push(o); return o; }

// ---------- enemies ----------
const waveScale = n => 1 + 0.16 * n + 0.012 * n * n + 0.00025 * n * n * n;
function spawnPos(a) {
  const c = Math.cos(a), s = Math.sin(a);
  const rect = Math.min(Math.abs((W / 2 + 14) / (c || 1e-6)), Math.abs((H / 2 + 14) / (s || 1e-6)));
  const rr = rect * 0.8 + 265 * 0.2;
  return [CX + c * rr, CY + s * rr];
}
function spawnEnemy(tid, x, y, o) {
  o = o || {};
  const d = ENEMIES[tid] || o.def, ws = waveScale(G.wave) * G.D.hp * (1 + (TUNE.hp - 1) * Math.min(1, G.wave / 18));
  const e = {
    id: G.nextId++, tid, d, x, y, hp: 0, mhp: 0, spd: d.spd * 1.25 * (1 + 0.008 * G.wave), r: d.r, armor: d.armor || 0,
    dmg: d.dmg * (1 + 0.035 * G.wave), gold: d.gold, flash: 0, slowF: 1, slowT: 0, burnT: 0, burnD: 0, rootT: 0,
    ph: rnd() * TAU, elite: false, boss: false, at: R(0.5, 2), dead: false, dc: 999, spr: ART[d.spr], hitT: 0, bomb: !!d.bomb
  };
  e.mhp = e.hp = d.hp * ws * (o.hpMul || 1);
  if (!o.noElite && G.wave >= 8 && rnd() < Math.min(0.2, 0.05 + G.wave * 0.004) && !d.heal) {
    e.elite = true; e.mhp = e.hp = e.hp * 2.5; e.gold *= 4; e.spd *= 1.12;
  }
  G.enemies.push(e); return e;
}
function spawnBoss(def, tier, final) {
  const a = rnd() * TAU, [x, y] = spawnPos(a);
  const d = Object.assign({}, def);
  const hp = def.hp * 0.7 * waveScale(G.wave) * G.D.hp * (1 + tier * 0.3) * (final ? 2.4 : 1);
  const e = {
    id: G.nextId++, tid: def.id, d, x, y, hp, mhp: hp, spd: def.spd, r: def.r, armor: 2, dmg: G.earth.max * 0.3, gold: def.gold,
    flash: 0, slowF: 1, slowT: 0, burnT: 0, burnD: 0, rootT: 0, ph: 0, elite: false, boss: true, at: 3, dead: false, dc: 999,
    spr: ART[final ? 'titan' : def.spr], hitT: 0, ai: final ? ['summon', 'ring', 'spread'] : def.ai, name: final ? 'VOID EMPEROR' : def.name, stop: def.stop
  };
  G.enemies.push(e); G.boss = e;
  UI.banner(e.name, 'BOSS APPROACHES', 'boss'); sfx('boss'); shake(6); SND.setIntensity(1);
  return e;
}
function buildWave(n) {
  const q = [], avail = Object.keys(ENEMIES).filter(k => ENEMIES[k].minW <= n && ENEMIES[k].w > 0);
  const isBoss = n % 5 === 0;
  let budget = 6 + n * 4.6 + n * n * 0.55; if (isBoss) budget *= 0.65; budget *= TUNE.vol * (n <= 3 ? 0.8 : 1);
  const len = Math.min(75, 20 + n * 2);
  G.waveLen = len;
  let guard = 0;
  while (budget > 0.5 && guard++ < 200) {
    let tot = 0; const opts = avail.filter(k => ENEMIES[k].cost <= budget + 1);
    if (!opts.length) break;
    opts.forEach(k => tot += ENEMIES[k].w);
    let pick = rnd() * tot, tid = opts[0];
    for (const k of opts) { pick -= ENEMIES[k].w; if (pick <= 0) { tid = k; break; } }
    const d = ENEMIES[tid];
    let size = d.cost <= 1 ? Math.floor(R(4, 11)) : d.cost <= 4 ? Math.floor(R(2, 6)) : Math.floor(R(1, 3));
    size = Math.max(1, Math.min(size, Math.floor(budget / d.cost) || 1));
    const ang = rnd() * TAU, t0 = q.length ? R(0, len * 0.85) : 0.3, gap = R(0.25, 0.6);
    for (let i = 0; i < size; i++) q.push({ t: t0 + i * gap, tid, a: ang + R(-0.12, 0.12) });
    budget -= size * d.cost;
  }
  q.sort((a, b) => a.t - b.t);
  G.spawnQ = q;
  if (isBoss) {
    const idx = n / 5 - 1, tier = Math.floor(idx / 3);
    const final = n === MAX_WAVE && !G.endless;
    G.bossDef = { def: BOSSES[idx % 3], tier, final }; G.bossT = 1.5;
  } else G.bossDef = null;
}
function startWave() {
  if (!G.on || G.over || G.phase !== 'inter' || G.cardsPending) return;
  G.wave++; G.waveT = 0; G.phase = 'wave'; buildWave(G.wave);
  const isBoss = G.wave % 5 === 0;
  SND.setIntensity(isBoss ? 1 : (G.wave > 15 ? 1 : 0));
  const nf = Object.keys(ENEMIES).filter(k => ENEMIES[k].minW === G.wave).map(k => k.toUpperCase());
  UI.banner('WAVE ' + G.wave, isBoss ? 'BOSS WAVE!' : nf.length ? 'NEW FOE: ' + nf.join(', ') : G.wave === 1 ? 'DEFEND THE EARTH' : '', isBoss ? 'boss' : '');
  sfx('wave'); UI.closeShop(); UI.hudDirty();
}
function waveCleared() {
  G.phase = 'inter'; G.boss = null; SND.setIntensity(0);
  const bonus = Math.round((10 + G.wave * 4) * G.D.gold); G.gold += bonus; G.goldEarned += bonus;
  G.earth.hp = Math.min(G.earth.max, G.earth.hp + G.earth.max * 0.08);
  G.ult = Math.min(100, G.ult + 8 + perk('ult') * 2);
  sfx('clear'); { const a = rnd() * TAU, [px, py] = spawnPos(a); spawnPickup(px, py); }
  if (G.wave >= MAX_WAVE && !G.endless && !G.won) { G.won = true; return victory(); }
  UI.banner('WAVE ' + G.wave + ' CLEARED', '+' + bonus + ' GOLD', 'clear');
  G.cardsPending = true;
  setTimeout(() => { if (G.on && !G.over) UI.cards(rollCards(3)); }, 900);
}
function rollCards(n) {
  const pool = RELICS.filter(r => (G.relics[r.id] || 0) < r.max && !(r.id === 'ally' && !allyCandidates().length));
  const out = [];
  while (out.length < n && pool.length) {
    const wt = pool.map(r => r.r === 0 ? 60 : r.r === 1 ? 32 : 6 + G.wave * 0.5);
    let tot = wt.reduce((a, b) => a + b, 0), p = rnd() * tot, i = 0;
    for (; i < pool.length; i++) { p -= wt[i]; if (p <= 0) break; }
    i = Math.min(i, pool.length - 1);
    out.push(pool[i]); pool.splice(i, 1);
  }
  return out;
}
function allyCandidates() { return G.heroes.length >= hmax ? [] : SAVE.unlocked.filter(id => !G.heroes.some(h => h.id === id)); }
function takeRelic(r) {
  G.relics[r.id] = (G.relics[r.id] || 0) + 1; recalc();
  if (r.id === 'hp') G.earth.hp = Math.min(G.earth.max, G.earth.hp + 25);
  if (r.id === 'ally') { const c = allyCandidates(); if (c.length) addHero(c[Math.floor(rnd() * c.length)]); else G.gold += 150; }
  if (r.id === 'phoenix') G.earth.phoenix = true;
  if (r.id === 'pact') G.heroes.forEach(h => { if (h.sum.lvl < SUM_MAX.lvl) applySum(h, 'pwr'); });
  if (r.id === 'legion') { const c = G.heroes.filter(h => h.sum.n < SUM_MAX.n); if (c.length) applySum(c[Math.floor(rnd() * c.length)], 'num'); else G.gold += 80; }
  if (r.id === 'ascend') { const c = G.heroes.filter(h => h.sum.skill < SUM_MAX.skill); if (c.length) applySum(c[Math.floor(rnd() * c.length)], 'skill'); else G.gold += 120; }
  G.cardsPending = false; UI.hudDirty(); UI.spellbar();
}

// ---------- damage ----------
function dmgE(e, d, o) {
  if (e.dead) return 0; o = o || {};
  if (!o.raw) { if (rnd() < M.crit && !o.dot) { d *= 2; o.crit = true; } }
  if (G.timeStop > 0) d *= 1.4;
  if (e.armor) d = Math.max(d - e.armor, d * 0.25);
  e.hp -= d; e.flash = 0.07;
  if (!o.dot && d >= 1) pop(e.x, e.y - e.r - 2, d, o.crit ? '#ffe14a' : o.col || '#ffffff', o.crit ? 2 : 1);
  if (o.slow) { e.slowF = Math.min(e.slowF, o.slow); e.slowT = Math.max(e.slowT, o.slowT || 1.5); }
  if (o.burn) { e.burnD = Math.max(e.burnD, o.burn); e.burnT = Math.max(e.burnT, o.burnT || 3); }
  if (o.root) e.rootT = Math.max(e.rootT, o.root);
  if (!o.dot) {
    if (M.burn && !o.noproc) { e.burnD = Math.max(e.burnD, 3 * M.burn * (1 + G.wave * 0.12)); e.burnT = Math.max(e.burnT, 3); }
    if (M.chill && !o.noproc) { e.slowF = Math.min(e.slowF, 1 - 0.15 * M.chill); e.slowT = Math.max(e.slowT, 1.2); }
  }
  if (e.hp <= 0) killE(e, o);
  return d;
}
function killE(e, o) {
  if (e.dead) return; e.dead = true; G.kills++; SAVE.kills++;
  const g = Math.max(1, Math.round(e.gold * 0.75 * M.gold * (1 + G.wave * 0.02)));
  G.gold += g; G.goldEarned += g;
  if (e.boss || e.elite || rnd() < 0.3) pop(e.x, e.y - 8, g, '#ffd23f', e.boss ? 2 : 1);
  const charge = e.boss ? 20 : e.elite ? 3 : 1;
  G.ult = Math.min(100, G.ult + charge * M.siphon);
  if (e.boss) {
    G.bossesKilled++; G.boss = null; shake(9); flash(0.7, '#fff'); sfx('bigboom');
    burst(e.x, e.y, 60, '#ffd23f', 150, 1.2, 2, 40, true); burst(e.x, e.y, 40, e.d.col || '#ff6a2e', 110, 1, 2, 0, true);
    ring(e.x, e.y, 70, '#ffe14a', 0.6);
    G.enemies.forEach(x => { if (x !== e && !x.boss && !x.dead && Math.hypot(x.x - e.x, x.y - e.y) < 120) { x.hp = 0; x.dead = true; G.kills++; burst(x.x, x.y, 5, '#fff', 60, 0.5, 1); } });
  } else {
    burst(e.x, e.y, e.elite ? 14 : 7, e.d.col || '#fff', 55, 0.5, 1, 30);
    if (rnd() < 0.5) burst(e.x, e.y, 2, '#ffffff', 40, 0.35, 1);
    sfx('pop');
  }
  if (e.d.split) { for (let i = 0; i < 2; i++) { const s = spawnEnemy('slimeS', e.x + R(-6, 6), e.y + R(-6, 6), { noElite: true }); s.hp = s.mhp = s.mhp; } }
  if (M.vamp) G.earth.hp = Math.min(G.earth.max, G.earth.hp + 0.2 * M.vamp);
  if (M.chain && !(o && o.depth > 1)) boom(e.x, e.y, 26 + 3 * M.chain, (6 + G.wave * 1.6) * M.chain * M.dmg, '#ffb02e', { depth: ((o && o.depth) || 0) + 1, noproc: true, quiet: true });
  if (e.boss) { for (let i = 0; i < 3; i++) spawnPickup(e.x + R(-12, 12), e.y + R(-12, 12)); }
  else if (rnd() < (e.elite ? 0.45 : 0.03) * M.rune) spawnPickup(e.x, e.y);
  const necro = G.heroes.find(h => h.id === 'necro');
  if (necro && rnd() < 0.14 && !(o && o.soul)) spawnSoul(e.x, e.y, 10 * spellPow(necro) * 0.8);
}
function spawnSoul(x, y, d) {
  if (G.projs.length > 220) return;
  const a = rnd() * TAU;
  G.projs.push({ x, y, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60 - 20, dmg: d, r: 4, life: 4, pierce: 0, kind: 'soul', col: '#6dff8a', hom: 6, spd: 130, hit: [], soul: true });
}
function ring(x, y, r, col, life) { G.fx.push({ ring: true, x, y, r, col, l: life || 0.4, m: life || 0.4 }); }
function boom(x, y, r, d, col, o) {
  o = o || {};
  if (!o.quiet) sfx('boom');
  ring(x, y, r, col || '#ffb02e', 0.28);
  burst(x, y, Math.min(14, 4 + r / 4), col || '#ffb02e', r * 2.4, 0.4, 1, 20, true);
  if (d <= 0) return;
  const r2 = r * r;
  for (let i = 0; i < G.enemies.length; i++) {
    const e = G.enemies[i]; if (e.dead) continue;
    const dx = e.x - x, dy = e.y - y;
    if (dx * dx + dy * dy < (r + e.r) * (r + e.r)) dmgE(e, d, Object.assign({ col: col }, o));
  }
}

// ---------- earth ----------
function earthHit(d, bolt) {
  const E = G.earth; if (G.over) return;
  if (E.shield > 0) { const a = Math.min(E.shield, d); E.shield -= a; d -= a; G.fx.push({ ring: true, x: CX, y: CY, r: 28, col: '#7fdcff', l: 0.25, m: 0.25 }); }
  if (d > 0) {
    E.hp -= d; E.flash = 0.35; shake(bolt ? 2 : 4); sfx('earthHit');
    pop(CX + R(-10, 10), CY - 26, d, '#ff5a5a', 2);
    burst(CX + R(-16, 16), CY + R(-16, 16), 8, '#ff7a3a', 60, 0.5, 1, 20, true);
    if (E.hp <= 0) {
      if (M.phoenix && E.phoenix) {
        E.phoenix = false; E.hp = E.max * 0.5; flash(1, '#ffb02e'); shake(10); sfx('holy');
        G.relics.phoenix = 0; recalc();
        burst(CX, CY, 80, '#ffb02e', 220, 1.2, 2, 0, true);
        G.enemies.forEach(e => { if (!e.boss) { e.hp = 0; killE(e); } else dmgE(e, e.mhp * 0.15, { raw: 1 }); });
        UI.banner('PHOENIX REBIRTH', '', 'clear');
      } else { E.hp = 0; die(); }
    }
  }
}
function die() {
  if (G.over) return; G.over = true; G.dying = 2.6; SND.stopMusic(); sfx('bigboom'); flash(1, '#fff'); shake(10);
}
function victory() {
  UI.banner('VICTORY!', 'THE EARTH IS SAVED', 'clear'); sfx('win'); flash(0.8, '#ffe');
  for (let i = 0; i < 6; i++) setTimeout(() => { if (G.on) { burst(R(60, 420), R(40, 220), 40, ['#ffd23f', '#ff7a2e', '#7fdcff', '#ff9bf2'][i % 4], 120, 1, 2, 30, true); sfx('boom'); } }, i * 250);
  setTimeout(() => { if (G.on) UI.over(true); }, 2600);
}
function runReward() {
  const base = G.wave * 2 + G.bossesKilled * 8 + (G.won ? 60 : 0);
  return Math.round(base * G.D.crystal);
}
function endRun(won) {
  const c = runReward(); SAVE.crystals += c; SAVE.runs++;
  SAVE.best[G.diffKey] = Math.max(SAVE.best[G.diffKey] || 0, G.over && !won ? G.wave : G.wave);
  if (won) SAVE.wins++;
  persist(); return c;
}

// ---------- shop actions ----------
function upgradeHero(i) {
  const h = G.heroes[i]; if (!h || h.lvl >= 12) return false;
  const c = upCost(h); if (G.gold < c) { sfx('deny'); return false; }
  G.gold -= c; h.lvl++; h.castT = 0.5; sfx('buy'); burst(h.x, h.y, 12, HEROES[h.id].col, 50, 0.6, 1, -20, true);
  UI.hudDirty(); return true;
}
function hireHero(id) {
  const c = hireCost(); if (G.heroes.length >= hmax || G.gold < c) { sfx('deny'); return false; }
  if (!addHero(id)) return false;
  G.gold -= c; sfx('buy'); flash(0.2, HEROES[id].col); return true;
}
function repairCost() { return Math.round(18 + G.wave * 1.5); }
function wellCost() { return Math.round(30 + G.wave * 2); }
function repair() {
  const c = repairCost(); if (G.gold < c || G.earth.hp >= G.earth.max) { sfx('deny'); return false; }
  G.gold -= c; G.earth.hp = Math.min(G.earth.max, G.earth.hp + 30); sfx('buy'); burst(CX, CY, 20, '#7dff7a', 60, 0.6, 1, -20, true); return true;
}
function well() {
  const c = wellCost(); if (G.gold < c) { sfx('deny'); return false; }
  G.gold -= c; G.heroes.forEach(h => h.scd = 0); sfx('buy'); flash(0.2, '#9bf'); return true;
}
function rerollCost() { return 20 * (G.rerolls + 1); }

// ---------- update ----------
function updHeroes(dt) {
  const n = G.heroes.length;
  G.aura = G.heroes.find(h => h.id === 'chrono');
  G.heroes.forEach((h, i) => {
    const want = G.t * 0.22 + i * TAU / n;
    let d = ((want - h.ang + Math.PI) % TAU + TAU) % TAU - Math.PI;
    h.ang += d * Math.min(1, dt * 3);
    h.x = CX + Math.cos(h.ang) * 40; h.y = CY + Math.sin(h.ang) * 38;
    if (h.scd > 0) h.scd -= dt; if (h.castT > 0) h.castT -= dt;
    if (h.id === 'druid') G.earth.hp = Math.min(G.earth.max, G.earth.hp + (0.25 + 0.08 * h.lvl) * dt * (G.phase === 'wave' ? 1 : 0));
    // attack
    h.cd -= dt;
    if (h.cd <= 0 && (G.phase === 'wave' || G.enemies.length)) {
      const st = hstat(h), t = pickTarget(h, st);
      if (t) {
        h.face = t.x >= h.x ? 1 : -1;
        h.cd = st.cd; fire(h, t, st);
        if (rnd() < M.dbl) setTimeout(() => { if (G.on && !G.over && !G.paused && G.heroes.includes(h)) { const t2 = t.dead ? pickTarget(h, st) : t; if (t2) fire(h, t2, st); } }, 110);
      } else h.cd = 0.1;
    }
  });
  // auto-cast
  if (G.auto && G.phase === 'wave' && G.enemies.length > 2) {
    G.heroes.forEach((h, i) => {
      if (h.scd <= 0) { const c = bestSpot(); if (c) castSpell(i, c.x, c.y); }
    });
  }
}
function bestSpot() {
  const E = G.enemies; if (!E.length) return null;
  let best = null, bv = -1;
  const n = Math.min(24, E.length);
  for (let k = 0; k < n; k++) {
    const e = E[Math.floor(rnd() * E.length)]; if (e.dead) continue;
    let v = 0; for (let j = 0; j < E.length; j += 2) { const o = E[j]; if (Math.abs(o.x - e.x) < 45 && Math.abs(o.y - e.y) < 45) v += o.boss ? 5 : 1; }
    if (v > bv) { bv = v; best = e; }
  }
  return best ? { x: best.x, y: best.y } : null;
}
function pickTarget(h, st) {
  const mode = HEROES[h.id].atk.tgt, r2 = st.range * st.range; let best = null, bv = Infinity, cnt = 0;
  for (let i = 0; i < G.enemies.length; i++) {
    const e = G.enemies[i]; if (e.dead) continue;
    const dx = e.x - h.x, dy = e.y - h.y; if (dx * dx + dy * dy > r2) continue;
    if (mode === 'near') { if (e.dc < bv) { bv = e.dc; best = e; } }
    else if (mode === 'strong') { const v = -e.hp; if (v < bv) { bv = v; best = e; } }
    else { cnt++; if (rnd() * cnt < 1) best = e; }
  }
  return best;
}
function proj(o) {
  if (G.projs.length > 420) return;
  o.hit = []; o.pierce = o.pierce || 0; o.life = o.life || 2; o.r = o.r || 3; G.projs.push(o);
}
function fire(h, t, st) {
  const a = HEROES[h.id].atk, base = Math.atan2(t.y - h.y, t.x - h.x), k = a.kind, n = st.shots;
  h.castT = Math.max(h.castT, 0.08);
  if (k === 'bolt') {
    sfx('zap'); const hit = new Set(); let cur = t, px = h.x - 1, py = h.y - 6;
    for (let c = 0; c <= st.chains && cur; c++) {
      lightning(px, py, cur.x, cur.y, '#fff59a'); hit.add(cur.id);
      dmgE(cur, st.dmg * Math.pow(0.85, c), { col: '#fff59a', slow: 0 });
      px = cur.x; py = cur.y;
      let nx = null, nd = 70 * 70;
      for (const e of G.enemies) { if (e.dead || hit.has(e.id)) continue; const d = (e.x - px) ** 2 + (e.y - py) ** 2; if (d < nd) { nd = d; nx = e; } }
      cur = nx;
    }
    return;
  }
  for (let i = 0; i < n; i++) {
    const ang = base + (n > 1 ? (i - (n - 1) / 2) * 0.16 : 0) + (k === 'flame' ? R(-0.28, 0.28) : 0);
    const sp = a.speed, vx = Math.cos(ang) * sp, vy = Math.sin(ang) * sp, x = h.x + 3, y = h.y - 6;
    if (k === 'fireball') { sfx('fire'); proj({ x, y, vx, vy, dmg: st.dmg, kind: k, col: '#ff8a2e', splash: a.splash * (1 + 0.02 * h.lvl), r: 3, life: 1.6 }); }
    else if (k === 'frost') { sfx('frost'); proj({ x, y, vx, vy, dmg: st.dmg, kind: k, col: '#7fdcff', slow: 0.55, life: 1.6 }); }
    else if (k === 'skull') { sfx('skull'); proj({ x, y, vx, vy, dmg: st.dmg, kind: k, col: '#6dff8a', hom: 3.2, spd: sp, life: 2.4, r: 4 }); }
    else if (k === 'arcane') { sfx('arcane'); proj({ x, y, vx, vy, dmg: st.dmg, kind: k, col: '#ff9bf2', pierce: a.pierce + Math.floor(h.lvl / 3), life: 1.5, r: 4 }); }
    else if (k === 'thorn') { sfx('thorn'); proj({ x, y, vx, vy, dmg: st.dmg, kind: k, col: '#9aff5a', life: 1.2, r: 2 }); }
    else if (k === 'flame') { sfx('flame'); proj({ x, y, vx: vx * R(0.8, 1.2), vy: vy * R(0.8, 1.2), dmg: st.dmg, kind: k, col: '#ff5a3a', pierce: 2, life: 0.55, r: 4, burn: 3 * (1 + G.wave * 0.1) }); }
    else if (k === 'chrono') { sfx('chrono'); proj({ x, y, vx, vy, dmg: st.dmg, kind: k, col: '#41e8d6', slow: 0.6, life: 1.6, r: 3 }); }
  }
}
function updProjs(dt) {
  const E = G.enemies;
  for (let i = G.projs.length - 1; i >= 0; i--) {
    const p = G.projs[i];
    p.life -= dt;
    if (p.hom) {
      let tg = p.tg; if (!tg || tg.dead) { tg = null; let bd = 1e9; for (const e of E) { if (e.dead) continue; const d = (e.x - p.x) ** 2 + (e.y - p.y) ** 2; if (d < bd) { bd = d; tg = e; } } p.tg = tg; }
      if (tg) {
        const want = Math.atan2(tg.y - p.y, tg.x - p.x), cur = Math.atan2(p.vy, p.vx);
        let d = ((want - cur + Math.PI) % TAU + TAU) % TAU - Math.PI; const na = cur + d * Math.min(1, p.hom * dt * 2.2);
        const sp = p.spd || 150; p.vx = Math.cos(na) * sp; p.vy = Math.sin(na) * sp;
      }
    }
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.life <= 0 || p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) { G.projs[i] = G.projs[G.projs.length - 1]; G.projs.pop(); continue; }
    // trail
    if (rnd() < 0.5) {
      if (p.kind === 'fireball' || p.kind === 'flame') P(p.x, p.y, R(-8, 8), R(-8, 8), 0.3, rnd() < 0.5 ? '#ffb02e' : '#ff4a1a', 1, 0, true);
      else if (p.kind === 'frost') P(p.x, p.y, R(-6, 6), R(-6, 6), 0.35, '#d8f8ff', 1, 0, true);
      else if (p.kind === 'arcane') P(p.x, p.y, R(-4, 4), R(-4, 4), 0.35, '#ff9bf2', 1, 0, true);
      else if (p.kind === 'soul' || p.kind === 'skull') P(p.x, p.y, R(-5, 5), R(-5, 5), 0.4, '#6dff8a', 1, -10, true);
      else if (p.kind === 'chrono') P(p.x, p.y, R(-5, 5), R(-5, 5), 0.3, '#aaf', 1, 0, true);
    }
    let dead = false;
    for (let j = 0; j < E.length; j++) {
      const e = E[j]; if (e.dead) continue;
      const rr = e.r + p.r, dx = e.x - p.x, dy = e.y - p.y; if (dx * dx + dy * dy > rr * rr) continue;
      if (p.hit.indexOf(e.id) >= 0) continue;
      p.hit.push(e.id);
      dmgE(e, p.dmg, { slow: p.slow, burn: p.burn, col: p.col, soul: p.soul, root: p.root && rnd() < 0.3 ? p.root : 0, noproc: p.msum && rnd() < 0.5 });
      sfx('hit'); P(p.x, p.y, R(-30, 30), R(-30, 30), 0.25, '#fff', 1, 0, true);
      if (p.splash) boom(p.x, p.y, p.splash, p.dmg * 0.6, '#ff8a2e', { noproc: true, quiet: true, depth: 1 });
      if (p.pierce-- <= 0) { dead = true; break; }
    }
    if (dead) { G.projs[i] = G.projs[G.projs.length - 1]; G.projs.pop(); }
  }
}
function updEnemies(dt) {
  const E = G.enemies, ts = G.timeStop > 0;
  for (let i = 0; i < E.length; i++) {
    const e = E[i]; if (e.dead) continue;
    const dx = CX - e.x, dy = CY - e.y, d = Math.hypot(dx, dy) || 1; e.dc = d;
    if (e.flash > 0) e.flash -= dt;
    if (e.burnT > 0) { e.burnT -= dt; e.hp -= e.burnD * dt; if (rnd() < 0.15) P(e.x + R(-3, 3), e.y - 2, 0, -18, 0.35, '#ff7a2a', 1, 0, true); if (e.hp <= 0) { killE(e, { dot: 1 }); continue; } }
    if (ts) continue;
    if (e.slowT > 0) { e.slowT -= dt; if (e.slowT <= 0) e.slowF = 1; }
    if (e.rootT > 0) { e.rootT -= dt; continue; }
    let sp = e.spd * e.slowF * M.rift;
    if (G.aura && d < 95) sp *= Math.max(0.55, 0.88 - 0.02 * G.aura.lvl);
    const stopAt = e.stop || (e.d.stop) || 0;
    let moving = true;
    if (stopAt && d <= stopAt) moving = false;
    if (moving) {
      let ux = dx / d, uy = dy / d;
      if (e.d.wave) { e.ph += dt * 4; const w = Math.sin(e.ph) * 0.9; const px = -uy, py = ux; e.x += px * w * 30 * dt; e.y += py * w * 30 * dt; }
      e.x += ux * sp * dt; e.y += uy * sp * dt;
    }
    // behaviours
    if (e.d.shoot && !moving) { e.at -= dt; if (e.at <= 0) { e.at = e.d.shoot; ebolt(e.x, e.y, Math.atan2(dy, dx), 80, e.dmg); } }
    if (e.d.heal) { e.at -= dt; if (e.at <= 0) { e.at = 0.7; const amt = 7 * waveScale(G.wave); for (const o of E) { if (!o.dead && o !== e && o.hp < o.mhp && (o.x - e.x) ** 2 + (o.y - e.y) ** 2 < 3600) { o.hp = Math.min(o.mhp, o.hp + amt); P(o.x, o.y - 4, 0, -14, 0.5, '#7dff7a', 1, 0, true); } } ring(e.x, e.y, 24, '#7dff7a', 0.3); } }
    if (e.boss) bossAI(e, dt, d, dx, dy);
    if (d < EARTH_R + e.r * 0.4) {
      e.dead = true;
      if (e.bomb) { burst(e.x, e.y, 20, '#ff7a2a', 100, 0.5, 2, 0, true); sfx('boom'); }
      earthHit(e.boss ? e.dmg : e.dmg, false);
      if (e.boss) { e.hp = 0; G.boss = null; }
    }
  }
}
function ebolt(x, y, a, sp, d) { if (G.eprojs.length > 150) return; G.eprojs.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg: d, life: 6 }); }
function bossAI(e, dt, d, dx, dy) {
  e.at -= dt; if (e.at > 0) return;
  const ai = e.ai, pick = ai[Math.floor(rnd() * ai.length)], bd = 4.5 * (e.name === 'VOID EMPEROR' ? 0.7 : 1);
  e.at = bd; const b = 3 + G.wave * 0.12;
  if (pick === 'summon') { for (let i = 0; i < 3; i++) { spawnEnemy('imp', e.x + R(-14, 14), e.y + R(-14, 14), { noElite: true, hpMul: 0.6 }); } ring(e.x, e.y, 30, '#ff3a3a', 0.4); sfx('roar'); }
  else if (pick === 'ring') { const n = 12, o = rnd() * TAU; for (let i = 0; i < n; i++) ebolt(e.x, e.y, o + i * TAU / n, 55, b); ring(e.x, e.y, 28, '#ff3a5a', 0.4); sfx('roar'); }
  else if (pick === 'spread') { const a = Math.atan2(dy, dx); for (let i = -3; i <= 3; i++) ebolt(e.x, e.y, a + i * 0.16, 75, b + 1); sfx('roar'); }
}
function updEBolts(dt) {
  if (G.timeStop > 0) return;
  for (let i = G.eprojs.length - 1; i >= 0; i--) {
    const b = G.eprojs[i]; b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    const d = Math.hypot(b.x - CX, b.y - CY);
    if (d < EARTH_R + 2) { earthHit(b.dmg, true); G.eprojs[i] = G.eprojs[G.eprojs.length - 1]; G.eprojs.pop(); }
    else if (b.life <= 0) { G.eprojs[i] = G.eprojs[G.eprojs.length - 1]; G.eprojs.pop(); }
  }
}
function update(dt) {
  if (!G.on) return;
  dt *= G.slowmo;
  G.t += dt;
  const E = G.earth;
  if (E.flash > 0) E.flash -= dt; if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18); if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 1.6);
  if (G.timeStop > 0) { G.timeStop -= dt; if (G.timeStop <= 0) G.timeStop = 0; }
  if (E.shield > 0) { E.shieldT -= dt; if (E.shieldT <= 0) E.shield = 0; }
  if (G.over) {
    G.dying -= dt;
    if (rnd() < 0.5) { burst(CX + R(-20, 20), CY + R(-20, 20), 10, ['#ffb02e', '#ff4a1a', '#fff'][Math.floor(rnd() * 3)], 120, 0.8, 2, 0, true); if (rnd() < 0.3) shake(5); }
    updFx(dt);
    if (G.dying <= 0 && !G.overShown) { G.overShown = true; UI.over(false); }
    return;
  }
  // wave flow
  if (G.phase === 'wave') {
    G.waveT += dt;
    while (G.spawnQ.length && G.spawnQ[0].t <= G.waveT) { const s = G.spawnQ.shift(); const [x, y] = spawnPos(s.a); spawnEnemy(s.tid, x, y); }
    if (G.bossDef && G.waveT >= G.bossT) { const b = G.bossDef; G.bossDef = null; spawnBoss(b.def, b.tier, b.final); }
    if (!G.spawnQ.length && !G.bossDef && !G.enemies.length) waveCleared();
  }
  updHeroes(dt);
  updMinions(dt);
  updPickups(dt);
  updEnemies(dt);
  updProjs(dt);
  updEBolts(dt);
  // starfall relic
  if (M.stars && G.phase === 'wave') {
    G.starT -= dt;
    if (G.starT <= 0) {
      G.starT = Math.max(2, 7 - 1.3 * M.stars); const t = G.enemies[Math.floor(rnd() * G.enemies.length)];
      if (t && !t.dead) starFall(t.x, t.y, (30 + G.wave * 6) * M.dmg * M.spell);
    }
  }
  for (let i = G.actors.length - 1; i >= 0; i--) {
    const a = G.actors[i]; a.t += dt; a.upd(dt);
    if (a.dead) { G.actors[i] = G.actors[G.actors.length - 1]; G.actors.pop(); }
  }
  updFx(dt);
  // compact enemies
  let w = 0; const En = G.enemies;
  for (let i = 0; i < En.length; i++) if (!En[i].dead) En[w++] = En[i];
  En.length = w;
  if (G.boss && G.boss.dead) G.boss = null;
}
function updFx(dt) {
  const P_ = G.parts;
  for (let i = P_.length - 1; i >= 0; i--) {
    const p = P_[i]; p.l -= dt;
    if (p.l <= 0) { P_[i] = P_[P_.length - 1]; P_.pop(); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt;
  }
  for (let i = G.pops.length - 1; i >= 0; i--) { const p = G.pops[i]; p.t += dt; p.y -= 14 * dt; if (p.t > p.l) { G.pops[i] = G.pops[G.pops.length - 1]; G.pops.pop(); } }
  for (let i = G.fx.length - 1; i >= 0; i--) { const f = G.fx[i]; f.l -= dt; if (f.l <= 0) { G.fx[i] = G.fx[G.fx.length - 1]; G.fx.pop(); } }
}

// ---------- familiars (summons) ----------
const SUM_MAX = { lvl: 10, n: 4, skill: 3 };
function sumDmg(h) { return SUMMONS[h.id].dmg * (1 + 0.3 * (h.sum.lvl - 1)) * M.dmg * M.sumDmg * (G.frenzy > 0 ? 1.5 : 1); }
function sumCost(h, w) {
  const s = h.sum;
  if (w === 'pwr') return s.lvl >= SUM_MAX.lvl ? 0 : Math.round(25 * Math.pow(1.5, s.lvl - 1));
  if (w === 'num') return s.n >= SUM_MAX.n ? 0 : Math.round(60 * Math.pow(2, s.n - 1));
  return s.skill >= SUM_MAX.skill ? 0 : Math.round(90 * Math.pow(2, s.skill));
}
function applySum(h, w) {
  if (w === 'pwr') h.sum.lvl++; else if (w === 'num') h.sum.n++; else h.sum.skill++;
  burst(h.x, h.y, 14, SUMMONS[h.id].col, 70, 0.6, 1, -20, true); ring(h.x, h.y, 18, SUMMONS[h.id].col, 0.4);
  UI.hudDirty();
}
function buySum(i, w) {
  const h = G.heroes[i]; if (!h) return false; const c = sumCost(h, w);
  if (!c || G.gold < c) { sfx('deny'); return false; }
  G.gold -= c; applySum(h, w); sfx('buy'); return true;
}
function nearestEnemy(x, y, range) {
  let best = null, bd = range * range;
  for (let i = 0; i < G.enemies.length; i++) { const e = G.enemies[i]; if (e.dead) continue; const d = (e.x - x) ** 2 + (e.y - y) ** 2; if (d < bd) { bd = d; best = e; } }
  return best;
}
function chainZap(sx, sy, t, dmg, chains, col) {
  const hit = new Set(); let cur = t, px = sx, py = sy;
  for (let c = 0; c <= chains && cur; c++) {
    lightning(px, py, cur.x, cur.y, col); hit.add(cur.id);
    dmgE(cur, dmg * Math.pow(0.85, c), { col, noproc: c > 0 });
    px = cur.x; py = cur.y;
    let nx = null, nd = 4900;
    for (const e of G.enemies) { if (e.dead || hit.has(e.id)) continue; const d = (e.x - px) ** 2 + (e.y - py) ** 2; if (d < nd) { nd = d; nx = e; } }
    cur = nx;
  }
}
function minionShoot(m, t, d, S, sk) {
  const id = m.h.id, base = Math.atan2(t.y - m.y, t.x - m.x), mk = (a, o) => proj(Object.assign({ x: m.x, y: m.y, vx: Math.cos(a) * o.sp, vy: Math.sin(a) * o.sp, dmg: d, msum: true, col: S.col }, o));
  if (id === 'pyro') { sfx('fire'); mk(base, { sp: 180, kind: 'fireball', splash: sk >= 1 ? 17 : 0, life: 1.1 }); }
  else if (id === 'cryo') { sfx('frost'); mk(base, { sp: 200, kind: 'frost', slow: 0.6, root: sk >= 1 ? 1 : 0, life: 1.2 }); }
  else if (id === 'storm') { sfx('zap'); chainZap(m.x, m.y, t, d, 1 + (sk >= 1 ? 2 : 0), '#fff59a'); }
  else if (id === 'sage') { sfx('arcane'); mk(base, { sp: 250, kind: 'arcane', pierce: 1 + (sk >= 1 ? 3 : 0), life: 1.1, r: 4 }); }
  else if (id === 'druid') { sfx('thorn'); const n = sk >= 1 ? 3 : 2; for (let i = 0; i < n; i++) mk(base + (i - (n - 1) / 2) * 0.2, { sp: 220, kind: 'thorn', life: 1, r: 2 }); G.earth.hp = Math.min(G.earth.max, G.earth.hp + (sk >= 1 ? 0.18 : 0.08)); }
  else if (id === 'summoner') { sfx('flame'); const n = sk >= 1 ? 5 : 3; for (let i = 0; i < n; i++) mk(base + (i - (n - 1) / 2) * 0.16 + R(-0.05, 0.05), { sp: R(130, 170), kind: 'flame', pierce: 1, life: 0.45, r: 4, burn: 3 * (1 + G.wave * 0.1) }); }
}
function updMinions(dt) {
  const fr = G.frenzy > 0; if (fr) G.frenzy -= dt;
  const per = {};
  G.heroes.forEach(h => { let cnt = 0; for (const m of G.minions) if (m.h === h) cnt++; while (cnt < h.sum.n) { G.minions.push({ h, x: h.x, y: h.y, ang: rnd() * TAU, cd: R(0.2, 1), st: 0, tg: null, k: 0, face: 1, nova: R(2, 5) }); cnt++; } });
  for (const m of G.minions) {
    const h = m.h, S = SUMMONS[h.id], hi = G.heroes.indexOf(h), sk = h.sum.skill, d = sumDmg(h);
    per[h.id] = (per[h.id] || 0) + 1; m.k = per[h.id] - 1;
    const dir = hi % 2 ? -1 : 1, a = G.t * 0.6 * dir + hi * 1.3 + m.k * TAU / h.sum.n, rad = 58 + (hi % 3) * 8;
    const ox = CX + Math.cos(a) * rad, oy = CY + Math.sin(a) * rad * 0.92;
    const rate = (fr ? 2 : 1) * (sk >= 2 ? 1.4 : 1) * (G.timeStop > 0 ? 1 : 1);
    m.cd -= dt * rate;
    if (h.id === 'necro') {
      if (m.st === 0) {
        m.x += (ox - m.x) * Math.min(1, dt * 6); m.y += (oy - m.y) * Math.min(1, dt * 6);
        if (m.cd <= 0 && G.enemies.length) { const t = nearestEnemy(m.x, m.y, S.range); if (t) { m.st = 1; m.tg = t; } }
      } else if (m.st === 1) {
        const t = m.tg; if (!t || t.dead) m.st = 2; else {
          const dx = t.x - m.x, dy = t.y - m.y, dd = Math.hypot(dx, dy) || 1; m.face = dx >= 0 ? 1 : -1;
          m.x += dx / dd * 210 * dt; m.y += dy / dd * 210 * dt; P(m.x, m.y, R(-6, 6), R(-6, 6), 0.3, '#6dff8a', 1, 0, true);
          if (dd < t.r + 5) { dmgE(t, d * 1.8, { col: S.col }); burst(m.x, m.y, 8, '#6dff8a', 70, 0.4, 1, 0, true); sfx('skull'); if (sk >= 1) boom(m.x, m.y, 20, d * 0.8, '#6dff8a', { noproc: true, quiet: true, depth: 1 }); m.st = 2; m.cd = S.cd; }
        }
      } else {
        const dx = ox - m.x, dy = oy - m.y, dd = Math.hypot(dx, dy) || 1; m.x += dx / dd * 230 * dt; m.y += dy / dd * 230 * dt; if (dd < 8) m.st = 0;
      }
    } else {
      m.x += (ox - m.x) * Math.min(1, dt * 6); m.y += (oy - m.y) * Math.min(1, dt * 6);
      if (m.cd <= 0 && G.enemies.length) {
        const t = nearestEnemy(m.x, m.y, S.range + 2 * h.sum.lvl);
        if (t) {
          m.face = t.x >= m.x ? 1 : -1; m.cd = S.cd;
          if (h.id === 'chrono') {
            ring(m.x, m.y, 56, '#41e8d6', 0.4); sfx('chrono');
            inCircle(m.x, m.y, 56, e => dmgE(e, d * (sk >= 1 ? 1.2 : 0.6), { slow: 0.65, slowT: 1.6, noproc: true, col: '#41e8d6' }));
          } else minionShoot(m, t, d, S, sk);
        }
      }
    }
    if (sk >= 3) {
      m.nova -= dt * (fr ? 2 : 1);
      if (m.nova <= 0 && G.enemies.length) { m.nova = 6; ring(m.x, m.y, 50, S.col, 0.5); boom(m.x, m.y, 46, d * 4, S.col, { noproc: true, quiet: true, depth: 1 }); burst(m.x, m.y, 14, S.col, 90, 0.5, 1, 0, true); sfx('boom'); }
    }
  }
}
function drawMinion(m, t) {
  const S = SUMMONS[m.h.id], sp = SUM_SPR[S.spr], sk = m.h.sum.skill, bob = Math.round(Math.sin(t * 6 + m.k * 2) * 1);
  drawSpr(ctx, sp, m.x, m.y + bob, { flip: m.face < 0 });
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (G.frenzy > 0 ? 0.9 : 0.45) + 0.15 * sk;
  const g = G.frenzy > 0 ? 9 : 6 + sk; ctx.drawImage(glow(G.frenzy > 0 ? '#ff9bf2' : S.col, g), Math.round(m.x - g), Math.round(m.y + bob - g)); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  if (sk >= 3 && ((t * 8 + m.k) | 0) % 3 === 0) { ctx.fillStyle = S.col; ctx.fillRect(Math.round(m.x - 5), Math.round(m.y - 5 + bob), 1, 1); ctx.fillRect(Math.round(m.x + 5), Math.round(m.y + 4 + bob), 1, 1); }
}

// ---------- rune pickups ----------
function spawnPickup(x, y) {
  if (G.pickups.length > 12) return;
  let tot = 0; for (const k in PICKUPS) tot += PICKUPS[k].w; let p = rnd() * tot, kind = 'power';
  for (const k in PICKUPS) { p -= PICKUPS[k].w; if (p <= 0) { kind = k; break; } }
  G.pickups.push({ x, y, kind, t: 0, ph: rnd() * TAU });
  P(x, y, 0, 0, 0.3, PICKUPS[kind].c, 4, 0, true);
}
function collectPickup(k) {
  k.dead = true; sfx('card'); const def = PICKUPS[k.kind];
  burst(k.x, k.y, 14, def.c, 80, 0.6, 1, 0, true); ring(k.x, k.y, 20, def.c, 0.4);
  if (k.kind === 'frenzy') { G.frenzy = 12; UI.msg('FRENZY! FAMILIARS x2 SPEED', def.c); return; }
  const w = k.kind === 'power' ? 'pwr' : k.kind === 'legion' ? 'num' : 'skill';
  const key = w === 'pwr' ? 'lvl' : w === 'num' ? 'n' : 'skill', max = w === 'pwr' ? SUM_MAX.lvl : w === 'num' ? SUM_MAX.n : SUM_MAX.skill;
  let c = G.heroes.filter(h => h.sum[key] < max);
  if (!c.length) { const g = 40 + G.wave * 3; G.gold += g; UI.msg('RUNE -> +' + g + ' GOLD', def.c); return; }
  const h = c[Math.floor(rnd() * c.length)]; applySum(h, w);
  const S = SUMMONS[h.id];
  UI.msg(S.name.toUpperCase() + (w === 'pwr' ? ' POWER UP!' : w === 'num' ? ' +1 FAMILIAR!' : ': ' + S.sk[h.sum.skill - 1].toUpperCase()), def.c);
}
function collectAt(x, y, r) {
  let got = false;
  for (const k of G.pickups) if (!k.dead && (k.x - x) ** 2 + (k.y - y) ** 2 < r * r) { collectPickup(k); got = true; }
  return got;
}
function updPickups(dt) {
  const L = G.pickups;
  for (let i = L.length - 1; i >= 0; i--) {
    const k = L[i]; k.t += dt;
    const dx = CX - k.x, dy = CY - k.y, d = Math.hypot(dx, dy) || 1, sp = 14 + Math.min(20, k.t * 2);
    k.x += dx / d * sp * dt + Math.cos(k.t * 3 + k.ph) * 6 * dt; k.y += dy / d * sp * dt + Math.sin(k.t * 3 + k.ph) * 6 * dt;
    if (rnd() < 0.2) P(k.x + R(-2, 2), k.y + R(-2, 2), 0, R(5, 15), 0.4, PICKUPS[k.kind].c, 1, 0, true);
    if (G.mouseIn && (k.x - G.mx) ** 2 + (k.y - G.my) ** 2 < 150) collectPickup(k);
    else if (d < EARTH_R + 4) collectPickup(k);
    if (k.dead) { L[i] = L[L.length - 1]; L.pop(); }
  }
}
function drawPickup(k, t) {
  const c = PICKUPS[k.kind].c, x = Math.round(k.x), y = Math.round(k.y + Math.sin(t * 5 + k.ph) * 1.5), pulse = 0.6 + 0.4 * Math.sin(t * 8 + k.ph);
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = pulse; ctx.drawImage(glow(c, 10), x - 10, y - 10); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000'; ctx.fillRect(x - 4, y - 1, 9, 3); ctx.fillRect(x - 1, y - 4, 3, 9); ctx.fillRect(x - 3, y - 3, 7, 7);
  ctx.fillStyle = c; ctx.fillRect(x - 3, y - 2, 7, 5); ctx.fillRect(x - 2, y - 3, 5, 7);
  ctx.fillStyle = '#fff'; ctx.fillRect(x - 1, y - 2, 2, 2);
}

// ---------- render ----------
const VIG = (() => {
  const c = mk(W, H), x = c.getContext('2d');
  for (let y = 0; y < H; y += 2) for (let px = 0; px < W; px += 2) {
    const d = Math.hypot((px - W / 2) / (W / 2), (y - H / 2) / (H / 2)); const a = Math.max(0, d - 0.55) * 0.55;
    if (a > 0.02) { x.fillStyle = 'rgba(0,0,0,' + Math.min(0.6, a).toFixed(2) + ')'; x.fillRect(px, y, 2, 2); }
  }
  return c;
})();
const REDV = (() => {
  const c = mk(W, H), x = c.getContext('2d');
  for (let y = 0; y < H; y += 2) for (let px = 0; px < W; px += 2) {
    const d = Math.hypot((px - W / 2) / (W / 2), (y - H / 2) / (H / 2)); const a = Math.max(0, d - 0.5) * 0.9;
    if (a > 0.02) { x.fillStyle = 'rgba(255,30,30,' + Math.min(0.7, a).toFixed(2) + ')'; x.fillRect(px, y, 2, 2); }
  }
  return c;
})();
let EARTH_RED = null;
function drawEarth(t) {
  const E = G.earth || { hp: 1, max: 1, flash: 0 };
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.55; ctx.drawImage(glow('#4aa8ff', 32), CX - 32, CY - 32); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(EARTH_FRAMES[Math.floor(t * 2.5) % EARTH_FRAMES.length], CX - EARTH_FRAMES[0].width / 2, CY - EARTH_FRAMES[0].height / 2);
  if (E.flash > 0) { ctx.globalAlpha = Math.min(0.7, E.flash * 2); ctx.drawImage(EARTH_RED || (EARTH_RED = tintSil(EARTH_FRAMES[0], '#ff3030')), CX - 24, CY - 24); ctx.globalAlpha = 1; }
  if (E.max && E.hp / E.max < 0.3) { ctx.fillStyle = 'rgba(255,50,30,' + (0.15 + 0.1 * Math.sin(t * 8)).toFixed(2) + ')'; pdisc(ctx, CX, CY, EARTH_R); }
  if (E.shield > 0) {
    ctx.fillStyle = 'rgba(127,220,255,' + (0.5 + 0.3 * Math.sin(t * 6)).toFixed(2) + ')'; pring(ctx, CX, CY, 27); ctx.fillStyle = 'rgba(127,220,255,0.18)'; pring(ctx, CX, CY, 26); pring(ctx, CX, CY, 28);
  }
}
function drawRings(t) {
  ctx.fillStyle = 'rgba(160,140,255,0.28)';
  for (let i = 0; i < 28; i++) { const a = t * 0.22 + i * TAU / 28; if (i % 2) continue; ctx.fillRect(Math.round(CX + Math.cos(a) * 40), Math.round(CY + Math.sin(a) * 38), 1, 1); }
  ctx.fillStyle = 'rgba(160,140,255,0.14)';
  for (let i = 0; i < 40; i++) { const a = -t * 0.12 + i * TAU / 40; ctx.fillRect(Math.round(CX + Math.cos(a) * 64), Math.round(CY + Math.sin(a) * 62), 1, 1); }
}
function drawHero(h, t) {
  const s = HERO_SPR[h.id], bob = Math.round(Math.sin(t * 3 + h.ang * 2) * 1);
  const x = h.x, y = h.y + bob;
  ctx.globalAlpha = 0.25; ctx.fillStyle = '#000'; ctx.fillRect(Math.round(x - 4), Math.round(y + 8), 8, 1); ctx.globalAlpha = 1;
  drawSpr(ctx, s, x, y, { flip: h.face < 0 });
  const ox = h.face < 0 ? -5 : 5, oy = -7;
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.7 + 0.3 * Math.sin(t * 5 + h.ang);
  ctx.drawImage(glow(HEROES[h.id].col, 6), Math.round(x + ox - 6), Math.round(y + oy - 6)); ctx.globalAlpha = 1;
  if (h.castT > 0) { ctx.globalAlpha = Math.min(1, h.castT * 2); ctx.drawImage(glow(HEROES[h.id].col, 14), Math.round(x - 14), Math.round(y - 14)); ctx.globalAlpha = 1; }
  ctx.globalCompositeOperation = 'source-over';
  if (G.on && h.scd <= 0) { ctx.fillStyle = HEROES[h.id].col; ctx.fillRect(Math.round(x - 1), Math.round(y - 12 - ((t * 6) % 2 | 0)), 2, 2); }
}
function drawEnemy(e, t) {
  const s = e.spr, sc = e.boss ? 2 : 1;
  const x = Math.round(e.x), y = Math.round(e.y + (e.d.wave || e.boss ? Math.sin(t * 5 + e.id) * 1 : 0));
  if (e.elite) { ctx.drawImage(eliteOf(s), x - (s.w + 2) / 2 | 0, y - (s.h + 2) / 2 | 0); }
  else if (e.flash > 0) drawSpr(ctx, { c: s.white, w: s.w, h: s.h }, x, y, { scale: sc });
  else drawSpr(ctx, s, x, y, { scale: sc });
  if (e.flash > 0 && e.elite) { ctx.globalAlpha = 0.8; ctx.drawImage(s.white, x - s.w / 2 | 0, y - s.h / 2 | 0); ctx.globalAlpha = 1; }
  if (e.rootT > 0 || G.timeStop > 0 || e.slowF < 0.9) { ctx.globalAlpha = G.timeStop > 0 ? 0.5 : 0.4; drawSpr(ctx, { c: iceOf(s), w: s.w, h: s.h }, x, y, { scale: sc }); ctx.globalAlpha = 1; }
  if (e.hp < e.mhp && !e.boss) { const w = Math.max(6, Math.min(14, s.w)); const f = Math.max(0, e.hp / e.mhp); ctx.fillStyle = '#000'; ctx.fillRect(x - w / 2 | 0, y - s.h / 2 - 3 | 0, w, 2); ctx.fillStyle = e.elite ? '#ffd23f' : '#ff4a4a'; ctx.fillRect(x - w / 2 | 0, y - s.h / 2 - 3 | 0, Math.ceil(w * f), 1); }
  if (e.d.heal || e.tid === 'eye') { /* subtle aura */ }
}
function drawProj(p) {
  const x = Math.round(p.x), y = Math.round(p.y), k = p.kind;
  ctx.globalCompositeOperation = 'lighter';
  const g = k === 'arcane' ? 7 : 5; ctx.globalAlpha = 0.8; ctx.drawImage(glow(p.col, g), x - g, y - g); ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  if (k === 'fireball') { ctx.fillStyle = '#ff5a1a'; ctx.fillRect(x - 2, y - 2, 4, 4); ctx.fillStyle = '#ffe14a'; ctx.fillRect(x - 1, y - 1, 2, 2); }
  else if (k === 'frost') { ctx.fillStyle = '#7fdcff'; ctx.fillRect(x - 1, y - 2, 2, 4); ctx.fillRect(x - 2, y - 1, 4, 2); ctx.fillStyle = '#fff'; ctx.fillRect(x, y, 1, 1); }
  else if (k === 'skull' || k === 'soul') { ctx.fillStyle = k === 'soul' ? '#9affb0' : '#e8f8e8'; ctx.fillRect(x - 2, y - 2, 4, 3); ctx.fillStyle = '#1b1230'; ctx.fillRect(x - 1, y - 1, 1, 1); ctx.fillRect(x + 1, y - 1, 1, 1); }
  else if (k === 'arcane') { const l = Math.hypot(p.vx, p.vy) || 1; ctx.fillStyle = '#ff9bf2'; pline(ctx, x, y, x - p.vx / l * 7, y - p.vy / l * 7); ctx.fillStyle = '#fff'; ctx.fillRect(x - 1, y - 1, 3, 3); }
  else if (k === 'thorn') { ctx.fillStyle = '#c8ff6a'; ctx.fillRect(x - 1, y - 1, 2, 2); ctx.fillStyle = '#3f9c4c'; ctx.fillRect(x - Math.sign(p.vx) * 2, y - Math.sign(p.vy) * 2, 1, 1); }
  else if (k === 'flame') { ctx.fillStyle = p.life > 0.3 ? '#ffe14a' : '#ff5a1a'; ctx.fillRect(x - 2, y - 2, 4, 4); }
  else if (k === 'chrono') { ctx.fillStyle = '#41e8d6'; ctx.fillRect(x - 2, y - 1, 4, 2); ctx.fillRect(x - 1, y - 2, 2, 4); ctx.fillStyle = '#fff'; ctx.fillRect(x, y, 1, 1); }
}
function render(t) {
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.drawImage(BG, 0, 0);
  // twinkling stars
  for (let i = 0; i < STARS.length; i++) { const s = STARS[i]; const v = Math.sin(t * s.s + s.p); if (v > 0.2) { ctx.fillStyle = v > 0.8 ? '#fff' : '#a8a0e0'; ctx.fillRect(s.x, s.y, 1, 1); if (v > 0.95) { ctx.fillRect(s.x - 1, s.y, 3, 1); ctx.fillRect(s.x, s.y - 1, 1, 3); } } }
  let sx = 0, sy = 0; if (G.on && G.shake > 0.1) { sx = Math.round(R(-1, 1) * G.shake); sy = Math.round(R(-1, 1) * G.shake); }
  ctx.save(); ctx.translate(sx, sy);
  drawRings(t);
  if (!G.on) { drawMenuScene(t); ctx.restore(); ctx.drawImage(VIG, 0, 0); return; }
  drawEarth(t);
  // under-actors
  for (const a of G.actors) if (a.under) a.draw(ctx, t);
  // enemies
  const En = G.enemies; for (let i = 0; i < En.length; i++) if (!En[i].boss) drawEnemy(En[i], t);
  for (let i = 0; i < En.length; i++) if (En[i].boss) drawEnemy(En[i], t);
  for (const m of G.minions) drawMinion(m, t);
  G.heroes.forEach(h => drawHero(h, t));
  for (const k of G.pickups) drawPickup(k, t);
  // enemy bolts
  for (const b of G.eprojs) {
    const x = Math.round(b.x), y = Math.round(b.y);
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.7; ctx.drawImage(glow('#ff3a5a', 5), x - 5, y - 5); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#ff3a5a'; ctx.fillRect(x - 1, y - 1, 3, 3); ctx.fillStyle = '#ffd0d0'; ctx.fillRect(x, y, 1, 1);
  }
  for (const p of G.projs) drawProj(p);
  for (const a of G.actors) if (!a.under) a.draw(ctx, t);
  // particles
  const parts = G.parts; let add = false;
  for (let pass = 0; pass < 2; pass++) {
    ctx.globalCompositeOperation = pass ? 'lighter' : 'source-over';
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]; if (p.a !== !!pass) continue;
      ctx.globalAlpha = p.l < p.m * 0.35 ? Math.max(0, p.l / (p.m * 0.35)) : 1;
      ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
    }
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  // fx: lightning, rings
  for (const f of G.fx) {
    const a = Math.min(1, f.l / f.m * 1.5);
    if (f.ring) {
      const k = 1 - f.l / f.m, r = f.r * (0.3 + 0.7 * k); ctx.globalAlpha = a; ctx.fillStyle = f.col; pring(ctx, f.x, f.y, r); if (f.r > 40) pring(ctx, f.x, f.y, r - 1); ctx.globalAlpha = 1;
    } else {
      ctx.globalAlpha = a * 0.5; ctx.fillStyle = f.col; for (let i = 1; i < f.pts.length; i++) { pline(ctx, f.pts[i - 1].x - 1, f.pts[i - 1].y, f.pts[i].x - 1, f.pts[i].y); pline(ctx, f.pts[i - 1].x + 1, f.pts[i - 1].y, f.pts[i].x + 1, f.pts[i].y); }
      ctx.globalAlpha = a; ctx.fillStyle = f.col; for (let i = 1; i < f.pts.length; i++) pline(ctx, f.pts[i - 1].x, f.pts[i - 1].y, f.pts[i].x, f.pts[i].y);
      ctx.fillStyle = '#fff'; ctx.globalAlpha = a; for (let i = 1; i < f.pts.length; i++) pline(ctx, f.pts[i - 1].x + 0.4, f.pts[i - 1].y, f.pts[i].x + 0.4, f.pts[i].y);
      const e = f.pts[f.pts.length - 1]; ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(glow(f.col, 9), Math.round(e.x - 9), Math.round(e.y - 9)); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    }
  }
  // time stop tint
  if (G.timeStop > 0) {
    ctx.fillStyle = 'rgba(120,150,255,0.14)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(200,230,255,0.7)'; pring(ctx, CX, CY, 30); const a = t * 3; pline(ctx, CX, CY, CX + Math.cos(a) * 28, CY + Math.sin(a) * 28);
  }
  // popups
  for (const p of G.pops) { const s = pixText(p.s, p.c, p.sc); ctx.globalAlpha = Math.min(1, (p.l - p.t) * 4); ctx.drawImage(s, Math.round(p.x - s.width / 2), Math.round(p.y)); }
  ctx.globalAlpha = 1;
  ctx.restore();
  // aim reticle
  if (G.aim != null && G.heroes[G.aim]) {
    const h = G.heroes[G.aim], rr = aimRadius(h.id); ctx.fillStyle = HEROES[h.id].col; ctx.globalAlpha = 0.9;
    pring(ctx, G.mx, G.my, rr); ctx.fillRect(G.mx - 1, G.my, 3, 1); ctx.fillRect(G.mx, G.my - 1, 1, 3); ctx.globalAlpha = 0.25; pdisc(ctx, G.mx, G.my, rr); ctx.globalAlpha = 1;
  }
  ctx.drawImage(VIG, 0, 0);
  if (G.on && G.earth.hp / G.earth.max < 0.35 || (G.on && G.earth.flash > 0)) { ctx.globalAlpha = G.earth.flash > 0 ? Math.min(0.5, G.earth.flash * 1.2) : 0.3 + 0.15 * Math.sin(t * 7); ctx.drawImage(REDV, 0, 0); ctx.globalAlpha = 1; }
  if (G.flash > 0) { ctx.globalAlpha = Math.min(1, G.flash); ctx.fillStyle = G.flashCol; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
}
function aimRadius(id) { return { pyro: 50, cryo: 55, sage: 70 }[id] || 30; }
function drawMenuScene(t) {
  const ids = HERO_ORDER;
  const pos = ids.map((id, i) => { const a = t * 0.25 + i * TAU / ids.length; return { id, a, x: CX + Math.cos(a) * 135, y: CY + 4 + Math.sin(a) * 40 }; });
  pos.sort((p, q) => p.y - q.y);
  pos.forEach(p => {
    if (p.y > CY + 4 && !p.done) { }
  });
  const back = pos.filter(p => p.y <= CY + 4), front = pos.filter(p => p.y > CY + 4);
  const dh = p => {
    const sc = 1 + (p.y - CY) / 160;
    drawSpr(ctx, HERO_SPR[p.id], p.x, p.y, { flip: Math.cos(p.a) < 0 });
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.6; ctx.drawImage(glow(HEROES[p.id].col, 7), Math.round(p.x + (Math.cos(p.a) < 0 ? -5 : 5) - 7), Math.round(p.y - 14)); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    if (rnd() < 0.04) P(p.x, p.y - 7, R(-10, 10), R(-30, -10), 0.8, HEROES[p.id].col, 1, 0, true);
  };
  back.forEach(dh);
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.55; ctx.drawImage(glow('#4aa8ff', 32), CX - 32, CY - 32); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(EARTH_FRAMES[Math.floor(t * 2.5) % 16], CX - 24, CY - 24);
  front.forEach(dh);
  if (rnd() < 0.05) { const a = rnd() * TAU, sx = CX + Math.cos(a) * 290, sy = CY + Math.sin(a) * 200; const v = 40; G.parts.push({ x: sx, y: sy, vx: -Math.cos(a) * v * 3, vy: -Math.sin(a) * v * 3, l: 1.4, m: 1.4, c: '#ff7a3a', s: 2, g: 0, a: true }); }
  for (let pass = 0; pass < 2; pass++) {
    ctx.globalCompositeOperation = pass ? 'lighter' : 'source-over';
    for (const p of G.parts) { if (p.a !== !!pass) continue; ctx.globalAlpha = Math.min(1, p.l / (p.m * 0.35)); ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s); }
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}
