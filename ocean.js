/* Океан: глубокая ночь, полная луна на горизонте с лунной дорожкой, далёкая гроза слева,
 * кит с фонтаном, Млечный Путь, светящийся планктон, огонёк корабля.
 * Два варианта: buildNight (ночь) и buildDay (день); выбор по env.variant. */
(function () {
  function buildNight(env) {
  const { W, H, dy, Y, Ys, U, limit, px } = env;
  const { C, css, Layer, Overlay, mulberry32, randint, bay, clamp, gradient, addGlow, edgeLight, outward,
    cloudRow, drawCloudRows, makeStars, drawStars, drawSparkles, makeMotes, drawMotes, waves, glitter } = px;
  const r = mulberry32(2024);
  const sstep = (a, b, t) => { t = clamp((t - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const hash = n => { let x = Math.imul(n + 1, 0x9E3779B1); x ^= x >>> 15; x = Math.imul(x, 0x85EBCA6B); x ^= x >>> 13; return (x >>> 0) / 4294967296; };
  const lighten = (L, x, y, col, t) => {          // подмешать цвет к готовому пикселю слоя
    if (x < 0 || y < 0 || x >= L.w || y >= L.h) return;
    const i = (y * L.w + x) << 2, d = L.d; col = C(col);
    d[i] += (col[0] - d[i]) * t; d[i + 1] += (col[1] - d[i + 1]) * t; d[i + 2] += (col[2] - d[i + 2]) * t;
  };

  /* ---------- палитра ---------- */
  const P = {
    sky: ['#03051a', '#060a2a', '#0c1340', '#142058', '#1f2d80', '#2f3f9e', '#4658bc', '#6478d2'],
    sea: ['#4a5cc0', '#3342a4', '#27358c', '#1c2874', '#141e5c', '#0e1648', '#0a1038'],
    starPal: [null, '#4a56a8', '#9aa6ec', '#ffffff'],
    storm: '#0a1032', stormRim: '#1f2e78', stormEdge: '#33449e',
    whale: '#0a1135', whaleMid: '#1a2872', whaleRim: '#4660c0', foam: '#a8b8f8',
  };

  const seaY = Y(88), hs = H - seaY;               // горизонт и высота моря
  const mx = U(0), my = Y(74), MR = 20;            // луна: центр и радиус
  const xc = W / 2;

  /* ---------- небо, Млечный Путь, луна ---------- */
  const sky = new Layer(W, H);
  gradient(sky, P.sky, 0, seaY - 1);
  const P0x = xc - 80, P0y = Ys(70), ddx = 150, ddy = -70 * (H / 192), dl = Math.hypot(ddx, ddy), bw = 13 * (H / 192);
  const bandA = (x, y) => {                        // плотность полосы Млечного Пути 0..1
    const d = Math.abs((x - P0x) * ddy - (y - P0y) * ddx) / dl, e = Math.exp(-(d / bw) * (d / bw));
    return e * (.55 + .45 * Math.sin(x * .27 + y * .11) * Math.sin(x * .09 - y * .23 + 1.3));
  };
  for (let y = 0; y < seaY; y++) for (let x = 0; x < W; x++) {
    const a = bandA(x, y), q = Math.floor(a * 1.7 + bay(x, y)) / 3;
    if (q > 0) lighten(sky, x, y, '#7684de', q * .85);
  }
  const bandSpeck = ['#6f7cd8', '#98a4ee', '#4c58b0'];
  for (let i = 0, n = Math.round(300 * W / 128), g = 0; i < n && g++ < 9000;) {
    const x = Math.floor(r() * W), y = Math.floor(r() * (seaY - 3));
    if (r() < bandA(x, y)) { sky.px(x, y, bandSpeck[Math.floor(r() * 3)]); i++; }
  }
  addGlow(sky, mx, my, MR, 58, '#7f8ef0', .9, 5, 1.4);
  addGlow(sky, mx, my, MR, 118, '#4c5cc8', .5, 4, 1.6);
  // луна: лимб, тело, кратеры
  sky.disc(mx, my, MR, '#9eacec');
  sky.disc(mx - 1, my, MR - 1, '#cdd5fa');
  sky.disc(mx - 2, my - 1, MR - 2, '#f2f4ff');
  for (const [cx, cy, cr] of [[-8, -4, 4], [7, -8, 3], [4, 4, 4], [-5, 9, 3]]) sky.disc(mx + cx - 2, my + cy - 1, cr, '#c3cbf2');
  // огонёк корабля на горизонте
  const shipX = U(36);
  sky.rect(shipX - 3, seaY - 1, shipX + 3, seaY - 1, '#0a1236');
  sky.px(shipX - 1, seaY - 2, '#0a1236'); sky.px(shipX + 1, seaY - 2, '#0a1236');
  const skyC = sky.canvas();

  /* ---------- звёзды ---------- */
  const avoid = (x, y) => Math.hypot(x - mx, y - my) < MR + 6 || (y > Y(56) && x < U(-12));
  const stars = makeStars(r, Math.round(70 * W / 128 * H / 192), W, seaY - 3, { avoid });
  for (let nb = Math.round(80 * W / 128 * H / 192), g = 0; nb > 0 && g++ < 5000;) {
    const x = Math.floor(r() * W), y = Math.floor(r() * (seaY - 3));
    if (avoid(x, y)) continue;
    if (r() < bandA(x, y) * .9) { stars.push([x, y, Math.floor(r() * 128), [16, 32, 32, 64, 128][Math.floor(r() * 5)]]); nb--; }
  }
  const sparks = [];
  for (let g = 0; sparks.length < 5 && g < 200; g++) {
    const x = Math.floor(8 + r() * (W - 16)), y = Ys(6 + Math.floor(r() * 54));
    if (!avoid(x, y) && y < Y(56)) sparks.push([x, y, Math.floor(r() * 128), [32, 64][Math.floor(r() * 2)]]);
  }

  /* ---------- тонкие облака ---------- */
  const cl = ['#2a3a8c', '#3c50a8', '#4a5cc0'];
  const rows = [
    cloudRow({ sizes: [[44, 5], [56, 6], [38, 5]], seed: 4, cols: cl, y: Ys(24), v: .13, gap: 96, off: 10 }),
    cloudRow({ sizes: [[36, 5], [48, 5], [30, 4]], seed: 9, cols: ['#27378a', '#384ca4', '#4658bc'], y: Ys(47), v: .09, gap: 104, off: 50 }),
  ];

  /* ---------- далёкая гроза слева ---------- */
  const sbase = Y(79), mw = W, mh = sbase + 2, mask = new Uint8Array(mw * mh);
  const mEll = (cx, cy, rx, ry) => {
    for (let y = Math.max(0, Math.floor(cy - ry)); y <= Math.min(sbase, Math.ceil(cy + ry)); y++)
      for (let x = Math.max(0, Math.floor(cx - rx)); x <= Math.min(mw - 1, Math.ceil(cx + rx)); x++) {
        const a = (x + .5 - cx) / rx, b = (y + .5 - cy) / ry; if (a * a + b * b <= 1) mask[y * mw + x] = 1;
      }
  };
  const rs = mulberry32(31);
  for (let u = -21; u > -limit - 14;) {
    const t = clamp((-u - 50) / (limit - 30), 0, 1), ry = (15 - 9 * t * t) * (.8 + .35 * rs()), rx = 7 + rs() * 5;
    mEll(U(u), sbase + 1, rx, ry);
    mEll(U(u + (rs() - .5) * rx), sbase - ry * .8, rx * .6, ry * .38);
    u -= rx * (.9 + rs() * .7);
  }
  for (let y = sbase - 3; y <= sbase; y++) for (let x = 0; x <= U(-24); x++) mask[y * mw + x] = 1;
  const stormL = new Layer(W, H), top = new Int16Array(W).fill(-1);
  for (let x = 0; x < W; x++) for (let y = 0; y <= sbase; y++) if (mask[y * mw + x]) { top[x] = y; break; }
  for (let x = 0; x < W; x++) {
    if (top[x] < 0) continue;
    for (let y = top[x]; y <= sbase + 1; y++) {
      const d = y - top[x], b = bay(x, y); let c = P.storm;
      if (y === sbase + 1) { if (b > .55 && mask[sbase * mw + x]) stormL.px(x, y, '#070b24'); continue; }
      if (d === 0) c = P.stormRim; else if (d <= 2 && b < .5) c = '#121c52';
      if (sbase - y <= 2 && b > .4) c = '#070b24';
      stormL.px(x, y, c);
    }
  }
  edgeLight(stormL, mx, P.stormEdge);
  const stormC = stormL.canvas();
  // вспышка: подсвеченные копии облака (полная и растровая)
  const litFull = new Layer(W, H), litHalf = new Layer(W, H), litPal = ['#2a3a9a', '#4658c0', '#7c8cf0', '#c8d2ff'];
  for (let y = 0; y <= sbase + 1; y++) for (let x = 0; x < W; x++) {
    if (!stormL.has(x, y)) continue;
    const dist = Math.hypot((x - U(-32)) / 1.5, y - Y(71)), lv = clamp(1 - dist / 52, 0, 1) * 3.4 + (bay(x, y) - .5) * .9;
    const c = litPal[clamp(Math.floor(lv + .35), 0, 3)];
    litFull.px(x, y, c); if (bay(x, y) < .45) litHalf.px(x, y, c);
  }
  const litFullC = litFull.canvas(), litHalfC = litHalf.canvas();
  // дождевые полосы под облаком
  const rain = [];
  for (let x = 2; x <= U(-26); x += 3 + Math.floor(rs() * 4)) if (top[x] >= 0) rain.push({ x, ph: Math.floor(rs() * 5), ln: 5 + Math.floor(rs() * 4) });

  /* ---------- далёкие низкие облачка справа (для широких экранов) ---------- */
  const bank = new Layer(W, H), rb = mulberry32(57);
  for (const u of outward(46, 1, limit + 24, 22, 42, rb)) {
    const rx = randint(rb, 9, 18), ry = randint(rb, 2, 4), by = Y(84 - randint(rb, 0, 3)), cx = U(u);
    for (let y = by - ry; y <= by; y++) for (let x = cx - rx; x <= cx + rx; x++) {
      const a = (x + .5 - cx) / rx, b = (y + .5 - by) / ry;
      if (a * a + b * b <= 1) bank.px(x, y, y === by - ry || (a < -.5 && b < -.3) ? '#2a3a8e' : '#121a52');
    }
  }
  const bankC = bank.canvas();

  /* ---------- море ---------- */
  const sea = new Layer(W, hs);
  gradient(sea, P.sea, 0, hs - 1);
  for (let y = 0; y < hs; y++) {
    const fr = y / (hs - 1), hw = 5 + y * .42;
    for (let x = 0; x < W; x++) {
      const dx = (x - mx) / hw;
      let a = Math.exp(-dx * dx * 1.6) * (1 - fr * .55) * .9;
      if (y < 8) a = Math.max(a, (1 - y / 8) * .55 * Math.exp(-Math.pow((x - mx) / 70, 2)));
      if (a < .05) continue;
      const q = Math.floor(a * 3 + bay(x, y)) / 3;
      if (q > 0) lighten(sea, x, y, '#7a8cf0', q * .55);
    }
  }
  const seaC = sea.canvas();

  /* ---------- светящийся планктон ---------- */
  const bio = makeMotes(r, Math.round(26 * W / 128), W, { y0: seaY + 10, y1: H - 3, colors: ['#40e8e0', '#80fff0', '#20c0c8'], amp: [1, 2], big: .22 });

  /* ---------- молния ---------- */
  const flashLev = f => {                          // уровень вспышки 0..1 и номер события
    const n = Math.floor(f / 40);
    if (hash(n * 3 + 1) > .55) return 0;
    const rel = f - n * 40 - (4 + Math.floor(hash(n * 5 + 2) * 18));
    return rel >= 0 && rel < 5 ? [1, .5, 0, .9, .35][rel] : 0;
  };
  const boltCache = new Map();
  const bolt = n => {
    let b = boltCache.get(n); if (b) return b;
    const rr = mulberry32(n * 7919 + 17); let x = U(-22 - Math.floor(rr() * 20)), y = Y(66);
    b = { main: [], br: [] };
    const seg = (pts, x0, y0, x1, y1) => {
      for (let yy = y0; yy <= y1; yy++) {
        const xx = Math.round(x0 + (x1 - x0) * (yy - y0) / Math.max(1, y1 - y0)); pts.push([xx, yy]);
      }
      const lo = Math.min(x0, x1), hi = Math.max(x0, x1);
      for (let xx = lo; xx <= hi; xx++) pts.push([xx, y1]);
    };
    let k = 0;
    while (y < seaY - 1) {
      const nx = x + randint(rr, -2, 2), ny = Math.min(seaY - 1, y + 2);
      seg(b.main, x, y, nx, ny);
      if (k === 3) { let bx = nx, by = y + 2; const dir = rr() < .5 ? -1 : 1; for (let j = 0; j < 3; j++) { const nbx = bx + dir * randint(rr, 1, 2); seg(b.br, bx, by, nbx, by + 2); bx = nbx; by += 2; } }
      x = nx; y = ny; k++;
    }
    boltCache.set(n, b); return b;
  };

  /* ---------- кит ---------- */
  const WLEN = 28, finH = { 18: 1, 19: 2, 20: 3, 21: 4, 22: 2, 23: 0 };
  const whaleWL = Y(139);
  function whale(ctx, f) {
    const n = Math.floor(f / 300), tt = f - n * 300;
    if (tt < 48 || tt > 184) return;
    const wl = whaleWL, wx0 = Math.round(U(-34) + (hash(n * 7 + 5) - .5) * 8 - (tt - 60) * .07);
    const rise = sstep(50, 74, tt) * (1 - sstep(120, 146, tt)), sink = (1 - rise) * 8.5;
    const visAt = lx => Math.round(6.5 * Math.pow(Math.sin(Math.PI * (lx + 1.5) / (WLEN + 4)), .8) + (finH[lx] || 0) - sink);
    let minX = 1e9, maxX = -1e9;
    for (let lx = 0; lx < WLEN; lx++) {
      const vis = visAt(lx); if (vis <= 0) continue;
      const x = wx0 + lx, t0 = wl - vis;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      ctx.fillStyle = css(P.whaleRim); ctx.fillRect(x, t0, 1, 1);
      if (vis > 1) { ctx.fillStyle = css(P.whaleMid); ctx.fillRect(x, t0 + 1, 1, 1); }
      if (vis > 2) { ctx.fillStyle = css(P.whale); ctx.fillRect(x, t0 + 2, 1, vis - 2); }
    }
    if (maxX >= minX) {                            // пена и круги на воде
      ctx.fillStyle = css(P.foam); ctx.fillRect(minX - 2, wl, 2, 1); ctx.fillRect(maxX + 1, wl, 2, 1);
      ctx.fillStyle = css('#5a6cd0');
      for (let x = minX - 4; x <= maxX + 4; x += 2) ctx.fillRect(x, wl + 1, 1, 1);
      ctx.fillStyle = css('#3a4cb0');
      for (let x = minX - 8; x <= maxX + 8; x += 4) ctx.fillRect(x, wl + 3, 2, 1);
      // фонтан: две порции
      for (const t1 of [64, 100]) for (let i = 0; i < 16; i++) {
        const p = (tt - t1 - i * 1.1) / 15; if (p < 0 || p > 1.9) continue;
        const hgt = (t1 === 64 ? 20 : 13) * (1 - (p - 1) * (p - 1)), k = ((i * 5) % 7) - 3;
        const sx = wx0 + 6 + Math.round(k * .8 * p + p * 1.5), sy = wl - visAt(6) - Math.round(hgt);
        ctx.fillStyle = css(p < .9 ? '#ffffff' : p < 1.4 ? '#c6d2ff' : '#7f90dc');
        ctx.fillRect(sx, sy, 1, 1);
        if (p < 1.1 && i % 2 === 0) ctx.fillRect(sx + 1, sy, 1, 1);
      }
    }
    // хвост при нырке
    const ph = clamp((tt - 128) / 52, 0, 1), fh = Math.round(Math.sin(Math.PI * ph) * 9);
    if (fh > 1) {
      const tx = wx0 + WLEN, y = wl - fh;
      ctx.fillStyle = css(P.whaleRim); ctx.fillRect(tx - 7, y - 1, 1, 1); ctx.fillRect(tx + 7, y - 1, 1, 1);
      ctx.fillRect(tx - 6, y, 5, 1); ctx.fillRect(tx + 2, y, 5, 1);
      ctx.fillStyle = css(P.whaleMid); ctx.fillRect(tx - 5, y + 1, 11, 1);
      ctx.fillStyle = css(P.whale); if (y + 2 < wl) ctx.fillRect(tx - 2, y + 2, 5, 1);
      if (y + 3 < wl) ctx.fillRect(tx - 1, y + 3, 3, wl - y - 3);
      ctx.fillStyle = css(P.foam); ctx.fillRect(tx - 3, wl, 7, 1);
    }
  }

  /* ---------- кадр ---------- */
  const ov = new Overlay(W, H);
  const HR0 = MR + 1, HR1 = 48;
  return {
    draw(ctx, f) {
      ctx.drawImage(skyC, 0, 0);
      drawStars(ctx, stars, f, P.starPal);
      drawSparkles(ctx, sparks, f, '#ffffff');
      drawCloudRows(ctx, rows, f, W);
      ctx.drawImage(bankC, 0, 0);
      ctx.drawImage(stormC, 0, 0);
      const fl = flashLev(f), fn = Math.floor(f / 40);
      if (fl > 0) {
        ctx.drawImage(fl > .7 ? litFullC : litHalfC, 0, 0);
        const b = bolt(fn);
        ctx.fillStyle = css('#9fb0ff');
        for (const [x, y] of b.main) { ctx.fillRect(x - 1, y, 1, 1); ctx.fillRect(x + 1, y, 1, 1); }
        ctx.fillStyle = css(fl > .7 ? '#ffffff' : '#b8c4ff');
        for (const [x, y] of b.main) ctx.fillRect(x, y, 1, 1);
        ctx.fillStyle = css('#cdd6ff');
        for (const [x, y] of b.br) ctx.fillRect(x, y, 1, 1);
      }
      ctx.drawImage(seaC, 0, seaY);
      // корабль: красный огонёк, моргает
      const sl = (f % 36) < 28;
      ctx.fillStyle = css(sl ? '#ff4658' : '#8a2a48'); ctx.fillRect(shipX, seaY - 3, 1, 1);
      if (sl) { ctx.fillStyle = css('#7a2c58'); ctx.fillRect(shipX, seaY + 1, 1, 1); }

      /* полупрозрачные слои: ореол луны, волны, дорожка, дождь, вспышка */
      const pulse = .75 + .25 * Math.sin(f / 19);
      for (let y = Math.max(0, my - HR1); y < Math.min(H, my + HR1); y++) for (let x = Math.max(0, mx - HR1); x < Math.min(W, mx + HR1); x++) {
        const d = Math.hypot(x - mx, y - my); if (d < HR0) continue;
        if (y < mh && mask[y * mw + x]) continue;
        const a = Math.pow(clamp((HR1 - d) / (HR1 - HR0), 0, 1), 1.7) * .3 * pulse;
        const q = clamp(Math.floor(a * 4 + bay(x, y)) / 4, 0, 1);
        if (q > 0) ov.over(x, y, '#8c9cf6', q);
      }
      waves(ov, f, { y0: seaY + 4, y1: H, hi: '#5062c8', lam0: 6, lam1: 30, gap0: 4, dgap: .5, thr: .4, aHi: .6, speed: .45 });
      glitter(ov, f, mx, seaY + 1, H, 3, 34, '#8a9cf0', { thr: .55, alpha: .55 });
      glitter(ov, f, mx, seaY + 1, H, 2, 33, '#ffffff', { thr: 1.0, alpha: .95 });
      for (const q of rain) {
        for (let y = sbase + 2, j = 0; y < seaY && j < q.ln; y++, j++) if (((y + f * 2 + q.ph) % 5) < 2) ov.over(q.x + (j >> 2), y, '#2c3a8c', .5);
      }
      if (fl > 0) {
        const bc = U(-32), cy = Y(72), RX = 50, RY = 30;
        for (let y = Math.max(0, cy - RY); y < Math.min(H, cy + RY); y++) for (let x = Math.max(0, bc - RX); x < Math.min(W, bc + RX); x++) {
          const d = Math.hypot((x - bc) / RX, (y - cy) / RY); if (d >= 1) continue;
          const a = Math.pow(1 - d, 1.6) * .42 * fl, q = clamp(Math.floor(a * 4 + bay(x, y)) / 4, 0, 1);
          if (q > 0) ov.over(x, y, '#8a9cff', q);
        }
        for (let y = seaY; y < seaY + 6; y++) for (let x = bc - 24; x <= bc + 24; x++) {
          const a = (1 - (y - seaY) / 6) * (1 - Math.abs(x - bc) / 26) * .5 * fl;
          if (a > 0 && Math.floor(a * 3 + bay(x, y)) >= 1) ov.over(x, y, '#7c8cf0', .55);
        }
      }
      ov.flush(ctx);

      whale(ctx, f);
      drawMotes(ctx, bio, f);
    },
  };
}
/* ===== DAY ===== */
  function buildDay(env) {
    const { W, H, Y, Ys, U, limit, px } = env;
    const { C, css, Layer, Overlay, mulberry32, randint, bay, clamp, gradient, addGlow, sunDisc, edgeLight, outward,
      cloudRow, drawCloudRows, makeMotes, drawMotes, waves, glitter, drawBird, smokeColumn } = px;
    const r = mulberry32(2024);
    const sstep = (a, b, t) => { t = clamp((t - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
    const hash = n => { let x = Math.imul(n + 1, 0x9E3779B1); x ^= x >>> 15; x = Math.imul(x, 0x85EBCA6B); x ^= x >>> 13; return (x >>> 0) / 4294967296; };
    const lighten = (L, x, y, col, t) => {
      if (x < 0 || y < 0 || x >= L.w || y >= L.h) return;
      const i = (y * L.w + x) << 2, d = L.d; col = C(col);
      d[i] += (col[0] - d[i]) * t; d[i + 1] += (col[1] - d[i + 1]) * t; d[i + 2] += (col[2] - d[i + 2]) * t;
    };

    const P = {
      sky: ['#1a62d0', '#2878dc', '#3e90e6', '#5aa8ee', '#7cc0f2', '#a0d6f6', '#c4e8f8', '#e0f4fa'],
      sea: ['#2a86d4', '#2070c4', '#1a5eb4', '#164ea4', '#124094', '#0e3484', '#0a2874'],
      whale: '#1a3466', whaleMid: '#3a68a8', whaleRim: '#9cc4f0', foam: '#ffffff',
    };

    const seaY = Y(88), hs = H - seaY;
    const mx = U(0), my = Ys(36), MR = 12;
    const xc = W / 2;

    /* ---------- небо и высокое солнце ---------- */
    const sky = new Layer(W, H);
    gradient(sky, P.sky, 0, seaY - 1);
    addGlow(sky, mx, my, MR, 62, '#fff4c0', .8, 5, 1.4);
    addGlow(sky, mx, my, MR, 120, '#fffbe0', .3, 4, 1.6);
    sunDisc(sky, mx, my, [[MR, '#ffe27a'], [MR - 2, '#fff0a0'], [MR - 4, '#fff8d0'], [MR - 6, '#ffffff']]);
    const shipX = U(36);
    sky.rect(shipX - 3, seaY - 1, shipX + 3, seaY - 1, '#26304e');
    sky.px(shipX - 1, seaY - 2, '#f4f8ff'); sky.px(shipX + 1, seaY - 2, '#f4f8ff'); sky.px(shipX + 2, seaY - 3, '#26304e');
    const skyC = sky.canvas();

    const cc = ['#f6f9fe', '#b4c8e6', '#ffffff'];
    const rows = [
      cloudRow({ sizes: [[46, 10], [36, 9], [54, 11]], seed: 4, cols: cc, y: Ys(22), v: .2, gap: 120, off: 10 }),
      cloudRow({ sizes: [[34, 9], [44, 10]], seed: 9, cols: cc, y: Ys(56), v: .14, gap: 112, off: 50 }),
    ];

    /* ---------- далёкие кучевые башни слева (вместо грозы) ---------- */
    const sbase = Y(79), mw = W, mh = sbase + 2, mask = new Uint8Array(mw * mh);
    const mEll = (cx, cy, rx, ry) => {
      for (let y = Math.max(0, Math.floor(cy - ry)); y <= Math.min(sbase, Math.ceil(cy + ry)); y++)
        for (let x = Math.max(0, Math.floor(cx - rx)); x <= Math.min(mw - 1, Math.ceil(cx + rx)); x++) {
          const a = (x + .5 - cx) / rx, b = (y + .5 - cy) / ry; if (a * a + b * b <= 1) mask[y * mw + x] = 1;
        }
    };
    const rs = mulberry32(31);
    for (let u = -21; u > -limit - 14;) {
      const t = clamp((-u - 50) / (limit - 30), 0, 1), ry = (15 - 9 * t * t) * (.8 + .35 * rs()), rx = 7 + rs() * 5;
      mEll(U(u), sbase + 1, rx, ry);
      mEll(U(u + (rs() - .5) * rx), sbase - ry * .8, rx * .6, ry * .38);
      u -= rx * (.9 + rs() * .7);
    }
    for (let y = sbase - 3; y <= sbase; y++) for (let x = 0; x <= U(-24); x++) mask[y * mw + x] = 1;
    const stormL = new Layer(W, H), top = new Int16Array(W).fill(-1);
    for (let x = 0; x < W; x++) for (let y = 0; y <= sbase; y++) if (mask[y * mw + x]) { top[x] = y; break; }
    for (let x = 0; x < W; x++) {
      if (top[x] < 0) continue;
      for (let y = top[x]; y <= sbase + 1; y++) {
        const d = y - top[x], b = bay(x, y), depth = (y - top[x]) / Math.max(1, sbase - top[x]); let c = '#f4f8ff';
        if (y === sbase + 1) { if (b > .55 && mask[sbase * mw + x]) stormL.px(x, y, '#a8c0e0'); continue; }
        if (d === 0) c = '#ffffff'; else if (d <= 2 && b < .5) c = '#ffffff';
        else if (depth > .45 && b < (depth - .35) * 1.4) c = '#c4d4ec';
        if (sbase - y <= 2 && b > .4) c = '#a0b8dc';
        stormL.px(x, y, c);
      }
    }
    edgeLight(stormL, mx, '#ffffff');
    const stormC = stormL.canvas();

    /* ---------- низкие облачка справа ---------- */
    const bank = new Layer(W, H), rb = mulberry32(57);
    for (const u of outward(46, 1, limit + 24, 22, 42, rb)) {
      const rx = randint(rb, 9, 18), ry = randint(rb, 2, 4), by = Y(84 - randint(rb, 0, 3)), cx = U(u);
      for (let y = by - ry; y <= by; y++) for (let x = cx - rx; x <= cx + rx; x++) {
        const a = (x + .5 - cx) / rx, b = (y + .5 - by) / ry;
        if (a * a + b * b <= 1) bank.px(x, y, y === by - ry || (a < -.5 && b < -.3) ? '#ffffff' : '#d0e0f4');
      }
    }
    const bankC = bank.canvas();

    /* ---------- море ---------- */
    const sea = new Layer(W, hs);
    gradient(sea, P.sea, 0, hs - 1);
    for (let y = 0; y < hs; y++) {
      const fr = y / (hs - 1), hw = 5 + y * .42;
      for (let x = 0; x < W; x++) {
        const dx = (x - mx) / hw;
        let a = Math.exp(-dx * dx * 1.6) * (1 - fr * .55) * .9;
        if (y < 8) a = Math.max(a, (1 - y / 8) * .55 * Math.exp(-Math.pow((x - mx) / 70, 2)));
        if (a < .05) continue;
        const q = Math.floor(a * 3 + bay(x, y)) / 3;
        if (q > 0) lighten(sea, x, y, '#a8dcff', q * .5);
      }
    }
    const seaC = sea.canvas();

    const sparkle = makeMotes(r, Math.round(26 * W / 128), W, { y0: seaY + 10, y1: H - 3, colors: ['#ffffff', '#d8f0ff', '#a8d8ff'], amp: [1, 2], big: .25 });
    const gulls = [0, 1, 2, 3].map(i => ({ x0: r() * (W + 60), y: Ys([60, 74, 48, 84][i]), v: [.34, .26, .42, .22][i], ph: r() * 6, fl: Math.floor(r() * 4) }));

    /* ---------- кит ---------- */
    const WLEN = 28, finH = { 18: 1, 19: 2, 20: 3, 21: 4, 22: 2, 23: 0 };
    const whaleWL = Y(139);
    function whale(ctx, f) {
      const n = Math.floor(f / 300), tt = f - n * 300;
      if (tt < 48 || tt > 184) return;
      const wl = whaleWL, wx0 = Math.round(U(-34) + (hash(n * 7 + 5) - .5) * 8 - (tt - 60) * .07);
      const rise = sstep(50, 74, tt) * (1 - sstep(120, 146, tt)), sink = (1 - rise) * 8.5;
      const visAt = lx => Math.round(6.5 * Math.pow(Math.sin(Math.PI * (lx + 1.5) / (WLEN + 4)), .8) + (finH[lx] || 0) - sink);
      let minX = 1e9, maxX = -1e9;
      for (let lx = 0; lx < WLEN; lx++) {
        const vis = visAt(lx); if (vis <= 0) continue;
        const x = wx0 + lx, t0 = wl - vis;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        ctx.fillStyle = css(P.whaleRim); ctx.fillRect(x, t0, 1, 1);
        if (vis > 1) { ctx.fillStyle = css(P.whaleMid); ctx.fillRect(x, t0 + 1, 1, 1); }
        if (vis > 2) { ctx.fillStyle = css(P.whale); ctx.fillRect(x, t0 + 2, 1, vis - 2); }
      }
      if (maxX >= minX) {
        ctx.fillStyle = css(P.foam); ctx.fillRect(minX - 2, wl, 2, 1); ctx.fillRect(maxX + 1, wl, 2, 1);
        ctx.fillStyle = css('#8cc8f4');
        for (let x = minX - 4; x <= maxX + 4; x += 2) ctx.fillRect(x, wl + 1, 1, 1);
        ctx.fillStyle = css('#58a0e0');
        for (let x = minX - 8; x <= maxX + 8; x += 4) ctx.fillRect(x, wl + 3, 2, 1);
        for (const t1 of [64, 100]) for (let i = 0; i < 16; i++) {
          const p = (tt - t1 - i * 1.1) / 15; if (p < 0 || p > 1.9) continue;
          const hgt = (t1 === 64 ? 20 : 13) * (1 - (p - 1) * (p - 1)), k = ((i * 5) % 7) - 3;
          const sx = wx0 + 6 + Math.round(k * .8 * p + p * 1.5), sy = wl - visAt(6) - Math.round(hgt);
          ctx.fillStyle = css(p < .9 ? '#ffffff' : p < 1.4 ? '#d8ecff' : '#a0c8f0');
          ctx.fillRect(sx, sy, 1, 1);
          if (p < 1.1 && i % 2 === 0) ctx.fillRect(sx + 1, sy, 1, 1);
        }
      }
      const ph = clamp((tt - 128) / 52, 0, 1), fh = Math.round(Math.sin(Math.PI * ph) * 9);
      if (fh > 1) {
        const tx = wx0 + WLEN, y = wl - fh;
        ctx.fillStyle = css(P.whaleRim); ctx.fillRect(tx - 7, y - 1, 1, 1); ctx.fillRect(tx + 7, y - 1, 1, 1);
        ctx.fillRect(tx - 6, y, 5, 1); ctx.fillRect(tx + 2, y, 5, 1);
        ctx.fillStyle = css(P.whaleMid); ctx.fillRect(tx - 5, y + 1, 11, 1);
        ctx.fillStyle = css(P.whale); if (y + 2 < wl) ctx.fillRect(tx - 2, y + 2, 5, 1);
        if (y + 3 < wl) ctx.fillRect(tx - 1, y + 3, 3, wl - y - 3);
        ctx.fillStyle = css(P.foam); ctx.fillRect(tx - 3, wl, 7, 1);
      }
    }

    const ov = new Overlay(W, H);
    const HR0 = MR + 1, HR1 = 52;
    return {
      draw(ctx, f) {
        ctx.drawImage(skyC, 0, 0);
        drawCloudRows(ctx, rows, f, W);
        ctx.drawImage(bankC, 0, 0);
        ctx.drawImage(stormC, 0, 0);
        for (const g of gulls) {
          const x = Math.floor(((g.x0 + g.v * f) % (W + 60) + W + 60) % (W + 60)) - 30;
          drawBird(ctx, x, g.y + Math.round(2 * Math.sin(2 * Math.PI * f / 80 + g.ph)), (((f >> 2) + g.fl) & 1) === 1, '#ffffff');
        }
        ctx.drawImage(seaC, 0, seaY);
        smokeColumn(ctx, shipX + 2, seaY - 4, f, { n: 3, rise: 9, per: 90, sway: .8, r0: .5, r1: 1.5, wind: 3, cols: ['#f0f4fc', '#cdd8ec', '#a8b8d4'] });

        const pulse = .8 + .2 * Math.sin(f / 19);
        for (let y = Math.max(0, my - HR1); y < Math.min(H, my + HR1); y++) for (let x = Math.max(0, mx - HR1); x < Math.min(W, mx + HR1); x++) {
          const d = Math.hypot(x - mx, y - my); if (d < HR0) continue;
          if (y < mh && mask[y * mw + x]) continue;
          const a = Math.pow(clamp((HR1 - d) / (HR1 - HR0), 0, 1), 1.7) * .26 * pulse;
          const q = clamp(Math.floor(a * 4 + bay(x, y)) / 4, 0, 1);
          if (q > 0) ov.over(x, y, '#fff6c8', q);
        }
        waves(ov, f, { y0: seaY + 4, y1: H, hi: '#ffffff', lo: '#0e3a88', lam0: 6, lam1: 30, gap0: 4, dgap: .5, thr: .4, aHi: .65, aLo: .3, speed: .45 });
        glitter(ov, f, mx, seaY + 1, H, 3, 34, '#d8f0ff', { thr: .55, alpha: .55 });
        glitter(ov, f, mx, seaY + 1, H, 2, 33, '#ffffff', { thr: 1.0, alpha: .95 });
        ov.flush(ctx);

        whale(ctx, f);
        drawMotes(ctx, sparkle, f);
      },
    };
  }
/* ===== END ===== */
  PixelBG.register('ocean', function (env) { return env.day ? buildDay(env) : buildNight(env); });
})();
