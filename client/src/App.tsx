import { ComponentType, ReactNode, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/layout/header";
import ErrorBoundary from "@/components/system/error-boundary";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import AdminPanel from "@/pages/admin-panel";
import DocumentsPage from "@/pages/documents-page";
import CRMDashboard from "@/pages/crm-dashboard";
import AdvancedAnalytics from "@/pages/advanced-analytics";
import DocumentManagement from "@/pages/document-management";
import NotificationsSystem from "@/pages/notifications-system";
import InteractiveMaps from "@/pages/interactive-maps";
import AuditConclusionsJournal from "@/pages/audit-conclusions-journal";
import JournalsListsModule from "@/pages/journals-lists-module";
import MobileField from "@/pages/mobile-field";
import Home from "@/pages/home";
import FireModule from "@/pages/fire-module";
import ControlSupervision from "@/pages/control-supervision";
import LoginPage from "@/pages/login";
import CalculatorsPage from "@/pages/calculators";
import FireExtinguishersCalculator from "@/pages/calculators/fire-extinguishers";
import NGPSCalculator from "@/pages/calculators/ngps";
import ExplosionCategoryCalculator from "@/pages/calculators/explosion-category";
import AIAssistantPage from "@/pages/ai-assistant";
import NormativeDocumentsPage from "@/pages/normative-documents";

type ProtectedRouteProps = {
  component: ComponentType;
};

function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="min-h-[calc(100vh-4rem)] pb-10">{children}</main>
    </div>
  );
}

function ProtectedRoute({ component: Component }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isError } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isError) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, isLoading, isError, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Проверяем сессию...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        Не удалось проверить авторизацию. Попробуйте обновить страницу.
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppShell>
      <Component />
    </AppShell>
  );
}

function Router() {
  const protectedRoute = (component: ComponentType) => () => (
    <ProtectedRoute component={component} />
  );

  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/" component={protectedRoute(Home)} />
      <Route path="/fire-module" component={protectedRoute(FireModule)} />
      <Route path="/journals-lists" component={protectedRoute(JournalsListsModule)} />
      <Route path="/audit-conclusions" component={protectedRoute(AuditConclusionsJournal)} />
      <Route path="/controlled-objects" component={protectedRoute(ControlSupervision)} />
      <Route path="/incidents/new" component={protectedRoute(FireModule)} />
      <Route path="/reports" component={protectedRoute(FireModule)} />
      <Route path="/documents" component={protectedRoute(DocumentsPage)} />
      <Route path="/document-management" component={protectedRoute(DocumentManagement)} />
      <Route path="/notifications" component={protectedRoute(NotificationsSystem)} />
      <Route path="/maps" component={protectedRoute(InteractiveMaps)} />
      <Route path="/mobile-field" component={protectedRoute(MobileField)} />
      <Route path="/crm" component={protectedRoute(CRMDashboard)} />
      <Route path="/analytics" component={protectedRoute(AdvancedAnalytics)} />
      <Route path="/admin" component={protectedRoute(AdminPanel)} />
      <Route path="/calculators" component={protectedRoute(CalculatorsPage)} />
      <Route path="/calculators/fire-extinguishers" component={protectedRoute(FireExtinguishersCalculator)} />
      <Route path="/calculators/ngps" component={protectedRoute(NGPSCalculator)} />
      <Route path="/calculators/explosion-category" component={protectedRoute(ExplosionCategoryCalculator)} />
      <Route path="/ai-assistant" component={protectedRoute(AIAssistantPage)} />
      <Route path="/normative-documents" component={protectedRoute(NormativeDocumentsPage)} />
      <Route component={protectedRoute(NotFound)} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <ErrorBoundary>
          <Router />
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
