/* Горы: закатное небо, розово-лавандовые пики, тёмный бор, озеро с отражением, высокие ёлки по краям.
 * Два варианта: buildNight (вечер/ночь) и buildDay (день); выбор по env.variant. */
(function () {
  function buildNight(env) {
  const { W, H, Y, Ys, U, limit, px } = env;
  const { C, Layer, mulberry32, randint, gradient, peakRidge, hill, outward, moonSprite, makeStars, drawStars,
    cloudRow, drawCloudRows, makeMotes, drawMotes, drawBird, fog, Overlay, pine, bay, clamp, mix, shimmer } = px;
  const TP2 = 2 * Math.PI;
  const r = mulberry32(71), xc = W / 2;
  const sc = clamp(W / 128, .7, 1);
  const moonX = U(35), moonY = Ys(22), shore = Y(157);

  /* ---------- небо ---------- */
  const sky = new Layer(W, H);
  gradient(sky, ['#0a0a38', '#141254', '#241e6c', '#3a2a80', '#5c3a90', '#8a4a98', '#c0608e', '#ee8494', '#ffa49c', '#ffb8a4'], 0, Y(140));
  const skyC = sky.canvas();
  const moon = moonSprite(7, ['#cfc8f4', '#f2eeff', '#ffffff'], true);
  const stars = makeStars(r, Math.round(78 * W / 128), W, Y(112), { avoid: (x, y) => Math.hypot(x - moonX, y - moonY) < 12 });
  const rows = [
    cloudRow({ sizes: [[34, 4], [26, 3], [40, 4]], seed: 8, cols: ['#4a3484', '#e87c9c', '#7a4a98'], y: Ys(58), v: .22, gap: 130, off: 20 }),
    cloudRow({ sizes: [[28, 3], [36, 4]], seed: 15, cols: ['#8a4a9a', '#ffa0a8', '#c0608e'], y: Ys(80), v: .3, gap: 110, off: 70 }),
  ];
  const birds = [[.30, Ys(40), 0], [.22, Ys(66), 40], [.38, Ys(30), 90]].map(([v, y, ph], i) => ({ v, y, x0: r() * (W + 60), ph, i }));

  /* ---------- пики: три ряда с розовой освещённой и лавандовой теневой гранью ---------- */
  const rm = mulberry32(19);
  const mk = (base, peaks, seed, o, ext) => {
    const L = new Layer(W, H);
    if (ext) for (const d of [-1, 1]) for (const u of outward(d * ext[0], d, limit, ext[1], ext[2], rm)) peaks.push([u, randint(rm, ext[3], ext[4]), randint(rm, ext[5], ext[6])]);
    hill(L, peakRidge(xc, base, peaks, seed, .2), o);
    return L.canvas();
  };
  const farC = mk(Y(142), [[-56, 46, 22], [-47, 52, 18], [-6, 62, 28], [16, 68, 34], [38, 42, 14], [54, 54, 22]], 3,
    { lit: '#ffd0e8', shade: '#a490d6', deep: '#6a4aa4', rim: '#fff0f8', lightX: -1e9, k: 2.6, lean: 0, depth: 110, sh: 2 }, [64, 24, 40, 34, 58, 16, 26]);
  const midC = mk(Y(146), [[-34, 40, 26], [-12, 30, 16], [14, 38, 18], [47, 50, 26], [60, 30, 14]], 7,
    { lit: '#f8aed6', shade: '#8a6cc0', deep: '#4a3290', rim: '#ffd0e8', lightX: -1e9, k: 2.6, lean: 0, depth: 90, sh: 2 }, [66, 26, 42, 26, 46, 16, 24]);
  const nearC = mk(Y(150), [[-10, 24, 30], [30, 20, 26], [-46, 18, 20]], 11,
    { lit: '#5a3e98', shade: '#3a2a7c', deep: '#281c5e', rim: '#8a6cc0', lightX: -1e9, k: 1.2, lean: 0, depth: 22, sh: 2 }, [60, 24, 40, 14, 26, 18, 28]);

  /* ---------- бор ---------- */
  const forest = new Layer(W, H), rf = mulberry32(23);
  [[Y(146), 9, 15, '#2a1e6c', '#5a4a9c', 4, 6], [Y(151), 11, 19, '#1e1660', '#40308a', 3, 6], [Y(157), 12, 22, '#150f4a', '#2e2270', 3, 5]].forEach(([base, h0, h1, col, rim, s0, s1]) => {
    for (let x = -4; x < W + 6; x += randint(rf, s0, s1)) pine(forest, x, base, randint(rf, h0, h1), col, rim, randint(rf, 6, 9), randint(rf, 3, 4));
  });
  forest.rect(0, Y(156), W, shore, '#150f4a');
  const forestC = forest.canvas();

  /* ---------- озеро с отражением ---------- */
  const scene = new Layer(W, H);
  const blit = src => { for (let i = 0; i < src.d.length; i += 4) if (src.d[i + 3]) { scene.d[i] = src.d[i]; scene.d[i + 1] = src.d[i + 1]; scene.d[i + 2] = src.d[i + 2]; scene.d[i + 3] = 255; } };
  blit(sky);
  [farC, midC, nearC, forestC].forEach(cv => { const L = new Layer(W, H); L.d.set(cv.getContext('2d').getImageData(0, 0, W, H).data); blit(L); });
  const lake = new Layer(W, H), LK = ['#34287a', '#2a2068', '#201858', '#181048'], LKm = LK.map(C);
  for (let y = shore; y < H; y++) {
    const t = clamp((y - shore) / Math.max(1, H - shore), 0, 1), k = Math.min(2, Math.floor(t * 3 + .0)), srcY = shore - 1 - Math.round((y - shore) * 1.5);
    for (let x = 0; x < W; x++) {
      const base = LKm[(t * 3 > bay(x, y) + k) ? Math.min(3, k + 1) : k];
      let c = base;
      if (srcY >= 0 && bay(x, y) < .72 - .35 * t) {
        const i = (srcY * W + x) << 2;
        if (scene.d[i + 3]) c = mix(base, [scene.d[i], scene.d[i + 1], scene.d[i + 2]], .55);
      }
      lake.px(x, y, c);
    }
  }
  const lakeC = lake.canvas();
  const rip = [];                                                           // полосы ряби на воде
  const rr = mulberry32(31);
  for (let k = 0; k < 8; k++) {
    const y = shore + 4 + k * Math.max(3, Math.round((H - shore - 6) / 8)), n = 4 + (k >> 1);
    for (let j = 0; j < n; j++) rip.push({ y, x: rr() * W, len: randint(rr, 3, 7), v: (k % 2 ? 1 : -1) * (.08 + .05 * (k % 3)), c: j & 1 ? '#6a58b0' : '#4a3c94' });
  }
  const glints = makeMotes(r, Math.round(16 * W / 128), W, { y0: shore + 3, y1: H - 2, colors: ['#ffc8e8', '#d0c0ff', '#ffe0f0'], rise: 0, amp: [0, 1], big: .25 });
  const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = 40;

  /* ---------- передний план: тёмные склоны и ёлки ---------- */
  const fg = new Layer(W, H), rt = mulberry32(51);
  const dark = '#07042a', rimF = '#4a3aa0', S1 = n => Math.round(n * sc);
  fg.poly([[-2, Y(150)], [S1(14), Y(160)], [S1(46), H + 2], [-2, H + 2]], dark);
  fg.poly([[W + 2, Y(166)], [W - S1(20), Y(177)], [W - S1(34), H + 2], [W + 2, H + 2]], dark);
  fg.rect(0, H - 3, W, H, dark);
  pine(fg, Math.round(U(-42)), Y(204), 84, dark, rimF, 32, 10);
  pine(fg, Math.round(U(-27)), Y(204), 48, dark, rimF, 22, 6);
  pine(fg, Math.round(U(46)), Y(204), 66, dark, rimF, 26, 8);
  for (const d of [-1, 1]) for (const u of outward(d * 60, d, limit, 16, 34, rt)) {
    const h = randint(rt, 40, 92);
    fg.poly([[U(u) - 14, H + 2], [U(u), Y(196)], [U(u) + 14, H + 2]], dark);
    pine(fg, Math.round(U(u)), Y(randint(rt, 198, 206)), h, dark, rimF, Math.round(h * .38), Math.max(5, Math.round(h / 9)));
  }
  const fgC = fg.canvas();
  const ov = new Overlay(W, H);

  return {
    draw(ctx, f) {
      ctx.drawImage(skyC, 0, 0);
      drawStars(ctx, stars, f);
      ctx.drawImage(moon, moonX - (moon.width >> 1), moonY - (moon.height >> 1));
      drawCloudRows(ctx, rows, f, W);
      for (const b of birds) {
        const x = Math.floor(((b.x0 + b.v * f) % (W + 60) + W + 60) % (W + 60)) - 30;
        drawBird(ctx, x, b.y + Math.round(2 * Math.sin(TP2 * (f / 80 + b.ph / 90))), (((f >> 2) + b.i) & 1) === 1, '#1c1048');
      }
      ctx.drawImage(farC, 0, 0);
      ctx.drawImage(midC, 0, 0);
      ctx.drawImage(nearC, 0, 0);
      fog(ov, f, { y0: Y(122), y1: Y(152), color: '#c898d8', strength: .26, speed: .3, fade: 'mid', levels: 3 });
      ov.flush(ctx, 0, Y(122), W, Y(152));
      ctx.drawImage(forestC, 0, 0);
      ctx.drawImage(lakeC, 0, 0);
      shimmer(ctx, tmp, f, shore + 1, H, { amp: 1, per: 5, spd: 30, dy: env.dy });
      for (const p of rip) {
        const x = Math.floor(((p.x + p.v * f) % W + W) % W);
        ctx.fillStyle = p.c; ctx.fillRect(x, p.y, p.len, 1);
      }
      drawMotes(ctx, glints, f);
      ctx.drawImage(fgC, 0, 0);
    },
  };
}
/* ===== DAY ===== */
  function buildDay(env) {
    const { W, H, Y, Ys, U, limit, px } = env;
    const { Layer, mulberry32, randint, gradient, addGlow, sunDisc, peakRidge, hill, outward, cloudRow, drawCloudRows,
      makeMotes, drawMotes, fog, Overlay, pine, bay, clamp, mix, shimmer, C } = px;
    const TP2 = 2 * Math.PI;
    const r = mulberry32(71), xc = W / 2;
    const sc = clamp(W / 128, .7, 1);
    const sunX = U(-34), sunY = Ys(26), shore = Y(157);

    /* ---------- небо, солнце, облака ---------- */
    const sky = new Layer(W, H);
    gradient(sky, ['#2a7ce0', '#4a96e8', '#6ab0ee', '#8cc8f2', '#b0def6', '#d0eefa', '#eaf8fc'], 0, Y(140));
    addGlow(sky, sunX, sunY, 8, 64, '#fff4c0', .7, 5, 1.5);
    sunDisc(sky, sunX, sunY, [[9, '#ffe27a'], [7, '#fff2a8'], [5, '#ffffff']]);
    const skyC = sky.canvas();
    const cc = ['#f6f9fe', '#b4c8e6', '#ffffff'];
    const rows = [
      cloudRow({ sizes: [[46, 10], [36, 9], [54, 11]], seed: 8, cols: cc, y: Ys(26), v: .22, gap: 130, off: 20 }),
      cloudRow({ sizes: [[36, 9], [48, 10]], seed: 15, cols: cc, y: Ys(64), v: .3, gap: 112, off: 70 }),
    ];
    const rowsMid = [cloudRow({ sizes: [[40, 9], [30, 8], [46, 10]], seed: 31, cols: cc, y: Y(112), v: .36, gap: 120, off: 40 })];
    const eagles = [[.5, Ys(40), 34, 0], [.8, Ys(62), 24, .5]].map(([ph, y, rx, o]) => ({ ph, y, rx, o }));

    /* ---------- пики: снежные шапки и голубые тени ---------- */
    const rm = mulberry32(19);
    const mk = (base, peaks, seed, o, ext) => {
      const L = new Layer(W, H);
      if (ext) for (const d of [-1, 1]) for (const u of outward(d * ext[0], d, limit, ext[1], ext[2], rm)) peaks.push([u, randint(rm, ext[3], ext[4]), randint(rm, ext[5], ext[6])]);
      hill(L, peakRidge(xc, base, peaks, seed, .2), o);
      return L.canvas();
    };
    const snowDepth = (x, top) => 22 + Math.round(5 * Math.sin(x * .45));
    const farC = mk(Y(142), [[-56, 46, 22], [-47, 52, 18], [-6, 62, 28], [16, 68, 34], [38, 42, 14], [54, 54, 22]], 3,
      { lit: '#a0b4d4', shade: '#6a84b4', deep: '#5c7ab0', rim: '#ffffff', lightX: -1e9, k: 2.6, lean: 0, depth: 110, sh: 2, snow: ['#ffffff', '#b4ccf0'], snowDepth }, [64, 24, 40, 34, 58, 16, 26]);
    const midC = mk(Y(146), [[-34, 40, 26], [-12, 30, 16], [14, 38, 18], [47, 50, 26], [60, 30, 14]], 7,
      { lit: '#8ea8c0', shade: '#5a7a9c', deep: '#486a90', rim: '#f4faff', lightX: -1e9, k: 2.6, lean: 0, depth: 90, sh: 2, snow: ['#f4f9ff', '#a8c4ea'], snowDepth: (x, t) => 14 + Math.round(4 * Math.sin(x * .5)) }, [66, 26, 42, 26, 46, 16, 24]);
    const nearC = mk(Y(150), [[-10, 24, 30], [30, 20, 26], [-46, 18, 20]], 11,
      { lit: '#5ea850', shade: '#3c8040', deep: '#2a6434', rim: '#b0e878', lightX: -1e9, k: 1.2, lean: 0, depth: 22, sh: 2 }, [60, 24, 40, 14, 26, 18, 28]);

    /* ---------- бор ---------- */
    const forest = new Layer(W, H), rf = mulberry32(23);
    [[Y(146), 9, 15, '#2e8048', '#66c468', 4, 6], [Y(151), 11, 19, '#1f6c3e', '#4cae5c', 3, 6], [Y(157), 12, 22, '#155a34', '#388e4e', 3, 5]].forEach(([base, h0, h1, col, rim, s0, s1]) => {
      for (let x = -4; x < W + 6; x += randint(rf, s0, s1)) pine(forest, x, base, randint(rf, h0, h1), col, rim, randint(rf, 6, 9), randint(rf, 3, 4));
    });
    forest.rect(0, Y(156), W, shore, '#155a34');
    const forestC = forest.canvas();

    /* ---------- озеро с отражением неба и гор ---------- */
    const scene = new Layer(W, H);
    const blit = src => { for (let i = 0; i < src.d.length; i += 4) if (src.d[i + 3]) { scene.d[i] = src.d[i]; scene.d[i + 1] = src.d[i + 1]; scene.d[i + 2] = src.d[i + 2]; scene.d[i + 3] = 255; } };
    blit(sky);
    [farC, midC, nearC, forestC].forEach(cv => { const L = new Layer(W, H); L.d.set(cv.getContext('2d').getImageData(0, 0, W, H).data); blit(L); });
    const lake = new Layer(W, H), LKm = ['#52a8dc', '#4296d0', '#3282c2', '#2870b0'].map(C);
    for (let y = shore; y < H; y++) {
      const t = clamp((y - shore) / Math.max(1, H - shore), 0, 1), k = Math.min(2, Math.floor(t * 3)), srcY = shore - 1 - Math.round((y - shore) * 1.5);
      for (let x = 0; x < W; x++) {
        const base = LKm[(t * 3 > bay(x, y) + k) ? Math.min(3, k + 1) : k];
        let c = base;
        if (srcY >= 0 && bay(x, y) < .78 - .3 * t) {
          const i = (srcY * W + x) << 2;
          if (scene.d[i + 3]) c = mix(base, [scene.d[i], scene.d[i + 1], scene.d[i + 2]], .62);
        }
        lake.px(x, y, c);
      }
    }
    const lakeC = lake.canvas();
    const rip = [], rr = mulberry32(31);
    for (let k = 0; k < 8; k++) {
      const y = shore + 4 + k * Math.max(3, Math.round((H - shore - 6) / 8)), n = 4 + (k >> 1);
      for (let j = 0; j < n; j++) rip.push({ y, x: rr() * W, len: randint(rr, 3, 7), v: (k % 2 ? 1 : -1) * (.08 + .05 * (k % 3)), c: j & 1 ? '#d4eeff' : '#8ccaf2' });
    }
    const glints = makeMotes(r, Math.round(20 * W / 128), W, { y0: shore + 3, y1: H - 2, colors: ['#ffffff', '#e8f6ff', '#fff6c8'], rise: 0, amp: [0, 1], big: .3 });
    const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = 40;

    /* ---------- передний план ---------- */
    const fg = new Layer(W, H), rt = mulberry32(51);
    const dark = '#143e2a', rimF = '#4ca262', S1 = n => Math.round(n * sc);
    fg.poly([[-2, Y(150)], [S1(14), Y(160)], [S1(46), H + 2], [-2, H + 2]], '#1c4a30');
    fg.poly([[W + 2, Y(166)], [W - S1(20), Y(177)], [W - S1(34), H + 2], [W + 2, H + 2]], '#1c4a30');
    fg.rect(0, H - 3, W, H, '#1c4a30');
    pine(fg, Math.round(U(-42)), Y(204), 84, dark, rimF, 32, 10);
    pine(fg, Math.round(U(-27)), Y(204), 48, dark, rimF, 22, 6);
    pine(fg, Math.round(U(46)), Y(204), 66, dark, rimF, 26, 8);
    for (const d of [-1, 1]) for (const u of outward(d * 60, d, limit, 16, 34, rt)) {
      const h = randint(rt, 40, 92);
      fg.poly([[U(u) - 14, H + 2], [U(u), Y(196)], [U(u) + 14, H + 2]], '#1c4a30');
      pine(fg, Math.round(U(u)), Y(randint(rt, 198, 206)), h, dark, rimF, Math.round(h * .38), Math.max(5, Math.round(h / 9)));
    }
    const fgC = fg.canvas();
    const ov = new Overlay(W, H);

    return {
      draw(ctx, f) {
        ctx.drawImage(skyC, 0, 0);
        drawCloudRows(ctx, rows, f, W);
        for (const e of eagles) {
          const a = TP2 * (f / 420 + e.ph), x = Math.round(xc + e.rx * 2 * Math.cos(a)), y = Math.round(e.y + 6 * Math.sin(2 * a)), up = Math.sin(a * 6) > .6;
          ctx.fillStyle = '#2a2030';
          for (const [dx, dy] of [[-4, up ? 0 : 1], [-3, 0], [-2, up ? -1 : 0], [-1, 0], [0, 0], [1, 0], [2, up ? -1 : 0], [3, 0], [4, up ? 0 : 1]]) ctx.fillRect(x + dx, y + dy, 1, 1);
          ctx.fillRect(x, y + 1, 1, 1);
        }
        ctx.drawImage(farC, 0, 0);
        drawCloudRows(ctx, rowsMid, f, W);
        ctx.drawImage(midC, 0, 0);
        ctx.drawImage(nearC, 0, 0);
        fog(ov, f, { y0: Y(122), y1: Y(152), color: '#eaf6ff', strength: .3, speed: .3, fade: 'mid', levels: 3 });
        ov.flush(ctx, 0, Y(122), W, Y(152));
        ctx.drawImage(forestC, 0, 0);
        ctx.drawImage(lakeC, 0, 0);
        shimmer(ctx, tmp, f, shore + 1, H, { amp: 1, per: 5, spd: 30, dy: env.dy });
        for (const p of rip) {
          const x = Math.floor(((p.x + p.v * f) % W + W) % W);
          ctx.fillStyle = p.c; ctx.fillRect(x, p.y, p.len, 1);
        }
        drawMotes(ctx, glints, f);
        ctx.drawImage(fgC, 0, 0);
      },
    };
  }
/* ===== END ===== */
  PixelBG.register('mountains', function (env) { return env.day ? buildDay(env) : buildNight(env); });
})();
