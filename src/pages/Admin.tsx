import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, Key, Users, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { z } from "zod";

const licenseSchema = z.object({
  userId: z.string().uuid({ message: "Выберите пользователя" }),
  expiresIn: z.number().min(1, { message: "Срок должен быть минимум 1 день" }),
});

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("30");
  const [issuing, setIssuing] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      // Check if user is admin
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const adminRole = rolesData?.find((r: any) => r.role === "admin");
      
      if (!adminRole) {
        toast({
          title: "Доступ запрещен",
          description: "У вас нет прав администратора",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      await fetchData();
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const fetchData = async () => {
    // Fetch all licenses
    const { data: licensesData } = await supabase
      .from("licenses")
      .select(`
        *,
        profiles!licenses_owner_id_fkey(username)
      `)
      .order("created_at", { ascending: false });

    setLicenses(licensesData || []);

    // Fetch all users
    const { data: usersData } = await supabase
      .from("profiles")
      .select("id, username")
      .order("username");

    setUsers(usersData || []);
  };

  const generateLicenseKey = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const segments = [];
    for (let i = 0; i < 4; i++) {
      let segment = "";
      for (let j = 0; j < 5; j++) {
        segment += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      segments.push(segment);
    }
    return segments.join("-");
  };

  const handleIssueLicense = async () => {
    try {
      setIssuing(true);

      const validatedData = licenseSchema.parse({
        userId: selectedUserId,
        expiresIn: parseInt(expiresInDays),
      });

      const licenseKey = generateLicenseKey();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + validatedData.expiresIn);

      const { error } = await supabase.from("licenses").insert({
        license_key: licenseKey,
        owner_id: validatedData.userId,
        issued_by: user.id,
        is_active: true,
        expires_at: expiresAt.toISOString(),
      });

      if (error) throw error;

      toast({
        title: "Успешно!",
        description: "Лицензия успешно выдана",
      });

      setSelectedUserId("");
      setExpiresInDays("30");
      await fetchData();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Ошибка валидации",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Ошибка",
          description: error.message || "Не удалось выдать лицензию",
          variant: "destructive",
        });
      }
    } finally {
      setIssuing(false);
    }
  };

  const handleDeactivateLicense = async (licenseId: string) => {
    const { error } = await supabase
      .from("licenses")
      .update({ is_active: false })
      .eq("id", licenseId);

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось деактивировать лицензию",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Успешно",
        description: "Лицензия деактивирована",
      });
      await fetchData();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Navbar user={user} />
        <div className="container mx-auto px-4 pt-24">
          <Skeleton className="h-12 w-64 mb-8" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar user={user} />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent flex items-center gap-3">
            <Shield className="w-10 h-10 text-primary" />
            Панель администратора
          </h1>
          <p className="text-foreground/60">Управление пользователями и лицензиями</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <Card className="bg-gradient-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-primary" />
                Пользователи
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{users.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Key className="w-5 h-5 text-accent" />
                Всего лицензий
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{licenses.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Key className="w-5 h-5 text-blue-neon" />
                Активные
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-neon">
                {licenses.filter(l => l.is_active).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6 bg-card/50 backdrop-blur-xl border-primary/20 shadow-card-custom">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Выдать новую лицензию
            </CardTitle>
            <CardDescription>Создайте лицензию для пользователя</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user-select">Пользователь</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger id="user-select">
                    <SelectValue placeholder="Выберите пользователя" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires">Срок действия (дни)</Label>
                <Input
                  id="expires"
                  type="number"
                  min="1"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleIssueLicense}
                  disabled={issuing || !selectedUserId}
                  className="w-full bg-primary hover:bg-primary/90 shadow-glow"
                >
                  {issuing ? "Выдача..." : "Выдать лицензию"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-xl border-primary/20 shadow-card-custom">
          <CardHeader>
            <CardTitle>Все лицензии</CardTitle>
            <CardDescription>Управление выданными лицензиями</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Лицензионный ключ</TableHead>
                    <TableHead>Пользователь</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Создана</TableHead>
                    <TableHead>Истекает</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {licenses.map((license) => (
                    <TableRow key={license.id}>
                      <TableCell className="font-mono text-xs">{license.license_key}</TableCell>
                      <TableCell>{license.profiles?.username || "Неизвестен"}</TableCell>
                      <TableCell>
                        <Badge variant={license.is_active ? "default" : "secondary"}>
                          {license.is_active ? "Активна" : "Неактивна"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(license.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-xs">
                        {license.expires_at 
                          ? new Date(license.expires_at).toLocaleDateString()
                          : "Нет срока"
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        {license.is_active && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeactivateLicense(license.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
