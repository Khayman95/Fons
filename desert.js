/* Пустыня: ночь = закат с луной и звёздами, день = яркое небо и высокое солнце.
 * Эталонная сцена: по ней видно, как устроены обе версии и привязка к экрану. */
PixelBG.register('desert', function (env) {
  const { W, H, dy, Y, Ys, U, limit, night, px } = env;
  const { C, css, Layer, mulberry32, randint, gradient, addGlow, sunDisc, makeRidge, hill, edgeLight, outward,
    cloudRow, drawCloudRows, moonSprite, makeStars, drawStars, shimmer, drawBird, palm } = px;
  const r = mulberry32(7);

  /* ---------- палитры двух вариантов ---------- */
  const P = night ? {
    sky: ['#150f3a', '#241553', '#3d1c68', '#66247a', '#9a3a82', '#cf5a76', '#f0825f', '#ffb067', '#ffd88a'],
    butte: '#8d3b80', butteRim: '#d0607a',
    far: { lit: '#a64880', shade: '#7a3578', deep: '#5a2a6a', rim: '#ffa070' },
    mid: { lit: '#d4684f', shade: '#6e2d62', deep: '#3e1d4e', rim: '#ffc27a' },
    ground: { lit: '#4a2350', shade: '#2a1340', deep: '#1a0c2e', rim: '#8a4268' },
    palm: '#4a2064', cactus: '#170a2a', cactusRim: '#d0607a', rock: '#170a2a',
    sand: ['#ffd9a0', '#ffd9a0', '#ffb878'],
  } : {
    sky: ['#2c74d6', '#3d86e2', '#5499ea', '#71b0f0', '#94c8f4', '#b6dcf4', '#d9ecf0', '#f6f0d4'],
    butte: '#c47a50', butteRim: '#f2ae7e',
    far: { lit: '#f0c070', shade: '#c98d58', deep: '#a8704e', rim: '#fbe0a0' },
    mid: { lit: '#f7d488', shade: '#d6a05c', deep: '#b9834c', rim: '#ffeab0' },
    ground: { lit: '#e6b86c', shade: '#c08a54', deep: '#a26f48', rim: '#ffe0a0' },
    palm: '#2a7a3a', cactus: '#3c8a43', cactusHi: '#9ad86c', cactusDk: '#235f30', rock: '#a8765a', rockHi: '#e0b088',
    sand: ['#fff0c0', '#ffe6a8', '#fffadc'],
  };

  /* ---------- мелкие рисовалки пустыни ---------- */
  function saguaro(L, x, y, h, col, arms, tw = 2) {
    L.rect(x - tw, y - h + 3, x + tw, y, col);
    L.ellipseBox(x - tw, y - h, x + tw, y - h + 6, col);
    for (const [side, ay, ln, ah] of arms) {
      const yy = y - Math.floor(h * ay), xe = x + side * (tw + ln), xa = Math.min(x + side * tw, xe), xb = Math.max(x + side * tw, xe);
      L.rect(xa, yy, xb, yy + 2, col);
      L.rect(xe - 1, yy - ah, xe + 1, yy + 2, col);
      L.ellipseBox(xe - 1, yy - ah - 1, xe + 1, yy - ah + 2, col);
    }
  }
  function butte(L, cx, base, w, h, col, rim) {
    const l = cx - (w >> 1), rr = cx + (w >> 1);
    L.poly([[l - 3, base + 24], [l + 1, base - Math.floor(h * .55)], [l + 4, base - Math.floor(h * .55)], [l + 6, base - h],
      [rr - 6, base - h], [rr - 4, base - Math.floor(h * .6)], [rr + 1, base - Math.floor(h * .5)], [rr + 4, base + 24]], col);
    L.line(rr + 1, base - Math.floor(h * .5), rr - 4, base - Math.floor(h * .6), rim);
    L.line(rr - 4, base - Math.floor(h * .6), rr - 6, base - h, rim);
  }
  function edgeShade(L, lightX, col) {        // тёмная кромка на стороне, противоположной свету
    col = C(col); const d = L.d, w = L.w, hit = [];
    for (let y = 0; y < L.h; y++) for (let x = 0; x < w; x++) {
      if (!d[((y * w + x) << 2) + 3]) continue;
      const eR = x + 1 >= w || !d[((y * w + x + 1) << 2) + 3], eL = x - 1 < 0 || !d[((y * w + x - 1) << 2) + 3];
      if (x < lightX ? eL : eR) hit.push((y * w + x) << 2);
    }
    for (const i of hit) { d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; }
  }

  /* ---------- небо и солнце ---------- */
  const sunX = U(22), sunY = night ? Y(134) : Ys(46);
  const sky = new Layer(W, H);
  gradient(sky, P.sky, 0, Y(142));
  if (night) {
    addGlow(sky, sunX, sunY, 14, 70, '#ff9a5c', .95, 5, 1.5);
    addGlow(sky, sunX, sunY, 14, 130, '#ff6f7a', .45, 4, 1.8);
    sunDisc(sky, sunX, sunY, [[17, '#ffd88a'], [15, '#ffe7a3'], [11, '#fff3c8']]);
  } else {
    addGlow(sky, sunX, sunY, 10, 78, '#fff6c8', .9, 5, 1.6);
    addGlow(sky, sunX, sunY, 10, 150, '#ffffff', .22, 4, 1.8);
    sunDisc(sky, sunX, sunY, [[12, '#ffe27a'], [10, '#fff0a0'], [8, '#fffbe0']]);
  }
  const skyC = sky.canvas();

  /* ---------- луна и звёзды (ночь) ---------- */
  const moon = night ? moonSprite(8, ['#c8b8e8', '#efe6ff', '#ffffff'], true) : null;
  const moonX = U(-34), moonY = Ys(34);
  const stars = night ? makeStars(r, Math.round(46 * W / 128), W, Ys(84), { avoid: (x, y) => Math.hypot(x - moonX, y - moonY) < 12 }) : [];

  /* ---------- облака ---------- */
  const rows = night ? (() => {
    const hi = ['#4b2470', '#c8607e', '#8a3f92'], lo = ['#7a3584', '#ffa070', '#c45a8c'];
    return [
      cloudRow({ sizes: [[46, 10], [36, 9], [54, 11]], seed: 1, cols: hi, y: Ys(16), v: .53, gap: 104, off: 6 }),
      cloudRow({ sizes: [[36, 9], [48, 10], [30, 8]], seed: 12, cols: hi, y: Ys(52), v: .53, gap: 96, off: 52 }),
      cloudRow({ sizes: [[40, 10], [30, 8], [48, 9]], seed: 23, cols: lo, y: Ys(86), v: 1.07, gap: 132, off: 14 }),
      cloudRow({ sizes: [[30, 8], [42, 10], [36, 9]], seed: 34, cols: lo, y: Ys(108), v: 1.07, gap: 120, off: 76 }),
    ];
  })() : (() => {
    const wh = ['#f6f9fe', '#b4c8e6', '#ffffff'];
    return [
      cloudRow({ sizes: [[46, 10], [36, 9], [54, 11]], seed: 5, cols: wh, y: Ys(14), v: .35, gap: 112, off: 20 }),
      cloudRow({ sizes: [[36, 9], [48, 10], [30, 8]], seed: 16, cols: wh, y: Ys(48), v: .6, gap: 104, off: 66 }),
      cloudRow({ sizes: [[40, 10], [30, 8], [48, 9]], seed: 27, cols: wh, y: Ys(84), v: .9, gap: 128, off: 10 }),
    ];
  })();

  /* ---------- дальний план: мезы, дюны, пальмы ---------- */
  const far = new Layer(W, H), rb = mulberry32(11);
  const buttes = [{ u: -44, w: 26, h: 14 }, { u: 0, w: 16, h: 8 }, { u: 42, w: 30, h: 20 }];
  for (const [s0, d] of [[-44, -1], [42, 1]]) for (const u of outward(s0, d, limit, 54, 96, rb)) buttes.push({ u, w: randint(rb, 18, 34), h: randint(rb, 8, 24) });
  for (const b of buttes) butte(far, U(b.u), Y(146), b.w, b.h, P.butte, P.butteRim);
  const hFar = makeRidge(W / 2, Y(146), [[128, 4], [64, 3], [43, 1.5], [256, 3]], 11);
  hill(far, hFar, Object.assign({ lightX: sunX, k: .8, lean: .3, depth: 20 }, P.far));
  for (const [u, ph, lean] of [[-12, 22, -5], [-6, 17, 4], [-18, 14, -3], [-176, 17, 4], [-170, 13, -3], [188, 17, -4], [194, 13, 3]]) {
    const x = U(u); if (Math.abs(u) < limit + 20) palm(far, x, Math.round(hFar(x)) + 2, ph, P.palm, lean, 9);
  }
  const farC = far.canvas();

  /* ---------- средний план ---------- */
  const mid = new Layer(W, H);
  hill(mid, makeRidge(W / 2, Y(162), [[128, 5], [64, 3], [43, 1.5], [256, 4]], 5), Object.assign({ lightX: sunX, k: .5, lean: .3, depth: 20 }, P.mid));
  const midC = mid.canvas();

  /* ---------- передний план: земля, кактусы, камни ---------- */
  const hGr = makeRidge(W / 2, Y(179), [[128, 3], [64, 2], [43, 1], [256, 2]], 9);
  const ground = new Layer(W, H);
  hill(ground, hGr, Object.assign({ lightX: sunX, k: .8, lean: .6, depth: 12 }, P.ground));
  const groundC = ground.canvas();
  const cact = new Layer(W, H), rc = mulberry32(21);
  const armSets = [[[1, .5, 6, 14], [-1, .36, 5, 9]], [[-1, .45, 5, 10]], [[1, .4, 5, 8]], [[1, .55, 6, 12], [-1, .45, 5, 7]]];
  const cacti = [{ u: -38, h: 42, arms: armSets[0] }, { u: 40, h: 32, arms: armSets[1] }, { u: 2, h: 15, arms: [[1, .4, 4, 5]] }];
  for (const [s0, d] of [[-38, -1], [40, 1]]) for (const u of outward(s0, d, limit, 46, 84, rc)) cacti.push({ u, h: randint(rc, 18, 44), arms: armSets[randint(rc, 0, 3)] });
  const rocks = [{ u: -24, w: 10, h: 5 }, { u: -14, w: 6, h: 3 }, { u: 28, w: 11, h: 5 }];
  for (const [s0, d] of [[-24, -1], [28, 1]]) for (const u of outward(s0, d, limit, 36, 70, rc)) rocks.push({ u, w: randint(rc, 6, 12), h: randint(rc, 3, 6) });
  for (const c of cacti) { const x = U(c.u); saguaro(cact, x, Math.round(hGr(x)) + (c.h < 20 ? 5 : 6), c.h, P.cactus, c.arms); }
  for (const k of rocks) { const x = U(k.u), b = Math.round(hGr(x)) + 3; cact.poly([[x, b], [x + 2, b - k.h], [x + k.w - 2, b - k.h + 1], [x + k.w, b]], P.rock); }
  if (night) edgeLight(cact, sunX, P.cactusRim);
  else { edgeShade(cact, sunX, P.cactusDk); edgeLight(cact, sunX, P.cactusHi); }
  const cactC = cact.canvas();

  /* ---------- песчинки, птицы, марево ---------- */
  const parts = [], nParts = Math.round((night ? 24 : 16) * W / 128);
  for (let i = 0; i < nParts; i++) parts.push({ x: r() * W, y: Y(112) + Math.floor(r() * 76), v: [1, 2][Math.floor(r() * 2)] * 1.0667,
    per: [40, 60, 120][Math.floor(r() * 3)], ph: r(), ln: 2 + Math.floor(r() * 2), c: css(P.sand[Math.floor(r() * 3)]) });
  const birds = night ? [] : [0, 1, 2].map(i => ({ x0: r() * (W + 60), y: Ys(30 + i * 13), v: .45 + i * .12, ph: r() * 6 }));
  const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = 40;

  return {
    draw(ctx, f) {
      ctx.drawImage(skyC, 0, 0);
      if (night) {
        drawStars(ctx, stars, f);
        ctx.drawImage(moon, moonX - (moon.width >> 1), moonY - (moon.height >> 1));
      }
      drawCloudRows(ctx, rows, f, W);
      for (const b of birds) {
        const x = Math.floor(((b.x0 + b.v * f) % (W + 60) + W + 60) % (W + 60)) - 30;
        drawBird(ctx, x, b.y + Math.round(2 * Math.sin(2 * Math.PI * f / 60 + b.ph)), ((f >> 1) & 1) === 1, '#3b2b3a');
      }
      ctx.drawImage(farC, 0, 0);
      shimmer(ctx, tmp, f, Y(124), Y(146), { amp: night ? 1.2 : 1.6, dy });
      ctx.drawImage(midC, 0, 0);
      for (const p of parts) {
        const x = Math.floor((p.x + p.v * f) % W), y = p.y + Math.round(2 * Math.sin(2 * Math.PI * (f / p.per + p.ph)));
        ctx.fillStyle = p.c; ctx.fillRect(x - p.ln, y, p.ln + 1, 1);
      }
      ctx.drawImage(cactC, 0, 0);
      ctx.drawImage(groundC, 0, 0);
    },
  };
});
