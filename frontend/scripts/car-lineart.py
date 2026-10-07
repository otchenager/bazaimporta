# Линейный рисунок hero: Lamborghini Huracán (без людей) → два слоя SVG.
# Нужны: pip install opencv-python-headless numpy. Запуск: python scripts/hero-car-restore.py && python scripts/car-lineart.py
#
# Исходник — scripts/hero-car-960.png: кадр hero-src-960.jpg, где передок, закрытый людьми, восстановлен (hero-car-restore.py).
# Силуэт обведён вручную (CAR), внутренние линии — Canny внутри силуэта, короткие обрывки выкинуты,
# колёса дорисованы эллипсами, оранжевый акцент — фара. Пороги и сглаживание — те же, что у принятого рисунка,
# поэтому видимые линии машины совпадают с прежними; новые — только там, где раньше стояли люди.
#
# Результат:
#   src/visual/car-o.svg — внешние контуры (проявляются первыми) + акцент;
#   src/visual/car-d.svg — детали.
# Толщины — в пикселях экрана (vector-effect: non-scaling-stroke): контур 1.5, детали 0.9.
# Внутренние группы с id (art-car-o, art-car-d) без обводки — их переиспользуют <use> для блика и подсветки.
import importlib.util
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
_spec = importlib.util.spec_from_file_location('restore', ROOT / 'scripts/hero-car-restore.py')
restore = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(restore)
SRC = ROOT / 'scripts/hero-car-960.png'
OUT_O = ROOT / 'src/visual/car-o.svg'
OUT_D = ROOT / 'src/visual/car-d.svg'

# Кадр рисунка в координатах исходного фото (960×1280): по машине с полем под тень и обводку
X0, Y0, X1, Y1 = 225, 505, 895, 1015
VIEW = (272, 648, 890, 942)
SCALE = 2  # маски и края считаем на увеличенном кадре (×2 — те же пороги, что у принятой машины)

CAR = [(283, 800), (300, 770), (340, 735), (372, 715), (420, 700), (480, 672), (533, 666), (560, 660), (627, 661),
       (670, 665), (700, 672), (733, 673), (773, 682), (813, 693), (853, 702), (867, 717), (877, 740), (880, 790),
       (877, 833), (860, 853), (840, 850), (760, 866), (700, 883), (693, 917), (667, 933), (643, 923), (633, 907),
       (560, 920), (527, 923), (420, 913), (333, 905), (292, 905), (283, 880)]
PLATE = [(322, 870), (418, 872), (417, 908), (322, 905)]   # номер: только рамка, без надписей
ACCENT = [((545, 790), (595, 830))]                         # оранжевый акцент — фара
WHEELS = [((671, 868), (32, 68), 3), ((859, 795), (21, 57), 2)]

MIN_LEN = 44   # px на увеличенном кадре: короче — шум
EPS = 1.15     # допуск упрощения, px увеличенного кадра


def to_px(p):
    return ((p[0] - X0) * SCALE, (p[1] - Y0) * SCALE)


def poly_mask(shape, polys):
    m = np.zeros(shape, np.uint8)
    for p in polys:
        cv2.fillPoly(m, [np.array([to_px(q) for q in p], np.int32)], 255)
    return m


def soft(m, s=3.0):  # скругляем углы обводки
    return np.where(cv2.GaussianBlur(m, (0, 0), s * SCALE / 2) > 127, 255, 0).astype(np.uint8)


def contour_runs(mask, hide=None, min_area=2000, eps=EPS * 1.3):
    """Внешний контур маски; если задан hide — рвём его там, где он скрыт (возвращаем открытые куски)."""
    out = []
    cs, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    for c in cs:
        if cv2.contourArea(c) < min_area:
            continue
        c = c.reshape(-1, 2)
        if hide is None:
            a = cv2.approxPolyDP(c.reshape(-1, 1, 2), eps, True).reshape(-1, 2) / SCALE
            out.append(np.vstack([a, a[:1]]))
            continue
        vis = hide[c[:, 1], c[:, 0]] == 0
        if vis.all():
            runs = [c]
        else:
            k = int(np.argmin(vis))
            c, vis = np.roll(c, -k, 0), np.roll(vis, -k)
            runs, cur = [], []
            for pt, v in zip(c, vis):
                if v:
                    cur.append(pt)
                elif cur:
                    runs.append(np.array(cur)); cur = []
            if cur:
                runs.append(np.array(cur))
        for r in runs:
            if len(r) < 30:
                continue
            out.append(cv2.approxPolyDP(r.reshape(-1, 1, 2), eps, False).reshape(-1, 2) / SCALE)
    return out


def simplify(run):
    a = cv2.approxPolyDP(np.float32(run).reshape(-1, 1, 2), 0.25, False).reshape(-1, 2)
    return a.astype(float) - (X0, Y0)


def car_layers(img):
    crop = cv2.resize(img[Y0:Y1, X0:X1], None, fx=SCALE, fy=SCALE, interpolation=cv2.INTER_CUBIC)
    h, w = crop.shape[:2]
    car = soft(poly_mask((h, w), [CAR]))

    in_wheel = np.zeros((h, w), np.uint8)
    for (cx, cy), (rx, ry), ang in WHEELS:
        cv2.ellipse(in_wheel, (int((cx - X0) * SCALE), int((cy - Y0) * SCALE)), (int(rx * SCALE) + 6, int(ry * SCALE) + 6), ang, 0, 360, 255, -1)
    outline = contour_runs(car, hide=in_wheel)

    for (cx, cy), (rx, ry), ang in WHEELS:  # шины
        e = cv2.ellipse2Poly((int((cx - X0) * SCALE), int((cy - Y0) * SCALE)), (int(rx * SCALE), int(ry * SCALE)), ang, 0, 360, 4)
        outline.append(np.array(e, float) / SCALE)

    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    smooth = cv2.GaussianBlur(cv2.bilateralFilter(gray, 9, 40, 9), (3, 3), 0)
    edges = cv2.Canny(smooth, 45, 120, L2gradient=True)
    edges[cv2.erode(car, np.ones((4 * SCALE, 4 * SCALE), np.uint8)) == 0] = 0
    edges[poly_mask((h, w), [PLATE]) > 0] = 0
    # кромки, прорисованные при восстановлении (restore.LINES), идут готовыми векторами — как ручные линии;
    # Canny вдоль них глушим, иначе тонкая линия даёт двойной контур
    occ = restore.occluded_mask(img.shape[:2])[Y0:Y1, X0:X1].astype(np.uint8)
    occ = cv2.resize(occ, (w, h), interpolation=cv2.INTER_NEAREST)
    drawn = np.zeros((h, w), np.uint8)
    for pts, _ in restore.LINES:
        cv2.polylines(drawn, [np.int32([to_px(q) for q in pts])], False, 255, 1)
    drawn = cv2.dilate(drawn, np.ones((5 * SCALE, 5 * SCALE), np.uint8))
    edges[(drawn > 0) & (occ > 0)] = 0
    details = []
    cnts, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
    for c in cnts:
        c = c[: max(2, len(c) // 2 + 1)]  # контур тонкой линии идёт «туда-обратно» — берём половину
        if cv2.arcLength(c, False) < MIN_LEN:
            continue
        a = cv2.approxPolyDP(c, EPS, False).reshape(-1, 2) / SCALE
        if len(a) >= 2:
            details.append(a)
    # вектор — только в восстановленной зоне (+2 px на стык), снаружи эту же кромку уже дал Canny
    zone = cv2.dilate(occ, np.ones((2 * SCALE + 1, 2 * SCALE + 1), np.uint8))
    for pts, _ in restore.LINES:
        P = np.array(pts, float)
        for _ in range(3):  # Чайкин: плавная кривая через опорные точки, концы на месте
            q = np.empty((2 * len(P) - 2, 2))
            q[0::2] = 0.75 * P[:-1] + 0.25 * P[1:]
            q[1::2] = 0.25 * P[:-1] + 0.75 * P[1:]
            P = np.vstack([P[:1], q, P[-1:]])
        dense = np.vstack([np.linspace(P[i], P[i + 1], max(2, int(np.hypot(*(P[i + 1] - P[i])) * 2))) for i in range(len(P) - 1)])
        run = []
        for q in dense:
            x, y = to_px(q)
            if zone[min(int(y), h - 1), min(int(x), w - 1)]:
                run.append(q)
            elif run:
                if len(run) > 3:
                    details.append(simplify(run))
                run = []
        if len(run) > 3:
            details.append(simplify(run))
    pl = np.array([(x - X0, y - Y0) for x, y in PLATE + PLATE[:1]], float)
    details.append(np.repeat(pl, 2, axis=0))  # двойные точки — острые углы после сглаживания

    accent = []
    rest = []
    for a in details:
        cx, cy = a.mean(axis=0) + (X0, Y0)
        (accent if any(x0 <= cx <= x1 and y0 <= cy <= y1 for (x0, y0), (x1, y1) in ACCENT) else rest).append(a)
    return outline, rest, accent


def fmt(v):
    return f'{v:.1f}'.rstrip('0').rstrip('.')


def svg_d(a):
    """Сглаживание: квадратичные кривые через середины отрезков."""
    a = np.asarray(a, float)
    if len(a) < 3:
        return 'M' + 'L'.join(f'{fmt(x)} {fmt(y)}' for x, y in a)
    d = [f'M{fmt(a[0][0])} {fmt(a[0][1])}']
    for i in range(1, len(a) - 1):
        m = (a[i] + a[i + 1]) / 2
        d.append(f'Q{fmt(a[i][0])} {fmt(a[i][1])} {fmt(m[0])} {fmt(m[1])}')
    d.append(f'L{fmt(a[-1][0])} {fmt(a[-1][1])}')
    return ''.join(d)


def group(gid, paths, **attrs):
    """Внешняя группа несёт обводку, внутренняя (с id) — только пути: так <use href="#id"> может перекрасить линии."""
    at = ' '.join(f'{"class" if k == "class_" else k.replace("_", "-")}="{v}"' for k, v in attrs.items())
    body = ''.join(svg_d(p) for p in paths)
    return f'<g {at}><g id="{gid}"><path vector-effect="non-scaling-stroke" d="{body}"/></g></g>'




def main():
    img = cv2.imread(str(SRC))
    car_o, car_d, car_a = car_layers(img)
    vx0, vy0, vx1, vy1 = VIEW
    # кадр расчёта (X0, Y0) → кадр рисунка (VIEW): сдвиг путей
    shift = lambda ps: [np.asarray(p, float) - (vx0 - X0, vy0 - Y0) for p in ps]
    car_o, car_d, car_a = shift(car_o), shift(car_d), shift(car_a)
    W, H = vx1 - vx0, vy1 - vy0
    head = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" fill="none" stroke-linecap="round" stroke-linejoin="round">'
    svg_o = ''.join([
        head,
        group('art-car-o', car_o, stroke='#ececef', stroke_opacity='.9', stroke_width='1.5', class_='lo'),
        group('art-acc', car_a, stroke='#ff6a00', stroke_width='1.2', class_='la'),
        '</svg>',
    ])
    svg_d_ = ''.join([
        head,
        group('art-car-d', car_d, stroke='#ececef', stroke_opacity='.62', stroke_width='.9', class_='ld'),
        '</svg>',
    ])
    OUT_O.write_text(svg_o, encoding='utf-8')
    OUT_D.write_text(svg_d_, encoding='utf-8')
    print(f'{OUT_O.name}: {len(svg_o) / 1024:.1f} KB · {OUT_D.name}: {len(svg_d_) / 1024:.1f} KB · viewBox 0 0 {W} {H}')


if __name__ == '__main__':
    main()
