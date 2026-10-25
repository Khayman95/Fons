/* Джунгли: полная луна, руины с бирюзовым огнём, водопад с брызгами, лианы, светлячки, светящиеся цветы.
 * Два варианта: buildNight (вечер/ночь) и buildDay (день); выбор по env.variant. */
(function () {
  function buildNight(env) {
  const { W, H, Y, Ys, U, limit, px } = env;
  const { C, Layer, Overlay, mulberry32, randint, gradient, addGlow, moonSprite, makeStars, drawStars, makeMotes, drawMotes,
    fog, glowPulse, fillDisc, outward, bay, clamp } = px;
  const r = mulberry32(61), xc = W / 2, TP = 2 * Math.PI;
  const moonX = U(28), moonY = Ys(26), fx = Math.round(U(16)), fy0 = Y(106), fy1 = Y(149);
  const sc = clamp(W / 128, .62, 1);                         // масштаб листьев переднего плана на узких экранах

  /* ---------- небо, луна, звёзды ---------- */
  const sky = new Layer(W, H);
  gradient(sky, ['#040c18', '#071626', '#0a2236', '#0d2e40', '#10384a', '#124252'], 0, Y(138));
  addGlow(sky, moonX, moonY, 9, 62, '#40d8b8', .5, 5, 1.5);
  addGlow(sky, moonX, moonY, 9, 30, '#80ffe0', .35, 4, 1.8);
  const skyC = sky.canvas();
  const moon = moonSprite(9, ['#8fe8d0', '#d4fff0', '#f2fffa', '#9ae6d2'], false);
  const stars = makeStars(r, Math.round(46 * W / 128), W, Y(104), { avoid: (x, y) => Math.hypot(x - moonX, y - moonY) < 14 });
  const STAR_PAL = [null, '#3a5a80', '#8aa8d8', '#e8f4ff'];

  /* ---------- руины с огнём на вершине ---------- */
  const tx = Math.round(U(-28)), tower = new Layer(W, H);
  tower.rect(tx - 7, Y(90), tx + 7, Y(104), '#1c4c60'); tower.rect(tx - 5, Y(80), tx + 5, Y(90), '#1a4558');
  tower.rect(tx - 6, Y(79), tx + 6, Y(80), '#2a6478'); tower.rect(tx - 8, Y(89), tx + 8, Y(90), '#245a6c');
  tower.rect(tx - 1, Y(82), tx + 1, Y(87), '#071a26'); tower.vline(tx - 7, Y(90), Y(104), '#2c6e84'); tower.vline(tx + 7, Y(90), Y(104), '#143646');
  for (let y = Y(92); y < Y(104); y += 4) tower.hline(tx - 6, tx + 6, y, '#15394a');
  tower.rect(tx - 2, Y(77), tx + 2, Y(79), '#2a6478'); tower.disc(tx, Y(74), 2, '#7af0ff'); tower.disc(tx, Y(74), 1, '#e8ffff');
  addGlow(tower, tx, Y(74), 3, 16, '#40e0ff', .6, 4, 1.4);
  const towerC = tower.canvas();

  /* ---------- кроны трёх планов ---------- */
  function canopy(base, hmin, hmax, col, rim, deep, seed, dens) {
    const L = new Layer(W, H), rng = mulberry32(seed);
    for (let x = -8; x < W + 8; x += randint(rng, dens[0], dens[1])) {
      const w = randint(rng, 11, 18), h = randint(rng, hmin, hmax), top = base - h;
      L.ellipseBox(Math.round(x - w / 2), top, Math.round(x + w / 2), base + 6, col);
      if (rng() < .5) L.poly([[x - w * .3, top + h * .35], [x + (rng() - .5) * 3, top - 4], [x + w * .3, top + h * .35]], col);
    }
    L.rect(0, base + 3, W, H, col);
    for (let y = base - hmax - 6; y < H; y++) for (let x = 0; x < W; x++) {
      if (!L.has(x, y)) continue;
      const d = y - (base - hmax);                               // темнее к низу слоя
      if (clamp((y - base - 2) / 26, 0, 1) > bay(x, y)) L.px(x, y, deep);
      else if (!L.has(x, y - 1)) L.px(x, y, rim);
      else if (!L.has(x, y - 2) && bay(x, y) < .45) L.px(x, y, rim);
    }
    return L.canvas();
  }
  const farC = canopy(Y(112), 10, 20, '#12404f', '#2a8a96', '#0c3040', 5, [5, 8]);
  const midC = canopy(Y(128), 10, 22, '#0d3140', '#1c6c7a', '#082432', 12, [5, 9]);
  const nearC = canopy(Y(146), 8, 18, '#08222e', '#124c58', '#051822', 23, [6, 10]);

  /* ---------- утёс и водопад ---------- */
  const cliff = new Layer(W, H);
  cliff.rect(fx - 14, fy0 - 5, fx + 14, fy1 + 4, '#0b2a38');
  for (let y = fy0 - 5; y <= fy1 + 4; y++) {                       // неровный левый край и тень справа
    const bulge = Math.round(2 * Math.sin((y - fy0) / 9));
    for (let x = fx - 14; x <= fx - 11 + bulge; x++) cliff.erase(x, y);
    cliff.px(fx - 11 + bulge + 1, y, '#2a7e8c'); cliff.px(fx - 11 + bulge + 2, y, bay(0, y) > .5 ? '#1a5868' : '#0f3a4a');
    for (let x = fx + 7; x <= fx + 14; x++) if ((x + y) % 3 !== 0) cliff.px(x, y, '#071c28');
  }
  for (let y = fy0 + 4; y < fy1; y += 6) for (let x = fx - 10; x < fx + 14; x += 2) if (cliff.has(x, y)) cliff.px(x, y + (x & 2 ? 1 : 0), '#09222e');
  cliff.rect(fx - 12, fy0 - 5, fx + 11, fy0 - 3, '#16485a'); cliff.hline(fx - 12, fx + 11, fy0 - 5, '#3a9aa8');   // плита сверху
  cliff.rect(fx - 4, fy0 - 3, fx + 3, fy0, '#0a2230');
  for (let x = fx - 15; x < fx + 16; x += 3) { cliff.px(x, fy1 + 5, '#0a2c36'); cliff.px(x + 1, fy1 + 4, '#0c3440'); }
  const cliffC = cliff.canvas();
  const FALL = ['#e8ffff', '#8af0ff', '#40c8e8', '#2090b8'];
  const spl = Array.from({ length: 10 }, (_, i) => ({ dir: i & 1 ? 1 : -1, ph: r(), per: 14 + (i % 3) * 3, sp: 5 + r() * 5, hgt: 4 + r() * 4 }));

  /* ---------- земля ---------- */
  const ground = new Layer(W, H), gtop = x => Y(152) + 2 * Math.sin(x / 7) + 1.5 * Math.sin(x / 3.1 + 1);
  const rg = mulberry32(3);
  for (let x = 0; x < W; x++) {
    const t = Math.round(gtop(x));
    for (let y = t; y < H; y++) {
      const u = clamp((y - t) / (H - t), 0, 1), b = bay(x, y);
      ground.px(x, y, u * 1.6 > b + .35 ? '#03101a' : u > b * .6 ? '#06202c' : '#0a2e3a');
    }
    if (rg() < .3) ground.px(x, t, '#1c6a74');
  }
  const groundC = ground.canvas();

  /* ---------- листья переднего плана ---------- */
  function leaf(L, bx, by, len, ang, wid, body, vein) {
    const ca = Math.cos(ang), sa = Math.sin(ang), N = 12, pts = [], back = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, ww = wid * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.04)), .75) * (1 - .2 * t);
      pts.push([bx + ca * len * t - sa * ww, by + sa * len * t + ca * ww]);
      back.unshift([bx + ca * len * t + sa * ww, by + sa * len * t - ca * ww]);
    }
    L.poly(pts.concat(back), body);
    L.line(Math.round(bx), Math.round(by), Math.round(bx + ca * len * .95), Math.round(by + sa * len * .95), vein);
    for (let t = .22; t < .85; t += .16) {
      const cx = bx + ca * len * t, cy = by + sa * len * t, ww = wid * Math.sin(Math.PI * t) * .75;
      for (const sg of [-1, 1]) L.line(Math.round(cx), Math.round(cy), Math.round(cx + ca * ww * .5 - sg * sa * ww * .85), Math.round(cy + sa * ww * .5 + sg * ca * ww * .85), vein);
    }
  }
  const lv = new Layer(W, H), rl = mulberry32(88);
  const lcol = ['#0b4a3a', '#0e5440', '#093c30'], vcol = ['#2c9a76', '#34a880', '#237a62'];
  const L1 = n => Math.round(n * sc * 1.3);
  const bot = Y(192) + 0;
  // нижние углы
  leaf(lv, -2, bot - L1(6), L1(40), -.55, L1(11), lcol[0], vcol[0]);
  leaf(lv, -2, bot + 2, L1(36), -1.05, L1(10), lcol[1], vcol[1]);
  leaf(lv, L1(6), bot + 6, L1(34), -.2, L1(9), lcol[2], vcol[2]);
  leaf(lv, W + 2, bot - L1(4), L1(38), Math.PI + .5, L1(11), lcol[1], vcol[1]);
  leaf(lv, W + 2, bot + 4, L1(34), Math.PI + 1.0, L1(10), lcol[0], vcol[0]);
  leaf(lv, W - L1(6), bot + 6, L1(30), Math.PI + .15, L1(9), lcol[2], vcol[2]);
  // верхние углы
  leaf(lv, -3, Ys(-3), L1(34), .75, L1(11), lcol[0], vcol[0]);
  leaf(lv, -3, Ys(-2), L1(28), 1.25, L1(9), lcol[2], vcol[2]);
  leaf(lv, W + 3, Ys(-3), L1(34), Math.PI - .75, L1(11), lcol[1], vcol[1]);
  leaf(lv, W + 3, Ys(0), L1(26), Math.PI - 1.3, L1(9), lcol[0], vcol[0]);
  // на широких экранах: листья вдоль нижнего края
  for (const d of [-1, 1]) for (const u of outward(d * 54, d, limit, 34, 60, rl)) {
    const ang = -Math.PI / 2 + (rl() - .5) * 1.4;
    leaf(lv, U(u), bot + 6, L1(randint(rl, 26, 40)), ang, L1(randint(rl, 8, 11)), lcol[randint(rl, 0, 2)], vcol[randint(rl, 0, 2)]);
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)              // кромка света сверху
    if (lv.has(x, y) && !lv.has(x, y - 1) && bay(x, y) < .5) lv.px(x, y, '#1c7a5c');
  const lvC = lv.canvas();

  /* ---------- лианы, цветы, светлячки ---------- */
  const vines = [[-20, 52, 1.5, .1], [-4, 36, 1.2, .5], [41, 62, 1.8, .8], [56, 44, 1.4, .3]].map(([u, len, amp, ph]) => ({ x: Math.round(U(u)), len: Math.round(len * (H / 192 > 1 ? 1 : 1)), amp, ph }));
  for (const d of [-1, 1]) for (const u of outward(d * 62, d, limit, 18, 40, rl)) vines.push({ x: Math.round(U(u)), len: randint(rl, 26, 64), amp: 1 + rl() * 1.2, ph: rl() });
  const flowers = [[-12, 184, '#ff5cb0', '#ffb0e0', 60, 0], [6, 188, '#30e0ff', '#c0ffff', 48, 20], [22, 177, '#30e0ff', '#c0ffff', 56, 40]];
  for (const d of [-1, 1]) for (const u of outward(d * 38, d, limit, 18, 34, rl)) flowers.push([u, randint(rl, 178, 190), rl() < .5 ? '#ff5cb0' : '#30e0ff', rl() < .5 ? '#ffb0e0' : '#c0ffff', randint(rl, 40, 70), randint(rl, 0, 60)]);
  const flw = new Layer(W, H);
  for (const [u, y, c1, c2] of flowers) {
    const x = Math.round(U(u)), yy = Y(y);
    flw.vline(x, yy + 2, yy + 14, '#0c4a3a'); flw.px(x - 1, yy + 6, '#0c4a3a'); flw.px(x + 1, yy + 8, '#0c4a3a');
    flw.disc(x, yy, 2, c1); flw.px(x, yy, c2); flw.px(x - 2, yy + 1, c1); flw.px(x + 2, yy + 1, c1);
  }
  const flwC = flw.canvas();
  const flies = makeMotes(r, Math.round(34 * W / 128), W, { y0: Y(96), y1: Y(186), colors: ['#d8ff60', '#a0ff90', '#60e8ff', '#ffd060'], rise: 0, amp: [2, 6], big: .3 });
  const drops = makeMotes(r, 10, W, { x0: fx - 10, x1: fx + 10, y0: Y(138), y1: Y(152), colors: ['#e8ffff', '#8af0ff'], rise: .35, amp: [1, 3], big: 0 });
  const ov = new Overlay(W, H), dust = new Overlay(W, H);
  const gpx0 = Math.max(0, tx - 18), gpx1 = Math.min(W, tx + 18);

  return {
    draw(ctx, f) {
      ctx.drawImage(skyC, 0, 0);
      drawStars(ctx, stars, f, STAR_PAL);
      ctx.drawImage(moon, moonX - (moon.width >> 1), moonY - (moon.height >> 1));
      // лианы качаются слегка
      for (const v of vines) {
        let ex = v.x;
        for (let k = 0; k < v.len; k++) {
          const sw = Math.round(v.amp * Math.pow(k / v.len, 1.6) * Math.sin(TP * (f / 90 + v.ph)));
          ctx.fillStyle = k & 1 ? '#1e6a46' : '#164e38'; ctx.fillRect(v.x + sw, Ys(-1) + k, 1, 1);
          if (k % 7 === 3) { ctx.fillStyle = '#2c8a5c'; ctx.fillRect(v.x + sw + 1, Ys(-1) + k, 1, 1); }
          ex = v.x + sw;
        }
        fillDisc(ctx, ex, Ys(-1) + v.len + 2, 2, '#134a30'); ctx.fillStyle = '#2c9a60'; ctx.fillRect(ex - 1, Ys(-1) + v.len + 1, 1, 1);
      }
      ctx.drawImage(towerC, 0, 0);
      glowPulse(ov, tx, Y(74), 13, '#40e0ff', f, { per: 50, strength: .8, lo: .45 });
      ov.flush(ctx, gpx0, Y(60), gpx1, Y(90));
      ctx.drawImage(farC, 0, 0);
      fog(ov, f, { y0: Y(108), y1: Y(130), color: '#3aa8a0', strength: .22, speed: .35, fade: 'mid', levels: 3 });
      ov.flush(ctx, 0, Y(108), W, Y(130));
      ctx.drawImage(midC, 0, 0);
      ctx.drawImage(nearC, 0, 0);
      ctx.drawImage(cliffC, 0, 0);
      // водопад: бегущие вниз штрихи
      const sh = Math.floor(f * 1.4);
      for (let x = fx - 4; x < fx + 4; x++) {
        const edge = x === fx - 4 || x === fx + 3;
        for (let y = fy0; y < fy1; y++) {
          const v = (((y + ((x * 5) % 7) - sh) % 7) + 7) % 7;
          ctx.fillStyle = FALL[edge ? (v < 3 ? 2 : 3) : v < 2 ? 0 : v < 4 ? 1 : v < 6 ? 2 : 1];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      // брызги у подножия
      for (const s of spl) {
        const p = (((f / s.per + s.ph) % 1) + 1) % 1, x = Math.round(fx + s.dir * (2 + s.sp * p)), y = Math.round(fy1 - s.hgt * Math.sin(Math.PI * p) + 3 * p * p);
        ctx.fillStyle = p < .7 ? '#d8ffff' : '#6ad0e8'; ctx.fillRect(x, y, 1, 1);
      }
      drawMotes(ctx, drops, f);
      glowPulse(ov, fx, fy1 + 1, 13, '#50e8ff', f, { per: 70, strength: .5, lo: .55 });
      fog(ov, f, { y0: fy1 - 8, y1: fy1 + 8, x0: fx - 22, x1: fx + 22, color: '#8af0e8', strength: .34, speed: .25, fade: 'mid', levels: 3, lam: [30, 21] });
      ov.flush(ctx, Math.max(0, fx - 24), fy1 - 14, Math.min(W, fx + 24), fy1 + 14);
      ctx.drawImage(groundC, 0, 0);
      drawMotes(ctx, flies, f);
      ctx.drawImage(flwC, 0, 0);
      for (let i = 0; i < flowers.length; i++) {
        const fl = flowers[i], x = Math.round(U(fl[0])), y = Y(fl[1]);
        glowPulse(dust, x, y, 8, fl[2], f, { per: fl[4], ph: fl[5], strength: .75, lo: .45 });
      }
      dust.flush(ctx, 0, Y(160), W, H);
      ctx.drawImage(lvC, 0, 0);
    },
  };
}
/* ===== DAY ===== */
  function buildDay(env) {
    const { W, H, Y, Ys, U, limit, px } = env;
    const { C, Layer, Overlay, mulberry32, randint, gradient, addGlow, sunDisc, cloudRow, drawCloudRows, makeMotes, drawMotes,
      fog, glowPulse, fillDisc, outward, bay, clamp } = px;
    const r = mulberry32(61), xc = W / 2, TP = 2 * Math.PI;
    const sunX = U(28), sunY = Ys(26), fx = Math.round(U(16)), fy0 = Y(106), fy1 = Y(149);
    const sc = clamp(W / 128, .62, 1);

    /* ---------- небо, солнце, облака ---------- */
    const sky = new Layer(W, H);
    gradient(sky, ['#2a8ee0', '#48a8e8', '#6cc0ee', '#92d6f0', '#b8e6ec', '#d8f2e0'], 0, Y(138));
    addGlow(sky, sunX, sunY, 10, 60, '#fff4b8', .7, 5, 1.5);
    sunDisc(sky, sunX, sunY, [[9, '#ffe27a'], [7, '#fff2a8'], [5, '#ffffff']]);
    const skyC = sky.canvas();
    const rows = [cloudRow({ sizes: [[44, 10], [34, 9], [50, 11]], seed: 7, cols: ['#f6f9fe', '#b4c8e6', '#ffffff'], y: Ys(58), v: .2, gap: 120, off: 30 })];

    /* ---------- руины на солнце ---------- */
    const tx = Math.round(U(-28)), tower = new Layer(W, H);
    tower.rect(tx - 7, Y(90), tx + 7, Y(104), '#84a496'); tower.rect(tx - 5, Y(80), tx + 5, Y(90), '#7a9a8a');
    tower.rect(tx - 6, Y(79), tx + 6, Y(80), '#b0ccb8'); tower.rect(tx - 8, Y(89), tx + 8, Y(90), '#a0bcaa');
    tower.rect(tx - 1, Y(82), tx + 1, Y(87), '#22403a'); tower.vline(tx - 7, Y(90), Y(104), '#c4dcc0'); tower.vline(tx + 7, Y(90), Y(104), '#506e60');
    for (let y = Y(92); y < Y(104); y += 4) tower.hline(tx - 6, tx + 6, y, '#6a8a7a');
    tower.rect(tx - 2, Y(77), tx + 2, Y(79), '#a0bcaa');
    for (const [dx, dy] of [[-4, 78], [-3, 77], [0, 76], [2, 77], [3, 78], [-6, 80], [5, 80], [-7, 90], [6, 89]]) tower.px(tx + dx, Y(dy), '#3aa040');
    tower.rect(tx - 1, Y(75), tx + 1, Y(76), '#2c8a38'); tower.px(tx, Y(74), '#5ac850');
    const towerC = tower.canvas();

    /* ---------- кроны ---------- */
    function canopy(base, hmin, hmax, col, rim, deep, seed, dens) {
      const L = new Layer(W, H), rng = mulberry32(seed);
      for (let x = -8; x < W + 8; x += randint(rng, dens[0], dens[1])) {
        const w = randint(rng, 11, 18), h = randint(rng, hmin, hmax), top = base - h;
        L.ellipseBox(Math.round(x - w / 2), top, Math.round(x + w / 2), base + 6, col);
        if (rng() < .5) L.poly([[x - w * .3, top + h * .35], [x + (rng() - .5) * 3, top - 4], [x + w * .3, top + h * .35]], col);
      }
      L.rect(0, base + 3, W, H, col);
      for (let y = base - hmax - 6; y < H; y++) for (let x = 0; x < W; x++) {
        if (!L.has(x, y)) continue;
        if (clamp((y - base - 2) / 26, 0, 1) > bay(x, y)) L.px(x, y, deep);
        else if (!L.has(x, y - 1)) L.px(x, y, rim);
        else if (!L.has(x, y - 2) && bay(x, y) < .45) L.px(x, y, rim);
      }
      return L.canvas();
    }
    const farC = canopy(Y(112), 10, 20, '#52b872', '#a6ec88', '#3a9a62', 5, [5, 8]);
    const midC = canopy(Y(128), 10, 22, '#2c9a54', '#74da62', '#1e7a46', 12, [5, 9]);
    const nearC = canopy(Y(146), 8, 18, '#1c7440', '#52bc50', '#145a34', 23, [6, 10]);

    /* ---------- утёс и водопад ---------- */
    const cliff = new Layer(W, H);
    cliff.rect(fx - 14, fy0 - 5, fx + 14, fy1 + 4, '#5a7e6c');
    for (let y = fy0 - 5; y <= fy1 + 4; y++) {
      const bulge = Math.round(2 * Math.sin((y - fy0) / 9));
      for (let x = fx - 14; x <= fx - 11 + bulge; x++) cliff.erase(x, y);
      cliff.px(fx - 11 + bulge + 1, y, '#c4e0c0'); cliff.px(fx - 11 + bulge + 2, y, bay(0, y) > .5 ? '#94b8a0' : '#7ca08c');
      for (let x = fx + 7; x <= fx + 14; x++) if ((x + y) % 3 !== 0) cliff.px(x, y, '#38584a');
    }
    for (let y = fy0 + 4; y < fy1; y += 6) for (let x = fx - 10; x < fx + 14; x += 2) if (cliff.has(x, y)) cliff.px(x, y + (x & 2 ? 1 : 0), '#46685a');
    cliff.rect(fx - 12, fy0 - 5, fx + 11, fy0 - 3, '#7ea490'); cliff.hline(fx - 12, fx + 11, fy0 - 5, '#d4ecd0');
    for (let x = fx - 12; x < fx + 12; x += 3) cliff.px(x, fy0 - 6, '#3aa040');
    cliff.rect(fx - 4, fy0 - 3, fx + 3, fy0, '#4a6e5e');
    for (let x = fx - 15; x < fx + 16; x += 3) { cliff.px(x, fy1 + 5, '#2c7a44'); cliff.px(x + 1, fy1 + 4, '#38904e'); }
    const cliffC = cliff.canvas();
    const FALL = ['#ffffff', '#c8f4ff', '#7ad8f0', '#46b4e0'];
    const spl = Array.from({ length: 10 }, (_, i) => ({ dir: i & 1 ? 1 : -1, ph: r(), per: 14 + (i % 3) * 3, sp: 5 + r() * 5, hgt: 4 + r() * 4 }));

    /* ---------- земля ---------- */
    const ground = new Layer(W, H), gtop = x => Y(152) + 2 * Math.sin(x / 7) + 1.5 * Math.sin(x / 3.1 + 1);
    const rg = mulberry32(3);
    for (let x = 0; x < W; x++) {
      const t = Math.round(gtop(x));
      for (let y = t; y < H; y++) {
        const u = clamp((y - t) / (H - t), 0, 1), b = bay(x, y);
        ground.px(x, y, u * 1.6 > b + .35 ? '#124a2c' : u > b * .6 ? '#1e6a3a' : '#2e8a48');
      }
      if (rg() < .3) ground.px(x, t, '#7ad868');
    }
    const groundC = ground.canvas();

    /* ---------- листья переднего плана ---------- */
    function leaf(L, bx, by, len, ang, wid, body, vein) {
      const ca = Math.cos(ang), sa = Math.sin(ang), N = 12, pts = [], back = [];
      for (let i = 0; i <= N; i++) {
        const t = i / N, ww = wid * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.04)), .75) * (1 - .2 * t);
        pts.push([bx + ca * len * t - sa * ww, by + sa * len * t + ca * ww]);
        back.unshift([bx + ca * len * t + sa * ww, by + sa * len * t - ca * ww]);
      }
      L.poly(pts.concat(back), body);
      L.line(Math.round(bx), Math.round(by), Math.round(bx + ca * len * .95), Math.round(by + sa * len * .95), vein);
      for (let t = .22; t < .85; t += .16) {
        const cx = bx + ca * len * t, cy = by + sa * len * t, ww = wid * Math.sin(Math.PI * t) * .75;
        for (const sg of [-1, 1]) L.line(Math.round(cx), Math.round(cy), Math.round(cx + ca * ww * .5 - sg * sa * ww * .85), Math.round(cy + sa * ww * .5 + sg * ca * ww * .85), vein);
      }
    }
    const lv = new Layer(W, H), rl = mulberry32(88);
    const lcol = ['#1f8a4a', '#26a058', '#187a40'], vcol = ['#8af0a0', '#9af8b0', '#6ad88a'];
    const L1 = n => Math.round(n * sc * 1.3);
    const bot = Y(192);
    leaf(lv, -2, bot - L1(6), L1(40), -.55, L1(11), lcol[0], vcol[0]);
    leaf(lv, -2, bot + 2, L1(36), -1.05, L1(10), lcol[1], vcol[1]);
    leaf(lv, L1(6), bot + 6, L1(34), -.2, L1(9), lcol[2], vcol[2]);
    leaf(lv, W + 2, bot - L1(4), L1(38), Math.PI + .5, L1(11), lcol[1], vcol[1]);
    leaf(lv, W + 2, bot + 4, L1(34), Math.PI + 1.0, L1(10), lcol[0], vcol[0]);
    leaf(lv, W - L1(6), bot + 6, L1(30), Math.PI + .15, L1(9), lcol[2], vcol[2]);
    leaf(lv, -3, Ys(-3), L1(34), .75, L1(11), lcol[0], vcol[0]);
    leaf(lv, -3, Ys(-2), L1(28), 1.25, L1(9), lcol[2], vcol[2]);
    leaf(lv, W + 3, Ys(-3), L1(34), Math.PI - .75, L1(11), lcol[1], vcol[1]);
    leaf(lv, W + 3, Ys(0), L1(26), Math.PI - 1.3, L1(9), lcol[0], vcol[0]);
    for (const d of [-1, 1]) for (const u of outward(d * 54, d, limit, 34, 60, rl)) {
      const ang = -Math.PI / 2 + (rl() - .5) * 1.4;
      leaf(lv, U(u), bot + 6, L1(randint(rl, 26, 40)), ang, L1(randint(rl, 8, 11)), lcol[randint(rl, 0, 2)], vcol[randint(rl, 0, 2)]);
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (lv.has(x, y) && !lv.has(x, y - 1) && bay(x, y) < .5) lv.px(x, y, '#c4f8a0');
    const lvC = lv.canvas();

    /* ---------- лианы, цветы, бабочки, попугаи ---------- */
    const FRUIT = ['#f0b030', '#e86a30', '#b060e0'];
    const vines = [[-20, 52, 1.5, .1], [-4, 36, 1.2, .5], [41, 62, 1.8, .8], [56, 44, 1.4, .3]].map(([u, len, amp, ph], i) => ({ x: Math.round(U(u)), len, amp, ph, fr: FRUIT[i % 3] }));
    for (const d of [-1, 1]) for (const u of outward(d * 62, d, limit, 18, 40, rl)) vines.push({ x: Math.round(U(u)), len: randint(rl, 26, 64), amp: 1 + rl() * 1.2, ph: rl(), fr: FRUIT[randint(rl, 0, 2)] });
    const FL = [['#ff5cb0', '#ffe0f0'], ['#ff9a30', '#fff0a0'], ['#a060f0', '#ecd8ff'], ['#ffd830', '#fff8c0'], ['#ff4848', '#ffd0c0']];
    const flowers = [[-12, 184, 0], [6, 188, 1], [22, 177, 2]];
    for (const d of [-1, 1]) for (const u of outward(d * 38, d, limit, 18, 34, rl)) flowers.push([u, randint(rl, 178, 190), randint(rl, 0, 4)]);
    const flw = new Layer(W, H);
    for (const [u, y, k] of flowers) {
      const x = Math.round(U(u)), yy = Y(y), [c1, c2] = FL[k];
      flw.vline(x, yy + 2, yy + 14, '#1c7a40'); flw.px(x - 1, yy + 6, '#1c7a40'); flw.px(x + 1, yy + 8, '#1c7a40');
      flw.disc(x, yy, 2, c1); flw.px(x, yy, c2); flw.px(x - 2, yy + 1, c1); flw.px(x + 2, yy + 1, c1); flw.px(x, yy - 2, c1);
    }
    const flwC = flw.canvas();
    const pollen = makeMotes(r, Math.round(26 * W / 128), W, { y0: Y(96), y1: Y(186), colors: ['#fff8b0', '#ffffff', '#f4ec90'], rise: .08, amp: [2, 6], big: .12 });
    const drops = makeMotes(r, 12, W, { x0: fx - 10, x1: fx + 10, y0: Y(136), y1: Y(152), colors: ['#ffffff', '#c8f4ff'], rise: .35, amp: [1, 3], big: 0 });
    const flies = [[-30, 150, '#ff9a30', 0], [18, 168, '#4aa0ff', .3], [44, 140, '#ffe040', .6], [-6, 176, '#ff70c0', .85]].map(([u, y, c, ph]) => ({ cx: U(u), cy: Y(y), c, ph }));
    const parrots = [[.55, Ys(34), '#e83030', 0], [.42, Ys(58), '#ffd020', 90]].map(([v, y, c, ph], i) => ({ v, y, c, x0: r() * (W + 80), ph, i }));
    // световые лучи сквозь листву
    const shafts = [[-30, .35, 12], [4, .4, 9], [38, .3, 13], [60, .38, 10]].map(([u, sl, w], i) => ({ x0: U(u), sl, w, ph: i * 1.7 }));
    const ov = new Overlay(W, H), mist = new Overlay(W, H);
    const sy0 = Ys(0), sy1 = Y(158);
    function raysDraw(f) {
      for (const s of shafts) {
        const cxs = s.x0 + 4 * Math.sin(TP * (f / 240 + s.ph));
        const amp = .55 + .45 * Math.sin(TP * (f / 180 + s.ph * 2));
        for (let y = sy0; y < sy1; y++) {
          const t = (y - sy0) / (sy1 - sy0), cc = cxs + s.sl * (y - sy0), w = s.w * (.6 + .6 * t);
          for (let x = Math.floor(cc - w); x <= Math.ceil(cc + w); x++) {
            const a = Math.pow(Math.max(0, 1 - Math.abs(x - cc) / w), 1.4) * .34 * amp * (1 - .55 * t);
            const q = Math.floor(a * 4 + bay(x, y)) / 4;
            if (q > 0) ov.over(x, y, '#fff6b0', q > 1 ? 1 : q);
          }
        }
      }
    }
    const bflap = (x, y, c, up) => { ctx_.fillStyle = c; ctx_.fillRect(x - 1, y - (up ? 1 : 0), 1, 2); ctx_.fillRect(x + 1, y - (up ? 1 : 0), 1, 2); ctx_.fillStyle = '#3a2a1a'; ctx_.fillRect(x, y, 1, 1); };
    let ctx_ = null;

    return {
      draw(ctx, f) {
        ctx_ = ctx;
        ctx.drawImage(skyC, 0, 0);
        drawCloudRows(ctx, rows, f, W);
        for (const p of parrots) {
          const P = W + 80, x = Math.floor(((p.x0 + p.v * f) % P + P) % P) - 40, y = p.y + Math.round(2 * Math.sin(TP * (f / 90 + p.ph / 90))), up = (((f >> 1) + p.i) & 1) === 1;
          ctx.fillStyle = p.c; ctx.fillRect(x, y, 3, 2); ctx.fillStyle = '#2860e0'; ctx.fillRect(x - 1, y + (up ? -1 : 1), 2, 1); ctx.fillRect(x + 1, y + (up ? -1 : 1), 2, 1);
          ctx.fillStyle = '#ffd020'; ctx.fillRect(x - 3, y + 1, 2, 1); ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 3, y, 1, 1);
        }
        for (const v of vines) {
          let ex = v.x;
          for (let k = 0; k < v.len; k++) {
            const sw = Math.round(v.amp * Math.pow(k / v.len, 1.6) * Math.sin(TP * (f / 90 + v.ph)));
            ctx.fillStyle = k & 1 ? '#3aa850' : '#2a8a40'; ctx.fillRect(v.x + sw, Ys(-1) + k, 1, 1);
            if (k % 7 === 3) { ctx.fillStyle = '#7ae080'; ctx.fillRect(v.x + sw + 1, Ys(-1) + k, 1, 1); }
            ex = v.x + sw;
          }
          fillDisc(ctx, ex, Ys(-1) + v.len + 2, 2, v.fr); ctx.fillStyle = '#fff4c0'; ctx.fillRect(ex - 1, Ys(-1) + v.len + 1, 1, 1);
        }
        ctx.drawImage(towerC, 0, 0);
        ctx.drawImage(farC, 0, 0);
        fog(mist, f, { y0: Y(108), y1: Y(130), color: '#e8fff0', strength: .2, speed: .35, fade: 'mid', levels: 3 });
        mist.flush(ctx, 0, Y(108), W, Y(130));
        ctx.drawImage(midC, 0, 0);
        ctx.drawImage(nearC, 0, 0);
        ctx.drawImage(cliffC, 0, 0);
        const sh = Math.floor(f * 1.4);
        for (let x = fx - 4; x < fx + 4; x++) {
          const edge = x === fx - 4 || x === fx + 3;
          for (let y = fy0; y < fy1; y++) {
            const v = (((y + ((x * 5) % 7) - sh) % 7) + 7) % 7;
            ctx.fillStyle = FALL[edge ? (v < 3 ? 2 : 3) : v < 2 ? 0 : v < 4 ? 1 : v < 6 ? 2 : 1];
            ctx.fillRect(x, y, 1, 1);
          }
        }
        for (const s of spl) {
          const p = (((f / s.per + s.ph) % 1) + 1) % 1, x = Math.round(fx + s.dir * (2 + s.sp * p)), y = Math.round(fy1 - s.hgt * Math.sin(Math.PI * p) + 3 * p * p);
          ctx.fillStyle = p < .7 ? '#ffffff' : '#a8e8f8'; ctx.fillRect(x, y, 1, 1);
        }
        drawMotes(ctx, drops, f);
        glowPulse(mist, fx, fy1 + 1, 12, '#ffffff', f, { per: 70, strength: .4, lo: .55 });
        fog(mist, f, { y0: fy1 - 8, y1: fy1 + 8, x0: fx - 22, x1: fx + 22, color: '#ffffff', strength: .4, speed: .25, fade: 'mid', levels: 3, lam: [30, 21] });
        mist.flush(ctx, Math.max(0, fx - 24), fy1 - 14, Math.min(W, fx + 24), fy1 + 14);
        ctx.drawImage(groundC, 0, 0);
        raysDraw(f); ov.flush(ctx, 0, sy0, W, sy1);
        drawMotes(ctx, pollen, f);
        ctx.drawImage(flwC, 0, 0);
        for (const b of flies) {
          const x = Math.round(b.cx + 14 * Math.sin(TP * (f / 140 + b.ph))), y = Math.round(b.cy + 6 * Math.sin(TP * (f / 90 + b.ph * 2)));
          bflap(x, y, b.c, (f >> 1) & 1);
        }
        ctx.drawImage(lvC, 0, 0);
      },
    };
  }
/* ===== END ===== */
  PixelBG.register('jungle', function (env) { return env.day ? buildDay(env) : buildNight(env); });
})();
