# Юридические документы лендинга — откуда данные

<!-- ТРЕБУЕТ ПРОВЕРКИ ЮРИСТОМ -->

С 30.10.2026 документы лендинга **совпадают с документами веб-приложения** app.bazaimporta.ru
(репозиторий github.com/valexer3/bazaimporta-app). Плейсхолдеров нет: `node scripts/check-copy.mjs --release` их не находит.

| Что | Лендинг | Приложение |
|---|---|---|
| Тексты политики, согласий, соглашения, оферты, cookie | `frontend/src/legal/texts.js` — копия | `web/src/legal/texts.js` |
| Реквизиты: ИП, ИНН, ОГРНИП, адрес, почта, телефон | `frontend/src/legal/requisites.js` → `REQUISITES` | `web/src/legal.js` → `REQUISITES` |
| Дата редакции | `requisites.js` → `EDITION` | `texts.js` → `EDITION` |
| Версии согласий | `requisites.js` → `VERSIONS` | `server/src/legal.js` → `LEGAL_VERSIONS` |

## Как обновлять

1. Правки вносятся в приложении.
2. `web/src/legal/texts.js` копируется в `frontend/src/legal/texts.js` целиком; меняются только строка `import` (на `./requisites.js`)
   и убирается `EDITION` (он в `requisites.js`). Реквизиты, `EDITION` и `VERSIONS` переносятся руками.
3. `frontend/src/legal/documents.js` сам меняет ссылки `/legal/…` на адреса лендинга (`/privacy/`, `/oferta/` …) и дополняет политику
   cookie тем, что есть только на лендинге (Вебвизор, `baza_utm`). Если при обновлении нужный фрагмент пропадёт, сборка упадёт с подсказкой.

## Отличия лендинга (только домены и сам лендинг)

- адреса документов: `bazaimporta.ru/privacy/` вместо `app.bazaimporta.ru/legal/privacy` и т. д.;
- политика cookie: на лендинге Метрика работает с Вебвизором (`_ym_visorc`), есть `baza_utm` в sessionStorage;
- страница `/rekvizity/` — только на лендинге, данные те же, что в разделе 12 оферты.

Cookie согласия `consent` — общая: на *.bazaimporta.ru ставится на `.bazaimporta.ru`, версия `VERSIONS.cookies` = `LEGAL_VERSIONS.cookies`.

## Телефон

Номер `+7 (985) 526-69-61` есть только в тексте документов (как в приложении). Кнопок, ссылок `tel:` и номера в шапке и подвале нет.
