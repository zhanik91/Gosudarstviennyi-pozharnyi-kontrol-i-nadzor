import React, { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useAuth } from "@/hooks/useAuth";
import { ADMIN2_BY_REGION, REGION_NAMES } from "@/data/kazakhstan-data";

/** ===== Типы ===== */
type Status = "Активный" | "Не функционирует";
type ObjectiveLevel = "Высокая" | "Средняя" | "Низкая";
type BizCat = "Микро" | "Малый" | "Средний" | "Крупный";
type TabType = "registry" | "preventive";

type CategoryItem = { id: string; label: string; full: string };

type ObjectCharacteristics = {
  hasPrivateFireService: boolean;
  buildingType: string;
  heightMeters: number | "";
  walls: string;
  partitions: string;
  heating: string;
  lighting: string;
  hasAttic: boolean;
  hasBasement: boolean;
  hasParking: boolean;
  primaryExtinguishing: string;
  hasAUPT: boolean;
  hasAPS: boolean;
  apsServiceOrg: string;
  outsideWater: string;
  insideWater: string;
};

type SubjectiveCriteria = {
  prevViolations: number;
  incidents12m: number;
  powerOverload: boolean;
  otherRiskNotes: string;
};

type ControlledObject = {
  id: string;

  region: string;         // Регион (область/город РЗ)
  district: string;       // Район/ГОС
  subjectName: string;    // Наименование субъекта
  subjectBIN: string;     // БИН/ИИН
  objectName: string;     // Наименование объекта
  address: string;        // Адрес
  entrepreneurshipCategory: BizCat;
  status: Status;

  objectiveLevel: ObjectiveLevel;   // Уровень (высокая/средняя/низкая)
  objectiveCategoryId: string;      // Категория (наименование внутри уровня)

  characteristics: ObjectCharacteristics;
  subjective: SubjectiveCriteria;
};

/** ===== Постоянные ===== */
const STORAGE_KEY = "controlled_registry_v6";

const REGIONS = REGION_NAMES;
const ADMIN2: Record<string, string[]> = ADMIN2_BY_REGION;

const STATUSES: Status[] = ["Активный","Не функционирует"];
const BIZ_CATS: BizCat[] = ["Микро","Малый","Средний","Крупный"];

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

/** ===== Компонент страницы ===== */
export default function ControlSupervisionPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("registry");
  const userRole = (user as any)?.role;
  const isMchsUser = userRole === "MCHS" || userRole === "admin";
  const userRegion = (user as any)?.region || "";
  const userDistrict = (user as any)?.district || "";
  const isDistrictUser = !isMchsUser && Boolean(userDistrict);

  // данные
  const [rows, setRows] = useState<ControlledObject[]>([]);
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setRows(JSON.parse(saved));
  }, []);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  }, [rows]);

  // фильтры
  const [regionFilter, setRegionFilter] = useState("Все");
  const [districtFilter, setDistrictFilter] = useState("Все");
  const [levelFilter, setLevelFilter] = useState<"Все"|ObjectiveLevel>("Все");
  const [catFilter, setCatFilter] = useState<string>("Все");
  const [statusFilter, setStatusFilter] = useState<"Все"|Status>("Все");
  const [q, setQ] = useState("");

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

  const [openForm, setOpenForm] = useState(false);
  const [openCharacteristics, setOpenCharacteristics] = useState(false);
  const [openSubjective, setOpenSubjective] = useState(false);
  const [editingId, setEditingId] = useState<string|null>(null);
  const [form, setForm] = useState<ControlledObject>({...blank});
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [confirmId, setConfirmId] = useState<string|null>(null);

  // импорт/экспорт
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || isMchsUser || !userRegion) return;
    setRegionFilter(userRegion);
    setDistrictFilter(userDistrict || "Все");
  }, [isMchsUser, user, userDistrict, userRegion]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab") as TabType | null;
    if (tab === "registry" || tab === "preventive") {
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
    if (isMchsUser || !userRegion) return REGIONS;
    return [userRegion];
  }, [isMchsUser, userRegion]);

  const availableDistricts = useMemo(() => {
    if (isMchsUser) {
      return regionFilter !== "Все" ? (ADMIN2[regionFilter] || []) : [];
    }
    if (!userRegion) return [];
    if (userDistrict) return [userDistrict];
    return ADMIN2[userRegion] || [];
  }, [isMchsUser, regionFilter, userDistrict, userRegion]);

  const availableFormRegions = useMemo(() => {
    if (isMchsUser || !userRegion) return REGIONS;
    return [userRegion];
  }, [isMchsUser, userRegion]);

  const availableFormDistricts = useMemo(() => {
    if (isMchsUser) return ADMIN2[form.region] || [];
    if (!userRegion) return [];
    if (userDistrict) return [userDistrict];
    return ADMIN2[userRegion] || [];
  }, [form.region, isMchsUser, userDistrict, userRegion]);

  /** ===== Фильтрация ===== */
  const filtered = useMemo(() => {
    let list = [...rows];
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
  }, [rows, regionFilter, districtFilter, levelFilter, catFilter, statusFilter, q]);

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

  const onSave = () => {
    const prepared: ControlledObject = { ...form, id: form.id || crypto.randomUUID() };
    if (!isMchsUser && userRegion) {
      prepared.region = userRegion;
      if (userDistrict) {
        prepared.district = userDistrict;
      }
    }
    const errs = validate(prepared);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setRows(prev => {
      const ex = prev.find(x => x.id === prepared.id);
      if (ex) return prev.map(x => x.id === prepared.id ? prepared : x);
      return [prepared, ...prev];
    });

    setOpenForm(false); setEditingId(null); setErrors({}); setForm({...blank});
  };

  const onEdit = (id: string) => {
    const r = rows.find(x => x.id === id); if (!r) return;
    setEditingId(id); setForm({...r}); setErrors({}); setOpenForm(true);
  };

  const onDelete = () => {
    if (!confirmId) return;
    setRows(prev => prev.filter(r => r.id !== confirmId));
    setConfirmId(null);
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
      setRows(prev => [...nonEmpty, ...prev]);
      alert(`Импортировано записей: ${nonEmpty.length}`);
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
            <button
              className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-medium shadow hover:bg-blue-500"
              onClick={() => { setEditingId(null); setForm({...blank}); setErrors({}); setOpenForm(true); }}
            >
              ➕ Добавить объект
            </button>
            <button
              className="rounded-2xl bg-slate-800 px-4 py-2 text-sm font-medium hover:bg-slate-700"
              onClick={() => {
                setRegionFilter(isMchsUser ? "Все" : (userRegion || "Все"));
                setDistrictFilter(isMchsUser ? "Все" : (userDistrict || "Все"));
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
              { id: "registry", label: "📋 Реестр" },
              { id: "preventive", label: "🧾 Профилактические списки" },
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
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="text-xs text-slate-400">Регион</label>
                  <select
                    value={regionFilter}
                    onChange={(e) => { setRegionFilter(e.target.value); setDistrictFilter("Все"); }}
                    disabled={!isMchsUser && Boolean(userRegion)}
                    className="block min-w-[220px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  >
                    <option>Все</option>
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
                    <option>Все</option>
                    {availableDistricts.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>

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
                            <button className="rounded-lg bg-slate-800 px-2 py-1 text-xs hover:bg-slate-700"
                                    onClick={() => onEdit(r.id)}>Редактировать</button>
                            <button className="rounded-lg bg-slate-800 px-2 py-1 text-xs hover:bg-slate-700"
                                    onClick={() => { setForm(r); setEditingId(r.id); setOpenCharacteristics(true); }}>
                              Характеристика
                            </button>
                            <button className="rounded-lg bg-slate-800 px-2 py-1 text-xs hover:bg-slate-700"
                                    onClick={() => { setForm(r); setEditingId(r.id); setOpenSubjective(true); }}>
                              Субъективные
                            </button>
                            <button className="rounded-lg bg-red-600 px-2 py-1 text-xs hover:bg-red-500"
                                    onClick={() => setConfirmId(r.id)}>Удалить</button>
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
