<?php
// Общее для api/lead.php (приём заявок) и manager/index.php (кабинет заявок).
// Напрямую не открывается: .htaccess отвечает 403 на /api/_*, а здесь — 404 на всякий случай.
declare(strict_types=1);

if (realpath((string) ($_SERVER['SCRIPT_FILENAME'] ?? '')) === __FILE__) {
    http_response_code(404);
    exit;
}

/** Домашняя папка аккаунта: под PHP-FPM переменной HOME может не быть. */
function home_dir(): string
{
    if (function_exists('posix_getpwuid') && function_exists('posix_geteuid')) {
        $pw = posix_getpwuid(posix_geteuid());
        if (!empty($pw['dir'])) return rtrim($pw['dir'], '/');
    }
    foreach ([getenv('HOME'), $_SERVER['HOME'] ?? null] as $h) {
        if (is_string($h) && $h !== '') return rtrim($h, '/');
    }
    // reg.ru: /var/www/<user>/data/www/<домен>/api → /var/www/<user>/data
    $p = realpath(__DIR__) ?: __DIR__;
    $i = strpos($p, '/www/');
    if ($i !== false) return substr($p, 0, $i);
    throw new RuntimeException('home dir not found');
}

/** ~/config/lead-config.php: секреты (BOT_TOKEN, CHAT_ID, ADMIN_PASSWORD_HASH …). Нет файла — пустой массив. */
function lead_config(string $home): array
{
    $f = "$home/config/lead-config.php";
    $cfg = is_file($f) ? require $f : [];
    return is_array($cfg) ? $cfg : [];
}

/** Окно rate limit: файл с метками времени, под flock. true — лимит не превышен. */
function rate_ok(string $dir, string $id, int $limit, int $window): bool
{
    $f = @fopen("$dir/rl-" . hash('sha256', $id) . '.txt', 'c+');
    if (!$f) return true; // не смогли посчитать — не блокируем живого человека
    try {
        if (!flock($f, LOCK_EX)) return true;
        $now = time();
        $hits = array_filter(array_map('intval', explode(',', stream_get_contents($f) ?: '')), fn ($t) => $t > $now - $window);
        if (count($hits) >= $limit) return false;
        $hits[] = $now;
        ftruncate($f, 0);
        rewind($f);
        fwrite($f, implode(',', $hits));
        return true;
    } finally {
        flock($f, LOCK_UN);
        fclose($f);
    }
}

function h(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
