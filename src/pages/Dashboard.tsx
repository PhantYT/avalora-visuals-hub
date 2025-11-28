import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Key, Shield, Calendar, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

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

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setProfile(profileData);

      // Check if user is admin
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const adminRole = rolesData?.find((r: any) => r.role === "admin");
      setIsAdmin(!!adminRole);

      // Fetch licenses
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
      <div className="min-h-screen bg-gradient-hero">
        <Navbar user={user} />
        <div className="container mx-auto px-4 pt-24">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid gap-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar user={user} />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Личный кабинет
          </h1>
          <p className="text-foreground/60">Добро пожаловать, {profile?.username || "пользователь"}!</p>
        </div>

        {isAdmin && (
          <Card className="mb-6 bg-primary/10 border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Админ панель
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate("/admin")} 
                className="bg-primary hover:bg-primary/90 shadow-glow"
              >
                Перейти в админ панель
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="bg-card/50 backdrop-blur-xl border-primary/20 shadow-card-custom">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              Ваши лицензии
            </CardTitle>
            <CardDescription>
              {licenses.length === 0 
                ? "У вас пока нет активных лицензий" 
                : `Всего лицензий: ${licenses.length}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {licenses.length === 0 ? (
              <div className="text-center py-12">
                <Key className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-foreground/60 mb-4">У вас пока нет лицензий</p>
                <Button variant="outline" className="border-primary/50">
                  Купить лицензию
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {licenses.map((license) => (
                  <div
                    key={license.id}
                    className="p-4 rounded-lg border border-primary/20 bg-gradient-card hover:border-primary/40 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={license.is_active ? "default" : "secondary"}>
                          {license.is_active ? "Активна" : "Неактивна"}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(license.license_key)}
                        className="h-8 w-8 p-0"
                      >
                        {copiedKey === license.license_key ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <div className="font-mono text-sm bg-background/50 p-3 rounded border border-primary/10 mb-3">
                      {license.license_key}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-foreground/60">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Создано: {new Date(license.created_at).toLocaleDateString()}
                      </div>
                      {license.expires_at && (
                        <div className="flex items-center gap-1">
                          Истекает: {new Date(license.expires_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
