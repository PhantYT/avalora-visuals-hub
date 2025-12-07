-- =============================================
-- Avalora Visuals - Standalone PostgreSQL Setup
-- Для использования БЕЗ Supabase
-- =============================================

-- Удаляем старые таблицы если есть
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS licenses CASCADE;
DROP TABLE IF EXISTS pricing_tiers CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS email_confirmations CASCADE;
DROP TYPE IF EXISTS app_role CASCADE;

-- Расширение для UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum для ролей
CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'user');

-- =============================================
-- ТАБЛИЦЫ
-- =============================================

-- Таблица пользователей (вместо auth.users от Supabase)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- Пароль в открытом виде
    email_confirmed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Подтверждение email
CREATE TABLE email_confirmations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Профили пользователей
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Роли пользователей
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- Продукты
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    features TEXT[],
    is_beta BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Тарифы
CREATE TABLE pricing_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    duration_type TEXT NOT NULL, -- 'week', 'month', 'lifetime'
    duration_days INTEGER, -- NULL для lifetime
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Лицензии
CREATE TABLE licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_key TEXT UNIQUE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    issued_by UUID REFERENCES users(id),
    hwid TEXT DEFAULT '', -- Hardware ID, пустой по умолчанию
    is_active BOOLEAN DEFAULT true,
    activated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    duration_type TEXT, -- 'week', 'month', 'lifetime'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Покупки
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    license_id UUID REFERENCES licenses(id),
    amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Сброс пароля
CREATE TABLE password_resets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ФУНКЦИИ
-- =============================================

-- Функция проверки роли
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = _user_id AND role = _role
    );
END;
$$ LANGUAGE plpgsql;

-- Функция обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Функция проверки пароля (без хеширования)
CREATE OR REPLACE FUNCTION verify_password(email_input TEXT, password_input TEXT)
RETURNS UUID AS $$
DECLARE
    user_record users%ROWTYPE;
BEGIN
    SELECT * INTO user_record FROM users WHERE email = email_input;
    
    IF user_record.id IS NULL THEN
        RETURN NULL;
    END IF;
    
    IF user_record.password = password_input THEN
        RETURN user_record.id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Функция регистрации пользователя
CREATE OR REPLACE FUNCTION register_user(
    _email TEXT,
    _password TEXT,
    _username TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
    final_username TEXT;
BEGIN
    -- Проверяем существование email
    IF EXISTS (SELECT 1 FROM users WHERE email = _email) THEN
        RAISE EXCEPTION 'Email already exists';
    END IF;
    
    -- Генерируем username если не указан
    final_username := COALESCE(_username, split_part(_email, '@', 1));
    
    -- Создаем пользователя (пароль без хеширования)
    INSERT INTO users (email, password)
    VALUES (_email, _password)
    RETURNING id INTO new_user_id;
    
    -- Создаем профиль
    INSERT INTO profiles (id, username)
    VALUES (new_user_id, final_username);
    
    -- Назначаем роль user
    INSERT INTO user_roles (user_id, role)
    VALUES (new_user_id, 'user');
    
    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ТРИГГЕРЫ
-- =============================================

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ИНДЕКСЫ
-- =============================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_licenses_owner_id ON licenses(owner_id);
CREATE INDEX idx_licenses_key ON licenses(license_key);
CREATE INDEX idx_licenses_product_id ON licenses(product_id);
CREATE INDEX idx_licenses_hwid ON licenses(hwid);
CREATE INDEX idx_purchases_user_id ON purchases(user_id);
CREATE INDEX idx_pricing_tiers_product_id ON pricing_tiers(product_id);
CREATE INDEX idx_email_confirmations_token ON email_confirmations(token);
CREATE INDEX idx_password_resets_token ON password_resets(token);

-- =============================================
-- SEED DATA - ПРОДУКТЫ
-- =============================================

INSERT INTO products (name, slug, description, features, is_beta) VALUES
(
    'Avalora Visuals Release',
    'release',
    'Полная версия визуальных модов для Minecraft с премиум шейдерами и эффектами',
    ARRAY['Премиум шейдеры', 'Реалистичное освещение', 'Динамические тени', 'Отражения воды', 'Атмосферные эффекты', 'Приоритетная поддержка'],
    false
),
(
    'Avalora Visuals Beta',
    'beta',
    'Ранний доступ к новым функциям и экспериментальным визуальным эффектам',
    ARRAY['Все функции Release', 'Ранний доступ к новинкам', 'Экспериментальные эффекты', 'Эксклюзивные функции бета', 'Прямая связь с разработчиками', 'Влияние на разработку'],
    true
);

-- =============================================
-- SEED DATA - ТАРИФЫ
-- =============================================

-- Release тарифы
INSERT INTO pricing_tiers (product_id, duration_type, duration_days, price)
SELECT id, 'week', 7, 200.00 FROM products WHERE slug = 'release';

INSERT INTO pricing_tiers (product_id, duration_type, duration_days, price)
SELECT id, 'month', 30, 500.00 FROM products WHERE slug = 'release';

INSERT INTO pricing_tiers (product_id, duration_type, duration_days, price)
SELECT id, 'lifetime', NULL, 700.00 FROM products WHERE slug = 'release';

-- Beta тарифы (2x цена)
INSERT INTO pricing_tiers (product_id, duration_type, duration_days, price)
SELECT id, 'week', 7, 400.00 FROM products WHERE slug = 'beta';

INSERT INTO pricing_tiers (product_id, duration_type, duration_days, price)
SELECT id, 'month', 30, 1000.00 FROM products WHERE slug = 'beta';

INSERT INTO pricing_tiers (product_id, duration_type, duration_days, price)
SELECT id, 'lifetime', NULL, 1400.00 FROM products WHERE slug = 'beta';

-- =============================================
-- СОЗДАНИЕ АДМИНА
-- =============================================

-- Создаем админ пользователя (пароль: admin123)
DO $$
DECLARE
    admin_id UUID;
BEGIN
    -- Регистрируем админа
    admin_id := register_user('admin@avalora.com', 'admin123', 'Admin');
    
    -- Добавляем роль admin
    INSERT INTO user_roles (user_id, role) VALUES (admin_id, 'admin');
    
    -- Подтверждаем email
    UPDATE users SET email_confirmed = true WHERE id = admin_id;
    
    RAISE NOTICE 'Admin created with email: admin@avalora.com, password: admin123';
END $$;

-- =============================================
-- ГОТОВО!
-- =============================================

-- Проверка
SELECT 'База данных успешно создана!' AS status;
SELECT 'Админ: admin@avalora.com / admin123' AS admin_credentials;
SELECT COUNT(*) AS products_count FROM products;
SELECT COUNT(*) AS pricing_tiers_count FROM pricing_tiers;
SELECT COUNT(*) AS users_count FROM users;
