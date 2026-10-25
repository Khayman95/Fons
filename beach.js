/* Пляж: закат, полуушедшее солнце, золотая дорожка, прибой, силуэты пальм, костёр с искрами.
 * Два варианта: buildNight (вечер/ночь) и buildDay (день); выбор по env.variant. */
(function () {
  function buildNight(env) {
  const { W, H, Y, Ys, U, limit, px } = env;
  const { C, Layer, Overlay, mulberry32, randint, clamp, bay, tri, gradient, addGlow, sunDisc, outward,
    cloudRow, drawCloudRows, makeStars, drawStars, makeMotes, drawMotes, glowPulse, waves, glitter, drawBird } = px;
  const r = mulberry32(61), hy = Y(93), xc = W / 2;
  const sunX = U(0), sunY = hy - 7;
  const fx = U(24), fy = Y(171);                        // костёр

  /* ---------- небо, солнце, море в одном холсте ---------- */
  const base = new Layer(W, H), sea = new Layer(W, H);
  gradient(base, ['#1c1450', '#2a1a62', '#3e2274', '#5a2c84', '#7c3790', '#a64590', '#d25a88', '#f27888', '#ff9a86', '#ffb68c', '#ffcc9c'], 0, hy);
  addGlow(base, sunX, sunY, 14, 74, '#ff9a6c', .8, 5, 1.5);
  sunDisc(base, sunX, sunY, [[15, '#ffcc7e'], [13, '#ffe0a0'], [9, '#fff0c0']]);
  gradient(sea, ['#ffb490', '#f4909c', '#d2749e', '#a85aa6', '#7a4aa8', '#4e3c9a', '#36338a', '#3a3590', '#5a4ca6', '#7a64bc'], hy, Y(141));
  base.d.set(sea.d.subarray(hy * W * 4), hy * W * 4);
  addGlow(base, sunX, hy + 2, 4, 44, '#ffb890', .5, 4, 1.4);
  const baseC = base.canvas();
  const stars = makeStars(r, Math.round(56 * W / 128), W, Math.min(hy - 26, Ys(72)));

  /* ---------- облака ---------- */
  const rows = [
    cloudRow({ sizes: [[44, 6], [36, 5], [52, 6]], seed: 3, cols: ['#6a3a8c', '#e0607e', '#9a4a98'], y: Ys(24), v: .3, gap: 120, off: 10 }),
    cloudRow({ sizes: [[30, 5], [40, 6], [34, 5]], seed: 9, cols: ['#8a46a0', '#ee7a90', '#b05aa0'], y: Ys(52), v: .45, gap: 108, off: 60 }),
    cloudRow({ sizes: [[30, 5], [22, 4], [38, 5]], seed: 15, cols: ['#c85a8e', '#ffa088', '#ee7a8a'], y: Ys(74), v: .6, gap: 132, off: 30 }),
  ];
  const gulls = [0, 1, 2].map(i => ({ x0: r() * (W + 60), y: Ys([30, 40, 56][i]), v: [.34, .26, .42][i], ph: r() * 6, fl: Math.floor(r() * 4) }));

  /* ---------- горизонт: острова ---------- */
  const far = new Layer(W, H), rf = mulberry32(5);
  function island(cx, w, h) {
    for (let x = cx - (w >> 1); x <= cx + (w >> 1); x++) {
      const t = (x - cx) / (w / 2), hh = Math.round(h * Math.pow(Math.max(0, 1 - t * t), .6) * (.85 + .15 * Math.sin(x * .9)));
      if (hh > 0) { far.rect(x, hy - hh, x, hy - 1, '#7a4a9c'); far.px(x, hy - hh, '#b070b4'); }
    }
  }
  island(U(52), 40, 7); island(U(34), 10, 3);
  for (const d of [-1, 1]) for (const u of outward(d > 0 ? 84 : -50, d, limit, 40, 92, rf)) island(U(u), randint(rf, 8, 22), randint(rf, 2, 4));
  const farC = far.canvas();

  /* ---------- берег и песок ---------- */
  const shore = new Int32Array(W);
  let shoreMax = 0;
  for (let x = 0; x < W; x++) {
    const u = x - xc;
    shore[x] = Y(139.5 + 3.5 * Math.sin(2 * Math.PI * u / 150 + .4) + 1.5 * Math.sin(2 * Math.PI * u / 57 + 1) - .04 * u);
    if (shore[x] > shoreMax) shoreMax = shore[x];
  }
  const sand = new Layer(W, H), tmp = new Layer(W, H);
  gradient(tmp, ['#a9647e', '#9b5c84', '#8a528a', '#70478a', '#56407c', '#41346a'], Y(139), H);
  for (let x = 0; x < W; x++) for (let y = shore[x]; y < H; y++) { const i = (y * W + x) << 2; sand.px(x, y, [tmp.d[i], tmp.d[i + 1], tmp.d[i + 2]]); }
  for (let x = 0; x < W; x++) for (let k = 0; k < 4; k++) if (bay(x, shore[x] + k) < [.95, .65, .4, .18][k]) sand.px(x, shore[x] + k, '#6a508e');
  addGlow(sand, fx, fy - 6, 6, 46, '#ff8a3a', .55, 4, 1.4);        // отсвет костра на песке
  const rs = mulberry32(77);
  for (let i = 0, n = Math.round(W * 2.4); i < n; i++) {           // песчинки
    const x = Math.floor(rs() * W), y = shore[x] + 4 + Math.floor(rs() * (H - shore[x]));
    if (sand.has(x, y)) sand.px(x, y, rs() < .5 ? '#b8788a' : '#4a3a76');
  }
  function starfish(cx, cy) {
    const m = ['..X..', '.XXX.', 'XXXXX', '.X.X.', 'X...X'];
    m.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'X') sand.px(cx - 2 + i, cy - 2 + j, '#ff9a4e'); }));
    sand.px(cx, cy, '#ffd080');
  }
  starfish(U(-24), Y(168)); starfish(U(-40), Y(182));
  sand.rect(U(-56), Y(187), U(-36), Y(187), '#8a5a82');
  const sandC = sand.canvas();

  /* ---------- пальмы ---------- */
  const DARK = '#1a0f36', HL = '#34205a';
  function trunk(L, bx, by, tx, ty, w0, w1, pw) {
    for (let y = by; y >= ty; y--) {
      const t = (by - y) / (by - ty), x = bx + (tx - bx) * Math.pow(t, pw), w = w0 + (w1 - w0) * t;
      L.rect(Math.round(x - w / 2), y, Math.round(x + w / 2), y, DARK);
      L.px(Math.round(x - w / 2), y, HL);
    }
  }
  function crown(L, cx, cy, spec, f, sway, sc) {
    for (const fr of spec) {
      const a = (fr.a + sway * Math.sin(2 * Math.PI * (f / 90 + fr.ph))) * Math.PI / 180, n = Math.round(fr.len * sc);
      for (let s = 1; s <= n; s++) {
        const k = s / n, x = Math.round(cx + Math.cos(a) * s), y = Math.round(cy - Math.sin(a) * s * .55 + fr.droop * k * k * n * .45);
        L.px(x, y, DARK); L.px(x, y + 1, DARK);
        if (s % 2 === 0 && k > .15 && k < .95) L.px(x, y + 2 + (s % 4 === 0 ? 1 : 0), DARK);
      }
    }
    L.disc(cx, cy, 2, DARK);
  }
  const rp = mulberry32(88), specA = [];
  for (const [a, len, droop] of [[172, 22, 1], [150, 18, .8], [124, 12, .5], [90, 9, .35], [56, 12, .5], [30, 18, .8], [8, 22, 1], [-14, 12, .6], [194, 12, .6]])
    specA.push({ a, len, droop, ph: rp() });
  const palms = new Layer(W, H);
  for (const d of [-1, 1]) for (const u of outward(d * 58, d, limit, 56, 100, rp)) {      // дальние пальмы для широких экранов
    const hgt = randint(rp, 44, 76), by = Y(randint(rp, 150, 186)), bx = U(u), lean = d * randint(rp, 4, 10);
    trunk(palms, bx, by, bx + lean, by - hgt, 3, 2, 1.5);
    crown(palms, bx + lean, by - hgt, specA, 0, 0, .62 + rp() * .2);
  }
  const rkc = mulberry32(99);                                        // камни на песке
  for (const d of [-1, 1]) for (const u of outward(d * 40, d, limit, 34, 70, rkc)) {
    const x = U(u), y = Y(randint(rkc, 156, 188)), w = randint(rkc, 4, 9);
    palms.ellipseBox(x - (w >> 1), y - 2, x + (w >> 1), y + 1, '#2a1a48'); palms.hline(x - (w >> 1) + 1, x + (w >> 1) - 1, y - 2, '#4a3a78');
  }
  const L1 = { bx: U(-50), by: Y(197), cx: U(-34), cy: Y(97) }, R1 = { bx: U(53), by: Y(197), cx: U(44), cy: Y(130) };
  trunk(palms, L1.bx, L1.by, L1.cx, L1.cy, 5, 2, 1.7);
  trunk(palms, R1.bx, R1.by, R1.cx, R1.cy, 4, 2, 1.5);
  // дрова костра
  palms.line(fx - 8, fy + 1, fx + 6, fy - 2, '#4a2c1c'); palms.line(fx - 8, fy + 2, fx + 6, fy - 1, '#3a2218');
  palms.line(fx + 8, fy + 1, fx - 6, fy - 2, '#4a2c1c'); palms.line(fx + 8, fy + 2, fx - 6, fy - 1, '#3a2218');
  palms.px(fx - 8, fy + 1, '#ff8a30'); palms.px(fx + 8, fy + 1, '#ff8a30'); palms.px(fx, fy - 1, '#ff8a30');
  const palmsC = palms.canvas();
  const crL = new Layer(90, 56), crR = new Layer(70, 46);
  const specB = specA.map(s => Object.assign({}, s, { len: s.len * .72 }));

  /* ---------- пламя, искры, эффекты ---------- */
  const fl = new Layer(26, 30), ovW = new Overlay(W, H), ovF = new Overlay(W, H);
  function flame(f, cx, h0, hw0, ph) {
    const h = Math.round(h0 + 2 * Math.sin(f * 1.3 + ph) + 1.5 * Math.sin(f * 2.1 + 1 + ph));
    for (let k = 0; k <= h; k++) {
      const t = k / h, hw = hw0 * Math.pow(1 - t, .75), c = cx + Math.sin(f * .8 + k * .45 + ph) * 1.4 * t;
      for (let x = Math.ceil(c - hw); x <= Math.floor(c + hw); x++) {
        const d = Math.abs(x - c) / Math.max(.5, hw);
        fl.px(x, 28 - k, d > .7 ? '#ff6a24' : d > .38 ? '#ffa838' : '#ffe27a');
      }
    }
  }
  const sparks = makeMotes(r, 14, W, { x0: fx - 5, x1: fx + 5, y0: fy - 52, y1: fy - 8, colors: ['#ffb040', '#ffd070', '#ff8a30'], rise: .7, amp: [1, 3], big: 0 });

  return {
    draw(ctx, f) {
      ctx.drawImage(baseC, 0, 0);
      drawStars(ctx, stars, f);
      drawCloudRows(ctx, rows, f, W);
      for (const g of gulls) {
        const x = Math.floor(((g.x0 + g.v * f) % (W + 60) + W + 60) % (W + 60)) - 30;
        drawBird(ctx, x, g.y + Math.round(2 * Math.sin(2 * Math.PI * f / 80 + g.ph)), (((f >> 2) + g.fl) & 1) === 1, '#2c1f58');
      }
      ctx.drawImage(farC, 0, 0);
      waves(ovW, f, { y0: hy + 3, y1: shoreMax + 2, hi: '#e8b4d4', lo: '#2a2070', lam0: 4.6, lam1: 24, gap0: 3, dgap: .35, thr: .35, aHi: .55, aLo: .3 });
      glitter(ovW, f, sunX + Math.round(1.5 * Math.sin(f / 45)), hy + 2, Y(131), 3, 22, '#ffe8b0', { thr: 1.12, alpha: .95 });
      ovW.flush(ctx, 0, hy + 1, W, shoreMax + 3);
      ctx.drawImage(sandC, 0, 0);
      for (let x = 0; x < W; x++) {                                   // накат пены
        const o = Math.round(1.5 + 1.5 * Math.sin(2 * Math.PI * (f / 80 - x / 70))), y = shore[x] - 1 + o;
        ctx.fillStyle = '#fff4f8'; ctx.fillRect(x, y, 1, 1);
        if (bay(x, y + 1) < .75) { ctx.fillStyle = '#c4b0e8'; ctx.fillRect(x, y + 1, 1, 1); }
      }
      ctx.drawImage(palmsC, 0, 0);
      crL.clear(); crown(crL, 45, 28, specA, f, 4, 1); crL.draw(ctx, L1.cx - 45, L1.cy - 28);
      crR.clear(); crown(crR, 35, 23, specB, f, 4, 1); crR.draw(ctx, R1.cx - 35, R1.cy - 23);
      fl.clear(); flame(f, 13, 15, 5.8, 0); flame(f, 8, 9, 3.4, 2); flame(f, 18, 9, 3.4, 4); fl.draw(ctx, fx - 13, fy - 28);
      glowPulse(ovF, fx, fy - 8, 30, '#ff8a3a', f, { per: 9, strength: .5, lo: .55 });
      glowPulse(ovF, fx, fy - 6, 18, '#ffc060', f, { per: 6, ph: 3, strength: .4, lo: .5 });
      ovF.flush(ctx, Math.max(0, fx - 31), Math.max(0, fy - 40), Math.min(W, fx + 31), Math.min(H, fy + 24));
      drawMotes(ctx, sparks, f);
    },
  };
}
/* ===== DAY ===== */
  function buildDay(env) {
    const { W, H, Y, Ys, U, limit, px } = env;
    const { Layer, Overlay, mulberry32, randint, clamp, bay, gradient, addGlow, sunDisc, outward,
      cloudRow, drawCloudRows, makeMotes, drawMotes, waves, glitter, drawBird } = px;
    const r = mulberry32(61), hy = Y(93), xc = W / 2;
    const sunX = U(-12), sunY = Ys(30);
    const fx = U(24), fy = Y(171);                       // зонт на месте костра

    /* ---------- небо, солнце, лагуна ---------- */
    const base = new Layer(W, H), sea = new Layer(W, H);
    gradient(base, ['#2c82e0', '#4a9aea', '#6cb2f0', '#8ecaf4', '#b0e0f6', '#d0f0f8', '#e4f8fa'], 0, hy);
    addGlow(base, sunX, sunY, 10, 66, '#fff4c0', .75, 5, 1.5);
    addGlow(base, sunX, sunY, 10, 120, '#fffbe0', .3, 4, 1.8);
    sunDisc(base, sunX, sunY, [[11, '#ffe27a'], [9, '#fff0a0'], [7, '#fff8d0'], [5, '#ffffff']]);
    gradient(sea, ['#52b4ea', '#40b0e4', '#30b4dc', '#28b8d4', '#38ccd0', '#58dcc8', '#7ae8c8', '#9cf0d0', '#b8f4d8', '#c8f6dc'], hy, Y(141));
    base.d.set(sea.d.subarray(hy * W * 4), hy * W * 4);
    addGlow(base, sunX, hy + 2, 4, 44, '#e8fcff', .45, 4, 1.4);
    const baseC = base.canvas();
    const cc = ['#f6f9fe', '#b4c8e6', '#ffffff'];
    const rows = [
      cloudRow({ sizes: [[46, 10], [36, 9], [54, 11]], seed: 3, cols: cc, y: Ys(20), v: .26, gap: 120, off: 10 }),
      cloudRow({ sizes: [[32, 8], [42, 9], [36, 8]], seed: 9, cols: cc, y: Ys(50), v: .38, gap: 108, off: 60 }),
      cloudRow({ sizes: [[32, 7], [24, 6], [40, 7]], seed: 15, cols: cc, y: Ys(72), v: .5, gap: 132, off: 30 }),
    ];
    const gulls = [0, 1, 2, 3].map(i => ({ x0: r() * (W + 60), y: Ys([34, 44, 58, 66][i]), v: [.34, .26, .42, .3][i], ph: r() * 6, fl: Math.floor(r() * 4) }));

    /* ---------- горизонт: острова ---------- */
    const far = new Layer(W, H), rf = mulberry32(5);
    function island(cx, w, h) {
      for (let x = cx - (w >> 1); x <= cx + (w >> 1); x++) {
        const t = (x - cx) / (w / 2), hh = Math.round(h * Math.pow(Math.max(0, 1 - t * t), .6) * (.85 + .15 * Math.sin(x * .9)));
        if (hh > 0) { far.rect(x, hy - hh, x, hy - 1, '#4a9a7a'); far.px(x, hy - hh, '#8ad4a8'); }
      }
    }
    island(U(52), 40, 7); island(U(34), 10, 3);
    for (const d of [-1, 1]) for (const u of outward(d > 0 ? 84 : -50, d, limit, 40, 92, rf)) island(U(u), randint(rf, 8, 22), randint(rf, 2, 4));
    const farC = far.canvas();

    /* ---------- берег и песок ---------- */
    const shore = new Int32Array(W);
    let shoreMax = 0;
    for (let x = 0; x < W; x++) {
      const u = x - xc;
      shore[x] = Y(139.5 + 3.5 * Math.sin(2 * Math.PI * u / 150 + .4) + 1.5 * Math.sin(2 * Math.PI * u / 57 + 1) - .04 * u);
      if (shore[x] > shoreMax) shoreMax = shore[x];
    }
    const sand = new Layer(W, H), tmp = new Layer(W, H);
    gradient(tmp, ['#f6e8c0', '#f2dfae', '#eed69e', '#e6ca8c', '#debe7c', '#d4b26c'], Y(139), H);
    for (let x = 0; x < W; x++) for (let y = shore[x]; y < H; y++) { const i = (y * W + x) << 2; sand.px(x, y, [tmp.d[i], tmp.d[i + 1], tmp.d[i + 2]]); }
    for (let x = 0; x < W; x++) for (let k = 0; k < 4; k++) if (bay(x, shore[x] + k) < [.95, .65, .4, .18][k]) sand.px(x, shore[x] + k, '#c4a468');
    const rs = mulberry32(77);
    for (let i = 0, n = Math.round(W * 2.4); i < n; i++) {
      const x = Math.floor(rs() * W), y = shore[x] + 4 + Math.floor(rs() * (H - shore[x]));
      if (sand.has(x, y)) sand.px(x, y, rs() < .5 ? '#fff4d0' : '#c8a460');
    }
    function starfish(cx, cy) {
      const m = ['..X..', '.XXX.', 'XXXXX', '.X.X.', 'X...X'];
      m.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'X') sand.px(cx - 2 + i, cy - 2 + j, '#ff8a4a'); }));
      sand.px(cx, cy, '#ffd080');
    }
    starfish(U(-24), Y(168)); starfish(U(-40), Y(182));
    sand.rect(U(-56), Y(187), U(-36), Y(187), '#c8a468');
    // тень зонта и полотенце
    for (let y = fy - 1; y <= fy + 7; y++) for (let x = fx - 16; x <= fx + 18; x++) {
      const a = 1 - Math.hypot((x - (fx + 4)) / 17, (y - (fy + 3)) / 4.5); if (a > 0 && a * 1.6 > bay(x, y) && sand.has(x, y)) sand.px(x, y, '#c8a864');
    }
    const tw0 = fx - 14, tw1 = fx - 2, ty0 = fy + 4;
    for (let y = ty0; y < ty0 + 6; y++) for (let x = tw0; x <= tw1; x++) sand.px(x, y, ((x - tw0) >> 1) % 2 ? '#ffffff' : '#3a8ad8');
    sand.hline(tw0, tw1, ty0, '#8ac4f4'); sand.hline(tw0, tw1, ty0 + 5, '#2a68b8');
    const sandC = sand.canvas();

    /* ---------- пальмы ---------- */
    const TRK = '#7a5230', TRH = '#b08050', G1 = '#2c8a40', G2 = '#5ac85a';
    function trunk(L, bx, by, tx, ty, w0, w1, pw) {
      for (let y = by; y >= ty; y--) {
        const t = (by - y) / (by - ty), x = bx + (tx - bx) * Math.pow(t, pw), w = w0 + (w1 - w0) * t;
        L.rect(Math.round(x - w / 2), y, Math.round(x + w / 2), y, TRK);
        L.px(Math.round(x - w / 2), y, TRH);
        if (y % 5 === 0) L.px(Math.round(x + w / 2), y, '#5a3a22');
      }
    }
    function crown(L, cx, cy, spec, f, sway, sc) {
      for (const fr of spec) {
        const a = (fr.a + sway * Math.sin(2 * Math.PI * (f / 90 + fr.ph))) * Math.PI / 180, n = Math.round(fr.len * sc);
        for (let s = 1; s <= n; s++) {
          const k = s / n, x = Math.round(cx + Math.cos(a) * s), y = Math.round(cy - Math.sin(a) * s * .55 + fr.droop * k * k * n * .45);
          L.px(x, y, G2); L.px(x, y + 1, G1);
          if (s % 2 === 0 && k > .15 && k < .95) L.px(x, y + 2 + (s % 4 === 0 ? 1 : 0), G1);
        }
      }
      L.disc(cx, cy, 2, '#1c6a30'); L.px(cx - 1, cy + 2, '#5a3a20'); L.px(cx + 1, cy + 2, '#5a3a20');
    }
    const rp = mulberry32(88), specA = [];
    for (const [a, len, droop] of [[172, 22, 1], [150, 18, .8], [124, 12, .5], [90, 9, .35], [56, 12, .5], [30, 18, .8], [8, 22, 1], [-14, 12, .6], [194, 12, .6]])
      specA.push({ a, len, droop, ph: rp() });
    const palms = new Layer(W, H);
    for (const d of [-1, 1]) for (const u of outward(d * 58, d, limit, 56, 100, rp)) {
      const hgt = randint(rp, 44, 76), by = Y(randint(rp, 150, 186)), bx = U(u), lean = d * randint(rp, 4, 10);
      trunk(palms, bx, by, bx + lean, by - hgt, 3, 2, 1.5);
      crown(palms, bx + lean, by - hgt, specA, 0, 0, .62 + rp() * .2);
    }
    const rkc = mulberry32(99);
    for (const d of [-1, 1]) for (const u of outward(d * 40, d, limit, 34, 70, rkc)) {
      const x = U(u), y = Y(randint(rkc, 156, 188)), w = randint(rkc, 4, 9);
      palms.ellipseBox(x - (w >> 1), y - 2, x + (w >> 1), y + 1, '#8a7a68'); palms.hline(x - (w >> 1) + 1, x + (w >> 1) - 1, y - 2, '#d0c0a8');
    }
    const L1 = { bx: U(-50), by: Y(197), cx: U(-34), cy: Y(97) }, R1 = { bx: U(53), by: Y(197), cx: U(44), cy: Y(130) };
    trunk(palms, L1.bx, L1.by, L1.cx, L1.cy, 5, 2, 1.7);
    trunk(palms, R1.bx, R1.by, R1.cx, R1.cy, 4, 2, 1.5);
    // зонт: ножка, полосатый купол, бахрома
    const ptop = fy - 24;
    palms.rect(fx, ptop, fx, fy + 3, '#f0e8e0'); palms.px(fx + 1, fy + 3, '#c8c0b8');
    for (let x = -13; x <= 13; x++) {
      const hgt = Math.round(9 * Math.sqrt(Math.max(0, 1 - (x / 13.5) * (x / 13.5)))), red = ((x + 13) >> 2) % 2 === 0;
      for (let y = ptop - hgt; y <= ptop; y++) palms.px(fx + x, y, red ? (y === ptop - hgt ? '#ff8a8a' : '#e84040') : (y === ptop - hgt ? '#ffffff' : '#f6f2ee'));
      if (((x + 13) >> 1) % 2 === 0) palms.px(fx + x, ptop + 1, red ? '#c02828' : '#d8d0c8');
    }
    palms.px(fx, ptop - 10, '#f0c050'); palms.px(fx, ptop - 11, '#f0c050');
    const palmsC = palms.canvas();
    const crL = new Layer(90, 56), crR = new Layer(70, 46);
    const specB = specA.map(s => Object.assign({}, s, { len: s.len * .72 }));
    const glints = makeMotes(r, Math.round(28 * W / 128), W, { y0: Y(146), y1: H - 2, colors: ['#ffffff', '#fff6c8', '#ffffff'], rise: 0, amp: [0, 1], big: .35 });
    const seaSp = makeMotes(r, Math.round(16 * W / 128), W, { y0: hy + 6, y1: Y(138), colors: ['#ffffff', '#e8fcff'], rise: 0, amp: [0, 1], big: .25 });
    const ovW = new Overlay(W, H);

    return {
      draw(ctx, f) {
        ctx.drawImage(baseC, 0, 0);
        drawCloudRows(ctx, rows, f, W);
        for (const g of gulls) {
          const x = Math.floor(((g.x0 + g.v * f) % (W + 60) + W + 60) % (W + 60)) - 30;
          drawBird(ctx, x, g.y + Math.round(2 * Math.sin(2 * Math.PI * f / 80 + g.ph)), (((f >> 2) + g.fl) & 1) === 1, '#ffffff');
        }
        ctx.drawImage(farC, 0, 0);
        waves(ovW, f, { y0: hy + 3, y1: shoreMax + 2, hi: '#ffffff', lo: '#1a8ab8', lam0: 4.6, lam1: 24, gap0: 3, dgap: .35, thr: .35, aHi: .7, aLo: .3 });
        glitter(ovW, f, sunX + Math.round(1.5 * Math.sin(f / 45)), hy + 2, Y(131), 3, 22, '#ffffff', { thr: 1.12, alpha: .95 });
        ovW.flush(ctx, 0, hy + 1, W, shoreMax + 3);
        drawMotes(ctx, seaSp, f);
        ctx.drawImage(sandC, 0, 0);
        for (let x = 0; x < W; x++) {
          const o = Math.round(1.5 + 1.5 * Math.sin(2 * Math.PI * (f / 80 - x / 70))), y = shore[x] - 1 + o;
          ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, 1, 1);
          if (bay(x, y + 1) < .75) { ctx.fillStyle = '#bfeee8'; ctx.fillRect(x, y + 1, 1, 1); }
        }
        drawMotes(ctx, glints, f);
        ctx.drawImage(palmsC, 0, 0);
        crL.clear(); crown(crL, 45, 28, specA, f, 4, 1); crL.draw(ctx, L1.cx - 45, L1.cy - 28);
        crR.clear(); crown(crR, 35, 23, specB, f, 4, 1); crR.draw(ctx, R1.cx - 35, R1.cy - 23);
        // флажок на зонте
        for (let i = 0; i < 5; i++) { ctx.fillStyle = '#f0c050'; ctx.fillRect(fx + 1 + i, ptop - 11 + Math.round(1.2 * Math.sin(2 * Math.PI * (f / 20 - i / 5))), 1, 2 - (i > 2 ? 1 : 0)); }
      },
    };
  }
/* ===== END ===== */
  PixelBG.register('beach', function (env) { return env.day ? buildDay(env) : buildNight(env); });
})();
