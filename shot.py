#!/usr/bin/env python3
"""Скриншоты сцен через настоящий Chromium.

Пример:
  python3 tools/shot.py --loc forest --time night,day --out /tmp/shots
  python3 tools/shot.py --loc forest --time night --views desktop,phone_p --frame 60 --out /tmp/shots

Снимается логический холст (точные пиксели фона), увеличенный в целое число раз без сглаживания.
Печатает для каждого вида: размер холста, масштаб, среднее время кадра, долю движущихся пикселей, ошибки консоли.
Файлы: <loc>_<time>_<view>.png и сводный лист <loc>_<time>_sheet.png.
"""
import argparse, base64, io, os, sys
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VIEWS = {  # имя: (ширина, высота, dpr)
    'desktop': (1920, 1080, 1),
    'ultra': (3440, 1440, 1),
    'phone_p': (390, 844, 3),
    'phone_l': (844, 390, 3),
    'tablet': (820, 1180, 2),
    'small': (1280, 720, 1),
}


def decode(url):
    return Image.open(io.BytesIO(base64.b64decode(url.split(',', 1)[1]))).convert('RGB')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--loc', required=True)
    ap.add_argument('--time', default='night')
    ap.add_argument('--views', default='desktop,ultra,phone_p,phone_l,tablet')
    ap.add_argument('--sheet-views', default='desktop,phone_p,phone_l')
    ap.add_argument('--frame', type=int, default=40)
    ap.add_argument('--scale', type=int, default=3, help='увеличение отдельных файлов')
    ap.add_argument('--out', required=True)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    url0 = 'file://' + os.path.join(ROOT, 'demo.html')
    bad = 0
    with sync_playwright() as p:
        br = p.chromium.launch()
        for tm in a.time.split(','):
            shots = {}
            for vn in a.views.split(','):
                w, h, dpr = VIEWS[vn]
                ctx = br.new_context(viewport={'width': w, 'height': h}, device_scale_factor=dpr)
                pg = ctx.new_page()
                errs = []
                pg.on('console', lambda m: errs.append(m.type + ': ' + m.text) if m.type in ('error', 'warning') else None)
                pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
                pg.goto(f'{url0}?loc={a.loc}&time={tm}&frame={a.frame}&chrome=0')
                try:
                    pg.wait_for_function('window.__bg && window.__bg.info.W > 0', timeout=8000)
                except Exception:
                    print(f'[{a.loc} {tm} {vn}] сцена не запустилась; ошибки: {errs}')
                    bad += 1; ctx.close(); continue
                pg.wait_for_timeout(350)
                info = pg.evaluate('window.__bg.info')
                ms = pg.evaluate('window.__bg.bench(30)')
                pg.evaluate(f'window.__bg.drawAt(0)')
                A = decode(pg.evaluate("document.querySelector('#stage canvas').toDataURL()"))
                pg.evaluate(f'window.__bg.drawAt({a.frame})')
                B = decode(pg.evaluate("document.querySelector('#stage canvas').toDataURL()"))
                pg.evaluate('window.__bg.drawAt(%d)' % (a.frame + 7))
                C = decode(pg.evaluate("document.querySelector('#stage canvas').toDataURL()"))
                import numpy as np
                moved = (np.abs(np.asarray(A, int) - np.asarray(C, int)).sum(axis=2) > 0).mean() * 100
                step = (np.abs(np.asarray(B, int) - np.asarray(C, int)).sum(axis=2) > 0).mean() * 100
                # B — кадр a.frame; он же и сохраняется
                pg.evaluate(f'window.__bg.drawAt({a.frame})')
                img = decode(pg.evaluate("document.querySelector('#stage canvas').toDataURL()"))
                shots[vn] = img
                k = a.scale if img.width * a.scale <= 1500 else max(1, 1500 // img.width)
                img.resize((img.width * k, img.height * k), Image.NEAREST).save(os.path.join(a.out, f'{a.loc}_{tm}_{vn}.png'))
                flag = ''
                if ms > 12: flag += '  МЕДЛЕННО'
                if moved < 0.3: flag += '  почти не движется'
                if errs: flag += '  ОШИБКИ'; bad += 1
                print(f'[{a.loc} {tm} {vn:8s}] viewport {w}x{h}@{dpr}  холст {info["W"]}x{info["H"]} x{info["S"]}  '
                      f'кадр {ms:.2f} мс  движется {moved:.1f}% (за 7 кадров {step:.1f}%){flag}')
                for e in errs[:6]: print('    ', e)
                ctx.close()
            sv = [v for v in a.sheet_views.split(',') if v in shots]
            if sv:
                k = 2
                ims = [shots[v].resize((shots[v].width * k, shots[v].height * k), Image.NEAREST) for v in sv]
                gap = 8
                sheet = Image.new('RGB', (sum(i.width for i in ims) + gap * (len(ims) - 1), max(i.height for i in ims)), (20, 20, 24))
                x = 0
                for i in ims:
                    sheet.paste(i, (x, 0)); x += i.width + gap
                path = os.path.join(a.out, f'{a.loc}_{tm}_sheet.png')
                sheet.save(path)
                print('лист:', path)
        br.close()
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
