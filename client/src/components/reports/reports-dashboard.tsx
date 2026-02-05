import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Percent,
  Download,
  Send,
  Flame,
  AlertTriangle,
  Building,
  Home,
  TreePine
} from "lucide-react";

// Импорт компонентов форм
import Form1OSP from "./form-1-osp";
import Form2SSG from "./form-2-ssg";
import Form3SPVP from "./form-3-spvp";
import Form4SOVP from "./form-4-sovp";
import Form5SPZHS from "./form-5-spzhs";
import Form6SSPZ from "./form-6-sspz";
import FormCO from "./form-co";
import { useReportPeriod } from "./use-report-period";

interface ReportStatus {
  id: string;
  name: string;
  index: string;
  status: 'draft' | 'completed' | 'submitted' | 'overdue';
  dueDate: string;
  lastUpdated?: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface ReportsSummaryResponse {
  ok: boolean;
  data?: {
    period: string;
    forms: Record<
      string,
      {
        completionPercent: number;
        totalFields: number;
        emptyFields: number;
        validationErrors: number;
      }
    >;
  };
}

export default function ReportsDashboard() {
  const { periodKey, store, updatePreset } = useReportPeriod();
  const { data: summaryData } = useQuery<ReportsSummaryResponse>({
    queryKey: ["/api/reports/summary", periodKey],
    queryFn: async () => {
      const response = await fetch(`/api/reports/summary?period=${periodKey}`);
      return response.json();
    },
  });

  const reports: ReportStatus[] = [
    {
      id: '1-osp',
      name: 'Общие сведения о пожарах и гибели людей',
      index: '1-ОСП',
      status: 'completed',
      dueDate: '2025-01-27',
      lastUpdated: '2025-01-25',
      icon: FileText,
      description: 'Основная форма учета пожаров с данными о жертвах и ущербе'
    },
    {
      id: '2-ssg',
      name: 'Сведения о случаях горения, не подлежащие учету как пожары',
      index: '2-ССГ',
      status: 'draft',
      dueDate: '2025-01-27',
      icon: Flame,
      description: 'Учет случаев горения, которые не классифицируются как пожары'
    },
    {
      id: '3-spvp',
      name: 'Сведения о причинах возникновения пожаров',
      index: '3-СПВП',
      status: 'draft',
      dueDate: '2025-01-27',
      icon: AlertCircle,
      description: 'Детальная классификация причин возникновения пожаров'
    },
    {
      id: '4-sovp',
      name: 'Сведения об объектах возникновения пожаров',
      index: '4-СОВП',
      status: 'draft',
      dueDate: '2025-01-27',
      icon: Building,
      description: 'Классификация объектов по типам и категориям'
    },
    {
      id: '5-spzhs',
      name: 'Сведения о пожарах в жилом секторе',
      index: '5-СПЖС',
      status: 'draft',
      dueDate: '2025-01-27',
      icon: Home,
      description: 'Специализированная отчетность по жилому сектору'
    },
    {
      id: '6-sspz',
      name: 'Сведения о степных пожарах и загораниях',
      index: '6-ССПЗ',
      status: 'draft',
      dueDate: '2025-01-27',
      icon: TreePine,
      description: 'Учет природных пожаров и загораний на открытых территориях'
    },
    {
      id: 'co',
      name: 'Сведения о погибших и травмированных от отравления угарным газом',
      index: '7-CO',
      status: 'draft',
      dueDate: '2025-01-27',
      icon: AlertTriangle,
      description: 'Случаи отравления угарным газом без возникновения пожара'
    }
  ];

  const getStatusColor = (status: ReportStatus['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'submitted': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: ReportStatus['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'submitted': return <Send className="h-4 w-4" />;
      case 'overdue': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: ReportStatus['status']) => {
    switch (status) {
      case 'completed': return 'Готов к отправке';
      case 'submitted': return 'Отправлен';
      case 'overdue': return 'Просрочен';
      default: return 'Черновик';
    }
  };

  const renderReportForm = (reportId: string) => {
    switch (reportId) {
      case '1-osp': return <Form1OSP />;
      case '2-ssg': return <Form2SSG />;
      case '3-spvp': return <Form3SPVP />;
      case '4-sovp': return <Form4SOVP />;
      case '5-spzhs': return <Form5SPZHS />;
      case '6-sspz': return <Form6SSPZ />;
      case 'co': return <FormCO />;
      default: 
        return (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Форма {reportId} в разработке</p>
            </CardContent>
          </Card>
        );
    }
  };

  const reportPeriodLabel = (() => {
    const from = store.report.from;
    const to = store.report.to;
    if (!from && !to) return periodKey;
    if (from && to && from !== to) {
      return `${from} — ${to}`;
    }
    return from || to || periodKey;
  })();

  const journalPeriodLabel = (() => {
    const from = store.journal.from;
    const to = store.journal.to;
    if (!from && !to) return "не выбран";
    if (from && to && from !== to) {
      return `${from} — ${to}`;
    }
    return from || to || "не выбран";
  })();

  const handleUseJournalPeriod = () => {
    updatePreset("report", store.journal);
  };

  const isJournalEmpty = !store.journal.from && !store.journal.to;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Формы отчетности МЧС РК</h1>
          <p className="text-muted-foreground">
            Ежемесячные формы согласно Приказу № 377 от 28.08.2025
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">Отчетный период: {reportPeriodLabel}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Период журнала: {journalPeriodLabel}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUseJournalPeriod}
              disabled={isJournalEmpty}
            >
              Использовать период журнала
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="1-osp" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="1-osp">1-ОСП</TabsTrigger>
          <TabsTrigger value="2-ssg">2-ССГ</TabsTrigger>
          <TabsTrigger value="3-spvp">3-СПВП</TabsTrigger>
          <TabsTrigger value="4-sovp">4-СОВП</TabsTrigger>
          <TabsTrigger value="5-spzhs">5-СПЖС</TabsTrigger>
          <TabsTrigger value="6-sspz">6-ССПЗ</TabsTrigger>
          <TabsTrigger value="co">7-CO</TabsTrigger>
        </TabsList>

        <TabsContent value="1-osp">{renderReportForm('1-osp')}</TabsContent>
        <TabsContent value="2-ssg">{renderReportForm('2-ssg')}</TabsContent>
        <TabsContent value="3-spvp">{renderReportForm('3-spvp')}</TabsContent>
        <TabsContent value="4-sovp">{renderReportForm('4-sovp')}</TabsContent>
        <TabsContent value="5-spzhs">{renderReportForm('5-spzhs')}</TabsContent>
        <TabsContent value="6-sspz">{renderReportForm('6-sspz')}</TabsContent>
        <TabsContent value="co">{renderReportForm('co')}</TabsContent>
      </Tabs>
    </div>
  );
}
