/* Море: закат с лунным месяцем, маяк на скале с вращающимся лучом, золотая дорожка, парусник.
 * Два варианта: buildNight (вечер/ночь) и buildDay (день); выбор по env.variant. */
(function () {
  function buildNight(env) {
  const { W, H, Y, Ys, U, limit, px } = env;
  const { C, css, Layer, Overlay, mulberry32, randint, clamp, bay, tri, gradient, addGlow, hill, edgeLight, edgeTop, outward,
    cloudRow, drawCloudRows, moonSprite, makeStars, drawStars, glowPulse, waves, glitter, drawBird } = px;
  const r = mulberry32(31), hy = Y(96), xc = W / 2;

  /* ---------- небо и вода ---------- */
  const sky = new Layer(W, H), water = new Layer(W, H);
  gradient(sky, ['#0a0a2c', '#14123e', '#1f1a56', '#30236c', '#4a2a82', '#6c3294', '#9a3e9c', '#c8509a', '#ee6c92', '#ff8f8c', '#ffaa8e', '#ffbc98'], 0, hy);
  gradient(water, ['#e8789e', '#c85ea2', '#a050a4', '#7a429e', '#56368e', '#3a2a78', '#2a2266', '#1e1a56'], hy, H);
  sky.d.set(water.d.subarray(hy * W * 4), hy * W * 4);
  const moonX = U(30), moonY = Ys(24);
  addGlow(sky, moonX, moonY, 6, 28, '#9a80e0', .38, 4, 1.6);
  addGlow(sky, U(-15), hy + 2, 4, 48, '#ffb096', .5, 4, 1.4);
  addGlow(sky, U(-15), hy + 38, 8, 50, '#b068b8', .26, 4, 1.6);
  const skyC = sky.canvas();
  const moon = moonSprite(8, ['#c8b8f0', '#f2ecff', '#ffffff'], true);
  const stars = makeStars(r, Math.round(54 * W / 128), W, Math.min(hy - 14, Ys(84)), { avoid: (x, y) => Math.hypot(x - moonX, y - moonY) < 13 });

  /* ---------- облака ---------- */
  const rows = [
    cloudRow({ sizes: [[40, 9], [32, 8], [50, 10]], seed: 3, cols: ['#6a3a8c', '#e0607e', '#9a4a98'], y: Ys(32), v: .32, gap: 124, off: 10 }),
    cloudRow({ sizes: [[26, 6], [34, 7]], seed: 9, cols: ['#8a46a0', '#d86a90', '#b05aa0'], y: Ys(52), v: .2, gap: 150, off: 70 }),
    cloudRow({ sizes: [[30, 6], [24, 5], [38, 7]], seed: 15, cols: ['#f07a9a', '#ffa890', '#ffa488'], y: Ys(68), v: .55, gap: 118, off: 40 }),
  ];

  /* ---------- горизонт: берег, островки, парусники ---------- */
  const far = new Layer(W, H), rf = mulberry32(5);
  const coastH = u => { const a = Math.abs(u); if (a < 78) return 0; const k = clamp((a - 78) / 46, 0, 1);
    return k * (1.8 + 1.5 * (Math.sin(u * .12 + 1) + Math.sin(u * .33 + 2) * .6 + 1.6)); };
  for (let x = 0; x < W; x++) {
    const h = Math.round(coastH(x - xc));
    if (h > 0) { far.rect(x, hy - h, x, hy - 1, '#a45a9a'); far.px(x, hy - h, '#d8709c'); }
  }
  for (const d of [-1, 1]) for (const u of outward(46 * d, d, limit, 38, 90, rf)) {
    const w = randint(rf, 6, 13), h = randint(rf, 1, 3), x = Math.round(xc + u);
    far.ellipseBox(x - (w >> 1), hy - h, x + (w >> 1), hy + h - 1, '#a45a9a');
    for (let i = -(w >> 1); i <= (w >> 1); i++) far.px(x + i, hy - h, '#d8709c');
  }
  function boat(L, cx, s) {
    const hull = s > 1 ? '#2a2058' : '#4a2e78';
    L.poly([[cx - 6 * s, hy - 2], [cx + 6 * s, hy - 2], [cx + 4 * s, hy + 1], [cx - 4 * s, hy + 1]], hull);
    L.poly([[cx - 6 * s, hy - 3], [cx, hy - 3], [cx, hy - 3 - 13 * s]], '#ffcade');
    L.poly([[cx, hy - 3], [cx + 5 * s, hy - 3], [cx, hy - 3 - 13 * s]], '#e898bc');
    L.px(cx, hy - 4 - 13 * s, '#ff8aa0');
    for (let y = hy + 1; y <= hy + 2; y++) for (let x = cx - 4 * s; x <= cx + 4 * s; x++) if (bay(x, y) > (y === hy + 1 ? .35 : .65)) L.px(x, y, '#50347c');
  }
  boat(far, U(-30), 1.0);
  boat(far, U(-70), .5);
  const farC = far.canvas();

  /* ---------- скала и маяк ---------- */
  const interp = (pts, u) => {
    if (u < pts[0][0] || u > pts[pts.length - 1][0]) return Infinity;
    for (let i = 1; i < pts.length; i++) if (u <= pts[i][0]) { const a = pts[i - 1], b = pts[i]; return a[1] + (b[1] - a[1]) * (u - a[0]) / (b[0] - a[0]); }
    return Infinity;
  };
  const mainPts = [[-4, 193], [-3, 188], [-1, 183], [1, 178], [3, 172], [6, 166], [9, 160], [12, 156], [16, 152.5], [20, 151], [24, 150], [62, 150],
    [75, 152], [95, 158], [120, 168], [140, 178], [160, 187], [178, 194]];
  const bumps = [{ u: -9, w: 10, h: 8 }], rb = mulberry32(17);
  for (const u of outward(-9, -1, limit, 44, 80, rb)) bumps.push({ u, w: randint(rb, 8, 16), h: randint(rb, 3, 8) });
  for (const u of outward(150, 1, limit, 30, 62, rb)) bumps.push({ u, w: randint(rb, 10, 18), h: randint(rb, 3, 9) });
  const rockTop = x => {
    const u = x - xc;
    let yd = interp(mainPts, u);
    if (yd < Infinity) yd += (.7 * Math.sin(u * .3 + 1) + .5 * Math.sin(u * .85 + .4)) * clamp((u + 2) / 10, 0, 1);
    for (const b of bumps) { const t = (u - b.u) / b.w; if (Math.abs(t) < 1) yd = Math.min(yd, 192 - b.h * Math.pow(1 - t * t, .55)); }
    return yd === Infinity ? H + 99 : Y(yd);
  };
  const rock = new Layer(W, H);
  hill(rock, rockTop, { lit: '#2a2060', shade: '#221a52', deep: '#171040', lean: 0, k: .9, depth: 50, sh: 2 });
  const rt = mulberry32(41);                                                      // трещины и блики на камне
  for (let i = 0, n = Math.round(W * .5); i < n; i++) {
    let x = Math.floor(rt() * W), y = Y(150) + Math.floor(rt() * (H - Y(150))); const len = 3 + Math.floor(rt() * 5), dx = rt() < .5 ? 1 : -1;
    for (let k = 0; k < len; k++, x += dx, y += (k & 1)) if (rock.has(x, y)) rock.px(x, y, '#140e34');
  }
  for (let i = 0, n = Math.round(W * .6); i < n; i++) {
    const x = Math.floor(rt() * W), y = Y(148) + Math.floor(rt() * 30);
    if (rock.has(x, y) && rock.has(x, y - 2)) rock.px(x, y, '#3a2e78');
  }
  edgeTop(rock, '#5446a8');
  edgeLight(rock, -1e9, '#8f7ce6');

  const lcx = U(28), by = Y(151), yt = by - 30;           // центр, основание и верх башни
  function lighthouse(L) {
    for (let y = yt; y <= by; y++) {
      const band = Math.floor((y - yt) / 5), white = band % 2 === 0;
      for (let dx = -4; dx <= 4; dx++) {
        const lit = dx <= -3, sh = dx >= 2;
        const c = white ? (lit ? '#fff0f8' : sh ? '#b8a0cc' : '#ecd8ec') : (lit ? '#ee7090' : sh ? '#a84468' : '#d65a7c');
        L.px(lcx + dx, y, c);
      }
    }
    L.rect(lcx - 5, by - 1, lcx + 5, by, '#3a2c58');
    L.rect(lcx, yt + 8, lcx, yt + 9, '#3a2058');                                // окошко
    L.rect(lcx - 5, yt - 3, lcx + 5, yt - 1, '#2c2358'); L.hline(lcx - 5, lcx - 2, yt - 3, '#4a3c80');   // галерея
    L.rect(lcx - 3, yt - 9, lcx + 3, yt - 4, '#ffeaa8');                        // фонарь
    L.rect(lcx - 2, yt - 8, lcx + 2, yt - 5, '#fff6cc'); L.hline(lcx - 3, lcx + 3, yt - 4, '#e8c878');
    L.vline(lcx - 1, yt - 8, yt - 5, '#e0b868'); L.vline(lcx + 1, yt - 8, yt - 5, '#e0b868');
    L.rect(lcx - 5, yt - 10, lcx + 5, yt - 10, '#3a2c58');
    L.poly([[lcx - 5, yt - 9], [lcx, yt - 9], [lcx, yt - 17]], '#b8a888');      // крыша: свет слева, тень справа
    L.poly([[lcx, yt - 9], [lcx + 6, yt - 9], [lcx, yt - 17]], '#6a5a58');
    L.vline(lcx, yt - 21, yt - 17, '#3a2c50'); L.px(lcx, yt - 22, '#ffd080');
  }
  lighthouse(rock);
  const rockC = rock.canvas();
  const lx = lcx, ly = yt - 6;

  /* ---------- пена и блики на скале ---------- */
  const foam = [], sparks = [], rr = mulberry32(23);
  for (let y = Y(153); y < H; y++) for (let x = 1; x < W; x++) {
    if (!rock.has(x, y) || rock.has(x - 1, y)) continue;
    if (rr() < .45) foam.push({ x, y, ph: rr(), per: [30, 40, 60][Math.floor(rr() * 3)], ln: 1 + Math.floor(rr() * 3) });
    if (rr() < .09) sparks.push({ x, y, ph: Math.floor(rr() * 64), per: [24, 32, 48][Math.floor(rr() * 3)] });
  }

  /* ---------- чайки и слои эффектов ---------- */
  const gulls = [0, 1, 2].map(i => ({ x0: r() * (W + 60), y: Ys([37, 55, 62][i]), v: [.3, .42, .24][i], ph: r() * 6, fl: Math.floor(r() * 4) }));
  const ovW = new Overlay(W, H), ovB = new Overlay(W, H);
  const LMAX = 62;
  function beam(ov, e, str) {
    const n = Math.floor(Math.abs(e)), s = e < 0 ? -1 : 1;
    for (let i = 3; i <= n; i++) {
      const hw = Math.min(9, 1.5 + i * .14), fade = Math.max(0, 1 - i / (LMAX * 1.05)), x = lx + s * i;
      for (let dy = -Math.ceil(hw); dy <= Math.ceil(hw); dy++) {
        const a = str * fade * Math.pow(Math.max(0, 1 - Math.abs(dy) / (hw + .5)), .8);
        const q = clamp(Math.floor(a * 3 + bay(x, ly + dy)) / 3, 0, 1);
        if (q > 0) ov.over(x, ly + dy, '#ffe6a0', q);
      }
    }
  }

  return {
    draw(ctx, f) {
      ctx.drawImage(skyC, 0, 0);
      drawStars(ctx, stars, f);
      ctx.drawImage(moon, moonX - (moon.width >> 1), moonY - (moon.height >> 1));
      drawCloudRows(ctx, rows, f, W);
      for (const g of gulls) {
        const x = Math.floor(((g.x0 + g.v * f) % (W + 60) + W + 60) % (W + 60)) - 30;
        drawBird(ctx, x, g.y + Math.round(2 * Math.sin(2 * Math.PI * f / 80 + g.ph)), (((f >> 2) + g.fl) & 1) === 1, '#2c1f58');
      }
      ctx.drawImage(farC, 0, 0);
      waves(ovW, f, { y0: hy + 3, y1: H, hi: '#ecb4d2', lo: '#2a2064', lam0: 4.6, lam1: 25, gap0: 3, dgap: .35, thr: .35, aHi: .55, aLo: .3 });
      glitter(ovW, f, U(-15) + Math.round(1.5 * Math.sin(f / 45)), hy + 2, H, 3, 28, '#ffe8b0', { thr: 1.1, alpha: .95 });
      ovW.flush(ctx, 0, hy + 1, W, H);
      ctx.drawImage(rockC, 0, 0);
      for (const m of foam) {
        const ox = Math.round(1.5 * Math.sin(2 * Math.PI * (f / m.per + m.ph))), lv = tri(f, m.per, m.ph * m.per);
        if (lv < .3) continue;
        ctx.fillStyle = lv > .65 ? '#e8e0ff' : '#9a88d8';
        ctx.fillRect(m.x - 1 - m.ln + ox, m.y, m.ln, 1);
      }
      for (const s of sparks) if (tri(f, s.per, s.ph) > .75) { ctx.fillStyle = '#ffffff'; ctx.fillRect(s.x, s.y, 1, 1); }
      // луч маяка: два противоположных луча вращаются, видна проекция на горизонталь
      const th = 2 * Math.PI * f / 180, c = Math.cos(th), sn = Math.sin(th);
      beam(ovB, c * LMAX, clamp(.72 + .28 * sn, .3, 1));
      beam(ovB, -c * LMAX, clamp(.72 - .28 * sn, .3, 1));
      glowPulse(ovB, lx, ly, 9 + Math.round(4 * Math.pow(Math.max(0, sn), 3)), '#ffd890', f, { per: 90, strength: .6, lo: .7 });
      ovB.flush(ctx, Math.max(0, lx - LMAX - 4), Math.max(0, ly - 16), Math.min(W, lx + LMAX + 4), Math.min(H, ly + 16));
    },
  };
}
/* ===== DAY ===== */
  function buildDay(env) {
    const { W, H, Y, Ys, U, limit, px } = env;
    const { css, Layer, Overlay, mulberry32, randint, clamp, bay, tri, gradient, addGlow, sunDisc, hill, edgeLight, edgeTop, outward,
      cloudRow, drawCloudRows, waves, glitter, drawBird } = px;
    const r = mulberry32(31), hy = Y(96), xc = W / 2;

    /* ---------- небо, вода, солнце ---------- */
    const sky = new Layer(W, H), water = new Layer(W, H);
    gradient(sky, ['#2c82e0', '#4a9aea', '#6cb2f0', '#8ecaf4', '#b0e0f6', '#d0f0f8', '#e8f8fa'], 0, hy);
    gradient(water, ['#5ab4e8', '#3ea4de', '#2c94d2', '#2aa4d0', '#30b8d2', '#44ccd4', '#60dcd8', '#78e8de'], hy, H);
    sky.d.set(water.d.subarray(hy * W * 4), hy * W * 4);
    const sunX = U(-15), sunY = Ys(30);
    addGlow(sky, sunX, sunY, 8, 66, '#fff4c0', .75, 5, 1.5);
    addGlow(sky, sunX, sunY, 8, 120, '#fffbe0', .3, 4, 1.8);
    sunDisc(sky, sunX, sunY, [[10, '#ffe27a'], [8, '#fff0a0'], [6, '#fff8d0'], [4, '#ffffff']]);
    addGlow(sky, sunX, hy + 2, 4, 40, '#e8fcff', .45, 4, 1.4);
    const skyC = sky.canvas();
    const cc = ['#f6f9fe', '#b4c8e6', '#ffffff'];
    const rows = [
      cloudRow({ sizes: [[46, 10], [36, 9], [54, 11]], seed: 3, cols: cc, y: Ys(26), v: .32, gap: 124, off: 10 }),
      cloudRow({ sizes: [[30, 8], [40, 9]], seed: 9, cols: cc, y: Ys(52), v: .2, gap: 150, off: 70 }),
      cloudRow({ sizes: [[34, 8], [26, 6], [42, 8]], seed: 15, cols: cc, y: Ys(70), v: .5, gap: 118, off: 40 }),
    ];

    /* ---------- горизонт: берег, островки, парусники ---------- */
    const far = new Layer(W, H), rf = mulberry32(5);
    const coastH = u => { const a = Math.abs(u); if (a < 78) return 0; const k = clamp((a - 78) / 46, 0, 1);
      return k * (1.8 + 1.5 * (Math.sin(u * .12 + 1) + Math.sin(u * .33 + 2) * .6 + 1.6)); };
    for (let x = 0; x < W; x++) {
      const h = Math.round(coastH(x - xc));
      if (h > 0) { far.rect(x, hy - h, x, hy - 1, '#5a9a8c'); far.px(x, hy - h, '#a0d8b8'); }
    }
    for (const d of [-1, 1]) for (const u of outward(46 * d, d, limit, 38, 90, rf)) {
      const w = randint(rf, 6, 13), h = randint(rf, 1, 3), x = Math.round(xc + u);
      far.ellipseBox(x - (w >> 1), hy - h, x + (w >> 1), hy + h - 1, '#5a9a8c');
      for (let i = -(w >> 1); i <= (w >> 1); i++) far.px(x + i, hy - h, '#a0d8b8');
    }
    function boat(L, cx, s) {
      const hull = s > 1 ? '#5a3a2c' : '#7a5a48';
      L.poly([[cx - 6 * s, hy - 2], [cx + 6 * s, hy - 2], [cx + 4 * s, hy + 1], [cx - 4 * s, hy + 1]], hull);
      L.poly([[cx - 6 * s, hy - 3], [cx, hy - 3], [cx, hy - 3 - 13 * s]], '#ffffff');
      L.poly([[cx, hy - 3], [cx + 5 * s, hy - 3], [cx, hy - 3 - 13 * s]], '#c4d8f0');
      L.px(cx, hy - 4 - 13 * s, '#e84848');
      for (let y = hy + 1; y <= hy + 2; y++) for (let x = cx - 4 * s; x <= cx + 4 * s; x++) if (bay(x, y) > (y === hy + 1 ? .35 : .65)) L.px(x, y, '#e8fcff');
    }
    boat(far, U(-30), 1.0);
    boat(far, U(-70), .5);
    const farC = far.canvas();

    /* ---------- скала и маяк ---------- */
    const interp = (pts, u) => {
      if (u < pts[0][0] || u > pts[pts.length - 1][0]) return Infinity;
      for (let i = 1; i < pts.length; i++) if (u <= pts[i][0]) { const a = pts[i - 1], b = pts[i]; return a[1] + (b[1] - a[1]) * (u - a[0]) / (b[0] - a[0]); }
      return Infinity;
    };
    const mainPts = [[-4, 193], [-3, 188], [-1, 183], [1, 178], [3, 172], [6, 166], [9, 160], [12, 156], [16, 152.5], [20, 151], [24, 150], [62, 150],
      [75, 152], [95, 158], [120, 168], [140, 178], [160, 187], [178, 194]];
    const bumps = [{ u: -9, w: 10, h: 8 }], rb = mulberry32(17);
    for (const u of outward(-9, -1, limit, 44, 80, rb)) bumps.push({ u, w: randint(rb, 8, 16), h: randint(rb, 3, 8) });
    for (const u of outward(150, 1, limit, 30, 62, rb)) bumps.push({ u, w: randint(rb, 10, 18), h: randint(rb, 3, 9) });
    const rockTop = x => {
      const u = x - xc;
      let yd = interp(mainPts, u);
      if (yd < Infinity) yd += (.7 * Math.sin(u * .3 + 1) + .5 * Math.sin(u * .85 + .4)) * clamp((u + 2) / 10, 0, 1);
      for (const b of bumps) { const t = (u - b.u) / b.w; if (Math.abs(t) < 1) yd = Math.min(yd, 192 - b.h * Math.pow(1 - t * t, .55)); }
      return yd === Infinity ? H + 99 : Y(yd);
    };
    const rock = new Layer(W, H);
    hill(rock, rockTop, { lit: '#b0a090', shade: '#867a72', deep: '#5a5252', lean: 0, k: .9, depth: 50, sh: 2 });
    const rt = mulberry32(41);
    for (let i = 0, n = Math.round(W * .5); i < n; i++) {
      let x = Math.floor(rt() * W), y = Y(150) + Math.floor(rt() * (H - Y(150))); const len = 3 + Math.floor(rt() * 5), dx = rt() < .5 ? 1 : -1;
      for (let k = 0; k < len; k++, x += dx, y += (k & 1)) if (rock.has(x, y)) rock.px(x, y, '#4a4242');
    }
    for (let i = 0, n = Math.round(W * .6); i < n; i++) {
      const x = Math.floor(rt() * W), y = Y(148) + Math.floor(rt() * 30);
      if (rock.has(x, y) && rock.has(x, y - 2)) rock.px(x, y, '#cabfaf');
    }
    edgeTop(rock, '#e0d6c4');
    edgeLight(rock, -1e9, '#f4ecdc');

    const lcx = U(28), by = Y(151), yt = by - 30;
    function lighthouse(L) {
      for (let y = yt; y <= by; y++) {
        const band = Math.floor((y - yt) / 5), white = band % 2 === 0;
        for (let dx = -4; dx <= 4; dx++) {
          const lit = dx <= -3, sh = dx >= 2;
          const c = white ? (lit ? '#ffffff' : sh ? '#b4bccc' : '#f0f0ec') : (lit ? '#f87068' : sh ? '#a82c34' : '#dc4444');
          L.px(lcx + dx, y, c);
        }
      }
      L.rect(lcx - 5, by - 1, lcx + 5, by, '#5a4a4a');
      L.rect(lcx, yt + 8, lcx, yt + 9, '#2a3a5a');
      L.rect(lcx - 5, yt - 3, lcx + 5, yt - 1, '#4a4a62'); L.hline(lcx - 5, lcx - 2, yt - 3, '#9a9ab4');
      L.rect(lcx - 3, yt - 9, lcx + 3, yt - 4, '#c8ecff');
      L.rect(lcx - 2, yt - 8, lcx + 2, yt - 5, '#e8f8ff'); L.hline(lcx - 3, lcx + 3, yt - 4, '#8ac0e0');
      L.vline(lcx - 1, yt - 8, yt - 5, '#7ab0d0'); L.vline(lcx + 1, yt - 8, yt - 5, '#7ab0d0');
      L.rect(lcx - 5, yt - 10, lcx + 5, yt - 10, '#4a4a62');
      L.poly([[lcx - 5, yt - 9], [lcx, yt - 9], [lcx, yt - 17]], '#f06860');
      L.poly([[lcx, yt - 9], [lcx + 6, yt - 9], [lcx, yt - 17]], '#b03038');
      L.vline(lcx, yt - 21, yt - 17, '#3a3a50'); L.px(lcx, yt - 22, '#ffe27a');
    }
    lighthouse(rock);
    const rockC = rock.canvas();
    const lx = lcx, ly = yt - 6;

    /* ---------- пена и блики на скале ---------- */
    const foam = [], sparks = [], rr = mulberry32(23);
    for (let y = Y(153); y < H; y++) for (let x = 1; x < W; x++) {
      if (!rock.has(x, y) || rock.has(x - 1, y)) continue;
      if (rr() < .45) foam.push({ x, y, ph: rr(), per: [30, 40, 60][Math.floor(rr() * 3)], ln: 1 + Math.floor(rr() * 3) });
      if (rr() < .09) sparks.push({ x, y, ph: Math.floor(rr() * 64), per: [24, 32, 48][Math.floor(rr() * 3)] });
    }

    /* ---------- чайки, эффекты ---------- */
    const gulls = [0, 1, 2, 3, 4].map(i => ({ x0: r() * (W + 60), y: Ys([37, 55, 62, 44, 70][i]), v: [.3, .42, .24, .36, .28][i], ph: r() * 6, fl: Math.floor(r() * 4) }));
    const ovW = new Overlay(W, H);

    return {
      draw(ctx, f) {
        ctx.drawImage(skyC, 0, 0);
        drawCloudRows(ctx, rows, f, W);
        for (const g of gulls) {
          const x = Math.floor(((g.x0 + g.v * f) % (W + 60) + W + 60) % (W + 60)) - 30;
          drawBird(ctx, x, g.y + Math.round(2 * Math.sin(2 * Math.PI * f / 80 + g.ph)), (((f >> 2) + g.fl) & 1) === 1, '#ffffff');
        }
        ctx.drawImage(farC, 0, 0);
        waves(ovW, f, { y0: hy + 3, y1: H, hi: '#ffffff', lo: '#1c6aaa', lam0: 4.6, lam1: 25, gap0: 3, dgap: .35, thr: .35, aHi: .7, aLo: .3 });
        glitter(ovW, f, sunX + Math.round(1.5 * Math.sin(f / 45)), hy + 2, H, 3, 28, '#ffffff', { thr: 1.1, alpha: .95 });
        ovW.flush(ctx, 0, hy + 1, W, H);
        ctx.drawImage(rockC, 0, 0);
        for (const m of foam) {
          const ox = Math.round(1.5 * Math.sin(2 * Math.PI * (f / m.per + m.ph))), lv = tri(f, m.per, m.ph * m.per);
          if (lv < .3) continue;
          ctx.fillStyle = lv > .65 ? '#ffffff' : '#b8e4f8';
          ctx.fillRect(m.x - 1 - m.ln + ox, m.y, m.ln, 1);
        }
        for (const s of sparks) if (tri(f, s.per, s.ph) > .75) { ctx.fillStyle = '#ffffff'; ctx.fillRect(s.x, s.y, 1, 1); }
        // блик на стекле фонаря (луча днём нет)
        if (tri(f, 90, 0) > .78) { ctx.fillStyle = '#ffffff'; ctx.fillRect(lx - 2, ly - 3, 5, 1); ctx.fillRect(lx, ly - 5, 1, 5); }
      },
    };
  }
/* ===== END ===== */
  PixelBG.register('sea', function (env) { return env.day ? buildDay(env) : buildNight(env); });
})();
