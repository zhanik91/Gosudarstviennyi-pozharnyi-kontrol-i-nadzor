import { useEffect, useState } from "react";
import { ArrowLeft, ClipboardList, FileText } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/layout/footer";
import BreadcrumbNavigation from "@/components/ui/breadcrumb-navigation";
import { Button } from "@/components/ui/button";
import AdminPracticesPage from "@/pages/admin-practices";

const tabs = [
  { id: "journal", label: "📋 Журнал административной практики", icon: ClipboardList },
  { id: "reports", label: "📷 Отчёты (фото)", icon: FileText },
] as const;

type TabType = (typeof tabs)[number]["id"];

export default function AdminPracticesModule() {
  const [activeTab, setActiveTab] = useState<TabType>("journal");
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab") as TabType;
    if (tab && tabs.some((item) => item.id === tab)) {
      setActiveTab(tab);
    }
  }, []);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.pushState({}, "", url.toString());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground portal-bg">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Загрузка модуля...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground portal-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <BreadcrumbNavigation />
        <div className="flex items-center">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="outline" size="sm" data-testid="button-back">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h2 className="text-2xl font-bold text-foreground">Административные практики</h2>
          </div>
        </div>

        <div className="border-b border-border">
          <nav className="flex space-x-8 overflow-x-auto custom-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
                data-testid={`tab-${tab.id}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="fade-in">
          {activeTab === "journal" && <AdminPracticesPage />}
          {activeTab === "reports" && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Отчётность с фотофиксацией</h3>
                <p className="text-sm text-muted-foreground">
                  Раздел в разработке. Здесь появятся фотопротоколы, карточки нарушений и отчёты
                  по административной практике.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-4">
                  <p className="text-sm font-medium text-foreground">Будущие возможности</p>
                  <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                    <li>• Загрузка фотоматериалов и доказательной базы</li>
                    <li>• Формирование отчётов по нарушениям и инспекторам</li>
                    <li>• Экспорт PDF с привязкой к протоколам</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-4">
                  <p className="text-sm font-medium text-foreground">Планируемые интеграции</p>
                  <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                    <li>• Хранилище фото- и видеофиксаций</li>
                    <li>• Привязка к маршрутам проверок</li>
                    <li>• Уведомления о статусах согласования</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
        <Footer />
      </div>
    </div>
  );
}
