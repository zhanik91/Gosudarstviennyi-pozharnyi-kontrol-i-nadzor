import { useEffect, useState } from "react";
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
import { Columns, Edit, Trash2, Search, FileDown, Filter, Plus, X } from "lucide-react";
import { ErrorDisplay } from "@/components/ui/error-boundary";
import type { Incident } from "@shared/schema";
import * as XLSX from "xlsx";
import IncidentFormOSP from "./incident-form-osp";
import BulkEditModal from "./bulk-edit-modal";
import EmailNotificationModal from "./email-notification-modal";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const daysShort = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const monthLabel = (year: number, month: number) =>
  new Date(year, month, 1).toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });

const COLUMN_STORAGE_KEY = "incidents_journal_columns_v1";
const DEFAULT_VISIBLE_COLUMNS = [
  "dateTime",
  "locality",
  "region",
  "city",
  "incidentType",
  "address",
  "cause",
  "object",
  "damage",
  "deathsTotal",
  "deathsChildren",
  "injuredTotal",
  "savedPeopleTotal",
  "savedProperty",
];

type ImportedIncident = {
  rowNumber: number;
  dateTime?: string;
  incidentType?: string;
  address?: string;
  cause?: string;
  damage?: number;
  deathsTotal?: number;
  injuredTotal?: number;
  region?: string;
  city?: string;
  locality?: string;
  description?: string;
};

const parseCsvLine = (line: string) => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

const normalizeHeader = (value: string) => value.trim().toLowerCase();

const headerMap: Record<string, keyof ImportedIncident> = {
  дата: "dateTime",
  "дата и время": "dateTime",
  "дата/время": "dateTime",
  тип: "incidentType",
  "тип события": "incidentType",
  адрес: "address",
  причина: "cause",
  ущерб: "damage",
  погибшие: "deathsTotal",
  травмированные: "injuredTotal",
  регион: "region",
  "город/район": "city",
  город: "city",
  район: "city",
  местность: "locality",
  описание: "description",
};

const normalizeIncidentType = (value: string) => {
  const normalized = value.trim().toLowerCase();
  const map: Record<string, string> = {
    пожар: "fire",
    "случай горения": "nonfire",
    "степной пожар": "steppe_fire",
    "степное загорание": "steppe_smolder",
    "отравление co": "co_nofire",
    "отравление со": "co_nofire",
    "co": "co_nofire",
  };
  return map[normalized] || normalized;
};

const normalizeLocality = (value: string) => {
  const normalized = value.trim().toLowerCase();
  if (normalized.includes("город")) return "cities";
  if (normalized.includes("сель")) return "rural";
  return value.trim();
};

type IncidentPageResponse = {
  items: Incident[];
  total: number;
  limit: number;
  offset: number;
};

const parseNumberValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(/\s/g, "").replace(",", ".");
    const parsed = Number.parseFloat(normalized);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};

const parseDateValue = (value: unknown) => {
  if (!value) return undefined;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  if (typeof value === "number") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const direct = new Date(trimmed);
    if (!Number.isNaN(direct.getTime())) {
      return direct.toISOString();
    }
    const match = trimmed.match(
      /(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?/
    );
    if (match) {
      const [, day, month, year, hours = "0", minutes = "0"] = match;
      const iso = new Date(
        Number(year.length === 2 ? `20${year}` : year),
        Number(month) - 1,
        Number(day),
        Number(hours),
        Number(minutes)
      );
      if (!Number.isNaN(iso.getTime())) {
        return iso.toISOString();
      }
    }
  }
  return undefined;
};

const buildImportedIncident = (row: Record<string, unknown>, rowNumber: number) => {
  const incident: ImportedIncident = { rowNumber };
  Object.entries(row).forEach(([key, value]) => {
    if (key === "incidentType") {
      incident.incidentType = normalizeIncidentType(String(value ?? ""));
      return;
    }
    if (key === "locality") {
      incident.locality = normalizeLocality(String(value ?? ""));
      return;
    }
    if (key === "dateTime") {
      incident.dateTime = parseDateValue(value);
      return;
    }
    if (key === "damage") {
      incident.damage = parseNumberValue(value);
      return;
    }
    if (key === "deathsTotal") {
      incident.deathsTotal = parseNumberValue(value) ?? 0;
      return;
    }
    if (key === "injuredTotal") {
      incident.injuredTotal = parseNumberValue(value) ?? 0;
      return;
    }
    (incident as Record<string, unknown>)[key] = typeof value === "string" ? value.trim() : value;
  });
  return incident;
};

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
          className="h-10 w-full rounded-md border border-input bg-background px-3 pr-10 text-sm"
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
    searchQuery: "",
    dateFrom: "",
    dateTo: "",
    incidentType: "",
    region: "",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_VISIBLE_COLUMNS);

  const [selectedIncidents, setSelectedIncidents] = useState<string[]>([]);
  // Combined modal state: if open=true, and editingIncidentId=null -> Create mode.
  // If open=true, editingIncidentId='...' -> Edit mode.
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIncidentId, setEditingIncidentId] = useState<string | null>(null);

  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Import Results Modal State
  const [importResults, setImportResults] = useState<{
    created: number;
    total: number;
    errors: { rowNumber: number; error: string }[];
  } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(COLUMN_STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setVisibleColumns(parsed);
      }
    } catch (err) {
      console.warn("Failed to parse journal column preferences:", err);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  // Если нет активных фильтров — грузим полный список /api/incidents
  // Если есть фильтры — используем /api/incidents/search (у него может быть limit)
  const hasFilters =
    !!filters.searchQuery ||
    !!filters.dateFrom ||
    !!filters.dateTo ||
    !!filters.incidentType ||
    !!filters.region;

  const endpoint = hasFilters ? "/api/incidents/search" : "/api/incidents";

  const offset = (page - 1) * pageSize;

  useEffect(() => {
    setPage(1);
  }, [
    filters.searchQuery,
    filters.dateFrom,
    filters.dateTo,
    filters.incidentType,
    filters.region,
    pageSize,
  ]);

  const { data: incidentsResponse, isLoading, error, refetch } = useQuery<
    IncidentPageResponse | Incident[]
  >({
    queryKey: [
      endpoint,
      filters.searchQuery,
      filters.dateFrom,
      filters.dateTo,
      filters.incidentType,
      filters.region,
      page,
      pageSize,
    ],
    queryFn: async ({ queryKey }) => {
      const [
        ep,
        searchQuery,
        dateFrom,
        dateTo,
        incidentType,
        region,
        pageValue,
        pageSizeValue,
      ] = queryKey as [string, string, string, string, string, string, number, number];

      const params = new URLSearchParams();
      const limitValue = Number(pageSizeValue) || pageSize;
      const offsetValue = (Number(pageValue) - 1) * limitValue;

      // Параметры нужны только для /search
      if (ep === "/api/incidents/search") {
        if (searchQuery) params.set("q", searchQuery);
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);
        if (incidentType) params.set("incidentType", incidentType);
        if (region) params.set("region", region);
      }

      params.set("limit", String(limitValue));
      params.set("offset", String(offsetValue));

      const qs = params.toString();
      const url = qs ? `${ep}?${qs}` : ep;

      const response = await apiRequest("GET", url);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: true,
    retry: 2,
    retryDelay: 1000,
  });

  const incidentPage = Array.isArray(incidentsResponse)
    ? {
        items: incidentsResponse,
        total: incidentsResponse.length,
        limit: incidentsResponse.length,
        offset: 0,
      }
    : incidentsResponse ?? {
        items: [],
        total: 0,
        limit: pageSize,
        offset: 0,
      };

  const incidents = incidentPage.items ?? [];
  const totalIncidents = incidentPage.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalIncidents / pageSize));
  const currentOffset = incidentPage.offset ?? offset;
  const startItem = totalIncidents === 0 ? 0 : currentOffset + 1;
  const endItem = totalIncidents === 0 ? 0 : Math.min(currentOffset + incidents.length, totalIncidents);

  useEffect(() => {
    setSelectedIncidents([]);
  }, [
    page,
    pageSize,
    endpoint,
    filters.searchQuery,
    filters.dateFrom,
    filters.dateTo,
    filters.incidentType,
    filters.region,
  ]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

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

  const handleEdit = (id: string) => {
    setEditingIncidentId(id);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingIncidentId(null);
    setIsModalOpen(true);
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
            `${incident.dateTime},${incident.incidentType},${incident.address},${formatCodeLabel(
              incident.causeCode,
              incident.cause,
              ""
            )},${incident.damage || 0},${incident.deathsTotal || 0},${incident.injuredTotal || 0}`
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
    reader.onload = async (e) => {
      try {
        const result = e.target?.result;
        const extension = file.name.split(".").pop()?.toLowerCase();
        let rows: (string | number | Date)[][] = [];

        if (extension === "csv") {
          const csvData = (result as string) || "";
          const lines = csvData.split(/\r?\n/).filter((line) => line.trim().length > 0);
          rows = lines.map(parseCsvLine);
        } else {
          const data = result instanceof ArrayBuffer ? result : new ArrayBuffer(0);
          const workbook = XLSX.read(data, { type: "array", cellDates: true });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }) as (
            | string
            | number
            | Date
          )[][];
        }

        const [headerRow, ...dataRows] = rows;
        if (!headerRow) {
          throw new Error("Пустой файл");
        }

        const headers = headerRow.map((header) => normalizeHeader(String(header)));
        const headerKeys = headers.map((header) => headerMap[header]).filter(Boolean);

        if (
          !headerKeys.includes("dateTime") ||
          !headerKeys.includes("incidentType") ||
          !headerKeys.includes("address")
        ) {
          throw new Error("Неверный формат файла: отсутствуют обязательные колонки");
        }

        const importedIncidents = dataRows
          .filter((row) => row.some((cell) => String(cell ?? "").trim().length > 0))
          .map((row, index) => {
            const mappedRow: Record<string, unknown> = {};
            row.forEach((cell, cellIndex) => {
              const key = headerMap[headers[cellIndex]];
              if (!key) return;
              mappedRow[key] = cell;
            });
            return buildImportedIncident(mappedRow, index + 2);
          });

        if (importedIncidents.length === 0) {
          throw new Error("Нет данных для импорта");
        }

        const response = await apiRequest("POST", "/api/incidents/bulk", {
          incidents: importedIncidents,
          format: extension || "unknown",
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.message || "Ошибка импорта");
        }

        // Show detailed results modal instead of just a toast
        setImportResults({
            created: payload.created,
            total: payload.total,
            errors: payload.errors || []
        });

        queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
        queryClient.invalidateQueries({ queryKey: ["/api/incidents/search"] });
      } catch (err) {
        toast({
          title: "Ошибка импорта",
          description: err instanceof Error ? err.message : "Проверьте формат файла",
          variant: "destructive",
        });
      }
    };

    if (file.name.toLowerCase().endsWith(".csv")) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
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
          )},${incident.address},${formatCodeLabel(incident.causeCode, incident.cause, "")},${formatCodeLabel(
            incident.objectCode,
            incident.objectType,
            ""
          )},${incident.damage || 0},${incident.deathsTotal || 0},${incident.deathsChildren || 0},${
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
      steppe_smolder: "Степное загорание",
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

  const formatCodeLabel = (
    code?: string | null,
    label?: string | null,
    emptyValue = "—"
  ) => {
    if (code && label) return `${code} - ${label}`;
    return label || code || emptyValue;
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

  const isColumnVisible = (columnId: string) => visibleColumns.includes(columnId);

  const columnDefinitions = [
    {
      id: "dateTime",
      label: "Дата и время",
      headerClassName: "min-w-[120px]",
      cellClassName: "text-foreground",
      render: (incident: Incident) =>
        format(new Date(incident.dateTime), "dd.MM.yyyy HH:mm"),
      total: () => totals.count,
      totalClassName: "text-center text-foreground",
    },
    {
      id: "locality",
      label: "Местность",
      headerClassName: "min-w-[100px]",
      cellClassName: "text-foreground",
      render: (incident: Incident) => formatLocality(incident.locality),
    },
    {
      id: "region",
      label: "Регион",
      headerClassName: "min-w-[120px]",
      cellClassName: "text-muted-foreground",
      render: (incident: Incident) => incident.region || "—",
    },
    {
      id: "city",
      label: "Город/Район",
      headerClassName: "min-w-[120px]",
      cellClassName: "text-muted-foreground",
      render: (incident: Incident) => incident.city || "—",
    },
    {
      id: "incidentType",
      label: "Тип события",
      headerClassName: "min-w-[120px]",
      cellClassName: "text-foreground",
      render: (incident: Incident) => formatIncidentType(incident.incidentType),
    },
    {
      id: "address",
      label: "Адрес",
      headerClassName: "min-w-[200px]",
      cellClassName: "text-foreground",
      render: (incident: Incident) => incident.address,
    },
    {
      id: "cause",
      label: "Причина",
      headerClassName: "min-w-[120px]",
      cellClassName: "text-muted-foreground",
      render: (incident: Incident) =>
        formatCodeLabel(incident.causeCode, incident.cause),
    },
    {
      id: "object",
      label: "Объект",
      headerClassName: "min-w-[120px]",
      cellClassName: "text-muted-foreground",
      render: (incident: Incident) =>
        formatCodeLabel(incident.objectCode, incident.objectType),
    },
    {
      id: "damage",
      label: "Ущерб (тыс. тг)",
      headerClassName: "min-w-[100px]",
      cellClassName: "text-right text-foreground font-mono",
      render: (incident: Incident) =>
        incident.damage ? parseFloat(incident.damage).toFixed(1) : "0.0",
      total: () => totals.damage.toFixed(1),
      totalClassName: "text-right text-foreground font-mono",
    },
    {
      id: "deathsTotal",
      label: "Погибло всего",
      headerClassName: "min-w-[80px]",
      cellClassName: "text-center text-foreground font-mono",
      render: (incident: Incident) => incident.deathsTotal || 0,
      total: () => totals.deathsTotal,
      totalClassName: "text-center text-foreground font-mono",
    },
    {
      id: "deathsChildren",
      label: "Детей",
      headerClassName: "min-w-[80px]",
      cellClassName: "text-center text-foreground font-mono",
      render: (incident: Incident) => incident.deathsChildren || 0,
      total: () => totals.deathsChildren,
      totalClassName: "text-center text-foreground font-mono",
    },
    {
      id: "injuredTotal",
      label: "Травмировано",
      headerClassName: "min-w-[80px]",
      cellClassName: "text-center text-foreground font-mono",
      render: (incident: Incident) => incident.injuredTotal || 0,
      total: () => totals.injuredTotal,
      totalClassName: "text-center text-foreground font-mono",
    },
    {
      id: "savedPeopleTotal",
      label: "Спасено людей",
      headerClassName: "min-w-[80px]",
      cellClassName: "text-center text-foreground font-mono",
      render: (incident: Incident) => incident.savedPeopleTotal || 0,
      total: () => totals.savedPeopleTotal,
      totalClassName: "text-center text-foreground font-mono",
    },
    {
      id: "savedProperty",
      label: "Спасено ценностей",
      headerClassName: "min-w-[120px]",
      cellClassName: "text-right text-foreground font-mono",
      render: (incident: Incident) =>
        incident.savedProperty
          ? parseFloat(incident.savedProperty).toFixed(1)
          : "0.0",
      total: () => totals.savedProperty.toFixed(1),
      totalClassName: "text-right text-foreground font-mono",
    },
  ];

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
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-1">
                 <Label htmlFor="search-query" className="sr-only">Поиск</Label>
                 <div className="relative w-full max-w-sm">
                   <Input
                     id="search-query"
                     value={filters.searchQuery}
                     onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                     placeholder="Поиск по адресу, описанию..."
                     className="pr-8"
                     data-testid="input-search"
                   />
                   <Search className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                 </div>

                 {/* Modern Filter Popover */}
                 <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={hasFilters ? "border-primary text-primary" : ""}>
                         <Filter className="h-4 w-4 mr-2" />
                         Фильтры
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4" align="start">
                        <div className="space-y-4">
                           <h4 className="font-medium text-sm">Расширенный поиск</h4>
                           <div className="grid gap-2">
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
                                <Label htmlFor="incident-type" className="text-sm">Тип события</Label>
                                <select
                                  id="incident-type"
                                  value={filters.incidentType}
                                  onChange={(e) => setFilters({ ...filters, incidentType: e.target.value })}
                                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                  data-testid="select-incident-type"
                                >
                                  <option value="">Все типы</option>
                                  <option value="fire">Пожар</option>
                                  <option value="nonfire">Случай горения</option>
                                  <option value="steppe_fire">Степной пожар</option>
                                  <option value="steppe_smolder">Степное загорание</option>
                                  <option value="co_nofire">Отравление CO</option>
                                </select>
                              </div>

                              <div className="flex flex-col gap-1">
                                <Label htmlFor="region-filter" className="text-sm">Регион</Label>
                                <Input
                                  id="region-filter"
                                  value={filters.region}
                                  onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                                  placeholder="Регион"
                                  data-testid="input-region"
                                />
                              </div>

                              <div className="pt-2 flex justify-end">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      setFilters({
                                        searchQuery: "",
                                        dateFrom: "",
                                        dateTo: "",
                                        incidentType: "",
                                        region: "",
                                      })
                                    }
                                  >
                                    Сбросить
                                  </Button>
                              </div>
                            </div>
                        </div>
                    </PopoverContent>
                 </Popover>

                 <Popover>
                   <PopoverTrigger asChild>
                     <Button variant="outline" size="sm">
                       <Columns className="h-4 w-4 mr-2" />
                       Столбцы
                     </Button>
                   </PopoverTrigger>
                   <PopoverContent className="w-72 p-4" align="start">
                     <div className="space-y-3">
                       <div className="flex items-center justify-between">
                         <h4 className="font-medium text-sm">Отображение столбцов</h4>
                         <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => setVisibleColumns(DEFAULT_VISIBLE_COLUMNS)}
                         >
                           Сбросить
                         </Button>
                       </div>
                       <div className="space-y-2">
                         {columnDefinitions.map((column) => (
                           <label
                             key={column.id}
                             className="flex items-center gap-2 text-sm text-foreground"
                           >
                             <Checkbox
                               checked={isColumnVisible(column.id)}
                               onCheckedChange={(checked) => {
                                 setVisibleColumns((prev) => {
                                   if (checked) {
                                     return prev.includes(column.id)
                                       ? prev
                                       : [...prev, column.id];
                                   }
                                   return prev.filter((id) => id !== column.id);
                                 });
                               }}
                             />
                             {column.label}
                           </label>
                         ))}
                       </div>
                     </div>
                   </PopoverContent>
                 </Popover>

                 {hasFilters && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                         setFilters({
                           searchQuery: "",
                           dateFrom: "",
                           dateTo: "",
                           incidentType: "",
                           region: "",
                         })
                      }
                      title="Сбросить все"
                    >
                       <X className="h-4 w-4" />
                    </Button>
                 )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleLoad} data-testid="button-refresh">
                  <Search className="h-4 w-4 mr-2" />
                  Обновить
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreate}
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
                  Экспорт
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
                  {columnDefinitions
                    .filter((column) => isColumnVisible(column.id))
                    .map((column) => (
                      <th
                        key={column.id}
                        className={`text-left p-2 border-r border-border font-medium ${column.headerClassName ?? ""}`}
                      >
                        {column.label}
                      </th>
                    ))}
                  <th className="text-left p-2 font-medium min-w-[100px]">Действия</th>
                </tr>
              </thead>
              <tbody>
                {incidents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2 + visibleColumns.length + 1}
                      className="p-8 text-center text-muted-foreground border-b"
                    >
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
                          {currentOffset + index + 1}
                        </td>
                        {columnDefinitions
                          .filter((column) => isColumnVisible(column.id))
                          .map((column) => (
                            <td
                              key={column.id}
                              className={`p-2 border-r border-border ${column.cellClassName ?? ""}`}
                            >
                              {column.render(incident)}
                            </td>
                          ))}
                        <td className="p-2">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-primary hover:text-primary/80"
                              data-testid={`button-edit-${incident.id}`}
                              onClick={() => handleEdit(incident.id)}
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
                      {columnDefinitions
                        .filter((column) => isColumnVisible(column.id))
                        .map((column) => (
                          <td
                            key={`total-${column.id}`}
                            className={`p-2 border-r border-border ${column.totalClassName ?? ""}`}
                          >
                            {column.total ? column.total() : ""}
                          </td>
                        ))}
                      <td className="p-2"></td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border p-4 text-sm">
            <div className="text-muted-foreground">
              Показаны {startItem}-{endItem} из {totalIncidents}
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-muted-foreground">
                Записей на странице
                <select
                  className="rounded border border-border bg-background px-2 py-1 text-sm text-foreground"
                  value={pageSize}
                  onChange={(event) => setPageSize(Number(event.target.value))}
                >
                  {[25, 50, 100, 200].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                >
                  Назад
                </Button>
                <span className="text-muted-foreground">
                  Страница {page} из {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages}
                >
                  Вперед
                </Button>
              </div>
            </div>
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{editingIncidentId ? 'Редактирование' : 'Новое происшествие'}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  data-testid="button-close-form"
                >
                  ✕
                </Button>
              </div>
              <IncidentFormOSP
                incidentId={editingIncidentId || undefined}
                onSuccess={() => {
                  setIsModalOpen(false);
                  queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/incidents/search"] });
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Import Results Modal */}
      {importResults && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-lg">
             <div className="p-6">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="text-lg font-semibold">Результаты импорта</h3>
                   <Button variant="ghost" size="sm" onClick={() => setImportResults(null)}>✕</Button>
                 </div>

                 <div className="space-y-4">
                    <div className="flex gap-4">
                       <div className="p-3 bg-green-100 dark:bg-green-900 rounded-md flex-1 text-center">
                          <div className="text-2xl font-bold text-green-700 dark:text-green-300">{importResults.created}</div>
                          <div className="text-xs text-green-800 dark:text-green-200">Добавлено</div>
                       </div>
                       <div className="p-3 bg-red-100 dark:bg-red-900 rounded-md flex-1 text-center">
                          <div className="text-2xl font-bold text-red-700 dark:text-red-300">{importResults.errors.length}</div>
                          <div className="text-xs text-red-800 dark:text-red-200">Ошибок</div>
                       </div>
                    </div>

                    {importResults.errors.length > 0 && (
                       <div className="mt-4">
                          <h4 className="font-medium text-sm mb-2 text-destructive">Детали ошибок:</h4>
                          <div className="bg-muted p-3 rounded-md max-h-48 overflow-y-auto text-sm space-y-1">
                             {importResults.errors.map((err, i) => (
                                <div key={i} className="text-destructive-foreground">
                                   <span className="font-mono font-bold">Строка {err.rowNumber}:</span> {err.error}
                                </div>
                             ))}
                          </div>
                       </div>
                    )}

                    <div className="flex justify-end pt-2">
                       <Button onClick={() => setImportResults(null)}>Закрыть</Button>
                    </div>
                 </div>
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
