'use strict';
// ---------- pixel sprite toolkit ----------
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

function makeSprite(rows, pal) {
  const w = Math.max(...rows.map(r => r.length)), h = rows.length;
  const c = mk(w, h), x = c.getContext('2d');
  rows.forEach((r, y) => {
    for (let i = 0; i < r.length; i++) {
      const col = pal[r[i]];
      if (col) { x.fillStyle = col; x.fillRect(i, y, 1, 1); }
    }
  });
  return wrapSprite(c);
}
function tintSil(c, color) {
  const o = mk(c.width, c.height), x = o.getContext('2d');
  x.drawImage(c, 0, 0); x.globalCompositeOperation = 'source-in';
  x.fillStyle = color; x.fillRect(0, 0, c.width, c.height); return o;
}
function wrapSprite(c) {
  return { c, w: c.width, h: c.height, white: tintSil(c, '#ffffff'), _ice: null, _elite: null };
}
function iceOf(s) { return s._ice || (s._ice = tintSil(s.c, '#8fe8ff')); }
function eliteOf(s) {
  if (s._elite) return s._elite;
  const o = mk(s.w + 2, s.h + 2), x = o.getContext('2d');
  const g = tintSil(s.c, '#ffd23f');
  [[0, 1], [2, 1], [1, 0], [1, 2]].forEach(([a, b]) => x.drawImage(g, a, b));
  x.drawImage(s.c, 1, 1);
  return (s._elite = o);
}
function drawSpr(ctx, s, x, y, o) {
  const sc = (o && o.scale) || 1, w = s.w * sc, h = s.h * sc;
  const px = Math.round(x - w / 2), py = Math.round(y - h / 2);
  if (o && o.flip) {
    ctx.save(); ctx.translate(px + w, py); ctx.scale(-1, 1); ctx.drawImage(s.c, 0, 0, w, h); ctx.restore();
  } else ctx.drawImage(s.c, px, py, w, h);
}

// ---------- palettes ----------
const BASE = { K: '#1b1230', W: '#f4efe6', Y: '#ffe14a', E: '#2a1a3a', T: '#8a5a2b' };
const PP = (o) => Object.assign({}, BASE, o);

// ---------- wizard templates ----------
const WIZ_HAT = [
  '....KK...OO',
  '...KHHK..OO',
  '...KHHK..T.',
  '..KHHHHK.T.',
  '..KBBBBK.T.',
  '.KhhhhhhKT.',
  '...KSSSK.T.',
  '...KESEK.T.',
  '...KWWWK.T.',
  '..KRRWRRKT.',
  '.KRRRrRRRK.',
  '.KRRRrRRRK.',
  '.KRRRrRRRK.',
  '.KKRRRRRKK.',
  '..KKKKKKK..'
];
const WIZ_HOOD = [
  '....KKK..OO',
  '...KHHHK.OO',
  '..KHHHHHKT.',
  '..KHKKKHKT.',
  '..KHKEKEKT.',
  '..KHKKKKHKT',
  '..KHHKKHHKT',
  '.KRHHHHHRKT',
  '.KRRRBBRRK.',
  '.KRRRrRRRK.',
  '.KRRRrRRRK.',
  '.KRRRrRRRK.',
  '.KKRRRRRKK.',
  '..KKKKKKK..'
];
const HERO_ART = {
  pyro: { t: WIZ_HAT, p: { H: '#e8452c', h: '#a02418', B: '#ffd23f', R: '#d8542a', r: '#a8301a', S: '#f2b98c', O: '#ffb02e' } },
  cryo: { t: WIZ_HAT, p: { H: '#47b0f0', h: '#2368a8', B: '#e8fbff', R: '#6cc4f2', r: '#3a86c8', S: '#f4d2b8', O: '#c8f8ff' } },
  storm: { t: WIZ_HAT, p: { H: '#f2d230', h: '#b5951a', B: '#5a4bd6', R: '#6a58e8', r: '#4638b0', S: '#f2c9a8', O: '#fffbb0' } },
  necro: { t: WIZ_HOOD, p: { H: '#5b3a8c', h: '#3a2060', B: '#6dff8a', R: '#46306e', r: '#2c1c4c', S: '#f2c9a8', O: '#6dff8a', E: '#6dff8a' } },
  druid: { t: WIZ_HOOD, p: { H: '#3f9c4c', h: '#276b32', B: '#c8ff6a', R: '#4aa856', r: '#2e7a3a', S: '#f2c9a8', O: '#d4ff7a', E: '#d4ff7a' } },
  sage: { t: WIZ_HAT, p: { H: '#2f3586', h: '#1b2060', B: '#ff9bf2', R: '#3b44a8', r: '#262c78', S: '#f2c9a8', O: '#ff9bf2' } },
  summoner: { t: WIZ_HOOD, p: { H: '#c8501f', h: '#8a3012', B: '#ffd23f', R: '#a8401a', r: '#782c10', S: '#f2c9a8', O: '#ff6a2e', E: '#ffd23f' } },
  chrono: { t: WIZ_HAT, p: { H: '#2ec4b6', h: '#1a8479', B: '#ffffff', R: '#d8f4ee', r: '#9cd0c8', S: '#f2c9a8', O: '#ffffff' } }
};

// ---------- enemies ----------
const ART = {
  imp: makeSprite([
    'K.........K', 'KRK.....KRK', '.KRKKKKKRK.', '.KRRRRRRRK.', 'KRRYKRKYRRK',
    'KRRRRRRRRRK', '.KRRKKKRRK.', '.KRRRRRRRK.', '..KRRKRRK..', '..KK.K.KK..'
  ], PP({ R: '#e0453a' })),
  bat: makeSprite([
    'K.........K', 'KK.......KK', 'KPK.KKK.KPK', 'KPPKKRKKPPK', 'KPPKYKYKPPK',
    '.KPPKKKPPK.', '..KK...KK..'
  ], PP({ P: '#8a4bd6', R: '#b06af0' })),
  skull: makeSprite([
    '..KKKKKK..', '.KWWWWWWK.', 'KWWWWWWWWK', 'KWKKWWKKWK', 'KWKGWWGKWK',
    'KWWWWWWWWK', '.KWWKKWWK.', '..KWWWWK..', '..KWKWKWK.', '...KKKKK..'
  ], PP({ G: '#7dff7a', W: '#e8e2d0' })),
  eye: makeSprite([
    '..K.......K..', '.KVK.KKK.KVK.', 'KVVVKWWWKVVVK', 'KVVKWWIWWKVVK', '.KVKWIIIWKVK.',
    '..K.KWIWK.K..', '......KKK....'
  ], PP({ V: '#c04ad6', I: '#ff3a5a' })),
  slime: makeSprite([
    '...KKKK...', '..KGGGGK..', '.KGHGGGGK.', '.KGGGGGGK.', 'KGWKGGWKGK',
    'KGGGGGGGGK', 'KGGGGGGGGK', '.KKKKKKKK.'
  ], PP({ G: '#4fd45a', H: '#a8f89a' })),
  slimeS: makeSprite([
    '..KKKK..', '.KGGGGK.', 'KGWKGWKG'.replace(/./g, c => c), 'KGGGGGGK', '.KKKKKK.'
  ], PP({ G: '#4fd45a', H: '#a8f89a' })),
  golem: makeSprite([
    '...KKKKKKKK...', '..KSSSSSSSSK..', '.KSSDDSSDDSSK.', '.KSSEESSEESSK.', 'KSSSSSSSSSSSSK',
    'KDSSSSSSSSSSDK', 'KDDSSKKKKSSDDK', '.KDSSSSSSSSDK.', '.KKDDDDDDDDKK.', '..KSSK..KSSK..', '..KKK....KKK..'
  ], PP({ S: '#9a8fa8', D: '#6a607a', E: '#ff8a2a' })),
  healer: makeSprite([
    '..KKKKK..', '.KWWWWWK.', 'KWWWWWWWK', 'KWKWWWKWK', 'KWWWWWWWK',
    'KWWKKKWWK', 'KWWWWWWWK', 'KWKWWWKWK', 'K.K.WK.K.'
  ], PP({ W: '#c8fff0' })),
  bomber: makeSprite([
    '...KKKK..', '..KOOOOK.', '.KOYYYOOK', 'KOYYYYOOK', 'KOOYYOOOK', '.KOOOOOK.', '..KKKKK..'
  ], PP({ O: '#ff7a2a', Y: '#ffe14a' })),
  // bosses (16x16, drawn at 2x)
  demon: makeSprite([
    'K..............K', 'KK............KK', 'KRK..KKKKKK..KRK', '.KRKKRRRRRRKKRK.', '.KRRRRRRRRRRRRK.',
    'KRRRYYRRRRYYRRRK', 'KRRRYYRRRRYYRRRK', 'KRRRRRRRRRRRRRRK', 'KRRRRKWKWKWRRRRK', 'KRRRRKWKWKWRRRRK',
    '.KRRRRKKKKKRRRK.', '.KRRRRRRRRRRRRK.', '..KRRRKKKKKRRK..', '..KKRRK..KRRKK..', '...KKK....KKK...'
  ], PP({ R: '#c4302e', Y: '#ffe14a' })),
  eyeboss: makeSprite([
    '.....KKKKKK.....', '...KKVVVVVVKK...', '..KVVVWWWWVVVK..', '.KVVWWWWWWWWVVK.', '.KVWWWIIIIWWWVK.',
    'KVVWWIIKKIIWWVVK', 'KVVWWIIKKIIWWVVK', 'KVVWWIIIIIIWWVVK', '.KVVWWIIIIWWVVK.', '.KVVVWWWWWWVVVK.',
    '..KVVVVVVVVVVK..', '..KKVVKVVKVVKK..', '...KVKKVVKKVK...', '...KK.KKKK.KK...', '..........'
  ], PP({ V: '#9a34c8', I: '#ff3a5a' })),
  dragon: makeSprite([
    '.K..........K...', 'KWK........KWK..', 'KWWKKKKKKKKWWK..', '.KWWWWWWWWWWWK..', 'KWWWWWWWWWWWWWK.',
    'KWWGGWWWWGGWWWK.', 'KWWGGWWWWGGWWWK.', 'KWWWWWWWWWWWWWK.', '.KWWWKKWWKKWWK..', '.KWWWWWWWWWWK...',
    '..KWKWKWKWKWK...', '..KKKKKKKKKK....'
  ], PP({ W: '#e8e2d0', G: '#ff6a2e' }))
};


function recolor(spr, map) {
  const c = mk(spr.w, spr.h), x = c.getContext('2d'); x.drawImage(spr.c, 0, 0);
  const d = x.getImageData(0, 0, spr.w, spr.h), q = d.data;
  const m = {}; for (const k in map) { const f = k.match(/\w\w/g).map(v => parseInt(v, 16)), t = map[k].match(/\w\w/g).map(v => parseInt(v, 16)); m[f.join()] = t; }
  for (let i = 0; i < q.length; i += 4) { const t = m[q[i] + ',' + q[i + 1] + ',' + q[i + 2]]; if (t) { q[i] = t[0]; q[i + 1] = t[1]; q[i + 2] = t[2]; } }
  x.putImageData(d, 0, 0); return wrapSprite(c);
}
ART.titan = recolor(ART.demon, { 'c4302e': '7a2ad0', 'ffe14a': '7fffff' });
ART.fdragon = makeSprite([
  '........KK..........',
  '..K....KWWK.....KK..',
  '.KWK..KWWWKK...KRRK.',
  'KWWWKKRRRRRKKKRRRRRK',
  '.KWWWRRRRRRRRRRRYRRK',
  '..KWWRRRRRRRRRRRRRRK',
  '...KKRORRRRRRRRRKKK.',
  '....KROORRRRRRRRK...',
  '....KKKKRRKKRRRK....',
  '.......K.KK.KKK.....'
], PP({ R: '#d8382a', O: '#ff9a3a', W: '#ffb04a', Y: '#ffe14a' }));

const SUM_SPR = {
  sPyro: makeSprite(['..K.K..', '.KRKRK.', 'KRRRRRK', 'KRYRYRK', 'KRRRRRK', '.KRRRK.', '..K.K..'], PP({ R: '#ff6a2a', Y: '#ffe14a' })),
  sCryo: makeSprite(['WW...WW', 'WWKKKWW', '.KBEBK.', '..KBK..', '.WKBKW.', '...K...'], PP({ B: '#7fdcff', W: '#e8fbff' })),
  sStorm: makeSprite(['K.....K', 'KYK.KYK', '.KYYYK.', 'KYEYEYK', '.KYYYK.', '..K.K..'], PP({ Y: '#ffe94a' })),
  sNecro: makeSprite(['.KKKKK.', 'KWWWWWK', 'KWEWEWK', '.KWWWK.', 'KWKWKWK', '.K.W.K.', '..K.K..'], PP({ W: '#e8e2d0', E: '#6dff8a' })),
  sSage: makeSprite(['...K...', '..KPK..', 'KKPWPKK', 'KPWWWPK', 'KKPWPKK', '..KPK..', '...K...'], PP({ P: '#ff9bf2' })),
  sDruid: makeSprite(['.GK.KG.', 'GGGKGGG', '.KGGGK.', '..KGK..', '.KBBBK.', '.KBBBK.', '..KKK..'], PP({ G: '#6ae04a', B: '#8a5a2b' })),
  sChrono: makeSprite(['.K.K.K.', 'KKTTTKK', '.TWTWT.', 'KTTWTTK', '.TWTWT.', 'KKTTTKK', '.K.K.K.'], PP({ T: '#41e8d6', W: '#ffffff' })),
  sSummoner: makeSprite(['.K...K.', 'KRKKKRK', 'KRRRRRK', 'KRYRYRK', '.KRORK.', 'KRRRRRK', '.K.K.K.'], PP({ R: '#d8382a', Y: '#ffe14a', O: '#ff9a3a' }))
};

// ---------- hero sprites ----------
const HERO_SPR = {};
for (const id in HERO_ART) HERO_SPR[id] = makeSprite(HERO_ART[id].t, PP(HERO_ART[id].p));

// ---------- Earth (rotating, pre-rendered) ----------
const EARTH_R = 22;
const EARTH_FRAMES = [];
function buildEarth() {
  const R = EARTH_R, S = R * 2 + 4, N = 16;
  for (let f = 0; f < N; f++) {
    const c = mk(S, S), x = c.getContext('2d'), img = x.createImageData(S, S);
    const rot = f / N * Math.PI * 2;
    for (let py = 0; py < S; py++) for (let px = 0; px < S; px++) {
      const dx = px - S / 2 + 0.5, dy = py - S / 2 + 0.5, d2 = dx * dx + dy * dy;
      if (d2 > R * R) continue;
      const z = Math.sqrt(R * R - d2), lon = Math.atan2(dx, z) + rot, lat = Math.asin(dy / R);
      const n = Math.sin(lon * 2 + Math.sin(lat * 3) * 1.6) + Math.sin(lat * 4 + lon * 1.5) * 0.8 + Math.sin(lon * 5 - lat * 2.5) * 0.45;
      let col;
      if (Math.abs(lat) > 1.17) col = [236, 244, 255];
      else if (n > 0.55) col = n > 1.3 ? [86, 140, 62] : [58, 170, 78];
      else col = n < -0.9 ? [24, 70, 170] : [38, 108, 214];
      let l = (-dx * 0.5 - dy * 0.55 + z * 0.75) / R; l = Math.max(0, Math.min(1, l));
      const q = l > 0.72 ? 1.12 : l > 0.45 ? 0.92 : l > 0.2 ? 0.7 : 0.5;
      const i = (py * S + px) * 4;
      img.data[i] = Math.min(255, col[0] * q); img.data[i + 1] = Math.min(255, col[1] * q); img.data[i + 2] = Math.min(255, col[2] * q * 1.05); img.data[i + 3] = 255;
      // outline
      if (d2 > (R - 1.3) * (R - 1.3)) { img.data[i] = 20; img.data[i + 1] = 28; img.data[i + 2] = 70; }
    }
    x.putImageData(img, 0, 0);
    EARTH_FRAMES.push(c);
  }
}

// ---------- background ----------
let BG = null, STARS = [];
function hash2(x, y) { let h = x * 374761393 + y * 668265263; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y) { return vnoise(x, y) * 0.55 + vnoise(x * 2.1, y * 2.1) * 0.3 + vnoise(x * 4.3, y * 4.3) * 0.15; }
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function buildBG(W, H) {
  const c = mk(W, H), x = c.getContext('2d'), img = x.createImageData(W, H);
  const cols = [[9, 6, 26], [18, 11, 48], [30, 16, 78], [52, 22, 98], [84, 34, 118]];
  for (let y = 0; y < H; y++) for (let px = 0; px < W; px++) {
    let v = fbm(px / 70 + 3, y / 70 + 7) * 1.25 - 0.28;
    const v2 = fbm(px / 90 + 40, y / 60 + 11);
    v += Math.max(0, v2 - 0.5) * 0.5;
    const t = (BAYER[(y & 3) * 4 + (px & 3)] + 0.5) / 16;
    let lv = Math.floor(Math.max(0, Math.min(4, v * 4.6 + t - 0.5)));
    const col = cols[lv], i = (y * W + px) * 4;
    img.data[i] = col[0]; img.data[i + 1] = col[1]; img.data[i + 2] = col[2]; img.data[i + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  // static stars
  let s = 12345; const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  for (let i = 0; i < 160; i++) {
    const a = rnd(), px = Math.floor(rnd() * W), py = Math.floor(rnd() * H);
    x.fillStyle = a > 0.9 ? '#ffffff' : a > 0.5 ? '#b9b2e8' : '#6a5fa0';
    x.fillRect(px, py, 1, 1);
  }
  // distant pixel moon + ringed planet
  const moon = makeSprite([
    '..KKKK..', '.KMMMLK.', 'KMMDMMLK', 'KMMMMMMK', 'KMDMMDMK', 'KMMMMMMK', '.KMMMMK.', '..KKKK..'
  ], PP({ M: '#6c6a8a', L: '#9c9ac0', D: '#4e4c6c' }));
  x.globalAlpha = 0.9; x.drawImage(moon.c, 24, 34, 16, 16); x.globalAlpha = 1;
  STARS = [];
  for (let i = 0; i < 36; i++) STARS.push({ x: Math.floor(rnd() * W), y: Math.floor(rnd() * H), p: rnd() * 6.28, s: 0.5 + rnd() * 2 });
  BG = c;
}

// ---------- glow cache ----------
const GLOW = {};
function glow(color, r) {
  const k = color + r; if (GLOW[k]) return GLOW[k];
  const c = mk(r * 2 + 1, r * 2 + 1), x = c.getContext('2d');
  x.fillStyle = color;
  for (let py = 0; py < c.height; py++) for (let px = 0; px < c.width; px++) {
    const d = Math.hypot(px - r, py - r) / r; if (d >= 1) continue;
    const a = Math.floor((1 - d) * (1 - d) * 5) / 5 * 0.9; if (a <= 0) continue;
    x.globalAlpha = a; x.fillRect(px, py, 1, 1);
  }
  return (GLOW[k] = c);
}

// ---------- 3x5 pixel digits ----------
const FONT = {
  '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001',
  '5': '111100111001111', '6': '111100111101111', '7': '111001001010010', '8': '111101111101111', '9': '111101111001111',
  '+': '000010111010000', '-': '000000111000000', '.': '000000000000010', '!': '010010010000010', 'K': '101101110101101', 'M': '101111111101101'
};
const TXT = {};
function pixText(str, color, scale) {
  const k = str + color + scale; if (TXT[k]) return TXT[k];
  const w = str.length * 4 - 1, c = mk(w * scale + 2, 5 * scale + 2), x = c.getContext('2d');
  [[0, 1, '#000'], [2, 1, '#000'], [1, 0, '#000'], [1, 2, '#000'], [1, 1, color]].forEach(([ox, oy, col]) => {
    x.fillStyle = col;
    for (let i = 0; i < str.length; i++) {
      const g = FONT[str[i]]; if (!g) continue;
      for (let j = 0; j < 15; j++) if (g[j] === '1') x.fillRect(ox + (i * 4 + (j % 3)) * scale, oy + Math.floor(j / 3) * scale, scale, scale);
    }
  });
  if (Object.keys(TXT).length > 600) for (const kk in TXT) delete TXT[kk];
  return (TXT[k] = c);
}
function fmt(n) { n = Math.round(n); return n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e4 ? Math.round(n / 1000) + 'K' : String(n); }

// ---------- pixel primitives ----------
function pline(ctx, x0, y0, x1, y1) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy, n = 0;
  while (n++ < 700) {
    ctx.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}
function pring(ctx, cx, cy, r) {
  cx = Math.round(cx); cy = Math.round(cy); r = Math.round(r);
  if (r < 1) return;
  let x = r, y = 0, err = 1 - r;
  while (x >= y) {
    ctx.fillRect(cx + x, cy + y, 1, 1); ctx.fillRect(cx - x, cy + y, 1, 1); ctx.fillRect(cx + x, cy - y, 1, 1); ctx.fillRect(cx - x, cy - y, 1, 1);
    ctx.fillRect(cx + y, cy + x, 1, 1); ctx.fillRect(cx - y, cy + x, 1, 1); ctx.fillRect(cx + y, cy - x, 1, 1); ctx.fillRect(cx - y, cy - x, 1, 1);
    y++;
    if (err < 0) err += 2 * y + 1; else { x--; err += 2 * (y - x) + 1; }
  }
}
function pdisc(ctx, cx, cy, r) {
  cx = Math.round(cx); cy = Math.round(cy); r = Math.round(r);
  for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y + 0.5)); ctx.fillRect(cx - w, cy + y, w * 2 + 1, 1); }
}
