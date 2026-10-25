/* Стимпанк-город: закатное небо, дирижабли, часовая башня с шестернями, дымящие трубы, пар, фонарь, латунный парапет.
 * Два варианта: buildNight (вечер/ночь) и buildDay (день); выбор по env.variant. */
(function () {
  function buildNight(env) {
  const { W, H, Y, Ys, U, limit, px } = env;
  const { C, Layer, Overlay, mulberry32, randint, pick, gradient, addGlow, sunDisc, makeStars, drawStars, cloudRow, drawCloudRows,
    glowPulse, smokeColumn, gear, outward, bay, clamp, tri } = px;
  const r = mulberry32(97), xc = W / 2, TP = 2 * Math.PI;
  const sc = clamp(W / 128, .7, 1);
  const sunX = U(29), sunY = Y(124);

  /* ---------- небо и солнце за домами ---------- */
  const sky = new Layer(W, H);
  gradient(sky, ['#100c2c', '#1a1240', '#2a1a4c', '#40244e', '#5c2e50', '#86443e', '#c8683a', '#f09440', '#ffb858'], 0, Y(130));
  addGlow(sky, sunX, sunY, 8, 46, '#ffa840', .65, 5, 1.5);
  sunDisc(sky, sunX, sunY, [[9, '#ffc060'], [7, '#ffd880']]);
  const skyC = sky.canvas();
  const stars = makeStars(r, Math.round(46 * W / 128), W, Y(68));
  const strips = [cloudRow({ sizes: [[34, 4], [32, 4], [36, 4]], seed: 5, cols: ['#b8704a', '#f0b068', '#7a4a58'], y: Ys(20), v: .14, gap: 88, off: 12 })];

  /* ---------- дирижабли ---------- */
  function airship(w, h, body, lit, shade, stripe, gond, win) {
    const L = new Layer(w + 16, h + 10), x0 = 12, x1 = x0 + w;
    L.ellipseBox(x0, 0, x1, h, body);
    for (let y = 0; y <= h; y++) for (let x = x0; x <= x1; x++) if (L.has(x, y)) { if (y < h * .28) L.px(x, y, lit); else if (y > h * .76) L.px(x, y, shade); }
    L.hline(x0 + 3, x1 - 3, Math.round(h * .56), stripe);
    L.poly([[0, Math.round(h * .08)], [x0 + 3, Math.round(h * .3)], [x0 + 3, Math.round(h * .72)], [Math.round(h * .3), Math.round(h * 1.0)]], shade);
    L.poly([[2, Math.round(h * .1)], [x0 + 3, Math.round(h * .32)], [x0 + 3, Math.round(h * .5)]], lit);
    const gx = x0 + Math.round(w * .42), gw = Math.max(6, Math.round(w * .24));
    L.rect(gx, h + 1, gx + gw, h + 4, gond); for (let k = 0; k < 3; k++) L.px(gx + 1 + k * 2, h + 2, win);
    return L.canvas();
  }
  const shipBig = airship(46, 17, '#b8643c', '#d88a50', '#8a4a38', '#f0b068', '#2a1828', '#f8c060');
  const shipFar = airship(28, 9, '#6a3c4c', '#7a4a58', '#4a2a44', '#8a5460', '#2a1828', '#a07050');
  const ships = [
    { c: shipBig, y: Ys(34), v: .42, x0: r() * (W + 120), m: 70 },
    { c: shipFar, y: Ys(78), v: .2, x0: r() * (W + 100), m: 50 },
    { c: shipFar, y: Ys(52), v: .14, x0: r() * (W + 100), m: 50 },
  ];

  /* ---------- дома, трубы, окна ---------- */
  const wins = [], chim = [];
  const WC = ['#f8b038', '#ffd060', '#e87828'];
  function building(L, x, w, top, base, body, edge, bright, rg) {
    L.rect(x, top, x + w, base, body); L.vline(x, top, base, edge); L.hline(x, x + w, top, edge);
    const cols = Math.max(1, Math.floor((w - 3) / 5)), rows = Math.floor((base - top - 8) / 8);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const wx = x + 3 + i * 5, wy = top + 5 + j * 8, c = pick(rg, WC), q = rg();
      if (!bright) { if (q < .3) L.rect(wx, wy, wx + 1, wy + 1, '#6a3c48'); continue; }
      if (q < .5) L.rect(wx, wy, wx + 2, wy + 2, c);
      else if (q < .66) wins.push([wx, wy, 3, 3, c, pick(rg, [60, 90, 150]), randint(rg, 0, 150)]);
    }
    if (bright) {
      L.vline(x + w - 2, top, base, '#a87a38'); for (let y = top + 6; y < base; y += 10) L.px(x + w - 2, y, '#e0b058');
      if (rg() < .55) { const hh = randint(rg, 9, 20); L.rect(x + 3, top - hh, x + 5, top, body); L.hline(x + 2, x + 6, top - hh, edge); chim.push([x + 4, top - hh, rg()]); }
    }
  }
  const city = new Layer(W, H), rg = mulberry32(12);
  for (let x = -6; x < W + 6;) {                                              // дальний рваный горизонт
    const w = randint(rg, 4, 10), h = randint(rg, 8, 26);
    city.rect(x, Y(150) - h, x + w, Y(160), '#5a3050'); if (rg() < .4) city.rect(x + 1, Y(150) - h - 6, x + 1, Y(150) - h, '#5a3050');
    x += w + randint(rg, 0, 2);
  }
  const back = new Layer(W, H);
  for (let x = -10; x < W + 6;) { const w = randint(rg, 12, 22), top = Y(randint(rg, 128, 146)); building(back, x, w, top, Y(190), '#3a2040', '#583650', false, rg); x += w + randint(rg, 0, 3); }
  const front = new Layer(W, H);
  const towerX = Math.round(U(-22)), gx1 = Math.round(U(30)), gx2 = Math.round(U(43)), lampX = Math.round(U(-42)), steamX = Math.round(U(6));
  for (let x = -8; x < W + 6;) {
    const w = randint(rg, 14, 24), top = Y(randint(rg, 112, 142));
    building(front, x, w, top, Y(190), '#241428', '#3e2438', true, rg); x += w + randint(rg, 0, 3);
  }
  // башня с часами рисуется поверх домов
  const tw = new Layer(W, H), cy = Y(92);
  tw.rect(towerX - 13, Y(76), towerX + 13, Y(188), '#2e1a34'); tw.vline(towerX - 13, Y(76), Y(188), '#52324a'); tw.vline(towerX + 13, Y(76), Y(188), '#1c1020');
  tw.poly([[towerX - 15, Y(76)], [towerX + 15, Y(76)], [towerX, Y(54)]], '#3a2038'); tw.poly([[towerX - 15, Y(76)], [towerX, Y(76)], [towerX, Y(54)]], '#4c2c48');
  tw.line(towerX - 15, Y(76), towerX, Y(54), '#7a4a58'); tw.vline(towerX, Y(54) - 7, Y(54), '#c08a40');
  for (const yy of [Y(110), Y(138), Y(166)]) { tw.rect(towerX - 14, yy, towerX + 14, yy + 2, '#e0a040'); tw.hline(towerX - 14, towerX + 14, yy, '#ffd070'); }
  tw.disc(towerX, cy, 10, '#e0a040'); tw.disc(towerX, cy, 8, '#f0e4c0'); tw.disc(towerX, cy, 7, '#e8d8b0');
  for (let k = 0; k < 12; k++) { const a = TP * k / 12; tw.px(Math.round(towerX + 6 * Math.sin(a)), Math.round(cy - 6 * Math.cos(a)), '#2a1828'); }
  tw.disc(towerX, cy, 1, '#2a1828');
  for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) if (r() < .7) {
    const wx = towerX - 10 + i * 6, wy = Y(142) + j * 8; if (wy > Y(164)) continue;
    const c = pick(r, WC); if (r() < .75) tw.rect(wx, wy, wx + 2, wy + 3, c); else wins.push([wx, wy, 3, 4, c, 90, randint(r, 0, 90)]);
  }
  for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) if (r() < .65) { const wx = towerX - 10 + i * 6, wy = Y(170) + j * 6; if (wy < Y(186)) tw.rect(wx, wy, wx + 2, wy + 2, pick(r, WC)); }
  const cityC = city.canvas(), backC = back.canvas(), frontC = front.canvas(), twC = tw.canvas();

  /* ---------- шестерни, манометр, фонарь, парапет ---------- */
  const gears = [
    { x: towerX, y: Y(126), r: 9, t: 10, dir: 1, col: '#b07a30', hi: '#e0a848' },
    { x: towerX + 6, y: Y(141), r: 6, t: 8, dir: -1, col: '#a06a28', hi: '#d09838' },
    { x: gx1, y: Y(148), r: 12, t: 12, dir: 1, col: '#b07a30', hi: '#e0a848' },
    { x: gx2, y: Y(136), r: 8, t: 9, dir: -1, col: '#a06a28', hi: '#d09838' },
  ];
  const rx = mulberry32(29);
  for (const d of [-1, 1]) for (const u of outward(d * 58, d, limit, 36, 64, rx)) { const rr = randint(rx, 6, 10); gears.push({ x: Math.round(U(u)), y: Y(randint(rx, 132, 160)), r: rr, t: rr + 2, dir: rx() < .5 ? 1 : -1, col: '#a06a28', hi: '#d09838' }); }
  gears.forEach(g => { g.c = g.r + 5; g.spr = new Layer(2 * g.c + 1, 2 * g.c + 1); g.sp = TP / (g.t * 36); });
  const gaugeX = gx1, gaugeY = Y(172);
  const gauge = new Layer(17, 17);
  gauge.disc(8, 8, 7, '#c08a40'); gauge.disc(8, 8, 6, '#f0e4c0'); for (let k = 0; k < 8; k++) { const a = TP * k / 8; gauge.px(Math.round(8 + 4.5 * Math.sin(a)), Math.round(8 - 4.5 * Math.cos(a)), '#7a4a38'); }
  const gaugeBase = gauge.canvas(), needle = new Layer(17, 17);
  const handL = new Layer(23, 23), hx = towerX, hy = cy;
  const fgL = new Layer(W, H);
  fgL.rect(0, Y(184), W, H, '#1c1020'); fgL.rect(0, Y(184), W, Y(186), '#e0a040'); fgL.hline(0, W, Y(184), '#ffd070'); fgL.hline(0, W, Y(186) + 1, '#8a5a28');
  for (let x = 6; x < W; x += 22) { fgL.rect(x, Y(182), x + 3, Y(197), '#c88a30'); fgL.vline(x, Y(182), Y(197), '#f0b858'); fgL.rect(x - 1, Y(182), x + 4, Y(183), '#e0a040'); }
  fgL.rect(lampX, Y(133), lampX + 1, Y(184), '#1c1020'); fgL.rect(lampX - 3, Y(124), lampX + 4, Y(133), '#1c1020');
  fgL.rect(lampX - 2, Y(125), lampX + 3, Y(132), '#ffe0a0'); fgL.rect(lampX - 2, Y(125), lampX - 2, Y(132), '#ffc060'); fgL.poly([[lampX - 4, Y(124)], [lampX + 5, Y(124)], [lampX, Y(119)]], '#1c1020');
  const fgC = fgL.canvas();
  const ov = new Overlay(W, H);
  const smokes = chim.map(c => ({ x: c[0], y: c[1] - 1, ph: Math.floor(c[2] * 150), per: 140 + Math.floor(c[2] * 40) }));
  const tmpCols = ['#6a4268', '#523250', '#3e2440'];

  return {
    draw(ctx, f) {
      ctx.drawImage(skyC, 0, 0);
      drawStars(ctx, stars, f);
      drawCloudRows(ctx, strips, f, W);
      for (const s of ships) { const P = W + 2 * s.m, x = Math.floor(((s.x0 + s.v * f) % P + P) % P) - s.m; ctx.drawImage(s.c, x, s.y); }
      ctx.drawImage(cityC, 0, 0);
      ctx.drawImage(backC, 0, 0);
      ctx.drawImage(frontC, 0, 0);
      for (const sm of smokes) smokeColumn(ctx, sm.x, sm.y, f + sm.ph, { n: 5, rise: 42, per: sm.per, sway: 2, r0: 1, r1: 4.5, wind: 12, cols: tmpCols });
      ctx.drawImage(twC, 0, 0);
      for (const [x, y, w, h, c, per, ph] of wins) if (tri(f, per, ph) > .14) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
      // шарик на шпиле башни мигает
      if (tri(f, 80, 0) > .6) { ctx.fillStyle = '#ffd870'; ctx.fillRect(towerX - 1, Y(54) - 10, 3, 3); ctx.fillStyle = '#fff0b0'; ctx.fillRect(towerX, Y(54) - 9, 1, 1); }
      else { ctx.fillStyle = '#c08a40'; ctx.fillRect(towerX - 1, Y(54) - 9, 2, 2); }
      // стрелки часов
      handL.clear();
      const am = TP * f / 600 - Math.PI / 2, ah = TP * f / 7200 - Math.PI / 2;
      handL.line(11, 11, Math.round(11 + 6 * Math.cos(am)), Math.round(11 + 6 * Math.sin(am)), '#2a1828');
      handL.line(11, 11, Math.round(11 + 4 * Math.cos(ah)), Math.round(11 + 4 * Math.sin(ah)), '#2a1828');
      handL.draw(ctx, hx - 11, hy - 11);
      for (const g of gears) {
        g.spr.clear(); gear(g.spr, g.c, g.c, g.r, g.t, g.dir * g.sp * f, g.col, { hi: g.hi, hub: '#e0b058', spokes: 6 }); g.spr.draw(ctx, g.x - g.c, g.y - g.c);
      }
      // манометр: стрелка качается
      ctx.drawImage(gaugeBase, gaugeX - 8, gaugeY - 8);
      needle.clear(); const na = -2.3 + 1.6 * (.5 + .5 * Math.sin(TP * f / 90));
      needle.line(8, 8, Math.round(8 + 5 * Math.sin(na)), Math.round(8 - 5 * Math.cos(na)), '#d02828'); needle.draw(ctx, gaugeX - 8, gaugeY - 8);
      // пар из клапана
      smokeColumn(ctx, steamX, Y(178), f, { n: 5, rise: 26, per: 70, sway: 1.5, r0: 1, r1: 3.5, wind: 2, cols: ['#f0e4dc', '#c8b8b0', '#8a7a82'] });
      ctx.drawImage(fgC, 0, 0);
      glowPulse(ov, lampX, Y(128), 15, '#ffa840', f, { per: 80, strength: .6, lo: .6 });
      ov.flush(ctx, Math.max(0, lampX - 17), Y(110), Math.min(W, lampX + 18), Y(148));
    },
  };
}
/* ===== DAY ===== */
  function buildDay(env) {
    const { W, H, Y, Ys, U, limit, px } = env;
    const { Layer, Overlay, mulberry32, randint, pick, gradient, addGlow, sunDisc, cloudRow, drawCloudRows,
      smokeColumn, gear, outward, drawBird, bay, clamp, tri } = px;
    const r = mulberry32(97), xc = W / 2, TP = 2 * Math.PI;
    const sunX = U(29), sunY = Ys(46);

    /* ---------- небо: тёплая золотистая дымка ---------- */
    const sky = new Layer(W, H);
    gradient(sky, ['#6c92bc', '#8aa8c4', '#aebcc0', '#d0c8a8', '#ecd2a0', '#f8dc98', '#fce4aa'], 0, Y(130));
    addGlow(sky, sunX, sunY, 8, 70, '#fff0c0', .75, 5, 1.5);
    addGlow(sky, sunX, sunY, 8, 120, '#ffe8b0', .3, 4, 1.8);
    sunDisc(sky, sunX, sunY, [[8, '#fff0b8'], [6, '#fff8dc'], [4, '#ffffff']]);
    const skyC = sky.canvas();
    const strips = [
      cloudRow({ sizes: [[44, 9], [36, 8], [48, 10]], seed: 5, cols: ['#f6ecdc', '#c8b494', '#fff8ec'], y: Ys(18), v: .16, gap: 100, off: 12 }),
      cloudRow({ sizes: [[34, 7], [40, 8]], seed: 14, cols: ['#f2e6d2', '#c4ae90', '#fff8ec'], y: Ys(64), v: .22, gap: 110, off: 50 }),
    ];
    const pigeons = [[.34, Ys(40), 0], [.28, Ys(56), 3], [.4, Ys(48), 5]].map(([v, y, i]) => ({ v, y, i, x0: r() * (W + 60) }));

    /* ---------- дирижабли ---------- */
    function airship(w, h, body, lit, shade, stripe, gond, win) {
      const L = new Layer(w + 16, h + 10), x0 = 12, x1 = x0 + w;
      L.ellipseBox(x0, 0, x1, h, body);
      for (let y = 0; y <= h; y++) for (let x = x0; x <= x1; x++) if (L.has(x, y)) { if (y < h * .28) L.px(x, y, lit); else if (y > h * .76) L.px(x, y, shade); }
      L.hline(x0 + 3, x1 - 3, Math.round(h * .56), stripe);
      L.poly([[0, Math.round(h * .08)], [x0 + 3, Math.round(h * .3)], [x0 + 3, Math.round(h * .72)], [Math.round(h * .3), Math.round(h * 1.0)]], shade);
      L.poly([[2, Math.round(h * .1)], [x0 + 3, Math.round(h * .32)], [x0 + 3, Math.round(h * .5)]], lit);
      const gx = x0 + Math.round(w * .42), gw = Math.max(6, Math.round(w * .24));
      L.rect(gx, h + 1, gx + gw, h + 4, gond); for (let k = 0; k < 3; k++) L.px(gx + 1 + k * 2, h + 2, win);
      return L.canvas();
    }
    const shipBig = airship(46, 17, '#c47446', '#e8a468', '#8a5038', '#f8dc98', '#4a3430', '#f8e0a0');
    const shipFar = airship(28, 9, '#a88468', '#bc9a7c', '#8a6a58', '#d8c098', '#5a4640', '#d8c098');
    const ships = [
      { c: shipBig, y: Ys(34), v: .42, x0: r() * (W + 120), m: 70 },
      { c: shipFar, y: Ys(78), v: .2, x0: r() * (W + 100), m: 50 },
      { c: shipFar, y: Ys(52), v: .14, x0: r() * (W + 100), m: 50 },
    ];

    /* ---------- дома, трубы, окна ---------- */
    const wins = [], chim = [];
    const WC = ['#8ab4d0', '#a8cce0', '#e8d8a0'];
    function building(L, x, w, top, base, body, edge, bright, rg) {
      L.rect(x, top, x + w, base, body); L.vline(x, top, base, edge); L.hline(x, x + w, top, edge);
      const cols = Math.max(1, Math.floor((w - 3) / 5)), rows = Math.floor((base - top - 8) / 8);
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const wx = x + 3 + i * 5, wy = top + 5 + j * 8, c = pick(rg, WC), q = rg();
        if (!bright) { if (q < .3) L.rect(wx, wy, wx + 1, wy + 1, '#b8c4c8'); continue; }
        if (q < .5) L.rect(wx, wy, wx + 2, wy + 2, c);
        else if (q < .66) wins.push([wx, wy, 3, 3, c, pick(rg, [60, 90, 150]), randint(rg, 0, 150)]);
      }
      if (bright) {
        L.vline(x + w - 2, top, base, '#d0a038'); for (let y = top + 6; y < base; y += 10) L.px(x + w - 2, y, '#ffe090');
        if (rg() < .55) { const hh = randint(rg, 9, 20); L.rect(x + 3, top - hh, x + 5, top, body); L.hline(x + 2, x + 6, top - hh, edge); chim.push([x + 4, top - hh, rg()]); }
      }
    }
    const city = new Layer(W, H), rg = mulberry32(12);
    for (let x = -6; x < W + 6;) {
      const w = randint(rg, 4, 10), h = randint(rg, 8, 26);
      city.rect(x, Y(150) - h, x + w, Y(160), '#c0a894'); if (rg() < .4) city.rect(x + 1, Y(150) - h - 6, x + 1, Y(150) - h, '#c0a894');
      x += w + randint(rg, 0, 2);
    }
    const back = new Layer(W, H);
    for (let x = -10; x < W + 6;) { const w = randint(rg, 12, 22), top = Y(randint(rg, 128, 146)); building(back, x, w, top, Y(190), '#9a8272', '#c0a48e', false, rg); x += w + randint(rg, 0, 3); }
    const front = new Layer(W, H);
    const towerX = Math.round(U(-22)), gx1 = Math.round(U(30)), gx2 = Math.round(U(43)), lampX = Math.round(U(-42)), steamX = Math.round(U(6));
    for (let x = -8; x < W + 6;) {
      const w = randint(rg, 14, 24), top = Y(randint(rg, 112, 142));
      building(front, x, w, top, Y(190), '#74544c', '#b08a72', true, rg); x += w + randint(rg, 0, 3);
    }
    const tw = new Layer(W, H), cy = Y(92);
    tw.rect(towerX - 13, Y(76), towerX + 13, Y(188), '#82605a'); tw.vline(towerX - 13, Y(76), Y(188), '#c8a284'); tw.vline(towerX + 13, Y(76), Y(188), '#52403a');
    tw.poly([[towerX - 15, Y(76)], [towerX + 15, Y(76)], [towerX, Y(54)]], '#5a8a74'); tw.poly([[towerX - 15, Y(76)], [towerX, Y(76)], [towerX, Y(54)]], '#78aa90');
    tw.line(towerX - 15, Y(76), towerX, Y(54), '#b0d8c0'); tw.vline(towerX, Y(54) - 7, Y(54), '#e0a840');
    for (const yy of [Y(110), Y(138), Y(166)]) { tw.rect(towerX - 14, yy, towerX + 14, yy + 2, '#e8b040'); tw.hline(towerX - 14, towerX + 14, yy, '#ffe090'); }
    tw.disc(towerX, cy, 10, '#e8b040'); tw.disc(towerX, cy, 8, '#f8f0d8'); tw.disc(towerX, cy, 7, '#f0e6c8');
    for (let k = 0; k < 12; k++) { const a = TP * k / 12; tw.px(Math.round(towerX + 6 * Math.sin(a)), Math.round(cy - 6 * Math.cos(a)), '#4a3430'); }
    tw.disc(towerX, cy, 1, '#4a3430');
    for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) if (r() < .7) {
      const wx = towerX - 10 + i * 6, wy = Y(142) + j * 8; if (wy > Y(164)) continue;
      const c = pick(r, WC); if (r() < .75) tw.rect(wx, wy, wx + 2, wy + 3, c); else wins.push([wx, wy, 3, 4, c, 90, randint(r, 0, 90)]);
    }
    for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) if (r() < .65) { const wx = towerX - 10 + i * 6, wy = Y(170) + j * 6; if (wy < Y(186)) tw.rect(wx, wy, wx + 2, wy + 2, pick(r, WC)); }
    const cityC = city.canvas(), backC = back.canvas(), frontC = front.canvas(), twC = tw.canvas();

    /* ---------- шестерни, манометр, фонарь, парапет ---------- */
    const gears = [
      { x: towerX, y: Y(126), r: 9, t: 10, dir: 1, col: '#d09a38', hi: '#ffe090' },
      { x: towerX + 6, y: Y(141), r: 6, t: 8, dir: -1, col: '#c08a30', hi: '#f0c868' },
      { x: gx1, y: Y(148), r: 12, t: 12, dir: 1, col: '#d09a38', hi: '#ffe090' },
      { x: gx2, y: Y(136), r: 8, t: 9, dir: -1, col: '#c08a30', hi: '#f0c868' },
    ];
    const rx = mulberry32(29);
    for (const d of [-1, 1]) for (const u of outward(d * 58, d, limit, 36, 64, rx)) { const rr = randint(rx, 6, 10); gears.push({ x: Math.round(U(u)), y: Y(randint(rx, 132, 160)), r: rr, t: rr + 2, dir: rx() < .5 ? 1 : -1, col: '#c08a30', hi: '#f0c868' }); }
    gears.forEach(g => { g.c = g.r + 5; g.spr = new Layer(2 * g.c + 1, 2 * g.c + 1); g.sp = TP / (g.t * 36); });
    const gaugeX = gx1, gaugeY = Y(172);
    const gauge = new Layer(17, 17);
    gauge.disc(8, 8, 7, '#e0a840'); gauge.disc(8, 8, 6, '#f8f0d8'); for (let k = 0; k < 8; k++) { const a = TP * k / 8; gauge.px(Math.round(8 + 4.5 * Math.sin(a)), Math.round(8 - 4.5 * Math.cos(a)), '#7a4a38'); }
    const gaugeBase = gauge.canvas(), needle = new Layer(17, 17);
    const handL = new Layer(23, 23), hx = towerX, hy = cy;
    const fgL = new Layer(W, H);
    fgL.rect(0, Y(184), W, H, '#4a3430'); fgL.rect(0, Y(184), W, Y(186), '#e8b040'); fgL.hline(0, W, Y(184), '#ffe090'); fgL.hline(0, W, Y(186) + 1, '#a87028');
    for (let x = 6; x < W; x += 22) { fgL.rect(x, Y(182), x + 3, Y(197), '#d09a38'); fgL.vline(x, Y(182), Y(197), '#ffd870'); fgL.rect(x - 1, Y(182), x + 4, Y(183), '#e8b040'); }
    fgL.rect(lampX, Y(133), lampX + 1, Y(184), '#3a2a28'); fgL.rect(lampX - 3, Y(124), lampX + 4, Y(133), '#3a2a28');
    fgL.rect(lampX - 2, Y(125), lampX + 3, Y(132), '#c8dce4'); fgL.rect(lampX - 2, Y(125), lampX - 2, Y(132), '#f0f8fc'); fgL.poly([[lampX - 4, Y(124)], [lampX + 5, Y(124)], [lampX, Y(119)]], '#3a2a28');
    const fgC = fgL.canvas();
    const smokes = chim.map(c => ({ x: c[0], y: c[1] - 1, ph: Math.floor(c[2] * 150), per: 140 + Math.floor(c[2] * 40) }));
    const smokeCols = ['#d4c4b4', '#b4a498', '#948480'];

    return {
      draw(ctx, f) {
        ctx.drawImage(skyC, 0, 0);
        drawCloudRows(ctx, strips, f, W);
        for (const b of pigeons) { const x = Math.floor(((b.x0 + b.v * f) % (W + 60) + W + 60) % (W + 60)) - 30; drawBird(ctx, x, b.y + Math.round(1.5 * Math.sin(f / 20 + b.i)), (((f >> 2) + b.i) & 1) === 1, '#4a3a38'); }
        for (const s of ships) { const P = W + 2 * s.m, x = Math.floor(((s.x0 + s.v * f) % P + P) % P) - s.m; ctx.drawImage(s.c, x, s.y); }
        ctx.drawImage(cityC, 0, 0);
        ctx.drawImage(backC, 0, 0);
        ctx.drawImage(frontC, 0, 0);
        for (const sm of smokes) smokeColumn(ctx, sm.x, sm.y, f + sm.ph, { n: 5, rise: 42, per: sm.per, sway: 2, r0: 1, r1: 4.5, wind: 12, cols: smokeCols });
        ctx.drawImage(twC, 0, 0);
        for (const [x, y, w, h, c, per, ph] of wins) { ctx.fillStyle = tri(f, per, ph) > .93 ? '#ffffff' : c; ctx.fillRect(x, y, w, h); }
        if (tri(f, 80, 0) > .6) { ctx.fillStyle = '#ffe890'; ctx.fillRect(towerX - 1, Y(54) - 10, 3, 3); ctx.fillStyle = '#ffffff'; ctx.fillRect(towerX, Y(54) - 9, 1, 1); }
        else { ctx.fillStyle = '#e0a840'; ctx.fillRect(towerX - 1, Y(54) - 9, 2, 2); }
        handL.clear();
        const am = TP * f / 600 - Math.PI / 2, ah = TP * f / 7200 - Math.PI / 2;
        handL.line(11, 11, Math.round(11 + 6 * Math.cos(am)), Math.round(11 + 6 * Math.sin(am)), '#3a2a28');
        handL.line(11, 11, Math.round(11 + 4 * Math.cos(ah)), Math.round(11 + 4 * Math.sin(ah)), '#3a2a28');
        handL.draw(ctx, hx - 11, hy - 11);
        for (const g of gears) { g.spr.clear(); gear(g.spr, g.c, g.c, g.r, g.t, g.dir * g.sp * f, g.col, { hi: g.hi, hub: '#ffe090', spokes: 6 }); g.spr.draw(ctx, g.x - g.c, g.y - g.c); }
        ctx.drawImage(gaugeBase, gaugeX - 8, gaugeY - 8);
        needle.clear(); const na = -2.3 + 1.6 * (.5 + .5 * Math.sin(TP * f / 90));
        needle.line(8, 8, Math.round(8 + 5 * Math.sin(na)), Math.round(8 - 5 * Math.cos(na)), '#d02828'); needle.draw(ctx, gaugeX - 8, gaugeY - 8);
        smokeColumn(ctx, steamX, Y(178), f, { n: 5, rise: 26, per: 70, sway: 1.5, r0: 1, r1: 3.5, wind: 2, cols: ['#ffffff', '#ece4dc', '#c8bcb4'] });
        ctx.drawImage(fgC, 0, 0);
        if (tri(f, 50, 10) > .85) { ctx.fillStyle = '#ffffff'; ctx.fillRect(lampX - 1, Y(127), 2, 2); }
      },
    };
  }
/* ===== END ===== */
  PixelBG.register('city_steampunk', function (env) { return env.day ? buildDay(env) : buildNight(env); });
})();
