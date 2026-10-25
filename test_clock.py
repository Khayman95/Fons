#!/usr/bin/env python3
"""Проверка выбора день/ночь: по часам игрока, по внутриигровым часам, вручную, и плавный переход при смене времени суток.
Запуск: python3 tools/test_clock.py"""
import os, sys
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
URL = 'file://' + os.path.join(HERE, 'test_clock.html')
fails = []
def check(name, got, want):
    ok = got == want
    print(('  ok   ' if ok else '  FAIL ') + name + ('' if ok else '  (получено %r, ожидалось %r)' % (got, want)))
    if not ok: fails.append(name)

def at(p, hh, mm=0, ss=0):
    p.clock.install(time='2026-10-25T%02d:%02d:%02d' % (hh, mm, ss))
    p.goto(URL)

with sync_playwright() as pw:
    b = pw.chromium.launch()
    errs = []
    ctx = b.new_context(viewport={'width': 1280, 'height': 720}, timezone_id='Europe/Volgograd')
    p = ctx.new_page()
    p.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    p.on('pageerror', lambda e: errs.append(str(e)))

    print('1. Выбор по часам компьютера игрока (локальное время):')
    for hh, mm, want in [(0, 0, 'night'), (6, 59, 'night'), (7, 0, 'day'), (12, 0, 'day'), (18, 59, 'day'), (19, 0, 'night'), (23, 30, 'night')]:
        at(p, hh, mm)
        v = p.evaluate("(() => { window.bg = PixelBG.mount('#bg', {location:'forest', fade:0}); return bg.variant; })()")
        check('%02d:%02d -> %s' % (hh, mm, want), v, want)

    print('2. Внутриигровые часы (getHour) и свои границы дня:')
    at(p, 12)
    v = p.evaluate("(() => { window.H = 22; window.bg = PixelBG.mount('#bg', {location:'desert', fade:0, getHour: () => H}); return bg.variant; })()")
    check('getHour=22 (реальные 12:00) -> night', v, 'night')
    v = p.evaluate("(() => { bg.setHour(null); return bg.variant; })()")
    check('setHour(null) возвращает к getHour игры (22) -> night', v, 'night')
    v = p.evaluate("(() => { bg.destroy(); window.bg = PixelBG.mount('#bg', {location:'desert', fade:0}); bg.setHour(23); const a = bg.variant; bg.setHour(null); return a + '>' + bg.variant; })()")
    check('setHour(23) -> night, setHour(null) возвращает на часы компьютера (12:00) -> day', v, 'night>day')
    v = p.evaluate("(() => { bg.destroy(); window.bg = PixelBG.mount('#bg', {location:'desert', fade:0, dayStart:9, nightStart:17}); return bg.variant; })()")
    check('dayStart=9, nightStart=17 при 12:00 -> day', v, 'day')
    at(p, 8)
    v = p.evaluate("PixelBG.mount('#bg', {location:'desert', fade:0, dayStart:9, nightStart:17}).variant")
    check('dayStart=9 при 08:00 -> night', v, 'night')

    print('3. Ручное управление:')
    at(p, 12)
    r = p.evaluate("""(() => {
      const bg = PixelBG.mount('#bg', {location:'forest', fade:0}); const out = [bg.variant];
      bg.setHour(23); out.push(bg.variant);
      bg.setTime('day'); out.push(bg.variant);
      bg.setTime('night'); out.push(bg.variant);
      bg.setTime('auto'); out.push(bg.variant);      // auto + setHour(23) -> night
      bg.setHour(10.5); out.push(bg.variant);
      return out; })()""")
    check('цепочка setHour/setTime', r, ['day', 'night', 'day', 'night', 'night', 'day'])

    print('4. Смена локации сохраняет выбор и вызывает onChange:')
    at(p, 21)
    r = p.evaluate("""(() => {
      const ev = []; const bg = PixelBG.mount('#bg', {location:'forest', fade:0, onChange: e => ev.push(e.location + ':' + e.variant)});
      bg.setLocation('desert', {fade:false}); bg.setLocation('city_hybrid', {fade:false}); bg.setLocation('city_hybrid');
      return ev; })()""")
    check('onChange', r, ['forest:night', 'desert:night', 'city_hybrid:night'])
    r = p.evaluate("(() => { const bg = PixelBG.mount('#bg', {location:'nope', fade:0}); return bg.variant; })()")
    print('  (незарегистрированная локация даёт понятную ошибку в консоли, фон не падает)')

    print('5. followClock: игрок остался в локации, наступил вечер (18:59:40 -> 19:00:10):')
    at(p, 18, 59, 40)
    p.evaluate("window.ev = []; window.bg = PixelBG.mount('#bg', {location:'forest', fade:0, onChange: e => ev.push(e.variant)});")
    check('при входе в 18:59:40 -> day', p.evaluate("bg.variant"), 'day')
    p.clock.run_for(30000)
    check('через 30 с (19:00:10) фон сам стал night', p.evaluate("bg.variant"), 'night')
    check('onChange вызван при переходе', p.evaluate("ev"), ['day', 'night'])
    at(p, 18, 59, 40)
    p.evaluate("window.bg = PixelBG.mount('#bg', {location:'forest', fade:0, followClock:false});")
    p.clock.run_for(30000)
    check('followClock:false — вариант не меняется до новой локации', p.evaluate("bg.variant"), 'day')
    p.evaluate("bg.setLocation('desert', {fade:false})")
    check('...а при входе в другую локацию уже night', p.evaluate("bg.variant"), 'night')

    errs[:] = [e for e in errs if 'не зарегистрирована' not in e]
    print('6. Ошибки в консоли:', errs or 'нет')
    if errs: fails.append('console')
    b.close()

print('\nИТОГ:', 'всё прошло' if not fails else 'ПРОВАЛЕНО: ' + ', '.join(fails))
sys.exit(1 if fails else 0)
