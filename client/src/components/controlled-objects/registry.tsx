import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Building, 
  MapPin, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Plus
} from "lucide-react";

interface ControlledObject {
  id: string;
  name: string;
  type: string;
  address: string;
  status: 'compliant' | 'violation' | 'inspection' | 'overdue';
  lastInspection: string;
  nextInspection: string;
  violations: number;
  riskLevel: 'low' | 'medium' | 'high';
}

type InspectionFormState = {
  ukpsisNumber: string;
  registrationDate: string;
  authority: string;
  inspectionType: string;
  binIin: string;
  subject: string;
  inspectedObjects: string;
  basis: string;
  startDate: string;
  endDate: string;
  status: string;
};

const inspectionTypeOptions = [
  { value: "scheduled", label: "Плановая" },
  { value: "unscheduled", label: "Внеплановая" },
  { value: "preventive_control", label: "Профилактическая" },
  { value: "monitoring", label: "Мониторинг" },
];

const inspectionStatusOptions = [
  { value: "planned", label: "Запланирована" },
  { value: "in_progress", label: "В работе" },
  { value: "completed", label: "Завершена" },
  { value: "canceled", label: "Отменена" },
];

export default function ControlledObjectsRegistry() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedObject, setSelectedObject] = useState<ControlledObject | null>(null);
  const [inspectionTarget, setInspectionTarget] = useState<ControlledObject | null>(null);
  const [isInspectionDialogOpen, setIsInspectionDialogOpen] = useState(false);
  const [inspectionError, setInspectionError] = useState<string | null>(null);
  const [isSavingInspection, setIsSavingInspection] = useState(false);

  // Получаем реальные данные из API с параметром фильтрации
  const queryParams = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
  const { data: apiObjects = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/control-objects', statusFilter],
    queryFn: async () => {
      const res = await fetch(`/api/control-objects${queryParams}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch control objects');
      return res.json();
    }
  });

  // Преобразуем данные API в формат компонента (API возвращает полные данные из БД)
  // Примечание: Поля lastInspection, nextInspection, violations отсутствуют в схеме БД
  const objects: ControlledObject[] = apiObjects.map((obj: any) => ({
    id: obj.id,
    name: obj.name || obj.title || 'Без названия',
    type: obj.category || obj.details?.category || obj.subcategory || 'Объект',
    address: obj.address || obj.details?.address || '',
    status: mapControlObjectStatus(obj.status || obj.details?.status),
    lastInspection: '-',  // Поле отсутствует в текущей схеме
    nextInspection: '-',  // Поле отсутствует в текущей схеме  
    violations: 0,        // Поле отсутствует в текущей схеме
    riskLevel: obj.riskLevel || obj.details?.riskLevel || 'low',
  }));

  const buildInspectionDefaults = useMemo(() => {
    return (object?: ControlledObject | null): InspectionFormState => {
      const today = new Date().toISOString().split('T')[0];
      return {
        ukpsisNumber: '',
        registrationDate: today,
        authority: '',
        inspectionType: 'scheduled',
        binIin: '',
        subject: object?.name || '',
        inspectedObjects: object ? `${object.name}${object.address ? `, ${object.address}` : ''}` : '',
        basis: '',
        startDate: today,
        endDate: '',
        status: 'planned',
      };
    };
  }, []);

  const [inspectionForm, setInspectionForm] = useState<InspectionFormState>(() =>
    buildInspectionDefaults(null)
  );
  
  // Маппинг статусов из схемы БД к статусам UI
  function mapControlObjectStatus(dbStatus: string | undefined): ControlledObject['status'] {
    switch (dbStatus) {
      case 'active': return 'compliant';
      case 'inactive': 
      case 'closed': return 'compliant';
      case 'under_inspection': return 'inspection';
      case 'violation': return 'violation';
      default: return 'compliant';
    }
  }

  // Фильтрация объектов
  const filteredObjects = objects.filter(obj => {
    const matchesSearch = obj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         obj.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || obj.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-500';
      case 'violation': return 'bg-red-500';
      case 'inspection': return 'bg-blue-500';
      case 'overdue': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'compliant': return 'Соответствует';
      case 'violation': return 'Нарушения';
      case 'inspection': return 'Проверка';
      case 'overdue': return 'Просрочено';
      default: return 'Неизвестно';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle className="h-4 w-4" />;
      case 'violation': return <AlertTriangle className="h-4 w-4" />;
      case 'inspection': return <Clock className="h-4 w-4" />;
      case 'overdue': return <AlertTriangle className="h-4 w-4" />;
      default: return <Building className="h-4 w-4" />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const handleOpenInspection = (obj: ControlledObject) => {
    setInspectionTarget(obj);
    setInspectionForm(buildInspectionDefaults(obj));
    setInspectionError(null);
    setIsInspectionDialogOpen(true);
  };

  const handleInspectionChange = (field: keyof InspectionFormState) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setInspectionForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleInspectionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingInspection(true);
    setInspectionError(null);
    try {
      const res = await fetch("/api/inspections", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ukpsisNumber: inspectionForm.ukpsisNumber,
          registrationDate: inspectionForm.registrationDate,
          authority: inspectionForm.authority,
          inspectionType: inspectionForm.inspectionType,
          binIin: inspectionForm.binIin,
          subject: inspectionForm.subject,
          inspectedObjects: inspectionForm.inspectedObjects,
          basis: inspectionForm.basis,
          startDate: inspectionForm.startDate,
          endDate: inspectionForm.endDate,
          status: inspectionForm.status,
          controlObjectId: inspectionTarget?.id,
          controlObjectName: inspectionTarget?.name,
        }),
      });

      if (!res.ok) {
        throw new Error("Не удалось сохранить проверку.");
      }

      setIsInspectionDialogOpen(false);
      const url = new URL(window.location.href);
      url.pathname = "/controlled-objects";
      url.searchParams.set("tab", "inspections");
      window.location.href = url.toString();
    } catch (error) {
      setInspectionError(error instanceof Error ? error.message : "Ошибка сохранения.");
    } finally {
      setIsSavingInspection(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка объектов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Реестр контролируемых объектов</h2>
          <p className="text-muted-foreground">
            Перечень объектов пожарного надзора и контроль их состояния ({filteredObjects.length})
          </p>
        </div>
        <Button data-testid="button-add-object">
          <Plus className="h-4 w-4 mr-2" />
          Добавить объект
        </Button>
      </div>

      {/* Фильтры и поиск */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по названию или адресу..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded px-3 py-2"
                data-testid="select-status"
              >
                <option value="all">Все статусы</option>
                <option value="compliant">Соответствует</option>
                <option value="violation">Нарушения</option>
                <option value="inspection">Проверка</option>
                <option value="overdue">Просрочено</option>
              </select>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Фильтры
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Building className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">2,156</div>
                <div className="text-sm text-muted-foreground">Всего объектов</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold">1,923</div>
                <div className="text-sm text-muted-foreground">Соответствует</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <div className="text-2xl font-bold">187</div>
                <div className="text-sm text-muted-foreground">С нарушениями</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">46</div>
                <div className="text-sm text-muted-foreground">Просрочено</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Список объектов */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredObjects.map((obj) => (
          <Card key={obj.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{obj.name}</CardTitle>
                  <CardDescription className="mt-1">
                    <div className="flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      {obj.type}
                    </div>
                  </CardDescription>
                </div>
                <Badge className={`${getStatusColor(obj.status)} text-white`}>
                  {getStatusIcon(obj.status)}
                  <span className="ml-1">{getStatusText(obj.status)}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Адрес */}
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{obj.address}</span>
                </div>

                {/* Даты проверок */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Последняя проверка</div>
                    <div className="text-muted-foreground">
                      {obj.lastInspection && obj.lastInspection !== '-' 
                        ? new Date(obj.lastInspection).toLocaleDateString('ru-RU') 
                        : 'Не указана'}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Следующая проверка</div>
                    <div className="text-muted-foreground">
                      {obj.nextInspection && obj.nextInspection !== '-' 
                        ? new Date(obj.nextInspection).toLocaleDateString('ru-RU') 
                        : 'Не запланирована'}
                    </div>
                  </div>
                </div>

                {/* Информация о нарушениях и риске */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-sm">
                    <span className="font-medium">Нарушения: </span>
                    <span className={obj.violations > 0 ? 'text-red-600' : 'text-green-600'}>
                      {obj.violations}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Риск: </span>
                    <span className={getRiskColor(obj.riskLevel)}>
                      {obj.riskLevel === 'low' ? 'Низкий' : 
                       obj.riskLevel === 'medium' ? 'Средний' : 'Высокий'}
                    </span>
                  </div>
                </div>

                {/* Действия */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedObject(obj)}
                    data-testid={`button-view-${obj.id}`}
                  >
                    Подробно
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenInspection(obj)}
                    data-testid={`button-inspect-${obj.id}`}
                  >
                    Сгенерировать проверку
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Детальная информация об объекте */}
      {selectedObject && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedObject.name}</CardTitle>
                <CardDescription>Детальная информация об объекте</CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => setSelectedObject(null)}
                data-testid="button-close-details"
              >
                Закрыть
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Основная информация</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Тип объекта:</strong> {selectedObject.type}</div>
                  <div><strong>Адрес:</strong> {selectedObject.address}</div>
                  <div><strong>Статус:</strong> {getStatusText(selectedObject.status)}</div>
                  <div><strong>Уровень риска:</strong> {selectedObject.riskLevel}</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium">История проверок</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Последняя проверка:</strong><br />
                    {selectedObject.lastInspection && selectedObject.lastInspection !== '-' 
                      ? new Date(selectedObject.lastInspection).toLocaleDateString('ru-RU') 
                      : 'Не указана'}
                  </div>
                  <div>
                    <strong>Следующая проверка:</strong><br />
                    {selectedObject.nextInspection && selectedObject.nextInspection !== '-' 
                      ? new Date(selectedObject.nextInspection).toLocaleDateString('ru-RU') 
                      : 'Не запланирована'}
                  </div>
                  <div>
                    <strong>Активных нарушений:</strong> {selectedObject.violations}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isInspectionDialogOpen} onOpenChange={setIsInspectionDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Сгенерировать проверку</DialogTitle>
            <DialogDescription>
              Заполните данные для регистрации проверки в журнале.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleInspectionSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">№ проверки УКПСиСУ</label>
                <Input
                  value={inspectionForm.ukpsisNumber}
                  onChange={handleInspectionChange("ukpsisNumber")}
                  placeholder="Например, УКПС-2024-001"
                  data-testid="input-ukpsis-number"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Дата регистрации</label>
                <Input
                  type="date"
                  value={inspectionForm.registrationDate}
                  onChange={handleInspectionChange("registrationDate")}
                  data-testid="input-registration-date"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Органы</label>
                <Input
                  value={inspectionForm.authority}
                  onChange={handleInspectionChange("authority")}
                  placeholder="Орган, проводящий проверку"
                  data-testid="input-authority"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Вид проверки</label>
                <select
                  className="border rounded px-3 py-2 w-full"
                  value={inspectionForm.inspectionType}
                  onChange={handleInspectionChange("inspectionType")}
                  data-testid="select-inspection-type"
                >
                  {inspectionTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">БИН/ИИН</label>
                <Input
                  value={inspectionForm.binIin}
                  onChange={handleInspectionChange("binIin")}
                  placeholder="Введите БИН или ИИН"
                  data-testid="input-bin-iin"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Субъект</label>
                <Input
                  value={inspectionForm.subject}
                  onChange={handleInspectionChange("subject")}
                  placeholder="Наименование субъекта"
                  data-testid="input-subject"
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Проверяемые объекты</label>
                <Textarea
                  value={inspectionForm.inspectedObjects}
                  onChange={handleInspectionChange("inspectedObjects")}
                  placeholder="Перечень проверяемых объектов"
                  data-testid="textarea-inspected-objects"
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Основание</label>
                <Textarea
                  value={inspectionForm.basis}
                  onChange={handleInspectionChange("basis")}
                  placeholder="Основание проведения проверки"
                  data-testid="textarea-basis"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Срок начала</label>
                <Input
                  type="date"
                  value={inspectionForm.startDate}
                  onChange={handleInspectionChange("startDate")}
                  data-testid="input-start-date"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Срок окончания</label>
                <Input
                  type="date"
                  value={inspectionForm.endDate}
                  onChange={handleInspectionChange("endDate")}
                  data-testid="input-end-date"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Статус</label>
                <select
                  className="border rounded px-3 py-2 w-full"
                  value={inspectionForm.status}
                  onChange={handleInspectionChange("status")}
                  data-testid="select-inspection-status"
                >
                  {inspectionStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {inspectionError && (
              <div className="text-sm text-red-600">{inspectionError}</div>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsInspectionDialogOpen(false)}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isSavingInspection}>
                {isSavingInspection ? "Сохранение..." : "Сохранить"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
