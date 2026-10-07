# Hero без людей: восстанавливаем на фото (hero-src-960.jpg) часть передка Huracán, которую закрывали люди.
# Нужны: pip install opencv-python-headless numpy. Запуск: python scripts/hero-car-restore.py [--preview out.png]
#
# Ракурс 3/4: дальняя (левая в кадре) половина передка сжата к краю кузова, ближняя — развёрнута.
# - Дальняя фара, Y-образный воздухозаборник и нижняя губа: ближние видны целиком — переносим их зеркально
#   перспективным преобразованием (четырёхугольник ближней половины → четырёхугольник дальней).
# - Зона за правым человеком закрыта на обеих половинах, но там простая геометрия: капот, кромка носа,
#   лицевая часть бампера, тёмный воздухозаборник с рёбрами, лобовое стекло. Гладкие поверхности тянем
#   с видимых участков той же поверхности (pull-push), кромки и рёбра прорисовываем по продолжению видимых.
# Координаты — пиксели фото 960×1280 (те же, что в car-lineart.py). Пиксели вне закрытой зоны не меняются
# (PNG без пересжатия): видимая машина остаётся прежней.
# Результат: scripts/hero-car-960.png — исходник для car-lineart.py и car-fill.py.
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'scripts/hero-src-960.jpg'
OUT = ROOT / 'scripts/hero-car-960.png'

# Зона, где на исходном кадре стояли люди (силуэты сняты по фото вручную, координаты фото 960×1280).
OCCLUDER_LEFT = [
    (281, 547.5), (282.5, 539), (288, 532.5), (297.5, 528.3), (306, 529), (313, 533), (318, 538), (321, 545), (322, 555),
    (321, 566.7), (319, 574), (315, 581.7), (315, 588), (325, 594), (340, 606.7), (348.7, 613), (355, 630), (362, 650),
    (367, 670), (370, 680), (370, 705), (369, 712), (366, 725), (365, 738), (352, 741), (349, 750), (343, 757),
    (339, 765), (333, 800), (327, 840), (322, 880), (318, 920), (315, 950), (313, 955), (325, 962), (338, 968),
    (348, 975), (347, 982), (330, 985), (287, 985), (282, 980), (283, 965), (288, 955), (290, 920), (290, 880),
    (294, 840), (296, 805), (292, 800), (288, 840), (283, 880), (278, 920), (275, 950), (268, 958), (268, 990),
    (265, 1002), (250, 1003), (240, 1000), (240, 985), (243, 958), (246, 955), (247, 940), (248, 900), (249, 860),
    (251, 820), (254, 780), (256, 745), (258.7, 736), (257, 723), (252, 703), (247, 683), (241, 660), (240, 630),
    (242, 608), (252, 598), (265, 593), (278.7, 590), (286, 586), (285, 580), (282.5, 570), (278.3, 564), (277.8, 559),
    (279, 555),
]
OCCLUDER_RIGHT = [
    (436.3, 537.5), (438.8, 530), (447.2, 523.75), (457.2, 521.7), (467.2, 523.75), (474.7, 529.2), (478, 536.7), (478, 549.2), (482.2, 550.8),
    (483, 556.7), (480.5, 563.3), (476, 567), (473, 575), (481.7, 576), (493.3, 590), (501.7, 595), (515, 598.3), (525, 608.3),
    (531.7, 636.7), (535, 670), (533.3, 703.3), (525, 740), (520, 752), (519, 780), (520, 800), (522, 850), (523, 900),
    (522, 940), (520, 975), (522, 985), (523, 998), (518, 1003), (475, 1009), (463, 1007), (462, 1000), (465, 992),
    (476, 988), (420, 987), (413, 982), (414, 975), (420, 968), (430, 962), (445, 958), (443, 940), (440, 900),
    (436, 850), (432, 800), (428.3, 755), (421.7, 736.7), (420, 703.3), (420, 693.3), (406.7, 695), (390, 698.3), (371.7, 701.7),
    (369, 690), (371.7, 680), (385, 676.7), (400, 673.3), (410, 663.3), (413.3, 641.7), (418.3, 621.7), (425, 603), (438.3, 595),
    (446.7, 588), (444.7, 576.7), (440.5, 570.8), (437.2, 561.7), (436.3, 550),
]
OCCLUDED = [OCCLUDER_LEFT, OCCLUDER_RIGHT]

CAR = [(283, 800), (300, 770), (340, 735), (372, 715), (420, 700), (480, 672), (533, 666), (560, 660), (627, 661),
       (670, 665), (700, 672), (733, 673), (773, 682), (813, 693), (853, 702), (867, 717), (877, 740), (880, 790),
       (877, 833), (860, 853), (840, 850), (760, 866), (700, 883), (693, 917), (667, 933), (643, 923), (633, 907),
       (560, 920), (527, 923), (420, 913), (333, 905), (292, 905), (283, 880)]

# Поверхности: многоугольник покрывает и видимую часть поверхности (оттуда берётся тон), и закрытую.
GLASS = [(362, 747), (376, 734), (432, 697), (550, 678), (610, 677), (610, 756), (520, 754)]
INTAKE = [(437, 867), (521, 867), (518, 878), (516, 925), (437, 932), (400, 932), (400, 872)]   # центр-право, под номером
INTAKE_FAR = [(306, 869), (323, 869), (322, 905), (306, 905)]                                    # слева от номера
FINS = [  # белые рёбра в воздухозаборнике (видимые кончики продолжены)
    [(425, 886), (440, 884), (455, 919), (450, 922)],
    [(486, 897), (492, 895), (494, 929), (488, 931)],
    [(320, 886), (313, 884), (306, 917), (309, 919)],   # зеркало первого — слева от номера
]
# Линии кромок: (точки, толщина px)
LINES = [
    ([(405, 831), (430, 831.5), (460, 835.5), (488, 839.5), (511, 840.5)], 1.0),     # кромка носа → угол ближней фары
    ([(522, 801.5), (516, 806), (512, 813.5)], 1.3),                                 # линия капота → верх фары
    ([(528, 810.5), (511, 816.5), (506, 826), (507, 835), (512, 839.5)], 1.0),      # контур фары (продолжение видимого)
    ([(337, 822), (328, 819.5), (316, 815), (307, 812)], 1.0),                      # кромка носа → угол дальней фары
    ([(347.5, 761), (349.5, 756), (352.5, 750.5), (356, 745)], 1.3),                              # дальняя линия капота → низ стекла
]
# Перенос дальней фары и заборника: ближний четырёхугольник → дальний (внутренний край ↔ внутренний, внешний ↔ внешний)
NEAR_Q = [(526, 797), (640, 764), (637, 913), (526, 926)]
FAR_Q = [(306, 813), (277, 789), (278, 904), (306, 907)]
# Ближняя фара: внутренний конец закрыт — дорисовываем сужающийся «клинок» до угла (стекло — тон видимой фары)
HEADLIGHT = [(528, 810.5), (511, 816.5), (506, 826), (507, 835), (512, 839.5), (528, 836.5)]


def poly(shape, p, dil=0):
    m = np.zeros(shape, np.uint8)
    cv2.fillPoly(m, [np.int32(np.round(np.array(p, float) * 4))], 255, shift=2)
    if dil:
        m = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * dil + 1, 2 * dil + 1)))
    return m > 0


def pull_push(img, known, levels=7):
    """Гладкое заполнение: среднее известных пикселей по пирамиде, неизвестные берут тон с ближайшего уровня."""
    f = img.astype(np.float32) * known[..., None]
    w = known.astype(np.float32)
    pyr = [(f, w)]
    for _ in range(levels):
        f, w = cv2.pyrDown(f), cv2.pyrDown(w)
        pyr.append((f, w))
    f, w = pyr[-1]
    est = f / np.maximum(w, 1e-6)[..., None]
    for f, w in reversed(pyr[:-1]):
        up = cv2.resize(est, (f.shape[1], f.shape[0]), interpolation=cv2.INTER_LINEAR)
        a = np.clip(w * 4, 0, 1)[..., None]
        est = (f / np.maximum(w, 1e-6)[..., None]) * a + up * (1 - a)
    return est


def row_fill(img, region, known, fallback):
    """Тон по строкам: линейно между ближайшими видимыми пикселями той же поверхности слева и справа
    (среднее 3 px у края), с одной стороны — продолжение края; без обеих — fallback. Затем лёгкое сглаживание по вертикали."""
    out = fallback.copy()
    H, W = region.shape
    for y in np.nonzero(region.any(1))[0]:
        xs = np.nonzero(region[y])[0]
        # непрерывные отрезки строки
        for seg in np.split(xs, np.nonzero(np.diff(xs) > 1)[0] + 1):
            a, b = seg[0], seg[-1]
            L = [x for x in range(a - 1, max(a - 12, -1), -1) if known[y, x]][:3]
            R = [x for x in range(b + 1, min(b + 12, W)) if known[y, x]][:3]
            cl = img[y, L].mean(0) if L else None
            cr = img[y, R].mean(0) if R else None
            if cl is None and cr is None:
                continue
            if cl is None or cr is None:
                c = cl if cr is None else cr
                t = np.linspace(0, 1, len(seg))[:, None]
                if cr is None:
                    out[y, seg] = c * (1 - t) + fallback[y, seg] * t
                else:
                    out[y, seg] = fallback[y, seg] * (1 - t) + c * t
                continue
            t = np.linspace(0, 1, len(seg) + 2)[1:-1, None]
            out[y, seg] = cl * (1 - t) + cr * t
    sm = cv2.GaussianBlur(out, (0, 0), sigmaX=0.6, sigmaY=2.5)
    wm = cv2.GaussianBlur(region.astype(np.float32), (0, 0), sigmaX=0.6, sigmaY=2.5)
    sm2 = cv2.GaussianBlur(out * region[..., None], (0, 0), sigmaX=0.6, sigmaY=2.5) / np.maximum(wm, 1e-6)[..., None]
    return np.where(region[..., None], sm2, out)


def occluded_mask(sh):
    """Зона людей на кадре 960×1280. Силуэты сняты с запасом, просветы между ногами закрыты:
    по краю силуэта пиксели смешаны с одеждой."""
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (17, 17))
    people = np.zeros(sh, bool)
    for p in OCCLUDED:
        people |= cv2.morphologyEx(poly(sh, p).astype(np.uint8), cv2.MORPH_CLOSE, k) > 0
    return cv2.dilate(people.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))) > 0


def main():
    img = cv2.imread(str(SRC))
    H, W = img.shape[:2]
    sh = (H, W)
    f32 = img.astype(np.float32)
    people = occluded_mask(sh)
    car = poly(sh, CAR, 5)
    hidden = people & car
    vis = car & ~people
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    out = f32.copy()

    def fill(region, known):
        m = region & hidden
        if not m.any():
            return
        fb = pull_push(img, known)
        res = row_fill(f32, m, known, fb)
        out[m] = res[m]

    g = poly(sh, GLASS)
    win = np.zeros(sh, bool)
    win[640:960, 260:660] = True
    body_known = vis & win & (gray > 160) & ~g
    # 1. кузов (всё, кроме стекла)
    fill(car & ~g, body_known)
    # 2. стекло
    fill(g, g & vis & (gray < 120))
    # 3. дальняя фара, Y-заборник и губа — зеркальный перенос ближней половины
    M = cv2.getPerspectiveTransform(np.float32(FAR_Q), np.float32(NEAR_Q))
    warped = cv2.warpPerspective(img, M, (W, H), flags=cv2.INTER_AREA | cv2.WARP_INVERSE_MAP).astype(np.float32)
    fq = poly(sh, FAR_Q) & hidden
    out[fq] = warped[fq]
    # 4. ближняя фара до внутреннего угла
    hl = poly(sh, HEADLIGHT) & hidden
    # стекло тянем с видимого внутреннего края фары: столбец x=530…545 сжимается к углу, профиль по высоте — тот же
    ys, xs = np.nonzero(hl)
    P = np.array(HEADLIGHT, float)
    for y, x in zip(ys, xs):
        col = P[P[:, 0] <= x + 0.5]
        top = np.interp(x, [506, 511, 528], [826, 816.5, 810.5])
        bot = np.interp(x, [506, 507, 512, 528], [826, 835, 839.5, 836.5])
        t = np.clip((y - top) / max(bot - top, 1), 0, 1)
        sx = 530 + (528 - x) * 0.6
        sy = 810.5 + t * (836.5 - 810.5)
        out[y, x] = cv2.getRectSubPix(img, (1, 1), (float(sx), float(sy)))[0, 0]
    # 5. тёмные заборники
    dark = vis & (gray < 45)
    dark[:860] = False
    for p in (INTAKE, INTAKE_FAR):
        fill(poly(sh, p), dark)
    # 6. белые рёбра и стойка рамки — тон белых частей бампера
    white = vis & (gray > 150)
    white[:850] = False
    wcol = np.median(f32[white & win], 0)
    for p in FINS:
        r = poly(sh, p) & hidden
        out[r] = wcol
    # 7. кромки — тон видимой кромки носа
    crease = img[822:832, 340:400].reshape(-1, 3)
    col = crease[np.argsort(crease.sum(1))[:20]].mean(0)
    lines = np.zeros(sh, np.float32)
    for pts, wpx in LINES:
        cv2.polylines(lines, [np.int32(np.array(pts) * 16)], False, 1.0, max(1, int(round(wpx))), cv2.LINE_AA, shift=4)
    # линии заходят на 3 px за край зоны — чтобы сомкнуться с видимым продолжением без зазора
    near = cv2.dilate(hidden.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))) > 0
    a = (np.clip(lines * 1.2, 0, 1) * near)[..., None]
    out = out * (1 - a) + col * a

    res = np.where((hidden | (a[..., 0] > 0))[..., None], np.clip(out, 0, 255).round(), img).astype(np.uint8)
    cv2.imwrite(str(OUT), res)
    if '--preview' in sys.argv:
        x0, y0, x1, y1 = 260, 650, 680, 960
        dbg = res.copy()
        cnt, _ = cv2.findContours(hidden.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        cv2.drawContours(dbg, cnt, -1, (0, 0, 255), 1)
        cv2.imwrite(sys.argv[sys.argv.index('--preview') + 1], np.vstack([
            cv2.resize(res[y0:y1, x0:x1], None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC),
            cv2.resize(dbg[y0:y1, x0:x1], None, fx=3, fy=3, interpolation=cv2.INTER_NEAREST)]))
    print(f'{OUT.name}: restored {int(hidden.sum())} px')


if __name__ == '__main__':
    main()
