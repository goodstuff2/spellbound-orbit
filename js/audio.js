'use strict';
// ---------- synthesized audio (no files) ----------
const SND = (() => {
  let ctx = null, master, sfxBus, musBus, comp, noiseBuf;
  let sfxOn = true, musOn = true;
  const last = {};
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { return; }
    comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 6;
    master = ctx.createGain(); master.gain.value = 0.7;
    sfxBus = ctx.createGain(); sfxBus.gain.value = sfxOn ? 0.8 : 0;
    musBus = ctx.createGain(); musBus.gain.value = musOn ? 0.28 : 0;
    sfxBus.connect(master); musBus.connect(master); master.connect(comp); comp.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  function tone(f, dur, type = 'square', vol = 0.1, slide = 0, delay = 0, bus) {
    if (!ctx) return;
    const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus || sfxBus); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol = 0.2, freq = 1200, delay = 0, type = 'lowpass', sweep = 0) {
    if (!ctx) return;
    const t = ctx.currentTime + delay, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; s.loop = true; f.type = type; f.frequency.setValueAtTime(freq, t);
    if (sweep) f.frequency.exponentialRampToValueAtTime(Math.max(40, freq + sweep), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(sfxBus); s.start(t); s.stop(t + dur + 0.02);
  }
  function gate(name, gap) {
    if (!ctx || !sfxOn) return false;
    const n = performance.now(); if (last[name] && n - last[name] < gap) return false; last[name] = n; return true;
  }
  const S = {
    fire() { if (gate('fire', 70)) { tone(300, 0.12, 'sawtooth', 0.05, -160); noise(0.08, 0.05, 2200); } },
    frost() { if (gate('frost', 70)) { tone(1200, 0.1, 'triangle', 0.06, -500); tone(1800, 0.06, 'sine', 0.03, -700, 0.02); } },
    zap() { if (gate('zap', 70)) { tone(900, 0.09, 'sawtooth', 0.05, -700); noise(0.07, 0.06, 4000, 0, 'highpass'); } },
    skull() { if (gate('skull', 80)) { tone(180, 0.15, 'square', 0.05, 120); tone(260, 0.1, 'triangle', 0.04, -100, 0.05); } },
    thorn() { if (gate('thorn', 60)) tone(700, 0.05, 'square', 0.035, -200); },
    arcane() { if (gate('arcane', 80)) { tone(520, 0.16, 'sine', 0.07, 600); tone(780, 0.12, 'triangle', 0.04, 500); } },
    flame() { if (gate('flame', 60)) noise(0.12, 0.06, 1800, 0, 'bandpass', -900); },
    chrono() { if (gate('chrono', 90)) { tone(660, 0.12, 'sine', 0.06, -330); tone(330, 0.12, 'sine', 0.05, 330, 0.06); } },
    hit() { if (gate('hit', 45)) tone(160 + Math.random() * 60, 0.05, 'square', 0.04, -60); },
    pop() { if (gate('pop', 40)) { noise(0.14, 0.12, 1500, 0, 'lowpass', -1000); tone(140, 0.12, 'square', 0.05, -80); } },
    boom() { if (gate('boom', 50)) { noise(0.35, 0.28, 900, 0, 'lowpass', -700); tone(90, 0.3, 'sawtooth', 0.12, -50); } },
    bigboom() { if (!ctx || !sfxOn) return; noise(0.9, 0.4, 700, 0, 'lowpass', -600); tone(60, 0.8, 'sawtooth', 0.2, -30); tone(120, 0.5, 'square', 0.08, -90); },
    gold() { if (gate('gold', 55)) { tone(1320, 0.07, 'square', 0.04); tone(1760, 0.09, 'square', 0.04, 0, 0.05); } },
    earthHit() { if (gate('eh', 120)) { noise(0.3, 0.3, 500, 0, 'lowpass', -300); tone(70, 0.3, 'sawtooth', 0.14, -30); } },
    click() { if (gate('click', 30)) tone(880, 0.05, 'square', 0.05); },
    deny() { tone(150, 0.15, 'square', 0.08, -50); },
    buy() { tone(660, 0.06, 'square', 0.06); tone(990, 0.06, 'square', 0.06, 0, 0.06); tone(1320, 0.1, 'square', 0.06, 0, 0.12); },
    card() { tone(523, 0.1, 'triangle', 0.08); tone(659, 0.1, 'triangle', 0.08, 0, 0.09); tone(784, 0.1, 'triangle', 0.08, 0, 0.18); tone(1047, 0.25, 'triangle', 0.08, 0, 0.27); },
    wave() { tone(220, 0.35, 'sawtooth', 0.09, 0); tone(330, 0.35, 'sawtooth', 0.08, 0, 0.18); tone(440, 0.5, 'sawtooth', 0.08, 0, 0.36); },
    boss() { noise(1.4, 0.3, 300, 0, 'lowpass', 200); tone(55, 1.3, 'sawtooth', 0.2, 20); tone(58, 1.3, 'square', 0.1, 10); },
    clear() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'square', 0.07, 0, i * 0.1)); },
    meteor() { if (gate('met', 60)) { noise(0.25, 0.12, 3000, 0, 'bandpass', -2000); } },
    thunder() { if (gate('thu', 60)) { noise(0.22, 0.25, 6000, 0, 'highpass'); tone(110, 0.2, 'sawtooth', 0.1, -60); } },
    spell() { tone(330, 0.3, 'triangle', 0.1, 660); tone(660, 0.3, 'sine', 0.08, 660, 0.05); },
    holy() { [523, 659, 784].forEach((f, i) => tone(f, 0.6, 'sine', 0.09, 0, i * 0.04)); },
    hole() { tone(220, 1.5, 'sawtooth', 0.12, -180); tone(110, 1.5, 'sine', 0.14, -60); },
    roar() { noise(0.8, 0.3, 400, 0, 'lowpass', 400); tone(80, 0.7, 'sawtooth', 0.18, 90); },
    timestop() { tone(880, 0.8, 'sine', 0.1, -800); tone(440, 0.8, 'triangle', 0.08, -400, 0.1); },
    ult() { tone(110, 1.2, 'sawtooth', 0.16, 880); tone(220, 1.2, 'square', 0.08, 1100); },
    ultboom() { noise(1.6, 0.5, 1500, 0, 'lowpass', -1300); tone(50, 1.6, 'sawtooth', 0.3, -20); [523, 784, 1047, 1568].forEach((f, i) => tone(f, 0.9, 'triangle', 0.1, 0, i * 0.05)); },
    over() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.4, 'sawtooth', 0.1, 0, i * 0.25)); },
    win() { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, 0.25, 'square', 0.08, 0, i * 0.13)); }
  };

  // ----- music -----
  const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);
  const PROG = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]; // Am F C G
  let step = 0, nextT = 0, timer = null, intensity = 0;
  function sched() {
    if (!ctx) return;
    const spb = intensity ? 60 / 150 / 2 : 60 / 108 / 2;
    while (nextT < ctx.currentTime + 0.25) {
      if (nextT < ctx.currentTime) nextT = ctx.currentTime + 0.02;
      const bar = Math.floor(step / 8) % 4, pos = step % 8, ch = PROG[bar];
      const dl = nextT - ctx.currentTime;
      const arp = [0, 1, 2, 1, 0, 1, 2, 1][pos];
      tone(NOTE(ch[arp] + 12), spb * 1.6, 'triangle', 0.1, 0, dl, musBus);
      if (pos === 0) tone(NOTE(ch[0] - 12), spb * 6, 'sine', 0.22, 0, dl, musBus);
      if (pos === 4) tone(NOTE(ch[0] - 12), spb * 3, 'sine', 0.16, 0, dl, musBus);
      if (intensity) {
        if (pos % 2 === 0) tone(NOTE(ch[arp] + 24), spb * 0.9, 'square', 0.04, 0, dl, musBus);
        tone(NOTE(ch[0] - 24), spb * 0.9, 'sawtooth', 0.05, 0, dl, musBus);
      } else if (pos === 0 && bar % 2 === 0) {
        tone(NOTE(ch[2] + 12), spb * 6, 'sine', 0.06, 0, dl, musBus);
      }
      nextT += spb; step++;
    }
  }
  return {
    init, S,
    startMusic() { init(); if (!ctx || timer) return; nextT = ctx.currentTime + 0.1; timer = setInterval(sched, 90); },
    stopMusic() { clearInterval(timer); timer = null; },
    setIntensity(v) { intensity = v; },
    setSfx(on) { sfxOn = on; if (sfxBus) sfxBus.gain.value = on ? 0.8 : 0; },
    setMusic(on) { musOn = on; if (musBus) musBus.gain.value = on ? 0.28 : 0; },
    get sfxOn() { return sfxOn; }, get musOn() { return musOn; }
  };
})();
const sfx = (n) => { const f = SND.S[n]; if (f) f(); };
