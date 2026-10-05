# Цветная заливка под линейный рисунок hero: цвета с фото (lamb.jpg), упрощённые до плоских пятен, как у иллюстратора.
# Нужны: pip install opencv-python-headless numpy. Запуск: python scripts/handshake-fill.py [--preview out.png]
#
# Шаги: кадр ×SCALE → сглаживание с сохранением краёв → k-средних в Lab (палитра на людей и на машину отдельно,
# у лиц — своя мелкая палитра, чтобы сохранить сходство) → чистка мелких пятен → векторизация пятен (контуры → кривые)
# → SVG, пятна рисуются от крупных к мелким поверх общей подложки (без щелей между пятнами).
# Тон: чуть темнее и насыщеннее фото, чтобы светлые линии сверху читались и на белой машине.
# Результат: src/visual/handshake-fill.svg (слой под линиями, см. HandshakeArt.jsx).
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from handshake_faces import face_parts  # noqa: E402
from handshake_people import LEFT_MAN, RIGHT_MAN  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
# Машина и одежда сняты с кадра 960×1280 (прежняя версия lamb.jpg) — фиксируем его, чтобы машина не менялась.
# Лица — с полного lamb.jpg (3840×5120), см. handshake_faces.py.
SRC = ROOT / 'scripts/hero-src-960.jpg'
OUT = ROOT / 'src/visual/handshake-fill.svg'

X0, Y0, X1, Y1 = 225, 505, 895, 1015
SCALE = 2
CAR = [(283, 800), (300, 770), (340, 735), (372, 715), (420, 700), (480, 672), (533, 666), (560, 660), (627, 661),
       (670, 665), (700, 672), (733, 673), (773, 682), (813, 693), (853, 702), (867, 717), (877, 740), (880, 790),
       (877, 833), (860, 853), (840, 850), (760, 866), (700, 883), (693, 917), (667, 933), (643, 923), (633, 907),
       (560, 920), (527, 923), (420, 913), (333, 905), (292, 905), (283, 880)]
# Лица и кисти — отдельная, более подробная палитра (сходство держится на мелких переходах тона)
FACES = [
    [(276, 524), (326, 524), (326, 586), (318, 592), (309, 597), (300, 598), (290, 594), (284, 590), (276, 584)],  # голова и шея левого
    [(432, 515), (488, 515), (488, 576), (476, 578), (466, 590), (458, 597), (450, 590), (444, 580), (432, 578)],  # голова и шея правого
    [(324, 682), (333, 676), (356, 675), (370, 679), (370, 702), (352, 704), (342, 707), (330, 703), (323, 695)],  # рукопожатие
    [(494, 752), (519, 752), (520, 795), (500, 798), (494, 785)],                                                  # кисть правого
    [(333, 738), (345, 734), (352, 738), (350, 752), (333, 755)],                                                  # кисть в кармане
]

K_PEOPLE, K_CAR, K_FACE = 12, 9, 9
# тон относительно фото: одежда и машина чуть темнее (светлые контуры сверху должны читаться), кожа — светлее и теплее
GRADE = {'body': (0.94, 1.25, 4), 'car': (0.86, 0.9, 0), 'face': (1.06, 1.05, 10), 'hair': (0.9, 1.0, 3)}
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


def kmeans_labels(lab, mask, k, seed=3):
    pts = lab[mask > 0].reshape(-1, 3).astype(np.float32)
    crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 40, 0.5)
    cv2.setRNGSeed(seed)
    _, lbl, centers = cv2.kmeans(pts, k, None, crit, 4, cv2.KMEANS_PP_CENTERS)
    out = np.full(mask.shape, -1, np.int32)
    out[mask > 0] = lbl.ravel()
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
    people = soft(poly_mask((h, w), [LEFT_MAN, RIGHT_MAN]), 1.6 * SCALE)
    car = soft(poly_mask((h, w), [CAR]), 3 * SCALE)
    car[people > 0] = 0
    faces = poly_mask((h, w), FACES)
    faces[people == 0] = 0
    body = people.copy()
    body[faces > 0] = 0

    # сглаживание с сохранением краёв: сильнее на одежде и машине, слабее на лицах
    smooth_strong = cv2.edgePreservingFilter(crop, flags=cv2.RECURS_FILTER, sigma_s=24, sigma_r=0.32)
    smooth_strong = cv2.bilateralFilter(smooth_strong, 9, 30, 9)
    smooth_soft = cv2.bilateralFilter(cv2.bilateralFilter(crop, 7, 26, 5), 7, 26, 5)

    # баланс белого: снимаем вечерний синий оттенок по средней белой машине
    lab_all = cv2.cvtColor(crop, cv2.COLOR_BGR2LAB).astype(np.float32)
    ca, cb = cv2.mean(lab_all[:, :, 1], mask=car)[0] - 128, cv2.mean(lab_all[:, :, 2], mask=car)[0] - 128

    def to_lab(src):
        lab = cv2.cvtColor(src, cv2.COLOR_BGR2LAB).astype(np.float32)
        lab[:, :, 1] -= ca * WB
        lab[:, :, 2] -= cb * WB
        return np.clip(lab, 0, 255).astype(np.uint8)

    regions = []  # (цвет, контур, площадь)
    for kind, mask, src, k, mk in (('car', car, smooth_strong, K_CAR, 7), ('body', body, smooth_strong, K_PEOPLE, 7), ('face', faces, smooth_soft, K_FACE, 5)):
        lab = to_lab(src)
        lbl, centers = kmeans_labels(lab, mask, k)
        lbl = mode_filter(lbl, mask, mk)
        colors = [grade(c, kind) for c in centers.astype(np.uint8)]
        for i in range(k):
            m = ((lbl == i) & (mask > 0)).astype(np.uint8) * 255
            cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
            for c in cs:
                area = cv2.contourArea(c)
                if area < MIN_AREA:
                    continue
                a = cv2.approxPolyDP(c, EPS, True).reshape(-1, 2) / SCALE
                if len(a) >= 3:
                    regions.append((colors[i], a, area))
        # подложка слоя — средний цвет области, чтобы между пятнами не было щелей
        mean = cv2.mean(lab, mask=mask)[:3]
        cs, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        for c in cs:
            if cv2.contourArea(c) > 200:
                regions.append((grade(np.uint8(mean), kind), cv2.approxPolyDP(c, EPS, True).reshape(-1, 2) / SCALE, 1e12 + cv2.contourArea(c)))

    # крупные пятна снизу, мелкие сверху; одинаковые цвета группируем в один path
    regions.sort(key=lambda r: -r[2])
    parts = []
    cur_color, cur = None, []
    for color, a, _ in regions:
        if color != cur_color and cur:
            parts.append(f'<path fill="{cur_color}" d="{"".join(cur)}"/>')
            cur = []
        cur_color = color
        cur.append(svg_d(a))
    if cur:
        parts.append(f'<path fill="{cur_color}" d="{"".join(cur)}"/>')
    W, H = X1 - X0, Y1 - Y0
    # лица — поверх всего, подробнее и с полного кадра (handshake_faces.py)
    parts.append(face_parts(X0, Y0, [LEFT_MAN, RIGHT_MAN], to_lab, grade))
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" stroke="none">' + ''.join(parts) + '</svg>'
    OUT.write_text(svg, encoding='utf-8')
    print(f'{OUT.name}: {len(svg) / 1024:.1f} KB, пятен: {len(regions)}')


if __name__ == '__main__':
    main()
