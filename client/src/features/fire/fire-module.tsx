import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/layout/footer";
import BreadcrumbNavigation from "@/components/ui/breadcrumb-navigation";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { IncidentFormOSP, IncidentsJournal, PackagesPanel, ReportsPanel } from "./components";
import { ReportsFormsOverview as FormsOverview, ReportsSimpleAnalytics as SimpleAnalytics } from "@/features/reports";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Upload } from "lucide-react";
import { Link } from "wouter";

type TabType = 'journal' | 'reports' | 'charts' | 'packages' | 'forms';

export default function FireModule() {
  const [activeTab, setActiveTab] = useState<TabType>('journal');
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

  // Get tab from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as TabType;
    if (tab && ['journal', 'reports', 'charts', 'packages', 'forms'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.pushState({}, '', url.toString());
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
    <AuroraBackground>
      <div className="min-h-screen text-foreground bg-white/80 backdrop-blur-md shadow-xl rounded-xl max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <BreadcrumbNavigation />
        {/* Module Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="outline" size="sm" data-testid="button-back">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h2 className="text-2xl font-bold text-foreground">Государственный учёт пожаров</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" data-testid="button-export">
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Экспорт</span>
            </Button>
            <Button variant="outline" size="sm" data-testid="button-import">
              <Upload className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Импорт</span>
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-border">
          <nav className="flex space-x-8 overflow-x-auto custom-scrollbar">
            {[
              { id: 'journal', label: '📋 Журнал пожаров' },
              { id: 'forms', label: '📄 Отчетные формы' },
              { id: 'charts', label: '📊 Диаграммы' },
              { id: 'packages', label: '📦 Пакеты данных' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as TabType)}
                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
                data-testid={`tab-${tab.id}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="fade-in">
          {activeTab === 'journal' && (
            <div className="space-y-6">
              <IncidentFormOSP />
              <IncidentsJournal />
            </div>
          )}
          {activeTab === 'forms' && <FormsOverview />}
          {activeTab === 'reports' && <ReportsPanel />}
          {activeTab === 'charts' && <SimpleAnalytics />}
          {activeTab === 'packages' && <PackagesPanel />}
        </div>
        <Footer />
      </div>
    </AuroraBackground>
  );
}
