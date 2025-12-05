# Avalora API Server

Backend API для Avalora Visuals.

## Установка

```bash
cd server
npm install
```

## Настройка

1. Скопируй `.env.example` в `.env`:
```bash
cp .env.example .env
```

2. Отредактируй `.env`:
```env
DATABASE_URL=postgresql://postgres:твой_пароль@localhost:5432/avaloradb
JWT_SECRET=сгенерируй-случайную-строку-минимум-32-символа
PORT=3001
FRONTEND_URL=http://localhost:5173
```

## Запуск

```bash
# Development (с автоперезагрузкой)
npm run dev

# Production
npm start
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/auth/me` - Текущий пользователь
- `POST /api/auth/logout` - Выход

### Products
- `GET /api/products` - Все продукты
- `GET /api/products/:slug` - Один продукт

### Licenses (требует авторизации)
- `GET /api/licenses` - Мои лицензии
- `POST /api/licenses/activate` - Активировать ключ

### Purchases (требует авторизации)
- `GET /api/purchases` - Мои покупки
- `POST /api/purchases` - Создать покупку

### Admin (требует admin роли)
- `GET /api/admin/users` - Все пользователи
- `GET /api/admin/licenses` - Все лицензии
- `POST /api/admin/licenses` - Создать лицензию
- `PATCH /api/admin/licenses/:id` - Обновить лицензию
- `DELETE /api/admin/licenses/:id` - Удалить лицензию
- `GET /api/admin/stats` - Статистика

## Тестовый админ

- Email: `admin@avalora.com`
- Пароль: `admin123`
