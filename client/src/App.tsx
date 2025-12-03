import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import MobileField from "@/pages/mobile-field";
import Home from "@/pages/home";
import FireModule from "@/pages/fire-module";
import ControlSupervision from "@/pages/control-supervision";
import LoginPage from "@/pages/login";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/login" component={LoginPage} />
          <Route path="/" component={LoginPage} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/fire-module" component={FireModule} />
          <Route path="/audit-conclusions" component={AuditConclusionsJournal} />
          <Route path="/controlled-objects" component={ControlSupervision} />
          <Route path="/incidents/new" component={FireModule} />
          <Route path="/reports" component={FireModule} />
          <Route path="/documents" component={DocumentsPage} />
          <Route path="/document-management" component={DocumentManagement} />
          <Route path="/notifications" component={NotificationsSystem} />
          <Route path="/maps" component={InteractiveMaps} />
          <Route path="/mobile-field" component={MobileField} />
          <Route path="/crm" component={CRMDashboard} />
          <Route path="/analytics" component={AdvancedAnalytics} />
          <Route path="/admin" component={AdminPanel} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
