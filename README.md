# Андрей-Вова - Crypto Analytics Platform

Крипто-аналитическая платформа с AI-аналитикой, отслеживанием кошельков и проверкой безопасности токенов.

![Platform Preview](https://img.shields.io/badge/React-18.3-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-3.4-blue)

## Функции

- 🧠 **AI Dashboard** - Автоматический анализ рынка с данными в реальном времени
- 💼 **Wallet Tracker** - Отслеживание ETH/SOL кошельков
- 🔄 **Token Flow** - Анализ потоков токенов
- 🌍 **Holder Map** - Визуализация распределения держателей (Bubblemaps-style)
- 🛡️ **Token Scanner** - Проверка безопасности токенов (киллер-фича!)
- 🔔 **Alerts** - Настройка уведомлений на активность
- 💬 **AI Chat** - Общение с AI на основе данных рынка

## Технологии

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Supabase (Auth + Database)
- **AI**: Groq API (Llama 3.3)
- **API**: CoinGecko, Etherscan, Helius

## Установка

```bash
# Клонирование репозитория
git clone https://github.com/YOUR_USERNAME/kripto-kompas.git
cd kripto-kompas

# Установка зависимостей
pnpm install

# Создание .env файла
cp .env.example .env
```

## Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```env
# CoinGecko - бесплатный API
VITE_COINGECKO_API_KEY=

# Etherscan - бесплатный API (https://etherscan.io/apis)
VITE_ETHERSCAN_API_KEY=

# Helius - бесплатный API (https://dev.helius.xyz)
VITE_HELIUS_API_KEY=

# Groq AI - бесплатный API (https://console.groq.com)
VITE_GROQ_API_KEY=

# Supabase (https://supabase.com)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Запуск

```bash
# Режим разработки
pnpm dev

# Продакшн билд
pnpm build
```

## Деплой на Vercel

### 1. Подготовка GitHub репозитория

```bash
# Инициализация Git
git init
git add .
git commit -m "Initial commit"

# Создание репозитория на GitHub и пуш
git remote add origin https://github.com/YOUR_USERNAME/kripto-kompas.git
git push -u origin main
```

### 2. Подключение к Vercel

1. Зайдите на [vercel.com](https://vercel.com)
2. Нажмите "New Project"
3. Импортируйте репозиторий с GitHub
4. Vercel автоматически определит Vite проект
5. Добавьте переменные окружения в настройках проекта:
   - `VITE_ETHERSCAN_API_KEY`
   - `VITE_HELIUS_API_KEY`
   - `VITE_GROQ_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Нажмите "Deploy"

### 3. Кастомный домен (опционально)

В настройках проекта Vercel:
- Project → Settings → Domains
- Добавьте ваш домен (например, `crypto.yoursite.com`)
- Настройте DNS записи у вашего регистратора

## Деплой на Netlify

```bash
# Установка Netlify CLI
npm install -g netlify-cli

# Деплой
netlify deploy --prod --dir=dist
```

Или подключите GitHub репозиторий через веб-интерфейс Netlify.

## Supabase Setup

### 1. Создание проекта

1. Зайдите на [supabase.com](https://supabase.com)
2. Создайте новый проект
3. Скопируйте URL и anon ключ в `.env`

### 2. Настройка Auth

Supabase Auth уже настроен в проекте. Для включения email/password:
- Supabase Dashboard → Authentication → Providers → Email → Enable

### 3. Настройка Database (опционально)

Для хранения пользовательских настроек и watchlist:

```sql
-- Создание таблицы watchlist
create table watchlist (
  id uuid references auth.users(id),
  token_id text not null,
  created_at timestamp with time zone default now(),
  primary key (id, token_id)
);

-- RLS политики
alter table watchlist enable row level security;
create policy "Users can view own watchlist" on watchlist for select using (auth.uid() = id);
create policy "Users can insert own watchlist" on watchlist for insert with check (auth.uid() = id);
```

## API Ключи (бесплатные)

| API | Ссылка | Лимиты |
|-----|--------|--------|
| CoinGecko | [coingecko.com/api](https://www.coingecko.com/api) | 10-50 req/min |
| Etherscan | [etherscan.io/apis](https://etherscan.io/apis) | 5 req/sec |
| Helius | [dev.helius.xyz](https://dev.helius.xyz) | Free tier |
| Groq | [console.groq.com](https://console.groq.com) | 30 req/min |

## Производительность

- Данные рынка загружаются мгновенно (без блокировки UI)
- Автообновление каждые 60 секунд
- Индикаторы загрузки в реальном времени

## Лицензия

MIT License

---

Сделано с ❤️ для крипто-сообщества
