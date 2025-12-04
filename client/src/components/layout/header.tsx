import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Header() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <header className="gov-header" data-testid="main-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div>
              <Link href="/">
                <h1 className="gov-title cursor-pointer hover:opacity-90" data-testid="header-title">
                  Информационная система государственного пожарного контроля Комитета
                  противопожарной службы МЧС РК
                </h1>
              </Link>
              <p className="gov-subtitle">Комитет противопожарной службы МЧС РК</p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <Link href="/audit-conclusions">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:text-white hover:bg-white/10 font-medium"
                data-testid="link-audit-conclusions"
              >
                Журнал заключений аудитов
              </Button>
            </Link>

            <div className="text-right text-sm border-l border-white/20 pl-6">
              <div className="text-white font-medium" data-testid="user-fullname">
                {(user as any)?.fullName || "Пользователь"}
              </div>
              <div className="text-white/70 text-xs" data-testid="user-region">
                {(user as any)?.region}
                {(user as any)?.district && ` / ${(user as any)?.district}`}
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => (window.location.href = "/api/logout")}
              className="text-white hover:text-white hover:bg-white/10 font-medium"
              data-testid="button-logout"
            >
              Выход
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
