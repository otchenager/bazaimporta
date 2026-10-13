<?php
// Шаблон. На сервере файл лежит ВНЕ веб-корня: ~/config/lead-config.php (права 600).
// Его читают frontend/public/api/lead.php (приём заявок) и frontend/public/manager/index.php (кабинет заявок).
// В git и в dist настоящий файл не попадает.
//   mkdir -p ~/config && chmod 700 ~/config
//   nano ~/config/lead-config.php   (вставить содержимое ниже со своими значениями)
//   chmod 600 ~/config/lead-config.php
return [
    // Пароль кабинета https://bazaimporta.ru/manager/ — хранится только хеш. Сгенерировать на сервере:
    //   php -r "echo password_hash('придумайте-длинный-пароль', PASSWORD_DEFAULT), PHP_EOL;"
    // Хеш вставлять в ОДИНАРНЫХ кавычках: в нём есть символы $.
    'ADMIN_PASSWORD_HASH' => '$2y$10$...',

    // Уведомления «новая заявка» в Telegram (без имени и телефона — только трек, время и ссылка на кабинет).
    // BOT_TOKEN — бот от @BotFather (отдельный бот для уведомлений, не Борис).
    // CHAT_ID — id личного чата @visagevvvv: он открывает бота и жмёт «Start», затем в браузере
    //   https://api.telegram.org/bot<BOT_TOKEN>/getUpdates → "chat":{"id":123456789,...} — это число и есть CHAT_ID.
    'BOT_TOKEN' => '123456789:AA...',
    'CHAT_ID' => '123456789',

    // необязательно: письмо о заявке. По умолчанию — kirill.malin0vsky@yandex.ru от noreply@bazaimporta.ru
    // 'MAIL_TO' => 'kirill.malin0vsky@yandex.ru',
    // 'MAIL_FROM' => 'noreply@bazaimporta.ru',
    // необязательно: ссылка на кабинет в уведомлении
    // 'MANAGER_URL' => 'https://bazaimporta.ru/manager/',
];
