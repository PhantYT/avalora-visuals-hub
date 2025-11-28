import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { z } from "zod";
import { Mail, Lock, User, ArrowLeft } from "lucide-react";

const authSchema = z.object({
  email: z.string().email({ message: "Неверный формат email" }),
  password: z.string().min(6, { message: "Пароль должен быть минимум 6 символов" }),
  username: z.string().min(3, { message: "Имя пользователя должно быть минимум 3 символа" }).optional(),
});

const emailSchema = z.object({
  email: z.string().email({ message: "Неверный формат email" }),
});

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [resetMode, setResetMode] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      authSchema.omit({ username: true }).parse({ email, password });

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Успешно!",
        description: "Вы вошли в систему",
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Ошибка валидации",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Ошибка входа",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      authSchema.parse({ email, password, username });

      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username,
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Проверьте почту!",
        description: "Мы отправили вам письмо для подтверждения аккаунта",
      });

      setEmail("");
      setPassword("");
      setUsername("");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Ошибка валидации",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Ошибка регистрации",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      emailSchema.parse({ email });

      const redirectUrl = `${window.location.origin}/auth`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      toast({
        title: "Проверьте почту!",
        description: "Мы отправили вам ссылку для восстановления пароля",
      });

      setResetMode(false);
      setEmail("");
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
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar user={null} />
      
      <div className="container mx-auto px-4 pt-24 pb-12 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md bg-card/50 backdrop-blur-xl border-primary/20 shadow-card-custom">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {resetMode ? "Восстановление пароля" : "Добро пожаловать"}
            </CardTitle>
            <CardDescription>
              {resetMode 
                ? "Введите email для восстановления пароля" 
                : "Войдите или создайте новый аккаунт"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {resetMode ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    Email
                  </Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-background/50 border-primary/20 focus:border-primary"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 shadow-glow"
                  disabled={loading}
                >
                  {loading ? "Отправка..." : "Отправить ссылку"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setResetMode(false);
                    setEmail("");
                  }}
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Назад к входу
                </Button>
              </form>
            ) : (
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="signin">Вход</TabsTrigger>
                  <TabsTrigger value="signup">Регистрация</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-primary" />
                        Email
                      </Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-background/50 border-primary/20 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password" className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-primary" />
                        Пароль
                      </Label>
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-background/50 border-primary/20 focus:border-primary"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setResetMode(true)}
                      className="px-0 text-primary hover:text-primary/80"
                    >
                      Забыли пароль?
                    </Button>
                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary/90 shadow-glow"
                      disabled={loading}
                    >
                      {loading ? "Вход..." : "Войти"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-username" className="flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        Имя пользователя
                      </Label>
                      <Input
                        id="signup-username"
                        type="text"
                        placeholder="Ваше имя"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="bg-background/50 border-primary/20 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-primary" />
                        Email
                      </Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-background/50 border-primary/20 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-primary" />
                        Пароль
                      </Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-background/50 border-primary/20 focus:border-primary"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-glow"
                      disabled={loading}
                    >
                      {loading ? "Регистрация..." : "Создать аккаунт"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;