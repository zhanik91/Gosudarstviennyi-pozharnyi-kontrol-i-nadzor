import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Calendar, Tag } from 'lucide-react';

// Типы документов
const documentTypes = {
  'report_1_osp': '📋 Форма 1-ОСП',
  'report_2_ssg': '📊 Форма 2-ССГ', 
  'report_3_spvp': '🔥 Форма 3-СПВП',
  'report_4_sovp': '🏢 Форма 4-СОВП',
  'report_5_spzhs': '👥 Форма 5-СПЖС',
  'report_6_sspz': '🚒 Форма 6-ССПЗ',
  'report_co': '☠️ Форма СО',
  'incident_photo': '📸 Фото происшествия',
  'inspection_act': '✅ Акт проверки',
  'order': '📜 Приказ',
  'instruction': '📖 Инструкция',
  'other': '📁 Другое'
};

interface DocumentUploadForm {
  title: string;
  description?: string;
  documentType: string;
  period?: string;
  file?: FileList;
}

export function DocumentUpload() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<DocumentUploadForm>();

  // Мутация для загрузки документа
  const uploadMutation = useMutation({
    mutationFn: async (data: DocumentUploadForm) => {
      setIsUploading(true);
      
      const file = data.file?.[0];
      if (!file) throw new Error('Файл не выбран');

      // 1. Получаем URL для загрузки
      const uploadResponse = await fetch('/api/documents/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          documentType: data.documentType
        })
      });

      if (!uploadResponse.ok) {
        throw new Error('Ошибка получения URL для загрузки');
      }

      const { uploadURL } = await uploadResponse.json();

      // 2. Загружаем файл напрямую в объектное хранилище
      const fileUploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/octet-stream'
        }
      });

      if (!fileUploadResponse.ok) {
        throw new Error('Ошибка загрузки файла');
      }

      // 3. Создаем запись в базе данных
      const documentData = {
        title: data.title,
        description: data.description || '',
        documentType: data.documentType,
        period: data.period || '',
        fileName: file.name,
        filePath: uploadURL.split('?')[0], // Убираем query параметры
        fileSize: file.size,
        mimeType: file.type,
        status: 'draft'
      };

      const dbResponse = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(documentData)
      });

      if (!dbResponse.ok) {
        throw new Error('Ошибка создания записи документа');
      }

      return await dbResponse.json();
    },
    onSuccess: () => {
      toast({
        title: "Документ загружен успешно",
        description: "Документ сохранен и готов к обработке",
      });
      
      // Сбрасываем форму и обновляем список документов
      reset();
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка загрузки документа",
        description: error.message,
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsUploading(false);
    }
  });

  const onSubmit = handleSubmit((data) => {
    uploadMutation.mutate(data);
  });

  // Генерируем период на основе текущей даты
  const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM формат

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Upload className="h-6 w-6 text-primary" />
          Загрузка документа
        </CardTitle>
        <p className="text-muted-foreground">
          Загрузите документ или отчет в систему МЧС РК
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Название документа */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Название документа *
            </Label>
            <Input
              id="title"
              {...register('title', { required: 'Название обязательно' })}
              placeholder="Введите название документа"
              disabled={isUploading}
              data-testid="input-document-title"
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Тип документа */}
          <div className="space-y-2">
            <Label htmlFor="documentType" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Тип документа *
            </Label>
            <Select
              {...register('documentType', { required: 'Выберите тип документа' })}
              onValueChange={(value) => setValue('documentType', value)}
              disabled={isUploading}
            >
              <SelectTrigger data-testid="select-document-type">
                <SelectValue placeholder="Выберите тип документа" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(documentTypes).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.documentType && (
              <p className="text-sm text-red-600">{errors.documentType.message}</p>
            )}
          </div>

          {/* Период */}
          <div className="space-y-2">
            <Label htmlFor="period" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Отчетный период
            </Label>
            <Input
              id="period"
              type="month"
              {...register('period')}
              defaultValue={currentPeriod}
              disabled={isUploading}
              data-testid="input-period"
            />
          </div>

          {/* Описание */}
          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Дополнительная информация о документе"
              disabled={isUploading}
              data-testid="textarea-description"
            />
          </div>

          {/* Выбор файла */}
          <div className="space-y-2">
            <Label htmlFor="file" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Файл документа *
            </Label>
            <Input
              id="file"
              type="file"
              {...register('file', { required: 'Выберите файл для загрузки' })}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
              disabled={isUploading}
              data-testid="input-file"
            />
            {errors.file && (
              <p className="text-sm text-red-600">{errors.file.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Поддерживаемые форматы: PDF, Word, Excel, изображения. Максимум 10 МБ.
            </p>
          </div>

          {/* Кнопка загрузки */}
          <Button 
            type="submit" 
            disabled={isUploading || uploadMutation.isPending}
            className="w-full"
            data-testid="button-upload"
          >
            {isUploading ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-pulse" />
                Загружаем документ...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Загрузить документ
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}