-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  features TEXT[],
  is_beta BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create pricing tiers table
CREATE TABLE public.pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  duration_type TEXT NOT NULL, -- 'week', 'month', 'lifetime'
  price NUMERIC NOT NULL,
  duration_days INTEGER, -- NULL for lifetime
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_id, duration_type)
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;

-- Products are viewable by everyone
CREATE POLICY "Products are viewable by everyone"
ON public.products
FOR SELECT
USING (true);

-- Pricing tiers are viewable by everyone
CREATE POLICY "Pricing tiers are viewable by everyone"
ON public.pricing_tiers
FOR SELECT
USING (true);

-- Only admins can manage products
CREATE POLICY "Admins can manage products"
ON public.products
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can manage pricing tiers
CREATE POLICY "Admins can manage pricing tiers"
ON public.pricing_tiers
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default products
INSERT INTO public.products (name, slug, description, is_beta, features) VALUES
('Avalora Visuals Release', 'release', 'Полная версия визуального мода с всеми функциями', false, ARRAY[
  'Все визуальные эффекты',
  'Регулярные обновления',
  'Приоритетная поддержка',
  'Оптимизация производительности',
  'Настраиваемые эффекты'
]),
('Avalora Visuals Beta', 'beta', 'Бета-версия с ранним доступом к новым функциям', true, ARRAY[
  'Ранний доступ к новым функциям',
  'Эксклюзивные эффекты',
  'Тестирование новых возможностей',
  'Прямая связь с разработчиками',
  'Влияние на развитие мода'
]);

-- Insert pricing tiers for Release version
INSERT INTO public.pricing_tiers (product_id, duration_type, price, duration_days)
SELECT id, 'week', 200, 7 FROM public.products WHERE slug = 'release'
UNION ALL
SELECT id, 'month', 500, 30 FROM public.products WHERE slug = 'release'
UNION ALL
SELECT id, 'lifetime', 700, NULL FROM public.products WHERE slug = 'release';

-- Insert pricing tiers for Beta version (2x price)
INSERT INTO public.pricing_tiers (product_id, duration_type, price, duration_days)
SELECT id, 'week', 400, 7 FROM public.products WHERE slug = 'beta'
UNION ALL
SELECT id, 'month', 1000, 30 FROM public.products WHERE slug = 'beta'
UNION ALL
SELECT id, 'lifetime', 1400, NULL FROM public.products WHERE slug = 'beta';