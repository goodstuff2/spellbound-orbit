'use strict';
// ================= SPELLS =================
function inCircle(x, y, r, fn) {
  const r2 = r * r;
  for (let i = 0; i < G.enemies.length; i++) {
    const e = G.enemies[i]; if (e.dead) continue;
    const dx = e.x - x, dy = e.y - y, rr = r + e.r;
    if (dx * dx + dy * dy < rr * rr) fn(e, Math.sqrt(dx * dx + dy * dy));
  }
}
function fillCircle(c, x, y, r, col, a) { c.globalAlpha = a; c.fillStyle = col; pdisc(c, x, y, r); c.globalAlpha = 1; }

const SPELLS = {
  pyro(h, tx, ty) {
    sfx('spell'); const pw = spellPow(h), count = 14 + Math.min(18, h.lvl * 2);
    flash(0.15, '#ff8a2e');
    actor({
      under: true, n: 0, acc: 0,
      upd(dt) {
        this.acc += dt;
        while (this.acc > 0.11 && this.n < count) { this.acc -= 0.11; this.n++; meteor(); }
        if (this.n >= count && this.t > count * 0.11 + 0.6) this.dead = true;
      },
      draw(c, t) { if (this.t < 1.2) { c.globalAlpha = 0.5 * (1 - this.t / 1.2); c.fillStyle = '#ff8a2e'; pring(c, tx, ty, 50); c.globalAlpha = 1; } }
    });
    function meteor() {
      const mx = tx + R(-52, 52), my = ty + R(-52, 52), sx = mx + 110, sy = my - 190, dur = 0.42;
      actor({
        upd(dt) {
          const k = Math.min(1, this.t / dur); this.x = sx + (mx - sx) * k; this.y = sy + (my - sy) * k;
          P(this.x, this.y, R(-10, 10), R(-10, 10), 0.35, rnd() < 0.5 ? '#ffb02e' : '#ff4a1a', 2, 0, true);
          if (this.t >= dur) {
            this.dead = true; sfx('meteor'); shake(2.5);
            boom(mx, my, 27, 38 * pw, '#ff8a2e', { burn: 5 * pw, quiet: false });
            burst(mx, my, 10, '#ffe14a', 90, 0.5, 2, 60, true); burst(mx, my, 5, '#5a3a2a', 50, 0.6, 2, 80);
          }
        },
        draw(c) { const x = Math.round(this.x), y = Math.round(this.y); c.globalCompositeOperation = 'lighter'; c.drawImage(glow('#ff6a1a', 10), x - 10, y - 10); c.globalCompositeOperation = 'source-over'; c.fillStyle = '#6a2a1a'; c.fillRect(x - 3, y - 3, 6, 6); c.fillStyle = '#ff5a1a'; c.fillRect(x - 2, y - 2, 4, 4); c.fillStyle = '#ffe14a'; c.fillRect(x - 1, y - 1, 2, 2); }
      });
    }
  },
  cryo(h, tx, ty) {
    sfx('frost'); sfx('spell'); const pw = spellPow(h), RR = 52 + h.lvl * 2; flash(0.15, '#7fdcff');
    actor({
      under: true, tick: 0,
      upd(dt) {
        this.tick += dt;
        if (this.tick > 0.25) { this.tick = 0; inCircle(tx, ty, RR, e => dmgE(e, 5 * pw, { slow: 0.45, slowT: 0.7, noproc: true, col: '#bff', dot: false })); }
        for (let i = 0; i < 2; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * RR; P(tx + Math.cos(a) * d, ty + Math.sin(a) * d - 12, R(-6, 6), R(20, 36), 0.5, rnd() < 0.5 ? '#ffffff' : '#bff4ff', 1, 0, true); }
        if (this.t >= 6) {
          this.dead = true; sfx('boom'); shake(4); ring(tx, ty, RR + 10, '#bff4ff', 0.5);
          inCircle(tx, ty, RR, e => { if (e.slowF < 1) dmgE(e, 36 * pw, { col: '#bff4ff', noproc: true }); });
          burst(tx, ty, 40, '#bff4ff', 130, 0.7, 2, 40, true);
        }
      },
      draw(c, t) {
        const a = Math.min(1, this.t * 3, (6 - this.t) * 3);
        fillCircle(c, tx, ty, RR, '#7fdcff', 0.13 * a); c.globalAlpha = 0.6 * a; c.fillStyle = '#bff4ff'; pring(c, tx, ty, RR);
        c.globalAlpha = 0.3 * a; pring(c, tx, ty, RR - 2);
        for (let i = 0; i < 12; i++) { const an = t * 0.8 + i * TAU / 12; c.globalAlpha = 0.5 * a; c.fillRect(Math.round(tx + Math.cos(an) * (RR - 5)), Math.round(ty + Math.sin(an) * (RR - 5)), 2, 2); }
        c.globalAlpha = 1;
      }
    });
  },
  storm(h) {
    sfx('spell'); sfx('thunder'); const pw = spellPow(h); flash(0.35, '#ccd8ff'); const dur = 3.6 + Math.min(1.5, h.lvl * 0.12);
    actor({
      acc: 0,
      upd(dt) {
        this.acc += dt;
        while (this.acc > 0.09) {
          this.acc -= 0.09;
          const live = G.enemies.filter(e => !e.dead); let x, y, tg = null;
          if (live.length) { tg = live[Math.floor(rnd() * live.length)]; x = tg.x; y = tg.y; } else { x = R(30, 450); y = R(30, 240); }
          lightning(x + R(-25, 25), -6, x, y, rnd() < 0.5 ? '#fff59a' : '#c8d8ff', 0.22);
          sfx('thunder'); P(x, y, 0, 0, 0.12, '#fff', 3, 0, true); burst(x, y, 4, '#fff59a', 60, 0.3, 1, 0, true);
          if (tg) dmgE(tg, 22 * pw, { col: '#fff59a', noproc: true });
          inCircle(x, y, 16, e => { if (e !== tg) dmgE(e, 9 * pw, { col: '#fff59a', noproc: true }); });
          if (rnd() < 0.3) { flash(0.12, '#dde'); shake(1.5); }
        }
        if (this.t > dur) this.dead = true;
      },
      draw() { }
    });
  },
  necro(h) {
    sfx('spell'); sfx('roar'); const pw = spellPow(h); flash(0.25, '#6dff8a');
    for (let i = 0; i < 6 + Math.floor(h.lvl / 2); i++) spawnSoul(CX, CY, 12 * pw * 0.8);
    const hitSet = new Set(), speed = 230;
    actor({
      under: true,
      upd(dt) {
        const r = this.t * speed;
        for (let i = 0; i < G.enemies.length; i++) {
          const e = G.enemies[i]; if (e.dead || hitSet.has(e.id)) continue;
          if (Math.hypot(e.x - CX, e.y - CY) < r) {
            hitSet.add(e.id);
            const was = e.hp; dmgE(e, 30 * pw, { col: '#6dff8a', slow: 0.6, slowT: 2, noproc: true, soul: true });
            if (e.dead) spawnSoul(e.x, e.y, 14 * pw * 0.8);
            P(e.x, e.y, 0, -20, 0.5, '#6dff8a', 2, 0, true);
          }
        }
        if (r > 330) this.dead = true;
      },
      draw(c) {
        const r = this.t * speed; c.globalAlpha = Math.max(0, 1 - r / 330);
        c.fillStyle = '#6dff8a'; for (let k = 0; k < 4; k++) pring(c, CX, CY, r - k);
        c.fillStyle = '#d8ffd8'; pring(c, CX, CY, r + 1);
        c.globalAlpha = 0.08 * c.globalAlpha; pdisc(c, CX, CY, r); c.globalAlpha = 1;
        for (let i = 0; i < 6; i++) { const a = rnd() * TAU; P(CX + Math.cos(a) * r, CY + Math.sin(a) * r, 0, -15, 0.4, '#6dff8a', 1, 0, true); }
      }
    });
  },
  druid(h) {
    sfx('holy'); const pw = spellPow(h), E = G.earth; flash(0.3, '#9aff5a');
    const heal = E.max * 0.25 + 20; E.hp = Math.min(E.max, E.hp + heal); pop(CX, CY - 28, heal, '#7dff7a', 2);
    E.shield = Math.max(E.shield, 60 + 10 * h.lvl); E.shieldT = 14;
    const spikes = [];
    inCircle(CX, CY, 140, e => { dmgE(e, 18 * pw, { root: 2.5, col: '#9aff5a', noproc: true }); spikes.push({ x: e.x, y: e.y, h: R(8, 14) }); });
    ring(CX, CY, 140, '#9aff5a', 0.8); ring(CX, CY, 100, '#c8ff6a', 0.6);
    burst(CX, CY, 60, '#9aff5a', 100, 1, 2, -20, true);
    actor({
      upd(dt) { if (this.t > 2.5) this.dead = true; if (rnd() < 0.3) P(CX + R(-22, 22), CY + R(-22, 22), 0, -25, 0.8, '#c8ff6a', 1, 0, true); },
      draw(c) {
        const k = Math.min(1, this.t * 6), a = Math.min(1, (2.5 - this.t) * 2);
        for (const s of spikes) {
          c.globalAlpha = a; c.fillStyle = '#2e7a3a'; c.fillRect(Math.round(s.x) - 2, Math.round(s.y), 1, 1);
          const hh = Math.round(s.h * k); c.fillStyle = '#3fae4d'; c.fillRect(Math.round(s.x) - 1, Math.round(s.y) - hh + 4, 2, hh); c.fillStyle = '#c8ff6a'; c.fillRect(Math.round(s.x) - 4, Math.round(s.y) - hh * 0.6 + 4, 3, 1); c.fillRect(Math.round(s.x) + 2, Math.round(s.y) - hh * 0.4 + 4, 3, 1); c.fillRect(Math.round(s.x), Math.round(s.y) - hh + 3, 1, 1);
        }
        c.globalAlpha = 1;
      }
    });
  },
  sage(h, tx, ty) {
    sfx('hole'); sfx('spell'); const pw = spellPow(h), RR = 82 + h.lvl, life = 5; flash(0.3, '#ff9bf2');
    actor({
      under: true, tick: 0,
      upd(dt) {
        this.tick += dt;
        const k = Math.min(1, this.t * 2);
        for (let i = 0; i < G.enemies.length; i++) {
          const e = G.enemies[i]; if (e.dead) continue;
          const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy) || 1;
          if (d < RR + 20) { const f = (e.boss ? 0.25 : 1) * (45 + (1 - d / (RR + 20)) * 190) * k; e.x += dx / d * f * dt; e.y += dy / d * f * dt; }
        }
        if (this.tick > 0.2) { this.tick = 0; inCircle(tx, ty, 34, e => dmgE(e, 11 * pw, { col: '#ff9bf2', noproc: true })); }
        if (rnd() < 0.8) { const a = rnd() * TAU, d = R(30, RR); P(tx + Math.cos(a) * d, ty + Math.sin(a) * d, -Math.cos(a) * 90 - Math.sin(a) * 60, -Math.sin(a) * 90 + Math.cos(a) * 60, 0.45, rnd() < 0.5 ? '#ff9bf2' : '#a98bff', 1, 0, true); }
        shake(0.6);
        if (this.t >= life) { this.dead = true; sfx('bigboom'); shake(7); flash(0.6, '#ff9bf2'); boom(tx, ty, 72, 100 * pw, '#ff9bf2', { noproc: true }); ring(tx, ty, 90, '#fff', 0.6); burst(tx, ty, 50, '#ff9bf2', 160, 0.8, 2, 0, true); }
      },
      draw(c, t) {
        const k = Math.min(1, this.t * 2, (life - this.t) * 4 + 0.3), r = 10 * k + Math.sin(t * 20) * 0.6;
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.9; c.drawImage(glow('#a040ff', 26), Math.round(tx - 26), Math.round(ty - 26)); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
        c.fillStyle = '#ff9bf2'; pdisc(c, tx, ty, r + 2); c.fillStyle = '#b060ff'; pdisc(c, tx, ty, r + 1); c.fillStyle = '#05010a'; pdisc(c, tx, ty, r);
        c.fillStyle = 'rgba(255,155,242,0.35)'; for (let q = 0; q < 3; q++) pring(c, tx, ty, r + 4 + q * 7 + (t * 12 % 7));
      }
    });
  },
  chrono(h) {
    sfx('timestop'); const dur = 3.6 + h.lvl * 0.2; G.timeStop = dur; flash(0.7, '#ffffff'); G.flashCol = '#c8e0ff'; ring(CX, CY, 330, '#c8e0ff', 0.9); ring(CX, CY, 200, '#41e8d6', 0.7);
    UI.banner('TIME STOP', '', 'spell');
    actor({
      upd(dt) { if (rnd() < 0.5) P(CX + R(-240, 240), CY + R(-135, 135), 0, R(-8, -2), 1, '#c8e0ff', 1, 0, true); if (this.t > dur) { this.dead = true; ring(CX, CY, 300, '#41e8d6', 0.5); sfx('chrono'); } },
      draw() { }
    });
  },
  summoner(h) {
    sfx('roar'); sfx('spell'); const pw = spellPow(h), life = 10 + Math.min(6, h.lvl * 0.5); flash(0.4, '#ff5a3a'); shake(4);
    burst(CX, CY, 40, '#ff8a2e', 120, 0.8, 2, 0, true);
    actor({
      ang: rnd() * TAU, fireT: 0, breathT: 1, x: CX + 80, y: CY, face: 1,
      upd(dt) {
        const sp = 1.5; const lx = this.x; this.ang += sp * dt;
        this.x = CX + Math.cos(this.ang) * 84; this.y = CY + Math.sin(this.ang) * 74 - 6; this.face = this.x >= lx ? 1 : -1;
        this.fireT += dt; this.breathT -= dt;
        let tgt = null, bd = 1e9; for (const e of G.enemies) { if (e.dead) continue; const d = (e.x - this.x) ** 2 + (e.y - this.y) ** 2; if (d < bd && d < 230 * 230) { bd = d; tgt = e; } }
        if (tgt && this.fireT > 0.07) {
          this.fireT = 0; const a = Math.atan2(tgt.y - this.y, tgt.x - this.x) + R(-0.12, 0.12);
          proj({ x: this.x, y: this.y, vx: Math.cos(a) * 210, vy: Math.sin(a) * 210, dmg: 9 * pw, kind: 'flame', col: '#ff5a3a', pierce: 3, life: 0.7, r: 5, burn: 5 * pw });
        }
        if (tgt && this.breathT <= 0) {
          this.breathT = 2; sfx('boom'); shake(2); const a0 = Math.atan2(tgt.y - this.y, tgt.x - this.x);
          for (let i = -5; i <= 5; i++) proj({ x: this.x, y: this.y, vx: Math.cos(a0 + i * 0.1) * 180, vy: Math.sin(a0 + i * 0.1) * 180, dmg: 12 * pw, kind: 'flame', col: '#ffe14a', pierce: 4, life: 0.8, r: 5, burn: 6 * pw });
        }
        P(this.x - this.face * 8, this.y + R(-2, 4), R(-10, 10), R(-5, 15), 0.5, rnd() < 0.5 ? '#ffb02e' : '#ff4a1a', 2, 0, true);
        if (this.t > life) { this.dead = true; burst(this.x, this.y, 40, '#ff8a2e', 100, 0.8, 2, 0, true); sfx('boom'); }
      },
      draw(c, t) {
        const s = ART.fdragon, bob = Math.round(Math.sin(t * 9) * 2), x = this.x, y = this.y + bob;
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6; c.drawImage(glow('#ff5a1a', 18), Math.round(x - 18), Math.round(y - 18)); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
        drawSpr(c, s, x, y, { flip: this.face < 0, scale: 1 });
      }
    });
  }
};

function starFall(x, y, d) {
  const sx = x + 50, sy = y - 160;
  actor({
    upd(dt) {
      const k = Math.min(1, this.t / 0.3); this.x = sx + (x - sx) * k; this.y = sy + (y - sy) * k; P(this.x, this.y, R(-8, 8), R(-8, 8), 0.3, '#fff59a', 1, 0, true);
      if (this.t >= 0.3) { this.dead = true; boom(x, y, 25, d, '#ffe94a', { noproc: true, quiet: true }); sfx('boom'); burst(x, y, 12, '#fff', 90, 0.5, 1, 0, true); }
    },
    draw(c) { const px = Math.round(this.x), py = Math.round(this.y); c.fillStyle = '#fff'; c.fillRect(px - 1, py - 3, 2, 6); c.fillRect(px - 3, py - 1, 6, 2); c.fillStyle = '#ffe94a'; c.fillRect(px - 1, py - 1, 2, 2); }
  });
}

function castSpell(i, tx, ty) {
  const h = G.heroes[i]; if (!h || !G.on || G.over || h.scd > 0 || G.dying > 0) return false;
  const def = HEROES[h.id];
  if (def.spell.aim && tx == null) { tx = G.mx; ty = G.my; }
  h.scd = spellCd(h); h.castT = 0.8; G.spellCasts++;
  const fn = SPELLS[h.id]; fn(h, tx, ty); UI.castName(def.spell.name, def.col);
  burst(h.x, h.y, 14, def.col, 70, 0.6, 1, 0, true);
  G.ult = Math.min(100, G.ult + 3 * M.siphon);
  if (rnd() < M.echo) actor({ upd() { if (this.t > 0.7) { this.dead = true; if (G.on && !G.over) { fn(h, tx, ty); UI.banner('SPELL ECHO', '', 'spell'); } } }, draw() { } });
  G.aim = null; UI.hudDirty();
  return true;
}

let ultBusy = false;
function castUlt() {
  if (!G.on || G.over || G.ult < 100 || ultBusy) return false;
  ultBusy = true; G.ult = 0; sfx('ult'); UI.banner('ARCANE CATACLYSM', '', 'ult'); G.slowmo = 0.3; G.aim = null;
  const charge = 0.36;
  actor({
    fired: false,
    upd(dt) {
      if (this.t < charge) {
        for (const h of G.heroes) { const a = Math.atan2(CY - h.y, CX - h.x); P(h.x, h.y - 6, Math.cos(a) * 80, Math.sin(a) * 80, 0.4, HEROES[h.id].col, 2, 0, true); }
        for (let i = 0; i < 4; i++) { const a = rnd() * TAU, d = 130; P(CX + Math.cos(a) * d, CY + Math.sin(a) * d, -Math.cos(a) * d * 2.2, -Math.sin(a) * d * 2.2, 0.45, '#fff', 1, 0, true); }
      } else if (!this.fired) {
        this.fired = true; G.slowmo = 1; ultBusy = false; this.dead = false;
        sfx('ultboom'); flash(1.2, '#ffffff'); shake(10);
        const dmg = (170 + 24 * G.wave) * M.spell * M.dmg;
        for (const e of G.enemies) { if (e.dead) continue; const dd = e.boss ? Math.min(dmg, e.mhp * 0.25 + dmg * 0.2) : dmg; burst(e.x, e.y, 6, '#fff', 90, 0.5, 1, 0, true); dmgE(e, dd, { col: '#ffffff', raw: true, noproc: true }); }
        for (let k = 0; k < 4; k++) setTimeout(() => ring(CX, CY, 330, ['#ffffff', '#ff9bf2', '#7fdcff', '#ffe14a'][k], 0.9), k * 120);
        for (let i = 0; i < 120; i++) { const a = rnd() * TAU, s = R(60, 320); P(CX, CY, Math.cos(a) * s, Math.sin(a) * s, R(0.6, 1.4), ['#fff', '#ffe14a', '#ff9bf2', '#7fdcff'][i & 3], 2, 0, true); }
        G.heroes.forEach(h => { h.scd = 0; h.castT = 1; });
        G.earth.hp = Math.min(G.earth.max, G.earth.hp + G.earth.max * 0.15); G.eprojs.length = 0;
        UI.spellbar();
      } else if (this.t > charge + 0.8) this.dead = true;
    },
    draw(c, t) {
      if (this.t < charge) {
        const k = this.t / charge; c.fillStyle = '#fff'; c.globalAlpha = 0.9; pring(c, CX, CY, 130 * (1 - k) + 10); pring(c, CX, CY, 130 * (1 - k) + 12);
        for (const h of G.heroes) { c.fillStyle = HEROES[h.id].col; pline(c, h.x, h.y - 6, CX, CY); }
        c.globalCompositeOperation = 'lighter'; c.drawImage(glow('#fff', Math.round(10 + 40 * k)), Math.round(CX - (10 + 40 * k)), Math.round(CY - (10 + 40 * k))); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      }
    }
  });
  return true;
}

// start aiming / casting from UI or key
function trySpell(i, fromKey) {
  const h = G.heroes[i]; if (!h || !G.on || G.over) return;
  if (h.scd > 0) { sfx('deny'); return; }
  if (HEROES[h.id].spell.aim) {
    if (fromKey && G.mouseIn) { castSpell(i, G.mx, G.my); return; }
    G.aim = G.aim === i ? null : i; sfx('click'); UI.hudDirty();
  } else castSpell(i);
}
