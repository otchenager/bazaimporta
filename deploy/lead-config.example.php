<?php
// Шаблон. На сервере файл лежит ВНЕ веб-корня: ~/config/lead-config.php (права 600).
// Его читает frontend/public/api/lead.php. В git и в dist настоящий файл не попадает.
//   mkdir -p ~/config && chmod 700 ~/config
//   nano ~/config/lead-config.php   (вставить содержимое ниже со своими значениями)
//   chmod 600 ~/config/lead-config.php
return [
    // токен бота от @BotFather; бот должен быть участником чата/канала CHAT_ID
    'BOT_TOKEN' => '123456789:AA...',
    // id чата для заявок: личка (число), группа (-100…) или @username канала
    'CHAT_ID' => '-1001234567890',
];
