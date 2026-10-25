/* Магический город: полная луна, сияние, парящие острова с башнями, шпили с кристаллами, светящиеся окна, крупные кристаллы.
 * Два варианта: buildNight (вечер/ночь) и buildDay (день); выбор по env.variant. */
(function () {
  function buildNight(env) {
  const { W, H, Y, Ys, U, limit, px } = env;
  const { C, Layer, Overlay, mulberry32, randint, pick, gradient, addGlow, moonSprite, makeStars, drawStars, makeSparkles, drawSparkles,
    makeMotes, drawMotes, cloudRow, drawCloudRows, glowPulse, fog, crystalGem, pine, outward, bay, clamp, tri } = px;
  const r = mulberry32(83), xc = W / 2, TP = 2 * Math.PI;
  const sc = clamp(W / 128, .7, 1), S1 = n => Math.round(n * sc);
  const moonX = U(-36), moonY = Ys(26);

  /* ---------- небо, луна, звёзды, сияние ---------- */
  const sky = new Layer(W, H);
  gradient(sky, ['#0c0a30', '#150f46', '#20135a', '#2c1a6c', '#3a2480', '#47298e', '#522e96'], 0, Y(150));
  addGlow(sky, moonX, moonY, 10, 46, '#a08ae8', .5, 5, 1.6);
  const skyC = sky.canvas();
  const moon = moonSprite(10, ['#c8b8f0', '#f0e8ff', '#ffffff', '#b8a4e8'], false);
  const stars = makeStars(r, Math.round(70 * W / 128), W, Y(120), { avoid: (x, y) => Math.hypot(x - moonX, y - moonY) < 15 });
  const spark = makeSparkles(r, Math.round(5 * W / 128) + 1, W, Ys(4), Ys(60));
  const ribbons = [
    { yc: Ys(46), amp: Ys(8), kx: .7, ke: .5, sk: .5, wid: Ys(20), strength: .62, color: '#38e0b0', ph: .8 },
    { yc: Ys(34), amp: Ys(8), kx: 1.1, ke: .7, sk: -.5, wid: Ys(18), strength: .5, color: '#a070ff', ph: 2.4 },
    { yc: Ys(64), amp: Ys(6), kx: .5, ke: .4, sk: .4, wid: Ys(16), strength: .42, color: '#d060e0', ph: 4.1 },
  ];
  const aurH = Ys(84), ovA = new Overlay(W, H);
  const LUT = new Float32Array(257);
  for (let i = 0; i <= 256; i++) { const u = -.8 + 3.8 * i / 256; LUT[i] = u >= 0 ? Math.exp(-u * 1.3) : Math.exp(-(u * 3.5) * (u * 3.5)); }
  const ribCols = ribbons.map(rb => C(rb.color));
  function auroraDraw(f) {
    ribbons.forEach((rb, k) => {
      const col = ribCols[k];
      for (let x = 0; x < W; x++) {
        const xr = (x - xc) / 128, th = TP * (rb.kx * xr + rb.sk * f / 120) + rb.ph;
        const cy = rb.yc + rb.amp * Math.sin(th) + .45 * rb.amp * Math.sin(2 * th + 1.3);
        const en = .35 + .65 * (.5 + .5 * Math.sin(TP * (rb.ke * xr + rb.sk * f / 120) + rb.ph * 1.7));
        const rays = .8 + .2 * Math.sin(TP * (18 * xr + rb.sk * f / 120)), k0 = rb.strength * en * rays;
        for (let y = Math.max(0, Math.floor(cy - 3 * rb.wid)); y < Math.min(aurH, Math.ceil(cy + .8 * rb.wid)); y++) {
          const a = k0 * LUT[(((cy - y) / rb.wid + .8) * 256 / 3.8) | 0];
          if (a < .03) continue;
          const q = Math.floor(a * 4 + bay(x, y)) / 4;
          if (q > 0) ovA.over(x, y, col, q > 1 ? 1 : q);
        }
      }
    });
  }

  /* ---------- розовые полосы облаков ---------- */
  const strips = [
    cloudRow({ sizes: [[64, 3], [48, 3], [56, 3]], seed: 6, cols: ['#8a48a8', '#e070c8', '#b058b8'], y: Y(104), v: .12, gap: 140, off: 20 }),
    cloudRow({ sizes: [[52, 3], [40, 3]], seed: 13, cols: ['#703a9c', '#c85cb8', '#9a4cb0'], y: Y(128), v: .18, gap: 120, off: 60 }),
  ];

  /* ---------- острова ---------- */
  const wins = [];                                                           // окна: [x, y, цвет, период, фаза]
  const WC = ['#ffd070', '#ffe090', '#60f0ff'];
  function island(L, cx, y, w, depth, tH, trees) {
    const x0 = Math.round(cx - w / 2), x1 = Math.round(cx + w / 2);
    L.poly([[x0, y + 4], [x1, y + 4], [Math.round(cx) + 2, y + 4 + depth]], '#4a3a96');
    L.poly([[Math.round(cx), y + 4], [x1, y + 4], [Math.round(cx) + 2, y + 4 + depth]], '#2e2068');
    L.line(x0, y + 4, Math.round(cx) + 2, y + 4 + depth, '#7a68d0');
    for (let k = 0; k < 4; k++) L.px(Math.round(cx) + 3 + k * 3, y + 6 + k * 2, '#1c1450');
    L.rect(x0, y, x1, y + 3, '#2aa884'); L.hline(x0, x1, y, '#58e0b0'); L.hline(x0, x1, y + 3, '#1a7a68');
    for (const t of trees) pine(L, Math.round(cx + t[0]), y, t[1], '#1a8a6a', '#3ad0a0', 7, 3);
    if (tH) {
      const bx = Math.round(cx + 4);
      L.rect(bx - 3, y - tH, bx + 3, y, '#463496'); L.vline(bx - 3, y - tH, y, '#6a58c0'); L.vline(bx + 3, y - tH, y, '#32246e');
      L.poly([[bx - 5, y - tH], [bx + 5, y - tH], [bx, y - tH - 10]], '#5a3aa8'); L.poly([[bx - 5, y - tH], [bx, y - tH], [bx, y - tH - 10]], '#6c4cbc');
      crystalGem(L, bx, y - tH - 10, '#c0f8ff', '#40d8f0', '#2090c0', 6, 3);
      L.rect(bx - 1, y - tH + 6, bx, y - tH + 8, '#ffd070'); L.px(bx + 1, y - tH + 11, '#60f0ff');
      wins.push([bx - 1, y - tH + 6, 0, 90, 5]);
    }
  }
  const isl = new Layer(W, H), ri = mulberry32(17);
  const ix = Math.round(U(33)), iy = Y(64), il = Math.round(U(-36)), iyl = Y(122);
  island(isl, ix, iy, S1(46) + 4, 26, 26, [[-16, 12], [-10, 8], [16, 10]]);
  island(isl, il, iyl, S1(30) + 4, 14, 18, [[-10, 8], [8, 7]]);
  for (const d of [-1, 1]) for (const u of outward(d * 62, d, limit, 44, 80, ri)) island(isl, Math.round(U(u)), Y(randint(ri, 62, 130)), randint(ri, 16, 26), randint(ri, 8, 14), ri() < .5 ? randint(ri, 10, 18) : 0, [[-4, randint(ri, 6, 9)]]);
  const islC = isl.canvas();
  const drips = [[ix + 8, 0, 22, 4], [ix + 11, 9, 28, 14], [ix + 14, 18, 20, 2]].map(([x, ph, per, y0]) => ({ x, ph, per, y0: iy + 10 + y0 }));
  // правый остров: каждые 22–28 кадров капля падает на 14 px

  /* ---------- силуэты города ---------- */
  function spireRow(base, hmin, hmax, step, body, roof, edge, seed, withWin) {
    const L = new Layer(W, H), rg = mulberry32(seed);
    for (let x = -8; x < W + 10; x += randint(rg, step[0], step[1])) {
      const w = randint(rg, 8, 15), h = randint(rg, hmin, hmax), top = base - h, xx = Math.round(x);
      L.rect(xx - (w >> 1), top, xx + (w >> 1), base + 20, body);
      if (rg() < .75) L.poly([[xx - (w >> 1) - 1, top], [xx + (w >> 1) + 1, top], [xx + Math.round((rg() - .5) * 2), top - randint(rg, 9, 22)]], roof);
      else L.rect(xx - (w >> 1) - 1, top - 2, xx + (w >> 1) + 1, top, roof);
      L.vline(xx - (w >> 1), top, base, edge);
      if (withWin) for (let k = 0; k < Math.floor(h / 9); k++) if (rg() < .55) wins.push([xx - 1 + (rg() < .5 ? -2 : 2), top + 6 + k * 8, randint(rg, 0, 2), pick(rg, [60, 90, 120, 180]), randint(rg, 0, 120)]);
    }
    return L.canvas();
  }
  const farC = spireRow(Y(176), 22, 52, [8, 14], '#32227a', '#3e2c8a', '#4e3ca0', 4, false);
  const midC = spireRow(Y(190), 26, 60, [9, 16], '#271a68', '#30227c', '#42338e', 9, true);

  /* ---------- главные шпили ---------- */
  const towers = new Layer(W, H);
  function spire(cx, tipY, shY, botY, wB, wS, baseTop, baseW) {
    cx = Math.round(cx);
    towers.poly([[cx - (wS >> 1), shY], [cx + (wS >> 1), shY], [cx, tipY]], '#3e2c92'); towers.poly([[cx - (wS >> 1), shY], [cx, shY], [cx, tipY]], '#4e3ca8');
    towers.line(cx - (wS >> 1), shY, cx, tipY, '#6a58c8');
    towers.rect(cx - (wB >> 1), shY, cx + (wB >> 1), botY, '#2a1e72'); towers.vline(cx - (wB >> 1), shY, botY, '#5a48b8'); towers.vline(cx + (wB >> 1), shY, botY, '#1c1458');
    for (let y = shY + 22; y < baseTop; y += 24) towers.hline(cx - (wB >> 1) - 1, cx + (wB >> 1) + 1, y, '#4a3aa0');
    towers.rect(cx - (baseW >> 1), baseTop, cx + (baseW >> 1), botY, '#24196a'); towers.vline(cx - (baseW >> 1), baseTop, botY, '#4a3aa0');
    towers.hline(cx - (baseW >> 1) - 1, cx + (baseW >> 1) + 1, baseTop, '#5a48b8');
    crystalGem(towers, cx, tipY, '#c0f8ff', '#40d8f0', '#2090c0', 8, 3);
    for (let k = 0; k < 6; k++) wins.push([cx - 1 + (k & 1) * 2 - (k & 1 ? 0 : 0), shY + 6 + (k >> 1) * 12, 0, pick(r, [90, 120, 180]), randint(r, 0, 100)]);
    for (let y = baseTop + 6; y < botY - 4; y += 9) { wins.push([cx - 3, y, randint(r, 0, 1), pick(r, [60, 90, 120]), randint(r, 0, 100)]); wins.push([cx + 2, y, randint(r, 0, 2), pick(r, [60, 90, 120]), randint(r, 0, 100)]); }
  }
  const sx = U(-2), sx2 = U(30);
  spire(sx, Y(63), Y(96), Y(205), 8, 14, Y(152), 16);
  spire(sx2, Y(98), Y(120), Y(205), 7, 11, Y(160), 13);
  const towersC = towers.canvas();
  const bead = [];                                                          // бусы между шпилями
  for (let k = 0; k < 14; k++) { const t = k / 13; bead.push([Math.round(sx + 6 + t * (sx2 - sx - 12)), Math.round(Y(116) + 5 * Math.sin(Math.PI * t) + 2 * t)]); }

  /* ---------- парящие кристаллы ---------- */
  const gemSpr = {
    pink: (() => { const L = new Layer(9, 13); crystalGem(L, 4, 12, '#ffd0f4', '#ff70d0', '#b83098', 11, 3); return L.canvas(); })(),
    cyan: (() => { const L = new Layer(9, 13); crystalGem(L, 4, 12, '#d8ffff', '#50e0ff', '#2090c8', 11, 3); return L.canvas(); })(),
  };
  const floaters = [[-36, 128, 'pink', 0], [-27, 133, 'pink', .35], [23, 128, 'cyan', .6], [43, 121, 'pink', .1], [-52, 140, 'cyan', .8]]
    .map(([u, y, c, ph]) => ({ x: Math.round(U(u)), y: Y(y), c, ph }));
  for (const d of [-1, 1]) for (const u of outward(d * 62, d, limit, 20, 44, ri)) floaters.push({ x: Math.round(U(u)), y: Y(randint(ri, 100, 150)), c: ri() < .5 ? 'pink' : 'cyan', ph: ri() });

  /* ---------- передний план: скалы и крупные кристаллы ---------- */
  const fg = new Layer(W, H), dark = '#0a0624';
  fg.poly([[-2, H + 2], [-2, Y(168)], [S1(18), Y(176)], [S1(36), H + 2]], dark);
  fg.poly([[W + 2, H + 2], [W + 2, Y(162)], [W - S1(16), Y(172)], [W - S1(32), H + 2]], dark);
  const CY = ['#8aecff', '#30b0e0', '#1a68b0'], PK = ['#ffa8e4', '#e050c0', '#9c2890'];
  function big(x, base, h, w, c) {
    x = Math.round(x); base = Math.round(base);
    fg.poly([[x - (w >> 1), base], [x - (w >> 1), base - h * .78], [x, base - h], [x, base]], c[1]);
    fg.poly([[x, base], [x, base - h], [x + (w >> 1), base - h * .78], [x + (w >> 1), base]], c[2]);
    fg.vline(x - (w >> 1) + 1, base - h * .7, base - 3, c[0]); fg.line(x - (w >> 1), Math.round(base - h * .78), x, Math.round(base - h), c[0]);
  }
  const gl = [], rgl = mulberry32(44);
  const bx = S1(14), bxr = W - S1(14), bb = H + 2;
  big(bx + 6, bb, S1(38), S1(9), CY); big(bx + 17, bb, S1(14), S1(7), CY); big(bx - 8, bb, S1(18), S1(7), PK);
  big(bxr - 6, bb, S1(40), S1(10), PK); big(bxr - 18, bb, S1(16), S1(7), CY); big(bxr + 5, bb, S1(16), S1(7), PK);
  gl.push([bx + 6, bb - S1(22), 24, '#40d0ff', 70, 0], [bxr - 6, bb - S1(24), 24, '#ff60d8', 80, 25]);
  for (const d of [-1, 1]) for (const u of outward(d * 60, d, limit, 26, 56, rgl)) {
    const c = rgl() < .5 ? CY : PK, h = randint(rgl, 14, 34);
    fg.poly([[U(u) - 14, H + 2], [U(u), Y(196)], [U(u) + 14, H + 2]], dark);
    big(U(u), Y(randint(rgl, 198, 204)), h, Math.round(h * .28) + 3, c); gl.push([U(u), Y(190) - h * .4, 16, c === CY ? '#40d0ff' : '#ff60d8', randint(rgl, 60, 90), randint(rgl, 0, 60)]);
  }
  const fgC = fg.canvas();
  const motes = makeMotes(r, Math.round(46 * W / 128), W, { y0: Y(70), y1: Y(190), colors: ['#60f0ff', '#ff80e0', '#ffd070', '#c0a8ff'], rise: .18, amp: [2, 5], big: .2 });
  const ov = new Overlay(W, H);

  return {
    draw(ctx, f) {
      ctx.drawImage(skyC, 0, 0);
      drawStars(ctx, stars, f);
      drawSparkles(ctx, spark, f, '#ffffff');
      ctx.drawImage(moon, moonX - (moon.width >> 1), moonY - (moon.height >> 1));
      auroraDraw(f); ovA.flush(ctx, 0, 0, W, aurH);
      ctx.drawImage(islC, 0, 0);
      for (const d of drips) {
        const p = (((f + d.ph) % d.per) + d.per) % d.per, y = d.y0 + p, a = p < d.per * .8;
        if (a) { ctx.fillStyle = '#60e8ff'; ctx.fillRect(d.x, y, 1, 2); }
      }
      drawCloudRows(ctx, strips, f, W);
      ctx.drawImage(farC, 0, 0);
      ctx.drawImage(midC, 0, 0);
      ctx.drawImage(towersC, 0, 0);
      for (const [x, y, c, per, ph] of wins) if (tri(f, per, ph) > .16) { ctx.fillStyle = WC[c]; ctx.fillRect(x, y, 1, 2); }
      // бусы: бегущий блик
      bead.forEach(([x, y], k) => {
        const lv = tri(f, 56, k * 4);
        ctx.fillStyle = lv > .6 ? '#c8ffff' : lv > .25 ? '#50d8f0' : '#2a7aa8'; ctx.fillRect(x, y, 1, 1);
      });
      for (const g of floaters) {
        const o = Math.round(1.4 * Math.sin(TP * (f / 70 + g.ph)));
        ctx.drawImage(gemSpr[g.c], g.x - 4, g.y - 12 + o);
        if (tri(f, 40, g.ph * 80) > .8) { ctx.fillStyle = '#ffffff'; ctx.fillRect(g.x, g.y - 12 + o, 1, 1); ctx.fillRect(g.x - 1, g.y - 9 + o, 3, 1); ctx.fillRect(g.x, g.y - 10 + o, 1, 3); }
      }
      // кристаллы на шпилях и острове мерцают
      for (const [gx, gy] of [[sx, Y(63) - 5], [sx2, Y(98) - 5]]) if (tri(f, 36, gx) > .7) { ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(gx) - 2, gy, 5, 1); ctx.fillRect(Math.round(gx), gy - 2, 1, 5); }
      fog(ov, f, { y0: Y(150), y1: H, color: '#9a6ae0', strength: .26, speed: .3, fade: 'mid', levels: 3 });
      ov.flush(ctx, 0, Y(150), W, H);
      ctx.drawImage(fgC, 0, 0);
      for (const [x, y, rad, col, per, ph] of gl) glowPulse(ov, x, y, rad, col, f, { per, ph, strength: .5, lo: .55 });
      ov.flush(ctx, 0, Y(120), W, H);
      drawMotes(ctx, motes, f);
    },
  };
}
/* ===== DAY ===== */
  function buildDay(env) {
    const { W, H, Y, Ys, U, limit, px } = env;
    const { Layer, Overlay, mulberry32, randint, pick, gradient, addGlow, sunDisc, makeSparkles, drawSparkles,
      makeMotes, drawMotes, cloudRow, drawCloudRows, glowPulse, fog, crystalGem, pine, outward, drawBird, bay, clamp, tri } = px;
    const r = mulberry32(83), xc = W / 2, TP = 2 * Math.PI;
    const sc = clamp(W / 128, .7, 1), S1 = n => Math.round(n * sc);
    const sunX = U(-36), sunY = Ys(26);

    /* ---------- небо и солнце ---------- */
    const sky = new Layer(W, H);
    gradient(sky, ['#58a4ee', '#78bcf4', '#9ad0f8', '#bce0fa', '#dcecfc', '#f2eefc', '#fce8f4'], 0, Y(150));
    addGlow(sky, sunX, sunY, 8, 56, '#fff2c0', .7, 5, 1.5);
    sunDisc(sky, sunX, sunY, [[10, '#ffe27a'], [8, '#fff2a8'], [6, '#ffffff']]);
    const skyC = sky.canvas();
    const white = ['#f6f9fe', '#b4c8e6', '#ffffff'], candy = ['#fff0fa', '#e8b8e0', '#ffffff'];
    const rowsHi = [cloudRow({ sizes: [[44, 10], [34, 9], [50, 11]], seed: 9, cols: white, y: Ys(14), v: .22, gap: 118, off: 30 }),
      cloudRow({ sizes: [[36, 9], [46, 10]], seed: 19, cols: white, y: Ys(56), v: .3, gap: 108, off: 70 })];
    const strips = [
      cloudRow({ sizes: [[64, 7], [48, 6], [56, 7]], seed: 6, cols: candy, y: Y(104), v: .12, gap: 140, off: 20 }),
      cloudRow({ sizes: [[52, 6], [40, 6]], seed: 13, cols: candy, y: Y(128), v: .18, gap: 120, off: 60 }),
    ];
    const spark = makeSparkles(r, Math.round(4 * W / 128) + 1, W, Ys(6), Ys(70));
    const flock = [[0, 0], [-6, -2], [-6, 3], [-12, -4], [-12, 5]], flockX = r() * (W + 90), flockY = Ys(62);

    /* ---------- острова ---------- */
    const wins = [];
    const WC = ['#7a9ad8', '#8aaae0', '#6a88c8'];
    function island(L, cx, y, w, depth, tH, trees) {
      const x0 = Math.round(cx - w / 2), x1 = Math.round(cx + w / 2);
      L.poly([[x0, y + 4], [x1, y + 4], [Math.round(cx) + 2, y + 4 + depth]], '#d0c0ee');
      L.poly([[Math.round(cx), y + 4], [x1, y + 4], [Math.round(cx) + 2, y + 4 + depth]], '#a898d0');
      L.line(x0, y + 4, Math.round(cx) + 2, y + 4 + depth, '#f4ecff');
      for (let k = 0; k < 4; k++) L.px(Math.round(cx) + 3 + k * 3, y + 6 + k * 2, '#8878b8');
      L.rect(x0, y, x1, y + 3, '#5ad070'); L.hline(x0, x1, y, '#a8f488'); L.hline(x0, x1, y + 3, '#3aa858');
      for (const t of trees) pine(L, Math.round(cx + t[0]), y, t[1], '#2c9a4c', '#7ae070', 7, 3);
      if (tH) {
        const bx = Math.round(cx + 4);
        L.rect(bx - 3, y - tH, bx + 3, y, '#f4ecff'); L.vline(bx - 3, y - tH, y, '#ffffff'); L.vline(bx + 3, y - tH, y, '#c0b0e0');
        L.poly([[bx - 5, y - tH], [bx + 5, y - tH], [bx, y - tH - 10]], '#f0c850'); L.poly([[bx - 5, y - tH], [bx, y - tH], [bx, y - tH - 10]], '#ffe488');
        crystalGem(L, bx, y - tH - 10, '#e0ffff', '#50e0ff', '#2090c8', 6, 3);
        L.rect(bx - 1, y - tH + 6, bx, y - tH + 8, '#8ab0e8'); L.px(bx + 1, y - tH + 11, '#8ab0e8');
      }
    }
    const isl = new Layer(W, H), ri = mulberry32(17);
    const ix = Math.round(U(33)), iy = Y(64), il = Math.round(U(-36)), iyl = Y(122);
    island(isl, ix, iy, S1(46) + 4, 26, 26, [[-16, 12], [-10, 8], [16, 10]]);
    island(isl, il, iyl, S1(30) + 4, 14, 18, [[-10, 8], [8, 7]]);
    for (const d of [-1, 1]) for (const u of outward(d * 62, d, limit, 44, 80, ri)) island(isl, Math.round(U(u)), Y(randint(ri, 62, 130)), randint(ri, 16, 26), randint(ri, 8, 14), ri() < .5 ? randint(ri, 10, 18) : 0, [[-4, randint(ri, 6, 9)]]);
    const islC = isl.canvas();
    const drips = [[ix + 8, 0, 22, 4], [ix + 11, 9, 28, 14], [ix + 14, 18, 20, 2]].map(([x, ph, per, y0]) => ({ x, ph, per, y0: iy + 10 + y0 }));

    /* ---------- силуэты города ---------- */
    function spireRow(base, hmin, hmax, step, body, roof, roof2, edge, seed, withWin) {
      const L = new Layer(W, H), rg = mulberry32(seed); let n = 0;
      for (let x = -8; x < W + 10; x += randint(rg, step[0], step[1])) {
        const w = randint(rg, 8, 15), h = randint(rg, hmin, hmax), top = base - h, xx = Math.round(x), rc = (n++ & 1) ? roof : roof2;
        L.rect(xx - (w >> 1), top, xx + (w >> 1), base + 20, body);
        if (rg() < .75) L.poly([[xx - (w >> 1) - 1, top], [xx + (w >> 1) + 1, top], [xx + Math.round((rg() - .5) * 2), top - randint(rg, 9, 22)]], rc);
        else L.rect(xx - (w >> 1) - 1, top - 2, xx + (w >> 1) + 1, top, rc);
        L.vline(xx - (w >> 1), top, base, edge);
        if (withWin) for (let k = 0; k < Math.floor(h / 9); k++) if (rg() < .55) wins.push([xx - 1 + (rg() < .5 ? -2 : 2), top + 6 + k * 8, randint(rg, 0, 2), pick(rg, [60, 90, 120, 180]), randint(rg, 0, 120)]);
      }
      return L.canvas();
    }
    const farC = spireRow(Y(176), 22, 52, [8, 14], '#d6ccf2', '#e8dcff', '#f6dca0', '#f4eeff', 4, false);
    const midC = spireRow(Y(190), 26, 60, [9, 16], '#bcb0e6', '#d4c4f6', '#f0cc60', '#e8e0fc', 9, true);

    /* ---------- главные шпили ---------- */
    const towers = new Layer(W, H);
    function spire(cx, tipY, shY, botY, wB, wS, baseTop, baseW) {
      cx = Math.round(cx);
      towers.poly([[cx - (wS >> 1), shY], [cx + (wS >> 1), shY], [cx, tipY]], '#f0c850'); towers.poly([[cx - (wS >> 1), shY], [cx, shY], [cx, tipY]], '#ffe488');
      towers.line(cx - (wS >> 1), shY, cx, tipY, '#fff4c0');
      towers.rect(cx - (wB >> 1), shY, cx + (wB >> 1), botY, '#c8bcee'); towers.vline(cx - (wB >> 1), shY, botY, '#f6f0ff'); towers.vline(cx + (wB >> 1), shY, botY, '#9a8cc8');
      for (let y = shY + 22; y < baseTop; y += 24) towers.hline(cx - (wB >> 1) - 1, cx + (wB >> 1) + 1, y, '#f4d070');
      towers.rect(cx - (baseW >> 1), baseTop, cx + (baseW >> 1), botY, '#b8aae4'); towers.vline(cx - (baseW >> 1), baseTop, botY, '#f0e8ff');
      towers.hline(cx - (baseW >> 1) - 1, cx + (baseW >> 1) + 1, baseTop, '#f4d070');
      crystalGem(towers, cx, tipY, '#e8ffff', '#50e0ff', '#2090c8', 8, 3);
      for (let k = 0; k < 6; k++) wins.push([cx - 1 + (k & 1) * 2, shY + 6 + (k >> 1) * 12, 0, pick(r, [90, 120, 180]), randint(r, 0, 100)]);
      for (let y = baseTop + 6; y < botY - 4; y += 9) { wins.push([cx - 3, y, randint(r, 0, 1), pick(r, [60, 90, 120]), randint(r, 0, 100)]); wins.push([cx + 2, y, randint(r, 0, 2), pick(r, [60, 90, 120]), randint(r, 0, 100)]); }
    }
    const sx = U(-2), sx2 = U(30);
    spire(sx, Y(63), Y(96), Y(205), 8, 14, Y(152), 16);
    spire(sx2, Y(98), Y(120), Y(205), 7, 11, Y(160), 13);
    const towersC = towers.canvas();
    const bead = [];
    for (let k = 0; k < 14; k++) { const t = k / 13; bead.push([Math.round(sx + 6 + t * (sx2 - sx - 12)), Math.round(Y(116) + 5 * Math.sin(Math.PI * t) + 2 * t)]); }
    const banners = [[Math.round(sx) + 5, Y(100), 9, '#ff7ab8', 0], [Math.round(sx) - 5, Y(108), -8, '#f0c850', 1.3], [Math.round(sx2) + 4, Y(126), 8, '#ff7ab8', .6], [ix + 3, iy - 18, 8, '#f0c850', 2.1]];

    /* ---------- парящие кристаллы ---------- */
    const gemSpr = {
      pink: (() => { const L = new Layer(9, 13); crystalGem(L, 4, 12, '#ffe0f8', '#ff80d8', '#c040a0', 11, 3); return L.canvas(); })(),
      cyan: (() => { const L = new Layer(9, 13); crystalGem(L, 4, 12, '#e8ffff', '#60e8ff', '#2898d0', 11, 3); return L.canvas(); })(),
    };
    const floaters = [[-36, 128, 'pink', 0], [-27, 133, 'pink', .35], [23, 128, 'cyan', .6], [43, 121, 'pink', .1], [-52, 140, 'cyan', .8]]
      .map(([u, y, c, ph]) => ({ x: Math.round(U(u)), y: Y(y), c, ph }));
    for (const d of [-1, 1]) for (const u of outward(d * 62, d, limit, 20, 44, ri)) floaters.push({ x: Math.round(U(u)), y: Y(randint(ri, 100, 150)), c: ri() < .5 ? 'pink' : 'cyan', ph: ri() });

    /* ---------- передний план ---------- */
    const fg = new Layer(W, H), dark = '#6a5a9c';
    fg.poly([[-2, H + 2], [-2, Y(168)], [S1(18), Y(176)], [S1(36), H + 2]], dark);
    fg.poly([[W + 2, H + 2], [W + 2, Y(162)], [W - S1(16), Y(172)], [W - S1(32), H + 2]], dark);
    const CY = ['#c8fcff', '#40c4f0', '#2078c0'], PK = ['#ffd0f0', '#f060c8', '#b030a0'];
    function big(x, base, h, w, c) {
      x = Math.round(x); base = Math.round(base);
      fg.poly([[x - (w >> 1), base], [x - (w >> 1), base - h * .78], [x, base - h], [x, base]], c[1]);
      fg.poly([[x, base], [x, base - h], [x + (w >> 1), base - h * .78], [x + (w >> 1), base]], c[2]);
      fg.vline(x - (w >> 1) + 1, base - h * .7, base - 3, c[0]); fg.line(x - (w >> 1), Math.round(base - h * .78), x, Math.round(base - h), c[0]);
    }
    const gl = [], rgl = mulberry32(44);
    const bx = S1(14), bxr = W - S1(14), bb = H + 2;
    big(bx + 6, bb, S1(38), S1(9), CY); big(bx + 17, bb, S1(14), S1(7), CY); big(bx - 8, bb, S1(18), S1(7), PK);
    big(bxr - 6, bb, S1(40), S1(10), PK); big(bxr - 18, bb, S1(16), S1(7), CY); big(bxr + 5, bb, S1(16), S1(7), PK);
    gl.push([bx + 6, bb - S1(22), 18, '#80f0ff', 70, 0], [bxr - 6, bb - S1(24), 18, '#ffa0e8', 80, 25]);
    for (const d of [-1, 1]) for (const u of outward(d * 60, d, limit, 26, 56, rgl)) {
      const c = rgl() < .5 ? CY : PK, h = randint(rgl, 14, 34);
      fg.poly([[U(u) - 14, H + 2], [U(u), Y(196)], [U(u) + 14, H + 2]], dark);
      big(U(u), Y(randint(rgl, 198, 204)), h, Math.round(h * .28) + 3, c); gl.push([U(u), Y(190) - h * .4, 12, c === CY ? '#80f0ff' : '#ffa0e8', randint(rgl, 60, 90), randint(rgl, 0, 60)]);
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (fg.has(x, y) && !fg.has(x, y - 1) && fg.d[((y * W + x) << 2)] === 106 && bay(x, y) < .6) fg.px(x, y, '#a898d8');
    const fgC = fg.canvas();
    const motes = makeMotes(r, Math.round(42 * W / 128), W, { y0: Y(70), y1: Y(190), colors: ['#ffe880', '#ffb8e8', '#a8e8ff', '#ffffff'], rise: .16, amp: [2, 5], big: .25 });
    const ov = new Overlay(W, H);
    const pennant = (ctx, x, y, len, col, f, ph) => {
      const d = len < 0 ? -1 : 1, n = Math.abs(len);
      for (let i = 0; i < n; i++) { const wy = Math.round(1.3 * Math.sin(TP * (f / 22 - i / 5) + ph)); ctx.fillStyle = col; ctx.fillRect(x + d * i, y + wy, 1, 3 - (i * 3 / n | 0)); }
      ctx.fillStyle = '#c8a040'; ctx.fillRect(x - d, y - 1, 1, 6);
    };

    return {
      draw(ctx, f) {
        ctx.drawImage(skyC, 0, 0);
        drawCloudRows(ctx, rowsHi, f, W);
        drawSparkles(ctx, spark, f, '#ffffff');
        const fxp = Math.floor(((flockX + .28 * f) % (W + 90) + W + 90) % (W + 90)) - 45;
        flock.forEach(([dx, dy], i) => drawBird(ctx, fxp + dx, flockY + dy + Math.round(Math.sin(TP * f / 70 + i)), (((f >> 2) + i) & 1) === 1, '#7a6aa8'));
        ctx.drawImage(islC, 0, 0);
        for (const d of drips) {
          const p = (((f + d.ph) % d.per) + d.per) % d.per;
          if (p < d.per * .8) { ctx.fillStyle = '#a8f0ff'; ctx.fillRect(d.x, d.y0 + p, 1, 2); }
        }
        drawCloudRows(ctx, strips, f, W);
        ctx.drawImage(farC, 0, 0);
        ctx.drawImage(midC, 0, 0);
        ctx.drawImage(towersC, 0, 0);
        for (const [x, y, c, per, ph] of wins) if (tri(f, per, ph) > .16) { ctx.fillStyle = WC[c]; ctx.fillRect(x, y, 1, 2); }
        for (const [bx_, by, len, col, ph] of banners) pennant(ctx, bx_, by, len, col, f, ph);
        bead.forEach(([x, y], k) => {
          const lv = tri(f, 56, k * 4);
          ctx.fillStyle = lv > .6 ? '#ffffff' : lv > .25 ? '#ffe8a0' : '#d8b860'; ctx.fillRect(x, y, 1, 1);
        });
        for (const g of floaters) {
          const o = Math.round(1.4 * Math.sin(TP * (f / 70 + g.ph)));
          ctx.drawImage(gemSpr[g.c], g.x - 4, g.y - 12 + o);
          if (tri(f, 40, g.ph * 80) > .8) { ctx.fillStyle = '#ffffff'; ctx.fillRect(g.x, g.y - 12 + o, 1, 1); ctx.fillRect(g.x - 1, g.y - 9 + o, 3, 1); ctx.fillRect(g.x, g.y - 10 + o, 1, 3); }
        }
        for (const [gx, gy] of [[sx, Y(63) - 5], [sx2, Y(98) - 5]]) if (tri(f, 36, gx) > .7) { ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(gx) - 2, gy, 5, 1); ctx.fillRect(Math.round(gx), gy - 2, 1, 5); }
        fog(ov, f, { y0: Y(150), y1: H, color: '#fff0fa', strength: .3, speed: .3, fade: 'mid', levels: 3 });
        ov.flush(ctx, 0, Y(150), W, H);
        ctx.drawImage(fgC, 0, 0);
        for (const [x, y, rad, col, per, ph] of gl) glowPulse(ov, x, y, rad, col, f, { per, ph, strength: .3, lo: .5 });
        ov.flush(ctx, 0, Y(120), W, H);
        drawMotes(ctx, motes, f);
      },
    };
  }
/* ===== END ===== */
  PixelBG.register('city_magic', function (env) { return env.day ? buildDay(env) : buildNight(env); });
})();
