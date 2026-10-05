# Лица для hero-рисунка — отдельно от остального, с полного кадра lamb.jpg (3840×5120, в 4 раза крупнее координат 960×1280).
# Вызывается из handshake-fill.py: лица ложатся в слой заливки поверх одежды (в линейном слое у них — прежние ручные линии,
# в заливке они прячутся: см. .lface в index.css).
#
# В той же «рисованной» манере, что и всё остальное, только детальнее:
#   тона — k-средних в Lab с бо́льшим числом уровней, чем на одежде, мелкие пятна растворяются в соседях;
#   тушь — тёмные линии (брови, веки, ноздри, губы, складки, уши, линия роста волос) — «темнее окрестности» с порогом,
#     без мусора: открытие, отсев мелких пятен, сглаженные контуры;
#   глаза — зрачок и блик кружками (по самой тёмной точке у глаза).
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
HIRES = ROOT / 'src/assets/media/lamb.jpg'
BASE = ROOT / 'scripts/hero-src-960.jpg'  # оригинальное фото (до апскейла)
BASE_W = 960  # ширина кадра, в котором заданы координаты

# Головы с шеей (координаты 960×1280) и примерные центры глаз (уточняются по фото)
HEADS = [
    {
        'name': 'left',
        'detail': True,
        # Черты — ручными линиями, снятыми с оригинала (handshake_people.py, слой линий, остаются и в цвете);
        # из заливки здесь только гладкие тона кожи и волос, без автоматической туши.
        'lines': True,
        'tones': 6,
        # Апскейл lamb.jpg исказил кончик носа и рот (розовое пятно, «двойная» губа) — эту зону берём с оригинального фото 960
        # (scripts/hero-src-960.jpg): увеличиваем, подгоняем цвет к соседней коже и вклеиваем с мягким краем
        'fix': [(294, 562, 323, 586)],
        'flatten': 0.5,  # свет на лице сбоку: сжимаем перепады яркости кожи, иначе блик и тень ложатся грубыми пятнами
        'poly': [(276, 524), (326, 524), (326, 586), (318, 592), (309, 597), (300, 598), (290, 594), (284, 590), (276, 584)],
        'eyes': [(299.5, 556.8), (315.7, 556.8)],
    },
    {
        'name': 'right',
        'detail': True,
        'poly': [(432, 515), (488, 515), (488, 576), (476, 578), (466, 590), (458, 597), (450, 590), (444, 580), (432, 578)],
        'eyes': [(444.4, 552.4), (460.6, 552.1)],
    },
]

K_TONES = 10       # уровней тона на лицо (на одежде — 12 на всех людей сразу)
MIN_TONE = 120     # px² полного кадра: мельче — растворяем
EPS_TONE = 1.6     # упрощение контура пятна, px полного кадра
INK_T = 12         # насколько линия темнее окрестности (0…255)
MIN_INK = 40       # px² полного кадра: мельче — мусор
INK = '#24180f'


def fmt(v):
    return f'{v:.2f}'.rstrip('0').rstrip('.')


def closed_d(a):
    """Замкнутый контур → квадратичные кривые через середины отрезков (как у пятен заливки, но с дробными координатами)."""
    a = np.asarray(a, float)
    d = [f'M{fmt((a[0][0] + a[-1][0]) / 2)} {fmt((a[0][1] + a[-1][1]) / 2)}']
    for i in range(len(a)):
        p, q = a[i], a[(i + 1) % len(a)]
        m = (p + q) / 2
        d.append(f'Q{fmt(p[0])} {fmt(p[1])} {fmt(m[0])} {fmt(m[1])}')
    return ''.join(d) + 'Z'


def patch(crop, base, rect, origin, n):
    """Зона rect (координаты 960) из оригинального фото: ×n, цвет подогнан к коже вокруг, край мягкий."""
    fx0, fy0, fx1, fy1 = rect
    m = 3  # запас для перехода
    src = base[fy0 - m:fy1 + m, fx0 - m:fx1 + m]
    big = cv2.resize(src, None, fx=n, fy=n, interpolation=cv2.INTER_CUBIC)
    big = cv2.bilateralFilter(big, 7, 14, 5)
    big = cv2.addWeighted(big, 1.5, cv2.GaussianBlur(big, (0, 0), 2.5), -0.5, 0)  # мягкая резкость
    x, y = int((fx0 - m - origin[0]) * n), int((fy0 - m - origin[1]) * n)
    H, W = big.shape[:2]
    dst = crop[y:y + H, x:x + W].astype(np.float32)
    lab_s = cv2.cvtColor(big, cv2.COLOR_BGR2LAB).astype(np.float32)
    lab_d = cv2.cvtColor(dst.astype(np.uint8), cv2.COLOR_BGR2LAB).astype(np.float32)
    # цвет: среднее и разброс по каналам — как у апскейла в той же зоне (без потери формы)
    for c in range(3):
        lab_s[:, :, c] = (lab_s[:, :, c] - lab_s[:, :, c].mean()) * (lab_d[:, :, c].std() / max(lab_s[:, :, c].std(), 1)) ** 0.5 + lab_d[:, :, c].mean()
    fixed = cv2.cvtColor(np.clip(lab_s, 0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR).astype(np.float32)
    a = np.zeros((H, W), np.float32)
    a[int(m * n):H - int(m * n), int(m * n):W - int(m * n)] = 1
    a = cv2.GaussianBlur(a, (0, 0), m * n / 2.2)[..., None]
    crop[y:y + H, x:x + W] = (fixed * a + dst * (1 - a)).astype(np.uint8)
    return crop


def mode_filter(lbl, mask, k):
    out = lbl.copy()
    best = np.zeros(lbl.shape, np.float32)
    for i in range(lbl.max() + 1):
        cnt = cv2.boxFilter((lbl == i).astype(np.float32), -1, (k, k), normalize=False)
        upd = cnt > best
        best[upd] = cnt[upd]
        out[upd] = i
    out[mask == 0] = -1
    return out


def face_parts(x0, y0, people_poly, to_lab, grade):
    """SVG-пути лиц в координатах рисунка (начало — x0, y0 кадра 960). to_lab/grade — те же, что у остальной заливки."""
    img = cv2.imread(str(HIRES))
    n = img.shape[1] / BASE_W
    base = cv2.imread(str(BASE))
    tones, ink, eyes = [], [], []
    for head in (h for h in HEADS if h['detail']):
        P = np.array(head['poly'], float)
        bx0, by0 = np.floor(P.min(axis=0)) - 2
        bx1, by1 = np.ceil(P.max(axis=0)) + 2
        ox, oy = int(bx0 * n), int(by0 * n)
        crop = img[oy:int(by1 * n), ox:int(bx1 * n)].copy()
        h, w = crop.shape[:2]
        for fx0, fy0, fx1, fy1 in head.get('fix', []):
            crop = patch(crop, base, (fx0, fy0, fx1, fy1), (bx0, by0), n)
        to_v = lambda pts: np.asarray(pts, float) / n + (bx0 - x0, by0 - y0)  # px кропа → координаты рисунка

        mask = np.zeros((h, w), np.uint8)
        cv2.fillPoly(mask, [np.int32((P - (bx0, by0)) * n)], 255)
        person = np.zeros((h, w), np.uint8)
        for poly in people_poly:
            cv2.fillPoly(person, [np.int32((np.array(poly, float) - (bx0, by0)) * n)], 255)
        person = np.where(cv2.GaussianBlur(person, (0, 0), 1.6 * n) > 127, 255, 0).astype(np.uint8)
        mask[person == 0] = 0

        # тона: сглаживание с сохранением краёв → k-средних → чистка «соли»
        smooth = cv2.edgePreservingFilter(crop, flags=cv2.RECURS_FILTER, sigma_s=16, sigma_r=0.26)
        smooth = cv2.bilateralFilter(smooth, 9, 20, 7)
        lab = to_lab(smooth)
        if head.get('flatten'):
            L = lab[:, :, 0].astype(np.float32)
            skin = (mask > 0) & (L > 78)  # всё, кроме волос
            mu = L[skin].mean()
            L[skin] = mu + (L[skin] - mu) * head['flatten']
            lab[:, :, 0] = np.clip(L, 0, 255).astype(np.uint8)
        pts = lab[mask > 0].reshape(-1, 3).astype(np.float32)
        cv2.setRNGSeed(5)
        k = head.get('tones', K_TONES)
        _, lbl, centers = cv2.kmeans(pts, k, None, (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 40, 0.5), 4, cv2.KMEANS_PP_CENTERS)
        L = np.full((h, w), -1, np.int32)
        L[mask > 0] = lbl.ravel()
        L = mode_filter(L, mask, 11)
        # кожа — светлее и теплее (как раньше), волосы и борода остаются тёмными
        colors = [grade(c, 'face' if c[0] > 80 else 'hair') for c in centers.astype(np.uint8)]
        regs = []
        cs, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        for c in cs:  # подложка — средний тон лица
            regs.append((grade(np.uint8(cv2.mean(lab, mask=mask)[:3]), 'face'), cv2.approxPolyDP(c, EPS_TONE, True).reshape(-1, 2), 1e12))
        for i in range(k):
            m = ((L == i) & (mask > 0)).astype(np.uint8) * 255
            for c in cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)[0]:
                area = cv2.contourArea(c)
                if area >= MIN_TONE:
                    a = cv2.approxPolyDP(c, EPS_TONE, True).reshape(-1, 2)
                    if len(a) >= 3:
                        regs.append((colors[i], a, area))
        regs.sort(key=lambda r: -r[2])
        tones += [(col, closed_d(to_v(a))) for col, a, _ in regs]

        if head.get('lines'):  # черты — ручными линиями в слое линий
            continue

        # тушь: пиксель заметно темнее окрестности; только внутри лица (не по краю силуэта — там обводка)
        gray = cv2.cvtColor(cv2.bilateralFilter(crop, 5, 18, 3), cv2.COLOR_BGR2GRAY).astype(np.float32)
        dark = cv2.GaussianBlur(gray, (0, 0), 0.9 * n) - gray  # узкое окно: тонкие линии, а не тёмные впадины
        m = ((dark > INK_T) & (cv2.erode(mask, np.ones((int(1.5 * n), int(1.5 * n)), np.uint8)) > 0)).astype(np.uint8) * 255
        m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
        m = np.where(cv2.GaussianBlur(m, (0, 0), 0.8) > 110, 255, 0).astype(np.uint8)  # гладкие края
        for c in cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)[0]:
            if cv2.contourArea(c) >= MIN_INK:
                a = cv2.approxPolyDP(c, 0.9, True).reshape(-1, 2)
                if len(a) >= 3:
                    ink.append(closed_d(to_v(a)))

        # глаза: самая тёмная точка рядом с примерным центром — зрачок, над ним блик
        for ex, ey in head['eyes']:
            cx, cy = (ex - bx0) * n, (ey - by0) * n
            r = int(2.2 * n)
            win = cv2.GaussianBlur(gray, (0, 0), 1.2)[int(cy - r / 2):int(cy + r / 2), int(cx - r):int(cx + r)]
            yy, xx = np.unravel_index(np.argmin(win), win.shape)
            eyes.append(to_v([(cx - r + xx, cy - r / 2 + yy)])[0])

    parts = ['<g class="face">']
    cur, buf = None, []
    for col, d in tones:
        if col != cur and buf:
            parts.append(f'<path fill="{cur}" d="{"".join(buf)}"/>')
            buf = []
        cur = col
        buf.append(d)
    if buf:
        parts.append(f'<path fill="{cur}" d="{"".join(buf)}"/>')
    parts.append(f'<path fill="{INK}" fill-opacity=".86" d="{"".join(ink)}"/>')
    parts.append('<g fill="#140c07">' + ''.join(f'<circle cx="{fmt(x)}" cy="{fmt(y)}" r=".6"/>' for x, y in eyes) + '</g>')
    parts.append('<g fill="#fff" fill-opacity=".9">' + ''.join(f'<circle cx="{fmt(x - .22)}" cy="{fmt(y - .24)}" r=".22"/>' for x, y in eyes) + '</g>')
    parts.append('</g>')
    return ''.join(parts)
