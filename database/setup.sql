-- =============================================
-- Avalora Visuals Database Setup
-- PostgreSQL / Supabase Compatible
-- =============================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABLES

-- Profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    features TEXT[],
    is_beta BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Pricing tiers table
CREATE TABLE IF NOT EXISTS public.pricing_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    duration_type TEXT NOT NULL, -- 'week', 'month', 'lifetime'
    duration_days INTEGER, -- NULL for lifetime
    price NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Licenses table
CREATE TABLE IF NOT EXISTS public.licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_key TEXT NOT NULL UNIQUE,
    owner_id UUID,
    issued_by UUID,
    is_active BOOLEAN NOT NULL DEFAULT true,
    activated_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Purchases table
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    license_id UUID REFERENCES public.licenses(id),
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. FUNCTIONS

-- Function to check user role (Security Definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, username)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
    );
    
    -- Assign default user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$$;

-- 5. TRIGGERS

-- Update profiles updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Handle new user registration (connect to auth.users if using Supabase)
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--     AFTER INSERT ON auth.users
--     FOR EACH ROW
--     EXECUTE FUNCTION public.handle_new_user();

-- 6. ROW LEVEL SECURITY (RLS)

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- USER ROLES POLICIES
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- PRODUCTS POLICIES
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
CREATE POLICY "Products are viewable by everyone" ON public.products
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products" ON public.products
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- PRICING TIERS POLICIES
DROP POLICY IF EXISTS "Pricing tiers are viewable by everyone" ON public.pricing_tiers;
CREATE POLICY "Pricing tiers are viewable by everyone" ON public.pricing_tiers
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage pricing tiers" ON public.pricing_tiers;
CREATE POLICY "Admins can manage pricing tiers" ON public.pricing_tiers
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- LICENSES POLICIES
DROP POLICY IF EXISTS "Users can view their own licenses" ON public.licenses;
CREATE POLICY "Users can view their own licenses" ON public.licenses
    FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Admins can view all licenses" ON public.licenses;
CREATE POLICY "Admins can view all licenses" ON public.licenses
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can create licenses" ON public.licenses;
CREATE POLICY "Admins can create licenses" ON public.licenses
    FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update licenses" ON public.licenses;
CREATE POLICY "Admins can update licenses" ON public.licenses
    FOR UPDATE USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete licenses" ON public.licenses;
CREATE POLICY "Admins can delete licenses" ON public.licenses
    FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- PURCHASES POLICIES
DROP POLICY IF EXISTS "Users can view their own purchases" ON public.purchases;
CREATE POLICY "Users can view their own purchases" ON public.purchases
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own purchases" ON public.purchases;
CREATE POLICY "Users can create their own purchases" ON public.purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all purchases" ON public.purchases;
CREATE POLICY "Admins can view all purchases" ON public.purchases
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- 7. SEED DATA

-- Insert products
INSERT INTO public.products (name, slug, description, features, is_beta) VALUES
    (
        'Avalora Visuals Release',
        'release',
        'Полная версия визуальных модов для Minecraft с максимальным качеством графики',
        ARRAY['HD текстуры', 'Динамическое освещение', 'Реалистичные тени', 'Поддержка RTX'],
        false
    ),
    (
        'Avalora Visuals Beta',
        'beta',
        'Ранний доступ к новейшим функциям и эксклюзивным визуальным эффектам',
        ARRAY['Ранний доступ', 'Эксклюзивные эффекты', 'Приоритетная поддержка', 'Бета-функции'],
        true
    )
ON CONFLICT (slug) DO NOTHING;

-- Insert pricing tiers
INSERT INTO public.pricing_tiers (product_id, duration_type, duration_days, price)
SELECT 
    p.id,
    tier.duration_type,
    tier.duration_days,
    tier.price
FROM public.products p
CROSS JOIN (
    VALUES 
        ('week', 7, 200),
        ('month', 30, 500),
        ('lifetime', NULL, 700)
) AS tier(duration_type, duration_days, price)
WHERE p.slug = 'release'
ON CONFLICT DO NOTHING;

INSERT INTO public.pricing_tiers (product_id, duration_type, duration_days, price)
SELECT 
    p.id,
    tier.duration_type,
    tier.duration_days,
    tier.price
FROM public.products p
CROSS JOIN (
    VALUES 
        ('week', 7, 400),
        ('month', 30, 1000),
        ('lifetime', NULL, 1400)
) AS tier(duration_type, duration_days, price)
WHERE p.slug = 'beta'
ON CONFLICT DO NOTHING;

-- =============================================
-- END OF SETUP
-- =============================================

-- To create an admin user, run this after user registration:
-- INSERT INTO public.user_roles (user_id, role) VALUES ('USER_UUID_HERE', 'admin');
