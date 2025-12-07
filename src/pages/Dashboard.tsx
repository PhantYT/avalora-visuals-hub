import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { ProfileCard } from "@/components/ProfileCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Key, User as UserIcon, Shield, Clock, Infinity, Calendar, Monitor } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import dashboardBg from "@/assets/dashboard-bg.jpg";
import productRelease from "@/assets/product-release.jpg";
import productBeta from "@/assets/product-beta.jpg";

interface License {
  id: string;
  license_key: string;
  is_active: boolean;
  created_at: string;
  activated_at: string | null;
  expires_at: string | null;
  duration_type: string | null;
  hwid: string | null;
  product_id: string | null;
  product_name: string | null;
  product_slug: string | null;
  product_is_beta: boolean | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
      await fetchProfile(session.user.id);

      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const adminRole = rolesData?.find((r: any) => r.role === "admin");
      setIsAdmin(!!adminRole);

      const { data: licensesData } = await supabase
        .from("licenses")
        .select(`
          *,
          products (
            name,
            slug,
            is_beta
          )
        `)
        .eq("owner_id", session.user.id)
        .order("created_at", { ascending: false });

      // Transform data to flat structure
      const transformedLicenses = (licensesData || []).map((l: any) => ({
        ...l,
        product_name: l.products?.name || null,
        product_slug: l.products?.slug || null,
        product_is_beta: l.products?.is_beta || null,
      }));

      setLicenses(transformedLicenses);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId?: string) => {
    const uid = userId || user?.id;
    if (!uid) return;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .single();

    setProfile(profileData);
  };

  const copyToClipboard = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast({
      title: "Скопировано!",
      description: "Ключ скопирован в буфер обмена",
    });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getRemainingTime = (expiresAt: string | null, durationType: string | null) => {
    if (durationType === 'lifetime' || !expiresAt) {
      return { text: 'Навсегда', icon: Infinity, color: 'text-accent' };
    }

    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) {
      return { text: 'Истекла', icon: Clock, color: 'text-destructive' };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return { text: `${days} дн. ${hours} ч.`, icon: Clock, color: days <= 3 ? 'text-yellow-500' : 'text-green-500' };
    }
    return { text: `${hours} ч.`, icon: Clock, color: 'text-yellow-500' };
  };

  const getDurationLabel = (durationType: string | null) => {
    switch (durationType) {
      case 'week': return 'Неделя';
      case 'month': return 'Месяц';
      case 'lifetime': return 'Навсегда';
      default: return 'Не указано';
    }
  };

  const getProductImage = (isBeta: boolean | null) => {
    return isBeta ? productBeta : productRelease;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero relative">
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${dashboardBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
          }}
        />
      </div>
      
      <Navbar user={user} />
      
      <div className="container mx-auto px-4 pt-24 pb-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Личный кабинет
          </h1>
          <p className="text-foreground/60">Управляйте своими лицензиями и профилем</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Tabs defaultValue="licenses" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="licenses" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                Лицензии
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                Профиль
              </TabsTrigger>
            </TabsList>

            <TabsContent value="licenses" className="space-y-6">
              {isAdmin && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card className="bg-gradient-card border-accent/40 shadow-neon">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Shield className="w-8 h-8 text-accent" />
                          <div>
                            <h3 className="text-xl font-bold">Панель администратора</h3>
                            <p className="text-sm text-foreground/60">Управление системой</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => navigate("/admin")}
                          className="bg-accent hover:bg-accent/90 shadow-neon"
                        >
                          Открыть панель
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {licenses.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card className="bg-gradient-card border-primary/20 text-center p-12">
                    <Key className="w-16 h-16 mx-auto mb-4 text-primary/50" />
                    <h3 className="text-2xl font-bold mb-2">Нет активных лицензий</h3>
                    <p className="text-foreground/60 mb-6">
                      Приобретите лицензию, чтобы получить доступ к визуалам
                    </p>
                    <Button 
                      onClick={() => navigate("/")}
                      className="bg-primary hover:bg-primary/90 shadow-glow"
                    >
                      Посмотреть товары
                    </Button>
                  </Card>
                </motion.div>
              ) : (
                <div className="grid gap-6">
                  {licenses.map((license, index) => {
                    const remaining = getRemainingTime(license.expires_at, license.duration_type);
                    const RemainingIcon = remaining.icon;
                    
                    return (
                      <motion.div
                        key={license.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                      >
                        <Card className={`bg-gradient-card border-primary/20 shadow-card-custom overflow-hidden ${!license.is_active && 'opacity-60'}`}>
                          <div className="flex flex-col md:flex-row">
                            {/* Product Image */}
                            <div className="relative w-full md:w-48 h-40 md:h-auto shrink-0">
                              <img
                                src={getProductImage(license.product_is_beta)}
                                alt={license.product_name || 'Product'}
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/90 md:block hidden" />
                              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card/90 md:hidden" />
                              
                              {/* Product Badge */}
                              <div className="absolute top-3 left-3">
                                <Badge 
                                  variant={license.product_is_beta ? "secondary" : "default"}
                                  className={`${license.product_is_beta ? 'bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground'} shadow-lg`}
                                >
                                  {license.product_is_beta ? '🧪 Beta' : '🚀 Release'}
                                </Badge>
                              </div>
                            </div>

                            {/* License Info */}
                            <div className="flex-1 p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <h3 className="text-xl font-bold mb-1">
                                    {license.product_name || 'Avalora Visuals'}
                                  </h3>
                                  <div className="flex items-center gap-2 text-sm text-foreground/60">
                                    <Calendar className="w-4 h-4" />
                                    <span>Тариф: {getDurationLabel(license.duration_type)}</span>
                                  </div>
                                </div>
                                <Badge variant={license.is_active ? "default" : "secondary"}>
                                  {license.is_active ? "✓ Активна" : "Неактивна"}
                                </Badge>
                              </div>

                              {/* License Key */}
                              <div className="flex items-center gap-2 mb-4">
                                <code className="flex-1 px-4 py-3 bg-background/50 rounded-lg border border-primary/20 text-sm font-mono truncate">
                                  {license.license_key}
                                </code>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => copyToClipboard(license.license_key)}
                                  className="border-primary/30 hover:bg-primary/10 shrink-0"
                                >
                                  {copiedKey === license.license_key ? (
                                    <Check className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>

                              {/* Stats Grid */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div className="bg-background/30 rounded-lg p-3">
                                  <p className="text-foreground/60 mb-1 flex items-center gap-1">
                                    <RemainingIcon className={`w-3 h-3 ${remaining.color}`} />
                                    Осталось
                                  </p>
                                  <p className={`font-bold ${remaining.color}`}>
                                    {remaining.text}
                                  </p>
                                </div>
                                
                                <div className="bg-background/30 rounded-lg p-3">
                                  <p className="text-foreground/60 mb-1">Выдан</p>
                                  <p className="font-medium">
                                    {new Date(license.created_at).toLocaleDateString("ru-RU")}
                                  </p>
                                </div>

                                {license.expires_at && license.duration_type !== 'lifetime' && (
                                  <div className="bg-background/30 rounded-lg p-3">
                                    <p className="text-foreground/60 mb-1">Истекает</p>
                                    <p className="font-medium">
                                      {new Date(license.expires_at).toLocaleDateString("ru-RU")}
                                    </p>
                                  </div>
                                )}

                                <div className="bg-background/30 rounded-lg p-3">
                                  <p className="text-foreground/60 mb-1 flex items-center gap-1">
                                    <Monitor className="w-3 h-3" />
                                    HWID
                                  </p>
                                  <p className="font-medium truncate" title={license.hwid || 'Не привязан'}>
                                    {license.hwid || <span className="text-foreground/40">—</span>}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="profile">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <ProfileCard user={user} profile={profile} onProfileUpdate={fetchProfile} />
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
