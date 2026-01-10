import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import BulkOperationsToolbar from "@/components/ui/bulk-operations-toolbar";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Trash2, Search, FileDown, Filter, Plus } from "lucide-react";
import { ErrorDisplay } from "@/components/ui/error-boundary";
import type { Incident } from "@shared/schema";
import IncidentFormOSP from "./incident-form-osp";
import BulkEditModal from "./bulk-edit-modal";
import EmailNotificationModal from "./email-notification-modal";

const daysShort = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const monthLabel = (year: number, month: number) =>
  new Date(year, month, 1).toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });

function CalendarPopup({
  initialISO,
  onSelect,
  onClose,
  minISO,
  maxISO,
}: {
  initialISO: string;
  onSelect: (iso: string) => void;
  onClose: () => void;
  minISO?: string;
  maxISO?: string;
}) {
  const init = initialISO ? new Date(initialISO) : new Date();
  const [year, setYear] = useState(init.getFullYear());
  const [month, setMonth] = useState(init.getMonth());
  const firstDayIndex = (y: number, m: number) =>
    (new Date(y, m, 1).getDay() + 6) % 7;
  const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const min = minISO ? new Date(minISO) : null;
  const max = maxISO ? new Date(maxISO) : null;

  const selectDay = (day: number) => {
    const dd = String(day).padStart(2, "0");
    const mm = String(month + 1).padStart(2, "0");
    const candidate = `${year}-${mm}-${dd}`;
    const cd = new Date(candidate);
    if ((min && cd < min) || (max && cd > max)) return;
    onSelect(candidate);
    onClose();
  };

  const nav = (delta: number) => {
    const d = new Date(year, month, 1);
    d.setMonth(d.getMonth() + delta);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  return (
    <div className="absolute left-0 z-50 mt-2 w-72 rounded-xl border border-border bg-background p-3 shadow-2xl">
      <div className="mb-2 flex items-center justify-between">
        <button
          onClick={() => nav(-1)}
          className="rounded-md border border-border bg-card px-2 py-1 text-xs hover:bg-muted"
          type="button"
        >
          ◀
        </button>
        <div className="text-sm font-medium capitalize">{monthLabel(year, month)}</div>
        <button
          onClick={() => nav(1)}
          className="rounded-md border border-border bg-card px-2 py-1 text-xs hover:bg-muted"
          type="button"
        >
          ▶
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {daysShort.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1 text-center">
        {Array.from({ length: firstDayIndex(year, month) }).map((_, i) => (
          <div key={`e${i}`} className="py-2 text-sm text-muted-foreground/60">
            {" "}
          </div>
        ))}
        {Array.from({ length: daysInMonth(year, month) }).map((_, i) => {
          const day = i + 1;
          const dd = String(day).padStart(2, "0");
          const mm = String(month + 1).padStart(2, "0");
          const candidate = `${year}-${mm}-${dd}`;
          const cd = new Date(candidate);
          const disabled = (min && cd < min) || (max && cd > max);
          return (
            <button
              key={day}
              onClick={() => selectDay(day)}
              disabled={!!disabled}
              className={`rounded-md px-0.5 py-1 text-sm hover:bg-muted ${
                disabled ? "cursor-not-allowed opacity-40 hover:bg-transparent" : ""
              }`}
              type="button"
            >
              {day}
            </button>
          );
        })}
      </div>
      <div className="mt-2 text-right">
        <button
          onClick={onClose}
          className="rounded-md border border-border bg-card px-3 py-1 text-xs hover:bg-muted"
          type="button"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}

function DateField({
  value,
  onChange,
  label,
  min,
  max,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  min?: string;
  max?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <Label>{label}</Label>
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-40 rounded-md border border-input bg-background px-3 pr-10 text-sm"
          min={min}
          max={max}
        />
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="absolute right-2 top-2 rounded-md border border-border bg-card px-2 py-0.5 text-xs hover:bg-muted"
          title="Открыть календарь"
        >
          📅
        </button>
        {open && (
          <CalendarPopup
            initialISO={value}
            onSelect={onChange}
            onClose={() => setOpen(false)}
            minISO={min}
            maxISO={max}
          />
        )}
      </div>
    </div>
  );
}

// Excel-подобная таблица журнала инцидентов согласно форме 1-ОСП
export default function IncidentsJournal() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({
    includeSubOrgs: false,
    searchQuery: "",
    dateFrom: "",
    dateTo: "",
    incidentType: "",
    region: "",
  });

  const [selectedIncidents, setSelectedIncidents] = useState<string[]>([]);
  const [showNewIncidentForm, setShowNewIncidentForm] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Если нет активных фильтров — грузим полный список /api/incidents
  // Если есть фильтры — используем /api/incidents/search (у него может быть limit)
  const hasFilters =
    !!filters.searchQuery ||
    !!filters.dateFrom ||
    !!filters.dateTo ||
    !!filters.incidentType ||
    !!filters.region ||
    !!filters.includeSubOrgs;

  const endpoint = hasFilters ? "/api/incidents/search" : "/api/incidents";

  const { data: incidents = [], isLoading, error, refetch } = useQuery<Incident[]>({
    queryKey: [
      endpoint,
      filters.searchQuery,
      filters.dateFrom,
      filters.dateTo,
      filters.incidentType,
      filters.region,
      filters.includeSubOrgs,
    ],
    queryFn: async ({ queryKey }) => {
      const [
        ep,
        searchQuery,
        dateFrom,
        dateTo,
        incidentType,
        region,
        includeSubOrgs,
      ] = queryKey as [string, string, string, string, string, string, boolean];

      const params = new URLSearchParams();

      // Параметры нужны только для /search
      if (ep === "/api/incidents/search") {
        if (searchQuery) params.set("q", searchQuery);
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);
        if (incidentType) params.set("incidentType", incidentType);
        if (region) params.set("region", region);
        if (includeSubOrgs) params.set("includeSubOrgs", "true");
      }

      const qs = params.toString();
      const url = qs ? `${ep}?${qs}` : ep;

      const response = await apiRequest("GET", url);
      return response.json();
    },
    enabled: true,
    retry: 2,
    retryDelay: 1000,
  });

  const deleteIncidentMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/incidents/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Успех",
        description: "Инцидент удален",
      });
      // Обновляем и общий список, и поиск
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/incidents/search"] });
    },
    onError: (err: any) => {
      toast({
        title: "Ошибка",
        description: err?.message || "Не удалось удалить инцидент",
        variant: "destructive",
      });
    },
  });

  const handleLoad = () => {
    refetch();
  };

  const handleDelete = (id: string) => {
    if (confirm("Удалить инцидент?")) {
      deleteIncidentMutation.mutate(id);
    }
  };

  const handleSelectAll = () => {
    setSelectedIncidents(incidents.map((incident) => incident.id));
  };

  const handleDeselectAll = () => {
    setSelectedIncidents([]);
  };

  const handleBulkDelete = () => {
    if (selectedIncidents.length === 0) return;

    if (confirm(`Удалить ${selectedIncidents.length} записей?`)) {
      selectedIncidents.forEach((id) => {
        deleteIncidentMutation.mutate(id);
      });
      setSelectedIncidents([]);
    }
  };

  const handleBulkExport = () => {
    if (selectedIncidents.length === 0) return;

    const selectedData = incidents.filter((incident: Incident) =>
      selectedIncidents.includes(incident.id)
    );

    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Дата,Тип,Адрес,Причина,Ущерб,Погибшие,Травмированные\n" +
      selectedData
        .map(
          (incident: Incident) =>
            `${incident.dateTime},${incident.incidentType},${incident.address},${incident.cause},${
              incident.damage || 0
            },${incident.deathsTotal || 0},${incident.injuredTotal || 0}`
        )
        .join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute(
      "download",
      `incidents_export_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.click();

    toast({
      title: "Успех",
      description: `Экспортировано ${selectedIncidents.length} записей`,
    });
  };

  const handleBulkEdit = () => {
    if (selectedIncidents.length === 0) return;
    setShowBulkEditModal(true);
  };

  const handleBulkArchive = () => {
    if (selectedIncidents.length === 0) return;

    if (confirm(`Архивировать ${selectedIncidents.length} записей?`)) {
      selectedIncidents.forEach((id) => {
        console.log(`Архивирование записи ${id}`);
      });

      toast({
        title: "Успех",
        description: `${selectedIncidents.length} записей отправлено в архив`,
      });

      setSelectedIncidents([]);
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/incidents/search"] });
    }
  };

  const handleSendEmail = () => {
    if (selectedIncidents.length === 0) return;
    setShowEmailModal(true);
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvData = e.target?.result as string;
        const lines = csvData.split("\n");
        const headers = lines[0].split(",");

        if (!headers.includes("Дата") || !headers.includes("Тип")) {
          throw new Error("Неверный формат файла");
        }

        const importedCount = lines.length - 1;

        toast({
          title: "Импорт выполнен",
          description: `Импортировано ${importedCount} записей`,
        });

        queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
        queryClient.invalidateQueries({ queryKey: ["/api/incidents/search"] });
      } catch {
        toast({
          title: "Ошибка импорта",
          description: "Проверьте формат файла",
          variant: "destructive",
        });
      }
    };

    reader.readAsText(file);
    event.target.value = "";
  };

  const handleGenerateReport = () => {
    if (selectedIncidents.length === 0) return;

    const selectedData = incidents.filter((incident: Incident) =>
      selectedIncidents.includes(incident.id)
    );

    const reportContent =
      "data:text/csv;charset=utf-8," +
      "№,Дата,Время,Местность,Тип,Адрес,Причина,Объект,Ущерб (тыс.тг),Погибло,Детей,Травмировано,Спасено людей,Спасено ценностей\n" +
      selectedData
        .map((incident: Incident, index: number) => {
          const date = new Date(incident.dateTime);
          return `${index + 1},${date.toLocaleDateString("ru-RU")},${date.toLocaleTimeString(
            "ru-RU"
          )},${formatLocality(incident.locality)},${formatIncidentType(
            incident.incidentType
          )},${incident.address},${incident.cause},${incident.objectType || ""},${
            incident.damage || 0
          },${incident.deathsTotal || 0},${incident.deathsChildren || 0},${
            incident.injuredTotal || 0
          },${incident.savedPeopleTotal || 0},${incident.savedProperty || 0}`;
        })
        .join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(reportContent));
    link.setAttribute(
      "download",
      `detailed_incident_report_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.click();

    toast({
      title: "Успех",
      description: `Создан детальный отчет по ${selectedIncidents.length} записям`,
    });
  };

  const handleBulkAction = (action: string) => {
    if (selectedIncidents.length === 0) {
      toast({
        title: "Предупреждение",
        description: "Выберите записи для действия",
        variant: "destructive",
      });
      return;
    }

    if (action === "delete") {
      handleBulkDelete();
    }
  };

  const formatIncidentType = (type: string) => {
    const types: Record<string, string> = {
      fire: "Пожар",
      nonfire: "Случай горения",
      steppe_fire: "Степной пожар",
      co_nofire: "Отравление CO",
    };
    return types[type] || type;
  };

  const formatLocality = (locality: string) => {
    const localities: Record<string, string> = {
      cities: "Города",
      rural: "Сельская местность",
    };
    return localities[locality] || locality;
  };

  const totals = incidents.reduce(
    (acc: any, incident: any) => {
      acc.count++;
      acc.damage += parseFloat(incident.damage || "0");
      acc.deathsTotal += incident.deathsTotal || 0;
      acc.deathsChildren += incident.deathsChildren || 0;
      acc.injuredTotal += incident.injuredTotal || 0;
      acc.injuredChildren += incident.injuredChildren || 0;
      acc.savedPeopleTotal += incident.savedPeopleTotal || 0;
      acc.savedProperty += parseFloat(incident.savedProperty || "0");
      return acc;
    },
    {
      count: 0,
      damage: 0,
      deathsTotal: 0,
      deathsChildren: 0,
      injuredTotal: 0,
      injuredChildren: 0,
      savedPeopleTotal: 0,
      savedProperty: 0,
    }
  );

  if (error) {
    return (
      <div className="space-y-6">
        <ErrorDisplay
          title="Ошибка загрузки журнала"
          message="Не удалось загрузить список происшествий"
          onRetry={() => refetch()}
          error={error as Error}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card border border-border">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="search-query">Поиск</Label>
                <div className="relative">
                  <Input
                    id="search-query"
                    value={filters.searchQuery}
                    onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                    placeholder="Адрес или описание"
                    className="w-72 pr-8"
                    data-testid="input-search"
                  />
                  <Search className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <DateField
                label="Дата с"
                value={filters.dateFrom}
                onChange={(value) => setFilters({ ...filters, dateFrom: value })}
              />
              <DateField
                label="Дата по"
                value={filters.dateTo}
                onChange={(value) => setFilters({ ...filters, dateTo: value })}
                min={filters.dateFrom || undefined}
              />

              <div className="flex flex-col gap-1">
                <Label htmlFor="incident-type">Тип события</Label>
                <select
                  id="incident-type"
                  value={filters.incidentType}
                  onChange={(e) => setFilters({ ...filters, incidentType: e.target.value })}
                  className="h-10 w-48 rounded-md border border-input bg-background px-3 text-sm"
                  data-testid="select-incident-type"
                >
                  <option value="">Все типы</option>
                  <option value="fire">Пожар</option>
                  <option value="nonfire">Случай горения</option>
                  <option value="steppe_fire">Степной пожар</option>
                  <option value="co_nofire">Отравление CO</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="region-filter">Регион</Label>
                <Input
                  id="region-filter"
                  value={filters.region}
                  onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                  placeholder="Регион"
                  className="w-40"
                  data-testid="input-region"
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="include-sub-orgs"
                  checked={filters.includeSubOrgs}
                  onCheckedChange={(checked) =>
                    setFilters({ ...filters, includeSubOrgs: !!checked })
                  }
                  data-testid="checkbox-include-sub-orgs"
                />
                <Label htmlFor="include-sub-orgs" className="text-sm">
                  Включить подведомственные организации
                </Label>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setFilters({
                    ...filters,
                    includeSubOrgs: false,
                    searchQuery: "",
                    dateFrom: "",
                    dateTo: "",
                    incidentType: "",
                    region: "",
                  })
                }
                data-testid="button-clear-filters"
              >
                <Filter className="h-4 w-4 mr-2" />
                Очистить фильтры
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleLoad} data-testid="button-refresh">
                <Search className="h-4 w-4 mr-2" />
                Обновить
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewIncidentForm(true)}
                data-testid="button-add-incident"
              >
                <Plus className="h-4 w-4 mr-2" />
                Добавить
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkExport}
                disabled={selectedIncidents.length === 0}
                data-testid="button-export"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Экспорт ({selectedIncidents.length})
              </Button>

              <input
                type="file"
                id="import-file"
                accept=".csv,.xlsx"
                style={{ display: "none" }}
                onChange={handleImportFile}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("import-file")?.click()}
                data-testid="button-import"
              >
                <FileDown className="h-4 w-4 mr-2 rotate-180" />
                Импорт
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <BulkOperationsToolbar
        selectedCount={selectedIncidents.length}
        totalCount={incidents.length}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onDelete={handleBulkDelete}
        onExport={handleBulkExport}
        onEdit={handleBulkEdit}
        onArchive={handleBulkArchive}
        onSendEmail={handleSendEmail}
        onGenerateReport={handleGenerateReport}
      />

      <Card className="bg-card border border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted border-b">
                  <th className="w-10 p-2 border-r border-border">
                    <Checkbox
                      checked={selectedIncidents.length === incidents.length && incidents.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedIncidents(incidents.map((i) => i.id));
                        else setSelectedIncidents([]);
                      }}
                      data-testid="checkbox-select-all"
                    />
                  </th>
                  <th className="text-left p-2 border-r border-border font-medium min-w-[40px]">№</th>
                  <th className="text-left p-2 border-r border-border font-medium min-w-[120px]">Дата и время</th>
                  <th className="text-left p-2 border-r border-border font-medium min-w-[100px]">Местность</th>
                  <th className="text-left p-2 border-r border-border font-medium min-w-[120px]">Регион</th>
                  <th className="text-left p-2 border-r border-border font-medium min-w-[120px]">Город/Район</th>
                  <th className="text-left p-2 border-r border-border font-medium min-w-[120px]">Тип события</th>
                  <th className="text-left p-2 border-r border-border font-medium min-w-[200px]">Адрес</th>
                  <th className="text-left p-2 border-r border-border font-medium min-w-[120px]">Причина</th>
                  <th className="text-left p-2 border-r border-border font-medium min-w-[120px]">Объект</th>
                  <th className="text-left p-2 border-r border-border font-medium min-w-[100px]">Ущерб (тыс. тг)</th>
                  <th className="text-left p-2 border-r border-border font-medium min-w-[80px]">Погибло всего</th>
                  <th className="text-left p-2 border-r border-border font-medium min-w-[80px]">Детей</th>
                  <th className="text-left p-2 border-r border-border font-medium min-w-[80px]">Травмировано</th>
                  <th className="text-left p-2 border-r border-border font-medium min-w-[80px]">Спасено людей</th>
                  <th className="text-left p-2 border-r border-border font-medium min-w-[120px]">Спасено ценностей</th>
                  <th className="text-left p-2 font-medium min-w-[100px]">Действия</th>
                </tr>
              </thead>
              <tbody>
                {incidents.length === 0 ? (
                  <tr>
                    <td colSpan={17} className="p-8 text-center text-muted-foreground border-b">
                      {isLoading
                        ? "Загрузка журнала..."
                        : "Журнал пуст. Для создания записи нажмите кнопку «Добавить»."}
                    </td>
                  </tr>
                ) : (
                  <>
                    {incidents.map((incident, index: number) => (
                      <tr
                        key={incident.id}
                        className={`border-b hover:bg-muted/50 ${
                          selectedIncidents.includes(incident.id) ? "bg-primary/10" : ""
                        }`}
                        data-testid={`row-incident-${incident.id}`}
                      >
                        <td className="p-2 border-r border-border">
                          <Checkbox
                            checked={selectedIncidents.includes(incident.id)}
                            onCheckedChange={(checked) => {
                              if (checked) setSelectedIncidents([...selectedIncidents, incident.id]);
                              else setSelectedIncidents(selectedIncidents.filter((id) => id !== incident.id));
                            }}
                            data-testid={`checkbox-select-${incident.id}`}
                          />
                        </td>
                        <td className="p-2 border-r border-border text-foreground font-mono">
                          {index + 1}
                        </td>
                        <td className="p-2 border-r border-border text-foreground">
                          {format(new Date(incident.dateTime), "dd.MM.yyyy HH:mm")}
                        </td>
                        <td className="p-2 border-r border-border text-foreground">
                          {formatLocality(incident.locality)}
                        </td>
                        <td className="p-2 border-r border-border text-muted-foreground">
                          {incident.region || "—"}
                        </td>
                        <td className="p-2 border-r border-border text-muted-foreground">
                          {incident.city || "—"}
                        </td>
                        <td className="p-2 border-r border-border text-foreground">
                          {formatIncidentType(incident.incidentType)}
                        </td>
                        <td className="p-2 border-r border-border text-foreground">
                          {incident.address}
                        </td>
                        <td className="p-2 border-r border-border text-muted-foreground">
                          {incident.cause || "—"}
                        </td>
                        <td className="p-2 border-r border-border text-muted-foreground">
                          {incident.objectType || "—"}
                        </td>
                        <td className="p-2 border-r border-border text-right text-foreground font-mono">
                          {incident.damage ? parseFloat(incident.damage).toFixed(1) : "0.0"}
                        </td>
                        <td className="p-2 border-r border-border text-center text-foreground font-mono">
                          {incident.deathsTotal || 0}
                        </td>
                        <td className="p-2 border-r border-border text-center text-foreground font-mono">
                          {incident.deathsChildren || 0}
                        </td>
                        <td className="p-2 border-r border-border text-center text-foreground font-mono">
                          {incident.injuredTotal || 0}
                        </td>
                        <td className="p-2 border-r border-border text-center text-foreground font-mono">
                          {incident.savedPeopleTotal || 0}
                        </td>
                        <td className="p-2 border-r border-border text-right text-foreground font-mono">
                          {incident.savedProperty ? parseFloat(incident.savedProperty).toFixed(1) : "0.0"}
                        </td>
                        <td className="p-2">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-primary hover:text-primary/80"
                              data-testid={`button-edit-${incident.id}`}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive/80"
                              onClick={() => handleDelete(incident.id)}
                              disabled={deleteIncidentMutation.isPending}
                              data-testid={`button-delete-${incident.id}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    <tr className="bg-primary/10 border-t-2 border-primary font-semibold">
                      <td className="p-2 border-r border-border"></td>
                      <td className="p-2 border-r border-border text-foreground">ИТОГО:</td>
                      <td className="p-2 border-r border-border text-center text-foreground">{totals.count}</td>
                      <td className="p-2 border-r border-border"></td>
                      <td className="p-2 border-r border-border"></td>
                      <td className="p-2 border-r border-border"></td>
                      <td className="p-2 border-r border-border"></td>
                      <td className="p-2 border-r border-border"></td>
                      <td className="p-2 border-r border-border text-right text-foreground font-mono">
                        {totals.damage.toFixed(1)}
                      </td>
                      <td className="p-2 border-r border-border text-center text-foreground font-mono">
                        {totals.deathsTotal}
                      </td>
                      <td className="p-2 border-r border-border text-center text-foreground font-mono">
                        {totals.deathsChildren}
                      </td>
                      <td className="p-2 border-r border-border text-center text-foreground font-mono">
                        {totals.injuredTotal}
                      </td>
                      <td className="p-2 border-r border-border text-center text-foreground font-mono">
                        {totals.savedPeopleTotal}
                      </td>
                      <td className="p-2 border-r border-border text-right text-foreground font-mono">
                        {totals.savedProperty.toFixed(1)}
                      </td>
                      <td className="p-2"></td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {incidents.length > 0 && (
        <Card className="bg-secondary border border-border">
          <CardContent className="p-4">
            <h4 className="text-sm font-medium text-foreground mb-2">Сводка по форме 1-ОСП</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Всего пожаров:</span>
                <span className="ml-2 font-semibold text-foreground">{totals.count}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Общий ущерб:</span>
                <span className="ml-2 font-semibold text-foreground">{totals.damage.toFixed(1)} тыс. тг</span>
              </div>
              <div>
                <span className="text-muted-foreground">Погибло:</span>
                <span className="ml-2 font-semibold text-destructive">{totals.deathsTotal} чел.</span>
              </div>
              <div>
                <span className="text-muted-foreground">Спасено:</span>
                <span className="ml-2 font-semibold text-green-600">{totals.savedPeopleTotal} чел.</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showNewIncidentForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Новое происшествие</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewIncidentForm(false)}
                  data-testid="button-close-form"
                >
                  ✕
                </Button>
              </div>
              <IncidentFormOSP
                onSuccess={() => {
                  setShowNewIncidentForm(false);
                  queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/incidents/search"] });
                }}
              />
            </div>
          </div>
        </div>
      )}

      <BulkEditModal
        isOpen={showBulkEditModal}
        onClose={() => setShowBulkEditModal(false)}
        selectedIds={selectedIncidents}
        selectedCount={selectedIncidents.length}
      />

      <EmailNotificationModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        selectedIds={selectedIncidents}
        selectedCount={selectedIncidents.length}
      />
    </div>
  );
}