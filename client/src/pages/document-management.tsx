import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Upload, Search, Download, Eye, Trash2, Edit, Filter } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { ErrorDisplay } from '@/components/ui/error-display';

interface Document {
  id: string;
  title: string;
  documentType: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  organizationId: string;
  organizationName?: string;
  period: string;
  fileUrl?: string;
  fileSize?: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

const DOCUMENT_TYPES = [
  { value: '1-osp', label: 'Форма 1-ОСП' },
  { value: '2-ssg', label: 'Форма 2-ССГ' },
  { value: '3-spvp', label: 'Форма 3-СПВП' },
  { value: '4-sovp', label: 'Форма 4-СОВП' },
  { value: '5-spzhs', label: 'Форма 5-СПЖС' },
  { value: '6-sspz', label: 'Форма 6-ССПЗ' },
  { value: 'co', label: 'Сводный отчет' },
  { value: 'incident-report', label: 'Отчет по происшествию' },
  { value: 'inspection', label: 'Акт проверки' },
  { value: 'protocol', label: 'Протокол' }
];

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};

const STATUS_LABELS = {
  draft: 'Черновик',
  pending: 'На рассмотрении',
  approved: 'Утвержден',
  rejected: 'Отклонен'
};

export default function DocumentManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    documentType: '',
    period: '',
    description: ''
  });

  // Получение документов
  const { data: documents = [], isLoading, error } = useQuery<Document[]>({
    queryKey: ['/api/documents', { search: searchQuery, type: filterType, status: filterStatus, period: filterPeriod }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterType !== 'all') params.append('type', filterType);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterPeriod !== 'all') params.append('period', filterPeriod);
      
      const response = await fetch(`/api/documents?${params}`);
      if (!response.ok) throw new Error('Ошибка загрузки документов');
      return response.json();
    }
  });

  // Загрузка документа
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) throw new Error('Ошибка загрузки документа');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      setShowUploadDialog(false);
      setSelectedFile(null);
      setUploadForm({ title: '', documentType: '', period: '', description: '' });
    }
  });

  // Обновление статуса документа
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest('PUT', `/api/documents/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    }
  });

  // Удаление документа
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    }
  });

  const handleUpload = () => {
    if (!selectedFile || !uploadForm.title || !uploadForm.documentType) {
      alert('Заполните все обязательные поля');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', uploadForm.title);
    formData.append('documentType', uploadForm.documentType);
    formData.append('period', uploadForm.period);
    formData.append('description', uploadForm.description);

    uploadMutation.mutate(formData);
  };

  const formatFileSize = (bytes: number = 0) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getUniqueValues = (key: keyof Document) => {
    const values = documents.map(doc => doc[key]).filter(Boolean);
    return Array.from(new Set(values)) as string[];
  };

  if (isLoading) return <LoadingIndicator />;
  if (error) return <ErrorDisplay message={error.message || 'Произошла ошибка'} />;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Заголовок */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Управление документами</h1>
          <p className="text-gray-600 dark:text-gray-400">Централизованное хранение и управление документооборотом МЧС</p>
        </div>
        
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-upload-document" className="bg-blue-600 hover:bg-blue-700">
              <Upload className="w-4 h-4 mr-2" />
              Загрузить документ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Загрузка нового документа</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file">Файл документа *</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  data-testid="input-document-file"
                />
              </div>
              
              <div>
                <Label htmlFor="title">Название документа *</Label>
                <Input
                  id="title"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Введите название документа"
                  data-testid="input-document-title"
                />
              </div>
              
              <div>
                <Label htmlFor="type">Тип документа *</Label>
                <Select value={uploadForm.documentType} onValueChange={(value) => setUploadForm(prev => ({ ...prev, documentType: value }))}>
                  <SelectTrigger data-testid="select-document-type">
                    <SelectValue placeholder="Выберите тип документа" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="period">Отчетный период</Label>
                <Input
                  id="period"
                  value={uploadForm.period}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, period: e.target.value }))}
                  placeholder="Например: 2024-01"
                  data-testid="input-document-period"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Дополнительная информация о документе"
                  rows={3}
                  data-testid="textarea-document-description"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleUpload} 
                  disabled={uploadMutation.isPending}
                  className="flex-1"
                  data-testid="button-confirm-upload"
                >
                  {uploadMutation.isPending ? 'Загрузка...' : 'Загрузить'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowUploadDialog(false)}
                  data-testid="button-cancel-upload"
                >
                  Отмена
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Фильтры и поиск */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Фильтры и поиск
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">Поиск по названию</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск документов..."
                  className="pl-10"
                  data-testid="input-search-documents"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="filter-type">Тип документа</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48" data-testid="select-filter-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  {DOCUMENT_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="filter-status">Статус</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40" data-testid="select-filter-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="filter-period">Период</Label>
              <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                <SelectTrigger className="w-32" data-testid="select-filter-period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все периоды</SelectItem>
                  {getUniqueValues('period').map(period => (
                    <SelectItem key={period} value={period}>
                      {period}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Список документов */}
      <div className="grid gap-4">
        {documents.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Документы не найдены</p>
              <p className="text-sm">Загрузите первый документ или измените фильтры поиска</p>
            </CardContent>
          </Card>
        ) : (
          documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900 dark:text-white" data-testid={`text-document-title-${doc.id}`}>
                        {doc.title}
                      </h3>
                      <Badge className={STATUS_COLORS[doc.status]} data-testid={`badge-status-${doc.id}`}>
                        {STATUS_LABELS[doc.status]}
                      </Badge>
                      <Badge variant="outline" data-testid={`badge-version-${doc.id}`}>
                        v{doc.version}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <div>
                        <span className="font-medium">Тип:</span> {DOCUMENT_TYPES.find(t => t.value === doc.documentType)?.label || doc.documentType}
                      </div>
                      <div>
                        <span className="font-medium">Период:</span> {doc.period || 'Не указан'}
                      </div>
                      <div>
                        <span className="font-medium">Размер:</span> {formatFileSize(doc.fileSize)}
                      </div>
                      <div>
                        <span className="font-medium">Создан:</span> {new Date(doc.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Организация:</span> {doc.organizationName || 'Не указана'}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    {doc.fileUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(doc.fileUrl, '_blank')}
                        data-testid={`button-view-${doc.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {doc.fileUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = doc.fileUrl!;
                          link.download = doc.title;
                          link.click();
                        }}
                        data-testid={`button-download-${doc.id}`}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {doc.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => updateStatusMutation.mutate({ id: doc.id, status: 'approved' })}
                          disabled={updateStatusMutation.isPending}
                          data-testid={`button-approve-${doc.id}`}
                        >
                          Утвердить
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => updateStatusMutation.mutate({ id: doc.id, status: 'rejected' })}
                          disabled={updateStatusMutation.isPending}
                          data-testid={`button-reject-${doc.id}`}
                        >
                          Отклонить
                        </Button>
                      </>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => deleteMutation.mutate(doc.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${doc.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}