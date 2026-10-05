# Линейный рисунок для hero: рукопожатие у Lamborghini Huracán (src/assets/media/lamb.jpg) → два слоя SVG.
# Нужны: pip install opencv-python-headless numpy. Запуск: python scripts/handshake-lineart.py
#
# Машина: силуэт обведён вручную (CAR), внутренние линии — Canny внутри силуэта, короткие обрывки выкинуты,
#   колёса дорисованы эллипсами, оранжевый акцент — фара.
# Люди: нарисованы вручную по увеличенному фото (scripts/handshake_people.py) — силуэты, черты лица, одежда, кисти;
#   генератор только сглаживает линии и добавляет штриховку (щетина, борода, узор рубашки, тени) по заданным областям.
#
# Результат:
#   src/visual/handshake-o.svg — внешние контуры (проявляются первыми) + акцент;
#   src/visual/handshake-d.svg — детали и штриховка.
# Толщины — в пикселях экрана (vector-effect: non-scaling-stroke): контур 1.5, детали 0.9, стёжка 0.7, штриховка 0.5.
# Внутренние группы с id (art-car-o, art-ppl-d, …) без обводки — их переиспользуют <use> для блика и подсветки.
import math
import random
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from handshake_faces import HEADS  # noqa: E402
from handshake_people import HATCH, HATCH_LINES, LEFT_MAN, LINES, RIGHT_MAN  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
# Машина и одежда сняты с кадра 960×1280 (прежняя версия lamb.jpg) — фиксируем его, чтобы машина не менялась.
# Лица — с полного lamb.jpg (3840×5120), см. handshake_faces.py.
SRC = ROOT / 'scripts/hero-src-960.jpg'
OUT_O = ROOT / 'src/visual/handshake-o.svg'
OUT_D = ROOT / 'src/visual/handshake-d.svg'

# Кадр рисунка в координатах исходного фото (960×1280)
X0, Y0, X1, Y1 = 225, 505, 895, 1015
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


def car_layers(img, people):
    crop = cv2.resize(img[Y0:Y1, X0:X1], None, fx=SCALE, fy=SCALE, interpolation=cv2.INTER_CUBIC)
    h, w = crop.shape[:2]
    car = soft(poly_mask((h, w), [CAR]))
    near_people = cv2.dilate(people, np.ones((5 * SCALE, 5 * SCALE), np.uint8))
    car[near_people > 0] = 0

    in_wheel = np.zeros((h, w), np.uint8)
    for (cx, cy), (rx, ry), ang in WHEELS:
        cv2.ellipse(in_wheel, (int((cx - X0) * SCALE), int((cy - Y0) * SCALE)), (int(rx * SCALE) + 6, int(ry * SCALE) + 6), ang, 0, 360, 255, -1)
    outline = contour_runs(car, hide=cv2.bitwise_or(cv2.dilate(people, np.ones((7 * SCALE, 7 * SCALE), np.uint8)), in_wheel))

    for (cx, cy), (rx, ry), ang in WHEELS:  # шины
        e = cv2.ellipse2Poly((int((cx - X0) * SCALE), int((cy - Y0) * SCALE)), (int(rx * SCALE), int(ry * SCALE)), ang, 0, 360, 4)
        run = []
        for x, y in e:
            if near_people[min(y, h - 1), min(x, w - 1)] == 0:
                run.append((x, y))
            elif len(run) > 2:
                outline.append(np.array(run, float) / SCALE); run = []
            else:
                run = []
        if len(run) > 2:
            outline.append(np.array(run, float) / SCALE)

    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    smooth = cv2.GaussianBlur(cv2.bilateralFilter(gray, 9, 40, 9), (3, 3), 0)
    edges = cv2.Canny(smooth, 45, 120, L2gradient=True)
    edges[cv2.erode(car, np.ones((4 * SCALE, 4 * SCALE), np.uint8)) == 0] = 0
    edges[poly_mask((h, w), [PLATE]) > 0] = 0
    details = []
    cnts, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
    for c in cnts:
        c = c[: max(2, len(c) // 2 + 1)]  # контур тонкой линии идёт «туда-обратно» — берём половину
        if cv2.arcLength(c, False) < MIN_LEN:
            continue
        a = cv2.approxPolyDP(c, EPS, False).reshape(-1, 2) / SCALE
        if len(a) >= 2:
            details.append(a)
    pl = np.array([(x - X0, y - Y0) for x, y in PLATE + PLATE[:1]], float)
    details.append(np.repeat(pl, 2, axis=0))  # двойные точки — острые углы после сглаживания

    accent = []
    rest = []
    for a in details:
        cx, cy = a.mean(axis=0) + (X0, Y0)
        (accent if any(x0 <= cx <= x1 and y0 <= cy <= y1 for (x0, y0), (x1, y1) in ACCENT) else rest).append(a)
    return outline, rest, accent


def hatch(poly, density, length, angle, jitter, rng):
    """Короткие штрихи внутри многоугольника (координаты фото) → список отрезков в координатах рисунка."""
    P = np.array(poly, np.float32)
    area = cv2.contourArea(P)
    n = int(round(density * area / 100))
    out = []
    x0, y0 = P.min(axis=0)
    x1, y1 = P.max(axis=0)
    tries = 0
    while len(out) < n and tries < n * 40:
        tries += 1
        cx, cy = rng.uniform(x0, x1), rng.uniform(y0, y1)
        a = math.radians(angle + rng.uniform(-jitter, jitter))
        L = length * rng.uniform(0.65, 1.25) / 2
        p1 = (cx - L * math.cos(a), cy - L * math.sin(a))
        p2 = (cx + L * math.cos(a), cy + L * math.sin(a))
        if cv2.pointPolygonTest(P, p1, False) < 0 or cv2.pointPolygonTest(P, p2, False) < 0:
            continue
        out.append(np.array([p1, p2]) - (X0, Y0))
    return out


def hatch_lines(poly, spacing, angle):
    """Ровная параллельная штриховка: линии под углом с шагом spacing, обрезанные по многоугольнику."""
    P = np.array(poly, np.float32)
    c = P.mean(axis=0)
    a = math.radians(angle)
    d = np.array([math.cos(a), math.sin(a)])
    nrm = np.array([-d[1], d[0]])
    R = float(np.max(np.linalg.norm(P - c, axis=1))) + 2
    out = []
    k = -R
    while k <= R:
        base = c + nrm * k
        run = []
        for t in np.arange(-R, R, 0.5):
            q = base + d * t
            if cv2.pointPolygonTest(P, (float(q[0]), float(q[1])), False) >= 0:
                run.append(q)
            elif run:
                if len(run) > 2:
                    out.append(np.array([run[0], run[-1]]) - (X0, Y0))
                run = []
        if len(run) > 2:
            out.append(np.array([run[0], run[-1]]) - (X0, Y0))
        k += spacing
    return out


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


def on_face(a):
    """Линия лица/головы (в координатах рисунка): в цветном режиме её заменяет подробное лицо из заливки."""
    cx, cy = np.asarray(a, float).mean(axis=0) + (X0, Y0)
    return any(cv2.pointPolygonTest(np.array(h['poly'], np.float32), (float(cx), float(cy)), False) >= 0 for h in HEADS)


def split_face(paths):
    return [a for a in paths if not on_face(a)], [a for a in paths if on_face(a)]


def main():
    img = cv2.imread(str(SRC))
    W, H = X1 - X0, Y1 - Y0
    h, w = H * SCALE, W * SCALE
    people = soft(poly_mask((h, w), [LEFT_MAN, RIGHT_MAN]), 1.6)

    car_o, car_d, car_a = car_layers(img, people)
    ppl_o = contour_runs(people, min_area=500, eps=EPS * 0.9)

    rel = lambda pts: np.array(pts, float) - (X0, Y0)
    by = {}
    for cls, pts in LINES:
        by.setdefault(cls, []).append(rel(pts))
    rng = random.Random(7)
    hatches = []
    for poly, dens, length, ang, jit, _cls in HATCH:
        hatches += hatch(poly, dens, length, ang, jit, rng)
    for poly, spacing, ang in HATCH_LINES:
        hatches += hatch_lines(poly, spacing, ang)
    # черты лица — отдельной группой .lface (index.css прячет её, когда пришла заливка с подробными лицами)
    face = []
    for k in ('d', 'b', 'p', 'q', 'h'):
        by[k], f = split_face(by.get(k, []))
        face += [(k, a) for a in f]
    hatches += by.pop('h', [])
    # штриховка по областям (щетина, борода, стрижка) остаётся и в цвете — поверх подробного лица

    head = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" fill="none" stroke-linecap="round" stroke-linejoin="round">'
    svg_o = ''.join([
        head,
        group('art-car-o', car_o, stroke='#ececef', stroke_opacity='.9', stroke_width='1.5', class_='lo'),
        group('art-ppl-o', ppl_o, stroke='#ececef', stroke_opacity='.95', stroke_width='1.5', class_='lo'),
        group('art-acc', car_a, stroke='#ff6a00', stroke_width='1.2', class_='la'),
        '</svg>',
    ])
    svg_d_ = ''.join([
        head,
        group('art-car-d', car_d, stroke='#ececef', stroke_opacity='.62', stroke_width='.9', class_='ld'),
        group('art-ppl-d', by.get('d', []), stroke='#ececef', stroke_opacity='.82', stroke_width='.9', class_='ld ink'),
        group('art-ppl-b', by.get('b', []), stroke='#ececef', stroke_opacity='.9', stroke_width='1.15', class_='lb ink'),
        group('art-ppl-p', by.get('p', []), stroke='#ececef', stroke_width='1.6', class_='lp ink'),
        group('art-ppl-q', by.get('q', []), stroke='#ececef', stroke_opacity='.5', stroke_width='.7', class_='lq ink'),
        group('art-hatch', hatches, stroke='#ececef', stroke_opacity='.42', stroke_width='.5', class_='lh ink'),
        '<g class="lface">',
        group('art-face-d', [a for k, a in face if k in 'dq'], stroke='#ececef', stroke_opacity='.82', stroke_width='.9', class_='ld ink'),
        group('art-face-b', [a for k, a in face if k == 'b'], stroke='#ececef', stroke_opacity='.9', stroke_width='1.15', class_='lb ink'),
        group('art-face-p', [a for k, a in face if k == 'p'], stroke='#ececef', stroke_width='1.6', class_='lp ink'),
        group('art-face-h', [a for k, a in face if k == 'h'], stroke='#ececef', stroke_opacity='.42', stroke_width='.5', class_='lh ink'),
        '</g>',
        '</svg>',
    ])
    OUT_O.write_text(svg_o, encoding='utf-8')
    OUT_D.write_text(svg_d_, encoding='utf-8')
    print(f'{OUT_O.name}: {len(svg_o) / 1024:.1f} KB · {OUT_D.name}: {len(svg_d_) / 1024:.1f} KB · штрихов: {len(hatches)}')


if __name__ == '__main__':
    main()
