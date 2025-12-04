import { useAuth } from "@/hooks/useAuth";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Header() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <header className="gov-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="gov-title">Государственный пожарный контроль</h1>
              <p className="gov-subtitle">Комитет противопожарной службы МЧС РК</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Навигация: Журнал заключений аудитов */}
            <Link href="/audit-conclusions">
              <Button
                variant="ghost"
                size="sm"
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                Журнал заключений аудитов
              </Button>
            </Link>

            <div className="text-right text-sm">
              <div className="text-white font-medium">
                {(user as any)?.fullName || "Пользователь"}
              </div>
              <div className="text-white/70 text-xs">
                {(user as any)?.region}
                {(user as any)?.district && ` / ${(user as any)?.district}`}
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => (window.location.href = "/api/logout")}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              Выход
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
