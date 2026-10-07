# Цветная заливка под линейный рисунок hero (Lamborghini без людей): цвета с фото, упрощённые до плоских пятен.
# Нужны: pip install opencv-python-headless numpy. Запуск: python scripts/hero-car-restore.py && python scripts/car-fill.py
#
# Шаги: кадр ×SCALE → сглаживание с сохранением краёв → k-средних в Lab → чистка мелких пятен → векторизация пятен
# (контуры → кривые) → SVG, пятна рисуются от крупных к мелким поверх общей подложки (без щелей между пятнами).
# Палитра и баланс белого считаются по тем же пикселям, что у принятого рисунка (машина без зоны, закрытой людьми, —
# OCCLUDED из hero-car-restore.py): цвета видимой машины не меняются, восстановленная зона красится той же палитрой.
# Результат: src/visual/car-fill.svg (слой под линиями, см. CarArt.jsx).
import importlib.util
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'scripts/hero-car-960.png'
OUT = ROOT / 'src/visual/car-fill.svg'
_spec = importlib.util.spec_from_file_location('restore', ROOT / 'scripts/hero-car-restore.py')
restore = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(restore)

X0, Y0, X1, Y1 = 225, 505, 895, 1015
VIEW = (272, 648, 890, 942)   # кадр рисунка — как в car-lineart.py
SCALE = 2
CAR = restore.CAR
K_CAR = 9
GRADE = {'car': (0.86, 0.9, 0)}   # тон: машина чуть темнее фото, чтобы светлые линии сверху читались
WB = 0.75                  # доля снимаемого вечернего синего оттенка (по белой машине)
EPS = 1.25                 # упрощение контуров пятен, px увеличенного кадра
MIN_AREA = 26              # px² увеличенного кадра: мельче — растворяем в соседях


def to_px(p):
    return ((p[0] - X0) * SCALE, (p[1] - Y0) * SCALE)


def poly_mask(shape, polys):
    m = np.zeros(shape, np.uint8)
    for p in polys:
        cv2.fillPoly(m, [np.array([to_px(q) for q in p], np.int32)], 255)
    return m


def soft(m, s):
    return np.where(cv2.GaussianBlur(m, (0, 0), s) > 127, 255, 0).astype(np.uint8)


def kmeans_labels(lab, mask, k, seed=3, fit=None):
    """Палитра — k-средних по пикселям fit (по умолчанию mask); метки — ближайший центр для всех пикселей mask."""
    fit = mask if fit is None else fit
    pts = lab[fit > 0].reshape(-1, 3).astype(np.float32)
    crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 40, 0.5)
    cv2.setRNGSeed(seed)
    _, lbl, centers = cv2.kmeans(pts, k, None, crit, 4, cv2.KMEANS_PP_CENTERS)
    out = np.full(mask.shape, -1, np.int32)
    out[fit > 0] = lbl.ravel()
    rest = (mask > 0) & (fit == 0)
    if rest.any():
        q = lab[rest].astype(np.float32)
        out[rest] = np.argmin(((q[:, None, :] - centers[None]) ** 2).sum(-1), 1)
    return out, centers


def grade(lab_color, kind):
    bright, sat, warm = GRADE[kind]
    lab = np.array(lab_color, np.float32)
    lab[2] = min(255, lab[2] + warm * 0.6)   # теплее: +b (жёлтый) и немного +a
    lab[1] = min(255, lab[1] + warm * 0.3)
    bgr = cv2.cvtColor(np.uint8([[lab]]), cv2.COLOR_LAB2BGR)[0, 0]
    hsv = cv2.cvtColor(np.uint8([[bgr]]), cv2.COLOR_BGR2HSV)[0, 0].astype(np.float32)
    hsv[1] = min(255, hsv[1] * sat)
    hsv[2] = min(255, hsv[2] * bright)
    b, g, r = cv2.cvtColor(np.uint8([[hsv]]), cv2.COLOR_HSV2BGR)[0, 0]
    return f'#{r:02x}{g:02x}{b:02x}'


def mode_filter(lbl, mask, k=5):
    """Убираем «соль»: каждый пиксель берёт самую частую метку в окне k×k (только внутри маски)."""
    n = lbl.max() + 1
    best = np.zeros(lbl.shape, np.float32)
    out = lbl.copy()
    for i in range(n):
        cnt = cv2.boxFilter((lbl == i).astype(np.float32), -1, (k, k), normalize=False)
        upd = cnt > best
        best[upd] = cnt[upd]
        out[upd] = i
    out[mask == 0] = -1
    return out


def fmt(v):
    return str(int(round(v)))


def svg_d(a):
    a = np.asarray(a, float)
    d = [f'M{fmt((a[0][0] + a[-1][0]) / 2)} {fmt((a[0][1] + a[-1][1]) / 2)}']
    for i in range(len(a)):
        p, q = a[i], a[(i + 1) % len(a)]
        m = (p + q) / 2
        d.append(f'Q{fmt(p[0])} {fmt(p[1])} {fmt(m[0])} {fmt(m[1])}')
    return ''.join(d) + 'Z'


def main():
    img = cv2.imread(str(SRC))
    crop = cv2.resize(img[Y0:Y1, X0:X1], None, fx=SCALE, fy=SCALE, interpolation=cv2.INTER_LANCZOS4)
    h, w = crop.shape[:2]
    occluded = soft(poly_mask((h, w), restore.OCCLUDED), 1.6 * SCALE)
    car = soft(poly_mask((h, w), [CAR]), 3 * SCALE)
    fit = car.copy()
    fit[occluded > 0] = 0

    smooth = cv2.edgePreservingFilter(crop, flags=cv2.RECURS_FILTER, sigma_s=24, sigma_r=0.32)
    smooth = cv2.bilateralFilter(smooth, 9, 30, 9)

    # баланс белого: снимаем вечерний синий оттенок по средней белой машине
    lab_all = cv2.cvtColor(crop, cv2.COLOR_BGR2LAB).astype(np.float32)
    ca, cb = cv2.mean(lab_all[:, :, 1], mask=fit)[0] - 128, cv2.mean(lab_all[:, :, 2], mask=fit)[0] - 128

    def to_lab(src):
        lab = cv2.cvtColor(src, cv2.COLOR_BGR2LAB).astype(np.float32)
        lab[:, :, 1] -= ca * WB
        lab[:, :, 2] -= cb * WB
        return np.clip(lab, 0, 255).astype(np.uint8)

    regions = []  # (цвет, контур, площадь)
    lab = to_lab(smooth)
    lbl, centers = kmeans_labels(lab, car, K_CAR, fit=fit)
    lbl = mode_filter(lbl, car, 7)
    colors = [grade(c, 'car') for c in centers.astype(np.uint8)]
    for i in range(K_CAR):
        m = ((lbl == i) & (car > 0)).astype(np.uint8) * 255
        cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        for c in cs:
            area = cv2.contourArea(c)
            if area < MIN_AREA:
                continue
            a = cv2.approxPolyDP(c, EPS, True).reshape(-1, 2) / SCALE
            if len(a) >= 3:
                regions.append((colors[i], a, area))
    # подложка — средний цвет машины по тем же пикселям, что палитра
    mean = cv2.mean(lab, mask=fit)[:3]
    cs, _ = cv2.findContours(car, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    for c in cs:
        if cv2.contourArea(c) > 200:
            regions.append((grade(np.uint8(mean), 'car'), cv2.approxPolyDP(c, EPS, True).reshape(-1, 2) / SCALE, 1e12 + cv2.contourArea(c)))

    # крупные пятна снизу, мелкие сверху; одинаковые цвета группируем в один path
    vx0, vy0, vx1, vy1 = VIEW
    off = np.array([vx0 - X0, vy0 - Y0], float)
    regions.sort(key=lambda r: -r[2])
    parts = []
    cur_color, cur = None, []
    for color, a, _ in regions:
        if color != cur_color and cur:
            parts.append(f'<path fill="{cur_color}" d="{"".join(cur)}"/>')
            cur = []
        cur_color = color
        cur.append(svg_d(a - off))
    if cur:
        parts.append(f'<path fill="{cur_color}" d="{"".join(cur)}"/>')
    W, H = vx1 - vx0, vy1 - vy0
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" stroke="none">' + ''.join(parts) + '</svg>'
    OUT.write_text(svg, encoding='utf-8')
    print(f'{OUT.name}: {len(svg) / 1024:.1f} KB, пятен: {len(regions)}')


if __name__ == '__main__':
    main()
