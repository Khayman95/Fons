#!/usr/bin/env python3
"""Сборка пакета PixelBG.

Что делает:
  dist/pixelbg.all.js     — движок и все 12 локаций одним файлом (для игры достаточно подключить его)
  dist/demo.html          — демо со списком локаций, переключателем день/ночь и ползунком часа (подключает pixelbg.all.js)
  dist/demo.single.html   — то же демо, но всё внутри одного html-файла (можно открыть двойным кликом или выложить)
  dist/src/               — исходники по отдельности (engine.js, scenes/*.js): правки вносить в них, потом снова запустить build.py
  pixelbg.zip             — всё вместе с README.md

Запуск:  python3 tools/build.py
"""
import os, re, shutil, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
ORDER = ['desert', 'forest', 'sea', 'ocean', 'beach', 'savanna', 'taiga', 'jungle', 'mountains',
         'city_magic', 'city_steampunk', 'city_hybrid']

def read(p):
    with open(os.path.join(ROOT, p), encoding='utf-8') as f: return f.read()
def write(p, s):
    full = os.path.join(DIST, p); os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, 'w', encoding='utf-8', newline='\n') as f: f.write(s)

def main():
    if os.path.isdir(DIST): shutil.rmtree(DIST)
    missing = [n for n in ORDER if not os.path.isfile(os.path.join(ROOT, 'scenes', n + '.js'))]
    if missing: raise SystemExit('нет файлов сцен: ' + ', '.join(missing))

    parts = [read('engine.js').rstrip() + '\n']
    for n in ORDER: parts.append('\n;/* ===== локация: %s ===== */\n' % n + read('scenes/%s.js' % n).rstrip() + '\n')
    alljs = ''.join(parts)
    write('pixelbg.all.js', alljs)

    demo = read('demo.html')
    assert '<script src="engine.js"></script>' in demo
    write('demo.html', demo.replace('<script src="engine.js"></script>', '<script src="pixelbg.all.js"></script>'))
    safe = alljs.replace('</script', '<\\/script')
    write('demo.single.html', demo.replace('<script src="engine.js"></script>', '<script>\n' + safe + '\n</script>'))

    write('src/engine.js', read('engine.js'))
    for n in ORDER: write('src/scenes/%s.js' % n, read('scenes/%s.js' % n))
    write('src/demo.html', demo)
    for t in ('shot.py', 'test_clock.py', 'test_clock.html', 'build.py'): write('src/tools/' + t, read('tools/' + t))

    readme = os.path.join(ROOT, 'README.md')
    zp = os.path.join(ROOT, 'pixelbg.zip')
    with zipfile.ZipFile(zp, 'w', zipfile.ZIP_DEFLATED) as z:
        for base, _, files in os.walk(DIST):
            for fn in sorted(files):
                full = os.path.join(base, fn); z.write(full, os.path.join('pixelbg', os.path.relpath(full, DIST)))
        if os.path.isfile(readme): z.write(readme, 'pixelbg/README.md')
    print('dist/pixelbg.all.js  %6.1f КБ' % (len(alljs.encode()) / 1024))
    print('dist/demo.single.html %5.1f КБ' % (os.path.getsize(os.path.join(DIST, 'demo.single.html')) / 1024))
    print('pixelbg.zip          %6.1f КБ' % (os.path.getsize(zp) / 1024))

if __name__ == '__main__': main()
