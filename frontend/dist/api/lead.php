<?php
// Заявка с лид-формы (src/components/LeadForm.jsx) → CSV-лог + уведомление в Telegram.
// Секреты и данные — вне веб-корня, в домашней папке:
//   ~/config/lead-config.php  — BOT_TOKEN и CHAT_ID (шаблон: deploy/lead-config.example.php)
//   ~/leads/leads.csv         — каждая заявка, даже если Telegram недоступен
//   ~/leads/state/            — счётчики rate limit и ключи идемпотентности
// Порядок: проверки → запись в CSV → ответ клиенту → Telegram (после ответа, если PHP-FPM это умеет).
// PHP 7.4+. Наружу уходит только {ok:true} или {ok:false, error:<код>}; подробности — в error_log сервера.
declare(strict_types=1);

// предупреждения PHP — только в error_log, никогда в ответ клиенту
ini_set('display_errors', '0');
ini_set('log_errors', '1');

const TRACKS = ['newbie' => 'С нуля', 'experienced' => 'Есть опыт', 'personal' => 'Для себя'];
const MIN_FILL_MS = 3000;          // быстрее человек форму не заполнит
const RATE_LIMIT = 5;              // заявок с одного IP…
const RATE_WINDOW = 600;           // …за 10 минут
const IDEMPOTENCY_TTL = 86400;     // повтор с тем же ключом сутки не создаёт новую заявку
const MAX_BODY = 8192;
const TELEGRAM_TIMEOUT = 6;        // секунд на весь запрос к Bot API
// Письмо о каждой заявке. В ~/config/lead-config.php можно переопределить MAIL_TO / MAIL_FROM.
// MAIL_FROM — адрес на домене сайта: письма «от» чужого домена Яндекс отправляет в спам.
const MAIL_TO = 'kirill.malin0vsky@yandex.ru';
const MAIL_FROM = 'noreply@bazaimporta.ru';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

function respond(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
}

function fail(int $status, string $code): void
{
    respond($status, ['ok' => false, 'error' => $code]);
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

function clean($v, int $max): string
{
    if (!is_string($v)) return '';
    // управляющие символы (кроме перевода строки) и лишние пробелы
    $v = preg_replace('/[\x00-\x09\x0B-\x1F\x7F]/u', '', $v) ?? '';
    $v = trim(preg_replace('/[ \t]+/u', ' ', $v) ?? '');
    return mb_substr($v, 0, $max);
}

/** Телефон РФ/КЗ/BY/AM → E.164 или null. */
function normalize_phone(string $raw): ?string
{
    $d = preg_replace('/\D+/', '', $raw) ?? '';
    if (strlen($d) === 11 && $d[0] === '8') $d = '7' . substr($d, 1);   // 8 (9xx) … → +7
    if (strlen($d) === 10 && $d[0] === '9') $d = '7' . $d;               // 9xx… без кода
    // +7: Россия (3,4,8,9) и Казахстан (6,7 → +77…); +375 Беларусь; +374 Армения
    if (preg_match('/^7[3-9]\d{9}$/', $d)) return '+' . $d;
    if (preg_match('/^375(25|29|33|44|17|15|16|21|22|23)\d{7}$/', $d)) return '+' . $d;
    if (preg_match('/^374\d{8}$/', $d)) return '+' . $d;
    return null;
}

/** Окно rate limit по IP: файл с метками времени, под flock. true — лимит не превышен. */
function rate_ok(string $dir, string $ip): bool
{
    $f = @fopen("$dir/rl-" . hash('sha256', $ip) . '.txt', 'c+');
    if (!$f) return true; // не смогли посчитать — не блокируем живого человека
    try {
        if (!flock($f, LOCK_EX)) return true;
        $now = time();
        $hits = array_filter(array_map('intval', explode(',', stream_get_contents($f) ?: '')), fn ($t) => $t > $now - RATE_WINDOW);
        if (count($hits) >= RATE_LIMIT) return false;
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

/** Ключ идемпотентности уже встречался (и ещё не протух)? Иначе — запомнить. */
function seen_before(string $dir, string $key): bool
{
    $path = "$dir/idem-" . hash('sha256', $key);
    if (is_file($path) && filemtime($path) > time() - IDEMPOTENCY_TTL) return true;
    // x — атомарно: из двух одновременных запросов файл создаст только один
    $f = @fopen($path, 'x');
    if ($f === false) return is_file($path);
    fclose($f);
    return false;
}

/** Редкая уборка протухших файлов состояния, чтобы папка не росла. */
function gc_state(string $dir): void
{
    if (random_int(1, 50) !== 1) return;
    $limit = time() - max(RATE_WINDOW, IDEMPOTENCY_TTL);
    foreach (glob("$dir/*") ?: [] as $p) {
        if (@filemtime($p) < $limit) @unlink($p);
    }
}

function csv_append(string $file, array $row): bool
{
    $new = !is_file($file);
    $f = @fopen($file, 'a');
    if (!$f) return false;
    try {
        if (!flock($f, LOCK_EX)) return false;
        if ($new) {
            fwrite($f, "\xEF\xBB\xBF"); // BOM: Excel открывает кириллицу без танцев
            fputcsv($f, array_keys($row), ';');
        }
        // формулы в Excel не выполняем: значение, начинающееся с = + - @, экранируем апострофом
        $safe = array_map(fn ($v) => preg_match('/^[=+\-@]/', (string) $v) && !preg_match('/^\+\d+$/', (string) $v) ? "'" . $v : $v, $row);
        $ok = fputcsv($f, $safe, ';') !== false;
        fflush($f);
        return $ok;
    } finally {
        flock($f, LOCK_UN);
        fclose($f);
    }
}

function h(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** Письмо в UTF-8 через mail() хостинга (sendmail reg.ru). Тема и имя отправителя — в base64 (RFC 2047). */
function send_mail(string $to, string $from, string $subject, string $body, $logFile = null): bool
{
    $enc = fn (string $s) => '=?UTF-8?B?' . base64_encode($s) . '?=';
    $headers = [
        'From: ' . $enc('BAZA Import — заявки') . " <$from>",
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        'X-Mailer: bazaimporta-lead',
    ];
    $payload = chunk_split(base64_encode($body));
    if (is_string($logFile) && $logFile !== '') {
        return @file_put_contents($logFile, json_encode(['to' => $to, 'subject' => $subject, 'body' => $body, 'headers' => $headers], JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX) !== false;
    }
    // -f — адрес возврата (envelope sender) на своём домене, иначе часть почтовиков режет письмо
    $ok = @mail($to, $enc($subject), $payload, implode("\r\n", $headers), '-f' . $from);
    if (!$ok) error_log('lead: mail() failed');
    return $ok;
}

function telegram_send(string $base, string $token, string $chatId, string $html): bool
{
    $url = rtrim($base, '/') . '/bot' . $token . '/sendMessage';
    $payload = json_encode(['chat_id' => $chatId, 'text' => $html, 'parse_mode' => 'HTML', 'disable_web_page_preview' => true], JSON_UNESCAPED_UNICODE);
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_TIMEOUT => TELEGRAM_TIMEOUT,
        ]);
        $res = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
    } else {
        $ctx = stream_context_create(['http' => [
            'method' => 'POST', 'header' => "Content-Type: application/json\r\n", 'content' => $payload,
            'timeout' => TELEGRAM_TIMEOUT, 'ignore_errors' => true,
        ]]);
        $res = @file_get_contents($url, false, $ctx);
        $code = preg_match('#^HTTP/\S+ (\d+)#', $http_response_header[0] ?? '', $m) ? (int) $m[1] : 0;
    }
    if ($code !== 200) {
        // в лог — код и описание от Telegram, без токена
        $desc = is_string($res) ? (json_decode($res, true)['description'] ?? '') : 'no response';
        error_log("lead: telegram HTTP $code $desc");
        return false;
    }
    return true;
}

// ——— запрос ———
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    fail(405, 'method');
}
if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== 0) fail(415, 'content_type');
// чужой сайт не отправит заявку из браузера пользователя
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$host = strtolower(preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? ''));
if ($origin !== '' && strtolower((string) parse_url($origin, PHP_URL_HOST)) !== $host) fail(403, 'origin');

$raw = file_get_contents('php://input', false, null, 0, MAX_BODY + 1);
if ($raw === false || strlen($raw) > MAX_BODY) fail(413, 'too_large');
$in = json_decode($raw, true);
if (!is_array($in)) fail(400, 'bad_json');

// антиспам: honeypot и время заполнения. Боту отвечаем как человеку — пусть не подбирает обход.
$spam = clean($in['website'] ?? '', 200) !== '' || !is_int($in['elapsed'] ?? null) || $in['elapsed'] < MIN_FILL_MS;

$name = clean($in['name'] ?? '', 60);
$phone = normalize_phone(clean($in['phone'] ?? '', 32));
$track = is_string($in['track'] ?? null) && isset(TRACKS[$in['track']]) ? $in['track'] : null;
$car = $track === 'personal' ? clean($in['car'] ?? '', 120) : '';
$page = clean($in['page'] ?? '', 200);
$key = clean($in['key'] ?? '', 64);
$consent = ($in['consent'] ?? false) === true;
$utm = [];
$utmIn = is_array($in['utm'] ?? null) ? $in['utm'] : [];
foreach (['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'yclid'] as $k) {
    $utm[$k] = clean($utmIn[$k] ?? '', 200);
}

$errors = [];
if (mb_strlen($name) < 2 || !preg_match('/\p{L}/u', $name)) $errors[] = 'name';
if ($phone === null) $errors[] = 'phone';
if ($track === null) $errors[] = 'track';
if (!$consent) $errors[] = 'consent';
if (!preg_match('/^[A-Za-z0-9-]{8,64}$/', $key)) $errors[] = 'key';
if ($errors) fail(422, 'invalid:' . implode(',', $errors));

try {
    $home = home_dir();
    $leadsDir = "$home/leads";
    $stateDir = "$leadsDir/state";
    if (!is_dir($stateDir) && !mkdir($stateDir, 0700, true) && !is_dir($stateDir)) throw new RuntimeException("mkdir $stateDir");

    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    if (!rate_ok($stateDir, $ip)) fail(429, 'rate_limited');
    if ($spam) {
        error_log('lead: spam rejected (honeypot/timing) from ' . $ip);
        respond(200, ['ok' => true]);
        exit;
    }
    $idemFile = "$stateDir/idem-" . hash('sha256', $key);
    if (seen_before($stateDir, $key)) {
        respond(200, ['ok' => true, 'duplicate' => true]);
        exit;
    }
    gc_state($stateDir);

    $now = new DateTimeImmutable('now', new DateTimeZone('Europe/Moscow'));
    // тестовая заявка — отдельное слово «ТЕСТ» в имени (фамилия «Тестов» не считается)
    $isTest = preg_match('/(^|[^\p{L}])тест([^\p{L}]|$)/iu', $name) === 1;
    $row = [
        'time_msk' => $now->format('Y-m-d H:i:s'),
        'name' => $name,
        'phone' => $phone,
        'track' => TRACKS[$track],
        'car' => $car,
        'page' => $page,
    ] + $utm + ['key' => $key, 'test' => $isTest ? '1' : ''];

    if (!csv_append("$leadsDir/leads.csv", $row)) {
        // заявка не сохранена — ключ освобождаем, чтобы повтор с клиента её всё-таки записал
        @unlink($idemFile);
        throw new RuntimeException('csv write failed');
    }
} catch (RuntimeException $e) {
    error_log('lead: ' . $e->getMessage());
    fail(500, 'server');
}

// Заявка сохранена — отвечаем сразу, письмо и Telegram досылаем после ответа
respond(200, ['ok' => true]);
if (function_exists('fastcgi_finish_request')) fastcgi_finish_request();

$cfgFile = "$home/config/lead-config.php";
$cfg = is_file($cfgFile) ? require $cfgFile : [];
if (!is_array($cfg)) $cfg = [];

// ——— письмо ———
$mailTo = (string) ($cfg['MAIL_TO'] ?? MAIL_TO);
if ($mailTo !== '') {
    $subject = ($isTest ? '[ТЕСТ] ' : '') . 'Заявка с сайта: ' . $name . ', ' . TRACKS[$track];
    $body = implode("\n", array_filter([
        'Новая заявка с сайта bazaimporta.ru',
        '',
        'Имя: ' . $name,
        'Телефон: ' . $phone,
        'Трек: ' . TRACKS[$track],
        $car !== '' ? 'Ищет: ' . $car : null,
        'Страница: ' . ($page !== '' ? $page : '—'),
        array_filter($utm) ? 'Метки: ' . implode(', ', array_map(fn ($k, $v) => "$k=$v", array_keys(array_filter($utm)), array_filter($utm))) : null,
        'Время: ' . $now->format('d.m.Y H:i') . ' МСК',
    ], fn ($l) => $l !== null));
    // MAIL_LOG — только для локальных тестов: письмо пишется в файл вместо отправки
    if (!send_mail($mailTo, (string) ($cfg['MAIL_FROM'] ?? MAIL_FROM), $subject, $body, $cfg['MAIL_LOG'] ?? null)) {
        @file_put_contents("$leadsDir/mail-failed.log", $row['time_msk'] . ';' . $key . "\n", FILE_APPEND | LOCK_EX);
    }
}

// ——— Telegram ———
if (empty($cfg['BOT_TOKEN']) || empty($cfg['CHAT_ID'])) {
    error_log("lead: no telegram config at $cfgFile — Telegram skipped");
    exit;
}

$utmLine = implode(' · ', array_map(fn ($k, $v) => h("$k=$v"), array_keys(array_filter($utm)), array_filter($utm)));
$lines = [
    ($isTest ? '🧪 <b>ТЕСТ</b> · ' : '') . '<b>Новая заявка с сайта</b>',
    '',
    '👤 ' . h($name),
    '📞 <a href="tel:' . h($phone) . '">' . h($phone) . '</a>',
    '🛣 Трек: ' . h(TRACKS[$track]),
];
if ($car !== '') $lines[] = '🚗 Ищет: ' . h($car);
$lines[] = '📄 Страница: ' . h($page !== '' ? $page : '—');
if ($utmLine !== '') $lines[] = '🏷 ' . $utmLine;
$lines[] = '🕒 ' . $now->format('d.m.Y H:i') . ' МСК';

// API_BASE — только для локальных тестов с заглушкой Bot API
if (!telegram_send((string) ($cfg['API_BASE'] ?? 'https://api.telegram.org'), (string) $cfg['BOT_TOKEN'], (string) $cfg['CHAT_ID'], implode("\n", $lines))) {
    // заявка уже в CSV; отметка для того, кто будет разбирать лог
    @file_put_contents("$leadsDir/telegram-failed.log", $row['time_msk'] . ';' . $key . "\n", FILE_APPEND | LOCK_EX);
}
