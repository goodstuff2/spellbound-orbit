'use strict';
// ================= UI =================
const $ = id => document.getElementById(id);
const stage = $('stage'), overlay = $('overlay'), shopEl = $('shop');
let hudDirty = true, lastShopKey = '', cacheV = {};

function paintIcons(root) {
  root.querySelectorAll('canvas[data-hero]').forEach(c => {
    const s = HERO_SPR[c.dataset.hero]; c.width = s.w; c.height = s.h;
    const x = c.getContext('2d'); x.clearRect(0, 0, s.w, s.h); x.drawImage(s.c, 0, 0);
  });
}
function setV(el, k, v, fn) { if (cacheV[k] !== v) { cacheV[k] = v; fn(el, v); } }

const UI = {
  screen(html, cls) {
    overlay.className = cls || ''; overlay.innerHTML = html; paintIcons(overlay);
  },
  hideScreen() { overlay.className = 'hide'; overlay.innerHTML = ''; },
  hudDirty() { hudDirty = true; },
  banner(t, s, cls) {
    const b = $('banner'), col = { boss: '#ff5a5a', clear: '#7dff7a', spell: '#9ae0ff', ult: '#ff9bf2' }[cls] || '#ffffff';
    b.style.setProperty('--bc', col); b.innerHTML = `<div class="t">${t}</div>${s ? `<div class="s">${s}</div>` : ''}`;
    b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
  },
  msg(t, col) { const e = $('pickmsg'); e.textContent = t; e.style.color = col; e.classList.remove('show'); void e.offsetWidth; e.classList.add('show'); },
  castName(t, col) { const e = $('casttxt'); e.textContent = t.toUpperCase() + '!'; e.style.color = col; e.classList.remove('show'); void e.offsetWidth; e.classList.add('show'); },
  toast(msg, ms) {
    const t = $('toast'); t.textContent = msg; t.classList.remove('hide'); clearTimeout(UI._tt); UI._tt = setTimeout(() => t.classList.add('hide'), ms || 6000);
  },
  spellbar() {
    const bar = $('spellbar'); bar.innerHTML = ''; const keys = ['Q', 'W', 'E', 'R', 'T', 'Y'];
    G.heroes.forEach((h, i) => {
      const d = HEROES[h.id], el = document.createElement('div'); el.className = 'slot'; el.style.setProperty('--c', d.col);
      el.title = d.spell.name + ' — ' + d.spell.desc; el.dataset.i = i;
      el.innerHTML = `<canvas data-hero="${h.id}"></canvas><span class="key">${keys[i]}</span><div class="cd"></div><div class="cdn"></div>`;
      el.addEventListener('pointerdown', ev => { ev.preventDefault(); SND.init(); trySpell(i, false); });
      bar.appendChild(el);
    });
    paintIcons(bar); cacheV = {}; hudDirty = true; lastShopKey = '';
  },
  relicRow() {
    const el = $('relics'); let h = '';
    for (const id in G.relics) if (G.relics[id] > 0) { const r = RELIC[id]; h += `<span title="${r.n}: ${r.t}">${r.i}<sub>${G.relics[id] > 1 ? G.relics[id] : ''}</sub></span>`; }
    el.innerHTML = h;
  },
  openShop() { shopEl.classList.remove('hide'); lastShopKey = ''; $('b-shop').classList.add('on'); },
  closeShop() { shopEl.classList.add('hide'); $('b-shop').classList.remove('on'); },
  toggleShop() { shopEl.classList.contains('hide') ? UI.openShop() : UI.closeShop(); sfx('click'); },

  // ---- screens ----
  title() {
    G.on = false; G.parts.length = 0; SND.setIntensity(0);
    $('hud').classList.add('hide'); UI.closeShop();
    const d = SAVE.diff, best = SAVE.best[d];
    UI.screen(`
      <div class="logo"><div class="a">SPELLBOUND</div><div class="b">ORBIT</div><div class="c">WIZARDS OF THE LAST SKY</div></div>
      <div class="menu-bot">
        <div class="row dif">${Object.keys(DIFFS).map(k => `<button data-act="diff:${k}" class="${k === d ? 'sel' : ''}" style="color:${DIFFS[k].c}">${DIFFS[k].n}</button>`).join('')}</div>
        <div class="row"><button class="big gold" data-act="play">PLAY</button><button class="big" data-act="grim">GRIMOIRE</button><button class="big" data-act="how">HOW TO</button></div>
        <div class="row"><span class="crys">${SAVE.crystals} CRYSTALS</span><span class="lbl">&nbsp;BEST WAVE ${best}/${MAX_WAVE} &middot; WINS ${SAVE.wins}</span></div>
        <div class="row"><button data-act="sfx" class="${SND.sfxOn ? 'on' : ''}">SFX</button><button data-act="music" class="${SND.musOn ? 'on' : ''}">MUSIC</button></div>
      </div>`, 'clear');
  },
  heroSelect() {
    let h = `<div class="title2">CHOOSE YOUR FIRST WIZARD</div><div class="hgrid">`;
    HERO_ORDER.forEach(id => {
      const d = HEROES[id], ok = SAVE.unlocked.includes(id);
      h += `<div class="hcard ${ok ? '' : 'lock'}" style="--c:${d.col}" ${ok ? `data-act="pick:${id}"` : ''}><canvas data-hero="${id}"></canvas><div><div class="n">${d.name}</div><div class="s">${d.desc}</div><div class="s" style="color:${d.col}">✦ ${d.spell.name}</div>${ok ? '' : `<div class="s">LOCKED ◆${d.unlock}</div>`}</div></div>`;
    });
    h += `</div><div class="row" style="margin-top:10px"><button data-act="menu">BACK</button></div><div class="txt" style="margin-top:6px">More wizards join you as you earn gold. Unlock new ones in the Grimoire.</div>`;
    UI.screen(h);
  },
  grimoire() {
    let L = '', Rr = '';
    HERO_ORDER.forEach(id => {
      const d = HEROES[id], own = SAVE.unlocked.includes(id);
      L += `<div class="grow"><canvas data-hero="${id}"></canvas><div class="i"><span style="color:${d.col}">${d.name}</span><small>✦ ${d.spell.name}</small></div>${own ? '<span style="color:#7dff7a">OWNED</span>' : `<button data-act="unlock:${id}" class="${SAVE.crystals >= d.unlock ? '' : 'dis'}">◆${d.unlock}</button>`}</div>`;
    });
    PERKS.forEach(p => {
      const l = perk(p.id), max = l >= p.max, c = p.cost(l);
      Rr += `<div class="grow"><div class="i">${p.n} <span style="color:#ffe14a">LV${l}/${p.max}</span><small>${p.t}</small></div>${max ? '<span style="color:#7dff7a">MAX</span>' : `<button data-act="perk:${p.id}" class="${SAVE.crystals >= c ? '' : 'dis'}">◆${c}</button>`}</div>`;
    });
    UI.screen(`<div class="title2" style="margin-bottom:3px">GRIMOIRE</div><div class="crys" style="margin-bottom:5px">${SAVE.crystals} CRYSTALS</div><div class="gr"><div><h4>WIZARDS</h4>${L}</div><div><h4>PERMANENT BOONS</h4>${Rr}</div></div><div class="row" style="margin-top:5px"><button data-act="menu">BACK</button></div>`);
  },
  how() {
    UI.screen(`<div class="title2">HOW TO PLAY</div><div class="txt" style="text-align:left;line-height:2">
      ◆ Wizards orbit Earth and fire <b style="color:#ffe14a">automatically</b>.<br>
      ◆ Cast each wizard's <b style="color:#9ae0ff">SPELL</b>: <b style="color:#ffe14a">Q W E R T Y</b> or click the icons. Aimed spells hit the mouse cursor.<br>
      ◆ Kills charge <b style="color:#ff9bf2">CATACLYSM</b> (<b style="color:#ffe14a">F</b>): wipes the sky and resets all spells.<br>
      ◆ <b style="color:#ffe14a">SPACE</b> starts the next wave. Between waves pick a <b style="color:#ffe14a">relic</b>, upgrade wizards, hire more (<b style="color:#ffe14a">B</b> = shop).<br>
      ◆ Every wizard has <b style="color:#5ae8ff">FAMILIARS</b> that fight too. Foes drop <b style="color:#ff9bf2">RUNES</b>: hover them to boost familiars (power, count, skills). Upgrade familiars in the shop.<br>
      ◆ <b style="color:#ffe14a">A</b> auto-casts spells. <b style="color:#ffe14a">G</b> changes speed. <b style="color:#ffe14a">P</b> pauses.<br>
      ◆ Survive <b style="color:#ff8a8a">30 waves</b>. Boss every 5th. Earn crystals to unlock wizards and boons.</div>
      <div class="row" style="margin-top:10px"><button data-act="menu">BACK</button></div>`);
  },
  cards(list) {
    G.cardsPending = true; G._cards = list;
    const rc = ['#9ab0ff', '#c07aff', '#ffb02e'], rn = ['COMMON', 'RARE', 'LEGENDARY'];
    const h = `<div class="title2">CHOOSE A RELIC</div><div class="cards">${list.map((r, i) => `<div class="card" style="--rc:${rc[r.r]}" data-act="card:${i}"><div class="ic">${r.i}</div><div class="nm">${r.n}</div><div class="tx">${r.t}</div><div class="rar">${rn[r.r]}${G.relics[r.id] ? ' · OWNED ' + G.relics[r.id] : ''}</div></div>`).join('')}</div>
      <div class="row" style="margin-top:10px"><button data-act="reroll" class="${G.gold >= rerollCost() ? '' : 'dis'}">REROLL ${rerollCost()}g</button></div>`;
    UI.screen(h, 'dim'); sfx('card');
  },
  over(won) {
    SND.stopMusic(); G.paused = true;
    const c = endRunOnce(won), st = G;
    if (won) sfx('win'); else sfx('over');
    UI.screen(`<div class="title2" style="color:${won ? '#7dff7a' : '#ff5a5a'};font-size:14px">${won ? 'VICTORY!' : 'EARTH HAS FALLEN'}</div>
      <div class="stat">WAVE <b>${st.wave}</b> / ${MAX_WAVE} &nbsp; KILLS <b>${st.kills}</b><br>BOSSES <b>${st.bossesKilled}</b> &nbsp; SPELLS <b>${st.spellCasts}</b> &nbsp; GOLD <b>${st.goldEarned}</b><br><span class="crys">+${c} CRYSTALS</span> &nbsp;(${SAVE.crystals} TOTAL)</div>
      <div class="row" style="margin-top:12px">${won ? '<button class="big gold" data-act="cont">ENDLESS MODE</button>' : '<button class="big gold" data-act="retry">TRY AGAIN</button>'}<button class="big" data-act="grim2">GRIMOIRE</button><button class="big" data-act="menu">MENU</button></div>`, 'dim');
  },
  pause() {
    UI.screen(`<div class="title2">PAUSED</div><div class="row"><button class="big gold" data-act="resume">RESUME</button><button class="big red" data-act="quit">GIVE UP</button></div>
      <div class="row" style="margin-top:8px"><button data-act="sfx" class="${SND.sfxOn ? 'on' : ''}">SFX</button><button data-act="music" class="${SND.musOn ? 'on' : ''}">MUSIC</button></div>`, 'dim');
  },
  // ---- per-frame hud ----
  hud() {
    if (!G.on) return;
    const E = G.earth, pct = Math.max(0, E.hp / E.max);
    setV($('hpfill'), 'hp', Math.round(pct * 100), (e, v) => { e.style.width = v + '%'; e.style.background = v > 55 ? '#3fd35a' : v > 28 ? '#e8c82a' : '#e8403a'; });
    setV($('hptxt'), 'hpt', Math.ceil(E.hp) + '/' + E.max, (e, v) => e.textContent = v);
    setV($('shfill'), 'sh', Math.round(Math.min(1, E.shield / (E.max * 0.6)) * 100), (e, v) => e.style.width = v + '%');
    setV($('wavetxt'), 'w', Math.max(1, G.wave), (e, v) => e.textContent = v);
    setV($('wavemax'), 'wm', G.endless ? '' : '/' + MAX_WAVE, (e, v) => e.textContent = v);
    setV($('goldtxt'), 'g', Math.floor(G.gold), (e, v) => e.textContent = v);
    const u = Math.min(100, G.ult);
    setV($('ultfill'), 'u', Math.round(u), (e, v) => e.style.width = v + '%');
    setV($('ultbtn'), 'uf', u >= 100, (e, v) => e.classList.toggle('full', v));
    setV($('ulttxt'), 'ut', u >= 100 ? 'CATACLYSM!' : 'CATACLYSM ' + Math.floor(u) + '%', (e, v) => e.textContent = v);
    const sb = $('startbtn'), showStart = G.phase === 'inter' && !G.cardsPending && !G.over && !(G.won && !G.endless);
    setV(sb, 'sb', showStart, (e, v) => e.classList.toggle('hide', !v));
    const bossNext = (G.wave + 1) % 5 === 0;
    setV(sb, 'sbt', G.wave + 1 + '|' + bossNext, (e) => { e.innerHTML = (bossNext ? 'BOSS WAVE ' : 'START WAVE ') + (G.wave + 1) + '<em>SPACE</em>'; e.classList.toggle('red', bossNext); });
    setV(sb, 'pls', G.phase === 'inter' && G.wave === 0, (e, v) => e.classList.toggle('pulse', v));
    const bb = $('bossbar');
    setV(bb, 'bb', !!G.boss, (e, v) => e.classList.toggle('hide', !v));
    if (G.boss) { setV($('bossfill'), 'bf', Math.round(G.boss.hp / G.boss.mhp * 100), (e, v) => e.style.width = v + '%'); setV($('bossname'), 'bn', G.boss.name, (e, v) => e.textContent = v); }
    setV($('aimhint'), 'ah', G.aim != null, (e, v) => e.classList.toggle('hide', !v));
    setV($('b-speed'), 'sp', G.speed, (e, v) => e.textContent = v + 'x');
    setV($('b-auto'), 'au', G.auto, (e, v) => e.classList.toggle('on', v));
    // spell slots
    const slots = $('spellbar').children;
    for (let i = 0; i < slots.length; i++) {
      const h = G.heroes[i], s = slots[i]; if (!h) continue;
      const cdT = Math.max(0, h.scd), tot = spellCd(h), f = Math.min(1, cdT / tot);
      const cd = s.children[2], n = s.children[3];
      cd.style.height = (f * 100) + '%';
      const txt = cdT > 0 ? Math.ceil(cdT) : '';
      if (n._t !== txt) { n._t = txt; n.textContent = txt; }
      const rdy = cdT <= 0; if (s._r !== rdy) { s._r = rdy; s.classList.toggle('rdy', rdy); }
      const am = G.aim === i; if (s._a !== am) { s._a = am; s.classList.toggle('aim', am); }
    }
    if (hudDirty) { hudDirty = false; UI.relicRow(); }
    if (!shopEl.classList.contains('hide')) UI.shopFrame();
  },
  shopFrame() {
    const key = shopTab + '|' + G.heroes.map(h => h.id + h.lvl + '.' + h.sum.lvl + h.sum.n + h.sum.skill).join() + '|' + SAVE.unlocked.length + '|' + G.wave + '|' + (G.earth.hp >= G.earth.max);
    if (key !== lastShopKey) { lastShopKey = key; renderShop(); }
    shopEl.querySelectorAll('[data-cost]').forEach(b => {
      const dis = G.gold < +b.dataset.cost; if (b._d !== dis) { b._d = dis; b.classList.toggle('dis', dis); }
    });
    const sg = $('shopgold'); if (sg) { const v = Math.floor(G.gold) + 'g'; if (sg.textContent !== v) sg.textContent = v; }
  }
};
let shopTab = 'wiz';
function renderShop() {
  let h = `<button class="x" data-act="shopclose">X</button><h3><span id="shopgold">${Math.floor(G.gold)}g</span></h3>
    <div class="tabs">${[['wiz', 'WIZARDS'], ['fam', 'FAMILIARS'], ['sup', 'SUPPLIES']].map(([k, n]) => `<button data-act="tab:${k}" class="${shopTab === k ? 'on' : ''}">${n}</button>`).join('')}</div>`;
  if (shopTab === 'wiz') {
    G.heroes.forEach((hh, i) => {
      const d = HEROES[hh.id], st = hstat(hh), max = hh.lvl >= 12;
      h += `<div class="hrow"><canvas data-hero="${hh.id}"></canvas><div class="i"><span style="color:${d.col}">${d.name}</span> LV${hh.lvl}<small>DMG ${Math.round(st.dmg)} · ${(1 / st.cd).toFixed(1)}/s · RNG ${Math.round(st.range)}</small></div>${max ? '<button class="dis">MAX</button>' : `<button data-act="up:${i}" data-cost="${upCost(hh)}">UP ${upCost(hh)}g</button>`}</div>`;
    });
    h += `<h4>LV5: +1 SHOT · LV10: +1 SHOT, SPELL CD -25%</h4>`;
  } else if (shopTab === 'fam') {
    G.heroes.forEach((hh, i) => {
      const S = SUMMONS[hh.id], sm = hh.sum, b = (w, l) => { const c = sumCost(hh, w); return c ? `<button data-act="sum:${i}-${w}" data-cost="${c}">${l} ${c}g</button>` : `<button class="dis">${l} MAX</button>`; };
      h += `<div class="hrow sub"><div class="i"><span style="color:${S.col}">${S.name}</span> LV${sm.lvl} x${sm.n} SK${sm.skill}</div><div class="btns" title="${sm.skill < 3 ? 'Next skill: ' + S.sk[sm.skill] : 'All skills unlocked'}">${b('pwr', 'PWR')}${b('num', 'NUM')}${b('skill', 'SKL')}</div></div>`;
    });
    h += `<h4>RUNES DROP FROM FOES. HOVER TO GRAB.</h4>`;
  } else {
    const cand = SAVE.unlocked.filter(id => !G.heroes.some(x => x.id === id));
    if (G.heroes.length < hmax) {
      h += `<h4>RECRUIT WIZARD (${hireCost()}g)</h4>`;
      if (!cand.length) h += `<div class="hrow"><div class="i"><small>NO WIZARDS LEFT. UNLOCK MORE IN THE GRIMOIRE.</small></div></div>`;
      cand.forEach(id => { const d = HEROES[id]; h += `<div class="hrow"><canvas data-hero="${id}"></canvas><div class="i"><span style="color:${d.col}">${d.name}</span><small>${d.desc}</small></div><button data-act="hire:${id}" data-cost="${hireCost()}">HIRE</button></div>`; });
    } else h += `<h4>YOUR CIRCLE IS FULL (6)</h4>`;
    h += `<h4>SUPPLIES</h4><div class="hrow"><div class="i">Mend Earth<small>+30 HP</small></div><button data-act="repair" data-cost="${repairCost()}">${repairCost()}g</button></div>
        <div class="hrow"><div class="i">Mana Well<small>Refresh all spells</small></div><button data-act="well" data-cost="${wellCost()}">${wellCost()}g</button></div>`;
  }
  const sc = shopEl.scrollTop; shopEl.innerHTML = h; paintIcons(shopEl); shopEl.scrollTop = sc;
  shopEl.querySelectorAll('[data-cost]').forEach(b => { b._d = undefined; });
}

let counted = false;
function endRunOnce(won) {
  const reward = runReward(), pay = reward - (G.paid || 0); G.paid = reward;
  SAVE.crystals += pay; if (!G.counted) { G.counted = true; SAVE.runs++; }
  SAVE.best[G.diffKey] = Math.max(SAVE.best[G.diffKey] || 0, G.wave); if (won && !G.winCounted) { G.winCounted = true; SAVE.wins++; }
  persist(); return pay;
}

// ---- action dispatcher ----
function act(a) {
  SND.init();
  const [k, v] = a.split(':');
  switch (k) {
    case 'play': sfx('click'); UI.heroSelect(); break;
    case 'grim': sfx('click'); UI.grimoire(); break;
    case 'grim2': sfx('click'); G.on = false; UI.grimoire(); break;
    case 'how': sfx('click'); UI.how(); break;
    case 'menu': sfx('click'); G.on = false; G.paused = false; UI.title(); break;
    case 'retry': sfx('click'); G.on = false; G.paused = false; UI.heroSelect(); break;
    case 'diff': SAVE.diff = v; persist(); sfx('click'); UI.title(); break;
    case 'pick': startRun(v); break;
    case 'unlock': { const d = HEROES[v]; if (SAVE.crystals >= d.unlock && !SAVE.unlocked.includes(v)) { SAVE.crystals -= d.unlock; SAVE.unlocked.push(v); persist(); sfx('card'); } else sfx('deny'); UI.grimoire(); break; }
    case 'perk': { const p = PERKS.find(x => x.id === v), l = perk(v), c = p.cost(l); if (l < p.max && SAVE.crystals >= c) { SAVE.crystals -= c; SAVE.perks[v] = l + 1; persist(); sfx('buy'); } else sfx('deny'); UI.grimoire(); break; }
    case 'sfx': SAVE.sfx = !SAVE.sfx; SND.setSfx(SAVE.sfx); persist(); G.on ? UI.pause() : UI.title(); sfx('click'); break;
    case 'music': SAVE.music = !SAVE.music; SND.setMusic(SAVE.music); persist(); G.on ? UI.pause() : UI.title(); break;
    case 'card': { const r = G._cards[+v]; if (!r) break; sfx('buy'); takeRelic(r); UI.hideScreen(); UI.banner(r.n.toUpperCase(), r.t, 'spell'); UI.openShop(); break; }
    case 'reroll': { const c = rerollCost(); if (G.gold >= c) { G.gold -= c; G.rerolls++; UI.cards(rollCards(3)); } else sfx('deny'); break; }
    case 'cont': G.endless = true; G.paused = false; SND.startMusic(); UI.hideScreen(); G.cardsPending = true; UI.cards(rollCards(3)); break;
    case 'resume': togglePause(); break;
    case 'quit': G.paused = false; endRunOnce(false); G.on = false; UI.title(); break;
    case 'tab': shopTab = v; lastShopKey = ''; sfx('click'); break;
    case 'sum': { const [i, w] = v.split('-'); if (buySum(+i, w)) lastShopKey = ''; break; }
    case 'up': if (upgradeHero(+v)) { lastShopKey = ''; } break;
    case 'hire': if (hireHero(v)) { lastShopKey = ''; } break;
    case 'repair': if (repair()) lastShopKey = ''; break;
    case 'well': if (well()) lastShopKey = ''; break;
    case 'shopclose': UI.closeShop(); sfx('click'); break;
  }
}
function startRun(id) {
  SND.init(); SND.startMusic(); newRun(SAVE.diff, id); UI.hideScreen(); $('hud').classList.remove('hide'); UI.closeShop();
  UI.spellbar(); UI.relicRow(); UI.hudDirty(); sfx('card');
  UI.banner('PREPARE!', 'PRESS SPACE TO START WAVE 1', 'spell');
  if (!SAVE.tut) { SAVE.tut = 1; persist(); UI.toast('Wizards fire on their own. Press Q/W/E (or click icons) to cast spells - aimed spells hit your cursor. Press B to open the shop.', 9000); }
}
function togglePause() {
  if (!G.on || G.over) return;
  G.paused = !G.paused;
  if (G.paused) UI.pause(); else UI.hideScreen();
}

// ---- input wiring ----
overlay.addEventListener('click', e => { const t = e.target.closest('[data-act]'); if (t) act(t.dataset.act); });
shopEl.addEventListener('click', e => { const t = e.target.closest('[data-act]'); if (t && !t.classList.contains('dis')) act(t.dataset.act); else if (t) sfx('deny'); });
$('startbtn').addEventListener('click', () => { SND.init(); startWave(); });
$('ultbtn').addEventListener('click', () => { SND.init(); if (!castUlt()) sfx('deny'); });
$('b-shop').addEventListener('click', () => UI.toggleShop());
$('b-pause').addEventListener('click', () => togglePause());
$('b-speed').addEventListener('click', () => { G.speed = G.speed >= 3 ? 1 : G.speed + 1; sfx('click'); });
$('b-auto').addEventListener('click', () => { G.auto = !G.auto; sfx('click'); });
$('b-snd').addEventListener('click', () => { const on = !(SND.sfxOn || SND.musOn); SAVE.sfx = SAVE.music = on; SND.setSfx(on); SND.setMusic(on); persist(); });

function toGame(ev) {
  const r = cv.getBoundingClientRect();
  G.mx = Math.max(0, Math.min(W - 1, (ev.clientX - r.left) / r.width * W)); G.my = Math.max(0, Math.min(H - 1, (ev.clientY - r.top) / r.height * H));
}
cv.addEventListener('pointermove', ev => { toGame(ev); G.mouseIn = ev.pointerType === 'mouse'; });
cv.addEventListener('pointerleave', () => { G.mouseIn = false; });
cv.addEventListener('pointerdown', ev => {
  SND.init(); toGame(ev);
  if (ev.button === 2) { G.aim = null; return; }
  if (G.on && !G.paused && collectAt(G.mx, G.my, 16)) return;
  if (G.on && G.aim != null && !G.paused) { castSpell(G.aim, G.mx, G.my); }
});
cv.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('contextmenu', e => e.preventDefault());
const SPELL_KEYS = { q: 0, w: 1, e: 2, r: 3, t: 4, y: 5, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 };
document.addEventListener('keydown', ev => {
  if (ev.repeat || ev.ctrlKey || ev.metaKey || ev.altKey) return;
  const k = ev.key.toLowerCase();
  if (k === ' ') { ev.preventDefault(); if (G.on && !G.paused) startWave(); return; }
  if (k === 'escape') { if (G.on && G.aim != null) { G.aim = null; return; } togglePause(); return; }
  if (k === 'p') { togglePause(); return; }
  if (k === 'm') { const on = !(SND.sfxOn || SND.musOn); SAVE.sfx = SAVE.music = on; SND.setSfx(on); SND.setMusic(on); persist(); return; }
  if (!G.on || G.paused || G.over) return;
  if (k in SPELL_KEYS) { SND.init(); trySpell(SPELL_KEYS[k], true); }
  else if (k === 'f') { if (!castUlt()) sfx('deny'); }
  else if (k === 'b') UI.toggleShop();
  else if (k === 'a') G.auto = !G.auto;
  else if (k === 'g') G.speed = G.speed >= 3 ? 1 : G.speed + 1;
});
document.addEventListener('visibilitychange', () => { if (document.hidden && G.on && !G.paused && !G.over) togglePause(); });

function fit() {
  const vv = window.visualViewport, sw = Math.floor(vv ? vv.width : innerWidth), sh = Math.floor(vv ? vv.height : innerHeight);
  $('rotate').classList.toggle('show', sh > sw * 1.15 && sw < 900);
  let s = Math.min(sw / W, sh / H);
  const f = Math.floor(s); if (f >= 2 && s - f < 0.35) s = f;
  stage.style.transform = `scale(${s})`; stage.style.left = Math.max(0, Math.round((sw - W * s) / 2)) + 'px'; stage.style.top = Math.max(0, Math.round((sh - H * s) / 2)) + 'px';
}
addEventListener('resize', fit); if (window.visualViewport) visualViewport.addEventListener('resize', fit); addEventListener('orientationchange', fit); fit();
// wait for the pixel font so layout is measured with the real glyph widths
Promise.race([document.fonts ? document.fonts.load('8px PS2P') : Promise.resolve(), new Promise(r => setTimeout(r, 2500))]).then(() => stage.classList.remove('pre'));

document.addEventListener('click', e => { if (e.target && e.target.blur && e.target.tagName === 'BUTTON') e.target.blur(); });
