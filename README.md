# Наш класс · Гимназия №70

Четыре рисованных «мира» для 6 класса с общими аккаунтами:
🌳 Сад добрых дел · 📚 Книжная полка · 🚂 Поезд класса · 💌 Ящик тревог (анонимный).

React + Vite на GitHub Pages, база и аккаунты — Supabase (бесплатный тариф).
Без ключей сайт запускается в **демо-режиме** (данные в браузере).

## Запуск у себя
```bash
npm install
npm run dev
```

## Подключение сервера (один раз, ~10 минут)
1. supabase.com → New project (бесплатно). Запомните пароль базы.
2. **SQL Editor** → вставьте весь `supabase/schema.sql` → Run.
3. **Authentication → Providers → Email**: выключите «Confirm email».
4. **Project Settings → API**: скопируйте `Project URL` и `anon public` key.
   Для локальной работы положите их в `.env.local` (по образцу `.env.example`).
5. Аккаунты: заполните `scripts/roster.txt` (первая строка `teacher: Имя Отчество`, дальше по ученику в строке) и выполните  
   `SUPABASE_URL=… SUPABASE_SERVICE_KEY=<service_role key> npm run users`  
   Логины/пароли окажутся в `scripts/credentials.csv` — раздайте детям. Ключ `service_role` секретный, никуда его не публикуйте.

## Публикация на GitHub Pages
1. Залейте код в репозиторий (ветка `main`).
2. Settings → Pages → Source: **GitHub Actions**.
3. Settings → Secrets and variables → Actions → **Variables**: `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`.
4. Каждый push в `main` публикует сайт автоматически.

## Как устроена анонимность ящика
Таблица `worries` читается только её автором (RLS). Учитель получает письма через функцию
`teacher_inbox()`, которая не возвращает автора, в случайно-стабильном порядке и только с датой без времени.
Ответ видит только автор. Честная оговорка: владелец проекта Supabase технически может открыть базу целиком,
поэтому доступ к панели Supabase лучше не давать никому, кроме учителя/вас.
