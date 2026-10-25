/* Саванна: огромное закатное солнце, плоские акации, жирафы, колышущаяся трава, стая птиц.
 * Два варианта: buildNight (вечер/ночь) и buildDay (день); выбор по env.variant. */
(function () {
  function buildNight(env) {
  const { W, H, Y, Ys, U, limit, px } = env;
  const { Layer, Overlay, mulberry32, randint, gradient, addGlow, sunDisc, makeRidge, hill, outward,
    cloudRow, drawCloudRows, makeStars, drawStars, makeMotes, drawMotes, fog, shimmer, drawBird } = px;
  const r = mulberry32(53), xc = W / 2, sunX = U(0), sunY = Y(122);

  /* ---------- небо и солнце ---------- */
  const sky = new Layer(W, H);
  gradient(sky, ['#18123e', '#241a58', '#3a2268', '#5e2a78', '#8a3a80', '#b84870', '#e0566a', '#f66e5c', '#ff8c5a', '#ffa860', '#ffc070'], 0, Y(138));
  addGlow(sky, sunX, sunY, 18, 92, '#ffa050', .85, 5, 1.5);
  addGlow(sky, sunX, sunY, 18, 150, '#ff7060', .4, 4, 1.8);
  sunDisc(sky, sunX, sunY, [[22, '#ffb858'], [20, '#ffcc70'], [16, '#ffe08c'], [11, '#fff0b4']]);
  const skyC = sky.canvas();
  const stars = makeStars(r, Math.round(48 * W / 128), W, Ys(78));
  const rows = [
    cloudRow({ sizes: [[40, 8], [34, 7], [46, 8]], seed: 4, cols: ['#5a2a78', '#c8507a', '#8a3a88'], y: Ys(12), v: .3, gap: 128, off: 10 }),
    cloudRow({ sizes: [[42, 7], [30, 6]], seed: 11, cols: ['#8a3a7a', '#ff9a6a', '#d0587a'], y: Ys(54), v: .42, gap: 120, off: 66 }),
    cloudRow({ sizes: [[34, 6], [26, 5], [40, 6]], seed: 17, cols: ['#c84a6e', '#ffa464', '#f0705e'], y: Ys(84), v: .6, gap: 136, off: 30 }),
  ];
  const flock = [[0, 0], [-6, -3], [-6, 3], [-12, -6], [-12, 6], [-18, -1]], flockX = r() * (W + 90), flockY = Ys(40);

  /* ---------- равнины: три слоя холмов с косой тенью ---------- */
  const far = new Layer(W, H), mid = new Layer(W, H), near = new Layer(W, H);
  hill(far, makeRidge(xc, Y(136), [[140, 2], [60, 1.2]], 5), { lit: '#a24a78', shade: '#7a3a6e', deep: '#5a2c64', rim: '#ffb070', lightX: sunX, k: .8, lean: .5, depth: 26 });
  hill(mid, makeRidge(xc, Y(150), [[110, 4], [55, 2]], 8), { lit: '#74366e', shade: '#5a2a62', deep: '#3e1d52', rim: '#e0805e', lightX: sunX, k: .8, lean: .6, depth: 26 });
  hill(near, makeRidge(xc, Y(168), [[90, 5], [40, 2]], 12), { lit: '#4a2460', shade: '#3a1c52', deep: '#281442', rim: '#a05070', lightX: sunX, k: .8, lean: .6, depth: 18 });
  near.rect(0, Y(184), W, H, '#1a0c30');

  /* ---------- акации и жирафы ---------- */
  function acacia(L, cx, by, cw, ch, th, col) {
    const top = by - th, hw = cw / 2;
    L.rect(cx - 1, top, cx, by, col);
    L.line(cx, top + Math.round(th * .25), cx - Math.round(cw * .3), top - 1, col);
    L.line(cx - 1, top + Math.round(th * .12), cx + Math.round(cw * .34), top - 1, col);
    L.poly([[cx - hw, top + 1], [cx - hw * .85, top - ch * .55], [cx - hw * .45, top - ch * .95], [cx, top - ch], [cx + hw * .45, top - ch * .95],
      [cx + hw * .85, top - ch * .55], [cx + hw, top + 1]], col);
    for (let x = Math.round(cx - hw * .8); x <= cx + hw * .8; x += 3) L.px(x, top + 2, col);
  }
  function giraffe(L, gx, gy, s, col) {
    const S = v => Math.round(v * s);
    L.ellipseBox(gx - S(9), gy - S(18), gx + S(8), gy - S(8), col);
    for (const dx of [-7, -4, 4, 7]) L.rect(gx + S(dx), gy - S(9), gx + S(dx), gy, col);
    L.poly([[gx + S(5), gy - S(16)], [gx + S(9), gy - S(17)], [gx + S(12), gy - S(36)], [gx + S(9), gy - S(37)]], col);
    L.poly([[gx + S(8), gy - S(38)], [gx + S(16), gy - S(39)], [gx + S(16), gy - S(36)], [gx + S(10), gy - S(35)]], col);
    L.rect(gx + S(10), gy - S(42), gx + S(10), gy - S(40), col); L.rect(gx + S(13), gy - S(42), gx + S(13), gy - S(40), col);
    L.line(gx - S(9), gy - S(16), gx - S(11), gy - S(8), col);
  }
  const beasts = new Layer(W, H), trees = new Layer(W, H), rt = mulberry32(31);
  for (const d of [-1, 1]) for (const u of outward(d * 30, d, limit, 44, 90, rt)) {     // дальние акации и жирафы по краям
    const x = U(u), by = Y(randint(rt, 146, 154));
    if (rt() < .35) giraffe(beasts, x, by, .8 + rt() * .2, '#4a2a66');
    else acacia(beasts, x, by, randint(rt, 14, 26), randint(rt, 4, 7), randint(rt, 8, 14), '#3a1f55');
  }
  acacia(beasts, U(46), Y(150), 16, 5, 11, '#3a1f55');                                     // дальняя акация за правой
  giraffe(beasts, U(31), Y(153), .85, '#4a2a66');                                         // второй жираф, дальше
  giraffe(beasts, U(21), Y(151), 1, '#2a1648');                                           // главный жираф
  acacia(trees, U(-42), Y(172), 52, 15, 36, '#1a0e2e');                                   // большая акация слева
  acacia(trees, U(48), Y(168), 34, 10, 30, '#1a0e2e');                                    // меньшая справа
  for (const d of [-1, 1]) for (const u of outward(d * 66, d, limit, 56, 110, rt)) {
    const s = .5 + rt() * .6;
    acacia(trees, U(u), Y(randint(rt, 164, 178)), Math.round(randint(rt, 30, 54) * s), Math.round(randint(rt, 9, 14) * s), Math.round(randint(rt, 26, 40) * s), '#1a0e2e');
  }

  /* ---------- трава переднего плана ---------- */
  const blades = [], rg = mulberry32(19);
  for (let x = 0; x < W; x += 1 + (rg() < .5 ? 1 : 0)) blades.push({ x, h: randint(rg, 5, 15), ph: rg(), tip: rg() < .12 });
  const motes = makeMotes(r, Math.round(26 * W / 128), W, { y0: Y(128), y1: Y(190), colors: ['#ffd870', '#ffb860', '#ffe8a0'], rise: .15, amp: [2, 5], big: .15 });
  const ov = new Overlay(W, H), tmp = document.createElement('canvas'); tmp.width = W; tmp.height = 40;
  const gb = Y(193);
  const farC = far.canvas(), midC = mid.canvas(), nearC = near.canvas(), beastsC = beasts.canvas(), treesC = trees.canvas();

  return {
    draw(ctx, f) {
      ctx.drawImage(skyC, 0, 0);
      drawStars(ctx, stars, f);
      drawCloudRows(ctx, rows, f, W);
      const fxp = Math.floor(((flockX + .33 * f) % (W + 90) + W + 90) % (W + 90)) - 45;
      flock.forEach(([dx, dy], i) => drawBird(ctx, fxp + dx, flockY + dy + Math.round(Math.sin(2 * Math.PI * f / 70 + i)), (((f >> 2) + i) & 1) === 1, '#2a1448'));
      shimmer(ctx, tmp, f, Y(122), Y(138), { amp: 1.2, dy: env.dy });
      ctx.drawImage(farC, 0, 0);
      ctx.drawImage(midC, 0, 0);
      ctx.drawImage(beastsC, 0, 0);
      fog(ov, f, { y0: Y(128), y1: Y(166), color: '#ff9a68', strength: .2, speed: .5, fade: 'mid', levels: 3 });
      ov.flush(ctx, 0, Y(128), W, Y(166));
      ctx.drawImage(nearC, 0, 0);
      ctx.drawImage(treesC, 0, 0);
      drawMotes(ctx, motes, f);
      for (const b of blades) {
        const off = Math.round(Math.sin(2 * Math.PI * (f / 70 + b.ph)) * Math.min(1.2, b.h / 9)), top = gb - b.h;
        ctx.fillStyle = '#150a2a'; ctx.fillRect(b.x, top + (b.h >> 1), 1, H - top);
        ctx.fillStyle = b.tip ? '#9a3a70' : '#4a2058'; ctx.fillRect(b.x + off, top, 1, (b.h >> 1) + 1);
      }
    },
  };
}
/* ===== DAY ===== */
  function buildDay(env) {
    const { W, H, Y, Ys, U, limit, px } = env;
    const { Layer, Overlay, mulberry32, randint, gradient, addGlow, sunDisc, makeRidge, hill, outward, edgeTop,
      cloudRow, drawCloudRows, makeMotes, drawMotes, fog, shimmer, drawBird } = px;
    const r = mulberry32(53), xc = W / 2, sunX = U(2), sunY = Ys(34);

    /* ---------- небо и высокое солнце ---------- */
    const sky = new Layer(W, H);
    gradient(sky, ['#2f7ee0', '#4a95e8', '#6aaaee', '#8cc0f2', '#aed4f6', '#cce6f8', '#e6f2f0', '#f6f4d8'], 0, Y(140));
    addGlow(sky, sunX, sunY, 10, 70, '#fff4c0', .75, 5, 1.5);
    addGlow(sky, sunX, sunY, 10, 120, '#fffbe0', .3, 4, 1.8);
    sunDisc(sky, sunX, sunY, [[11, '#ffe27a'], [9, '#ffee9a'], [7, '#fff8d0'], [5, '#ffffff']]);
    const skyC = sky.canvas();
    const cc = ['#f6f9fe', '#b4c8e6', '#ffffff'];
    const rows = [
      cloudRow({ sizes: [[46, 10], [36, 9], [54, 11]], seed: 4, cols: cc, y: Ys(12), v: .22, gap: 128, off: 10 }),
      cloudRow({ sizes: [[42, 9], [32, 8]], seed: 11, cols: cc, y: Ys(58), v: .3, gap: 120, off: 66 }),
      cloudRow({ sizes: [[36, 8], [28, 7], [42, 8]], seed: 17, cols: cc, y: Ys(88), v: .4, gap: 136, off: 30 }),
    ];
    const flock = [[0, 0], [-6, -3], [-6, 3], [-12, -6], [-12, 6], [-18, -1]], flockX = r() * (W + 90), flockY = Ys(44);

    /* ---------- равнины ---------- */
    const far = new Layer(W, H), mid = new Layer(W, H), near = new Layer(W, H);
    hill(far, makeRidge(xc, Y(136), [[140, 2], [60, 1.2]], 5), { lit: '#d6c878', shade: '#b8b468', deep: '#a8ae6c', rim: '#fff0a8', lightX: sunX, k: .8, lean: .5, depth: 26 });
    hill(mid, makeRidge(xc, Y(150), [[110, 4], [55, 2]], 8), { lit: '#c8b858', shade: '#a2a64a', deep: '#869a44', rim: '#f4e080', lightX: sunX, k: .8, lean: .6, depth: 26 });
    hill(near, makeRidge(xc, Y(168), [[90, 5], [40, 2]], 12), { lit: '#aab040', shade: '#80963a', deep: '#5e8030', rim: '#d8d868', lightX: sunX, k: .8, lean: .6, depth: 18 });
    near.rect(0, Y(184), W, H, '#4a6c26');

    /* ---------- акации и жирафы ---------- */
    function acacia(L, cx, by, cw, ch, th, col, trunk) {
      const top = by - th, hw = cw / 2;
      L.rect(cx - 1, top, cx, by, trunk);
      L.line(cx, top + Math.round(th * .25), cx - Math.round(cw * .3), top - 1, trunk);
      L.line(cx - 1, top + Math.round(th * .12), cx + Math.round(cw * .34), top - 1, trunk);
      L.poly([[cx - hw, top + 1], [cx - hw * .85, top - ch * .55], [cx - hw * .45, top - ch * .95], [cx, top - ch], [cx + hw * .45, top - ch * .95],
        [cx + hw * .85, top - ch * .55], [cx + hw, top + 1]], col);
      for (let x = Math.round(cx - hw * .8); x <= cx + hw * .8; x += 3) L.px(x, top + 2, col);
    }
    function giraffe(L, gx, gy, s, col, spot) {
      const T = new Layer(W, H), S = v => Math.round(v * s);
      T.ellipseBox(gx - S(9), gy - S(18), gx + S(8), gy - S(8), col);
      for (const dx of [-7, -4, 4, 7]) T.rect(gx + S(dx), gy - S(9), gx + S(dx), gy, col);
      T.poly([[gx + S(5), gy - S(16)], [gx + S(9), gy - S(17)], [gx + S(12), gy - S(36)], [gx + S(9), gy - S(37)]], col);
      T.poly([[gx + S(8), gy - S(38)], [gx + S(16), gy - S(39)], [gx + S(16), gy - S(36)], [gx + S(10), gy - S(35)]], col);
      T.rect(gx + S(10), gy - S(42), gx + S(10), gy - S(40), col); T.rect(gx + S(13), gy - S(42), gx + S(13), gy - S(40), col);
      T.line(gx - S(9), gy - S(16), gx - S(11), gy - S(8), col);
      for (let y = gy - S(44); y <= gy; y++) for (let x = gx - S(13); x <= gx + S(18); x++) if (T.has(x, y)) {
        const sp = ((x * 7 + y * 13) % 11 === 0) || ((x + y * 3) % 9 === 0 && (x >> 1) % 2 === 0);
        L.px(x, y, sp ? spot : col);
      }
    }
    const beasts = new Layer(W, H), trees = new Layer(W, H), rt = mulberry32(31);
    const GOL = '#d49a3c', GSP = '#8a5a26', GOL2 = '#b88a46', GSP2 = '#7a5a30';
    const farTree = '#6a9a48', farTrunk = '#6a5a3a', nearTree = '#2e7a30', nearTrunk = '#6a4a2a';
    for (const d of [-1, 1]) for (const u of outward(d * 30, d, limit, 44, 90, rt)) {
      const x = U(u), by = Y(randint(rt, 146, 154));
      if (rt() < .35) giraffe(beasts, x, by, .8 + rt() * .2, GOL2, GSP2);
      else acacia(beasts, x, by, randint(rt, 14, 26), randint(rt, 4, 7), randint(rt, 8, 14), farTree, farTrunk);
    }
    acacia(beasts, U(46), Y(150), 16, 5, 11, farTree, farTrunk);
    giraffe(beasts, U(31), Y(153), .85, GOL2, GSP2);
    giraffe(beasts, U(21), Y(151), 1, GOL, GSP);
    acacia(trees, U(-42), Y(172), 52, 15, 36, nearTree, nearTrunk);
    acacia(trees, U(48), Y(168), 34, 10, 30, nearTree, nearTrunk);
    for (const d of [-1, 1]) for (const u of outward(d * 66, d, limit, 56, 110, rt)) {
      const s = .5 + rt() * .6;
      acacia(trees, U(u), Y(randint(rt, 164, 178)), Math.round(randint(rt, 30, 54) * s), Math.round(randint(rt, 9, 14) * s), Math.round(randint(rt, 26, 40) * s), nearTree, nearTrunk);
    }
    // солнечная кромка на кронах
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (trees.has(x, y) && !trees.has(x, y - 1) && trees.d[((y * W + x) << 2)] < 100) trees.px(x, y, '#7ac04a');

    /* ---------- трава, пыльца ---------- */
    const blades = [], rg = mulberry32(19);
    for (let x = 0; x < W; x += 1 + (rg() < .5 ? 1 : 0)) blades.push({ x, h: randint(rg, 5, 15), ph: rg(), tip: rg() < .12 });
    const motes = makeMotes(r, Math.round(22 * W / 128), W, { y0: Y(120), y1: Y(190), colors: ['#fff6b8', '#ffffff', '#f4e890'], rise: .12, amp: [2, 5], big: .1 });
    const ov = new Overlay(W, H), tmp = document.createElement('canvas'); tmp.width = W; tmp.height = 40;
    const gb = Y(193);
    const farC = far.canvas(), midC = mid.canvas(), nearC = near.canvas(), beastsC = beasts.canvas(), treesC = trees.canvas();

    return {
      draw(ctx, f) {
        ctx.drawImage(skyC, 0, 0);
        drawCloudRows(ctx, rows, f, W);
        const fxp = Math.floor(((flockX + .33 * f) % (W + 90) + W + 90) % (W + 90)) - 45;
        flock.forEach(([dx, dy], i) => drawBird(ctx, fxp + dx, flockY + dy + Math.round(Math.sin(2 * Math.PI * f / 70 + i)), (((f >> 2) + i) & 1) === 1, '#26385a'));
        ctx.drawImage(farC, 0, 0);
        shimmer(ctx, tmp, f, Y(132), Y(146), { amp: 1, dy: env.dy });
        ctx.drawImage(midC, 0, 0);
        ctx.drawImage(beastsC, 0, 0);
        fog(ov, f, { y0: Y(128), y1: Y(166), color: '#fff2b0', strength: .16, speed: .5, fade: 'mid', levels: 3 });
        ov.flush(ctx, 0, Y(128), W, Y(166));
        ctx.drawImage(nearC, 0, 0);
        ctx.drawImage(treesC, 0, 0);
        drawMotes(ctx, motes, f);
        for (const b of blades) {
          const off = Math.round(Math.sin(2 * Math.PI * (f / 70 + b.ph)) * Math.min(1.2, b.h / 9)), top = gb - b.h;
          ctx.fillStyle = '#3e5c1c'; ctx.fillRect(b.x, top + (b.h >> 1), 1, H - top);
          ctx.fillStyle = b.tip ? '#f0e08a' : '#9aa83c'; ctx.fillRect(b.x + off, top, 1, (b.h >> 1) + 1);
        }
      },
    };
  }
/* ===== END ===== */
  PixelBG.register('savanna', function (env) { return env.day ? buildDay(env) : buildNight(env); });
})();
