import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, LogOut, Shield, MapPin } from "lucide-react";
import { apiRequest } from "@/utils/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function UserInfo() {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/logout");
      window.location.href = "/";
    } catch (error) {
      toast({
        title: "Ошибка выхода",
        description: "Не удалось выйти из системы",
        variant: "destructive"
      });
    }
  };

  if (!user) return null;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive" className="text-xs">Администратор</Badge>;
      case 'reviewer':
        return <Badge variant="secondary" className="text-xs">Проверяющий</Badge>;
      case 'approver':
        return <Badge variant="outline" className="text-xs">Утверждающий</Badge>;
      default:
        return <Badge variant="default" className="text-xs">Редактор</Badge>;
    }
  };

  return (
    <div className="flex items-center gap-4 bg-card/50 backdrop-blur-sm px-4 py-2 rounded-lg border">
      <div className="flex items-center gap-2">
        <User className="h-5 w-5 text-primary" />
        <div className="text-sm">
          <div className="font-medium">{user.fullName}</div>
          <div className="text-muted-foreground text-xs flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {user.region}
            {user.district && ` / ${user.district}`}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {getRoleBadge(user.role)}
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleLogout}
          className="h-8 px-2"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}