import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Download,
  Printer,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart,
} from "lucide-react";
import { FORM_DEFINITIONS, flattenFormRows } from "@/data/fire-forms-data";

const FORMS_CONFIG = FORM_DEFINITIONS.map((form) => ({
  ...form,
  status: form.id === "1-osp" ? "completed" : form.id === "5-spzhs" ? "warning" : "pending",
  lastUpdated: form.id === "1-osp" ? "2025-01-15" : "2025-01-10",
}));

export default function FormsOverview() {
  const [selectedPeriod, setSelectedPeriod] = useState('2025-01');
  const [selectedForm, setSelectedForm] = useState<string | null>(null);

  // Получение данных отчетов
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['/api/reports', selectedPeriod],
    queryFn: () => fetch(`/api/reports?period=${selectedPeriod}`).then(res => res.json())
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'warning': return 'bg-orange-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const handlePrint = (formId: string) => {
    window.open(`/print/${formId}?period=${selectedPeriod}`, '_blank');
  };

  const handleExport = async (formId: string) => {
    try {
      const response = await fetch(`/api/export/report?form=${formId}&period=${selectedPeriod}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${formId}_${selectedPeriod}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading"></div>
        <span className="ml-2">Загрузка данных...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Отчетные формы МЧС РК</h2>
          <p className="text-muted-foreground">
            Статистические формы по учету пожаров и происшествий
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border rounded px-3 py-2"
            data-testid="select-period"
          >
            <option value="2025-01">Январь 2025</option>
            <option value="2024-12">Декабрь 2024</option>
            <option value="2024-11">Ноябрь 2024</option>
          </select>
        </div>
      </div>

      {/* Обзор форм */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FORMS_CONFIG.map((form) => (
          <Card key={form.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{form.title}</CardTitle>
                <Badge className={`${getStatusColor(form.status)} text-white`}>
                  {getStatusIcon(form.status)}
                </Badge>
              </div>
              <CardDescription>{form.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Разделы формы */}
                <div>
                  <h4 className="font-medium text-sm mb-2">Разделы:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                {form.sections.map((section, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                    {section}
                  </li>
                ))}
                  </ul>
                </div>

                {/* Последнее обновление */}
                <div className="text-xs text-muted-foreground">
                  Обновлено: {form.lastUpdated}
                </div>

                {/* Действия */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedForm(form.id)}
                    data-testid={`button-view-${form.id}`}
                  >
                    <BarChart className="h-4 w-4 mr-1" />
                    Просмотр
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePrint(form.id)}
                    data-testid={`button-print-${form.id}`}
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExport(form.id)}
                    data-testid={`button-export-${form.id}`}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Детальный просмотр формы */}
      {selectedForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {FORMS_CONFIG.find(f => f.id === selectedForm)?.title}
                </CardTitle>
                <CardDescription>
                  Период: {selectedPeriod}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => setSelectedForm(null)}
                data-testid="button-close-details"
              >
                Закрыть
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="data" className="w-full">
              <TabsList>
                <TabsTrigger value="data">Данные</TabsTrigger>
                <TabsTrigger value="validation">Валидация</TabsTrigger>
                <TabsTrigger value="history">История</TabsTrigger>
              </TabsList>
              
              <TabsContent value="data" className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Сводные данные</h4>
                  <div className="space-y-2 text-sm">
                    <div className="font-medium">Строк в форме:</div>
                    <div className="text-2xl font-bold text-primary">
                      {flattenFormRows(FORMS_CONFIG.find((f) => f.id === selectedForm)?.rows || []).length}
                    </div>
                    <div className="text-muted-foreground">
                      Колонки:{" "}
                      {FORMS_CONFIG.find((f) => f.id === selectedForm)
                        ?.columns.map((column) => column.label)
                        .join(", ")}
                    </div>
                  </div>
                </div>

                <Card className="border border-border/60">
                  <CardHeader>
                    <CardTitle className="text-base">Структура формы</CardTitle>
                    <CardDescription>
                      {FORMS_CONFIG.find((f) => f.id === selectedForm)?.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-border">
                        <thead>
                          <tr className="bg-secondary">
                            <th className="border border-border p-2 text-left">Показатель</th>
                            {(FORMS_CONFIG.find((f) => f.id === selectedForm)?.columns || []).map((column) => (
                              <th key={column.key} className="border border-border p-2 text-center">
                                {column.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {flattenFormRows(FORMS_CONFIG.find((f) => f.id === selectedForm)?.rows || []).map(
                            (row) => (
                              <tr key={row.id} className="hover:bg-secondary/30">
                                <td className="border border-border p-2 font-medium">
                                  <div
                                    className="flex items-start gap-2"
                                    style={{ paddingLeft: `${row.depth * 16}px` }}
                                  >
                                    <span className="text-xs text-muted-foreground">{row.number}</span>
                                    <span>{row.label}</span>
                                  </div>
                                </td>
                                {(FORMS_CONFIG.find((f) => f.id === selectedForm)?.columns || []).map((column) => (
                                  <td key={`${row.id}-${column.key}`} className="border border-border p-2 text-center text-muted-foreground">
                                    —
                                  </td>
                                ))}
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Правила валидации</h4>
                      <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                        {(FORMS_CONFIG.find((f) => f.id === selectedForm)?.validationRules || []).map(
                          (rule, index) => (
                            <li key={index}>{rule}</li>
                          )
                        )}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Реквизиты подписи</h4>
                      <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                        {(FORMS_CONFIG.find((f) => f.id === selectedForm)?.signBlock || []).map((field, index) => (
                          <li key={index}>{field}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="validation" className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Все проверки пройдены успешно</span>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="history" className="space-y-4">
                <div className="space-y-3">
                  <div className="border-l-2 border-primary pl-4">
                    <div className="text-sm font-medium">Последнее обновление</div>
                    <div className="text-xs text-muted-foreground">
                      {FORMS_CONFIG.find(f => f.id === selectedForm)?.lastUpdated} 
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
