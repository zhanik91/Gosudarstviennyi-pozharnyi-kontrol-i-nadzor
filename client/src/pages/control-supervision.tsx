import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { ADMIN2_BY_REGION, REGION_NAMES } from "@/data/kazakhstan-data";
import ControlledObjectsRegistry from "@/components/controlled-objects/registry";

/** ===== Типы ===== */
type TabType = "registry" | "inspections" | "preventive" | "measures" | "reports";
type InspectionType = "scheduled" | "unscheduled" | "preventive" | "monitoring";
type InspectionStatus = "planned" | "in_progress" | "completed" | "canceled";
type PrescriptionStatus = "issued" | "in_progress" | "fulfilled" | "overdue" | "canceled";
type MeasureStatus = "draft" | "issued" | "in_progress" | "completed" | "canceled";
type MeasureType = "warning" | "order" | "fine" | "suspension" | "other";

type InspectionRow = {
  id: string;
  number: string;
  inspectionDate: string;
  type: InspectionType;
  status: InspectionStatus;
  region: string | null;
  district: string | null;
  subjectName: string | null;
  bin: string | null;
  iin: string | null;
  address: string | null;
  orgUnitId?: string | null;
  basis?: string | null;
  actNumber?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  hasPrescription?: boolean | null;
};

type PrescriptionItem = {
  id: string;
  inspectionId: string;
  number: string;
  issueDate: string;
  dueDate: string | null;
  status: PrescriptionStatus;
  region: string | null;
  district: string | null;
  bin: string | null;
  iin: string | null;
  description: string | null;
  inspectionNumber?: string | null;
  subjectName?: string | null;
  address?: string | null;
};

type MeasureItem = {
  id: string;
  relatedInspectionId: string | null;
  number: string;
  measureDate: string;
  type: MeasureType;
  status: MeasureStatus;
  region: string | null;
  district: string | null;
  bin: string | null;
  iin: string | null;
  description: string | null;
  inspectionNumber?: string | null;
  subjectName?: string | null;
  address?: string | null;
};

type ReportRow = {
  period: string;
  totalCount: number;
  plannedCount: number;
  completedCount: number;
};

/** ===== Постоянные ===== */
// Данные хранятся в БД через API /api/inspections

const REGIONS = REGION_NAMES;
const ADMIN2: Record<string, string[]> = ADMIN2_BY_REGION;

const INSPECTION_TYPES: Array<{ value: InspectionType; label: string }> = [
  { value: "scheduled", label: "Плановая" },
  { value: "unscheduled", label: "Внеплановая" },
  { value: "preventive", label: "Профилактическая" },
  { value: "monitoring", label: "Мониторинг" },
];

const INSPECTION_STATUSES: Array<{ value: InspectionStatus; label: string }> = [
  { value: "planned", label: "Запланирована" },
  { value: "in_progress", label: "В работе" },
  { value: "completed", label: "Завершена" },
  { value: "canceled", label: "Отменена" },
];

const INSPECTION_STATUS_STYLES: Record<InspectionStatus, string> = {
  planned: "bg-slate-500/20 text-slate-300",
  in_progress: "bg-amber-500/20 text-amber-300",
  completed: "bg-emerald-500/20 text-emerald-300",
  canceled: "bg-red-500/20 text-red-300",
};

const PRESCRIPTION_STATUSES: Array<{ value: PrescriptionStatus; label: string }> = [
  { value: "issued", label: "Выдано" },
  { value: "in_progress", label: "В работе" },
  { value: "fulfilled", label: "Исполнено" },
  { value: "overdue", label: "Просрочено" },
  { value: "canceled", label: "Отменено" },
];

const MEASURE_STATUSES: Array<{ value: MeasureStatus; label: string }> = [
  { value: "draft", label: "Черновик" },
  { value: "issued", label: "Выдано" },
  { value: "in_progress", label: "В работе" },
  { value: "completed", label: "Завершено" },
  { value: "canceled", label: "Отменено" },
];

const MEASURE_TYPES: Array<{ value: MeasureType; label: string }> = [
  { value: "warning", label: "Предупреждение" },
  { value: "order", label: "Предписание" },
  { value: "fine", label: "Штраф" },
  { value: "suspension", label: "Приостановка" },
  { value: "other", label: "Другое" },
];

const PRESCRIPTION_STATUS_STYLES: Record<PrescriptionStatus, string> = {
  issued: "bg-blue-500/20 text-blue-300",
  in_progress: "bg-amber-500/20 text-amber-300",
  fulfilled: "bg-emerald-500/20 text-emerald-300",
  overdue: "bg-red-500/20 text-red-300",
  canceled: "bg-slate-500/20 text-slate-300",
};

const MEASURE_STATUS_STYLES: Record<MeasureStatus, string> = {
  draft: "bg-slate-500/20 text-slate-300",
  issued: "bg-blue-500/20 text-blue-300",
  in_progress: "bg-amber-500/20 text-amber-300",
  completed: "bg-emerald-500/20 text-emerald-300",
  canceled: "bg-slate-500/20 text-slate-300",
};

const REPORT_PERIODS = [
  { value: "day", label: "День" },
  { value: "week", label: "Неделя" },
  { value: "month", label: "Месяц" },
  { value: "quarter", label: "Квартал" },
  { value: "year", label: "Год" },
];

const todayISO = () => new Date().toISOString().slice(0, 10);
const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("ru-RU");
};

const formatDateRange = (
  start?: string | null,
  end?: string | null,
  fallback?: string | null,
) => {
  if (start || end) {
    const startLabel = formatDate(start);
    const endLabel = formatDate(end);
    if (startLabel === "—" && endLabel !== "—") return endLabel;
    if (endLabel === "—" || startLabel === endLabel) return startLabel;
    return `${startLabel} — ${endLabel}`;
  }
  return formatDate(fallback);
};

const buildRegistryQuery = (filters: {
  region: string;
  district: string;
  status: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  period?: string;
  inspectionNumber?: string;
  type?: string;
}) => {
  const params = new URLSearchParams();
  if (filters.region && filters.region !== "Все") params.set("region", filters.region);
  if (filters.district && filters.district !== "Все") params.set("district", filters.district);
  if (filters.status && filters.status !== "Все") params.set("status", filters.status);
  if (filters.type && filters.type !== "Все") params.set("type", filters.type);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.search) params.set("search", filters.search.trim());
  if (filters.inspectionNumber) params.set("inspectionNumber", filters.inspectionNumber.trim());
  if (filters.period) params.set("period", filters.period);
  return params.toString();
};

/** ===== Компонент страницы ===== */
export default function ControlSupervisionPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("registry");
  const userRole = (user as any)?.role;
  const isMchsUser = userRole === "MCHS" || userRole === "admin";
  const isDchsUser = userRole === "DCHS";
  const isDistrictUser = userRole === "DISTRICT" || userRole === "OCHS";
  const userRegion = (user as any)?.region || "";
  const userDistrict = (user as any)?.district || "";

  // данные из API
  const { data: inspectionRows = [], isLoading: isLoadingInspections } = useQuery<InspectionRow[]>({
    queryKey: ['/api/inspections'],
    queryFn: async () => {
      const res = await fetch('/api/inspections', { credentials: 'include' });
      if (!res.ok) throw new Error('Ошибка загрузки');
      return res.json();
    }
  });

  // фильтры
  const [regionFilter, setRegionFilter] = useState("Все");
  const [districtFilter, setDistrictFilter] = useState("Все");
  const [inspectionTypeFilter, setInspectionTypeFilter] = useState<"Все" | InspectionType>("Все");
  const [inspectionStatusFilter, setInspectionStatusFilter] = useState<"Все" | InspectionStatus>("Все");
  const [inspectionSearch, setInspectionSearch] = useState("");

  const [prescriptionRegion, setPrescriptionRegion] = useState("Все");
  const [prescriptionDistrict, setPrescriptionDistrict] = useState("Все");
  const [prescriptionStatus, setPrescriptionStatus] = useState("Все");
  const [prescriptionDateFrom, setPrescriptionDateFrom] = useState("");
  const [prescriptionDateTo, setPrescriptionDateTo] = useState("");
  const [prescriptionSearch, setPrescriptionSearch] = useState("");
  const [prescriptionInspectionNumber, setPrescriptionInspectionNumber] = useState("");

  const [measureRegion, setMeasureRegion] = useState("Все");
  const [measureDistrict, setMeasureDistrict] = useState("Все");
  const [measureStatus, setMeasureStatus] = useState("Все");
  const [measureType, setMeasureType] = useState("Все");
  const [measureDateFrom, setMeasureDateFrom] = useState("");
  const [measureDateTo, setMeasureDateTo] = useState("");
  const [measureSearch, setMeasureSearch] = useState("");
  const [measureInspectionNumber, setMeasureInspectionNumber] = useState("");

  const [reportRegion, setReportRegion] = useState("Все");
  const [reportDistrict, setReportDistrict] = useState("Все");
  const [reportStatus, setReportStatus] = useState("Все");
  const [reportDateFrom, setReportDateFrom] = useState("");
  const [reportDateTo, setReportDateTo] = useState("");
  const [reportPeriod, setReportPeriod] = useState("month");

  useEffect(() => {
    if (!user || isMchsUser) return;
    if (userRegion) {
      setRegionFilter(userRegion);
    }
    if (isDistrictUser) {
      if (userDistrict) setDistrictFilter(userDistrict);
    } else if (isDchsUser) {
      setDistrictFilter((prev) => {
        if (!userRegion) return "Все";
        if (prev === "Все") return prev;
        const available = ADMIN2[userRegion] || [];
        return available.includes(prev) ? prev : "Все";
      });
    }
  }, [isDchsUser, isDistrictUser, isMchsUser, user, userDistrict, userRegion]);

  useEffect(() => {
    if (!user) return;
    const scopedRegion = isMchsUser ? "Все" : userRegion || "Все";
    const scopedDistrict = isDistrictUser ? (userDistrict || "Все") : "Все";

    setPrescriptionRegion(scopedRegion);
    setPrescriptionDistrict(scopedDistrict);
    setMeasureRegion(scopedRegion);
    setMeasureDistrict(scopedDistrict);
    setReportRegion(scopedRegion);
    setReportDistrict(scopedDistrict);
  }, [isDistrictUser, isMchsUser, user, userDistrict, userRegion]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab") as TabType | null;
    const allowedTabs: TabType[] = ["registry", "inspections", "preventive", "measures", "reports"];
    if (tab && allowedTabs.includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.pushState({}, "", url.toString());
  };

  const availableRegions = useMemo(() => {
    if (isMchsUser) return REGIONS;
    return userRegion ? [userRegion] : [];
  }, [isMchsUser, userRegion]);

  const availableDistricts = useMemo(() => {
    if (isMchsUser) {
      return regionFilter !== "Все" ? (ADMIN2[regionFilter] || []) : [];
    }
    if (!userRegion) return [];
    if (isDistrictUser) return userDistrict ? [userDistrict] : [];
    return ADMIN2[userRegion] || [];
  }, [isDistrictUser, isMchsUser, regionFilter, userDistrict, userRegion]);

  const getDistrictOptions = (regionValue: string) => {
    if (isMchsUser) {
      return regionValue !== "Все" ? (ADMIN2[regionValue] || []) : [];
    }
    if (!userRegion) return [];
    if (isDistrictUser) return userDistrict ? [userDistrict] : [];
    return ADMIN2[userRegion] || [];
  };

  /** ===== Фильтрация ===== */
  const filtered = useMemo(() => {
    let list = [...inspectionRows];
    if (!isMchsUser && userRegion) {
      list = list.filter(r => r.region === userRegion);
    }
    if (isDistrictUser && userDistrict) {
      list = list.filter(r => (r.district || "") === userDistrict);
    }
    if (regionFilter !== "Все") list = list.filter(r => r.region === regionFilter);
    if (districtFilter !== "Все") list = list.filter(r => (r.district||"") === districtFilter);
    if (inspectionTypeFilter !== "Все") list = list.filter(r => r.type === inspectionTypeFilter);
    if (inspectionStatusFilter !== "Все") list = list.filter(r => r.status === inspectionStatusFilter);
    if (inspectionSearch.trim()) {
      const qq = inspectionSearch.toLowerCase();
      list = list.filter(r =>
        [r.number, r.subjectName, r.bin, r.iin]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(qq)
      );
    }
    return list;
  }, [
    inspectionRows,
    regionFilter,
    districtFilter,
    inspectionTypeFilter,
    inspectionStatusFilter,
    inspectionSearch,
    isDistrictUser,
    isMchsUser,
    userDistrict,
    userRegion,
  ]);

  const prescriptionQuery = useMemo(() => buildRegistryQuery({
    region: prescriptionRegion,
    district: prescriptionDistrict,
    status: prescriptionStatus,
    dateFrom: prescriptionDateFrom,
    dateTo: prescriptionDateTo,
    search: prescriptionSearch,
    inspectionNumber: prescriptionInspectionNumber,
  }), [
    prescriptionRegion,
    prescriptionDistrict,
    prescriptionStatus,
    prescriptionDateFrom,
    prescriptionDateTo,
    prescriptionSearch,
    prescriptionInspectionNumber,
  ]);

  const measureQuery = useMemo(() => buildRegistryQuery({
    region: measureRegion,
    district: measureDistrict,
    status: measureStatus,
    type: measureType,
    dateFrom: measureDateFrom,
    dateTo: measureDateTo,
    search: measureSearch,
    inspectionNumber: measureInspectionNumber,
  }), [
    measureRegion,
    measureDistrict,
    measureStatus,
    measureType,
    measureDateFrom,
    measureDateTo,
    measureSearch,
    measureInspectionNumber,
  ]);

  const reportQuery = useMemo(() => buildRegistryQuery({
    region: reportRegion,
    district: reportDistrict,
    status: reportStatus,
    dateFrom: reportDateFrom,
    dateTo: reportDateTo,
    period: reportPeriod,
  }), [reportDistrict, reportRegion, reportStatus, reportDateFrom, reportDateTo, reportPeriod]);

  const { data: prescriptions = [], isLoading: isLoadingPrescriptions } = useQuery<PrescriptionItem[]>({
    queryKey: ['/api/control-supervision/prescriptions', prescriptionQuery],
    queryFn: async () => {
      const res = await fetch(`/api/control-supervision/prescriptions${prescriptionQuery ? `?${prescriptionQuery}` : ""}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Ошибка загрузки предписаний');
      return res.json();
    },
  });

  const { data: measuresData = [], isLoading: isLoadingMeasures } = useQuery<MeasureItem[]>({
    queryKey: ['/api/control-supervision/measures', measureQuery],
    queryFn: async () => {
      const res = await fetch(`/api/control-supervision/measures${measureQuery ? `?${measureQuery}` : ""}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Ошибка загрузки мер реагирования');
      return res.json();
    },
  });

  const { data: reportRows = [], isLoading: isLoadingReports } = useQuery<ReportRow[]>({
    queryKey: ['/api/control-supervision/reports', reportQuery],
    queryFn: async () => {
      const res = await fetch(`/api/control-supervision/reports${reportQuery ? `?${reportQuery}` : ""}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Ошибка загрузки отчёта');
      return res.json();
    },
  });

  const reportTotals = useMemo(() => {
    return reportRows.reduce(
      (acc, row) => ({
        totalCount: acc.totalCount + Number(row.totalCount || 0),
        plannedCount: acc.plannedCount + Number(row.plannedCount || 0),
        completedCount: acc.completedCount + Number(row.completedCount || 0),
      }),
      { totalCount: 0, plannedCount: 0, completedCount: 0 }
    );
  }, [reportRows]);

  const resetPrescriptionFilters = () => {
    setPrescriptionRegion(isMchsUser ? "Все" : userRegion || "Все");
    setPrescriptionDistrict(isDistrictUser ? (userDistrict || "Все") : "Все");
    setPrescriptionStatus("Все");
    setPrescriptionDateFrom("");
    setPrescriptionDateTo("");
    setPrescriptionSearch("");
    setPrescriptionInspectionNumber("");
  };

  const resetMeasureFilters = () => {
    setMeasureRegion(isMchsUser ? "Все" : userRegion || "Все");
    setMeasureDistrict(isDistrictUser ? (userDistrict || "Все") : "Все");
    setMeasureStatus("Все");
    setMeasureType("Все");
    setMeasureDateFrom("");
    setMeasureDateTo("");
    setMeasureSearch("");
    setMeasureInspectionNumber("");
  };

  const resetReportFilters = () => {
    setReportRegion(isMchsUser ? "Все" : userRegion || "Все");
    setReportDistrict(isDistrictUser ? (userDistrict || "Все") : "Все");
    setReportStatus("Все");
    setReportDateFrom("");
    setReportDateTo("");
    setReportPeriod("month");
  };

  /** ===== Импорт/экспорт ===== */
  const exportXLSX = () => {
    if (filtered.length === 0) { alert("Нет данных для экспорта"); return; }
    const data = filtered.map((r, i) => {
      return {
        "№": i + 1,
        "Регион": r.region,
        "Район": r.district || "",
        "Субъект": r.subjectName || "",
        "БИН/ИИН": r.bin || r.iin || "",
        "Объект": r.address || "",
        "Орган": r.orgUnitId || "",
        "Тип": INSPECTION_TYPES.find((t) => t.value === r.type)?.label ?? r.type,
        "Основание": r.basis || "",
        "№ акта": r.actNumber || "",
        "Номер проверки": r.number,
        "Дата проверки": formatDate(r.inspectionDate),
        "Статус": INSPECTION_STATUSES.find((s) => s.value === r.status)?.label ?? r.status,
        "Наличие предписания": r.hasPrescription === true ? "Да" : r.hasPrescription === false ? "Нет" : "",
      };
    });
    try {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, "Журнал проверок");
      XLSX.writeFile(wb, `zhurnal_proverok_${todayISO()}.xlsx`);
    } catch {
      // Fallback в CSV
      const header = Object.keys(data[0]);
      const csv =
        [header, ...data.map((o) => header.map((h) => String((o as any)[h]).replace(/"/g, '""')))]
          .map((row) => row.map((c) => `"${c}"`).join(";"))
          .join("\n");
      const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `zhurnal_proverok_${todayISO()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  /** ===== UI ===== */
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Заголовок */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              Государственный контроль и надзор
            </h1>
            <p className="text-slate-400">
              Реестр объектов, журнал проверок и контроль соблюдения требований пожарной безопасности
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="rounded-2xl bg-slate-800 px-4 py-2 text-sm font-medium hover:bg-slate-700"
              onClick={() => {
                setRegionFilter(isMchsUser ? "Все" : (userRegion || "Все"));
                if (isMchsUser || isDchsUser) {
                  setDistrictFilter("Все");
                } else {
                  setDistrictFilter(userDistrict || "Все");
                }
                setInspectionTypeFilter("Все");
                setInspectionStatusFilter("Все");
                setInspectionSearch("");
              }}
            >
              Очистить
            </button>
          </div>
        </header>

        <div className="border-b border-slate-800">
          <nav className="flex space-x-8 overflow-x-auto">
            {[
              { id: "registry", label: "🏢 Реестр объектов" },
              { id: "inspections", label: "📋 Журнал проверок" },
              { id: "preventive", label: "🧾 Списки проверок" },
              { id: "measures", label: "⚖️ Меры ОР" },
              { id: "reports", label: "📊 Отчёты" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as TabType)}
                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-slate-400 hover:text-slate-100 hover:border-slate-600"
                }`}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === "registry" && (
          <ControlledObjectsRegistry />
        )}

        {activeTab === "inspections" && (
          <>
            {/* Счётчик */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-sm">
              Всего проверок:&nbsp;
              <span className="font-semibold">
                {isLoadingInspections ? "Загрузка..." : filtered.length}
              </span>
            </div>

            {/* Панель фильтров */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                <div>
                  <label className="text-xs text-slate-400">Регион</label>
                  <select
                    value={regionFilter}
                    onChange={(e) => { setRegionFilter(e.target.value); setDistrictFilter("Все"); }}
                    disabled={!isMchsUser && Boolean(userRegion)}
                    className="block min-w-[220px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  >
                    {isMchsUser && <option>Все</option>}
                    {availableRegions.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400">Район / ГОС</label>
                  <select
                    value={districtFilter}
                    onChange={(e) => setDistrictFilter(e.target.value)}
                    disabled={isDistrictUser}
                    className="block min-w-[220px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  >
                    {(isMchsUser || isDchsUser) && <option>Все</option>}
                    {availableDistricts.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Тип проверки</label>
                  <select
                    value={inspectionTypeFilter}
                    onChange={(e) => setInspectionTypeFilter(e.target.value as "Все" | InspectionType)}
                    className="block min-w-[200px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  >
                    <option value="Все">Все</option>
                    {INSPECTION_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400">Статус проверки</label>
                  <select
                    value={inspectionStatusFilter}
                    onChange={(e) => setInspectionStatusFilter(e.target.value as "Все" | InspectionStatus)}
                    className="block min-w-[200px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  >
                    <option value="Все">Все</option>
                    {INSPECTION_STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400">Поиск: № / БИН / ИИН / субъект</label>
                <div className="relative">
                  <input
                    placeholder="Начните ввод…"
                    value={inspectionSearch}
                    onChange={(e) => setInspectionSearch(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 pr-8 text-sm"
                  />
                  <span className="pointer-events-none absolute right-2 top-2.5 text-slate-500">🔎</span>
                </div>
              </div>

              <div className="flex items-end gap-3">
                <button className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium hover:bg-emerald-500"
                        onClick={exportXLSX}>
                  ⬇️ Экспорт ({filtered.length})
                </button>
              </div>
            </section>

            {/* Таблица */}
            <section className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-900/60">
                  <tr className="text-left text-slate-300">
                    <th className="px-3 py-3">№</th>
                    <th className="px-3 py-3">Регион</th>
                    <th className="px-3 py-3">Район/город</th>
                    <th className="px-3 py-3">Субъект</th>
                    <th className="px-3 py-3">БИН/ИИН</th>
                    <th className="px-3 py-3">Объект</th>
                    <th className="px-3 py-3">Орган</th>
                    <th className="px-3 py-3">Тип</th>
                    <th className="px-3 py-3">Основание</th>
                    <th className="px-3 py-3">№ акта</th>
                    <th className="px-3 py-3">№ проверки</th>
                    <th className="px-3 py-3">Даты</th>
                    <th className="px-3 py-3">Статус</th>
                    <th className="px-3 py-3">Предписание</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingInspections ? (
                    <tr><td colSpan={14} className="px-3 py-10 text-center text-slate-400">Загрузка...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={14} className="px-3 py-10 text-center text-slate-400">Данных нет</td></tr>
                  ) : filtered.map((r, idx) => {
                    const statusLabel = INSPECTION_STATUSES.find((s) => s.value === r.status)?.label ?? r.status;
                    const typeLabel = INSPECTION_TYPES.find((t) => t.value === r.type)?.label ?? r.type;
                    const hasPrescriptionLabel =
                      r.hasPrescription === true ? "Да" : r.hasPrescription === false ? "Нет" : "—";
                    return (
                      <tr key={r.id} className="border-t border-slate-800 hover:bg-slate-900/40">
                        <td className="px-3 py-2">{idx + 1}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{r.region || "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{r.district || "—"}</td>
                        <td className="px-3 py-2">{r.subjectName || "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{r.bin || r.iin || "—"}</td>
                        <td className="px-3 py-2">{r.address || "—"}</td>
                        <td className="px-3 py-2">{r.orgUnitId || "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{typeLabel}</td>
                        <td className="px-3 py-2">{r.basis || "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{r.actNumber || "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{r.number}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {formatDateRange(r.startDate, r.endDate, r.inspectionDate)}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`rounded px-2 py-1 ${INSPECTION_STATUS_STYLES[r.status]}`}>{statusLabel}</span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">{hasPrescriptionLabel}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          </>
        )}

        {activeTab === "preventive" && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow">
            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
                type="button"
              >
                Создать — сформировать списки
              </button>
              <button
                className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium hover:bg-slate-700"
                type="button"
              >
                Проанализировать субъективные критерии
              </button>
            </div>
          </section>
        )}

        {activeTab === "measures" && (
          <>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">Предписания</h2>
                <span className="text-sm text-slate-400">Раздел перенесён в «Меры ОР».</span>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-sm">
                Всего предписаний:&nbsp;
                <span className="font-semibold">
                  {isLoadingPrescriptions ? "Загрузка..." : prescriptions.length}
                </span>
              </div>
            </div>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow space-y-3">
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="text-xs text-slate-400">Регион</label>
                  <select
                    value={prescriptionRegion}
                    onChange={(e) => { setPrescriptionRegion(e.target.value); setPrescriptionDistrict("Все"); }}
                    disabled={!isMchsUser && Boolean(userRegion)}
                    className="block min-w-[220px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  >
                    {isMchsUser && <option>Все</option>}
                    {availableRegions.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400">Район / ГОС</label>
                  <select
                    value={prescriptionDistrict}
                    onChange={(e) => setPrescriptionDistrict(e.target.value)}
                    disabled={isDistrictUser}
                    className="block min-w-[220px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  >
                    {(isMchsUser || isDchsUser) && <option>Все</option>}
                    {getDistrictOptions(prescriptionRegion).map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400">Статус</label>
                  <select
                    value={prescriptionStatus}
                    onChange={(e) => setPrescriptionStatus(e.target.value)}
                    className="block min-w-[180px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  >
                    <option value="Все">Все</option>
                    {PRESCRIPTION_STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400">Дата выдачи</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={prescriptionDateFrom}
                      onChange={(e) => setPrescriptionDateFrom(e.target.value)}
                      className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    />
                    <span className="text-slate-500">—</span>
                    <input
                      type="date"
                      value={prescriptionDateTo}
                      onChange={(e) => setPrescriptionDateTo(e.target.value)}
                      className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400">Номер проверки</label>
                <input
                  placeholder="Например: 123/2024"
                  value={prescriptionInspectionNumber}
                  onChange={(e) => setPrescriptionInspectionNumber(e.target.value)}
                  className="block min-w-[220px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Поиск: номер / БИН / ИИН / описание</label>
                <div className="relative">
                  <input
                    placeholder="Начните ввод…"
                    value={prescriptionSearch}
                    onChange={(e) => setPrescriptionSearch(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 pr-8 text-sm"
                  />
                  <span className="pointer-events-none absolute right-2 top-2.5 text-slate-500">🔎</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm hover:bg-slate-800"
                  onClick={resetPrescriptionFilters}
                  type="button"
                >
                  Очистить фильтры
                </button>
              </div>
            </section>

            <section className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-900/60">
                  <tr className="text-left text-slate-300">
                    <th className="px-3 py-3">№</th>
                    <th className="px-3 py-3">Дата выдачи</th>
                    <th className="px-3 py-3">Номер</th>
                    <th className="px-3 py-3">Статус</th>
                    <th className="px-3 py-3">Срок исполнения</th>
                    <th className="px-3 py-3">Номер проверки</th>
                    <th className="px-3 py-3">Субъект</th>
                    <th className="px-3 py-3">Регион</th>
                    <th className="px-3 py-3">Район</th>
                    <th className="px-3 py-3">БИН/ИИН</th>
                    <th className="px-3 py-3">Описание</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingPrescriptions ? (
                    <tr><td colSpan={11} className="px-3 py-10 text-center text-slate-400">Загрузка...</td></tr>
                  ) : prescriptions.length === 0 ? (
                    <tr><td colSpan={11} className="px-3 py-10 text-center text-slate-400">Данных нет</td></tr>
                  ) : prescriptions.map((item, idx) => {
                    const statusLabel = PRESCRIPTION_STATUSES.find((s) => s.value === item.status)?.label ?? item.status;
                    return (
                      <tr key={item.id} className="border-t border-slate-800 hover:bg-slate-900/40">
                        <td className="px-3 py-2">{idx + 1}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{formatDate(item.issueDate)}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{item.number}</td>
                        <td className="px-3 py-2">
                          <span className={`rounded px-2 py-1 ${PRESCRIPTION_STATUS_STYLES[item.status]}`}>{statusLabel}</span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">{formatDate(item.dueDate)}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{item.inspectionNumber || "—"}</td>
                        <td className="px-3 py-2">{item.subjectName || "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{item.region || "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{item.district || "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{item.bin || item.iin || "—"}</td>
                        <td className="px-3 py-2">{item.description || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>

            <div className="pt-4">
              <h2 className="text-lg font-semibold">Меры реагирования</h2>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-sm">
              Всего мер реагирования:&nbsp;
              <span className="font-semibold">
                {isLoadingMeasures ? "Загрузка..." : measuresData.length}
              </span>
            </div>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow space-y-3">
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="text-xs text-slate-400">Регион</label>
                  <select
                    value={measureRegion}
                    onChange={(e) => { setMeasureRegion(e.target.value); setMeasureDistrict("Все"); }}
                    disabled={!isMchsUser && Boolean(userRegion)}
                    className="block min-w-[220px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  >
                    {isMchsUser && <option>Все</option>}
                    {availableRegions.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400">Район / ГОС</label>
                  <select
                    value={measureDistrict}
                    onChange={(e) => setMeasureDistrict(e.target.value)}
                    disabled={isDistrictUser}
                    className="block min-w-[220px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  >
                    {(isMchsUser || isDchsUser) && <option>Все</option>}
                    {getDistrictOptions(measureRegion).map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400">Статус</label>
                  <select
                    value={measureStatus}
                    onChange={(e) => setMeasureStatus(e.target.value)}
                    className="block min-w-[180px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  >
                    <option value="Все">Все</option>
                    {MEASURE_STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400">Тип меры</label>
                  <select
                    value={measureType}
                    onChange={(e) => setMeasureType(e.target.value)}
                    className="block min-w-[200px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  >
                    <option value="Все">Все</option>
                    {MEASURE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400">Дата меры</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={measureDateFrom}
                      onChange={(e) => setMeasureDateFrom(e.target.value)}
                      className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    />
                    <span className="text-slate-500">—</span>
                    <input
                      type="date"
                      value={measureDateTo}
                      onChange={(e) => setMeasureDateTo(e.target.value)}
                      className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400">Номер проверки</label>
                <input
                  placeholder="Например: 123/2024"
                  value={measureInspectionNumber}
                  onChange={(e) => setMeasureInspectionNumber(e.target.value)}
                  className="block min-w-[220px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Поиск: номер / БИН / ИИН / описание</label>
                <div className="relative">
                  <input
                    placeholder="Начните ввод…"
                    value={measureSearch}
                    onChange={(e) => setMeasureSearch(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 pr-8 text-sm"
                  />
                  <span className="pointer-events-none absolute right-2 top-2.5 text-slate-500">🔎</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm hover:bg-slate-800"
                  onClick={resetMeasureFilters}
                  type="button"
                >
                  Очистить фильтры
                </button>
              </div>
            </section>

            <section className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-900/60">
                  <tr className="text-left text-slate-300">
                    <th className="px-3 py-3">№</th>
                    <th className="px-3 py-3">Дата</th>
                    <th className="px-3 py-3">Номер</th>
                    <th className="px-3 py-3">Тип</th>
                    <th className="px-3 py-3">Статус</th>
                    <th className="px-3 py-3">Номер проверки</th>
                    <th className="px-3 py-3">Субъект</th>
                    <th className="px-3 py-3">Регион</th>
                    <th className="px-3 py-3">Район</th>
                    <th className="px-3 py-3">БИН/ИИН</th>
                    <th className="px-3 py-3">Описание</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingMeasures ? (
                    <tr><td colSpan={11} className="px-3 py-10 text-center text-slate-400">Загрузка...</td></tr>
                  ) : measuresData.length === 0 ? (
                    <tr><td colSpan={11} className="px-3 py-10 text-center text-slate-400">Данных нет</td></tr>
                  ) : measuresData.map((item, idx) => {
                    const statusLabel = MEASURE_STATUSES.find((s) => s.value === item.status)?.label ?? item.status;
                    const typeLabel = MEASURE_TYPES.find((t) => t.value === item.type)?.label ?? item.type;
                    return (
                      <tr key={item.id} className="border-t border-slate-800 hover:bg-slate-900/40">
                        <td className="px-3 py-2">{idx + 1}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{formatDate(item.measureDate)}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{item.number}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{typeLabel}</td>
                        <td className="px-3 py-2">
                          <span className={`rounded px-2 py-1 ${MEASURE_STATUS_STYLES[item.status]}`}>{statusLabel}</span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">{item.inspectionNumber || "—"}</td>
                        <td className="px-3 py-2">{item.subjectName || "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{item.region || "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{item.district || "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{item.bin || item.iin || "—"}</td>
                        <td className="px-3 py-2">{item.description || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          </>
        )}

        {activeTab === "reports" && (
          <>
            <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow space-y-3">
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="text-xs text-slate-400">Период агрегации</label>
                  <select
                    value={reportPeriod}
                    onChange={(e) => setReportPeriod(e.target.value)}
                    className="block min-w-[180px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  >
                    {REPORT_PERIODS.map((period) => (
                      <option key={period.value} value={period.value}>{period.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400">Регион</label>
                  <select
                    value={reportRegion}
                    onChange={(e) => { setReportRegion(e.target.value); setReportDistrict("Все"); }}
                    disabled={!isMchsUser && Boolean(userRegion)}
                    className="block min-w-[220px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  >
                    {isMchsUser && <option>Все</option>}
                    {availableRegions.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400">Район / ГОС</label>
                  <select
                    value={reportDistrict}
                    onChange={(e) => setReportDistrict(e.target.value)}
                    disabled={isDistrictUser}
                    className="block min-w-[220px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  >
                    {(isMchsUser || isDchsUser) && <option>Все</option>}
                    {getDistrictOptions(reportRegion).map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400">Статус проверок</label>
                  <select
                    value={reportStatus}
                    onChange={(e) => setReportStatus(e.target.value)}
                    className="block min-w-[180px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  >
                    <option value="Все">Все</option>
                    {INSPECTION_STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400">Период дат</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={reportDateFrom}
                      onChange={(e) => setReportDateFrom(e.target.value)}
                      className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    />
                    <span className="text-slate-500">—</span>
                    <input
                      type="date"
                      value={reportDateTo}
                      onChange={(e) => setReportDateTo(e.target.value)}
                      className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm hover:bg-slate-800"
                  onClick={resetReportFilters}
                  type="button"
                >
                  Очистить фильтры
                </button>
              </div>
            </section>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                <p className="text-xs uppercase text-slate-400">Всего проверок</p>
                <p className="text-2xl font-semibold">{reportTotals.totalCount}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                <p className="text-xs uppercase text-slate-400">Запланировано</p>
                <p className="text-2xl font-semibold">{reportTotals.plannedCount}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                <p className="text-xs uppercase text-slate-400">Завершено</p>
                <p className="text-2xl font-semibold">{reportTotals.completedCount}</p>
              </div>
            </div>

            <section className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-900/60">
                  <tr className="text-left text-slate-300">
                    <th className="px-3 py-3">Период</th>
                    <th className="px-3 py-3">Всего</th>
                    <th className="px-3 py-3">Запланировано</th>
                    <th className="px-3 py-3">Завершено</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingReports ? (
                    <tr><td colSpan={4} className="px-3 py-10 text-center text-slate-400">Загрузка...</td></tr>
                  ) : reportRows.length === 0 ? (
                    <tr><td colSpan={4} className="px-3 py-10 text-center text-slate-400">Данных нет</td></tr>
                  ) : reportRows.map((row) => (
                    <tr key={row.period} className="border-t border-slate-800 hover:bg-slate-900/40">
                      <td className="px-3 py-2 whitespace-nowrap">{formatDate(row.period)}</td>
                      <td className="px-3 py-2">{row.totalCount}</td>
                      <td className="px-3 py-2">{row.plannedCount}</td>
                      <td className="px-3 py-2">{row.completedCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )}
      </div>

    </div>
  );
}
