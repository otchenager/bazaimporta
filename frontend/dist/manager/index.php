<?php
// Кабинет заявок: https://bazaimporta.ru/manager/ — закрытая страница для менеджеров.
// Показывает заявки из ~/leads/leads*.csv (пишет api/lead.php), хранит статусы и заметки в ~/leads/status.json,
// удаляет заявку по отзыву согласия (152-ФЗ) с записью в ~/leads/deletions.log, выгружает CSV.
// Вход — по паролю: хеш в ~/config/lead-config.php → ADMIN_PASSWORD_HASH. Без JS: обычные формы, POST → редирект.
// Данные не покидают хостинг reg.ru (РФ); в Telegram уходит только уведомление «новая заявка» со ссылкой сюда.
declare(strict_types=1);

ini_set('display_errors', '0');
ini_set('log_errors', '1');

require __DIR__ . '/../api/_common.php';

const STATUSES = ['new' => 'Новая', 'work' => 'В работе', 'done' => 'Закрыта', 'spam' => 'Спам'];
const DELETE_REASONS = [
    'withdrawn' => 'Отзыв согласия на обработку ПДн',
    'purpose' => 'Цель обработки достигнута / истёк срок хранения',
    'request' => 'Требование субъекта ПДн об уничтожении',
    'junk' => 'Тестовая заявка или спам',
];
const LOGIN_LIMIT = 5;       // попыток входа с одного IP…
const LOGIN_WINDOW = 900;    // …за 15 минут
const IDLE_TIMEOUT = 43200;  // 12 часов без действий — снова пароль
const MAX_SHOWN = 300;

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');
header('Referrer-Policy: no-referrer');
header("Content-Security-Policy: default-src 'none'; style-src 'self'; img-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
header('X-Content-Type-Options: nosniff');

// ——— данные ———

/** Файлы заявок от старых к новым: отложенные leads.until-*.csv (сменился набор колонок), затем текущий leads.csv. */
function lead_files(string $dir): array
{
    $files = glob("$dir/leads.until-*.csv") ?: [];
    sort($files);
    if (is_file("$dir/leads.csv")) $files[] = "$dir/leads.csv";
    return $files;
}

/** Значение из CSV как было введено: lead.php экранирует формулы Excel апострофом. */
function unescape_cell(string $v): string
{
    return preg_match("/^'[=+\\-@]/", $v) ? substr($v, 1) : $v;
}

function excel_safe(string $v): string
{
    return preg_match('/^[=+\-@]/', $v) && !preg_match('/^\+\d+$/', $v) ? "'" . $v : $v;
}

/** @return array{0: array, 1: array} [заголовок, строки] одного файла; строки — как в файле (без снятия экранирования). */
function csv_read_handle($f): array
{
    rewind($f);
    $header = fgetcsv($f, 0, ';') ?: [];
    if (isset($header[0])) $header[0] = preg_replace('/^\xEF\xBB\xBF/', '', (string) $header[0]);
    $rows = [];
    while (($r = fgetcsv($f, 0, ';')) !== false) {
        if ($r === [null]) continue; // пустая строка
        $rows[] = $r;
    }
    return [$header, $rows];
}

/** Все заявки, новые сверху. Каждая — ассоциативный массив по заголовку своего файла. */
function read_leads(string $dir): array
{
    $out = [];
    foreach (lead_files($dir) as $file) {
        $f = @fopen($file, 'r');
        if (!$f) continue;
        flock($f, LOCK_SH);
        [$header, $rows] = csv_read_handle($f);
        flock($f, LOCK_UN);
        fclose($f);
        $n = count($header);
        foreach ($rows as $r) {
            $r = array_map(fn ($v) => unescape_cell((string) $v), array_slice(array_pad($r, $n, ''), 0, $n));
            $out[] = array_combine($header, $r);
        }
    }
    return array_reverse($out);
}

/** Удалить заявку с ключом $key из всех файлов. Переписываем файл на месте под flock — параллельная заявка допишется после. */
function delete_lead(string $dir, string $key): int
{
    $deleted = 0;
    foreach (lead_files($dir) as $file) {
        $f = @fopen($file, 'c+');
        if (!$f) continue;
        try {
            if (!flock($f, LOCK_EX)) continue;
            [$header, $rows] = csv_read_handle($f);
            $i = array_search('key', $header, true);
            if ($i === false) continue;
            $keep = array_values(array_filter($rows, fn ($r) => ($r[$i] ?? '') !== $key));
            if (count($keep) === count($rows)) continue;
            $deleted += count($rows) - count($keep);
            ftruncate($f, 0);
            rewind($f);
            fwrite($f, "\xEF\xBB\xBF");
            fputcsv($f, $header, ';');
            foreach ($keep as $r) fputcsv($f, $r, ';');
            fflush($f);
        } finally {
            flock($f, LOCK_UN);
            fclose($f);
        }
    }
    return $deleted;
}

function status_load(string $file): array
{
    $data = is_file($file) ? json_decode((string) file_get_contents($file), true) : [];
    return is_array($data) ? $data : [];
}

/** Изменить status.json под блокировкой: $fn получает массив и возвращает новый. */
function status_update(string $file, callable $fn): bool
{
    $f = @fopen($file, 'c+');
    if (!$f) return false;
    try {
        if (!flock($f, LOCK_EX)) return false;
        $data = json_decode(stream_get_contents($f) ?: '[]', true);
        $data = $fn(is_array($data) ? $data : []);
        ftruncate($f, 0);
        rewind($f);
        fwrite($f, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
        fflush($f);
        return true;
    } finally {
        flock($f, LOCK_UN);
        fclose($f);
    }
}

function clean_text($v, int $max): string
{
    if (!is_string($v)) return '';
    $v = preg_replace('/[\x00-\x09\x0B-\x1F\x7F]/u', '', $v) ?? '';
    return mb_substr(trim($v), 0, $max);
}

// ——— страница ———

function page(string $title, string $body): void
{
    $css = 'manager.css?v=' . (@filemtime(__DIR__ . '/manager.css') ?: 1);
    echo '<!doctype html><html lang="ru"><head><meta charset="utf-8">'
        . '<meta name="viewport" content="width=device-width, initial-scale=1">'
        . '<meta name="robots" content="noindex, nofollow">'
        . '<title>' . h($title) . ' — BAZA Import</title>'
        . '<link rel="stylesheet" href="' . h($css) . '"></head><body>' . $body . '</body></html>';
    exit;
}

function redirect(string $query = ''): void
{
    header('Location: ./' . ($query !== '' ? '?' . $query : ''), true, 303);
    exit;
}

function flash(string $msg, string $kind = 'ok'): void
{
    $_SESSION['flash'] = [$kind, $msg];
}

function login_page(string $error = '', bool $configured = true): void
{
    $body = '<main class="login"><h1>Заявки BAZA Import</h1>';
    if (!$configured) {
        $body .= '<p class="note">Вход не настроен: в <code>~/config/lead-config.php</code> нет <code>ADMIN_PASSWORD_HASH</code>. '
            . 'Сгенерируйте хеш на сервере: <code>php -r "echo password_hash(\'ваш-пароль\', PASSWORD_DEFAULT), PHP_EOL;"</code> '
            . 'и добавьте строку <code>\'ADMIN_PASSWORD_HASH\' =&gt; \'…\',</code> (шаблон — deploy/lead-config.example.php).</p>';
    } else {
        if ($error !== '') $body .= '<p class="flash err" role="alert">' . h($error) . '</p>';
        $body .= '<form method="post" class="stack"><input type="hidden" name="action" value="login">'
            . '<label for="pw">Пароль</label><input id="pw" name="password" type="password" autocomplete="current-password" required autofocus>'
            . '<button type="submit">Войти</button></form>';
    }
    page('Вход', $body . '</main>');
}

// ——— запуск ———

try {
    $home = home_dir();
    $leadsDir = "$home/leads";
    $stateDir = "$leadsDir/state";
    $sessDir = "$leadsDir/sessions";
    foreach ([$stateDir, $sessDir] as $d) {
        if (!is_dir($d) && !mkdir($d, 0700, true) && !is_dir($d)) throw new RuntimeException("mkdir $d");
    }
} catch (RuntimeException $e) {
    error_log('manager: ' . $e->getMessage());
    http_response_code(500);
    page('Ошибка', '<main class="login"><p class="flash err">Хранилище заявок недоступно. Подробности — в error_log сервера.</p></main>');
}
$cfg = lead_config($home);
$hash = (string) ($cfg['ADMIN_PASSWORD_HASH'] ?? '');
$statusFile = "$leadsDir/status.json";
$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';

// Сессия — отдельная папка, cookie только для /manager/, недоступна JS, не уходит с чужих сайтов
$https = (($_SERVER['HTTPS'] ?? '') !== '' && ($_SERVER['HTTPS'] ?? '') !== 'off') || strtolower($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
session_save_path($sessDir);
session_name('baza_mgr');
ini_set('session.use_strict_mode', '1');
ini_set('session.gc_maxlifetime', (string) IDLE_TIMEOUT);
session_set_cookie_params(['lifetime' => 0, 'path' => '/manager/', 'secure' => $https, 'httponly' => true, 'samesite' => 'Strict']);
session_start();

$authed = !empty($_SESSION['ok']) && time() - (int) ($_SESSION['seen'] ?? 0) < IDLE_TIMEOUT;
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = (string) ($_POST['action'] ?? '');

if ($method === 'POST' && $action === 'login') {
    if ($hash === '') login_page('', false);
    if (!rate_ok($stateDir, 'login|' . $ip, LOGIN_LIMIT, LOGIN_WINDOW)) {
        error_log("manager: login rate limit from $ip");
        login_page('Слишком много попыток. Подождите 15 минут.');
    }
    if (!password_verify((string) ($_POST['password'] ?? ''), $hash)) {
        error_log("manager: wrong password from $ip");
        usleep(700000);
        login_page('Неверный пароль.');
    }
    session_regenerate_id(true);
    $_SESSION = ['ok' => true, 'seen' => time(), 'csrf' => bin2hex(random_bytes(16))];
    redirect();
}

if (!$authed) {
    $_SESSION = [];
    login_page('', $hash !== '');
}
$_SESSION['seen'] = time();
$csrf = (string) ($_SESSION['csrf'] ?? '');

// ——— действия ———
if ($method === 'POST') {
    if ($csrf === '' || !hash_equals($csrf, (string) ($_POST['csrf'] ?? ''))) {
        http_response_code(403);
        page('Ошибка', '<main class="login"><p class="flash err">Форма устарела. <a href="./">Обновите страницу</a> и повторите.</p></main>');
    }
    $back = (string) ($_POST['back'] ?? '');
    $back = preg_match('/^[\w%=&.+-]*$/', $back) ? $back : '';
    $key = clean_text($_POST['key'] ?? '', 64);

    if ($action === 'logout') {
        $_SESSION = [];
        session_destroy();
        redirect();
    }
    if ($action === 'status' && $key !== '') {
        $s = (string) ($_POST['status'] ?? '');
        $note = clean_text($_POST['note'] ?? '', 500);
        if (!isset(STATUSES[$s])) $s = 'new';
        $ok = status_update($statusFile, function ($d) use ($key, $s, $note) {
            $d[$key] = ['s' => $s, 'n' => $note, 't' => date('c')];
            return $d;
        });
        flash($ok ? 'Сохранено' : 'Не удалось сохранить статус', $ok ? 'ok' : 'err');
        redirect($back);
    }
    if ($action === 'delete' && $key !== '') {
        $reason = (string) ($_POST['reason'] ?? '');
        if (!isset(DELETE_REASONS[$reason]) || ($_POST['confirm'] ?? '') !== '1') {
            flash('Удаление не выполнено: выберите основание и подтвердите', 'err');
            redirect('delete=' . rawurlencode($key));
        }
        $n = delete_lead($leadsDir, $key);
        status_update($statusFile, function ($d) use ($key) {
            unset($d[$key]);
            return $d;
        });
        // журнал уничтожения: без персональных данных — только ключ заявки, основание и время
        @file_put_contents("$leadsDir/deletions.log", date('Y-m-d H:i:s') . ";$key;$reason;rows=$n\n", FILE_APPEND | LOCK_EX);
        flash($n > 0
            ? 'Заявка удалена из базы. Удалите и письмо о ней в почтовом ящике, куда приходят заявки, — иначе копия данных останется.'
            : 'Заявка не найдена — возможно, уже удалена', $n > 0 ? 'ok' : 'err');
        redirect($back);
    }
    redirect($back);
}

// ——— выборка ———
$leads = read_leads($leadsDir);
$statuses = status_load($statusFile);
$q = clean_text($_GET['q'] ?? '', 100);
$fStatus = isset(STATUSES[$_GET['status'] ?? '']) ? (string) $_GET['status'] : '';
$hideTests = ($_GET['tests'] ?? '') === 'hide';
$counts = array_fill_keys(array_keys(STATUSES), 0);
$shown = [];
foreach ($leads as $l) {
    $st = $statuses[$l['key'] ?? '']['s'] ?? 'new';
    $counts[$st] = ($counts[$st] ?? 0) + 1;
    if ($fStatus !== '' && $st !== $fStatus) continue;
    if ($hideTests && ($l['test'] ?? '') === '1') continue;
    if ($q !== '') {
        $hay = mb_strtolower(implode(' ', [$l['name'] ?? '', $l['phone'] ?? '', $l['car'] ?? '', $l['track'] ?? '']));
        $qq = mb_strtolower($q);
        $digits = preg_replace('/\D+/', '', $q);
        if (!str_contains($hay, $qq) && !($digits !== '' && strlen($digits) >= 3 && str_contains(preg_replace('/\D+/', '', $l['phone'] ?? ''), $digits))) continue;
    }
    $shown[] = $l;
}
$query = http_build_query(array_filter(['q' => $q, 'status' => $fStatus, 'tests' => $hideTests ? 'hide' : '']));

// выгрузка CSV — то, что сейчас отфильтровано
if (($_GET['export'] ?? '') === '1') {
    $cols = [];
    foreach ($shown as $l) foreach (array_keys($l) as $k) $cols[$k] = true;
    $cols = array_keys($cols);
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="leads-' . date('Ymd-His') . '.csv"');
    $out = fopen('php://output', 'w');
    fwrite($out, "\xEF\xBB\xBF");
    fputcsv($out, array_merge($cols, ['status', 'note']), ';');
    foreach ($shown as $l) {
        $st = $statuses[$l['key'] ?? ''] ?? [];
        $row = array_map(fn ($c) => excel_safe((string) ($l[$c] ?? '')), $cols);
        fputcsv($out, array_merge($row, [STATUSES[$st['s'] ?? 'new'] ?? '', excel_safe((string) ($st['n'] ?? ''))]), ';');
    }
    exit;
}

$flash = $_SESSION['flash'] ?? null;
unset($_SESSION['flash']);
$csrfField = '<input type="hidden" name="csrf" value="' . h($csrf) . '">';
$backField = '<input type="hidden" name="back" value="' . h($query) . '">';

function lead_date(array $l): string
{
    $t = DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $l['time_msk'] ?? '');
    return $t ? $t->format('d.m.Y H:i') : ($l['time_msk'] ?? '');
}

function lead_summary(array $l): string
{
    $phone = $l['phone'] ?? '';
    return '<p class="who"><b>' . h($l['name'] ?? '—') . '</b> · <a href="tel:' . h($phone) . '">' . h($phone) . '</a></p>'
        . '<p class="meta">' . h(lead_date($l)) . ' МСК · ' . h($l['track'] ?? '') . (($l['test'] ?? '') === '1' ? ' · <span class="tag">ТЕСТ</span>' : '') . '</p>';
}

// подтверждение удаления
if (isset($_GET['delete'])) {
    $key = clean_text($_GET['delete'], 64);
    $lead = null;
    foreach ($leads as $l) if (($l['key'] ?? '') === $key) $lead = $l;
    $body = '<main class="wrap narrow"><p><a href="./">← Все заявки</a></p><h1>Удалить заявку</h1>';
    if ($flash) $body .= '<p class="flash ' . h($flash[0]) . '" role="alert">' . h($flash[1]) . '</p>';
    if (!$lead) {
        $body .= '<p class="flash err">Заявка не найдена.</p>';
    } else {
        $opts = '';
        foreach (DELETE_REASONS as $k => $v) $opts .= '<option value="' . h($k) . '">' . h($v) . '</option>';
        $body .= '<div class="card">' . lead_summary($lead) . '</div>'
            . '<p>Заявка будет удалена из базы безвозвратно. В журнал уничтожения запишутся только время, ключ заявки и основание — без имени и телефона.</p>'
            . '<form method="post" class="stack">' . $csrfField . '<input type="hidden" name="action" value="delete"><input type="hidden" name="key" value="' . h($key) . '">'
            . '<label for="reason">Основание</label><select id="reason" name="reason" required><option value="">— выберите —</option>' . $opts . '</select>'
            . '<label class="check"><input type="checkbox" name="confirm" value="1" required> Подтверждаю удаление</label>'
            . '<button type="submit" class="danger">Удалить навсегда</button></form>';
    }
    page('Удалить заявку', $body . '</main>');
}

// список
$nav = '<a class="chip' . ($fStatus === '' ? ' on' : '') . '" href="./?' . h(http_build_query(array_filter(['q' => $q, 'tests' => $hideTests ? 'hide' : '']))) . '">Все <span>' . count($leads) . '</span></a>';
foreach (STATUSES as $k => $v) {
    $nav .= '<a class="chip' . ($fStatus === $k ? ' on' : '') . '" href="./?' . h(http_build_query(array_filter(['q' => $q, 'status' => $k, 'tests' => $hideTests ? 'hide' : '']))) . '">' . h($v) . ' <span>' . $counts[$k] . '</span></a>';
}

$body = '<header class="top"><div class="wrap row"><h1>Заявки</h1><form method="post">' . $csrfField
    . '<input type="hidden" name="action" value="logout"><button type="submit" class="ghost">Выйти</button></form></div></header>'
    . '<main class="wrap">';
if ($flash) $body .= '<p class="flash ' . h($flash[0]) . '" role="status">' . h($flash[1]) . '</p>';
$body .= '<form method="get" class="filters">'
    . ($fStatus !== '' ? '<input type="hidden" name="status" value="' . h($fStatus) . '">' : '')
    . '<input type="search" name="q" value="' . h($q) . '" placeholder="Имя, телефон, машина" aria-label="Поиск">'
    . '<label class="check"><input type="checkbox" name="tests" value="hide"' . ($hideTests ? ' checked' : '') . '> Скрыть тестовые</label>'
    . '<button type="submit">Найти</button>'
    . '<a class="btn ghost" href="./?' . h($query . ($query !== '' ? '&' : '') . 'export=1') . '">Скачать CSV</a></form>'
    . '<nav class="chips" aria-label="Статус">' . $nav . '</nav>';

if (!$shown) {
    $body .= '<p class="empty">' . ($leads ? 'Ничего не найдено.' : 'Заявок пока нет.') . '</p>';
}
foreach (array_slice($shown, 0, MAX_SHOWN) as $l) {
    $key = (string) ($l['key'] ?? '');
    $st = $statuses[$key] ?? ['s' => 'new', 'n' => ''];
    $opts = '';
    foreach (STATUSES as $k => $v) $opts .= '<option value="' . h($k) . '"' . (($st['s'] ?? 'new') === $k ? ' selected' : '') . '>' . h($v) . '</option>';
    $utm = array_filter([$l['utm_source'] ?? '', $l['utm_campaign'] ?? '', $l['utm_content'] ?? '', $l['utm_term'] ?? '']);
    $details = array_filter([
        ($l['car'] ?? '') !== '' ? 'Ищет: ' . $l['car'] : null,
        'Страница: ' . (($l['page'] ?? '') !== '' ? $l['page'] : '—'),
        $utm ? 'Источник: ' . implode(' / ', $utm) . (($l['yclid'] ?? '') !== '' ? ' (Директ)' : '') : null,
        'Реклама: ' . (($l['ads_consent'] ?? '') === '1' ? 'согласие есть' : 'согласия нет — только ответ по заявке'),
    ]);
    $consent = isset($l['consent_pd'])
        ? 'Согласие на ПДн: да, редакция ' . (($l['consent_version'] ?? '') ?: '—') . ', IP ' . ($l['consent_ip'] ?? '—')
            . (($l['ads_consent'] ?? '') === '1' ? '; на рекламу — редакция ' . (($l['ads_version'] ?? '') ?: '—') : '')
        : 'Заявка до логирования согласия (версия и IP не записывались)';
    $body .= '<article class="card st-' . h($st['s'] ?? 'new') . '">' . lead_summary($l)
        . '<ul class="details">' . implode('', array_map(fn ($d) => '<li>' . h($d) . '</li>', $details)) . '</ul>'
        . '<details><summary>Доказательство согласия</summary><p class="meta">' . h($consent) . '</p></details>';
    if ($key !== '') {
        $body .= '<form method="post" class="status">' . $csrfField . $backField
            . '<input type="hidden" name="action" value="status"><input type="hidden" name="key" value="' . h($key) . '">'
            . '<select name="status" aria-label="Статус">' . $opts . '</select>'
            . '<input name="note" maxlength="500" value="' . h((string) ($st['n'] ?? '')) . '" placeholder="Заметка" aria-label="Заметка">'
            . '<button type="submit">Сохранить</button></form>'
            . '<p class="del"><a href="./?delete=' . h(rawurlencode($key)) . '">Удалить по отзыву согласия…</a></p>';
    }
    $body .= '</article>';
}
if (count($shown) > MAX_SHOWN) $body .= '<p class="empty">Показаны ' . MAX_SHOWN . ' из ' . count($shown) . '. Уточните поиск или скачайте CSV.</p>';

page('Заявки', $body . '</main>');
