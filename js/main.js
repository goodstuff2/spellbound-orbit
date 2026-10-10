'use strict';
// ================= MAIN LOOP =================
buildEarth(); buildBG(W, H);
SND.setSfx(SAVE.sfx); SND.setMusic(SAVE.music);
G.t = 0;
let menuT = 0, lastT = performance.now(), acc = 0;
const STEP = 1 / 60;
UI.title();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.max(0, Math.min(0.1, (now - lastT) / 1000)); lastT = now;
  if (G.on) {
    if (!G.paused) {
      acc += dt * G.speed; let n = 0;
      while (acc >= STEP && n < 8) { update(STEP); acc -= STEP; n++; }
      if (n >= 8) acc = 0;
    }
    render(G.t); UI.hud();
  } else {
    menuT += dt; updFx(dt); render(menuT);
  }
}
requestAnimationFrame(frame);
