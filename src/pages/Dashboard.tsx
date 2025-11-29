import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { ProfileCard } from "@/components/ProfileCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Key, User as UserIcon, Shield, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import dashboardBg from "@/assets/dashboard-bg.jpg";

interface License {
  id: string;
  license_key: string;
  is_active: boolean;
  created_at: string;
  activated_at: string | null;
  expires_at: string | null;
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
        .select("*")
        .eq("owner_id", session.user.id)
        .order("created_at", { ascending: false });

      setLicenses(licensesData || []);
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
                  {licenses.map((license, index) => (
                    <motion.div
                      key={license.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <Card className={`bg-gradient-card border-primary/20 shadow-card-custom ${!license.is_active && 'opacity-60'}`}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                              <Key className="w-5 h-5 text-primary" />
                              Лицензионный ключ
                            </CardTitle>
                            <Badge variant={license.is_active ? "default" : "secondary"}>
                              {license.is_active ? "Активна" : "Неактивна"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center gap-2">
                            <code className="flex-1 px-4 py-3 bg-background/50 rounded-lg border border-primary/20 text-sm font-mono">
                              {license.license_key}
                            </code>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => copyToClipboard(license.license_key)}
                              className="border-primary/30 hover:bg-primary/10"
                            >
                              {copiedKey === license.license_key ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-foreground/60 mb-1">Выдан</p>
                              <p className="font-medium">
                                {new Date(license.created_at).toLocaleDateString("ru-RU")}
                              </p>
                            </div>
                            {license.expires_at && (
                              <div>
                                <p className="text-foreground/60 mb-1">Истекает</p>
                                <p className="font-medium">
                                  {new Date(license.expires_at).toLocaleDateString("ru-RU")}
                                </p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
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