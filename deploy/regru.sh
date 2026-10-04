#!/usr/bin/env bash
# BAZA Import — выкладка статики на shared-хостинг reg.ru.
#   bash regru.sh check                 только смотрит, ничего не меняет
#   bash regru.sh deploy                бэкап → снимок правок прода → новая версия → проверка
#   bash regru.sh rollback <архив.tar.gz>  вернуть бэкап (текущая папка сайта отодвигается, не удаляется)
# Переменные: DOCROOT=/путь/к/папке/сайта (если автопоиск не нашёл), BRANCH (по умолчанию redesign).
set -euo pipefail

SITE="${SITE:-https://bazaimporta.ru}"
REPO="https://github.com/otchenager/bazaimporta.git"
BRANCH="${BRANCH:-redesign}"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUPS="$HOME/backups"
SRC="$HOME/bazaimporta-src"
TRACKERS='mc\.yandex|yandex\.ru/metrika|ym\(|vk\.com/rtrg|top-fwz1\.mail\.ru|_tmr|fbq\(|connect\.facebook|gtag\(|googletagmanager|google-analytics'

say()  { printf '\n\033[1;33m== %s\033[0m\n' "$*"; }
ok()   { printf '\033[32mOK\033[0m   %s\n' "$*"; }
bad()  { printf '\033[31mFAIL\033[0m %s\n' "$*"; }
die()  { printf '\033[31mСТОП:\033[0m %s\n' "$*" >&2; exit 1; }

find_docroot() {
  if [ -n "${DOCROOT:-}" ]; then echo "$DOCROOT"; return; fi
  for d in "$HOME/www/bazaimporta.ru" "$HOME/www/bazaimporta.ru/public_html" "$HOME/bazaimporta.ru/public_html" \
           "$HOME/public_html"; do
    [ -f "$d/index.html" ] && { echo "$d"; return; }
    [ -f "$d/frontend/dist/index.html" ] && { echo "$d"; return; }
  done
  echo ""
}

# Где лежит index.html, который реально отдаётся, и какой git-репозиторий его содержит
inspect() {
  DOCROOT="$(find_docroot)"
  [ -n "$DOCROOT" ] || die "не нашёл папку сайта. Запустите: ls -la ~ ~/www ; и повторите с DOCROOT=/путь bash regru.sh check"
  # реальные пути (на reg.ru ~/www часто симлинк), чтобы сравнения папок были честными
  DOCROOT="$(cd "$DOCROOT" && pwd -P)"
  SERVED="$DOCROOT/index.html"
  TOP="$(git -C "$DOCROOT" rev-parse --show-toplevel 2>/dev/null || true)"
  [ -z "$TOP" ] || TOP="$(cd "$TOP" && pwd -P)"
}

cmd_check() {
  inspect
  say "Сервер";      echo "user=$(whoami) host=$(hostname) git=$(git --version 2>/dev/null || echo нет) curl=$(command -v curl || echo нет)"
  say "Папка сайта"; echo "$DOCROOT"; ls -la "$DOCROOT" | head -30
  [ -f "$SERVED" ] || echo "ВНИМАНИЕ: в корне сайта нет index.html (возможно, сайт отдаётся из frontend/dist через .htaccess)"
  say "Git";         if [ -n "$TOP" ]; then
                       echo "репозиторий: $TOP"; git -C "$TOP" remote -v; git -C "$TOP" branch --show-current
                       git -C "$TOP" log --oneline -3; echo "--- незакоммиченное:"; git -C "$TOP" status --short | head -40
                     else echo "папка сайта не в git"; fi
  say "Счётчики и пиксели в текущей главной"
  for f in "$SERVED" "$DOCROOT/frontend/dist/index.html"; do
    [ -f "$f" ] && { echo "[$f]"; grep -oE "($TRACKERS)[^\"' <]{0,40}" "$f" | sort -u || echo "  не найдено"; }
  done
  say "Текущий .htaccess"; cat "$DOCROOT/.htaccess" 2>/dev/null || echo "нет"
  say "Свободное место";    du -sh "$DOCROOT" 2>/dev/null; df -h "$HOME" 2>/dev/null | tail -1
  echo; echo "Ничего не изменено. Если всё выглядит ожидаемо — запускайте: bash regru.sh deploy"
}

backup() {
  mkdir -p "$BACKUPS"
  ARCHIVE="$BACKUPS/bazaimporta-$STAMP.tar.gz"
  local base; base="$TOP"
  [ -n "$base" ] && case "$DOCROOT" in "$base"*) ;; *) base="";; esac
  [ -n "$base" ] || base="$DOCROOT"
  tar czf "$ARCHIVE" -C "$(dirname "$base")" "$(basename "$base")"
  echo "$base" > "$ARCHIVE.path"
  ok "бэкап: $ARCHIVE ($(du -h "$ARCHIVE" | cut -f1)) — папка $base, включая .htaccess и .git"
}

snapshot_prod_changes() {
  [ -n "$TOP" ] || return 0
  if [ -n "$(git -C "$TOP" status --porcelain)" ]; then
    # Снимок через временный индекс: рабочие файлы (то, что сейчас отдаёт сайт) не трогаются
    local b="prod-snapshot-$STAMP" idx tree commit
    idx="$(git -C "$TOP" rev-parse --absolute-git-dir)/index.snapshot-$STAMP"
    GIT_INDEX_FILE="$idx" git -C "$TOP" add -A
    tree="$(GIT_INDEX_FILE="$idx" git -C "$TOP" write-tree)"
    rm -f "$idx"
    commit="$(git -C "$TOP" -c user.name="BAZA deploy" -c user.email="deploy@bazaimporta.ru"       commit-tree "$tree" -p HEAD -m "Снимок правок с прода перед редизайном ($STAMP)")"
    git -C "$TOP" branch "$b" "$commit"
    ok "правки с прода сохранены в локальной ветке $b (и в архиве); файлы сайта не тронуты"
  else
    ok "незакоммиченных правок на проде нет"
  fi
}

cmd_deploy() {
  inspect
  command -v git >/dev/null || die "на сервере нет git"
  say "1/6 Счётчики на текущем сайте"
  local found ym other
  found="$(cat "$SERVED" "$DOCROOT/frontend/dist/index.html" 2>/dev/null | grep -oE "($TRACKERS)[^\"' <]{0,40}" | sort -u || true)"
  ym="$(cat "$SERVED" "$DOCROOT/frontend/dist/index.html" 2>/dev/null | grep -oE "(ym\(\s*|mc\.yandex\.ru/watch/)[0-9]{5,}" | grep -oE "[0-9]{5,}" | head -1 || true)"
  other="$(echo "$found" | grep -vE '^(mc\.yandex|yandex\.ru/metrika|ym\()' | grep -v '^$' || true)"
  echo "${found:-не найдено}"
  [ -z "$other" ] || die "на сайте есть другие пиксели — пришлите этот вывод, перенесу их в новую версию:\n$other"
  [ -n "$ym" ] && ok "Яндекс.Метрика: счётчик $ym — будет перенесён" || echo "Метрика на текущем сайте не найдена"

  say "2/6 Бэкап";                 backup
  if [ -f "$DOCROOT/.htaccess" ]; then
    cp -a "$DOCROOT/.htaccess" "$BACKUPS/htaccess-old-$STAMP"
    echo "старый .htaccess сохранён: $BACKUPS/htaccess-old-$STAMP — его правила (редиректы и т.п.) будут заменены новым:"
    grep -vE '^\s*(#|$)' "$DOCROOT/.htaccess" | sed 's/^/    /' | head -40
  fi
  say "3/6 Правки с прода";        snapshot_prod_changes

  say "4/6 Новая версия ($BRANCH)"
  local dist
  if [ -n "$TOP" ] && [ "$DOCROOT" = "$TOP/frontend/dist" ]; then
    git -C "$TOP" fetch -q origin "$BRANCH"
    # правки прода уже в ветке prod-snapshot-* и в архиве — теперь можно заменить файлы
    git -C "$TOP" checkout -q -f -B "$BRANCH" "origin/$BRANCH"
    dist="$DOCROOT"
    ok "репозиторий $TOP переключён на $BRANCH ($(git -C "$TOP" log --oneline -1))"
  elif [ -z "$TOP" ] || [ "$TOP" != "$DOCROOT" ]; then
    if [ -d "$SRC/.git" ]; then git -C "$SRC" fetch -q origin "$BRANCH" && git -C "$SRC" checkout -q -B "$BRANCH" "origin/$BRANCH"
    else git clone -q --depth 1 --branch "$BRANCH" "$REPO" "$SRC"; fi
    [ -f "$SRC/frontend/dist/index.html" ] || die "в ветке $BRANCH нет frontend/dist"
    cp -a "$SRC/frontend/dist/." "$DOCROOT/"
    dist="$DOCROOT"
    ok "файлы из $SRC/frontend/dist скопированы в $DOCROOT ($(git -C "$SRC" log --oneline -1))"
  else
    die "сайт отдаётся из корня git-репозитория $TOP — нестандартная схема. Пришлите вывод 'bash regru.sh check'"
  fi

  say "5/6 Метрика"
  if [ -n "$ym" ]; then sed -i "s/var ID = 0;/var ID = $ym;/" "$dist/ym.js" && ok "ym.js: счётчик $ym"
  else echo "ym.js без счётчика (ID = 0). Пришлите номер счётчика — подключу."; fi

  say "6/6 Проверка живого сайта"
  verify
  echo; echo "Откат, если что-то не так:  bash $0 rollback $ARCHIVE"
}

verify() {
  local fail=0 code
  for p in / /s-nulya/ /profi/ /dlya-sebya/ /og.jpg /favicon.svg /ym.js /sitemap.xml /robots.txt /oferta.docx; do
    code="$(curl -s -m 20 -o /dev/null -w '%{http_code}' "$SITE$p")"
    [ "$code" = 200 ] && ok "$p → 200" || { bad "$p → $code"; fail=1; }
  done
  code="$(curl -s -m 20 -o /dev/null -w '%{http_code}' "$SITE/net-takoi-stranicy")"; [ "$code" = 404 ] && ok "404 работает" || { bad "404 → $code"; fail=1; }
  for p in /.git/config /.htaccess /.env; do
    code="$(curl -s -m 20 -o /dev/null -w '%{http_code}' "$SITE$p")"
    case "$code" in 403|404) ok "$p закрыт ($code)";; *) bad "$p → $code (должен быть закрыт)"; fail=1;; esac
  done
  local home; home="$(curl -s -m 20 "$SITE/")"
  echo "$home" | grep -q 'https://t.me/bazaimporta"'     && ok "ссылка на канал на месте" || { bad "нет ссылки на канал"; fail=1; }
  echo "$home" | grep -q 'https://t.me/bazaimporta_bot"' && ok "ссылка на бота на месте"  || { bad "нет ссылки на бота"; fail=1; }
  curl -sI -m 20 "$SITE/" | grep -qi '^content-security-policy' && ok "заголовки безопасности (CSP) отдаются" || { bad "нет CSP — mod_headers выключен?"; fail=1; }
  [ "$fail" = 0 ] && printf '\n\033[32mВсё в порядке.\033[0m\n' || printf '\n\033[31mЕсть ошибки — пришлите вывод.\033[0m\n'
}

cmd_rollback() {
  local archive="${1:-}"
  [ -f "$archive" ] || die "укажите архив: ls -1t $BACKUPS/*.tar.gz | head"
  local base; base="$(cat "$archive.path")"
  [ -d "$base" ] || die "в $archive.path неверный путь: $base"
  mv "$base" "$base.failed-$STAMP"
  tar xzf "$archive" -C "$(dirname "$base")"
  ok "восстановлено из $archive. Неудачная версия отложена в $base.failed-$STAMP (удалить вручную, когда убедитесь)"
  local code; code="$(curl -s -m 20 -o /dev/null -w '%{http_code}' "$SITE/")"
  [ "$code" = 200 ] && ok "главная отвечает 200 — прежняя версия на месте" || bad "главная → $code, пришлите вывод"
}

case "${1:-}" in
  check) cmd_check ;;
  deploy) cmd_deploy ;;
  rollback) cmd_rollback "${2:-}" ;;
  verify) verify ;;
  *) echo "usage: bash regru.sh check | deploy | rollback <archive> | verify"; exit 1 ;;
esac
