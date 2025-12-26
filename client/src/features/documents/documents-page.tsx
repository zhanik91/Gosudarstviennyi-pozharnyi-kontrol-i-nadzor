import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DocumentUpload } from "./components";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { ErrorDisplay } from "@/components/ui/error-display";
import { 
  FileText, 
  Download, 
  Upload, 
  Search, 
  Filter,
  Calendar,
  Eye,
  Archive,
  CheckCircle,
  Clock,
  XCircle,
  Users,
  Building
} from "lucide-react";

// Типы документов с иконками и цветами
const documentTypeConfig = {
  'report_1_osp': { 
    label: 'Форма 1-ОСП', 
    icon: '📋',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
  },
  'report_2_ssg': { 
    label: 'Форма 2-ССГ', 
    icon: '📊',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  },
  'report_3_spvp': { 
    label: 'Форма 3-СПВП', 
    icon: '🔥',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  },
  'report_4_sovp': { 
    label: 'Форма 4-СОВП', 
    icon: '🏢',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
  },
  'report_5_spzhs': { 
    label: 'Форма 5-СПЖС', 
    icon: '👥',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
  },
  'report_6_sspz': { 
    label: 'Форма 6-ССПЗ', 
    icon: '🚒',
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300'
  },
  'report_co': { 
    label: 'Форма СО', 
    icon: '☠️',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  },
  'incident_photo': { 
    label: 'Фото происшествия', 
    icon: '📸',
    color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300'
  },
  'inspection_act': { 
    label: 'Акт проверки', 
    icon: '✅',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300'
  },
  'order': { 
    label: 'Приказ', 
    icon: '📜',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
  },
  'instruction': { 
    label: 'Инструкция', 
    icon: '📖',
    color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300'
  },
  'other': { 
    label: 'Другое', 
    icon: '📁',
    color: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300'
  }
};

// Статусы документов
const statusConfig = {
  'draft': { label: 'Черновик', icon: Clock, color: 'bg-gray-100 text-gray-700' },
  'pending': { label: 'На рассмотрении', icon: Eye, color: 'bg-yellow-100 text-yellow-700' },
  'approved': { label: 'Утвержден', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
  'rejected': { label: 'Отклонен', icon: XCircle, color: 'bg-red-100 text-red-700' },
  'archived': { label: 'Архивирован', icon: Archive, color: 'bg-blue-100 text-blue-700' }
};

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");

  // Загрузка документов
  const { data: documents = [], isLoading, error, refetch } = useQuery({
    queryKey: ['/api/documents', selectedType, selectedStatus, selectedPeriod],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedType) params.append('documentType', selectedType);
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedPeriod) params.append('period', selectedPeriod);
      
      const response = await fetch(`/api/documents?${params}`);
      if (!response.ok) throw new Error('Ошибка загрузки документов');
      return response.json();
    },
  });

  // Фильтрация документов по поисковому запросу
  const filteredDocuments = documents.filter((doc: any) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ''
  );

  // Статистика документов
  const stats = {
    total: documents.length,
    draft: documents.filter((d: any) => d.status === 'draft').length,
    pending: documents.filter((d: any) => d.status === 'pending').length,
    approved: documents.filter((d: any) => d.status === 'approved').length,
    rejected: documents.filter((d: any) => d.status === 'rejected').length,
  };

  const handleDownload = async (document: any) => {
    try {
      // Временная реализация - показываем информацию о документе
      alert(`Скачивание документа: ${document.title}\nТип: ${document.documentType}\nРазмер: ${document.fileSize} байт`);
    } catch (error) {
      console.error('Ошибка скачивания:', error);
    }
  };

  if (error) {
    return <ErrorDisplay message="Ошибка загрузки документов" onRetry={refetch} />;
  }

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Заголовок страницы */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            📋 Система документооборота
          </h1>
          <p className="text-muted-foreground mt-1">
            Управление документами и отчетами МЧС РК
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {stats.total} документов
          </span>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="flex items-center p-4">
            <FileText className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-muted-foreground">Всего</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-4">
            <Clock className="h-8 w-8 text-gray-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-muted-foreground">Черновики</p>
              <p className="text-2xl font-bold">{stats.draft}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-4">
            <Eye className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-muted-foreground">На проверке</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-muted-foreground">Утверждено</p>
              <p className="text-2xl font-bold">{stats.approved}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-4">
            <XCircle className="h-8 w-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-muted-foreground">Отклонено</p>
              <p className="text-2xl font-bold">{stats.rejected}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Основной интерфейс */}
      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Документы
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Загрузка
          </TabsTrigger>
        </TabsList>

        {/* Список документов */}
        <TabsContent value="documents" className="space-y-4">
          {/* Панель поиска и фильтров */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Поиск документов..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-search"
                    />
                  </div>
                </div>
                
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full md:w-[200px]" data-testid="select-type">
                    <SelectValue placeholder="Тип документа" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Все типы</SelectItem>
                    {Object.entries(documentTypeConfig).map(([value, config]) => (
                      <SelectItem key={value} value={value}>
                        {config.icon} {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full md:w-[180px]" data-testid="select-status">
                    <SelectValue placeholder="Статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Все статусы</SelectItem>
                    {Object.entries(statusConfig).map(([value, config]) => (
                      <SelectItem key={value} value={value}>
                        <config.icon className="h-4 w-4 mr-2 inline" />
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Input
                  type="month"
                  placeholder="Период"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full md:w-[160px]"
                  data-testid="input-period"
                />
              </div>
            </CardContent>
          </Card>

          {/* Список документов */}
          {isLoading ? (
            <LoadingIndicator message="Загружаем документы..." />
          ) : (
            <div className="grid gap-4">
              {filteredDocuments.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-muted-foreground mb-2">
                      Документы не найдены
                    </p>
                    <p className="text-sm text-muted-foreground text-center">
                      {searchQuery ? 
                        'Попробуйте изменить параметры поиска' : 
                        'Загрузите первый документ для начала работы'
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredDocuments.map((document: any) => {
                  const typeConfig = documentTypeConfig[document.documentType as keyof typeof documentTypeConfig];
                  const statusConf = statusConfig[document.status as keyof typeof statusConfig];
                  const StatusIcon = statusConf?.icon || FileText;

                  return (
                    <Card key={document.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-2xl">{typeConfig?.icon || '📄'}</span>
                              <div>
                                <h3 className="font-semibold text-lg">{document.title}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className={typeConfig?.color || ''}>
                                    {typeConfig?.label || document.documentType}
                                  </Badge>
                                  <Badge variant="outline" className={statusConf?.color || ''}>
                                    <StatusIcon className="h-3 w-3 mr-1" />
                                    {statusConf?.label || document.status}
                                  </Badge>
                                  {document.period && (
                                    <Badge variant="secondary">
                                      <Calendar className="h-3 w-3 mr-1" />
                                      {document.period}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            {document.description && (
                              <p className="text-muted-foreground mb-3 line-clamp-2">
                                {document.description}
                              </p>
                            )}

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>📅 {new Date(document.createdAt).toLocaleDateString('ru-RU')}</span>
                              {document.fileSize && (
                                <span>💾 {Math.round(document.fileSize / 1024)} КБ</span>
                              )}
                              <span>👤 {document.createdBy}</span>
                            </div>
                          </div>

                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(document)}
                              data-testid={`button-download-${document.id}`}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </TabsContent>

        {/* Загрузка документов */}
        <TabsContent value="upload" className="space-y-4">
          <div className="flex justify-center">
            <DocumentUpload />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
