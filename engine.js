/*!
 * PixelBG 1.0 — процедурные пиксельные фоны для браузерной игры.
 *
 * Подключение:
 *   <div id="bg" style="position:fixed; inset:0"></div>
 *   <script src="engine.js"></script>
 *   <script src="scenes/desert.js"></script>   // и другие локации
 *   <script>
 *     const bg = PixelBG.mount('#bg', { location: 'desert' });   // день или ночь выберется по часам игрока
 *     bg.setLocation('forest');                                  // смена локации, плавный переход
 *     bg.setHour(21.5);                                          // если в игре своё время: 0..24
 *     bg.setTime('day');                                         // 'auto' | 'day' | 'night'
 *   </script>
 *
 * Как устроен фон:
 *  - рисуется в маленьком «логическом» холсте высотой около 192 пикселей, ширина любая;
 *  - холст увеличивается в целое число раз, поэтому пиксели везде квадратные;
 *  - анимация идёт ступенями по 10 кадров в секунду.
 *
 * Как писать сцену (scenes/<имя>.js):
 *   PixelBG.register('имя', function (env) {
 *     // env.W, env.H   — размер логического холста в пикселях
 *     // env.Y(y)       — y в «проектных» координатах (кадр 192 строки), привязка к НИЗУ экрана (земля, горизонт)
 *     // env.Ys(y)      — y, растущий вместе с высотой экрана (небо, облака, звёзды)
 *     // env.U(u)       — x от ЦЕНТРА экрана: u = 0 — середина, отрицательные влево
 *     // env.limit      — на сколько пикселей от центра надо рисовать декор, чтобы закрыть широкий экран
 *     // env.variant    — 'night' | 'day';   env.night / env.day — то же булевыми
 *     // env.px         — все помощники (см. PX ниже)
 *     // здесь строим статичные слои (Layer -> canvas) и считаем списки частиц
 *     return { draw(ctx, f) { ... } };   // f — номер кадра (целое, 10 в секунду), рисуем весь кадр
 *   });
 */
(function (root) {
'use strict';

const FPS = 10;
const DESIGN_H = 192;

/* ===================================================================== утилиты */
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const _cc = new Map();
/** '#rrggbb' | '#rgb' | [r,g,b] -> [r,g,b] */
function C(c) {
  if (typeof c !== 'string') return c;
  let v = _cc.get(c);
  if (!v) {
    let h = c.charAt(0) === '#' ? c.slice(1) : c;
    if (h.length === 3) h = h.replace(/./g, m => m + m);
    const n = parseInt(h, 16);
    v = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    _cc.set(c, v);
  }
  return v;
}
const _css = new Map();
/** цвет -> строка для ctx.fillStyle (с кэшем) */
function css(c) {
  c = C(c);
  const k = (c[0] << 16) | (c[1] << 8) | c[2];
  let s = _css.get(k);
  if (!s) { s = 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')'; _css.set(k, s); }
  return s;
}
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const randint = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
/** затемнить (k<1) или осветлить (k>1) цвет */
const dim = (c, k) => C(c).map(v => clamp(Math.round(v * k), 0, 255));
/** смесь двух цветов, t от 0 до 1 */
const mix = (a, b, t) => { a = C(a); b = C(b); return [0, 1, 2].map(i => Math.round(a[i] + (b[i] - a[i]) * t)); };
const B4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
/** порог матрицы Байера для пикселя (x, y): число от 0 до 1 */
const bay = (x, y) => B4[y & 3][x & 3] / 16 + 1 / 32;
/** треугольная волна 0..1..0 с периодом per кадров и фазой ph */
const tri = (f, per, ph) => Math.abs(2 * ((((f + (ph || 0)) % per) + per) % per / per) - 1);

/* ===================================================================== растровый слой */
class Layer {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint8ClampedArray(w * h * 4); this._cv = null; this._cx = null; }
  clear() { this.d.fill(0); return this; }
  px(x, y, c) {
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    if (typeof c === 'string') c = C(c);
    const i = (y * this.w + x) << 2, d = this.d;
    d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
  }
  has(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h && this.d[((y * this.w + x) << 2) + 3] > 0; }
  erase(x, y) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[((y * this.w + x) << 2) + 3] = 0; }
  /** прямоугольник, границы включительно */
  rect(x0, y0, x1, y1, c) {
    c = C(c); x0 = Math.floor(x0); y0 = Math.floor(y0); x1 = Math.floor(x1); y1 = Math.floor(y1);
    for (let y = Math.max(0, y0); y <= Math.min(this.h - 1, y1); y++)
      for (let x = Math.max(0, x0); x <= Math.min(this.w - 1, x1); x++) this.px(x, y, c);
  }
  hline(x0, x1, y, c) { this.rect(x0, y, x1, y, c); }
  vline(x, y0, y1, c) { this.rect(x, y0, x, y1, c); }
  /** эллипс в рамке (x0,y0)-(x1,y1), границы включительно, как в PIL */
  ellipseBox(x0, y0, x1, y1, c) {
    c = C(c);
    const cx = (x0 + x1 + 1) / 2, cy = (y0 + y1 + 1) / 2, rx = (x1 - x0 + 1) / 2, ry = (y1 - y0 + 1) / 2;
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++)
      for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) {
        const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.px(x, y, c);
      }
  }
  /** круг с центром в пикселе (cx, cy) и радиусом r */
  disc(cx, cy, r, c) {
    c = C(c); const r2 = (r + .5) * (r + .5);
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
      const rem = r2 - (y - cy) * (y - cy); if (rem < 0) continue;
      const hw = Math.sqrt(rem);
      for (let x = Math.ceil(cx - hw); x <= Math.floor(cx + hw); x++) this.px(x, y, c);
    }
  }
  eraseDisc(cx, cy, r) {
    const r2 = (r + .5) * (r + .5);
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
      const rem = r2 - (y - cy) * (y - cy); if (rem < 0) continue;
      const hw = Math.sqrt(rem);
      for (let x = Math.ceil(cx - hw); x <= Math.floor(cx + hw); x++) this.erase(x, y);
    }
  }
  /** многоугольник: pts = [[x,y],...] */
  poly(pts, c) {
    c = C(c);
    let minY = Infinity, maxY = -Infinity;
    for (const p of pts) { if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1]; }
    for (let y = Math.max(0, Math.floor(minY)); y <= Math.min(this.h - 1, Math.ceil(maxY)); y++) {
      const yc = y + .5, xs = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        if ((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) xs.push(a[0] + (yc - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
      }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2)
        for (let x = Math.ceil(xs[k] - .5); x <= Math.ceil(xs[k + 1] - .5) - 1; x++) this.px(x, y, c);
    }
  }
  /** линия в 1 пиксель (Брезенхэм) */
  line(x0, y0, x1, y1, c) {
    c = C(c);
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.px(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  /** новый холст-снимок слоя (для статичных слоёв, строится один раз) */
  canvas() {
    const cv = document.createElement('canvas'); cv.width = this.w; cv.height = this.h;
    cv.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(this.d), this.w, this.h), 0, 0);
    return cv;
  }
  /** нарисовать слой на ctx; для динамических спрайтов: clear(), рисуем, draw() */
  draw(ctx, dx, dy) {
    if (!this._cv) { this._cv = document.createElement('canvas'); this._cv.width = this.w; this._cv.height = this.h; this._cx = this._cv.getContext('2d'); }
    this._cx.putImageData(new ImageData(this.d, this.w, this.h), 0, 0);
    ctx.drawImage(this._cv, dx || 0, dy || 0);
  }
}

/* ===================================================================== небо, свет */
/** вертикальный градиент полосами с дизерингом Байера; stops — цвета сверху вниз */
function gradient(L, stops, y0, y1) {
  const s = stops.map(C), n = s.length;
  for (let y = 0; y < L.h; y++) {
    const v = clamp((y - y0) / (y1 - y0), 0, 1) * (n - 1), base = Math.min(Math.floor(v), n - 2), fr = v - base;
    for (let x = 0; x < L.w; x++) L.px(x, y, s[base + (fr > bay(x, y) ? 1 : 0)]);
  }
}
/** свечение с дизерингом поверх непрозрачного слоя; levels — число ступеней яркости */
function addGlow(L, cx, cy, rin, rout, col, strength, levels, power) {
  col = C(col); levels = levels || 4; power = power || 1.5;
  const x0 = Math.max(0, Math.floor(cx - rout)), x1 = Math.min(L.w - 1, Math.ceil(cx + rout));
  const y0 = Math.max(0, Math.floor(cy - rout)), y1 = Math.min(L.h - 1, Math.ceil(cy + rout)), d = L.d;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const a = Math.pow(clamp((rout - Math.hypot(x - cx, y - cy)) / (rout - rin), 0, 1), power) * strength;
    if (a <= 0) continue;
    const q = clamp(Math.floor(a * levels + bay(x, y)) / levels, 0, 1);
    if (q <= 0) continue;
    const i = (y * L.w + x) << 2;
    d[i] = Math.round(d[i] * (1 - q) + col[0] * q); d[i + 1] = Math.round(d[i + 1] * (1 - q) + col[1] * q); d[i + 2] = Math.round(d[i + 2] * (1 - q) + col[2] * q);
  }
}
/** диск из колец: rings = [[радиус, цвет], ...] от большого к малому (солнце, луна) */
function sunDisc(L, cx, cy, rings) { for (const [r, c] of rings) L.disc(cx, cy, r, c); }

/* ===================================================================== рельеф */
/** волнистый хребет: возвращает функцию x -> y; amps = [[длина волны px, амплитуда], ...], отсчёт от центра экрана */
function makeRidge(xc, baseY, amps, seed) {
  const r = mulberry32(seed), ph = amps.map(() => r() * Math.PI * 2);
  return x => baseY + amps.reduce((s, [lam, a], i) => s + a * Math.sin(2 * Math.PI * (x - xc) / lam + ph[i]), 0);
}
/** острые вершины: peaks = [[u, высота, полуширина], ...] (u от центра); возвращает функцию x -> y */
function peakRidge(xc, baseY, peaks, seed, rough) {
  const r = mulberry32(seed), ph = [0, 1, 2].map(() => r() * 6.28), lam = [18, 10, 5.6];
  rough = rough == null ? 1.5 : rough;
  return x => {
    let top = 0;
    for (const [u, ph_, hw] of peaks) top = Math.max(top, ph_ * clamp(1 - Math.abs(x - (xc + u)) / hw, 0, 1));
    let n = 0; for (let k = 0; k < 3; k++) n += Math.sin(2 * Math.PI * (x - xc) / lam[k] + ph[k]);
    return baseY - top - (top > 0 ? n * rough * .5 : 0);
  };
}
/**
 * Холмы, дюны, горы: двухтоновая тень по склону, подсвеченная кромка, глубина дизерингом.
 * o: lit, shade, deep, rim — цвета; lightX — x источника света (-1e9 = справа/слева выключено); k — контраст склона;
 *    lean — наклон тени с глубиной; depth — на сколько строк темнеет к deep; sh — шаг для склона;
 *    snow: [светлый, тёмный] + snowDepth(x, topY) -> строк снега от вершины.
 */
function hill(L, hf, o) {
  o = Object.assign({ lean: .3, k: .8, depth: 20, sh: 3, lightX: -1e9 }, o);
  const lit = C(o.lit), shade = C(o.shade), deep = C(o.deep), rim = o.rim ? C(o.rim) : null;
  const snow = o.snow ? [C(o.snow[0]), C(o.snow[1])] : null;
  const M = 160, w = L.w, hh = L.h, Hs = new Int32Array(w + 2 * M);
  for (let i = 0; i < Hs.length; i++) Hs[i] = Math.round(hf(i - M));
  const sh = o.sh;
  for (let x = 0; x < w; x++) {
    const top = Hs[x + M], sd = snow && o.snowDepth ? o.snowDepth(x, top) : 0;
    for (let y = Math.max(0, top); y < hh; y++) {
      const d = y - top; if (d < 0) continue;
      const xs = x + Math.floor(d * o.lean), ix = clamp(xs + M, sh, Hs.length - 1 - sh);
      const hs = Hs[ix + sh] - Hs[ix - sh], side = xs < o.lightX ? 1 : -1;
      const la = clamp(.5 + side * hs * o.k, 0, 1), b = bay(x, y);
      let c = la > b ? lit : shade;
      if (clamp((d - 3) / o.depth, 0, 1) > b) c = deep;
      if (snow && d < sd) c = la > b ? snow[0] : snow[1];
      if (rim && d === 0 && la > .5) c = rim;
      L.px(x, y, c);
    }
  }
}
/** однотонный силуэт под линией hf, с необязательной светлой кромкой сверху */
function sil(L, hf, col, rim) {
  col = C(col); rim = rim ? C(rim) : null;
  for (let x = 0; x < L.w; x++) {
    const top = Math.round(hf(x));
    for (let y = Math.max(0, top); y < L.h; y++) L.px(x, y, rim && y === top ? rim : col);
  }
}
/** светлая кромка на стороне источника света: пиксели рядом с пустотой слева/справа от lightX */
function edgeLight(L, lightX, col) {
  col = C(col); const w = L.w, h = L.h, d = L.d, hit = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!d[((y * w + x) << 2) + 3]) continue;
    const eR = x + 1 >= w || !d[((y * w + x + 1) << 2) + 3], eL = x - 1 < 0 || !d[((y * w + x - 1) << 2) + 3];
    if (x < lightX ? eR : eL) hit.push((y * w + x) << 2);
  }
  for (const i of hit) { d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; }
}
/** светлая кромка по верхнему краю фигур */
function edgeTop(L, col) {
  col = C(col); const w = L.w, h = L.h, d = L.d, hit = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
    if (d[((y * w + x) << 2) + 3] && (y === 0 || !d[(((y - 1) * w + x) << 2) + 3])) hit.push((y * w + x) << 2);
  for (const i of hit) { d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; }
}
/** позиции декора по одну сторону за пределами центра: startU — откуда, dir = -1|1, limit — до куда, шаг gmin..gmax */
function outward(startU, dir, limit, gmin, gmax, r) {
  const out = []; let u = startU;
  for (;;) { u += dir * (gmin + r() * (gmax - gmin)); if (Math.abs(u) > limit) break; out.push(u); }
  return out;
}

/* ===================================================================== облака, светила, звёзды */
/** облако (canvas): плоское дно, нижняя кромка color lit, верхняя top, тело body */
function makeCloud(w, h, seed, body, lit, top) {
  body = C(body); lit = C(lit); top = C(top);
  const r = mulberry32(seed), m = new Uint8Array(w * h), base = Math.floor(h * .72), n = Math.max(3, Math.floor(w / 12));
  const fillE = (cx, cy, rx, ry) => {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry; if (dx * dx + dy * dy <= 1) m[y * w + x] = 1;
    }
  };
  for (let i = 0; i < n; i++) {
    const cx = randint(r, Math.floor(w * .16), Math.floor(w * .84));
    const rx = randint(r, Math.max(4, Math.floor(w / 10)), Math.max(6, Math.floor(w / 4)));
    let ry = randint(r, Math.max(2, Math.floor(h / 4)), Math.max(3, Math.floor(h * .6)));
    ry = Math.floor(ry * (1 - .5 * Math.abs(cx - w / 2) / (w / 2))) + 2;
    fillE(cx + .5, base + .5, rx, ry);
  }
  for (let y = base - 2; y <= base; y++) for (let x = Math.floor(w * .1); x <= Math.floor(w * .9); x++) if (y >= 0) m[y * w + x] = 1;
  for (let y = base + 1; y < h; y++) for (let x = 0; x < w; x++) m[y * w + x] = 0;
  const L = new Layer(w, h);
  for (let x = 0; x < w; x++) {
    let below = 0, above = 0;
    for (let y = h - 1; y >= 0; y--) if (m[y * w + x]) below++;
    let b = below;
    for (let y = 0; y < h; y++) {
      if (!m[y * w + x]) continue;
      above++;
      let c = body;
      if (b <= 2 || (b === 3 && bay(x, y) > .5)) c = lit;
      if (above === 1) c = top;
      L.px(x, y, c); b--;
    }
  }
  return L.canvas();
}
/**
 * Ряд плывущих облаков. o: sizes [[w,h],...], seed, cols [body, lit, top], y, v (пикселей за кадр, можно дробно),
 * gap (расстояние между облаками), off (сдвиг). Рисовать: drawCloudRows(ctx, rows, f, W).
 */
function cloudRow(o) {
  const r = mulberry32((o.seed | 0) + 977);
  return {
    sprs: o.sizes.map(([w, h], i) => makeCloud(w, h, o.seed + i * 7, o.cols[0], o.cols[1], o.cols[2])),
    margin: Math.max.apply(null, o.sizes.map(s => s[0])) + 2,
    y: o.y, v: o.v, gap: o.gap, off: o.off || 0,
    pick: Array.from({ length: 16 }, () => Math.floor(r() * o.sizes.length)),
    jit: Array.from({ length: 16 }, () => Math.round((r() - .5) * o.gap * .5)),
  };
}
function drawCloudRows(ctx, rows, f, W) {
  for (const row of rows) {
    const n = Math.ceil((W + row.margin) / row.gap), P = n * row.gap;
    for (let i = 0; i < n; i++) {
      const x = (((i * row.gap + row.jit[i % 16] + row.off + row.v * f) % P) + P) % P - row.margin;
      ctx.drawImage(row.sprs[row.pick[i % 16]], Math.round(x), row.y);
    }
  }
}
/** луна (canvas); crescent=true — месяц. cols = [край, тело, блик, (кратеры)] */
function moonSprite(r, cols, crescent) {
  cols = cols.map(C);
  const s = 2 * r + 6, c = s >> 1, o = Math.max(1, Math.floor(r / 6)), L = new Layer(s, s);
  L.ellipseBox(c - r, c - r, c + r, c + r, cols[0]);
  L.ellipseBox(c - r, c - r, c + r - o, c + r - o, cols[1]);
  L.ellipseBox(c - r + 1, c - r + 1, c + r - 2 * o, c + r - 2 * o, cols[2]);
  if (crescent !== false) {
    const cutX = c + r * .75 + .5, cutY = c - r * .2 + .5;
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++)
      if (Math.hypot(x + .5 - cutX, y + .5 - cutY) <= r + .5) L.erase(x, y);
  } else {
    for (const [dx, dy, rr] of [[-.35, -.25, .22], [.25, .2, .17], [-.2, .45, .12], [.45, -.4, .12]])
      L.ellipseBox(Math.round(c + dx * r - Math.max(1, Math.floor(r * rr))), Math.round(c + dy * r - Math.max(1, Math.floor(r * rr))),
        Math.round(c + dx * r + Math.max(1, Math.floor(r * rr))), Math.round(c + dy * r + Math.max(1, Math.floor(r * rr))), cols[3] || cols[1]);
  }
  return L.canvas();
}
const STAR_PAL = [null, '#6f69b0', '#bfb8f0', '#ffffff'];
/** звёзды: [x, y, фаза, период]; o.ymin, o.avoid(x,y)->true чтобы пропустить */
function makeStars(r, n, W, ymax, o) {
  o = o || {}; const ymin = o.ymin || 0, out = []; let guard = 0;
  while (out.length < n && guard++ < n * 60) {
    const x = Math.floor(r() * W), y = ymin + Math.floor(r() * (ymax - ymin));
    if (o.avoid && o.avoid(x, y)) continue;
    out.push([x, y, Math.floor(r() * 128), [16, 32, 32, 64, 128][Math.floor(r() * 5)]]);
  }
  return out;
}
function drawStars(ctx, stars, f, pal) {
  pal = pal || STAR_PAL;
  for (const [x, y, ph, per] of stars) {
    const lv = tri(f, per, ph), k = lv < .2 ? 0 : lv < .5 ? 1 : lv < .8 ? 2 : 3;
    if (k) { ctx.fillStyle = css(pal[k]); ctx.fillRect(x, y, 1, 1); }
  }
}
/** крупные мерцающие «крестики»: [x, y, фаза, период] */
function makeSparkles(r, n, W, ymin, ymax) {
  return Array.from({ length: n }, () => [Math.floor(8 + r() * (W - 16)), ymin + Math.floor(r() * (ymax - ymin)), Math.floor(r() * 128), [32, 64][Math.floor(r() * 2)]]);
}
function drawSparkles(ctx, sp, f, col) {
  ctx.fillStyle = css(col || '#ffffff');
  for (const [x, y, ph, per] of sp) if (tri(f, per, ph) > .55) { ctx.fillRect(x - 2, y, 5, 1); ctx.fillRect(x, y - 2, 1, 5); }
}

/* ===================================================================== частицы */
/**
 * Светлячки, искры, пылинки. o: x0,x1 (по умолчанию 0..W), y0,y1, colors, rise (пикселей за кадр вверх, 0 = парят),
 * amp: [мин, макс] качание по x, big — доля «крестиков».
 */
function makeMotes(r, n, W, o) {
  const x0 = o.x0 || 0, x1 = o.x1 == null ? W : o.x1;
  return Array.from({ length: n }, () => ({
    x: x0 + r() * (x1 - x0), y: o.y0 + r() * (o.y1 - o.y0), y0: o.y0, y1: o.y1, rise: o.rise || 0,
    amp: randint(r, (o.amp || [2, 5])[0], (o.amp || [2, 5])[1]), per: pick(r, [60, 120]), ph: r(), tp: pick(r, [20, 24, 30, 40, 60]),
    tph: Math.floor(r() * 128), col: C(pick(r, o.colors)), big: r() < (o.big == null ? .2 : o.big) }));
}
function drawMotes(ctx, motes, f) {
  for (const m of motes) {
    const x = Math.round(m.x + m.amp * Math.sin(2 * Math.PI * (f / m.per + m.ph)));
    const span = m.y1 - m.y0;
    const y = Math.round(m.rise ? m.y0 + ((((m.y - m.y0 - m.rise * f) % span) + span) % span) : m.y + m.amp * .5 * Math.cos(2 * Math.PI * (f / m.per + m.ph)));
    const lv = tri(f, m.tp, m.tph);
    if (lv < .25) continue;
    const c = lv > .55 ? m.col : dim(m.col, .55);
    ctx.fillStyle = css(c); ctx.fillRect(x, y, 1, 1);
    if (m.big && lv > .55) {
      ctx.fillStyle = css(dim(m.col, .6));
      ctx.fillRect(x - 1, y, 1, 1); ctx.fillRect(x + 1, y, 1, 1); ctx.fillRect(x, y - 1, 1, 1); ctx.fillRect(x, y + 1, 1, 1);
    }
  }
}
/** птица-«галочка»; flap — взмах вверх/вниз (булево) */
function drawBird(ctx, x, y, flap, col) {
  ctx.fillStyle = css(col || '#2a1c48');
  const pts = flap ? [[-2, -1], [-1, 0], [0, 1], [1, 0], [2, -1]] : [[-2, 1], [-1, 0], [0, 0], [1, 0], [2, 1]];
  for (const [dx, dy] of pts) ctx.fillRect(x + dx, y + dy, 1, 1);
}
/** закрашенный круг пикселями прямо на ctx (центр в пикселе cx, cy) */
function fillDisc(ctx, cx, cy, r, col) {
  ctx.fillStyle = css(col); const r2 = (r + .5) * (r + .5);
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    const rem = r2 - (y - cy) * (y - cy); if (rem < 0) continue;
    const hw = Math.sqrt(rem), x0 = Math.ceil(cx - hw), x1 = Math.floor(cx + hw);
    if (x1 >= x0) ctx.fillRect(x0, y, x1 - x0 + 1, 1);
  }
}
/**
 * Столб дыма из кругов, цвет зависит от возраста. o: n, rise, cols[], per (кадров на жизнь), sway, r0, r1, wind.
 */
function smokeColumn(ctx, x, y, f, o) {
  const n = o.n || 5, per = o.per || 120, cols = o.cols || ['#8a7a90', '#6a5a70', '#4a3c56'];
  for (let i = 0; i < n; i++) {
    const age = (((f + i * per / n) % per) + per) % per / per;
    const px = x + (o.sway == null ? 3 : o.sway) * Math.sin(2 * Math.PI * (age * 1.3 + i * .37)) * (.3 + age) + (o.wind || 0) * age;
    const py = y - (o.rise || 34) * age, r = (o.r0 == null ? 1 : o.r0) + ((o.r1 == null ? 4 : o.r1) - (o.r0 == null ? 1 : o.r0)) * age;
    fillDisc(ctx, Math.round(px), Math.round(py), Math.round(r * 2) / 2, cols[Math.min(cols.length - 1, Math.floor(age * cols.length))]);
  }
}

/* ===================================================================== наложения с прозрачностью (без чтения с холста) */
class Overlay {
  constructor(w, h) {
    this.w = w; this.h = h; this.img = new ImageData(w, h); this.d = this.img.data;
    this.cv = document.createElement('canvas'); this.cv.width = w; this.cv.height = h; this.cx = this.cv.getContext('2d');
  }
  clear() { this.d.fill(0); }
  /** заменить пиксель; a от 0 до 1 */
  set(x, y, c, a) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    c = C(c); const i = (y * this.w + x) << 2, d = this.d;
    d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = a * 255;
  }
  /** положить поверх уже нарисованного (обычное «source-over») */
  over(x, y, c, a) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    c = C(c); const i = (y * this.w + x) << 2, d = this.d, A = d[i + 3] / 255;
    if (A === 0) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = a * 255; return; }
    const oa = a + A * (1 - a), k = A * (1 - a);
    d[i] = (c[0] * a + d[i] * k) / oa; d[i + 1] = (c[1] * a + d[i + 1] * k) / oa; d[i + 2] = (c[2] * a + d[i + 2] * k) / oa; d[i + 3] = oa * 255;
  }
  /** вывести на ctx (можно только прямоугольник x0..x1, y0..y1) и очистить его */
  flush(ctx, x0, y0, x1, y1) {
    x0 = x0 || 0; y0 = y0 || 0; x1 = x1 == null ? this.w : x1; y1 = y1 == null ? this.h : y1;
    if (x1 <= x0 || y1 <= y0) return;
    this.cx.putImageData(this.img, 0, 0, x0, y0, x1 - x0, y1 - y0);
    ctx.drawImage(this.cv, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
    for (let y = y0; y < y1; y++) this.d.fill(0, ((y * this.w + x0) << 2), ((y * this.w + x1) << 2));
  }
}
/**
 * Плывущий туман в полосе. o: y0, y1, color, strength (0..1), lam [длины волн px], speed (px за кадр),
 * levels, power, fade 'down'|'up'|'mid', x0, x1.
 */
function fog(ov, f, o) {
  const y0 = o.y0, y1 = Math.min(o.y1, ov.h), lam = o.lam || [64, 43], speed = o.speed == null ? 1 : o.speed;
  const levels = o.levels || 3, power = o.power == null ? 1.2 : o.power, str = o.strength == null ? .5 : o.strength, fade = o.fade || 'down';
  const col = C(o.color), x0 = o.x0 || 0, x1 = o.x1 == null ? ov.w : o.x1, TP = 2 * Math.PI;
  for (let y = y0; y < y1; y++) {
    const u = clamp((y - y0) / Math.max(1, y1 - y0), 0, 1);
    const env = Math.pow(fade === 'down' ? u : fade === 'up' ? 1 - u : 1 - Math.abs(2 * u - 1), power);
    if (env <= 0) continue;
    for (let x = x0; x < x1; x++) {
      const sx = x - speed * f;
      const v = (.5 + .5 * Math.cos(TP * (sx / lam[0] + y * .02))) * .6 + (.5 + .5 * Math.cos(TP * (sx / lam[1] - y * .03 + .7))) * .4;
      const a = clamp(Math.floor(str * v * env * levels + bay(x, y)) / levels, 0, 1);
      if (a > 0) ov.set(x, y, col, a);
    }
  }
}
/** пульсирующее круглое свечение. o: per, ph, strength, lo */
function glowPulse(ov, cx, cy, r, color, f, o) {
  o = o || {}; const per = o.per || 60, lo = o.lo == null ? .6 : o.lo, st = o.strength == null ? .75 : o.strength;
  const pulse = lo + (1 - lo) * (.5 + .5 * Math.sin(2 * Math.PI * (f + (o.ph || 0)) / per));
  for (let y = Math.max(0, Math.floor(cy - r)); y < Math.min(ov.h, Math.ceil(cy + r)); y++)
    for (let x = Math.max(0, Math.floor(cx - r)); x < Math.min(ov.w, Math.ceil(cx + r)); x++) {
      const a = Math.pow(clamp((r - Math.hypot(x - cx, y - cy)) / Math.max(1, r - 2), 0, 1), 1.6) * st * pulse;
      const q = clamp(Math.floor(a * 4 + bay(x, y)) / 4, 0, 1);
      if (q > 0) ov.over(x, y, color, q);
    }
}
/**
 * Волны: гребни рядами, ближе к зрителю реже и крупнее. o: y0, y1, hi (цвет гребня), lo (цвет тени под гребнем),
 * lam0 (длина волны у горизонта, px), lam1 (у зрителя), gap0, dgap, thr, aHi, aLo, speed (px за кадр, база).
 */
function waves(ov, f, o) {
  const y0 = o.y0, y1 = Math.min(o.y1, ov.h), lam0 = o.lam0 || 4.6, lam1 = o.lam1 || 25, gap0 = o.gap0 || 3, dgap = o.dgap == null ? .35 : o.dgap;
  const thr = (o.thr == null ? .35 : o.thr) * 1.6, aHi = o.aHi == null ? .6 : o.aHi, aLo = o.aLo == null ? .4 : o.aLo, spd = o.speed == null ? 1.07 : o.speed;
  const hi = C(o.hi), lo = o.lo ? C(o.lo) : null, TP = 2 * Math.PI, W = ov.w, on = new Uint8Array(W);
  let y = y0, i = 0;
  while (y < y1) {
    const yi = Math.round(y), fr = (yi - y0) / Math.max(1, y1 - y0);
    const lam = lam0 + (lam1 - lam0) * fr, lam2 = lam * 2, k = 1 + (i % 2), ph = i * .37;
    for (let x = 0; x < W; x++) {
      const v = Math.sin(TP * ((x - k * spd * f) / lam + ph)) + .6 * Math.sin(TP * ((x - spd * f) / lam2 + ph * 1.7));
      on[x] = v > thr ? 1 : 0;
      if (on[x] && yi < y1) ov.over(x, yi, hi, aHi);
    }
    if (lo && yi + 1 < y1 && fr > .2) for (let x = 1; x < W; x++) if (on[x - 1]) ov.over(x, yi + 1, lo, aLo);
    y += gap0 + dgap * i; i++;
  }
}
/** блики лунной/солнечной дорожки на воде. cx — центр дорожки, w0/w1 — полуширина у горизонта/у зрителя */
function glitter(ov, f, cx, y0, y1, w0, w1, color, o) {
  o = o || {}; const thr = o.thr == null ? 1.25 : o.thr, al = o.alpha == null ? .9 : o.alpha, TP = 2 * Math.PI;
  y1 = Math.min(y1, ov.h);
  for (let y = y0; y < y1; y++) {
    const hw = w0 + (w1 - w0) * clamp((y - y0) / Math.max(1, y1 - y0), 0, 1);
    for (let x = Math.max(0, Math.floor(cx - hw)); x < Math.min(ov.w, Math.ceil(cx + hw)); x++) {
      const v = Math.sin(x * 2.1 + y * 1.37 + TP * 3 * f / 120) + Math.sin(x * .8 - y * 2.9 - TP * 2 * f / 120);
      if (v > thr) ov.over(x, y, color, al);
    }
  }
}
/**
 * Северное сияние. o: ribbons [{yc, amp, kx, sk, wid, strength, color, ph}], h (высота области), xc (центр).
 * kx — число изгибов на 128 px, sk — целая скорость (оборотов за 12 с).
 */
function aurora(ov, f, o) {
  const W = ov.w, xc = o.xc == null ? W / 2 : o.xc, hmax = Math.min(o.h, ov.h), TP = 2 * Math.PI;
  for (const rb of o.ribbons) {
    const col = C(rb.color);
    for (let x = 0; x < W; x++) {
      const xr = (x - xc) / 128, th = TP * (rb.kx * xr + rb.sk * f / 120) + rb.ph;
      const cy = rb.yc + rb.amp * Math.sin(th) + .45 * rb.amp * Math.sin(2 * th + 1.3);
      const en = .35 + .65 * (.5 + .5 * Math.sin(TP * (2 * xr + rb.sk * f / 120) + rb.ph * 1.7));
      const rays = .8 + .2 * Math.sin(TP * (20 * xr + rb.sk * f / 120));
      for (let y = 0; y < hmax; y++) {
        const u = (cy - y) / rb.wid;
        if (u < -.8 || u > 3) continue;
        const a = rb.strength * (u >= 0 ? Math.exp(-u * 1.3) : Math.exp(-(u * 3.5) * (u * 3.5))) * en * rays;
        if (a < .03) continue;
        const q = clamp(Math.floor(a * 4 + bay(x, y)) / 4, 0, 1);
        if (q > 0) ov.over(x, y, col, q);
      }
    }
  }
}
/** марево: строки полосы y0..y1 сдвигаются волной. tmp — вспомогательный canvas шириной W (создать один раз) */
function shimmer(ctx, tmp, f, y0, y1, o) {
  o = o || {}; const W = ctx.canvas.width, bh = y1 - y0, amp = o.amp == null ? 1.2 : o.amp, per = o.per || 4, spd = o.spd || 24;
  if (tmp.height < bh) tmp.height = bh;
  const tc = tmp.getContext('2d'); tc.clearRect(0, 0, W, tmp.height); tc.drawImage(ctx.canvas, 0, y0, W, bh, 0, 0, W, bh);
  for (let i = 0; i < bh; i++) {
    const sh = Math.round(amp * Math.sin(2 * Math.PI * ((y0 + i - (o.dy || 0)) / per - f / spd)));
    if (!sh) continue;
    ctx.drawImage(tmp, 0, i, W, 1, sh, y0 + i, W, 1);
    ctx.drawImage(tmp, 0, i, W, 1, sh > 0 ? sh - W : sh + W, y0 + i, W, 1);
  }
}

/* ===================================================================== деревья и предметы */
/** силуэт ёлки: x — центр, base — земля, h — высота */
function pine(L, x, base, h, col, rim, w, tiers) {
  w = w || Math.max(7, Math.floor(h / 2)); tiers = tiers || Math.max(3, Math.floor(h / 8));
  L.rect(x - 1, base - 3, x, base, col);
  const step = (h - 3) / tiers;
  for (let i = 0; i < tiers; i++) {
    const yt = base - h + i * step, yb = yt + step * 1.7, wi = Math.max(2, w * (i + 1) / tiers);
    L.poly([[x - wi / 2, yb], [x + wi / 2, yb], [x, yt]], col);
    if (rim) L.line(x, yt, x - wi / 2, yb, rim);
  }
}
/** пальма: ствол с изгибом lean, крона из 6 листьев длиной flen */
function palm(L, x, y, h, col, lean, flen) {
  let tx = 0, ty = 0;
  for (let i = 0; i < h; i++) { tx = x + lean * Math.pow(i / h, 2); ty = y - i; L.rect(Math.round(tx), Math.round(ty), Math.round(tx) + 1, Math.round(ty), col); }
  for (const ang of [195, 225, 255, 285, 315, 345]) {
    const a = ang * Math.PI / 180;
    for (let i = 1; i < flen; i++) {
      const fx = tx + Math.cos(a) * i, fy = ty + Math.sin(a) * i * .55 + (i * i) / 38;
      L.px(Math.round(fx), Math.round(fy), col); L.px(Math.round(fx), Math.round(fy) + 1, col);
    }
  }
}
/** ромб-кристалл, нижняя вершина в (ax, ay); три цвета: свет, середина, тень */
function crystalGem(L, ax, ay, hi, mid, dk, h, w) {
  h = h || 6; w = w || 2;
  L.poly([[ax, ay - h], [ax + w, ay - h / 2], [ax, ay], [ax - w, ay - h / 2]], mid);
  L.poly([[ax, ay - h], [ax + w, ay - h / 2], [ax, ay - h / 2]], hi);
  L.poly([[ax, ay], [ax + w, ay - h / 2], [ax, ay - h / 2]], dk);
}
/** шестерня на RGBA-слое (дырки прозрачные). Поворот на кратное 2π/teeth даёт бесшовный круг. o: spokes, toothH, ring, hi, hub */
function gear(L, cx, cy, r, teeth, ang, col, o) {
  o = o || {}; const n = teeth * 4, pts = [], toothH = o.toothH == null ? 2 : o.toothH, ring = o.ring == null ? 3 : o.ring;
  for (let i = 0; i < n; i++) {
    const a = ang + 2 * Math.PI * i / n, rr = r + ((i % 4 === 1 || i % 4 === 2) ? toothH : 0);
    pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
  }
  L.poly(pts, col);
  L.eraseDisc(Math.round(cx), Math.round(cy), Math.max(1, r - ring));
  const spokes = o.spokes == null ? 6 : o.spokes;
  for (let k = 0; k < spokes; k++) {
    const a = ang + 2 * Math.PI * k / spokes;
    L.line(cx, cy, cx + (r - ring + 1) * Math.cos(a), cy + (r - ring + 1) * Math.sin(a), col);
  }
  L.disc(Math.round(cx), Math.round(cy), Math.max(1, Math.floor(r / 4)), o.hub || col);
  if (o.hi) for (let d = 190; d <= 270; d += 6) L.px(Math.round(cx + (r + 1) * Math.cos(d * Math.PI / 180)), Math.round(cy + (r + 1) * Math.sin(d * Math.PI / 180)), o.hi);
}

/* ===================================================================== реестр сцен и запуск */
const registry = Object.create(null);
function register(name, builder) { registry[name] = builder; }
function scenes() { return Object.keys(registry); }
/** день или ночь по часу 0..24; по умолчанию день с 7:00 до 19:00 */
function pickVariant(hour, o) {
  o = o || {}; const ds = o.dayStart == null ? 7 : o.dayStart, ns = o.nightStart == null ? 19 : o.nightStart;
  return hour >= ds && hour < ns ? 'day' : 'night';
}
function localHour(d) { d = d || new Date(); return d.getHours() + d.getMinutes() / 60; }

const PX = { mulberry32, C, css, clamp, lerp, randint, pick, dim, mix, bay, tri, Layer, Overlay,
  gradient, addGlow, sunDisc, makeRidge, peakRidge, hill, sil, edgeLight, edgeTop, outward,
  makeCloud, cloudRow, drawCloudRows, moonSprite, STAR_PAL, makeStars, drawStars, makeSparkles, drawSparkles,
  makeMotes, drawMotes, drawBird, fillDisc, smokeColumn, fog, glowPulse, waves, glitter, aurora, shimmer,
  pine, palm, crystalGem, gear };

function makeEnv(W, H, S, variant) {
  const dy = H - DESIGN_H, sc = H / DESIGN_H, xc = W / 2;
  return { W, H, S, dy, sc, xc, variant, night: variant === 'night', day: variant === 'day',
    Y: y => Math.round(y + dy), Ys: y => Math.round(y * sc), U: u => Math.round(xc + u), limit: xc + 70, px: PX };
}

/**
 * Запуск фона в контейнере (position:relative/absolute/fixed и свой размер).
 * Опции: location, time ('auto'|'day'|'night'), getHour (функция внутриигровых часов 0..24), dayStart (7), nightStart (19),
 *        fps (10), fade (мс перехода, 1200; 0 = без), followClock (true: фон сам перейдёт день→ночь, если время суток сменилось,
 *        пока игрок в локации; false: вариант выбирается только при входе), reducedMotion ('respect'|'ignore'),
 *        frame (число: заморозить кадр, для отладки), onChange({location, variant}).
 */
function mount(container, opts) {
  if (typeof container === 'string') container = document.querySelector(container);
  const o = Object.assign({ location: null, time: 'auto', getHour: null, dayStart: 7, nightStart: 19, fps: FPS, fade: 1200,
    followClock: true, reducedMotion: 'respect', frame: null, onChange: null }, opts || {});
  if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
  container.style.overflow = 'hidden';
  const cv = document.createElement('canvas');
  cv.style.cssText = 'position:absolute;bottom:0;left:0;display:block;image-rendering:pixelated;image-rendering:crisp-edges;';
  container.appendChild(cv);
  let ctx = null, scene = null, W = 0, H = 0, S = 1, loc = o.location, timeMode = o.time, manualHour = null, variant = 'night';
  let lastF = -1, msAvg = 0, raf = 0, paused = false, timer = 0, broken = false, dead = false;
  let lastKey = '';
  const reduce = () => o.reducedMotion === 'respect' && window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hour = () => manualHour != null ? manualHour : (o.getHour ? o.getHour() : localHour());
  const wantVariant = () => timeMode === 'auto' ? pickVariant(hour(), o) : timeMode;

  function fadeFromSnapshot() {
    if (!o.fade || !ctx || !W) return;
    const snap = document.createElement('canvas'); snap.width = W; snap.height = H;
    snap.getContext('2d').drawImage(cv, 0, 0);
    snap.style.cssText = cv.style.cssText + 'pointer-events:none;opacity:1;transition:opacity ' + o.fade + 'ms linear;';
    snap.style.width = cv.style.width; snap.style.height = cv.style.height; snap.style.left = cv.style.left;
    container.appendChild(snap);
    requestAnimationFrame(() => requestAnimationFrame(() => { snap.style.opacity = '0'; }));
    setTimeout(() => snap.remove(), o.fade + 100);
  }
  function build(withFade) {
    if (!W || !loc) return;
    const builder = registry[loc];
    if (!builder) { console.error('PixelBG: сцена «' + loc + '» не зарегистрирована (подключите scenes/' + loc + '.js)'); return; }
    if (withFade) fadeFromSnapshot();
    variant = wantVariant();
    try { scene = builder(makeEnv(W, H, S, variant)); broken = false; }
    catch (e) { console.error('PixelBG: ошибка сборки сцены «' + loc + '» (' + variant + ')', e); scene = null; }
    lastF = -1; msAvg = 0;
    if (o.onChange) o.onChange({ location: loc, variant });
  }
  function layout() {
    const r = container.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    const devW = Math.round(r.width * dpr), devH = Math.round(r.height * dpr);
    if (devW < 8 || devH < 8) return;
    const key = devW + 'x' + devH;
    if (key === lastKey && scene) return;   // ResizeObserver срабатывает сразу после запуска: не собираем сцену второй раз зря
    lastKey = key;
    S = Math.max(1, Math.round(devH / DESIGN_H)); W = Math.ceil(devW / S); H = Math.ceil(devH / S);
    cv.width = W; cv.height = H;
    cv.style.width = (W * S / dpr) + 'px'; cv.style.height = (H * S / dpr) + 'px';
    cv.style.left = (Math.round((devW - W * S) / 2) / dpr) + 'px';
    ctx = cv.getContext('2d', { alpha: false }); ctx.imageSmoothingEnabled = false;
    build(false);
  }
  function drawFrame(f) {
    const t0 = performance.now();
    scene.draw(ctx, f);
    msAvg = msAvg ? msAvg * .9 + (performance.now() - t0) * .1 : performance.now() - t0;
  }
  function tick(now) {
    if (dead) return;
    raf = requestAnimationFrame(tick);
    if (paused || !scene || broken) return;
    const f = o.frame != null ? o.frame : Math.floor(now / (1000 / o.fps));
    if (f === lastF) return;
    lastF = f;
    try { drawFrame(reduce() ? 0 : f); } catch (e) { broken = true; console.error('PixelBG: ошибка кадра в «' + loc + '»', e); }
  }
  let rz = 0;
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => { cancelAnimationFrame(rz); rz = requestAnimationFrame(layout); }) : null;
  if (ro) ro.observe(container); else window.addEventListener('resize', layout);
  // followClock: если игрок остался в локации, когда день сменился вечером, фон плавно перейдёт сам; false = выбор только при входе
  timer = setInterval(() => { if (o.followClock && timeMode === 'auto' && wantVariant() !== variant) build(true); }, 15000);
  layout();
  raf = requestAnimationFrame(tick);

  return {
    setLocation(name, opt) { if (name === loc) return; loc = name; build(!opt || opt.fade !== false); },
    setTime(mode) { timeMode = mode; if (wantVariant() !== variant) build(true); },
    setHour(h) { manualHour = h; if (timeMode === 'auto' && wantVariant() !== variant) build(true); },
    resize: layout,
    pause() { paused = true; }, resume() { paused = false; },
    destroy() { dead = true; cancelAnimationFrame(raf); clearInterval(timer); if (ro) ro.disconnect(); cv.remove(); },
    get variant() { return variant; }, get location() { return loc; },
    get info() { return { W, H, S, variant, location: loc, ms: msAvg }; },
    /** среднее время отрисовки кадра в мс по n кадрам (для проверки скорости) */
    bench(n) { n = n || 30; if (!scene) return NaN; const t0 = performance.now(); for (let i = 0; i < n; i++) scene.draw(ctx, 1000 + i); return (performance.now() - t0) / n; },
    /** нарисовать конкретный кадр сейчас */
    drawAt(f) { if (scene) { scene.draw(ctx, f); } },
    canvas: cv,
  };
}

root.PixelBG = { version: '1.0', FPS, DESIGN_H, register, mount, scenes, pickVariant, localHour, px: PX };
})(typeof window !== 'undefined' ? window : globalThis);
