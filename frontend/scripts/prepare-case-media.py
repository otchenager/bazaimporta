# Медиа для кейса Lamborghini и блока 444 (закрытый канал).
# Нужны: pip install opencv-python-headless pillow imageio-ffmpeg. Запуск: python scripts/prepare-case-media.py
#
# Кейс (src/assets/case/): кадр рукопожатия 4:3 и ролик IMG_1904, разрезанный на два, с постерами и миниатюрами.
# 444 (src/assets/444/): скриншоты постов из Telegram — оставляем только кадр видео (без времени, подписи и кнопки ▶),
# увеличиваем в 2 раза с подшарпливанием — исходники очень маленькие.
import subprocess
from pathlib import Path

import cv2
import imageio_ffmpeg
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
MEDIA = ROOT / 'src/assets/media'
CASE = ROOT / 'src/assets/case'
B444 = ROOT / 'src/assets/444'
FF = imageio_ffmpeg.get_ffmpeg_exe()
VIDEO = MEDIA / 'IMG_1904.MP4'


def save_webp(img_bgr, path, widths, q=78):
    im = Image.fromarray(cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB))
    for w in widths:
        h = round(im.height * w / im.width)
        im.resize((w, h), Image.LANCZOS).save(f'{path}-{w}.webp', quality=q, method=6)


def upscale(img, k=2):
    big = cv2.resize(img, None, fx=k, fy=k, interpolation=cv2.INTER_CUBIC)
    big = cv2.bilateralFilter(big, 5, 18, 5)  # сглаживаем JPEG-артефакты
    blur = cv2.GaussianBlur(big, (0, 0), 1.6)
    return cv2.addWeighted(big, 1.6, blur, -0.6, 0)  # unsharp mask


def frame(t):
    out = subprocess.run([FF, '-v', 'error', '-ss', str(t), '-i', str(VIDEO), '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'],
                         capture_output=True, check=True).stdout
    return cv2.imdecode(np.frombuffer(out, np.uint8), cv2.IMREAD_COLOR)


def crop43(img, cy):
    """Горизонтальный кадр 4:3 из вертикального; cy — центр по высоте (0…1)."""
    h, w = img.shape[:2]
    ch = round(w * 3 / 4)
    y = int(min(max(cy * h - ch / 2, 0), h - ch))
    return img[y:y + ch]


def clip(src, dst, ss=None, to=None):
    """Видео для сайта: 480p, H.264, без лишнего битрейта; звук оставляем (видео запускается кликом)."""
    cut = (['-ss', str(ss)] if ss is not None else []) + (['-to', str(to)] if to is not None else [])
    subprocess.run([FF, '-v', 'error', '-y', '-i', str(src), *cut, '-vf', 'scale=480:-2', '-c:v', 'libx264', '-preset', 'slow', '-crf', '27',
                    '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '64k', str(dst)], check=True)


# Ролик AUTOLINE с Huracán один (IMG_1904, 31 с) — режем по склейке на 17,83 с на два: «перед и салон» и «обход кузова»
CLIPS = [('huracan-front', None, 17.8, 0.4), ('huracan-walk', 17.85, None, 19.0)]  # имя, начало, конец, кадр для постера


def case():
    CASE.mkdir(parents=True, exist_ok=True)
    for f in CASE.iterdir():  # набор файлов кейса задаёт этот скрипт целиком
        f.unlink()
    # Главное фото: рукопожатие у Huracán, 4:3 вокруг людей и машины (кадр в долях — исходник бывает разного разрешения)
    lamb = cv2.imread(str(MEDIA / 'lamb.jpg'))
    h, w = lamb.shape[:2]
    y0 = round(h * 0.3125)
    save_webp(lamb[y0:y0 + round(w * 3 / 4)], CASE / 'handshake', [640, 960, 1280], q=80)
    # Ролики: вертикальный постер для плеера и кадр 4:3 для миниатюры
    for name, ss, to, t in CLIPS:
        clip(VIDEO, CASE / f'{name}.mp4', ss, to)
        save_webp(upscale(frame(t)), CASE / f'{name}-poster', [480], q=72)
        save_webp(upscale(crop43(frame(t), .42)), CASE / f'{name}-thumb', [320], q=74)


CHAT_SRC = [ROOT.parent / 'incoming/est-opyt/supplier-chat.png', ROOT / 'incoming/est-opyt/supplier-chat.png']
CHAT = ROOT / 'src/assets/chat'


def chat():
    """Скриншот переписки с поставщиком («Есть опыт»): карточка ~340 px → 2x = 720 px, в лайтбоксе — до 1080 px."""
    src = next((p for p in CHAT_SRC if p.exists()), None)
    if not src:
        print('supplier-chat.png не найден — карточка переписки не выводится')
        return
    CHAT.mkdir(parents=True, exist_ok=True)
    im = Image.open(src).convert('RGB')
    for w in (720, 1080):
        w2 = min(w, im.width)
        im.resize((w2, round(im.height * w2 / im.width)), Image.LANCZOS).save(CHAT / f'supplier-chat-{w}.webp', quality=82, method=6)
    # размеры карточки (против сдвига вёрстки) и реальная ширина крупного файла — для srcset
    w2 = min(720, im.width)
    (CHAT / 'supplier-chat.json').write_text(f'{{"width": {w2}, "height": {round(im.height * w2 / im.width)}, "large": {min(1080, im.width)}}}')
    print('chat', im.size)


# Скриншоты постов: (файл, кадр видео x0, y0, x1, y1, кнопка ▶ (cx, cy, r) или None)
SHOTS = [
    ('блоки5.jpg', 'block-5', (0, 25, 518, 280), (264, 147, 30)),
    ('блоки4.jpg', 'block-8', (0, 22, 513, 274), (258, 137, 30)),
    ('блоки2.jpg', 'block-9', (7, 27, 473, 255), None),
    ('блоки3.jpg', 'block-10', (5, 27, 470, 258), None),
]


def read(path):  # cv2.imread не понимает кириллицу в пути на Windows
    return cv2.imdecode(np.fromfile(str(path), np.uint8), cv2.IMREAD_COLOR)


def b444():
    B444.mkdir(parents=True, exist_ok=True)
    for src, name, (x0, y0, x1, y1), play in SHOTS:
        img = read(MEDIA / src)
        if play:  # убираем кнопку ▶ Telegram: дорисовываем фон по краям круга
            cx, cy, r = play
            mask = np.zeros(img.shape[:2], np.uint8)
            cv2.circle(mask, (cx, cy), r, 255, -1)
            img = cv2.inpaint(img, mask, 9, cv2.INPAINT_TELEA)
        img = img[y0:y1, x0:x1]
        save_webp(upscale(img), B444 / name, [480, 800], q=80)
    # Текстовый разбор рынков: белый лист, верх страницы (Корея) в кадр 2:1, как у кадров видео
    doc = read(MEDIA / 'блоки1.jpg')
    w = doc.shape[1]
    save_webp(upscale(doc[0:w // 2, 0:w]), B444 / 'markets', [480, 800], q=82)


if __name__ == '__main__':
    case()
    b444()
    chat()
    for d in (CASE, B444, CHAT):
        if not d.exists():
            continue
        for f in sorted(d.iterdir()):
            print(f.relative_to(ROOT), f'{f.stat().st_size / 1024:.0f} KB')
