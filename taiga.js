/* Тайга: полярное сияние, лунный месяц, заснеженный лес, хижина с тёплым окном и дымом, сугробы, снегопад.
 * Два варианта: buildNight (вечер/ночь) и buildDay (день); выбор по env.variant. */
(function () {
  function buildNight(env) {
  const { W, H, Y, Ys, U, limit, px } = env;
  const { C, Layer, Overlay, mulberry32, randint, gradient, addGlow, makeRidge, peakRidge, hill, outward,
    moonSprite, makeStars, drawStars, makeMotes, drawMotes, glowPulse, aurora, smokeColumn } = px;
  const r = mulberry32(47), xc = W / 2;
  const moonX = U(-42), moonY = Ys(28);

  /* ---------- небо, луна, звёзды ---------- */
  const sky = new Layer(W, H);
  gradient(sky, ['#060a22', '#0a1234', '#0e1a48', '#12225a', '#16296a', '#1b3074', '#203878'], 0, Y(116));
  addGlow(sky, moonX, moonY, 6, 34, '#7a8ee0', .34, 4, 1.6);
  const skyC = sky.canvas();
  const moon = moonSprite(9, ['#c8d8f8', '#eef4ff', '#ffffff'], true);
  const stars = makeStars(r, Math.round(80 * W / 128), W, Y(112), { avoid: (x, y) => Math.hypot(x - moonX, y - moonY) < 14 });
  // kx — изгибов на 128 px, ke — «занавесей» на 128 px (дробные, чтобы на широком экране узор не повторялся)
  const ribbons = [
    { yc: Ys(50), amp: Ys(9), kx: .7, ke: .5, sk: .6, wid: Ys(24), strength: .85, color: '#38ecc0', ph: .4 },
    { yc: Ys(28), amp: Ys(10), kx: 1.1, ke: .7, sk: -.5, wid: Ys(20), strength: .62, color: '#a074ff', ph: 2.1 },
    { yc: Ys(60), amp: Ys(7), kx: .45, ke: .4, sk: .4, wid: Ys(18), strength: .5, color: '#40c8e8', ph: 4.0 },
  ];
  const ovA = new Overlay(W, H), aurH = Ys(88), TP = 2 * Math.PI;
  const LUT = new Float32Array(257);                      // профиль занавеси: u от -.8 до 3
  for (let i = 0; i <= 256; i++) { const u = -.8 + 3.8 * i / 256; LUT[i] = u >= 0 ? Math.exp(-u * 1.3) : Math.exp(-(u * 3.5) * (u * 3.5)); }
  const ribCols = ribbons.map(rb => C(rb.color));
  function auroraDraw(f) {
    ribbons.forEach((rb, k) => {
      const col = ribCols[k];
      for (let x = 0; x < W; x++) {
        const xr = (x - xc) / 128, th = TP * (rb.kx * xr + rb.sk * f / 120) + rb.ph;
        const cy = rb.yc + rb.amp * Math.sin(th) + .45 * rb.amp * Math.sin(2 * th + 1.3);
        const en = .4 + .6 * (.5 + .5 * Math.sin(TP * (rb.ke * xr + rb.sk * f / 120) + rb.ph * 1.7));
        const rays = .8 + .2 * Math.sin(TP * (20 * xr + rb.sk * f / 120)), k0 = rb.strength * en * rays;
        for (let y = Math.max(0, Math.floor(cy - 3 * rb.wid)); y < Math.min(aurH, Math.ceil(cy + .8 * rb.wid)); y++) {
          const u = (cy - y) / rb.wid;
          const a = k0 * LUT[((u + .8) * 256 / 3.8) | 0];
          if (a < .03) continue;
          const q = Math.floor(a * 4 + px.bay(x, y)) / 4;
          if (q > 0) ovA.over(x, y, col, q > 1 ? 1 : q);
        }
      }
    });
  }

  /* ---------- дальние горы и лес ---------- */
  const mount = new Layer(W, H), rm = mulberry32(9);
  const peaks = [[-6, 9, 22], [16, 6, 16]];
  for (const d of [-1, 1]) for (const u of outward(d * 30, d, limit, 34, 70, rm)) peaks.push([u, randint(rm, 6, 14), randint(rm, 14, 26)]);
  hill(mount, peakRidge(xc, Y(121), peaks, 3, 1.2), { lit: '#4a68a8', shade: '#243e7c', deep: '#1a2e68', rim: '#8aa8e0', lightX: -1e9, k: 1, lean: 0, depth: 14 });
  function fir(L, x, base, h, w, body, snow, lit, nt) {
    const tiers = nt || Math.max(3, Math.round(h / 5)), step = h / tiers;
    for (let i = tiers - 1; i >= 0; i--) {
      const yt = base - h + i * step, yb = yt + step * 1.7, wi = w * (i + 1) / tiers;
      L.poly([[x - wi / 2, yb], [x + wi / 2, yb], [x, yt]], body);
      if (snow) { const sy = yt + step * .75, sw = wi * ((sy - yt) / (yb - yt)); L.poly([[x - sw / 2, sy], [x + sw / 2, sy], [x, yt]], snow); }
      if (lit) L.line(x, yt, x - wi / 2, yb, lit);
    }
    L.rect(x - 1, base - 2, x, base, body);
  }
  const forest = new Layer(W, H), rf = mulberry32(14);
  [[126, '#3c5a9c', '#a8c0f0'], [131, '#4466a6', '#b4ccf4'], [136, '#4c70b0', '#c4d8fa'], [141, '#5478b8', '#d0e0ff'], [146, '#5c80c0', '#dce8ff']].forEach(([b, body, snow], k) => {
    for (let x = -6 - (k * 3) % 8; x < W + 10; x += randint(rf, 7, 10)) fir(forest, x, Y(b), randint(rf, 12, 17), randint(rf, 9, 11), body, snow, null);
  });
  const ground = new Layer(W, H);                                   // тёмная полоса земли под лесом
  gradient(ground, ['#12244a', '#0e1c3c', '#0a1634'], Y(147), Y(172));
  for (let y = 0; y < Y(147); y++) for (let x = 0; x < W; x++) ground.erase(x, y);

  /* ---------- хижина ---------- */
  const cx = U(31), cb = Y(153), wx = cx - 5, wy = cb - 9;
  const cab = new Layer(W, H);
  cab.rect(cx - 9, cb - 11, cx + 9, cb, '#6a4630');
  for (let y = cb - 9; y <= cb; y += 3) cab.hline(cx - 9, cx + 9, y, '#54362a');
  cab.vline(cx - 9, cb - 11, cb, '#8a6244'); cab.vline(cx + 9, cb - 11, cb, '#46301f');
  cab.rect(cx + 3, cb - 8, cx + 6, cb, '#3a2418');                            // дверь
  cab.rect(cx + 5, cb - 24, cx + 8, cb - 14, '#4a3228'); cab.rect(cx + 4, cb - 25, cx + 9, cb - 24, '#dce8ff');   // труба со снежной шапкой
  cab.poly([[cx - 12, cb - 10], [cx + 12, cb - 10], [cx, cb - 24]], '#dce8ff');
  cab.hline(cx - 12, cx + 12, cb - 10, '#a8c0f0'); cab.hline(cx - 10, cx + 10, cb - 9, '#7a94d0');
  cab.rect(wx, wy, wx + 3, wy + 5, '#2a1a10'); cab.rect(wx + 1, wy + 1, wx + 2, wy + 4, '#ffc060'); cab.vline(wx + 1, wy + 1, wy + 4, '#ffe090');
  addGlow(cab, wx + 1, wy + 2, 3, 15, '#ff9a40', .5, 4, 1.4);
  const smokeX = cx + 6, smokeY = cb - 26;

  /* ---------- сугробы и ёлки переднего плана ---------- */
  const snow = new Layer(W, H);
  hill(snow, makeRidge(xc, Y(172), [[120, 5], [50, 2.5]], 21), { lit: '#d8e4ff', shade: '#7a94d0', deep: '#4a5ea0', rim: '#ffffff', lightX: -1e9, k: 1.1, lean: .5, depth: 20 });
  hill(snow, makeRidge(xc, Y(182), [[70, 3], [36, 1.5]], 31), { lit: '#c0d0f4', shade: '#6a82c4', deep: '#3e5294', rim: '#e8f0ff', lightX: -1e9, k: 1.1, lean: .5, depth: 14 });
  const front = new Layer(W, H), rt = mulberry32(61);
  const dark = '#0a1432', rimF = '#3a5aa0';
  fir(front, U(-52), Y(200), 88, 36, dark, null, rimF, 9);
  fir(front, U(58), Y(198), 56, 28, dark, null, rimF, 7);
  for (const d of [-1, 1]) for (const u of outward(d * 66, d, limit, 44, 90, rt)) {
    const h = randint(rt, 40, 96); fir(front, U(u), Y(randint(rt, 190, 204)), h, Math.round(h * .4), dark, null, rimF, Math.max(5, Math.round(h / 10)));
  }
  const mountC = mount.canvas(), forestC = forest.canvas(), groundC = ground.canvas(), cabC = cab.canvas(), snowC = snow.canvas(), frontC = front.canvas();

  /* ---------- снег, блики, свечение окна ---------- */
  const flakes = [], rs = mulberry32(5), nF = Math.round(70 * W / 128);
  for (let i = 0; i < nF; i++) flakes.push({ x: rs() * W, y: rs() * H, vy: [.6, .9, 1.2][Math.floor(rs() * 3)], vx: .3, ph: rs() * 6, big: rs() < .15, c: rs() < .4 ? '#ffffff' : '#c8d8ff' });
  const glints = makeMotes(r, Math.round(12 * W / 128), W, { y0: Y(160), y1: Y(190), colors: ['#ffffff', '#c8e0ff'], rise: 0, amp: [0, 1], big: .3 });
  const ovW = new Overlay(W, H);

  return {
    draw(ctx, f) {
      ctx.drawImage(skyC, 0, 0);
      drawStars(ctx, stars, f);
      ctx.drawImage(moon, moonX - (moon.width >> 1), moonY - (moon.height >> 1));
      auroraDraw(f);
      ovA.flush(ctx, 0, 0, W, aurH);
      ctx.drawImage(mountC, 0, 0);
      ctx.drawImage(forestC, 0, 0);
      ctx.drawImage(groundC, 0, 0);
      ctx.drawImage(cabC, 0, 0);
      glowPulse(ovW, wx + 1, wy + 2, 14, '#ff9a40', f, { per: 40, strength: .45, lo: .65 });
      ovW.flush(ctx, Math.max(0, wx - 15), wy - 12, Math.min(W, wx + 17), Math.min(H, wy + 16));
      smokeColumn(ctx, smokeX, smokeY, f, { n: 5, rise: 34, per: 120, sway: 2, r0: 1, r1: 3.5, wind: 4, cols: ['#8a9cc8', '#6a7cb0', '#4a5c98'] });
      ctx.drawImage(snowC, 0, 0);
      drawMotes(ctx, glints, f);
      ctx.drawImage(frontC, 0, 0);
      for (const s of flakes) {
        const x = Math.floor(((s.x + s.vx * f + 1.5 * Math.sin(f / 18 + s.ph)) % W + W) % W), y = Math.floor(((s.y + s.vy * f) % H + H) % H);
        ctx.fillStyle = s.c; ctx.fillRect(x, y, 1, 1);
        if (s.big) { ctx.fillStyle = '#a8bce8'; ctx.fillRect(x + 1, y, 1, 1); ctx.fillRect(x, y + 1, 1, 1); }
      }
    },
  };
}
/* ===== DAY ===== */
  function buildDay(env) {
    const { W, H, Y, Ys, U, limit, px } = env;
    const { Layer, Overlay, mulberry32, randint, gradient, addGlow, sunDisc, makeRidge, peakRidge, hill, outward,
      makeMotes, drawMotes, glowPulse, smokeColumn, fog, cloudRow, drawCloudRows, drawBird } = px;
    const r = mulberry32(47), xc = W / 2;
    const sunX = U(-30), sunY = Ys(54);

    /* ---------- небо и низкое белое солнце ---------- */
    const sky = new Layer(W, H);
    gradient(sky, ['#3f84dc', '#5a9ae6', '#7cb4ee', '#9ccaf4', '#bcdcf8', '#d6ecfc', '#eaf6ff'], 0, Y(116));
    addGlow(sky, sunX, sunY, 6, 52, '#fff2c8', .75, 5, 1.5);
    addGlow(sky, sunX, sunY, 6, 90, '#fff8e0', .35, 4, 1.8);
    sunDisc(sky, sunX, sunY, [[7, '#ffe9a0'], [6, '#fff4c8'], [4, '#ffffff']]);
    const skyC = sky.canvas();
    const rows = [
      cloudRow({ sizes: [[44, 10], [34, 9], [50, 11]], seed: 3, cols: ['#f6f9fe', '#b4c8e6', '#ffffff'], y: Ys(18), v: .16, gap: 120, off: 14 }),
      cloudRow({ sizes: [[36, 9], [46, 10]], seed: 12, cols: ['#f6f9fe', '#b4c8e6', '#ffffff'], y: Ys(78), v: .24, gap: 110, off: 70 }),
    ];
    const crows = [[.36, Ys(40), 0], [.26, Ys(62), 3]].map(([v, y, i]) => ({ v, y, x0: r() * (W + 60), i }));

    /* ---------- дальние горы и заснеженный лес ---------- */
    const mount = new Layer(W, H), rm = mulberry32(9);
    const peaks = [[-6, 9, 22], [16, 6, 16]];
    for (const d of [-1, 1]) for (const u of outward(d * 30, d, limit, 34, 70, rm)) peaks.push([u, randint(rm, 6, 14), randint(rm, 14, 26)]);
    hill(mount, peakRidge(xc, Y(121), peaks, 3, 1.2), { lit: '#e6f0fc', shade: '#9ab6e0', deep: '#86a4d6', rim: '#ffffff', lightX: -1e9, k: 1, lean: 0, depth: 14 });
    function fir(L, x, base, h, w, body, snow, lit, nt) {
      const tiers = nt || Math.max(3, Math.round(h / 5)), step = h / tiers;
      for (let i = tiers - 1; i >= 0; i--) {
        const yt = base - h + i * step, yb = yt + step * 1.7, wi = w * (i + 1) / tiers;
        L.poly([[x - wi / 2, yb], [x + wi / 2, yb], [x, yt]], body);
        if (snow) { const sy = yt + step * .75, sw = wi * ((sy - yt) / (yb - yt)); L.poly([[x - sw / 2, sy], [x + sw / 2, sy], [x, yt]], snow); }
        if (lit) L.line(x, yt, x - wi / 2, yb, lit);
      }
      L.rect(x - 1, base - 2, x, base, body);
    }
    const forest = new Layer(W, H), rf = mulberry32(14);
    [[126, '#86b0c4', '#f4f9ff'], [131, '#6a9ca8', '#f4f9ff'], [136, '#4c8890', '#f0f6ff'], [141, '#3a7680', '#eef5ff'], [146, '#2c6470', '#e8f1fd']].forEach(([b, body, snow], k) => {
      for (let x = -6 - (k * 3) % 8; x < W + 10; x += randint(rf, 7, 10)) fir(forest, x, Y(b), randint(rf, 12, 17), randint(rf, 9, 11), body, snow, null);
    });
    const ground = new Layer(W, H);                                   // тень снега под лесом
    gradient(ground, ['#a6bfe2', '#b4caea', '#c4d6f0'], Y(147), Y(172));
    for (let y = 0; y < Y(147); y++) for (let x = 0; x < W; x++) ground.erase(x, y);

    /* ---------- хижина ---------- */
    const cx = U(31), cb = Y(153), wx = cx - 5, wy = cb - 9;
    const cab = new Layer(W, H);
    cab.rect(cx - 9, cb - 11, cx + 9, cb, '#9a6a44');
    for (let y = cb - 9; y <= cb; y += 3) cab.hline(cx - 9, cx + 9, y, '#7a4e32');
    cab.vline(cx - 9, cb - 11, cb, '#c08a5a'); cab.vline(cx + 9, cb - 11, cb, '#62402a');
    cab.rect(cx + 3, cb - 8, cx + 6, cb, '#52341f');
    cab.rect(cx + 5, cb - 24, cx + 8, cb - 14, '#7a5238'); cab.rect(cx + 4, cb - 25, cx + 9, cb - 24, '#ffffff');
    cab.poly([[cx - 12, cb - 10], [cx + 12, cb - 10], [cx, cb - 24]], '#ffffff');
    cab.hline(cx - 12, cx + 12, cb - 10, '#c4d6f4'); cab.hline(cx - 10, cx + 10, cb - 9, '#9ab4e0');
    cab.rect(wx, wy, wx + 3, wy + 5, '#3a2416'); cab.rect(wx + 1, wy + 1, wx + 2, wy + 4, '#e8b868'); cab.vline(wx + 1, wy + 1, wy + 4, '#f8d890');
    const smokeX = cx + 6, smokeY = cb - 26;

    /* ---------- сугробы, ёлки переднего плана ---------- */
    const snow = new Layer(W, H);
    hill(snow, makeRidge(xc, Y(172), [[120, 5], [50, 2.5]], 21), { lit: '#ffffff', shade: '#b0c8f0', deep: '#8aa6d8', rim: '#ffffff', lightX: -1e9, k: 1.1, lean: .5, depth: 20 });
    hill(snow, makeRidge(xc, Y(182), [[70, 3], [36, 1.5]], 31), { lit: '#f2f8ff', shade: '#a4bfec', deep: '#7c98d0', rim: '#ffffff', lightX: -1e9, k: 1.1, lean: .5, depth: 14 });
    const front = new Layer(W, H), rt = mulberry32(61);
    const dark = '#22504e', snowF = '#f2f8ff', litF = '#5a9a8a';
    fir(front, U(-52), Y(200), 88, 36, dark, snowF, litF, 9);
    fir(front, U(58), Y(198), 56, 28, dark, snowF, litF, 7);
    for (const d of [-1, 1]) for (const u of outward(d * 66, d, limit, 44, 90, rt)) {
      const h = randint(rt, 40, 96); fir(front, U(u), Y(randint(rt, 190, 204)), h, Math.round(h * .4), dark, snowF, litF, Math.max(5, Math.round(h / 10)));
    }
    const mountC = mount.canvas(), forestC = forest.canvas(), groundC = ground.canvas(), cabC = cab.canvas(), snowC = snow.canvas(), frontC = front.canvas();

    /* ---------- снег, блики, окно ---------- */
    const flakes = [], rs = mulberry32(5), nF = Math.round(44 * W / 128);
    for (let i = 0; i < nF; i++) flakes.push({ x: rs() * W, y: rs() * H, vy: [.4, .6, .8][Math.floor(rs() * 3)], vx: .2, ph: rs() * 6, big: rs() < .12, c: rs() < .5 ? '#ffffff' : '#e4eeff' });
    const glints = makeMotes(r, Math.round(26 * W / 128), W, { y0: Y(150), y1: Y(194), colors: ['#ffffff', '#ffffff', '#cfeaff', '#fff4c0'], rise: 0, amp: [0, 1], big: .45 });
    const ovW = new Overlay(W, H);

    return {
      draw(ctx, f) {
        ctx.drawImage(skyC, 0, 0);
        drawCloudRows(ctx, rows, f, W);
        for (const b of crows) { const x = Math.floor(((b.x0 + b.v * f) % (W + 60) + W + 60) % (W + 60)) - 30; drawBird(ctx, x, b.y + Math.round(1.5 * Math.sin(f / 22 + b.i)), (((f >> 2) + b.i) & 1) === 1, '#2a3858'); }
        ctx.drawImage(mountC, 0, 0);
        ctx.drawImage(forestC, 0, 0);
        ctx.drawImage(groundC, 0, 0);
        ctx.drawImage(cabC, 0, 0);
        glowPulse(ovW, wx + 1, wy + 2, 6, '#ffc060', f, { per: 60, strength: .35, lo: .6 });
        ovW.flush(ctx, Math.max(0, wx - 7), wy - 5, Math.min(W, wx + 9), Math.min(H, wy + 10));
        smokeColumn(ctx, smokeX, smokeY, f, { n: 5, rise: 34, per: 120, sway: 2, r0: 1, r1: 3.5, wind: 4, cols: ['#f4f6fa', '#d0d8e6', '#aab6cc'] });
        fog(ovW, f, { y0: Y(148), y1: Y(176), color: '#ffffff', strength: .34, speed: .4, fade: 'down', levels: 3 });
        ovW.flush(ctx, 0, Y(148), W, Y(176));
        ctx.drawImage(snowC, 0, 0);
        drawMotes(ctx, glints, f);
        ctx.drawImage(frontC, 0, 0);
        for (const s of flakes) {
          const x = Math.floor(((s.x + s.vx * f + 1.5 * Math.sin(f / 18 + s.ph)) % W + W) % W), y = Math.floor(((s.y + s.vy * f) % H + H) % H);
          ctx.fillStyle = s.c; ctx.fillRect(x, y, 1, 1);
          if (s.big) { ctx.fillStyle = '#c4d6f4'; ctx.fillRect(x + 1, y, 1, 1); ctx.fillRect(x, y + 1, 1, 1); }
        }
      },
    };
  }
/* ===== END ===== */
  PixelBG.register('taiga', function (env) { return env.day ? buildDay(env) : buildNight(env); });
})();
