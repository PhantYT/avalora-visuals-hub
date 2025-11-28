import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Calendar, Edit2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProfileCardProps {
  user: any;
  profile: any;
  onProfileUpdate: () => void;
}

export const ProfileCard = ({ user, profile, onProfileUpdate }: ProfileCardProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(profile?.username || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          username,
          avatar_url: avatarUrl,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Профиль обновлен",
        description: "Ваши данные успешно сохранены",
      });
      setIsEditing(false);
      onProfileUpdate();
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="bg-gradient-card border-primary/20 shadow-card-custom">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Профиль
          </CardTitle>
          {!isEditing ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="hover:bg-primary/10"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Редактировать
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setUsername(profile?.username || "");
                  setAvatarUrl(profile?.avatar_url || "");
                }}
                className="hover:bg-destructive/10"
              >
                <X className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                disabled={loading}
                className="hover:bg-primary/10"
              >
                <Check className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
        <CardDescription>Управление вашим профилем</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-6">
          <Avatar className="w-24 h-24 border-2 border-primary/30 shadow-glow">
            <AvatarImage src={avatarUrl} alt={username} />
            <AvatarFallback className="bg-primary/20 text-2xl">
              {getInitials(username || "User")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-2">
                <Label htmlFor="avatar-url">URL аватара</Label>
                <Input
                  id="avatar-url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="bg-background/50 border-primary/20"
                />
              </div>
            ) : (
              <div>
                <h3 className="text-2xl font-bold">{username}</h3>
                <p className="text-foreground/60">ID: {user.id.slice(0, 8)}...</p>
              </div>
            )}
          </div>
        </div>

        {/* Username */}
        {isEditing && (
          <div className="space-y-2">
            <Label htmlFor="username">Имя пользователя</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ваше имя"
              className="bg-background/50 border-primary/20"
            />
          </div>
        )}

        {/* Email (read-only) */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            Email
          </Label>
          <div className="p-3 rounded-lg bg-background/50 border border-primary/10 text-foreground/70">
            {user.email}
          </div>
        </div>

        {/* Registration date */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Дата регистрации
          </Label>
          <div className="p-3 rounded-lg bg-background/50 border border-primary/10 text-foreground/70">
            {new Date(profile?.created_at).toLocaleDateString("ru-RU", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};