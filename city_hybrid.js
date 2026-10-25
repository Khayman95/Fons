/* Город магии и стимпанка: месяц, сияние, часовая башня с кристаллом, дирижабль с кристальным двигателем,
 * остров с шестернёй, медные трубы с бегущей энергией, шпили с кристаллами, большая шестерня и кристаллы впереди.
 * Два варианта: buildNight (вечер/ночь) и buildDay (день); выбор по env.variant. */
(function () {
  function buildNight(env) {
  const { W, H, Y, Ys, U, limit, px } = env;
  const { C, Layer, Overlay, mulberry32, randint, pick, gradient, addGlow, moonSprite, makeStars, drawStars, makeSparkles, drawSparkles,
    makeMotes, drawMotes, cloudRow, drawCloudRows, glowPulse, fog, crystalGem, gear, pine, outward, bay, clamp, tri } = px;
  const r = mulberry32(101), xc = W / 2, TP = 2 * Math.PI;
  const sc = clamp(W / 128, .7, 1), S1 = n => Math.round(n * sc);
  const moonX = U(32), moonY = Ys(30);

  /* ---------- небо, месяц, сияние ---------- */
  const sky = new Layer(W, H);
  gradient(sky, ['#0a0830', '#140f48', '#1e1262', '#2a1a78', '#36228a', '#40298e', '#4a2e92'], 0, Y(150));
  addGlow(sky, moonX, moonY, 10, 44, '#8a80e8', .45, 5, 1.6);
  const skyC = sky.canvas();
  const moon = moonSprite(9, ['#c8c0f4', '#f0ecff', '#ffffff'], true);
  const stars = makeStars(r, Math.round(74 * W / 128), W, Y(118), { avoid: (x, y) => Math.hypot(x - moonX, y - moonY) < 14 });
  const spark = makeSparkles(r, Math.round(4 * W / 128) + 1, W, Ys(8), Ys(70));
  const ribbons = [
    { yc: Ys(36), amp: Ys(8), kx: .6, ke: .5, sk: .5, wid: Ys(18), strength: .55, color: '#38d8b8', ph: 1.2 },
    { yc: Ys(22), amp: Ys(8), kx: .9, ke: .6, sk: -.45, wid: Ys(18), strength: .45, color: '#9a6cff', ph: 3.0 },
  ];
  const aurH = Ys(70), ovA = new Overlay(W, H);
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
        const k0 = rb.strength * en * (.8 + .2 * Math.sin(TP * (18 * xr + rb.sk * f / 120)));
        for (let y = Math.max(0, Math.floor(cy - 3 * rb.wid)); y < Math.min(aurH, Math.ceil(cy + .8 * rb.wid)); y++) {
          const a = k0 * LUT[(((cy - y) / rb.wid + .8) * 256 / 3.8) | 0];
          if (a < .03) continue;
          const q = Math.floor(a * 4 + bay(x, y)) / 4;
          if (q > 0) ovA.over(x, y, col, q > 1 ? 1 : q);
        }
      }
    });
  }
  const strips = [cloudRow({ sizes: [[60, 3], [44, 3]], seed: 9, cols: ['#8a48a8', '#e070c8', '#b058b8'], y: Y(104), v: .12, gap: 150, off: 70 }),
    cloudRow({ sizes: [[50, 3], [38, 3]], seed: 21, cols: ['#703a9c', '#c85cb8', '#9a4cb0'], y: Y(122), v: .16, gap: 130, off: 10 })];

  /* ---------- остров с башней и шестернёй под ним ---------- */
  const wins = [], WC = ['#60f0ff', '#ffd070', '#9af8ff'];
  const isl = new Layer(W, H), ri = mulberry32(17);
  function island(L, cx, y, w, depth, tH, trees) {
    const x0 = Math.round(cx - w / 2), x1 = Math.round(cx + w / 2);
    L.poly([[x0, y + 4], [x1, y + 4], [Math.round(cx) + 2, y + 4 + depth]], '#3a2c8a');
    L.poly([[Math.round(cx), y + 4], [x1, y + 4], [Math.round(cx) + 2, y + 4 + depth]], '#261c64');
    L.line(x0, y + 4, Math.round(cx) + 2, y + 4 + depth, '#6a5cc8');
    L.rect(x0, y, x1, y + 3, '#2aa884'); L.hline(x0, x1, y, '#58e0b0'); L.hline(x0, x1, y + 3, '#1a7a68');
    for (const t of trees) pine(L, Math.round(cx + t[0]), y, t[1], '#1a8a6a', '#3ad0a0', 7, 3);
    if (tH) {
      const bx = Math.round(cx + 2);
      L.rect(bx - 3, y - tH, bx + 3, y, '#463496'); L.vline(bx - 3, y - tH, y, '#6a58c0'); L.vline(bx + 3, y - tH, y, '#32246e');
      L.poly([[bx - 5, y - tH], [bx + 5, y - tH], [bx, y - tH - 10]], '#5a3aa8'); L.poly([[bx - 5, y - tH], [bx, y - tH], [bx, y - tH - 10]], '#6c4cbc');
      crystalGem(L, bx, y - tH - 10, '#c0f8ff', '#40d8f0', '#2090c0', 6, 3);
      L.rect(bx - 1, y - tH + 6, bx, y - tH + 8, '#60f0ff'); L.px(bx + 1, y - tH + 11, '#ffd070');
    }
  }
  const il = Math.round(U(-30)), iyl = Y(100);
  island(isl, il, iyl, S1(46) + 4, 20, 24, [[-16, 11], [-11, 8], [14, 9]]);
  for (const d of [-1, 1]) for (const u of outward(d * 62, d, limit, 44, 80, ri)) island(isl, Math.round(U(u)), Y(randint(ri, 60, 126)), randint(ri, 16, 26), randint(ri, 8, 14), ri() < .5 ? randint(ri, 10, 18) : 0, [[-4, randint(ri, 6, 9)]]);
  const islC = isl.canvas();

  /* ---------- силуэты шпилей с медными кольцами ---------- */
  function spireRow(base, hmin, hmax, step, body, roof, edge, seed, bright) {
    const L = new Layer(W, H), rg = mulberry32(seed);
    for (let x = -8; x < W + 10; x += randint(rg, step[0], step[1])) {
      const w = randint(rg, 8, 14), h = randint(rg, hmin, hmax), top = base - h, xx = Math.round(x);
      L.rect(xx - (w >> 1), top, xx + (w >> 1), base + 20, body);
      L.poly([[xx - (w >> 1) - 1, top], [xx + (w >> 1) + 1, top], [xx + Math.round((rg() - .5) * 2), top - randint(rg, 12, 26)]], roof);
      L.vline(xx - (w >> 1), top, base, edge);
      if (bright) {
        for (let y = top + 8; y < base; y += randint(rg, 12, 18)) L.hline(xx - (w >> 1), xx + (w >> 1), y, '#c88a30');
        for (let k = 0; k < Math.floor(h / 10); k++) if (rg() < .45) wins.push([xx - 1 + (rg() < .5 ? -2 : 1), top + 5 + k * 9, randint(rg, 0, 2), pick(rg, [60, 90, 120, 180]), randint(rg, 0, 120)]);
      }
    }
    return L.canvas();
  }
  const farC = spireRow(Y(176), 24, 54, [8, 14], '#2e2282', '#382a92', '#4a3ca8', 4, false);
  const midC = spireRow(Y(190), 30, 62, [10, 17], '#231a6c', '#2c2282', '#40349a', 9, true);

  /* ---------- башня с часами и кристаллом ---------- */
  const tx = Math.round(U(18)), cyc = Y(93), tw = new Layer(W, H);
  tw.rect(tx - 10, Y(77), tx + 10, Y(205), '#241a78'); tw.vline(tx - 10, Y(77), Y(205), '#4a3ab0'); tw.vline(tx + 10, Y(77), Y(205), '#18104e');
  tw.poly([[tx - 12, Y(77)], [tx + 12, Y(77)], [tx, Y(60)]], '#3a2a98'); tw.poly([[tx - 12, Y(77)], [tx, Y(77)], [tx, Y(60)]], '#4a38aa'); tw.line(tx - 12, Y(77), tx, Y(60), '#6a58cc');
  tw.vline(tx, Y(55), Y(60), '#d8a040');
  crystalGem(tw, tx, Y(56), '#d0ffff', '#40d8f0', '#2090c8', 14, 5);
  for (const yy of [Y(109), Y(137), Y(165)]) { tw.rect(tx - 11, yy, tx + 11, yy + 2, '#d8a040'); tw.hline(tx - 11, tx + 11, yy, '#f8c860'); }
  tw.disc(tx, cyc, 9, '#e09838'); tw.disc(tx, cyc, 7, '#14104a'); tw.disc(tx, cyc, 6, '#1c1660');
  for (let k = 0; k < 12; k++) { const a = TP * k / 12; tw.px(Math.round(tx + 5 * Math.sin(a)), Math.round(cyc - 5 * Math.cos(a)), '#6a60c0'); }
  for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) if (r() < .45) { const wx = tx - 6 + i * 6, wy = Y(141) + j * 6; if (wy < Y(162)) wins.push([wx, wy, 0, pick(r, [60, 90, 120]), randint(r, 0, 100)]); }
  for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (r() < .5) { const wx = tx - 6 + i * 6, wy = Y(170) + j * 7; wins.push([wx, wy, randint(r, 0, 2), pick(r, [60, 90, 120]), randint(r, 0, 100)]); }
  const twC = tw.canvas();

  /* ---------- трубы с бегущей энергией ---------- */
  const pipes = new Layer(W, H), paths = [], joints = [];
  function pipe(pts) {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      pipes.rect(Math.min(x0, x1), Math.min(y0, y1), Math.max(x0, x1) + (y0 === y1 ? 0 : 1), Math.max(y0, y1) + (y0 === y1 ? 1 : 0), '#d8a040');
      pipes.line(x0, y0, x1, y1, '#f8c860');
    }
    for (const [x, y] of pts) { pipes.disc(x, y, 2, '#b87a30'); pipes.px(x, y, '#ffd070'); joints.push([x, y]); }
    const pt = []; let len = 0;
    for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let k = 0; k < n; k++) pt.push([x0 + Math.round((x1 - x0) * k / n), y0 + Math.round((y1 - y0) * k / n)]); }
    paths.push({ pt, sp: .9 + r() * .5, off: randint(r, 0, 90) });
  }
  const px0 = n => Math.round(U(n));
  pipe([[px0(-64), Y(160)], [px0(-24), Y(160)], [px0(-24), Y(143)], [tx - 11, Y(143)]]);
  pipe([[tx + 11, Y(151)], [px0(40), Y(151)], [px0(40), Y(168)]]);
  const rp = mulberry32(70);
  for (const d of [-1, 1]) for (const u of outward(d * 58, d, limit, 40, 70, rp)) { const x0 = px0(u), len = randint(rp, 18, 36) * (rp() < .5 ? 1 : -1), y0 = Y(randint(rp, 148, 168)); pipe([[x0, y0], [x0 + len, y0], [x0 + len, y0 + randint(rp, 8, 16)]]); }
  const pipesC = pipes.canvas();

  /* ---------- шестерни, дирижабль, парящие камни ---------- */
  const gears = [
    { x: tx, y: Y(123), r: 8, t: 10, dir: 1, col: '#b87a30', hi: '#e8b050' },
    { x: il - 12, y: iyl + 12, r: 10, t: 10, dir: -1, col: '#b07230', hi: '#e0a848' },
    { x: S1(8), y: H + 4 - S1(0), r: 22, t: 14, dir: 1, col: '#6a4a28', hi: '#a07038' },
  ];
  gears.forEach(g => { g.c = g.r + 5; g.spr = new Layer(2 * g.c + 1, 2 * g.c + 1); g.sp = TP / (g.t * 40); });
  const ship = (() => {
    const L = new Layer(70, 40), x0 = 6, x1 = 64, h = 16, oy = 12;
    L.ellipseBox(x0, oy, x1, oy + h, '#34447c');
    for (let y = oy; y <= oy + h; y++) for (let x = x0; x <= x1; x++) if (L.has(x, y)) { if (y < oy + h * .3) L.px(x, y, '#4a5c9c'); else if (y > oy + h * .78) L.px(x, y, '#26346a'); }
    L.hline(x0 + 5, x1 - 5, oy + Math.round(h * .62), '#d8a040');
    L.poly([[0, oy + 2], [x0 + 6, oy + 5], [x0 + 6, oy + 12], [4, oy + h + 2]], '#26346a');
    L.poly([[30, oy + 1], [40, oy + 1], [35, oy - 11]], '#f060b0'); L.poly([[30, oy + 1], [35, oy + 1], [35, oy - 11]], '#ff90d0');
    L.vline(35, oy + h + 1, oy + h + 6, '#d8a040'); L.px(35, oy + h + 8, '#d0ffff'); L.px(34, oy + h + 8, '#40d8f0'); L.px(36, oy + h + 8, '#40d8f0'); L.px(35, oy + h + 7, '#40d8f0'); L.px(35, oy + h + 9, '#2090c8');
    return L.canvas();
  })();
  const shipY = Ys(48), shipV = .3, shipM = 90, r0 = r() * (W + 2 * shipM);
  const gemSpr = {
    pink: (() => { const L = new Layer(7, 11); crystalGem(L, 3, 10, '#ffd0f4', '#ff70d0', '#b83098', 9, 2); return L.canvas(); })(),
    cyan: (() => { const L = new Layer(7, 11); crystalGem(L, 3, 10, '#d8ffff', '#50e0ff', '#2090c8', 9, 2); return L.canvas(); })(),
  };
  const floaters = [[-58, 122, 'pink', 0], [-29, 123, 'pink', .3], [-21, 127, 'cyan', .55], [-11, 110, 'pink', .8], [4, 127, 'pink', .15], [33, 94, 'cyan', .4], [43, 113, 'pink', .65], [53, 110, 'cyan', .9]]
    .map(([u, y, c, ph]) => ({ x: U(u), y: Y(y), c, ph, rx: 2 + (ph * 10 | 0) % 3, ry: 2 }));
  for (const d of [-1, 1]) for (const u of outward(d * 62, d, limit, 20, 44, ri)) floaters.push({ x: U(u), y: Y(randint(ri, 100, 150)), c: ri() < .5 ? 'pink' : 'cyan', ph: ri(), rx: 3, ry: 2 });

  /* ---------- передний план ---------- */
  const fg = new Layer(W, H), dark = '#0a0624';
  fg.poly([[W + 2, H + 2], [W + 2, Y(168)], [W - S1(16), Y(176)], [W - S1(32), H + 2]], dark);
  const CY = ['#8aecff', '#30b0e0', '#1a68b0'], PK = ['#ffa8e4', '#e050c0', '#9c2890'];
  function big(x, base, h, w, c) {
    x = Math.round(x); base = Math.round(base);
    fg.poly([[x - (w >> 1), base], [x - (w >> 1), base - h * .78], [x, base - h], [x, base]], c[1]);
    fg.poly([[x, base], [x, base - h], [x + (w >> 1), base - h * .78], [x + (w >> 1), base]], c[2]);
    fg.vline(x - (w >> 1) + 1, base - h * .7, base - 3, c[0]); fg.line(x - (w >> 1), Math.round(base - h * .78), x, Math.round(base - h), c[0]);
  }
  const gl = [], rgl = mulberry32(44), bxr = W - S1(14), bb = H + 2;
  big(bxr - 4, bb, S1(36), S1(9), PK); big(bxr - 18, bb, S1(14), S1(7), CY); big(bxr + 6, bb, S1(18), S1(7), CY);
  gl.push([bxr - 4, bb - S1(20), 22, '#ff60d8', 80, 25], [bxr - 18, bb - S1(8), 14, '#40d0ff', 70, 0]);
  for (const d of [-1, 1]) for (const u of outward(d * 60, d, limit, 30, 60, rgl)) {
    if (d < 0 && u > -40) continue;
    const c = rgl() < .5 ? CY : PK, h = randint(rgl, 14, 32);
    fg.poly([[U(u) - 14, H + 2], [U(u), Y(196)], [U(u) + 14, H + 2]], dark);
    big(U(u), Y(randint(rgl, 198, 204)), h, Math.round(h * .28) + 3, c); gl.push([U(u), Y(190) - h * .4, 14, c === CY ? '#40d0ff' : '#ff60d8', randint(rgl, 60, 90), randint(rgl, 0, 60)]);
  }
  const fgC = fg.canvas();
  const motes = makeMotes(r, Math.round(44 * W / 128), W, { y0: Y(70), y1: Y(190), colors: ['#60f0ff', '#ff80e0', '#ffd070', '#c0a8ff'], rise: .18, amp: [2, 5], big: .2 });
  const ov = new Overlay(W, H);
  const crown = [tx, Y(48)];

  return {
    draw(ctx, f) {
      ctx.drawImage(skyC, 0, 0);
      drawStars(ctx, stars, f);
      drawSparkles(ctx, spark, f, '#ffffff');
      ctx.drawImage(moon, moonX - (moon.width >> 1), moonY - (moon.height >> 1));
      auroraDraw(f); ovA.flush(ctx, 0, 0, W, aurH);
      // дирижабль
      const P = W + 2 * shipM, sx = Math.floor(((r0 + shipV * f) % P + P) % P) - shipM;
      ctx.drawImage(ship, sx, shipY);
      glowPulse(ov, sx + 35, shipY + 29, 9, '#40e8ff', f, { per: 40, strength: .8, lo: .5 });
      ov.flush(ctx, Math.max(0, sx + 24), shipY + 20, Math.min(W, sx + 47), shipY + 40);
      ctx.drawImage(islC, 0, 0);
      drawCloudRows(ctx, strips, f, W);
      ctx.drawImage(farC, 0, 0);
      ctx.drawImage(midC, 0, 0);
      ctx.drawImage(pipesC, 0, 0);
      ctx.drawImage(twC, 0, 0);
      // кристалл на башне: искры энергии вокруг
      for (let k = 0; k < 4; k++) {
        const a = TP * (f / 60 + k / 4), x = Math.round(crown[0] + 8 * Math.cos(a)), y = Math.round(crown[1] + 3 * Math.sin(a));
        ctx.fillStyle = k & 1 ? '#c8ffff' : '#50e0ff'; ctx.fillRect(x, y, 1, 1);
      }
      for (const [x, y, c, per, ph] of wins) if (tri(f, per, ph) > .16) { ctx.fillStyle = WC[c]; ctx.fillRect(x, y, 1, 2); }
      // стрелки часов
      ctx.fillStyle = '#80f0ff';
      const am = TP * f / 600 - Math.PI / 2;
      for (let k = 1; k <= 5; k++) ctx.fillRect(Math.round(tx + k * Math.cos(am)), Math.round(cyc + k * Math.sin(am)), 1, 1);
      const ah = TP * f / 7200 - Math.PI / 2;
      for (let k = 1; k <= 3; k++) ctx.fillRect(Math.round(tx + k * Math.cos(ah)), Math.round(cyc + k * Math.sin(ah)), 1, 1);
      for (const g of gears) { g.spr.clear(); gear(g.spr, g.c, g.c, g.r, g.t, g.dir * g.sp * f, g.col, { hi: g.hi, hub: '#e0b058', spokes: 6 }); g.spr.draw(ctx, g.x - g.c, g.y - g.c); }
      // энергия бежит по трубам
      for (const p of paths) {
        const n = p.pt.length, i = Math.floor((p.off + p.sp * f) % n);
        for (let k = 0; k < 3; k++) { const q = p.pt[(i - k + n) % n]; ctx.fillStyle = k === 0 ? '#d8ffff' : k === 1 ? '#60e8ff' : '#2aa8d0'; ctx.fillRect(q[0], q[1], 1, 1); }
      }
      for (const [x, y] of joints) glowPulse(ov, x, y, 5, '#40e8ff', f, { per: 60, ph: x, strength: .55, lo: .45 });
      ov.flush(ctx, 0, Y(120), W, H);
      for (const g of floaters) {
        const a = TP * (f / 120 + g.ph), x = Math.round(g.x + g.rx * Math.cos(a)), y = Math.round(g.y + g.ry * Math.sin(a));
        ctx.drawImage(gemSpr[g.c], x - 3, y - 10);
        if (tri(f, 48, g.ph * 90) > .85) { ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 1, y - 7, 3, 1); ctx.fillRect(x, y - 8, 1, 3); }
      }
      fog(ov, f, { y0: Y(150), y1: H, color: '#a070e0', strength: .26, speed: .3, fade: 'mid', levels: 3 });
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
      makeMotes, drawMotes, cloudRow, drawCloudRows, glowPulse, fog, crystalGem, gear, pine, outward, drawBird, bay, clamp, tri } = px;
    const r = mulberry32(101), xc = W / 2, TP = 2 * Math.PI;
    const sc = clamp(W / 128, .7, 1), S1 = n => Math.round(n * sc);
    const sunX = U(32), sunY = Ys(30);

    /* ---------- небо и солнце ---------- */
    const sky = new Layer(W, H);
    gradient(sky, ['#4a98ec', '#6cb0f2', '#8ec8f6', '#b0def8', '#d0ecfa', '#e8f4fc', '#f6f0fc'], 0, Y(150));
    addGlow(sky, sunX, sunY, 8, 58, '#fff2c0', .7, 5, 1.5);
    sunDisc(sky, sunX, sunY, [[9, '#ffe27a'], [7, '#fff2a8'], [5, '#ffffff']]);
    const skyC = sky.canvas();
    const white = ['#f6f9fe', '#b4c8e6', '#ffffff'], candy = ['#fff0fa', '#e8b8e0', '#ffffff'];
    const rowsHi = [cloudRow({ sizes: [[44, 10], [34, 9], [50, 11]], seed: 11, cols: white, y: Ys(16), v: .22, gap: 118, off: 40 }),
      cloudRow({ sizes: [[36, 9], [46, 10]], seed: 23, cols: white, y: Ys(66), v: .3, gap: 108, off: 80 })];
    const strips = [cloudRow({ sizes: [[60, 7], [44, 6]], seed: 9, cols: candy, y: Y(104), v: .12, gap: 150, off: 70 }),
      cloudRow({ sizes: [[50, 6], [38, 6]], seed: 21, cols: candy, y: Y(122), v: .16, gap: 130, off: 10 })];
    const spark = makeSparkles(r, Math.round(3 * W / 128) + 1, W, Ys(8), Ys(70));
    const flock = [[0, 0], [-6, -2], [-6, 3], [-12, -4], [-12, 5]], flockX = r() * (W + 90), flockY = Ys(78);

    /* ---------- остров ---------- */
    const wins = [], WC = ['#7a9ad8', '#8aaae0', '#9af8ff'];
    const isl = new Layer(W, H), ri = mulberry32(17);
    function island(L, cx, y, w, depth, tH, trees) {
      const x0 = Math.round(cx - w / 2), x1 = Math.round(cx + w / 2);
      L.poly([[x0, y + 4], [x1, y + 4], [Math.round(cx) + 2, y + 4 + depth]], '#d0c0ee');
      L.poly([[Math.round(cx), y + 4], [x1, y + 4], [Math.round(cx) + 2, y + 4 + depth]], '#a898d0');
      L.line(x0, y + 4, Math.round(cx) + 2, y + 4 + depth, '#f4ecff');
      L.rect(x0, y, x1, y + 3, '#5ad070'); L.hline(x0, x1, y, '#a8f488'); L.hline(x0, x1, y + 3, '#3aa858');
      for (const t of trees) pine(L, Math.round(cx + t[0]), y, t[1], '#2c9a4c', '#7ae070', 7, 3);
      if (tH) {
        const bx = Math.round(cx + 2);
        L.rect(bx - 3, y - tH, bx + 3, y, '#f0e6ff'); L.vline(bx - 3, y - tH, y, '#ffffff'); L.vline(bx + 3, y - tH, y, '#b8a8dc');
        L.poly([[bx - 5, y - tH], [bx + 5, y - tH], [bx, y - tH - 10]], '#d88a3a'); L.poly([[bx - 5, y - tH], [bx, y - tH], [bx, y - tH - 10]], '#f8b868');
        crystalGem(L, bx, y - tH - 10, '#e0ffff', '#50e0ff', '#2090c8', 6, 3);
        L.rect(bx - 1, y - tH + 6, bx, y - tH + 8, '#8ab0e8'); L.px(bx + 1, y - tH + 11, '#8ab0e8');
      }
    }
    const il = Math.round(U(-30)), iyl = Y(100);
    island(isl, il, iyl, S1(46) + 4, 20, 24, [[-16, 11], [-11, 8], [14, 9]]);
    for (const d of [-1, 1]) for (const u of outward(d * 62, d, limit, 44, 80, ri)) island(isl, Math.round(U(u)), Y(randint(ri, 60, 126)), randint(ri, 16, 26), randint(ri, 8, 14), ri() < .5 ? randint(ri, 10, 18) : 0, [[-4, randint(ri, 6, 9)]]);
    const islC = isl.canvas();

    /* ---------- шпили с медными кольцами ---------- */
    function spireRow(base, hmin, hmax, step, body, roof, roof2, edge, seed, bright) {
      const L = new Layer(W, H), rg = mulberry32(seed); let n = 0;
      for (let x = -8; x < W + 10; x += randint(rg, step[0], step[1])) {
        const w = randint(rg, 8, 14), h = randint(rg, hmin, hmax), top = base - h, xx = Math.round(x), rc = (n++ % 3 === 0) ? roof2 : roof;
        L.rect(xx - (w >> 1), top, xx + (w >> 1), base + 20, body);
        L.poly([[xx - (w >> 1) - 1, top], [xx + (w >> 1) + 1, top], [xx + Math.round((rg() - .5) * 2), top - randint(rg, 12, 26)]], rc);
        L.vline(xx - (w >> 1), top, base, edge);
        if (bright) {
          for (let y = top + 8; y < base; y += randint(rg, 12, 18)) L.hline(xx - (w >> 1), xx + (w >> 1), y, '#e09838');
          for (let k = 0; k < Math.floor(h / 10); k++) if (rg() < .45) wins.push([xx - 1 + (rg() < .5 ? -2 : 1), top + 5 + k * 9, randint(rg, 0, 2), pick(rg, [60, 90, 120, 180]), randint(rg, 0, 120)]);
        }
      }
      return L.canvas();
    }
    const farC = spireRow(Y(176), 24, 54, [8, 14], '#cabfee', '#dcd0f8', '#f2c898', '#ece4fc', 4, false);
    const midC = spireRow(Y(190), 30, 62, [10, 17], '#a89cdc', '#c4b6ee', '#e8a860', '#d4c8f6', 9, true);

    /* ---------- башня с часами ---------- */
    const tx = Math.round(U(18)), cyc = Y(93), tw = new Layer(W, H);
    tw.rect(tx - 10, Y(77), tx + 10, Y(205), '#b4a6e4'); tw.vline(tx - 10, Y(77), Y(205), '#f0eaff'); tw.vline(tx + 10, Y(77), Y(205), '#8678c0');
    tw.poly([[tx - 12, Y(77)], [tx + 12, Y(77)], [tx, Y(60)]], '#d88a3a'); tw.poly([[tx - 12, Y(77)], [tx, Y(77)], [tx, Y(60)]], '#f8b868'); tw.line(tx - 12, Y(77), tx, Y(60), '#ffe0a8');
    tw.vline(tx, Y(55), Y(60), '#e8b040');
    crystalGem(tw, tx, Y(56), '#e8ffff', '#50e0ff', '#2090c8', 14, 5);
    for (const yy of [Y(109), Y(137), Y(165)]) { tw.rect(tx - 11, yy, tx + 11, yy + 2, '#e09838'); tw.hline(tx - 11, tx + 11, yy, '#ffd070'); }
    tw.disc(tx, cyc, 9, '#e09838'); tw.disc(tx, cyc, 7, '#f6f0e0'); tw.disc(tx, cyc, 6, '#fffaf0');
    for (let k = 0; k < 12; k++) { const a = TP * k / 12; tw.px(Math.round(tx + 5 * Math.sin(a)), Math.round(cyc - 5 * Math.cos(a)), '#7a6aa8'); }
    for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) if (r() < .45) { const wx = tx - 6 + i * 6, wy = Y(141) + j * 6; if (wy < Y(162)) wins.push([wx, wy, 0, pick(r, [60, 90, 120]), randint(r, 0, 100)]); }
    for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (r() < .5) { const wx = tx - 6 + i * 6, wy = Y(170) + j * 7; wins.push([wx, wy, randint(r, 0, 2), pick(r, [60, 90, 120]), randint(r, 0, 100)]); }
    const twC = tw.canvas();

    /* ---------- медные трубы ---------- */
    const pipes = new Layer(W, H), paths = [], joints = [];
    function pipe(pts) {
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
        pipes.rect(Math.min(x0, x1), Math.min(y0, y1), Math.max(x0, x1) + (y0 === y1 ? 0 : 1), Math.max(y0, y1) + (y0 === y1 ? 1 : 0), '#d8883a');
        pipes.line(x0, y0, x1, y1, '#ffc878');
      }
      for (const [x, y] of pts) { pipes.disc(x, y, 2, '#b86a28'); pipes.px(x, y, '#ffd890'); joints.push([x, y]); }
      const pt = [];
      for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let k = 0; k < n; k++) pt.push([x0 + Math.round((x1 - x0) * k / n), y0 + Math.round((y1 - y0) * k / n)]); }
      paths.push({ pt, sp: .9 + r() * .5, off: randint(r, 0, 90) });
    }
    const px0 = n => Math.round(U(n));
    pipe([[px0(-64), Y(160)], [px0(-24), Y(160)], [px0(-24), Y(143)], [tx - 11, Y(143)]]);
    pipe([[tx + 11, Y(151)], [px0(40), Y(151)], [px0(40), Y(168)]]);
    const rp = mulberry32(70);
    for (const d of [-1, 1]) for (const u of outward(d * 58, d, limit, 40, 70, rp)) { const x0 = px0(u), len = randint(rp, 18, 36) * (rp() < .5 ? 1 : -1), y0 = Y(randint(rp, 148, 168)); pipe([[x0, y0], [x0 + len, y0], [x0 + len, y0 + randint(rp, 8, 16)]]); }
    const pipesC = pipes.canvas();

    /* ---------- шестерни с рунами, дирижабль, камни ---------- */
    const gears = [
      { x: tx, y: Y(123), r: 8, t: 10, dir: 1, col: '#d09a38', hi: '#ffe090', rune: true },
      { x: il - 12, y: iyl + 12, r: 10, t: 10, dir: -1, col: '#c88e34', hi: '#f8d070', rune: true },
      { x: S1(8), y: H + 4, r: 22, t: 14, dir: 1, col: '#a8782c', hi: '#e0b058', rune: false },
    ];
    gears.forEach(g => { g.c = g.r + 5; g.spr = new Layer(2 * g.c + 1, 2 * g.c + 1); g.sp = TP / (g.t * 40); });
    const ship = (() => {
      const L = new Layer(70, 40), x0 = 6, x1 = 64, h = 16, oy = 12;
      L.ellipseBox(x0, oy, x1, oy + h, '#6a84c8');
      for (let y = oy; y <= oy + h; y++) for (let x = x0; x <= x1; x++) if (L.has(x, y)) { if (y < oy + h * .3) L.px(x, y, '#8aa4e0'); else if (y > oy + h * .78) L.px(x, y, '#4a64a8'); }
      L.hline(x0 + 5, x1 - 5, oy + Math.round(h * .62), '#e8b040');
      L.poly([[0, oy + 2], [x0 + 6, oy + 5], [x0 + 6, oy + 12], [4, oy + h + 2]], '#4a64a8');
      L.poly([[30, oy + 1], [40, oy + 1], [35, oy - 11]], '#ff70b8'); L.poly([[30, oy + 1], [35, oy + 1], [35, oy - 11]], '#ffa8d4');
      L.vline(35, oy + h + 1, oy + h + 6, '#e8b040'); L.px(35, oy + h + 8, '#ffffff'); L.px(34, oy + h + 8, '#50e0ff'); L.px(36, oy + h + 8, '#50e0ff'); L.px(35, oy + h + 7, '#50e0ff'); L.px(35, oy + h + 9, '#2090c8');
      return L.canvas();
    })();
    const shipY = Ys(50), shipV = .3, shipM = 90, r0 = r() * (W + 2 * shipM);
    const gemSpr = {
      pink: (() => { const L = new Layer(7, 11); crystalGem(L, 3, 10, '#ffe0f8', '#ff80d8', '#c040a0', 9, 2); return L.canvas(); })(),
      cyan: (() => { const L = new Layer(7, 11); crystalGem(L, 3, 10, '#e8ffff', '#60e8ff', '#2898d0', 9, 2); return L.canvas(); })(),
    };
    const floaters = [[-58, 122, 'pink', 0], [-29, 123, 'pink', .3], [-21, 127, 'cyan', .55], [-11, 110, 'pink', .8], [4, 127, 'pink', .15], [33, 94, 'cyan', .4], [43, 113, 'pink', .65], [53, 110, 'cyan', .9]]
      .map(([u, y, c, ph]) => ({ x: U(u), y: Y(y), c, ph, rx: 2 + (ph * 10 | 0) % 3, ry: 2 }));
    for (const d of [-1, 1]) for (const u of outward(d * 62, d, limit, 20, 44, ri)) floaters.push({ x: U(u), y: Y(randint(ri, 100, 150)), c: ri() < .5 ? 'pink' : 'cyan', ph: ri(), rx: 3, ry: 2 });

    /* ---------- передний план ---------- */
    const fg = new Layer(W, H), dark = '#6a5a9c';
    fg.poly([[W + 2, H + 2], [W + 2, Y(168)], [W - S1(16), Y(176)], [W - S1(32), H + 2]], dark);
    const CY = ['#c8fcff', '#40c4f0', '#2078c0'], PK = ['#ffd0f0', '#f060c8', '#b030a0'];
    function big(x, base, h, w, c) {
      x = Math.round(x); base = Math.round(base);
      fg.poly([[x - (w >> 1), base], [x - (w >> 1), base - h * .78], [x, base - h], [x, base]], c[1]);
      fg.poly([[x, base], [x, base - h], [x + (w >> 1), base - h * .78], [x + (w >> 1), base]], c[2]);
      fg.vline(x - (w >> 1) + 1, base - h * .7, base - 3, c[0]); fg.line(x - (w >> 1), Math.round(base - h * .78), x, Math.round(base - h), c[0]);
    }
    const gl = [], rgl = mulberry32(44), bxr = W - S1(14), bb = H + 2;
    big(bxr - 4, bb, S1(36), S1(9), PK); big(bxr - 18, bb, S1(14), S1(7), CY); big(bxr + 6, bb, S1(18), S1(7), CY);
    gl.push([bxr - 4, bb - S1(20), 16, '#ffa0e8', 80, 25], [bxr - 18, bb - S1(8), 10, '#80f0ff', 70, 0]);
    for (const d of [-1, 1]) for (const u of outward(d * 60, d, limit, 30, 60, rgl)) {
      if (d < 0 && u > -40) continue;
      const c = rgl() < .5 ? CY : PK, h = randint(rgl, 14, 32);
      fg.poly([[U(u) - 14, H + 2], [U(u), Y(196)], [U(u) + 14, H + 2]], dark);
      big(U(u), Y(randint(rgl, 198, 204)), h, Math.round(h * .28) + 3, c); gl.push([U(u), Y(190) - h * .4, 10, c === CY ? '#80f0ff' : '#ffa0e8', randint(rgl, 60, 90), randint(rgl, 0, 60)]);
    }
    const fgC = fg.canvas();
    const motes = makeMotes(r, Math.round(40 * W / 128), W, { y0: Y(70), y1: Y(190), colors: ['#ffe880', '#ffb8e8', '#a8e8ff', '#ffffff'], rise: .16, amp: [2, 5], big: .22 });
    const ov = new Overlay(W, H);
    const crown = [tx, Y(48)];

    return {
      draw(ctx, f) {
        ctx.drawImage(skyC, 0, 0);
        drawCloudRows(ctx, rowsHi, f, W);
        drawSparkles(ctx, spark, f, '#ffffff');
        const fxp = Math.floor(((flockX + .28 * f) % (W + 90) + W + 90) % (W + 90)) - 45;
        flock.forEach(([dx, dy], i) => drawBird(ctx, fxp + dx, flockY + dy + Math.round(Math.sin(TP * f / 70 + i)), (((f >> 2) + i) & 1) === 1, '#6a5aa0'));
        const P = W + 2 * shipM, sx = Math.floor(((r0 + shipV * f) % P + P) % P) - shipM;
        ctx.drawImage(ship, sx, shipY);
        glowPulse(ov, sx + 35, shipY + 29, 7, '#80f0ff', f, { per: 40, strength: .5, lo: .5 });
        ov.flush(ctx, Math.max(0, sx + 26), shipY + 22, Math.min(W, sx + 45), shipY + 38);
        ctx.drawImage(islC, 0, 0);
        drawCloudRows(ctx, strips, f, W);
        ctx.drawImage(farC, 0, 0);
        ctx.drawImage(midC, 0, 0);
        ctx.drawImage(pipesC, 0, 0);
        ctx.drawImage(twC, 0, 0);
        for (let k = 0; k < 4; k++) {
          const a = TP * (f / 60 + k / 4), x = Math.round(crown[0] + 8 * Math.cos(a)), y = Math.round(crown[1] + 3 * Math.sin(a));
          ctx.fillStyle = k & 1 ? '#ffffff' : '#70f0ff'; ctx.fillRect(x, y, 1, 1);
        }
        if (tri(f, 44, 0) > .8) { ctx.fillStyle = '#ffffff'; ctx.fillRect(tx - 3, Y(48), 7, 1); ctx.fillRect(tx, Y(45), 1, 7); }
        for (const [x, y, c, per, ph] of wins) { ctx.fillStyle = tri(f, per, ph) > .93 ? '#ffffff' : WC[c]; ctx.fillRect(x, y, 1, 2); }
        ctx.fillStyle = '#3a2a48';
        const am = TP * f / 600 - Math.PI / 2;
        for (let k = 1; k <= 5; k++) ctx.fillRect(Math.round(tx + k * Math.cos(am)), Math.round(cyc + k * Math.sin(am)), 1, 1);
        const ah = TP * f / 7200 - Math.PI / 2;
        for (let k = 1; k <= 3; k++) ctx.fillRect(Math.round(tx + k * Math.cos(ah)), Math.round(cyc + k * Math.sin(ah)), 1, 1);
        for (const g of gears) {
          g.spr.clear(); const ang = g.dir * g.sp * f;
          gear(g.spr, g.c, g.c, g.r, g.t, ang, g.col, { hi: g.hi, hub: '#ffe090', spokes: 6 });
          if (g.rune) for (let k = 0; k < 3; k++) { const a = ang + TP * k / 3 + .5, rr = g.r - 1.2; g.spr.px(Math.round(g.c + rr * Math.cos(a)), Math.round(g.c + rr * Math.sin(a)), '#7af0ff'); }
          g.spr.draw(ctx, g.x - g.c, g.y - g.c);
        }
        for (const p of paths) {
          const n = p.pt.length, i = Math.floor((p.off + p.sp * f) % n);
          for (let k = 0; k < 3; k++) { const q = p.pt[(i - k + n) % n]; ctx.fillStyle = k === 0 ? '#ffffff' : k === 1 ? '#80f4ff' : '#30c4e8'; ctx.fillRect(q[0], q[1], 1, 1); }
        }
        for (const g of floaters) {
          const a = TP * (f / 120 + g.ph), x = Math.round(g.x + g.rx * Math.cos(a)), y = Math.round(g.y + g.ry * Math.sin(a));
          ctx.drawImage(gemSpr[g.c], x - 3, y - 10);
          if (tri(f, 48, g.ph * 90) > .85) { ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 1, y - 7, 3, 1); ctx.fillRect(x, y - 8, 1, 3); }
        }
        fog(ov, f, { y0: Y(150), y1: H, color: '#fff0fa', strength: .28, speed: .3, fade: 'mid', levels: 3 });
        ov.flush(ctx, 0, Y(150), W, H);
        ctx.drawImage(fgC, 0, 0);
        for (const [x, y, rad, col, per, ph] of gl) glowPulse(ov, x, y, rad, col, f, { per, ph, strength: .3, lo: .5 });
        ov.flush(ctx, 0, Y(120), W, H);
        drawMotes(ctx, motes, f);
      },
    };
  }
/* ===== END ===== */
  PixelBG.register('city_hybrid', function (env) { return env.day ? buildDay(env) : buildNight(env); });
})();
