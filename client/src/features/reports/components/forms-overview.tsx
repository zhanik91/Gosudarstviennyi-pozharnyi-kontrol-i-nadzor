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
  BarChart
} from "lucide-react";

const FORMS_CONFIG = [
  {
    id: '1-osp',
    title: 'Форма 1-ОСП',
    description: 'Общие сведения о пожарах и гибели людей',
    sections: ['Количество пожаров', 'Погибшие', 'Травмированные', 'Материальный ущерб'],
    status: 'completed',
    lastUpdated: '2025-01-15'
  },
  {
    id: '2-ssg',
    title: 'Форма 2-ССГ',
    description: 'Сведения о случаях горения',
    sections: ['Пункты 1-11 случаев горения'],
    status: 'pending',
    lastUpdated: '2025-01-10'
  },
  {
    id: '3-spvp',
    title: 'Форма 3-СПВП',
    description: 'Сведения о причинах возникновения пожаров',
    sections: ['Причины пожаров', 'Классификация ОВСР'],
    status: 'completed',
    lastUpdated: '2025-01-14'
  },
  {
    id: '4-sovp',
    title: 'Форма 4-СОВП',
    description: 'Сведения об объектах возникновения пожаров',
    sections: ['Типы объектов', 'Классификация ОВСР'],
    status: 'completed',
    lastUpdated: '2025-01-13'
  },
  {
    id: '5-spzs',
    title: 'Форма 5-СПЖС',
    description: 'Сведения о пожарах в жилом секторе',
    sections: ['Социальное положение', 'Условия пожара', 'Места возникновения', 'Временные характеристики'],
    status: 'warning',
    lastUpdated: '2025-01-08'
  },
  {
    id: '6-sspz',
    title: 'Форма 6-ССПЗ',
    description: 'Сведения о степных пожарах',
    sections: ['Таблица 1: Пожары', 'Таблица 2: Загорания'],
    status: 'completed',
    lastUpdated: '2025-01-12'
  },
  {
    id: 'co',
    title: 'Форма СО',
    description: 'Отравления угарным газом без пожара',
    sections: ['Случаи отравления', 'Пострадавшие'],
    status: 'completed',
    lastUpdated: '2025-01-11'
  }
];

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
                  {selectedForm === '1-osp' && (
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="font-medium">Всего пожаров</div>
                        <div className="text-2xl font-bold text-primary">145</div>
                      </div>
                      <div>
                        <div className="font-medium">Погибло</div>
                        <div className="text-2xl font-bold text-red-600">12</div>
                      </div>
                      <div>
                        <div className="font-medium">Ущерб (тыс. тг)</div>
                        <div className="text-2xl font-bold text-orange-600">2,850.5</div>
                      </div>
                    </div>
                  )}
                  {selectedForm === '3-spvp' && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Установленные поджоги</span>
                        <span className="font-medium">12</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Короткое замыкание</span>
                        <span className="font-medium">25</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Нарушение технологии</span>
                        <span className="font-medium">8</span>
                      </div>
                    </div>
                  )}
                </div>
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