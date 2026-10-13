// e2e обработчика заявок: php -S с public/ как веб-корнем + заглушка Bot API.
//   PHP_BIN=путь/к/php node --test tests/lead-api.test.mjs
import { test, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import http from 'node:http'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const PHP = process.env.PHP_BIN || 'php'
const PORT = 8791
const BASE = `http://127.0.0.1:${PORT}`
const home = fs.mkdtempSync(path.join(os.tmpdir(), 'lead-home-'))
const sent = []
let tg, php

before(async () => {
  tg = http.createServer((req, res) => {
    let b = ''
    req.on('data', (c) => (b += c))
    req.on('end', () => {
      sent.push({ url: req.url, body: JSON.parse(b) })
      res.writeHead(200, { 'Content-Type': 'application/json' }).end('{"ok":true}')
    })
  })
  await new Promise((r) => tg.listen(0, '127.0.0.1', r))
  fs.mkdirSync(path.join(home, 'config'))
  fs.writeFileSync(
    path.join(home, 'config/lead-config.php'),
    `<?php return ['ADMIN_PASSWORD_HASH' => '${spawnSync(PHP, ['-r', "echo password_hash('верный-пароль', PASSWORD_DEFAULT);"]).stdout.toString()}', 'BOT_TOKEN' => 'TEST:TOKEN', 'CHAT_ID' => '42', 'API_BASE' => 'http://127.0.0.1:${tg.address().port}', 'MAIL_LOG' => ${JSON.stringify(path.join(home, 'mail.log'))}];`,
  )
  php = spawn(PHP, ['-S', `127.0.0.1:${PORT}`, '-t', path.join(root, 'public')], { env: { ...process.env, HOME: home }, stdio: 'ignore' })
  for (let i = 0; i < 50; i++) {
    try {
      await fetch(BASE + '/api/lead.php')
      return
    } catch {
      await new Promise((r) => setTimeout(r, 100))
    }
  }
  throw new Error('php -S не поднялся')
})

after(() => {
  php?.kill()
  tg?.close()
  fs.rmSync(home, { recursive: true, force: true })
})

let n = 0
const valid = (over = {}) => ({
  name: 'Тест Иван',
  phone: '+7 (912) 345-67-89',
  track: 'personal',
  car: 'Hyundai Palisade <b>',
  page: '/dlya-sebya/',
  consent: true,
  elapsed: 5000,
  website: '',
  key: `k-${Date.now()}-${n++}`,
  utm: { utm_source: 'yandex', utm_campaign: 'search', yclid: '123' },
  ...over,
})
// все запросы идут с 127.0.0.1: счётчик rate limit сбрасываем перед каждым тестом, чтобы тесты не задевали друг друга
beforeEach(() => {
  const dir = path.join(home, 'leads/state')
  if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir)) if (f.startsWith('rl-')) fs.rmSync(path.join(dir, f))
})
const post = (body, headers = {}) =>
  fetch(BASE + '/api/lead.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
const csv = () => {
  const f = path.join(home, 'leads/leads.csv')
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').trim().split('\n').slice(1) : []
}
const waitSent = async (count) => {
  for (let i = 0; i < 40 && sent.length < count; i++) await new Promise((r) => setTimeout(r, 50))
}

test('GET не раскрывает ничего: 405 и код ошибки', async () => {
  const r = await fetch(BASE + '/api/lead.php')
  assert.equal(r.status, 405)
  assert.deepEqual(await r.json(), { ok: false, error: 'method' })
})

test('не JSON → 415', async () => {
  const r = await fetch(BASE + '/api/lead.php', { method: 'POST', body: 'name=x', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
  assert.equal(r.status, 415)
})

test('валидная заявка → ok, CSV; в Telegram — только уведомление без персональных данных', async () => {
  const before = csv().length
  const r = await post(valid())
  assert.equal(r.status, 200)
  assert.deepEqual(await r.json(), { ok: true })
  assert.equal(csv().length, before + 1)
  assert.match(csv().at(-1), /\+79123456789/)
  await waitSent(1)
  const msg = sent.at(-1)
  assert.equal(msg.url, '/botTEST:TOKEN/sendMessage')
  assert.equal(msg.body.parse_mode, 'HTML')
  for (const pd of ['79123456789', 'Иван', 'Hyundai', 'utm_source', 'yandex']) assert.ok(!msg.body.text.includes(pd), `в Telegram нет «${pd}»`)
  assert.match(msg.body.text, /Новая заявка/)
  assert.match(msg.body.text, /Трек: Для себя/)
  assert.match(msg.body.text, /<a href="https:\/\/bazaimporta\.ru\/manager\/">/)
  assert.match(msg.body.text, /ТЕСТ/)
  assert.match(msg.body.text, /МСК/)
})

test('пустое имя и плохой телефон → 422 без записи', async () => {
  const before = csv().length
  const r = await post(valid({ name: '', phone: '+7 (123)' }))
  assert.equal(r.status, 422)
  const j = await r.json()
  assert.equal(j.ok, false)
  assert.match(j.error, /name/)
  assert.match(j.error, /phone/)
  assert.equal(csv().length, before)
})

test('трек не из белого списка и без согласия → 422', async () => {
  const r = await post(valid({ track: 'admin', consent: false }))
  assert.equal(r.status, 422)
  assert.match((await r.json()).error, /track.*consent/)
})

test('телефоны СНГ нормализуются', async () => {
  for (const [phone, e164] of [
    ['8 912 345 67 89', '+79123456789'],
    ['+7 (701) 234-56-78', '+77012345678'],
    ['+375 (29) 123-45-67', '+375291234567'],
    ['+374 (91) 23-45-67', '+37491234567'],
  ]) {
    const r = await post(valid({ phone, name: 'Пётр' }))
    assert.equal(r.status, 200, phone)
    assert.ok(csv().at(-1).includes(`;${e164};`), phone)
  }
})

test('honeypot и слишком быстрая отправка → тихий отказ: ok для бота, но ни CSV, ни Telegram', async () => {
  const [c, s] = [csv().length, sent.length]
  for (const body of [valid({ website: 'http://spam' }), valid({ elapsed: 800 }), valid({ elapsed: undefined })]) {
    const r = await post(body)
    assert.equal(r.status, 200)
  }
  await new Promise((r) => setTimeout(r, 300))
  assert.equal(csv().length, c)
  assert.equal(sent.length, s)
})

test('повтор с тем же ключом (двойной клик) → одна заявка', async () => {
  const body = valid({ name: 'Двойной' })
  const c = csv().length
  const [a, b] = await Promise.all([post(body), post(body)])
  assert.equal(a.status, 200)
  assert.equal(b.status, 200)
  assert.equal(csv().length, c + 1)
})

test('rate limit: 6-я заявка за 10 минут с одного IP → 429', async () => {
  const codes = []
  for (let i = 0; i < 6; i++) codes.push((await post(valid({ name: 'Лимит' }))).status)
  assert.deepEqual(codes, [200, 200, 200, 200, 200, 429])
  assert.deepEqual(await (await post(valid())).json(), { ok: false, error: 'rate_limited' })
})

test('чужой Origin → 403', async () => {
  const r = await post(valid(), { Origin: 'https://evil.example' })
  assert.equal(r.status, 403)
})

test('utm строкой вместо объекта и «Тестов» в имени — заявка принимается, не помечена как тест', async () => {
  const r = await post(valid({ utm: 'oops', name: 'Пётр Тестов' }))
  assert.equal(r.status, 200)
  assert.match(csv().at(-1), /;$/)
})

test('CSV не записался → 500, и повтор с тем же ключом не теряет заявку', async () => {
  const leads = path.join(home, 'leads')
  const body = valid({ name: 'Повтор' })
  fs.renameSync(path.join(leads, 'leads.csv'), path.join(leads, 'leads.bak'))
  fs.mkdirSync(path.join(leads, 'leads.csv')) // папка вместо файла — запись упадёт
  const r1 = await post(body)
  assert.equal(r1.status, 500)
  assert.deepEqual(await r1.json(), { ok: false, error: 'server' })
  fs.rmdirSync(path.join(leads, 'leads.csv'))
  fs.renameSync(path.join(leads, 'leads.bak'), path.join(leads, 'leads.csv'))
  const c = csv().length
  const r2 = await post(body)
  assert.deepEqual(await r2.json(), { ok: true })
  assert.equal(csv().length, c + 1)
})

test('письмо о заявке: на kirill.malin0vsky@yandex.ru, UTF-8, тема с именем и треком', async () => {
  const log = path.join(home, 'mail.log')
  const mails = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split(/\r?\n/) : [])
  const before = mails().length
  const r = await post(valid({ name: 'Анна', car: 'BMW X5' }))
  assert.equal(r.status, 200)
  for (let i = 0; i < 40 && mails().length === before; i++) await new Promise((r) => setTimeout(r, 50))
  const mail = JSON.parse(mails().at(-1))
  assert.equal(mail.to, 'kirill.malin0vsky@yandex.ru')
  assert.equal(mail.subject, 'Заявка с сайта: Анна, Для себя')
  assert.match(mail.body, /Телефон: \+79123456789/)
  assert.match(mail.body, /Ищет: BMW X5/)
  assert.match(mail.body, /utm_source=yandex/)
  assert.ok(mail.headers.some((h) => h.startsWith('From: ') && h.endsWith('<noreply@bazaimporta.ru>')))
})

test('согласие в CSV: флаг ПДн, версия, IP и согласие на рекламу отдельно; IP не уходит в Telegram', async () => {
  const header = () => fs.readFileSync(path.join(home, 'leads/leads.csv'), 'utf8').replace(/^﻿/, '').split('\n')[0].trim().split(';')
  const row = () => Object.fromEntries(header().map((k, i) => [k, csv().at(-1).split(';')[i]]))
  const s = sent.length

  await post(valid({ consent_version: '2026-10-12', ads: true, ads_version: '2026-10-12' }))
  let r = row()
  assert.equal(r.consent_pd, '1')
  assert.equal(r.consent_version, '2026-10-12')
  assert.equal(r.consent_ip, '127.0.0.1')
  assert.equal(r.ads_consent, '1')
  assert.equal(r.ads_version, '2026-10-12')

  await post(valid({ consent_version: '<script>', ads: 'yes' }))
  r = row()
  assert.equal(r.consent_version, '', 'мусор вместо версии не пишется')
  assert.equal(r.ads_consent, '0', 'реклама — только при true')

  await waitSent(s + 2)
  assert.ok(sent.slice(s).every((m) => !m.body.text.includes('127.0.0.1')))
})

test('старый CSV с другим набором колонок откладывается, новый начинается с заголовка', async () => {
  const leads = path.join(home, 'leads')
  fs.writeFileSync(path.join(leads, 'leads.csv'), '﻿time_msk;name;phone\n2026-01-01;Старый;+79000000000\n')
  const r = await post(valid())
  assert.equal(r.status, 200)
  const old = fs.readdirSync(leads).filter((f) => /^leads\.until-.*\.csv$/.test(f))
  assert.equal(old.length, 1)
  assert.match(fs.readFileSync(path.join(leads, old[0]), 'utf8'), /Старый/)
  assert.equal(csv().length, 1)
  assert.match(fs.readFileSync(path.join(leads, 'leads.csv'), 'utf8'), /consent_pd;consent_version;consent_ip;ads_consent;ads_version;key;test/)
})

// ——— кабинет заявок /manager/ ———
const jar = { c: '' }
async function mgr(pathQ = '', { form, cookie = jar.c } = {}) {
  const r = await fetch(BASE + '/manager/' + pathQ, {
    method: form ? 'POST' : 'GET',
    redirect: 'manual',
    headers: { ...(cookie ? { Cookie: cookie } : {}), ...(form ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
    body: form ? new URLSearchParams(form) : undefined,
  })
  const set = r.headers.get('set-cookie')
  if (set && cookie === jar.c) jar.c = set.split(';')[0]
  return { r, html: await r.text() }
}
const csrfOf = (html) => html.match(/name="csrf" value="([0-9a-f]+)"/)?.[1]

test('кабинет: без входа — только форма пароля, заявок не видно', async () => {
  const { r, html } = await mgr()
  assert.equal(r.status, 200)
  assert.match(r.headers.get('x-robots-tag'), /noindex/)
  assert.match(html, /name="password"/)
  assert.ok(!html.includes('+79123456789'))
  const ex = await mgr('?export=1')
  assert.ok(!ex.html.includes('+79123456789'), 'выгрузка без входа не отдаёт данные')
})

test('кабинет: неверный пароль отклоняется, 6-я попытка за 15 минут — блок', async () => {
  const msgs = []
  for (let i = 0; i < 6; i++) msgs.push((await mgr('', { form: { action: 'login', password: 'нет' }, cookie: 'x=1' })).html)
  assert.ok(msgs.slice(0, 5).every((h) => h.includes('Неверный пароль')))
  assert.match(msgs[5], /Слишком много попыток/)
})

test('кабинет: вход, список, статус с CSRF, поиск, выгрузка, удаление с журналом', async () => {
  await post(valid({ name: 'Кабинетный Клиент', phone: '+7 (999) 111-22-33', car: '<img src=x>' }))
  const login = await mgr('', { form: { action: 'login', password: 'верный-пароль' } })
  assert.equal(login.r.status, 303)
  assert.match(jar.c, /^baza_mgr=/)

  let { html } = await mgr()
  assert.match(html, /Кабинетный Клиент/)
  assert.match(html, /&lt;img src=x&gt;/, 'ввод экранирован')
  assert.match(html, /редакция/, 'видно доказательство согласия')
  const csrf = csrfOf(html)
  assert.ok(csrf)
  const key = csv().at(-1).split(';').at(-2)

  const noCsrf = await mgr('', { form: { action: 'status', key, status: 'work', note: 'x' } })
  assert.equal(noCsrf.r.status, 403)

  await mgr('', { form: { action: 'status', key, status: 'work', note: 'перезвонить в 18:00', csrf } })
  ;({ html } = await mgr('?status=work'))
  assert.match(html, /Кабинетный Клиент/)
  assert.match(html, /перезвонить в 18:00/)
  ;({ html } = await mgr('?q=111-22'))
  assert.match(html, /Кабинетный Клиент/)
  assert.ok(!html.includes('Пётр Тестов'))

  const ex = await fetch(BASE + '/manager/?export=1&q=Кабинетный', { headers: { Cookie: jar.c } })
  assert.match(ex.headers.get('content-type'), /text\/csv/)
  const body = await ex.text()
  assert.match(body, /\+79991112233/)
  assert.match(body, /"В работе";"перезвонить в 18:00"/)

  const before = csv().length
  const bad = await mgr('', { form: { action: 'delete', key, reason: 'withdrawn', csrf } })
  assert.equal(bad.r.status, 303, 'без подтверждения — назад на форму')
  assert.equal(csv().length, before)
  await mgr('', { form: { action: 'delete', key, reason: 'withdrawn', confirm: '1', csrf } })
  assert.equal(csv().length, before - 1)
  assert.ok(!csv().some((l) => l.includes('+79991112233')))
  const log = fs.readFileSync(path.join(home, 'leads/deletions.log'), 'utf8')
  assert.match(log, new RegExp(`;${key};withdrawn;rows=1`))
  assert.ok(!log.includes('Кабинетный') && !log.includes('79991112233'), 'в журнале нет ПДн')

  await mgr('', { form: { action: 'logout', csrf } })
  ;({ html } = await mgr())
  assert.match(html, /name="password"/)
})

test('общий PHP-код напрямую не открывается', async () => {
  const r = await fetch(BASE + '/api/_common.php')
  assert.equal(r.status, 404)
})
