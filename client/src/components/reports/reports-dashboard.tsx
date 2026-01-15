import { useState } from "react";
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

export default function ReportsDashboard() {
  const [currentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Формы отчетности МЧС РК</h1>
          <p className="text-muted-foreground">
            Ежемесячные формы согласно Приказу № 377 от 28.08.2025
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span className="text-sm">Отчетный период: {currentMonth}</span>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="dashboard">Дашборд</TabsTrigger>
          <TabsTrigger value="1-osp">1-ОСП</TabsTrigger>
          <TabsTrigger value="2-ssg">2-ССГ</TabsTrigger>
          <TabsTrigger value="3-spvp">3-СПВП</TabsTrigger>
          <TabsTrigger value="4-sovp">4-СОВП</TabsTrigger>
          <TabsTrigger value="5-spzhs">5-СПЖС</TabsTrigger>
          <TabsTrigger value="6-sspz">6-ССПЗ</TabsTrigger>
          <TabsTrigger value="co">7-CO</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Всего форм</p>
                    <p className="text-2xl font-bold">{reports.length}</p>
                  </div>
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Готовы</p>
                    <p className="text-2xl font-bold text-green-600">
                      {reports.filter(r => r.status === 'completed').length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">В работе</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {reports.filter(r => r.status === 'draft').length}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Отправлены</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {reports.filter(r => r.status === 'submitted').length}
                    </p>
                  </div>
                  <Send className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Статус форм отчетности</CardTitle>
              <p className="text-sm text-muted-foreground">
                Срок подачи всех форм: до 27 числа отчетного месяца
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reports.map((report) => {
                  const IconComponent = report.icon;
                  return (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <IconComponent className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{report.index}</div>
                          <div className="text-sm text-muted-foreground">{report.name}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(report.status)}>
                          {getStatusIcon(report.status)}
                          {getStatusText(report.status)}
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                          до {new Date(report.dueDate).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-900/20">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">Требования к отчетности</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Формы заполняются на государственном и русском языках</p>
                <p>• Ущерб указывается в тысячах тенге с точностью до одного десятичного знака</p>
                <p>• Формы подписываются руководителем департамента</p>
                <p>• Срок подачи: до 27 числа отчетного месяца</p>
                <p>• Получатель: Комитет противопожарной службы МЧС РК</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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
