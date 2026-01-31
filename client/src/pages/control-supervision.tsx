import React, { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { ADMIN2_BY_REGION, REGION_NAMES } from "@/data/kazakhstan-data";
import { apiRequest } from "@/lib/queryClient";

/** ===== Типы ===== */
type TabType = "registry" | "inspections" | "preventive" | "measures" | "reports";
type InspectionType = "scheduled" | "unscheduled" | "preventive" | "monitoring";
type InspectionStatus = "planned" | "in_progress" | "completed" | "canceled";
type PrescriptionStatus = "issued" | "in_progress" | "fulfilled" | "overdue" | "canceled";
type MeasureStatus = "draft" | "issued" | "in_progress" | "completed" | "canceled";
type MeasureType = "warning" | "order" | "fine" | "suspension" | "other";

type InspectionItem = {
  id: string;
  number: string;
  inspectionDate: string;
  type: InspectionType;
  status: InspectionStatus;
  region: string | null;
  district: string | null;
  bin: string | null;
  iin: string | null;
  subjectName: string | null;
  address: string | null;
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

type InspectionRow = {
  id: string;
  number: string;
  inspectionDate: string;
  type: InspectionType;
  status: InspectionStatus;
  ukpsisuCheckNumber: string | null;
  ukpsisuRegistrationDate: string | null;
  assigningAuthority: string | null;
  registrationAuthority: string | null;
  inspectionKind: string | null;
  inspectedObjects: string | null;
  basis: string | null;
  inspectionPeriod: string | null;
  extensionPeriod: string | null;
  suspensionResumptionDates: string | null;
  actualStartDate: string | null;
  actualEndDate: string | null;
  result: string | null;
  violationsCount: number | null;
  violationsDeadline: string | null;
  ticketRegistrationDate: string | null;
  region: string | null;
  district: string | null;
  bin: string | null;
  iin: string | null;
  subjectName: string | null;
  address: string | null;
};

/** ===== Постоянные ===== */
// Данные хранятся в БД через API /api/control-objects

const REGIONS = REGION_NAMES;
const ADMIN2: Record<string, string[]> = ADMIN2_BY_REGION;

const STATUSES: Status[] = ["Активный","Не функционирует"];
const BIZ_CATS: BizCat[] = ["Микро","Малый","Средний","Крупный"];

const INSPECTION_STATUSES: Array<{ value: InspectionStatus; label: string }> = [
  { value: "planned", label: "Запланирована" },
  { value: "in_progress", label: "В работе" },
  { value: "completed", label: "Завершена" },
  { value: "canceled", label: "Отменена" },
];

const INSPECTION_TYPES: Array<{ value: InspectionType; label: string }> = [
  { value: "scheduled", label: "Плановая" },
  { value: "unscheduled", label: "Внеплановая" },
  { value: "preventive", label: "Профилактическая" },
  { value: "monitoring", label: "Мониторинг" },
];

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

/** ===== Объективные категории (краткий label + полный full) ===== */
// Высокая
const HIGH: CategoryItem[] = [
  { id:"H1", label:"Производственные А/Б, В1–В4 ≥2000 м²", full:"производственные предприятия с категорией по взрывопожарной и пожарной опасности зданий и помещений 'А','Б' — независимо от площади; 'В1'-'В4' общей площадью строений 2000+ м²" },
  { id:"H2", label:"Склады А/Б, В1–В4 ≥2500 м²", full:"объекты хранения с категориями 'А','Б','В1'-'В4' — общей площадью строений 2500+ м²; открытые склады газовых баллонов, лесных материалов, угля, грубых кормов — 2500+ м²" },
  { id:"H3", label:"Нефтебазы/терминалы/перекачка", full:"нефтебазы, склады нефтепродуктов, нефтетерминалы, нефтеперекачивающие станции" },
  { id:"H4", label:"Газовые станции", full:"газохранилища, газгольдерные, газоперекачивающие, газонаполнительные и газокомпрессорные станции" },
  { id:"H5", label:"АЗС/ГАЗС", full:"автомобильные заправочные и газозаправочные станции (стационарные и передвижные)" },
  { id:"H6", label:"ВВ/утилизация", full:"объекты хранения/ликвидации ВВ, вооружений, военной техники и спецсредств и т. п." },
  { id:"H7", label:"ТРЦ ≥2000 м² и особые случаи", full:"торговые/развлекательные центры (единый объект) — 2000+ м²; особые случаи для одно-/двухэтажных и ≥3 этажей" },
  { id:"H8", label:"Встроенные магазины в МКД ≥2000 м²", full:"встроенные (в т. ч. объединённые площадью) — 2000+ м²" },
  { id:"H9", label:"Мед. стационары и АПП ≥2000 м²", full:"медорганизации стационар — независимо от площади; амбулаторно-поликлиническая помощь — 2000+ м²" },
  { id:"H10", label:"Интернаты/хосписы", full:"медико-социальные учреждения, интернаты, ДД, ДИ, хосписы и пр." },
  { id:"H11", label:"Организации образования", full:"организации образования, учебные заведения" },
  { id:"H12", label:"Общежития/гостиницы ≥2000 м²", full:"—" },
  { id:"H13", label:"Вахтовые ≥2000 м²", full:"—" },
  { id:"H14", label:"МКД >28 м", full:"многоквартирные жилые дома высотой более 28 м" },
  { id:"H15", label:"Адм./МФК ≥2500 м² или >28 м", full:"—" },
  { id:"H16", label:"Аэропорт/вокзал/порт/метро ≥2000 м²", full:"—" },
  { id:"H17", label:"Общепит ≥2000 м²", full:"—" },
  { id:"H18", label:"Объекты ВС и правоохр.", full:"—" },
  { id:"H19", label:"Культурные/религ. ≥2000 м²", full:"—" },
  { id:"H20", label:"Спорткомплексы ≥2000 м²", full:"—" },
  { id:"H21", label:"СТО ≥1500 м²", full:"—" },
  { id:"H22", label:"Паркинги ≥1500 м²", full:"—" },
  { id:"H23", label:"Элеваторы/зерно", full:"—" },
  { id:"H24", label:"СХ/птицефабрики ≥2500 м²", full:"—" },
  { id:"H25", label:"Бытовые услуги ≥2000 м²", full:"—" },
  { id:"H26", label:"ТЭС/ГТЭС", full:"—" },
  { id:"H27", label:"ГЭС ≥250 МВт", full:"—" },
  { id:"H28", label:"Подстанции ≥220 кВ", full:"—" },
  { id:"H29", label:"Котельные ≥50 Гкал/ч", full:"—" },
  { id:"H30", label:"Турбазы/ДОЛ ≥1000 м²", full:"—" },
  { id:"H31", label:"ЛС/МИ ≥2000 м²", full:"—" },
  { id:"H32", label:"ЦОД/ДЦ ≥2500 м²", full:"—" },
  { id:"H33", label:"Архивы/библиотеки ≥1000 м²", full:"—" },
  { id:"H34", label:"Эксплуатация ВК/ППВ", full:"—" },
  { id:"H35", label:"Лесохозяйственные учреждения", full:"—" },
  { id:"H36", label:"Негос. ПС объекта", full:"—" },
];
// Средняя
const MEDIUM: CategoryItem[] = [
  { id:"M1", label:"Производственные В1–В4 ≤1999 м²", full:"—" },
  { id:"M2", label:"Склады А/Б, В1–В4 1000–2499 м²", full:"—" },
  { id:"M3", label:"ТРЦ 1000–1999 м²", full:"—" },
  { id:"M4", label:"Встроенные магазины 1000–1999 м²", full:"—" },
  { id:"M5", label:"Поликлиники 1000–1999 м²", full:"—" },
  { id:"M6", label:"Общежития/гостиницы 1000–1999 м²", full:"—" },
  { id:"M7", label:"Вахтовые 1000–1999 м²", full:"—" },
  { id:"M8", label:"Адм./МФК 1500–2499 м²", full:"—" },
  { id:"M9", label:"Аэропорт/вокзал/порт/метро 1000–1999 м²", full:"—" },
  { id:"M10", label:"Общепит 1000–1999 м²", full:"—" },
  { id:"M11", label:"Культурные/религ. 1000–1999 м²", full:"—" },
  { id:"M12", label:"Спорткомплексы 1000–1999 м²", full:"—" },
  { id:"M13", label:"СТО 1000–1499 м²", full:"—" },
  { id:"M14", label:"Паркинги 1000–1499 м²", full:"—" },
  { id:"M15", label:"СХ/птицефабрики 1000–2499 м²", full:"—" },
  { id:"M16", label:"Бытовые услуги 1000–1499 м²", full:"—" },
  { id:"M17", label:"Подстанции 110–219 кВ", full:"—" },
  { id:"M18", label:"Котельные <50 Гкал/ч", full:"—" },
  { id:"M19", label:"Турбазы/отдых ≤999 м²", full:"—" },
  { id:"M20", label:"ЛС/МИ 1000–1999 м²", full:"—" },
  { id:"M21", label:"ЦОД/ДЦ 1500–2499 м²", full:"—" },
  { id:"M22", label:"Архивы/библиотеки 500–999 м²", full:"—" },
  { id:"M23", label:"Негос. ПС — член СРО", full:"—" },
];
// Низкая
const LOW: CategoryItem[] = [
  { id:"L1", label:"Производственные Г/Д", full:"—" },
  { id:"L2", label:"Склады А/Б, В1–В4 ≤999 м²", full:"—" },
  { id:"L3", label:"ГЭС <250 МВт", full:"—" },
  { id:"L4", label:"Ветровые/солнечные/газопоршневые", full:"—" },
  { id:"L5", label:"Поликлиники ≤999 м²", full:"—" },
  { id:"L6", label:"Детско-подростковые клубы", full:"—" },
  { id:"L7", label:"Общежития/гостиницы ≤999 м²", full:"—" },
  { id:"L8", label:"Аэропорт/вокзал/порт/метро ≤999 м²", full:"—" },
  { id:"L9", label:"ТРЦ ≤999 м²", full:"—" },
  { id:"L10", label:"Встроенные магазины ≤999 м²", full:"—" },
  { id:"L11", label:"Культурные/религ. ≤999 м²", full:"—" },
  { id:"L12", label:"Спорткомплексы ≤999 м²", full:"—" },
  { id:"L13", label:"Архивы/библиотеки ≤499 м²", full:"—" },
  { id:"L14", label:"МКД <28 м / ИЖД", full:"—" },
  { id:"L15", label:"ЦОД/ДЦ ≤1499 м²", full:"—" },
  { id:"L16", label:"СХ/птицефабрики ≤999 м²", full:"—" },
  { id:"L17", label:"ЛС/МИ ≤999 м²", full:"—" },
  { id:"L18", label:"Общепит ≤999 м²", full:"—" },
  { id:"L19", label:"Бытовые услуги ≤999 м²", full:"—" },
  { id:"L20", label:"Паркинги ≤999 м²", full:"—" },
  { id:"L21", label:"СТО ≤999 м²", full:"—" },
  { id:"L22", label:"Адм./МФК ≤1499 м²", full:"—" },
  { id:"L23", label:"Вахтовые ≤999 м²", full:"—" },
  { id:"L24", label:"Подстанции <110 кВ", full:"—" },
  { id:"L25", label:"Экспертные организации по аудиту ПБ", full:"—" },
]; // ← здесь была ошибка: должно быть ];, а не };

const CATS: Record<ObjectiveLevel, CategoryItem[]> = {
  Высокая: HIGH,
  Средняя: MEDIUM,
  Низкая: LOW,
};

const todayISO = () => new Date().toISOString().slice(0, 10);
const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("ru-RU");
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
  // MCHS имеет доступ только для чтения, остальные могут редактировать
  const canEdit = userRole !== "MCHS";
  const userRegion = (user as any)?.region || "";
  const userDistrict = (user as any)?.district || "";

  // данные из API
  const queryClient = useQueryClient();
  
  // Загрузка данных из БД
  const { data: apiRows = [], isLoading: isLoadingData } = useQuery<any[]>({
    queryKey: ['/api/control-objects'],
    queryFn: async () => {
      const res = await fetch('/api/control-objects', { credentials: 'include' });
      if (!res.ok) throw new Error('Ошибка загрузки');
      return res.json();
    }
  });
  
  // Преобразование данных API в формат компонента
  const rows: ControlledObject[] = useMemo(() => {
    return apiRows.map((obj: any) => {
      const details = obj.details || {};
      return {
        id: obj.id,
        region: obj.region || '',
        district: obj.district || '',
        subjectName: details.subjectName || obj.name || '',
        subjectBIN: details.subjectBIN || '',
        objectName: obj.name || '',
        address: obj.address || '',
        entrepreneurshipCategory: details.entrepreneurshipCategory || 'Микро',
        status: obj.status === 'active' ? 'Активный' : 'Не функционирует',
        objectiveLevel: details.objectiveLevel || obj.category || 'Низкая',
        objectiveCategoryId: details.objectiveCategoryId || obj.subcategory || '',
        characteristics: details.characteristics || {
          hasPrivateFireService: false, buildingType: '', heightMeters: '', walls: '', partitions: '',
          heating: '', lighting: '', hasAttic: false, hasBasement: false, hasParking: false,
          primaryExtinguishing: '', hasAUPT: false, hasAPS: false, apsServiceOrg: '',
          outsideWater: '', insideWater: ''
        },
        subjective: details.subjective || { prevViolations: 0, incidents12m: 0, powerOverload: false, otherRiskNotes: '' },
      };
    });
  }, [apiRows]);

  // Мутации для CRUD операций
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/control-objects', data);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/control-objects'] })
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest('PUT', `/api/control-objects/${id}`, data);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/control-objects'] })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/control-objects/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/control-objects'] })
  });

  const createInspectionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/inspections', data);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/inspections'] }),
  });

  const updateInspectionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest('PUT', `/api/inspections/${id}`, data);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/inspections'] }),
  });

  // фильтры
  const [regionFilter, setRegionFilter] = useState("Все");
  const [districtFilter, setDistrictFilter] = useState("Все");
  const [levelFilter, setLevelFilter] = useState<"Все"|ObjectiveLevel>("Все");
  const [catFilter, setCatFilter] = useState<string>("Все");
  const [statusFilter, setStatusFilter] = useState<"Все"|Status>("Все");
  const [q, setQ] = useState("");
  const [showAdditionalFilters, setShowAdditionalFilters] = useState(false);

  const [inspectionRegion, setInspectionRegion] = useState("Все");
  const [inspectionDistrict, setInspectionDistrict] = useState("Все");
  const [inspectionStatus, setInspectionStatus] = useState("Все");
  const [inspectionType, setInspectionType] = useState("Все");
  const [inspectionDateFrom, setInspectionDateFrom] = useState("");
  const [inspectionDateTo, setInspectionDateTo] = useState("");
  const [inspectionSearch, setInspectionSearch] = useState("");
  const [inspectionNumber, setInspectionNumber] = useState("");

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

  // форма/модалки
  const blankChars = (): ObjectCharacteristics => ({
    hasPrivateFireService:false, buildingType:"", heightMeters:"", walls:"", partitions:"",
    heating:"", lighting:"", hasAttic:false, hasBasement:false, hasParking:false,
    primaryExtinguishing:"", hasAUPT:false, hasAPS:false, apsServiceOrg:"",
    outsideWater:"", insideWater:""
  });
  const blankSubj = (): SubjectiveCriteria => ({ prevViolations:0, incidents12m:0, powerOverload:false, otherRiskNotes:"" });

  const blank: ControlledObject = {
    id:"",
    region: userRegion || REGIONS[0],
    district: userDistrict || "",
    subjectName:"",
    subjectBIN:"",
    objectName:"",
    address:"",
    entrepreneurshipCategory:"Микро",
    status:"Активный",
    objectiveLevel:"Низкая",
    objectiveCategoryId:"",
    characteristics: blankChars(),
    subjective: blankSubj(),
  };

  const blankInspection: InspectionRow = {
    id: "",
    number: "",
    inspectionDate: todayISO(),
    type: "scheduled",
    status: "planned",
    ukpsisuCheckNumber: "",
    ukpsisuRegistrationDate: "",
    assigningAuthority: "",
    registrationAuthority: "",
    inspectionKind: "",
    inspectedObjects: "",
    basis: "",
    inspectionPeriod: "",
    extensionPeriod: "",
    suspensionResumptionDates: "",
    actualStartDate: "",
    actualEndDate: "",
    result: "",
    violationsCount: null,
    violationsDeadline: "",
    ticketRegistrationDate: "",
    region: userRegion || "",
    district: userDistrict || "",
    bin: "",
    iin: "",
    subjectName: "",
    address: "",
  };

  const [openForm, setOpenForm] = useState(false);
  const [openCharacteristics, setOpenCharacteristics] = useState(false);
  const [openSubjective, setOpenSubjective] = useState(false);
  const [editingId, setEditingId] = useState<string|null>(null);
  const [form, setForm] = useState<ControlledObject>({...blank});
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [confirmId, setConfirmId] = useState<string|null>(null);
  const [openInspectionForm, setOpenInspectionForm] = useState(false);
  const [inspectionErrors, setInspectionErrors] = useState<Record<string, string>>({});
  const [editingInspectionId, setEditingInspectionId] = useState<string | null>(null);
  const [inspectionForm, setInspectionForm] = useState<InspectionRow>({ ...blankInspection });

  // импорт/экспорт
  const fileRef = useRef<HTMLInputElement>(null);

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

    setInspectionRegion(scopedRegion);
    setInspectionDistrict(scopedDistrict);
    setPrescriptionRegion(scopedRegion);
    setPrescriptionDistrict(scopedDistrict);
    setInspectionRegion(scopedRegion);
    setInspectionDistrict(scopedDistrict);
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

  const availableFormRegions = useMemo(() => {
    if (isMchsUser) return REGIONS;
    return userRegion ? [userRegion] : [];
  }, [isMchsUser, userRegion]);

  const availableFormDistricts = useMemo(() => {
    if (isMchsUser) return ADMIN2[form.region] || [];
    if (!userRegion) return [];
    if (isDistrictUser) return userDistrict ? [userDistrict] : [];
    return ADMIN2[userRegion] || [];
  }, [form.region, isDistrictUser, isMchsUser, userDistrict, userRegion]);

  const availableInspectionRegions = useMemo(() => {
    if (isMchsUser) return REGIONS;
    return userRegion ? [userRegion] : [];
  }, [isMchsUser, userRegion]);

  const availableInspectionDistricts = useMemo(() => {
    if (isMchsUser) return ADMIN2[inspectionForm.region || ""] || [];
    if (!userRegion) return [];
    if (isDistrictUser) return userDistrict ? [userDistrict] : [];
    return ADMIN2[userRegion] || [];
  }, [inspectionForm.region, isDistrictUser, isMchsUser, userDistrict, userRegion]);

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
    let list = [...rows];
    if (!isMchsUser && userRegion) {
      list = list.filter(r => r.region === userRegion);
    }
    if (isDistrictUser && userDistrict) {
      list = list.filter(r => (r.district || "") === userDistrict);
    }
    if (regionFilter !== "Все") list = list.filter(r => r.region === regionFilter);
    if (districtFilter !== "Все") list = list.filter(r => (r.district||"") === districtFilter);
    if (levelFilter !== "Все") list = list.filter(r => r.objectiveLevel === levelFilter);
    if (catFilter !== "Все") list = list.filter(r => r.objectiveCategoryId === catFilter);
    if (statusFilter !== "Все") list = list.filter(r => r.status === statusFilter);
    if (q.trim()) {
      const qq = q.toLowerCase();
      list = list.filter(r =>
        [r.subjectName, r.objectName, r.subjectBIN, r.address].join(" ").toLowerCase().includes(qq)
      );
    }
    return list;
  }, [rows, regionFilter, districtFilter, levelFilter, catFilter, statusFilter, q, isDistrictUser, isMchsUser, userDistrict, userRegion]);

  const inspectionQuery = useMemo(() => buildRegistryQuery({
    region: inspectionRegion,
    district: inspectionDistrict,
    status: inspectionStatus,
    type: inspectionType,
    dateFrom: inspectionDateFrom,
    dateTo: inspectionDateTo,
    search: inspectionSearch,
    inspectionNumber,
  }), [
    inspectionRegion,
    inspectionDistrict,
    inspectionStatus,
    inspectionType,
    inspectionDateFrom,
    inspectionDateTo,
    inspectionSearch,
    inspectionNumber,
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

  const { data: inspections = [], isLoading: isLoadingInspections } = useQuery<any[]>({
    queryKey: ['/api/inspections', inspectionQuery],
    queryFn: async () => {
      const res = await fetch(`/api/inspections${inspectionQuery ? `?${inspectionQuery}` : ""}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Ошибка загрузки проверок');
      return res.json();
    },
  });

  const inspectionsRows: InspectionRow[] = useMemo(() => {
    return inspectionsData.map((item: any) => ({
      id: item.id,
      number: item.number || "",
      inspectionDate: item.inspectionDate ? new Date(item.inspectionDate).toISOString().slice(0, 10) : "",
      type: item.type || "scheduled",
      status: item.status || "planned",
      ukpsisuCheckNumber: item.ukpsisuCheckNumber ?? "",
      ukpsisuRegistrationDate: item.ukpsisuRegistrationDate ? new Date(item.ukpsisuRegistrationDate).toISOString().slice(0, 10) : "",
      assigningAuthority: item.assigningAuthority ?? "",
      registrationAuthority: item.registrationAuthority ?? "",
      inspectionKind: item.inspectionKind ?? "",
      inspectedObjects: item.inspectedObjects ?? "",
      basis: item.basis ?? "",
      inspectionPeriod: item.inspectionPeriod ?? "",
      extensionPeriod: item.extensionPeriod ?? "",
      suspensionResumptionDates: item.suspensionResumptionDates ?? "",
      actualStartDate: item.actualStartDate ? new Date(item.actualStartDate).toISOString().slice(0, 10) : "",
      actualEndDate: item.actualEndDate ? new Date(item.actualEndDate).toISOString().slice(0, 10) : "",
      result: item.result ?? "",
      violationsCount: item.violationsCount ?? null,
      violationsDeadline: item.violationsDeadline ? new Date(item.violationsDeadline).toISOString().slice(0, 10) : "",
      ticketRegistrationDate: item.ticketRegistrationDate ? new Date(item.ticketRegistrationDate).toISOString().slice(0, 10) : "",
      region: item.region ?? "",
      district: item.district ?? "",
      bin: item.bin ?? "",
      iin: item.iin ?? "",
      subjectName: item.subjectName ?? "",
      address: item.address ?? "",
    }));
  }, [inspectionsData]);

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

  const normalizeInspectionPayload = (value: InspectionRow) => {
    const toOptionalValue = (v: string | null) => (v && v.trim() ? v.trim() : null);
    const toOptionalDate = (v: string | null) => (v ? v : null);
    const toOptionalNumber = (v: number | null) => (v === null ? null : v);

    return {
      number: value.number.trim(),
      inspectionDate: value.inspectionDate,
      type: value.type,
      status: value.status,
      ukpsisuCheckNumber: toOptionalValue(value.ukpsisuCheckNumber),
      ukpsisuRegistrationDate: toOptionalDate(value.ukpsisuRegistrationDate),
      assigningAuthority: toOptionalValue(value.assigningAuthority),
      registrationAuthority: toOptionalValue(value.registrationAuthority),
      inspectionKind: toOptionalValue(value.inspectionKind),
      inspectedObjects: toOptionalValue(value.inspectedObjects),
      basis: toOptionalValue(value.basis),
      inspectionPeriod: toOptionalValue(value.inspectionPeriod),
      extensionPeriod: toOptionalValue(value.extensionPeriod),
      suspensionResumptionDates: toOptionalValue(value.suspensionResumptionDates),
      actualStartDate: toOptionalDate(value.actualStartDate),
      actualEndDate: toOptionalDate(value.actualEndDate),
      result: toOptionalValue(value.result),
      violationsCount: toOptionalNumber(value.violationsCount),
      violationsDeadline: toOptionalDate(value.violationsDeadline),
      ticketRegistrationDate: toOptionalDate(value.ticketRegistrationDate),
      region: toOptionalValue(value.region),
      district: toOptionalValue(value.district),
      bin: toOptionalValue(value.bin),
      iin: toOptionalValue(value.iin),
      subjectName: toOptionalValue(value.subjectName),
      address: toOptionalValue(value.address),
    };
  };

  /** ===== CRUD ===== */
  const validate = (v: ControlledObject) => {
    const e: Record<string,string> = {};
    if (!v.subjectName.trim()) e.subjectName = "Укажите наименование субъекта";
    if (!/^\d{12}$/.test(v.subjectBIN)) e.subjectBIN = "БИН: 12 цифр";
    if (!v.objectName.trim()) e.objectName = "Укажите наименование объекта";
    if (!v.address.trim()) e.address = "Укажите адрес";
    if (!v.objectiveCategoryId) e.objectiveCategoryId = "Выберите категорию по уровню";
    return e;
  };

  const onSave = async () => {
    const prepared: ControlledObject = { ...form, id: form.id || '' };
    if (!isMchsUser && userRegion) {
      prepared.region = userRegion;
      if (userDistrict) {
        prepared.district = userDistrict;
      }
    }
    const errs = validate(prepared);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    // Преобразование в формат API
    const apiData = {
      name: prepared.objectName,
      category: prepared.objectiveLevel,
      subcategory: prepared.objectiveCategoryId,
      address: prepared.address,
      region: prepared.region,
      district: prepared.district,
      status: prepared.status === 'Активный' ? 'active' : 'inactive',
      riskLevel: prepared.objectiveLevel === 'Высокая' ? 'high' : prepared.objectiveLevel === 'Средняя' ? 'medium' : 'low',
      details: {
        subjectName: prepared.subjectName,
        subjectBIN: prepared.subjectBIN,
        entrepreneurshipCategory: prepared.entrepreneurshipCategory,
        objectiveLevel: prepared.objectiveLevel,
        objectiveCategoryId: prepared.objectiveCategoryId,
        characteristics: prepared.characteristics,
        subjective: prepared.subjective,
      }
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: apiData });
      } else {
        await createMutation.mutateAsync(apiData);
      }
      setOpenForm(false); setEditingId(null); setErrors({}); setForm({...blank});
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      setErrors({ general: 'Ошибка сохранения объекта' });
    }
  };

  const validateInspection = (value: InspectionRow) => {
    const result: Record<string, string> = {};
    if (!value.number.trim()) result.number = "Укажите номер проверки";
    if (!value.inspectionDate) result.inspectionDate = "Укажите дату проверки";
    return result;
  };

  const onSaveInspection = async () => {
    const prepared = { ...inspectionForm };
    if (!isMchsUser && userRegion) {
      prepared.region = userRegion;
      if (userDistrict) {
        prepared.district = userDistrict;
      }
    }
    const errorsFound = validateInspection(prepared);
    setInspectionErrors(errorsFound);
    if (Object.keys(errorsFound).length) return;
    const payload = normalizeInspectionPayload(prepared);

    try {
      if (editingInspectionId) {
        await updateInspectionMutation.mutateAsync({ id: editingInspectionId, data: payload });
      } else {
        await createInspectionMutation.mutateAsync(payload);
      }
      setOpenInspectionForm(false);
      setEditingInspectionId(null);
      setInspectionForm({ ...blankInspection });
      setInspectionErrors({});
    } catch (error) {
      console.error('Ошибка сохранения проверки:', error);
      setInspectionErrors({ general: 'Ошибка сохранения проверки' });
    }
  };

  const resetPrescriptionFilters = () => {
    setPrescriptionRegion(isMchsUser ? "Все" : userRegion || "Все");
    setPrescriptionDistrict(isDistrictUser ? (userDistrict || "Все") : "Все");
    setPrescriptionStatus("Все");
    setPrescriptionDateFrom("");
    setPrescriptionDateTo("");
    setPrescriptionSearch("");
    setPrescriptionInspectionNumber("");
  };

  const resetInspectionFilters = () => {
    setInspectionRegion(isMchsUser ? "Все" : userRegion || "Все");
    setInspectionDistrict(isDistrictUser ? (userDistrict || "Все") : "Все");
    setInspectionStatus("Все");
    setInspectionType("Все");
    setInspectionDateFrom("");
    setInspectionDateTo("");
    setInspectionSearch("");
    setInspectionNumberFilter("");
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

  const onEdit = (id: string) => {
    const r = rows.find(x => x.id === id); if (!r) return;
    setEditingId(id); setForm({...r}); setErrors({}); setOpenForm(true);
  };

  const onEditInspection = (id: string) => {
    const inspection = inspectionsRows.find((item) => item.id === id);
    if (!inspection) return;
    setEditingInspectionId(id);
    setInspectionForm({ ...inspection });
    setInspectionErrors({});
    setOpenInspectionForm(true);
  };

  const onDelete = async () => {
    if (!confirmId) return;
    try {
      await deleteMutation.mutateAsync(confirmId);
      setConfirmId(null);
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  /** ===== Импорт/экспорт ===== */
  const exportXLSX = () => {
    if (filtered.length === 0) { alert("Нет данных для экспорта"); return; }
    const data = filtered.map((r, i) => {
      const cat = CATS[r.objectiveLevel].find(c => c.id === r.objectiveCategoryId);
      return {
        "№": i + 1,
        "Регион": r.region,
        "Район/город": r.district || "",
        "Наименование субъекта": r.subjectName,
        "ИИН/БИН": r.subjectBIN,
        "Наименование объекта": r.objectName,
        "Адрес": r.address,
        "Категория предпринимательства": r.entrepreneurshipCategory,
        "Статус": r.status,
        "Объективный критерий (риск)": r.objectiveLevel,
        "Наименование объективного критерия": cat?.label ?? "",
        "Полный текст категории": cat?.full ?? "",
      };
    });
    try {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, "Реестр");
      XLSX.writeFile(wb, `реестр_контроль_надзор_${todayISO()}.xlsx`);
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
      a.download = `реестр_контроль_надзор_${todayISO()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const exportInspectionsXLSX = () => {
    if (inspectionsRows.length === 0) {
      alert("Нет данных для экспорта");
      return;
    }
    const data = inspectionsRows.map((r, i) => ({
      "№": i + 1,
      "Номер проверки": r.number,
      "Дата проверки": formatDate(r.inspectionDate),
      "Тип проверки": INSPECTION_TYPES.find((t) => t.value === r.type)?.label ?? r.type,
      "Статус": INSPECTION_STATUSES.find((s) => s.value === r.status)?.label ?? r.status,
      "№ проверки УКПСиСУ": r.ukpsisuCheckNumber || "",
      "Дата регистрации УКПСиСУ": formatDate(r.ukpsisuRegistrationDate),
      "Назначивший орган": r.assigningAuthority || "",
      "Орган регистрации": r.registrationAuthority || "",
      "Вид проверки": r.inspectionKind || "",
      "Проверяемые объекты": r.inspectedObjects || "",
      "Основание": r.basis || "",
      "Сроки проведения": r.inspectionPeriod || "",
      "Сроки продления": r.extensionPeriod || "",
      "Даты приостановления/возобновления": r.suspensionResumptionDates || "",
      "Фактическая дата начала": formatDate(r.actualStartDate),
      "Фактическая дата завершения": formatDate(r.actualEndDate),
      "Результат": r.result || "",
      "Кол-во нарушений": r.violationsCount ?? "",
      "Крайний срок устранения": formatDate(r.violationsDeadline),
      "Дата регистрации талона": formatDate(r.ticketRegistrationDate),
      "Регион": r.region || "",
      "Район/город": r.district || "",
      "БИН": r.bin || "",
      "ИИН": r.iin || "",
      "Субъект": r.subjectName || "",
      "Адрес": r.address || "",
    }));

    try {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, "Журнал проверок");
      XLSX.writeFile(wb, `журнал_проверок_${todayISO()}.xlsx`);
    } catch {
      const header = Object.keys(data[0]);
      const csv =
        [header, ...data.map((o) => header.map((h) => String((o as any)[h]).replace(/"/g, '""')))]
          .map((row) => row.map((c) => `"${c}"`).join(";"))
          .join("\n");
      const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `журнал_проверок_${todayISO()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const importFile = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

      const mapped: ControlledObject[] = json.map((row) => {
        const level = (String(row["Объективный критерий (риск)"] ?? row["Уровень"] ?? "Низкая") as ObjectiveLevel);
        const all = CATS[level];
        const byLabel = all.find(c => c.label === String(row["Наименование объективного критерия"] ?? row["Категория (кратко)"] ?? ""));
        const byFull  = all.find(c => c.full  === String(row["Полный текст категории"] ?? ""));
        const catId = byLabel?.id || byFull?.id || "";

        return {
          id: crypto.randomUUID(),
          region: String(row["Регион"] ?? REGIONS[0]),
          district: String(row["Район/город"] ?? ""),
          subjectName: String(row["Наименование субъекта"] ?? ""),
          subjectBIN: String(row["ИИН/БИН"] ?? ""),
          objectName: String(row["Наименование объекта"] ?? ""),
          address: String(row["Адрес"] ?? ""),
          entrepreneurshipCategory: (String(row["Категория предпринимательства"] ?? "Микро") as BizCat),
          status: (String(row["Статус"] ?? "Активный") as Status),
          objectiveLevel: level,
          objectiveCategoryId: catId,
          characteristics: {
            hasPrivateFireService:false, buildingType:"", heightMeters:"", walls:"", partitions:"",
            heating:"", lighting:"", hasAttic:false, hasBasement:false, hasParking:false,
            primaryExtinguishing:"", hasAUPT:false, hasAPS:false, apsServiceOrg:"",
            outsideWater:"", insideWater:""
          },
          subjective: { prevViolations:0, incidents12m:0, powerOverload:false, otherRiskNotes:"" },
        };
      });

      const nonEmpty = mapped.filter(m => m.subjectName && m.objectName);
      
      // Сохраняем каждый объект в БД через API
      let imported = 0;
      for (const obj of nonEmpty) {
        try {
          const apiData = {
            name: obj.objectName,
            category: obj.objectiveLevel,
            subcategory: obj.objectiveCategoryId,
            address: obj.address,
            region: obj.region,
            district: obj.district,
            status: obj.status === 'Активный' ? 'active' : 'inactive',
            riskLevel: obj.objectiveLevel === 'Высокая' ? 'high' : obj.objectiveLevel === 'Средняя' ? 'medium' : 'low',
            details: {
              subjectName: obj.subjectName,
              subjectBIN: obj.subjectBIN,
              entrepreneurshipCategory: obj.entrepreneurshipCategory,
              objectiveLevel: obj.objectiveLevel,
              objectiveCategoryId: obj.objectiveCategoryId,
              characteristics: obj.characteristics,
              subjective: obj.subjective,
            }
          };
          await createMutation.mutateAsync(apiData);
          imported++;
        } catch (e) {
          console.error('Ошибка импорта объекта:', e);
        }
      }
      
      alert(`Импортировано записей: ${imported}`);
    } catch {
      alert("Не удалось импортировать файл. Попробуйте другой XLSX/CSV.");
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
              Реестр подконтрольных объектов, контроль соблюдения требований пожарной безопасности
            </p>
          </div>
          <div className="flex items-center gap-3">
            {canEdit && (
              <button
                className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-medium shadow hover:bg-blue-500"
                onClick={() => { setEditingId(null); setForm({...blank}); setErrors({}); setOpenForm(true); }}
              >
                ➕ Добавить объект
              </button>
            )}
            <button
              className="rounded-2xl bg-slate-800 px-4 py-2 text-sm font-medium hover:bg-slate-700"
              onClick={() => {
                setRegionFilter(isMchsUser ? "Все" : (userRegion || "Все"));
                if (isMchsUser || isDchsUser) {
                  setDistrictFilter("Все");
                } else {
                  setDistrictFilter(userDistrict || "Все");
                }
                setLevelFilter("Все"); setCatFilter("Все");
                setStatusFilter("Все"); setQ("");
              }}
            >
              Очистить
            </button>
          </div>
        </header>

        <div className="border-b border-slate-800">
          <nav className="flex space-x-8 overflow-x-auto">
            {[
              { id: "registry", label: "📋 Реестр объектов" },
              { id: "inspections", label: "📓 Журнал проверок" },
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
          <>
            {/* Счётчик */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-sm">
              Всего объектов:&nbsp;<span className="font-semibold">{filtered.length}</span>
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
                <button
                  type="button"
                  onClick={() => setShowAdditionalFilters((prev) => !prev)}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 transition hover:border-slate-500"
                >
                  Дополнительные фильтры
                </button>
              </div>

              {showAdditionalFilters && (
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                  <div>
                    <label className="text-xs text-slate-400">Объективный критерий (риск)</label>
                    <select
                      value={levelFilter}
                      onChange={(e) => { setLevelFilter(e.target.value as any); setCatFilter("Все"); }}
                      className="block min-w-[220px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    >
                      <option value="Все">Все</option>
                      <option value="Высокая">Высокая</option>
                      <option value="Средняя">Средняя</option>
                      <option value="Низкая">Низкая</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400">Наименование объективного критерия</label>
                    <select
                      value={catFilter}
                      onChange={(e) => setCatFilter(e.target.value)}
                      className="block min-w-[320px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    >
                      <option>Все</option>
                      {(levelFilter === "Все" ? [] : CATS[levelFilter]).map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400">Статус</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="block min-w-[180px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    >
                      <option value="Все">Все</option>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-slate-400">Поиск: субъект / объект / БИН / адрес</label>
                <div className="relative">
                  <input
                    placeholder="Начните ввод…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 pr-8 text-sm"
                  />
                  <span className="pointer-events-none absolute right-2 top-2.5 text-slate-500">🔎</span>
                </div>
              </div>

              <div className="flex items-end gap-3">
                <button className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm hover:bg-slate-800"
                        onClick={() => fileRef.current?.click()}>
                  ⬆️ Импорт
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) importFile(f); e.currentTarget.value = ""; }}
                />
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
                    <th className="px-3 py-3">БИН</th>
                    <th className="px-3 py-3">Объект</th>
                    <th className="px-3 py-3">Адрес</th>
                    <th className="px-3 py-3">Категория бизнеса</th>
                    <th className="px-3 py-3">Статус</th>
                    <th className="px-3 py-3">Объективный критерий</th>
                    <th className="px-3 py-3">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={11} className="px-3 py-10 text-center text-slate-400">Данных нет</td></tr>
                  ) : filtered.map((r, idx) => {
                    const cat = CATS[r.objectiveLevel].find(c => c.id === r.objectiveCategoryId);
                    return (
                      <tr key={r.id} className="border-t border-slate-800 hover:bg-slate-900/40">
                        <td className="px-3 py-2">{idx + 1}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{r.region}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{r.district || "—"}</td>
                        <td className="px-3 py-2">{r.subjectName}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{r.subjectBIN}</td>
                        <td className="px-3 py-2">{r.objectName}</td>
                        <td className="px-3 py-2">{r.address}</td>
                        <td className="px-3 py-2">{r.entrepreneurshipCategory}</td>
                        <td className="px-3 py-2">
                          <span className={
                            r.status==="Активный" ? "rounded bg-green-500/20 px-2 py-1 text-green-400" :
                            r.status==="Не функционирует" ? "rounded bg-yellow-500/20 px-2 py-1 text-yellow-400" :
                                                  "rounded bg-orange-500/20 px-2 py-1 text-orange-400"
                          }>{r.status}</span>
                        </td>
                        <td className="px-3 py-2 max-w-[380px]">
                          <div title={cat?.full ?? ""} className="truncate">
                            <b>{r.objectiveLevel}</b> — {cat?.label ?? "—"}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex gap-2">
                            {canEdit && (
                              <button className="rounded-lg bg-slate-800 px-2 py-1 text-xs hover:bg-slate-700"
                                      onClick={() => onEdit(r.id)}>Редактировать</button>
                            )}
                            <button className="rounded-lg bg-slate-800 px-2 py-1 text-xs hover:bg-slate-700"
                                    onClick={() => { setForm(r); setEditingId(r.id); setOpenCharacteristics(true); }}>
                              Характеристика
                            </button>
                            <button className="rounded-lg bg-slate-800 px-2 py-1 text-xs hover:bg-slate-700"
                                    onClick={() => { setForm(r); setEditingId(r.id); setOpenSubjective(true); }}>
                              Субъективные
                            </button>
                            {canEdit && (
                              <button className="rounded-lg bg-red-600 px-2 py-1 text-xs hover:bg-red-500"
                                      onClick={() => setConfirmId(r.id)}>Удалить</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          </>
        )}

        {activeTab === "inspections" && (
          <>
            <div className="space-y-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-sm">
                Всего проверок:&nbsp;
                <span className="font-semibold">
                  {isLoadingInspections ? "Загрузка..." : inspections.length}
                </span>
              </div>
            </div>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow space-y-3">
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="text-xs text-slate-400">Регион</label>
                  <select
                    value={inspectionRegion}
                    onChange={(e) => { setInspectionRegion(e.target.value); setInspectionDistrict("Все"); }}
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
                    value={inspectionDistrict}
                    onChange={(e) => setInspectionDistrict(e.target.value)}
                    disabled={isDistrictUser}
                    className="block min-w-[220px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  >
                    {(isMchsUser || isDchsUser) && <option>Все</option>}
                    {getDistrictOptions(inspectionRegion).map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400">Статус</label>
                  <select
                    value={inspectionStatus}
                    onChange={(e) => setInspectionStatus(e.target.value)}
                    className="block min-w-[180px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  >
                    <option value="Все">Все</option>
                    {INSPECTION_STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400">Вид проверки</label>
                  <select
                    value={inspectionType}
                    onChange={(e) => setInspectionType(e.target.value)}
                    className="block min-w-[200px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  >
                    <option value="Все">Все</option>
                    {INSPECTION_TYPES.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400">Дата проверки</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={inspectionDateFrom}
                      onChange={(e) => setInspectionDateFrom(e.target.value)}
                      className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    />
                    <span className="text-slate-500">—</span>
                    <input
                      type="date"
                      value={inspectionDateTo}
                      onChange={(e) => setInspectionDateTo(e.target.value)}
                      className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-slate-400">Номер проверки</label>
                  <input
                    placeholder="Например: 123/2024"
                    value={inspectionNumber}
                    onChange={(e) => setInspectionNumber(e.target.value)}
                    className="block min-w-[220px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Поиск: номер / БИН / ИИН / субъект / адрес</label>
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
              </div>

              <div className="flex items-center gap-3">
                <button
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm hover:bg-slate-800"
                  onClick={resetInspectionFilters}
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
                    <th className="px-3 py-3">Вид</th>
                    <th className="px-3 py-3">Статус</th>
                    <th className="px-3 py-3">Субъект</th>
                    <th className="px-3 py-3">БИН/ИИН</th>
                    <th className="px-3 py-3">Регион</th>
                    <th className="px-3 py-3">Район</th>
                    <th className="px-3 py-3">Адрес/объект</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingInspections ? (
                    <tr><td colSpan={10} className="px-3 py-10 text-center text-slate-400">Загрузка...</td></tr>
                  ) : inspections.length === 0 ? (
                    <tr><td colSpan={10} className="px-3 py-10 text-center text-slate-400">Данных нет</td></tr>
                  ) : inspections.map((item, idx) => {
                    const statusLabel = INSPECTION_STATUSES.find((s) => s.value === item.status)?.label ?? item.status;
                    const typeLabel = INSPECTION_TYPES.find((t) => t.value === item.type)?.label ?? item.type;
                    return (
                      <tr key={item.id} className="border-t border-slate-800 hover:bg-slate-900/40">
                        <td className="px-3 py-2">{idx + 1}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{formatDate(item.inspectionDate)}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{item.number}</td>
                        <td className="px-3 py-2">{typeLabel}</td>
                        <td className="px-3 py-2">
                          <span className="rounded bg-blue-500/20 px-2 py-1 text-blue-300">{statusLabel}</span>
                        </td>
                        <td className="px-3 py-2">{item.subjectName || "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{item.bin || item.iin || "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{item.region || "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{item.district || "—"}</td>
                        <td className="px-3 py-2">{item.address || "—"}</td>
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

      {/* ===== МОДАЛКИ ===== */}

      {activeTab === "registry" && (
        <>
          {/* Основная форма */}
          {openForm && (
            <Modal title={editingId ? "Редактировать объект" : "Добавить объект"} onClose={() => setOpenForm(false)}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field label="Регион">
                  <select
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    value={form.region}
                    onChange={(e) => setForm(s => ({...s, region: e.target.value, district:""}))}
                    disabled={!isMchsUser && Boolean(userRegion)}
                  >
                    {availableFormRegions.map(r => <option key={r}>{r}</option>)}
                  </select>
                </Field>
                <Field label="Район / ГОС">
                  <select
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    value={form.district}
                    onChange={(e) => setForm(s => ({...s, district: e.target.value}))}
                    disabled={isDistrictUser}
                  >
                    <option value="">— выберите —</option>
                    {availableFormDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </Field>

            <Field label="Категория предпринимательства">
              <select
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                value={form.entrepreneurshipCategory}
                onChange={(e) => setForm(s => ({...s, entrepreneurshipCategory: e.target.value as BizCat}))}
              >
                {BIZ_CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Статус">
              <select
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                value={form.status}
                onChange={(e) => setForm(s => ({...s, status: e.target.value as Status}))}
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>

            <Field label="Наименование субъекта" error={errors.subjectName}>
              <input
                className={`w-full rounded-lg border px-3 py-2 text-sm ${errors.subjectName ? "border-red-600":"border-slate-700"} bg-slate-950`}
                value={form.subjectName}
                onChange={(e) => setForm(s => ({...s, subjectName: e.target.value}))}
              />
            </Field>
            <Field label="ИИН/БИН" error={errors.subjectBIN}>
              <input
                inputMode="numeric" maxLength={12} placeholder="12 цифр"
                className={`w-full rounded-lg border px-3 py-2 text-sm ${errors.subjectBIN ? "border-red-600":"border-slate-700"} bg-slate-950`}
                value={form.subjectBIN}
                onChange={(e) => setForm(s => ({...s, subjectBIN: e.target.value.replace(/[^0-9]/g,"")}))}
              />
            </Field>

            <Field label="Наименование объекта" error={errors.objectName}>
              <input
                className={`w-full rounded-lg border px-3 py-2 text-sm ${errors.objectName ? "border-red-600":"border-slate-700"} bg-slate-950`}
                value={form.objectName}
                onChange={(e) => setForm(s => ({...s, objectName: e.target.value}))}
              />
            </Field>
            <Field label="Адрес" error={errors.address}>
              <input
                className={`w-full rounded-lg border px-3 py-2 text-sm ${errors.address ? "border-red-600":"border-slate-700"} bg-slate-950`}
                value={form.address}
                onChange={(e) => setForm(s => ({...s, address: e.target.value}))}
              />
            </Field>

            <Field label="Объективный критерий (риск)">
              <select
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                value={form.objectiveLevel}
                onChange={(e) => setForm(s => ({...s, objectiveLevel: e.target.value as ObjectiveLevel, objectiveCategoryId:""}))}
              >
                <option value="Высокая">Высокая</option>
                <option value="Средняя">Средняя</option>
                <option value="Низкая">Низкая</option>
              </select>
            </Field>
            <Field label="Наименование объективного критерия" error={errors.objectiveCategoryId}>
              <select
                className={`w-full rounded-lg border px-3 py-2 text-sm ${errors.objectiveCategoryId ? "border-red-600":"border-slate-700"} bg-slate-950`}
                value={form.objectiveCategoryId}
                onChange={(e) => setForm(s => ({...s, objectiveCategoryId: e.target.value}))}
              >
                <option value="">— выберите —</option>
                {CATS[form.objectiveLevel].map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </Field>

            <div className="md:col-span-2 rounded-lg border border-slate-800 bg-slate-900/40 p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-slate-400">
                  Настроить детально:
                </div>
                <div className="flex gap-2">
                  <button className="rounded-lg bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700" type="button"
                          onClick={() => setOpenCharacteristics(true)}>Характеристика объекта</button>
                  <button className="rounded-lg bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700" type="button"
                          onClick={() => setOpenSubjective(true)}>Субъективные критерии</button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-3">
            <button className="rounded-xl bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700" onClick={() => setOpenForm(false)}>Отмена</button>
            <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500" onClick={onSave}>Сохранить</button>
          </div>
            </Modal>
          )}

          {/* Характеристика объекта */}
          {openCharacteristics && (
            <Modal title="Характеристика объекта" onClose={() => setOpenCharacteristics(false)}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Check label="Наличие негосударственной противопожарной службы"
                       checked={form.characteristics.hasPrivateFireService}
                       onChange={(v)=>setForm(s=>({...s, characteristics:{...s.characteristics, hasPrivateFireService:v}}))}/>
                <Field label="Вид сооружения">
                  <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                         value={form.characteristics.buildingType}
                         onChange={(e)=>setForm(s=>({...s, characteristics:{...s.characteristics, buildingType:e.target.value}}))}/>
                </Field>
                <Field label="Этажность (в метрах)">
                  <input inputMode="decimal" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                         value={form.characteristics.heightMeters}
                         onChange={(e)=>setForm(s=>({...s, characteristics:{...s.characteristics, heightMeters: e.target.value===""? "": Number((e.target.value||"").toString().replace(",","."))}}))}/>
                </Field>
                <Field label="Стены">
                  <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                         value={form.characteristics.walls}
                         onChange={(e)=>setForm(s=>({...s, characteristics:{...s.characteristics, walls:e.target.value}}))}/>
                </Field>
                <Field label="Перегородки">
                  <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                         value={form.characteristics.partitions}
                         onChange={(e)=>setForm(s=>({...s, characteristics:{...s.characteristics, partitions:e.target.value}}))}/>
                </Field>
                <Field label="Отопление">
                  <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                         value={form.characteristics.heating}
                         onChange={(e)=>setForm(s=>({...s, characteristics:{...s.characteristics, heating:e.target.value}}))}/>
                </Field>
                <Field label="Освещение">
                  <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                         value={form.characteristics.lighting}
                         onChange={(e)=>setForm(s=>({...s, characteristics:{...s.characteristics, lighting:e.target.value}}))}/>
                </Field>
                <Check label="Наличие чердака"
                       checked={form.characteristics.hasAttic}
                       onChange={(v)=>setForm(s=>({...s, characteristics:{...s.characteristics, hasAttic:v}}))}/>
                <Check label="Наличие подвала"
                       checked={form.characteristics.hasBasement}
                       onChange={(v)=>setForm(s=>({...s, characteristics:{...s.characteristics, hasBasement:v}}))}/>
                <Check label="Наличие паркинга"
                       checked={form.characteristics.hasParking}
                       onChange={(v)=>setForm(s=>({...s, characteristics:{...s.characteristics, hasParking:v}}))}/>
                <Field label="Первичные средства пожаротушения">
                  <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                         value={form.characteristics.primaryExtinguishing}
                         onChange={(e)=>setForm(s=>({...s, characteristics:{...s.characteristics, primaryExtinguishing:e.target.value}}))}/>
                </Field>
                <Check label="АУПТ (авт. установки пожаротушения)"
                       checked={form.characteristics.hasAUPT}
                       onChange={(v)=>setForm(s=>({...s, characteristics:{...s.characteristics, hasAUPT:v}}))}/>
                <Check label="АПС (авт. пожарная сигнализация)"
                       checked={form.characteristics.hasAPS}
                       onChange={(v)=>setForm(s=>({...s, characteristics:{...s.characteristics, hasAPS:v}}))}/>
                <Field label="Обслуживающая организация АПС">
                  <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                         value={form.characteristics.apsServiceOrg}
                         onChange={(e)=>setForm(s=>({...s, characteristics:{...s.characteristics, apsServiceOrg:e.target.value}}))}/>
                </Field>
                <Field label="Наружное противопожарное водоснабжение">
                  <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                         value={form.characteristics.outsideWater}
                         onChange={(e)=>setForm(s=>({...s, characteristics:{...s.characteristics, outsideWater:e.target.value}}))}/>
                </Field>
                <Field label="Внутреннее противопожарное водоснабжение">
                  <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                         value={form.characteristics.insideWater}
                         onChange={(e)=>setForm(s=>({...s, characteristics:{...s.characteristics, insideWater:e.target.value}}))}/>
                </Field>
              </div>
              <div className="mt-5 flex justify-end">
                <button className="rounded-xl bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
                        onClick={()=>setOpenCharacteristics(false)}>Готово</button>
              </div>
            </Modal>
          )}

          {/* Субъективные критерии */}
          {openSubjective && (
            <Modal title="Субъективные критерии" onClose={() => setOpenSubjective(false)}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field label="Нарушения по предыдущей проверке (кол-во)">
                  <input inputMode="numeric" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                         value={form.subjective.prevViolations}
                         onChange={(e)=>setForm(s=>({...s, subjective:{...s.subjective, prevViolations: Number(e.target.value||0)}}))}/>
                </Field>
                <Field label="Пожары/ЧС за 12 месяцев (кол-во)">
                  <input inputMode="numeric" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                         value={form.subjective.incidents12m}
                         onChange={(e)=>setForm(s=>({...s, subjective:{...s.subjective, incidents12m: Number(e.target.value||0)}}))}/>
                </Field>
                <Check label="Превышение мощности / перегрузки"
                       checked={form.subjective.powerOverload}
                       onChange={(v)=>setForm(s=>({...s, subjective:{...s.subjective, powerOverload:v}}))}/>
                <Field label="Прочие неблагоприятные факторы">
                  <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                         value={form.subjective.otherRiskNotes}
                         onChange={(e)=>setForm(s=>({...s, subjective:{...s.subjective, otherRiskNotes:e.target.value}}))}/>
                </Field>
              </div>
              <div className="mt-5 flex justify-end">
                <button className="rounded-xl bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
                        onClick={()=>setOpenSubjective(false)}>Готово</button>
              </div>
            </Modal>
          )}

          {/* Подтверждение удаления */}
          {confirmId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={()=>setConfirmId(null)}>
              <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-2xl" onClick={(e)=>e.stopPropagation()}>
                <h3 className="text-lg font-semibold">Удалить запись?</h3>
                <p className="mt-2 text-sm text-slate-300">Действие необратимо.</p>
                <div className="mt-5 flex justify-end gap-3">
                  <button className="rounded-xl bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700" onClick={()=>setConfirmId(null)}>Отмена</button>
                  <button className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium hover:bg-red-500" onClick={onDelete}>Удалить</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "inspections" && openInspectionForm && (
        <Modal
          title={editingInspectionId ? "Редактировать проверку" : "Добавить проверку"}
          onClose={() => setOpenInspectionForm(false)}
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Номер проверки" error={inspectionErrors.number}>
              <input
                className={`w-full rounded-lg border px-3 py-2 text-sm ${inspectionErrors.number ? "border-red-600" : "border-slate-700"} bg-slate-950`}
                value={inspectionForm.number}
                onChange={(e) => setInspectionForm((s) => ({ ...s, number: e.target.value }))}
              />
            </Field>
            <Field label="Дата проверки" error={inspectionErrors.inspectionDate}>
              <input
                type="date"
                className={`w-full rounded-lg border px-3 py-2 text-sm ${inspectionErrors.inspectionDate ? "border-red-600" : "border-slate-700"} bg-slate-950`}
                value={inspectionForm.inspectionDate}
                onChange={(e) => setInspectionForm((s) => ({ ...s, inspectionDate: e.target.value }))}
              />
            </Field>
            <Field label="Тип проверки">
              <select
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                value={inspectionForm.type}
                onChange={(e) => setInspectionForm((s) => ({ ...s, type: e.target.value as InspectionType }))}
              >
                {INSPECTION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Статус">
              <select
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                value={inspectionForm.status}
                onChange={(e) => setInspectionForm((s) => ({ ...s, status: e.target.value as InspectionStatus }))}
              >
                {INSPECTION_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Регион">
              <select
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                value={inspectionForm.region || ""}
                onChange={(e) => setInspectionForm((s) => ({ ...s, region: e.target.value, district: "" }))}
                disabled={!isMchsUser && Boolean(userRegion)}
              >
                <option value="">— выберите —</option>
                {availableInspectionRegions.map((r) => <option key={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Район / ГОС">
              <select
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                value={inspectionForm.district || ""}
                onChange={(e) => setInspectionForm((s) => ({ ...s, district: e.target.value }))}
                disabled={isDistrictUser}
              >
                <option value="">— выберите —</option>
                {availableInspectionDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>

            <Field label="БИН">
              <input
                inputMode="numeric"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                value={inspectionForm.bin || ""}
                onChange={(e) => setInspectionForm((s) => ({ ...s, bin: e.target.value.replace(/[^0-9]/g, "") }))}
              />
            </Field>
            <Field label="ИИН">
              <input
                inputMode="numeric"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                value={inspectionForm.iin || ""}
                onChange={(e) => setInspectionForm((s) => ({ ...s, iin: e.target.value.replace(/[^0-9]/g, "") }))}
              />
            </Field>
            <Field label="Субъект">
              <input
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                value={inspectionForm.subjectName || ""}
                onChange={(e) => setInspectionForm((s) => ({ ...s, subjectName: e.target.value }))}
              />
            </Field>
            <Field label="Адрес">
              <input
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                value={inspectionForm.address || ""}
                onChange={(e) => setInspectionForm((s) => ({ ...s, address: e.target.value }))}
              />
            </Field>

            <Field label="№ проверки УКПСиСУ">
              <input
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                value={inspectionForm.ukpsisuCheckNumber || ""}
                onChange={(e) => setInspectionForm((s) => ({ ...s, ukpsisuCheckNumber: e.target.value }))}
              />
            </Field>
            <Field label="Дата регистрации УКПСиСУ">
              <input
                type="date"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                value={inspectionForm.ukpsisuRegistrationDate || ""}
                onChange={(e) => setInspectionForm((s) => ({ ...s, ukpsisuRegistrationDate: e.target.value }))}
              />
            </Field>
            <Field label="Назначивший орган">
              <input
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                value={inspectionForm.assigningAuthority || ""}
                onChange={(e) => setInspectionForm((s) => ({ ...s, assigningAuthority: e.target.value }))}
              />
            </Field>
            <Field label="Орган регистрации">
              <input
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                value={inspectionForm.registrationAuthority || ""}
                onChange={(e) => setInspectionForm((s) => ({ ...s, registrationAuthority: e.target.value }))}
              />
            </Field>
            <Field label="Вид проверки">
              <input
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                value={inspectionForm.inspectionKind || ""}
                onChange={(e) => setInspectionForm((s) => ({ ...s, inspectionKind: e.target.value }))}
              />
            </Field>
            <Field label="Проверяемые объекты">
              <textarea
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                value={inspectionForm.inspectedObjects || ""}
                onChange={(e) => setInspectionForm((s) => ({ ...s, inspectedObjects: e.target.value }))}
              />
            </Field>
            <Field label="Основание">
              <textarea
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                value={inspectionForm.basis || ""}
                onChange={(e) => setInspectionForm((s) => ({ ...s, basis: e.target.value }))}
              />
            </Field>
            <Field label="Сроки проведения">
              <textarea
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                value={inspectionForm.inspectionPeriod || ""}
                onChange={(e) => setInspectionForm((s) => ({ ...s, inspectionPeriod: e.target.value }))}
              />
            </Field>
            <Field label="Сроки продления">
              <textarea
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                value={inspectionForm.extensionPeriod || ""}
                onChange={(e) => setInspectionForm((s) => ({ ...s, extensionPeriod: e.target.value }))}
              />
            </Field>
            <Field label="Даты приостановления/возобновления">
              <textarea
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                value={inspectionForm.suspensionResumptionDates || ""}
                onChange={(e) => setInspectionForm((s) => ({ ...s, suspensionResumptionDates: e.target.value }))}
              />
            </Field>
            <Field label="Фактическая дата начала">
              <input
                type="date"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                value={inspectionForm.actualStartDate || ""}
                onChange={(e) => setInspectionForm((s) => ({ ...s, actualStartDate: e.target.value }))}
              />
            </Field>
            <Field label="Фактическая дата завершения">
              <input
                type="date"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                value={inspectionForm.actualEndDate || ""}
                onChange={(e) => setInspectionForm((s) => ({ ...s, actualEndDate: e.target.value }))}
              />
            </Field>
            <Field label="Результат">
              <textarea
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                value={inspectionForm.result || ""}
                onChange={(e) => setInspectionForm((s) => ({ ...s, result: e.target.value }))}
              />
            </Field>
            <Field label="Кол-во нарушений">
              <input
                type="number"
                min={0}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                value={inspectionForm.violationsCount ?? ""}
                onChange={(e) => setInspectionForm((s) => ({
                  ...s,
                  violationsCount: e.target.value === "" ? null : Number(e.target.value),
                }))}
              />
            </Field>
            <Field label="Крайний срок устранения">
              <input
                type="date"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                value={inspectionForm.violationsDeadline || ""}
                onChange={(e) => setInspectionForm((s) => ({ ...s, violationsDeadline: e.target.value }))}
              />
            </Field>
            <Field label="Дата регистрации талона">
              <input
                type="date"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                value={inspectionForm.ticketRegistrationDate || ""}
                onChange={(e) => setInspectionForm((s) => ({ ...s, ticketRegistrationDate: e.target.value }))}
              />
            </Field>
          </div>

          {inspectionErrors.general && (
            <p className="mt-3 text-sm text-red-400">{inspectionErrors.general}</p>
          )}

          <div className="mt-5 flex items-center justify-end gap-3">
            <button
              className="rounded-xl bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
              onClick={() => setOpenInspectionForm(false)}
              type="button"
            >
              Отмена
            </button>
            <button
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
              onClick={onSaveInspection}
              type="button"
            >
              Сохранить
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/** ===== Вспомогательные компоненты ===== */
function Modal({ title, onClose, children }: { title?:string; onClose: ()=>void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-2xl" onClick={(e)=>e.stopPropagation()}>
        {title ? <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">{title}</h2>
          <button className="rounded-lg bg-slate-800 px-3 py-1 text-sm hover:bg-slate-700" onClick={onClose}>Закрыть</button></div> : null}
        {children}
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-slate-300">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-red-500">{error}</span> : null}
    </label>
  );
}
function Check({ label, checked, onChange }: { label:string; checked:boolean; onChange:(v:boolean)=>void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" className="h-4 w-4"
             checked={checked} onChange={(e)=>onChange(e.target.checked)} />
      <span className="text-slate-300">{label}</span>
    </label>
  );
}
