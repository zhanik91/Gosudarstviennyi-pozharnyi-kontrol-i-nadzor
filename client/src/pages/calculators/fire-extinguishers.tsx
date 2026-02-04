import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calculator,
  RefreshCw,
  FileDown,
  AlertTriangle,
  CheckCircle,
  Shield,
  Layers,
  Info,
  ExternalLink,
  Flame,
  Construction
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ============================================================================
// ИНТЕРФЕЙСЫ И ТИПЫ
// ============================================================================

interface CalculationResult {
  // Основные огнетушители
  powderCount: number;       // Порошковые (ОП)
  co2Count: number;          // Углекислотные (ОУ)
  foamCount: number;         // Пенные (ОВП)
  mobileCount: number;       // Передвижные
  
  // Дополнительные средства
  sandCount: number;         // Ящики с песком
  waterCount: number;        // Бочки с водой
  blanketCount: number;      // Кошма/покрывало
  
  // Пожарные щиты
  shieldType: string;        // Тип щита (ЩП-А, ЩП-Б, ЩП-В, ЩП-Е, ЩП-СХ)
  shieldCount: number;       // Количество щитов
  
  // Итоги
  totalPortable: number;
  totalCount: number;
  perFloor: number[];
  maxDistance: number;
  
  // Обоснование
  reasons: { label: string; text: string; ref?: string }[];
  warnings: string[];
  notes: string[];
}

type ObjType = "PRODUCTION" | "SERVICE" | "PETROLEUM" | "CONSTRUCTION";
type ExtCategory = "A" | "B" | "V_GAS" | "V_SOLID" | "G" | "D" | "PUBLIC";

// ============================================================================
// ДАННЫЕ ПРИЛОЖЕНИЯ 3 (Таблица 1 — Производственные и общественные)
// ============================================================================

const CATEGORY_DATA: Record<ExtCategory, {
  label: string;
  blockArea: number;      // Площадь защищаемого участка (м²)
  powderNorm: number;     // Норма ОП на участок
  distance: number;       // Макс. расстояние до ОТ (м)
  mobileThreshold?: number; // Порог для передвижных
  shieldType: string;     // Тип пожарного щита
  shieldArea: number;     // Площадь на 1 щит
  fireClass: string;      // Классы пожара
}> = {
  "A": { 
    label: "А — повышенная взрывопожароопасность", 
    blockArea: 200, powderNorm: 2, distance: 30, mobileThreshold: 500,
    shieldType: "ЩП-А", shieldArea: 200, fireClass: "А, Б, В"
  },
  "B": { 
    label: "Б — взрывопожароопасность", 
    blockArea: 200, powderNorm: 2, distance: 30, mobileThreshold: 500,
    shieldType: "ЩП-Б", shieldArea: 200, fireClass: "А, Б, В"
  },
  "V_GAS": { 
    label: "В — пожароопасность (горючие газы/жидкости)", 
    blockArea: 200, powderNorm: 2, distance: 30, mobileThreshold: 500,
    shieldType: "ЩП-Б", shieldArea: 200, fireClass: "А, Б"
  },
  "V_SOLID": { 
    label: "В — пожароопасность (твердые материалы)", 
    blockArea: 400, powderNorm: 2, distance: 30, mobileThreshold: 800,
    shieldType: "ЩП-А", shieldArea: 400, fireClass: "А"
  },
  "G": { 
    label: "Г — умеренная пожароопасность", 
    blockArea: 1800, powderNorm: 2, distance: 40, mobileThreshold: 1800,
    shieldType: "ЩП-А", shieldArea: 1800, fireClass: "А"
  },
  "D": { 
    label: "Д — пониженная пожароопасность", 
    blockArea: 1800, powderNorm: 2, distance: 70,
    shieldType: "", shieldArea: 0, fireClass: "—"
  },
  "PUBLIC": { 
    label: "Общественные и административные здания", 
    blockArea: 800, powderNorm: 2, distance: 20,
    shieldType: "", shieldArea: 0, fireClass: "А, Е"
  },
};

// ============================================================================
// ДАННЫЕ ТАБЛИЦЫ 5 (Объекты обслуживания — СТО, АЗС, гаражи)
// ============================================================================

const TABLE_5_DATA = [
  { 
    id: "sto", 
    label: "СТО (Станция технического обслуживания)", 
    areaNorm: 100, powder: 2, co2: 1, 
    shield: "", note: ""
  },
  { 
    id: "parking_open", 
    label: "Открытые стоянки автомобилей", 
    areaNorm: 100, powder: 2, co2: 0, 
    shield: "ЩП-В", note: "1 щит на каждые 100 м²"
  },
  { 
    id: "parking_closed", 
    label: "Закрытые стоянки/паркинги", 
    areaNorm: 50, powder: 2, co2: 1, 
    shield: "ЩП-В", note: ""
  },
  { 
    id: "garage", 
    label: "Гаражи (на 1 бокс/машиноместо)", 
    areaNorm: 0, powder: 1, co2: 0, 
    shield: "", note: "Рассчитывается по количеству боксов"
  },
  { 
    id: "azs_large", 
    label: "АЗС (≥500 заправок в сутки)", 
    areaNorm: 0, powder: 4, co2: 2, 
    shield: "ЩП-В", note: "Дополнительно: 1 × ОП-100 передвижной",
    mobile: 1
  },
  { 
    id: "azs_small", 
    label: "АЗС (<500 заправок в сутки)", 
    areaNorm: 0, powder: 2, co2: 2, 
    shield: "ЩП-В", note: "Дополнительно: 1 × ОП-100 передвижной",
    mobile: 1
  },
  { 
    id: "azs_shop", 
    label: "Магазин/кафе при АЗС", 
    areaNorm: 100, powder: 1, co2: 1, 
    shield: "", note: ""
  },
  { 
    id: "kiosk", 
    label: "Торговые павильоны/киоски", 
    areaNorm: 100, powder: 1, co2: 0, 
    shield: "", note: ""
  },
  { 
    id: "office", 
    label: "Офисы, банки, клубы, учреждения", 
    areaNorm: 100, powder: 2, co2: 0, 
    shield: "", note: ""
  },
  { 
    id: "shop", 
    label: "Магазины, торговые центры", 
    areaNorm: 100, powder: 2, co2: 0, 
    shield: "", note: ""
  },
  { 
    id: "hotel", 
    label: "Гостиницы, общежития", 
    areaNorm: 100, powder: 2, co2: 0, 
    shield: "", note: "Минимум 2 ОТ на этаж"
  },
  { 
    id: "school", 
    label: "Школы, ВУЗы, учебные заведения", 
    areaNorm: 100, powder: 2, co2: 0, 
    shield: "", note: "Минимум 2 ОТ на этаж"
  },
  { 
    id: "hospital", 
    label: "Больницы, поликлиники", 
    areaNorm: 100, powder: 2, co2: 0, 
    shield: "", note: "Минимум 2 ОТ на этаж"
  },
];

// ============================================================================
// ДАННЫЕ ПРИЛОЖЕНИЯ 10 (Нефтяные объекты, склады ГСМ)
// ============================================================================

const APP_10_DATA = [
  { 
    id: "pump", 
    label: "Насосные по перекачке нефтепродуктов", 
    areaNorm: 50, co2: 2, foam: 2, powder: 0,
    sand: 1, blanket: 1, water: 0,
    note: "Кошма 2×2 м, песок 0.5 м³"
  },
  { 
    id: "kip", 
    label: "Помещения КИПиА (контрольно-измерительные приборы)", 
    areaNorm: 50, co2: 2, foam: 0, powder: 0,
    sand: 0, blanket: 0, water: 0,
    note: ""
  },
  { 
    id: "storage_tare", 
    label: "Хранилище нефтепродуктов в таре", 
    areaNorm: 200, co2: 0, foam: 1, powder: 2,
    sand: 1, blanket: 1, water: 0,
    note: "Песок 0.5 м³, кошма 2×2 м"
  },
  { 
    id: "lab", 
    label: "Лаборатории при нефтебазе", 
    areaNorm: 50, co2: 1, foam: 2, powder: 0,
    sand: 0, blanket: 1, water: 0,
    note: "Кошма 2×2 м"
  },
  { 
    id: "boiler", 
    label: "Котельные на нефтебазе", 
    areaNorm: 100, co2: 1, foam: 2, powder: 1,
    sand: 1, blanket: 0, water: 0,
    note: "Песок 0.5 м³"
  },
  { 
    id: "estacade", 
    label: "Эстакады слива/налива (на 50 м длины)", 
    areaNorm: 0, co2: 2, foam: 4, powder: 0,
    sand: 2, blanket: 2, water: 0,
    note: "Песок 0.5 м³ × 2, кошма 2×2 м × 2"
  },
  { 
    id: "reservoir_park", 
    label: "Резервуарный парк (при обваловании)", 
    areaNorm: 0, co2: 2, foam: 2, powder: 2,
    sand: 1, blanket: 1, water: 0,
    note: "На каждую группу резервуаров"
  },
  { 
    id: "oil_workshop", 
    label: "Нефтяные мастерские, ремонтные цеха", 
    areaNorm: 100, co2: 2, foam: 2, powder: 2,
    sand: 1, blanket: 1, water: 0,
    note: ""
  },
  { 
    id: "electric_sub", 
    label: "Электроподстанции, электрощитовые", 
    areaNorm: 50, co2: 2, foam: 0, powder: 0,
    sand: 0, blanket: 0, water: 0,
    note: "Только углекислотные!"
  },
  { 
    id: "oil_filling", 
    label: "Разливочные (мелкая тара)", 
    areaNorm: 50, co2: 1, foam: 2, powder: 1,
    sand: 1, blanket: 1, water: 0,
    note: ""
  },
  { 
    id: "oil_garage", 
    label: "Автогаражи при нефтебазе", 
    areaNorm: 100, co2: 1, foam: 2, powder: 2,
    sand: 1, blanket: 0, water: 0,
    note: ""
  },
];

// ============================================================================
// ДАННЫЕ ПРИЛОЖЕНИЯ 11 (Строительные площадки)
// ============================================================================

const APP_11_DATA = [
  { 
    id: "scaffolding", 
    label: "Строительные леса (на каждые 20 м длины)", 
    powder: 1, sand: 0, water: 0,
    note: "*", minQty: 2
  },
  { 
    id: "cabin", 
    label: "Бытовки, временные здания (на 100 м²)", 
    powder: 1, sand: 1, water: 1,
    note: "****", minQty: 2
  },
  { 
    id: "storage_timber", 
    label: "Склады лесоматериалов (на 300 м³)", 
    powder: 1, sand: 1, water: 1,
    note: "", minQty: 0
  },
  { 
    id: "fire_works", 
    label: "Места огневых работ (сварка, резка)", 
    powder: 2, sand: 1, water: 0,
    note: "****", minQty: 2
  },
  { 
    id: "bitumen", 
    label: "Битумные котлы, плавители", 
    powder: 2, sand: 1, water: 0,
    note: "****", minQty: 2
  },
  { 
    id: "gsm_storage", 
    label: "Склады ГСМ на стройплощадке", 
    powder: 2, sand: 1, water: 1,
    note: "****", minQty: 2
  },
  { 
    id: "workshop_temp", 
    label: "Временные мастерские (столярные, слесарные)", 
    powder: 2, sand: 1, water: 0,
    note: "*", minQty: 2
  },
  { 
    id: "carbide", 
    label: "Склады карбида кальция", 
    powder: 2, sand: 0, water: 0,
    note: "Воду использовать запрещено!", minQty: 2
  },
  { 
    id: "paint_works", 
    label: "Малярные работы (с ЛКМ)", 
    powder: 2, sand: 0, water: 0,
    note: "*", minQty: 2
  },
  { 
    id: "roofing", 
    label: "Кровельные работы (наплавляемые материалы)", 
    powder: 2, sand: 1, water: 0,
    note: "****", minQty: 2
  },
  { 
    id: "concrete_site", 
    label: "Бетонные/растворные узлы", 
    powder: 1, sand: 1, water: 1,
    note: "", minQty: 0
  },
];

// ============================================================================
// КОМПЛЕКТАЦИЯ ПОЖАРНЫХ ЩИТОВ (Таблица 4 Приложения 3)
// ============================================================================

const SHIELD_CONFIG: Record<string, string[]> = {
  "ЩП-А": [
    "Огнетушители пенные (ОВП-10) — 2 шт. или порошковые (ОП-5) — 2 шт.",
    "Лом — 1 шт.",
    "Багор — 1 шт.",
    "Ведра — 2 шт.",
    "Совковая лопата — 1 шт.",
    "Полотно противопожарное 1,5×1,5 м — 1 шт."
  ],
  "ЩП-Б": [
    "Огнетушители порошковые (ОП-10) — 2 шт. или углекислотные (ОУ-5) — 2 шт.",
    "Лом — 1 шт.",
    "Ведра — 1 шт.",
    "Совковая лопата — 1 шт.",
    "Полотно противопожарное 1,5×1,5 м — 1 шт.",
    "Ящик с песком 0,5 м³ — 1 шт."
  ],
  "ЩП-В": [
    "Огнетушители пенные (ОВП-10) — 2 шт. или порошковые (ОП-5) — 2 шт.",
    "Лом — 1 шт.",
    "Ведра — 2 шт.",
    "Совковая лопата — 1 шт.",
    "Полотно противопожарное 1,5×1,5 м — 1 шт.",
    "Ящик с песком 0,5 м³ — 1 шт."
  ],
  "ЩП-Е": [
    "Огнетушители углекислотные (ОУ-5) — 2 шт. или порошковые (ОП-5) — 2 шт.",
    "Крюк с деревянной ручкой — 1 шт.",
    "Ковёр диэлектрический — 1 шт.",
    "Ножницы диэлектрические — 1 шт.",
    "Перчатки диэлектрические — 1 пара"
  ],
  "ЩП-СХ": [
    "Огнетушители пенные (ОВП-10) — 2 шт. или порошковые (ОП-5) — 2 шт.",
    "Лом — 1 шт.",
    "Багор — 1 шт.",
    "Вилы — 2 шт.",
    "Ведра — 2 шт.",
    "Совковая лопата — 1 шт.",
    "Полотно противопожарное 1,5×1,5 м — 1 шт.",
    "Бочка с водой 200 л — 1 шт."
  ],
};

// ============================================================================
// КОМПОНЕНТ КАЛЬКУЛЯТОРА
// ============================================================================

export default function FireExtinguishersCalculator() {
  // Состояния формы
  const [objType, setObjType] = useState<ObjType>("PRODUCTION");
  const [area, setArea] = useState("");
  const [category, setCategory] = useState<ExtCategory | "">("");
  const [subCategory, setSubCategory] = useState("");
  const [floors, setFloors] = useState("1");
  const [hasAUPT, setHasAUPT] = useState(false);
  const [hasElectrical, setHasElectrical] = useState(false);
  const [hasCabinets, setHasCabinets] = useState(false);
  const [unitCount, setUnitCount] = useState("1"); // Для гаражей, эстакад и т.д.

  // ============================================================================
  // ОСНОВНАЯ ЛОГИКА РАСЧЕТА
  // ============================================================================

  const result = useMemo<CalculationResult | null>(() => {
    const S = parseFloat(area) || 0;
    const N = Math.max(1, parseInt(floors) || 1);
    const units = Math.max(1, parseInt(unitCount) || 1);

    const reasons: { label: string; text: string; ref?: string }[] = [];
    const warnings: string[] = [];
    const notes: string[] = [];
    
    let powderCount = 0;
    let co2Count = 0;
    let foamCount = 0;
    let mobileCount = 0;
    let sandCount = 0;
    let waterCount = 0;
    let blanketCount = 0;
    let shieldType = "";
    let shieldCount = 0;
    let maxDistance = 20;

    // =========================================================================
    // РЕЖИМ 1: Производственные/Общественные (Приложение 3, Таблица 1-2)
    // =========================================================================
    if (objType === "PRODUCTION") {
      if (!category || S <= 0) return null;
      const data = CATEGORY_DATA[category as ExtCategory];
      maxDistance = data.distance;

      // Исключение для категории Д до 100 м²
      if (category === "D" && S <= 100) {
        return {
          powderCount: 0, co2Count: 0, foamCount: 0, mobileCount: 0,
          sandCount: 0, waterCount: 0, blanketCount: 0,
          shieldType: "", shieldCount: 0,
          totalPortable: 0, totalCount: 0, perFloor: [],
          reasons: [{ 
            label: "Исключение", 
            text: "Для помещений категории Д площадью до 100 м² огнетушители не требуются.",
            ref: "п. 8 Прил. 3 к ППБ РК"
          }],
          warnings: [], notes: [], maxDistance: 70
        };
      }

      // Базовый расчет переносных ОТ
      const blocks = Math.ceil(S / data.blockArea);
      let portableQty = blocks * data.powderNorm;
      
      reasons.push({ 
        label: "Базовый расчёт", 
        text: `Для площади ${S} м² требуется ${portableQty} шт. переносных огнетушителей (норма: ${data.powderNorm} шт. на каждые ${data.blockArea} м², Таблица 1).`,
        ref: "Табл. 1 Прил. 3 к ППБ РК"
      });

      // Скидка 50% при наличии АУПТ
      if (hasAUPT) {
        const before = portableQty;
        portableQty = Math.max(Math.round(portableQty * 0.5), N * 2);
        reasons.push({ 
          label: "АУПТ", 
          text: `Снижение на 50% (с ${before} до ${portableQty} шт.) при наличии автоматической установки пожаротушения.`,
          ref: "п. 10 Прил. 3 к ППБ РК"
        });
      }

      // Минимум 2 на этаж — ТОЛЬКО для общественных зданий
      if (category === "PUBLIC" && portableQty < N * 2) {
        portableQty = N * 2;
        reasons.push({ 
          label: "Минимум на этаж", 
          text: `Минимум 2 огнетушителя на каждый этаж для общественных зданий (всего ${portableQty} шт.).`,
          ref: "п. 5 Прил. 3 к ППБ РК"
        });
      }

      // Распределение по типам
      powderCount = portableQty;
      if (hasElectrical) {
        co2Count = Math.max(1, Math.round(portableQty * 0.2));
        powderCount = portableQty - co2Count;
        reasons.push({ 
          label: "Электрооборудование", 
          text: `Замена ${co2Count} шт. порошковых на углекислотные (ОУ-5) для защиты электрооборудования (класс пожара Е).`,
          ref: "Табл. 1 Прил. 3 к ППБ РК"
        });
      }

      // Передвижные огнетушители
      if (data.mobileThreshold && S > data.mobileThreshold) {
        // Исправленная формула: 1 на каждые 1000 м² сверх порога
        mobileCount = Math.ceil(S / 1000);
        reasons.push({ 
          label: "Передвижные ОТ", 
          text: `Требуется ${mobileCount} шт. передвижных огнетушителей (ОП-50 или ОУ-80) для площади свыше ${data.mobileThreshold} м².`,
          ref: "Табл. 2 Прил. 3 к ППБ РК"
        });
      }

      // Пожарные щиты
      if (data.shieldType && data.shieldArea > 0) {
        shieldType = data.shieldType;
        shieldCount = Math.ceil(S / data.shieldArea);
        warnings.push(`Пожарные щиты ${shieldType}: ${shieldCount} шт. (1 щит на ${data.shieldArea} м²)`);
      }

      // Макс. расстояние
      notes.push(`Максимальное расстояние до огнетушителя: ${maxDistance} м`);
    }

    // =========================================================================
    // РЕЖИМ 2: Объекты обслуживания (Таблица 5)
    // =========================================================================
    else if (objType === "SERVICE") {
      if (!subCategory) return null;
      const data = TABLE_5_DATA.find(d => d.id === subCategory);
      if (!data) return null;

      if (data.areaNorm > 0 && S > 0) {
        const calcUnits = Math.ceil(S / data.areaNorm);
        powderCount = calcUnits * data.powder;
        co2Count = calcUnits * data.co2;
        reasons.push({ 
          label: "Таблица 5", 
          text: `Для "${data.label}" на площади ${S} м² требуется: ${powderCount} ОП, ${co2Count} ОУ (норма: ${data.powder} ОП + ${data.co2} ОУ на каждые ${data.areaNorm} м²).`,
          ref: "Табл. 5 Прил. 3 к ППБ РК"
        });
      } else if (subCategory === "garage") {
        // Гаражи — по количеству боксов
        powderCount = units * data.powder;
        reasons.push({ 
          label: "Таблица 5", 
          text: `Для ${units} гаражных боксов требуется ${powderCount} шт. порошковых огнетушителей (по 1 ОП на бокс).`,
          ref: "Табл. 5 Прил. 3 к ППБ РК"
        });
      } else {
        powderCount = data.powder;
        co2Count = data.co2;
        reasons.push({ 
          label: "Таблица 5", 
          text: `Для "${data.label}" требуется: ${powderCount} ОП, ${co2Count} ОУ (фиксированная норма).`,
          ref: "Табл. 5 Прил. 3 к ППБ РК"
        });
      }

      // Передвижные для АЗС
      if ((data as any).mobile) {
        mobileCount = (data as any).mobile;
        warnings.push(`Дополнительно: ${mobileCount} × ОП-100 (передвижной)`);
      }

      // Пожарные щиты
      if (data.shield) {
        shieldType = data.shield;
        if (data.areaNorm > 0 && S > 0) {
          shieldCount = Math.ceil(S / data.areaNorm);
        } else {
          shieldCount = 1;
        }
        warnings.push(`Пожарный щит ${shieldType}: ${shieldCount} шт.`);
      }

      if (data.note) {
        notes.push(data.note);
      }
    }

    // =========================================================================
    // РЕЖИМ 3: Нефтяные объекты (Приложение 10)
    // =========================================================================
    else if (objType === "PETROLEUM") {
      if (!subCategory) return null;
      const data = APP_10_DATA.find(d => d.id === subCategory);
      if (!data) return null;

      let calcUnits = 1;
      if (data.areaNorm > 0 && S > 0) {
        calcUnits = Math.ceil(S / data.areaNorm);
      }

      co2Count = calcUnits * data.co2;
      foamCount = calcUnits * data.foam;
      powderCount = calcUnits * data.powder;
      sandCount = calcUnits * data.sand;
      blanketCount = calcUnits * data.blanket;
      waterCount = calcUnits * (data.water || 0);

      const areaText = data.areaNorm > 0 ? ` на площади ${S} м² (${calcUnits} ед. × ${data.areaNorm} м²)` : "";
      reasons.push({ 
        label: "Приложение 10", 
        text: `Для "${data.label}"${areaText}: ${co2Count} ОУ, ${foamCount} ОВП, ${powderCount} ОП.`,
        ref: "Прил. 10 к ППБ РК"
      });

      // Дополнительные средства
      if (sandCount > 0) {
        warnings.push(`Ящики с песком (0.5 м³): ${sandCount} шт.`);
      }
      if (blanketCount > 0) {
        warnings.push(`Кошма/покрывало противопожарное (2×2 м): ${blanketCount} шт.`);
      }

      if (data.note) {
        notes.push(data.note);
      }

      maxDistance = 30; // Для нефтеобъектов
    }

    // =========================================================================
    // РЕЖИМ 4: Строительные площадки (Приложение 11)
    // =========================================================================
    else if (objType === "CONSTRUCTION") {
      if (!subCategory) return null;
      const data = APP_11_DATA.find(d => d.id === subCategory);
      if (!data) return null;

      powderCount = units * data.powder;
      sandCount = units * (data.sand || 0);
      waterCount = units * (data.water || 0);

      // Применяем минимум если указан (примечания *, ****)
      if (data.minQty && powderCount < data.minQty) {
        powderCount = data.minQty;
      }

      reasons.push({ 
        label: "Приложение 11", 
        text: `Для "${data.label}": ${powderCount} шт. порошковых огнетушителей (ОП-5 или ОП-10).`,
        ref: "Прил. 11 к ППБ РК"
      });

      // Примечания по символам
      if (data.note === "*") {
        notes.push("* — Минимум 2 огнетушителя на объект");
      } else if (data.note === "****") {
        notes.push("**** — Минимум 2 огнетушителя + ящик с песком 0.5 м³");
        if (sandCount === 0) sandCount = 1;
      } else if (data.note) {
        notes.push(data.note);
      }

      // Вывод доп. средств
      if (sandCount > 0) {
        warnings.push(`Ящики с песком (0.5 м³): ${sandCount} шт.`);
      }
      if (waterCount > 0) {
        warnings.push(`Бочки с водой (≥200 л): ${waterCount} шт.`);
      }

      maxDistance = 20; // Для стройплощадок
    }

    // =========================================================================
    // ИТОГОВЫЕ РАСЧЕТЫ
    // =========================================================================

    const totalPortable = powderCount + co2Count + foamCount;
    
    // Распределение по этажам
    const perFloorArr = Array(N).fill(0);
    for (let i = 0; i < totalPortable; i++) {
      perFloorArr[i % N] += 1;
    }

    // Примечание о резерве
    notes.push("Рекомендация: резерв 10% огнетушителей для замены на время ТО (СТ РК 1487-2006 п. 8.5) — не является обязательным требованием ППБ.");

    // Пожарные шкафы
    if (hasCabinets) {
      warnings.push("В каждом пожарном шкафу (ПК) должно быть не менее 2 огнетушителей");
    }

    return {
      powderCount,
      co2Count,
      foamCount,
      mobileCount,
      sandCount,
      waterCount,
      blanketCount,
      shieldType,
      shieldCount,
      totalPortable,
      totalCount: totalPortable + mobileCount,
      perFloor: perFloorArr,
      reasons,
      warnings,
      notes,
      maxDistance
    };
  }, [area, category, subCategory, objType, floors, hasAUPT, hasElectrical, hasCabinets, unitCount]);

  // ============================================================================
  // СБРОС ФОРМЫ
  // ============================================================================

  const reset = () => {
    setArea(""); 
    setCategory(""); 
    setSubCategory(""); 
    setFloors("1");
    setHasAUPT(false); 
    setHasElectrical(false); 
    setHasCabinets(false);
    setUnitCount("1");
    setObjType("PRODUCTION");
  };

  // ============================================================================
  // ЭКСПОРТ ОТЧЕТА
  // ============================================================================

  const exportResult = () => {
    if (!result) return;
    
    const now = new Date();
    const dateStr = now.toLocaleDateString("ru-RU");
    const timeStr = now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    
    // Определяем название объекта
    let objName = "";
    if (objType === "PRODUCTION" && category) {
      objName = CATEGORY_DATA[category as ExtCategory]?.label || "";
    } else if (objType === "SERVICE") {
      objName = TABLE_5_DATA.find(d => d.id === subCategory)?.label || "";
    } else if (objType === "PETROLEUM") {
      objName = APP_10_DATA.find(d => d.id === subCategory)?.label || "";
    } else if (objType === "CONSTRUCTION") {
      objName = APP_11_DATA.find(d => d.id === subCategory)?.label || "";
    }

    let content = `ОТЧЕТ ПО РАСЧЕТУ ПЕРВИЧНЫХ СРЕДСТВ ПОЖАРОТУШЕНИЯ
========================================================
Дата: ${dateStr}
Время: ${timeStr}
Объект: ${objName}
Площадь: ${area} м² | Этажность: ${floors}
========================================================

РЕЗУЛЬТАТЫ:
`;

    if (result.powderCount > 0) {
      content += `- Переносные порошковые (ОП-4/5): ${result.powderCount} шт.\n`;
    }
    if (result.co2Count > 0) {
      content += `- Переносные углекислотные (ОУ-5): ${result.co2Count} шт.\n`;
    }
    if (result.foamCount > 0) {
      content += `- Переносные пенные (ОВП-10): ${result.foamCount} шт.\n`;
    }
    if (result.mobileCount > 0) {
      content += `- Передвижные (ОП-50 / ОП-100): ${result.mobileCount} шт.\n`;
    }
    content += `- ИТОГО огнетушителей: ${result.totalCount} шт.\n`;
    content += `- Макс. расстояние до ОТ: ${result.maxDistance} м\n`;

    // Дополнительные средства
    if (result.sandCount > 0 || result.waterCount > 0 || result.blanketCount > 0 || result.shieldCount > 0) {
      content += `\nДОПОЛНИТЕЛЬНЫЕ СРЕДСТВА:\n`;
      if (result.shieldCount > 0) {
        content += `- Пожарные щиты ${result.shieldType}: ${result.shieldCount} шт.\n`;
      }
      if (result.sandCount > 0) {
        content += `- Ящики с песком (0.5 м³): ${result.sandCount} шт.\n`;
      }
      if (result.waterCount > 0) {
        content += `- Бочки с водой (≥200 л): ${result.waterCount} шт.\n`;
      }
      if (result.blanketCount > 0) {
        content += `- Кошма/покрывало (2×2 м): ${result.blanketCount} шт.\n`;
      }
    }

    // Распределение по этажам
    if (result.perFloor.length > 1) {
      content += `\nРАСПРЕДЕЛЕНИЕ ПО ЭТАЖАМ:\n`;
      result.perFloor.forEach((cnt, idx) => {
        content += `- Этаж ${idx + 1}: ${cnt} шт.\n`;
      });
    }

    // Обоснования
    content += `\nОБОСНОВАНИЕ:\n`;
    result.reasons.forEach(r => {
      content += `[${r.label}] ${r.text}`;
      if (r.ref) content += ` (${r.ref})`;
      content += `\n`;
    });

    // Предупреждения
    if (result.warnings.length > 0) {
      content += `\nТРЕБОВАНИЯ И ИНВЕНТАРЬ:\n`;
      result.warnings.forEach(w => {
        content += `! ${w}\n`;
      });
    }

    // Примечания
    if (result.notes.length > 0) {
      content += `\nПРИМЕЧАНИЯ:\n`;
      result.notes.forEach(n => {
        content += `• ${n}\n`;
      });
    }

    // Комплектация щита
    if (result.shieldType && SHIELD_CONFIG[result.shieldType]) {
      content += `\nКОМПЛЕКТАЦИЯ ПОЖАРНОГО ЩИТА ${result.shieldType}:\n`;
      SHIELD_CONFIG[result.shieldType].forEach(item => {
        content += `  - ${item}\n`;
      });
    }

    content += `\n========================================================
Основание: ППБ РК (Приложения 3, 10, 11), СТ РК 1487-2006.
Расчет выполнен автоматически. Проверьте соответствие требованиям.
`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fire_calculation_${dateStr.replace(/\./g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ============================================================================
  // РЕНДЕРИНГ UI
  // ============================================================================

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/calculators">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 w-4 h-4" /> Назад
          </Button>
        </Link>
      </div>

      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-4 flex items-center justify-center">
          <Calculator className="mr-3 w-8 h-8 text-red-500" />
          Калькулятор первичных средств пожаротушения
        </h1>
        <p className="text-muted-foreground">ППБ РК, Приложения 3, 10, 11 и Таблица 5</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ==================== ЛЕВАЯ ПАНЕЛЬ: ВВОД ==================== */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Параметры объекта</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Выбор сценария */}
            <div className="space-y-3">
              <Label>Сценарий расчета</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "PRODUCTION", label: "Производственные / Общественные", icon: Flame },
                  { id: "SERVICE", label: "Объекты обслуживания", icon: RefreshCw },
                  { id: "PETROLEUM", label: "Нефтяные объекты / ГСМ", icon: Layers },
                  { id: "CONSTRUCTION", label: "Строительные площадки", icon: Construction }
                ].map((t) => (
                  <Button
                    key={t.id}
                    variant={objType === t.id ? "default" : "outline"}
                    size="sm"
                    className="flex-1 min-w-[140px]"
                    onClick={() => { setObjType(t.id as ObjType); setSubCategory(""); }}
                  >
                    <t.icon className="w-4 h-4 mr-2" /> {t.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Площадь */}
            <div className="space-y-2">
              <Label htmlFor="area">Общая площадь (м²)</Label>
              <Input 
                id="area" 
                type="number" 
                placeholder="Введите площадь"
                value={area} 
                onChange={(e) => setArea(e.target.value)} 
              />
            </div>

            {/* Категория или подкатегория */}
            {objType === "PRODUCTION" ? (
              <div className="space-y-2">
                <Label>Категория взрывопожароопасности</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as ExtCategory)}>
                  <SelectTrigger><SelectValue placeholder="Выберите категорию" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_DATA).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Тип объекта / участка</Label>
                <Select value={subCategory} onValueChange={setSubCategory}>
                  <SelectTrigger><SelectValue placeholder="Выберите тип" /></SelectTrigger>
                  <SelectContent>
                    {objType === "SERVICE" && TABLE_5_DATA.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>
                    ))}
                    {objType === "PETROLEUM" && APP_10_DATA.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>
                    ))}
                    {objType === "CONSTRUCTION" && APP_11_DATA.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Количество единиц (для гаражей, лесов и т.д.) */}
            {(subCategory === "garage" || subCategory === "scaffolding" || subCategory === "fire_works" || 
              subCategory === "estacade" || subCategory === "reservoir_park") && (
              <div className="space-y-2">
                <Label>Количество единиц (боксов, секций, участков)</Label>
                <Input 
                  type="number" 
                  min="1" 
                  value={unitCount} 
                  onChange={(e) => setUnitCount(e.target.value)} 
                />
              </div>
            )}

            {/* Этажность */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Этажность</Label>
                <Input 
                  type="number" 
                  min="1" 
                  value={floors} 
                  onChange={(e) => setFloors(e.target.value)} 
                />
              </div>
            </div>

            {/* Чекбоксы */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="aupt" checked={hasAUPT} onCheckedChange={(c) => setHasAUPT(!!c)} />
                <Label htmlFor="aupt" className="text-sm cursor-pointer">АУПТ (-50%)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="elec" checked={hasElectrical} onCheckedChange={(c) => setHasElectrical(!!c)} />
                <Label htmlFor="elec" className="text-sm cursor-pointer">Электрооборудование</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="cabinets" checked={hasCabinets} onCheckedChange={(c) => setHasCabinets(!!c)} />
                <Label htmlFor="cabinets" className="text-sm cursor-pointer">Пожарные шкафы (ПК)</Label>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button variant="outline" className="flex-1" onClick={reset}>
                <RefreshCw className="w-4 h-4 mr-2" /> Сбросить
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ==================== ПРАВАЯ ПАНЕЛЬ: РЕЗУЛЬТАТ ==================== */}
        <Card className="bg-slate-50/50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Результат
              {result && (
                <Button variant="ghost" size="sm" onClick={exportResult}>
                  <FileDown className="w-4 h-4 mr-2" /> Экспорт
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div 
                  key="res" 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="space-y-6"
                >
                  {/* Основные огнетушители */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-red-100/50 dark:bg-red-900/20 rounded-xl text-center border border-red-200 dark:border-red-800">
                      <div className="text-3xl font-bold text-red-600">{result.powderCount}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">Порошковые (ОП)</div>
                    </div>
                    <div className="p-4 bg-blue-100/50 dark:bg-blue-900/20 rounded-xl text-center border border-blue-200 dark:border-blue-800">
                      <div className="text-3xl font-bold text-blue-600">{result.co2Count}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">Углекисл. (ОУ)</div>
                    </div>
                    <div className="p-4 bg-green-100/50 dark:bg-green-900/20 rounded-xl text-center border border-green-200 dark:border-green-800">
                      <div className="text-3xl font-bold text-green-600">{result.foamCount}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">Пенные (ОВП)</div>
                    </div>
                    <div className="p-4 bg-orange-100/50 dark:bg-orange-900/20 rounded-xl text-center border border-orange-200 dark:border-orange-800">
                      <div className="text-3xl font-bold text-orange-600">{result.mobileCount}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">Передвижные</div>
                    </div>
                  </div>

                  {/* Итого и дистанция */}
                  <div className="flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <div>
                      <span className="text-sm text-muted-foreground">ИТОГО:</span>
                      <span className="ml-2 text-xl font-bold">{result.totalCount} шт.</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Макс. дистанция:</span>
                      <span className="ml-2 font-bold">{result.maxDistance} м</span>
                    </div>
                  </div>

                  {/* Дополнительные средства */}
                  {(result.sandCount > 0 || result.waterCount > 0 || result.blanketCount > 0 || result.shieldCount > 0) && (
                    <div className="grid grid-cols-2 gap-3">
                      {result.shieldCount > 0 && (
                        <div className="p-3 bg-purple-100/50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                          <div className="text-lg font-bold text-purple-600">{result.shieldCount}× {result.shieldType}</div>
                          <div className="text-[10px] text-muted-foreground">Пожарные щиты</div>
                        </div>
                      )}
                      {result.sandCount > 0 && (
                        <div className="p-3 bg-yellow-100/50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <div className="text-lg font-bold text-yellow-700">{result.sandCount} шт.</div>
                          <div className="text-[10px] text-muted-foreground">Ящики с песком</div>
                        </div>
                      )}
                      {result.waterCount > 0 && (
                        <div className="p-3 bg-cyan-100/50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
                          <div className="text-lg font-bold text-cyan-600">{result.waterCount} шт.</div>
                          <div className="text-[10px] text-muted-foreground">Бочки с водой</div>
                        </div>
                      )}
                      {result.blanketCount > 0 && (
                        <div className="p-3 bg-pink-100/50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                          <div className="text-lg font-bold text-pink-600">{result.blanketCount} шт.</div>
                          <div className="text-[10px] text-muted-foreground">Кошма/покрывало</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Распределение по этажам */}
                  {result.perFloor.length > 1 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-sm flex items-center">
                        <Layers className="w-4 h-4 mr-2" /> Распределение по этажам:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {result.perFloor.map((cnt, idx) => (
                          <Badge key={idx} variant="secondary">
                            Этаж {idx + 1}: {cnt} шт.
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Обоснование */}
                  <div className="space-y-3 pt-4 border-t">
                    <h4 className="font-bold text-sm flex items-center">
                      <Info className="w-4 h-4 mr-2" /> Обоснование:
                    </h4>
                    <ul className="space-y-2">
                      {result.reasons.map((r, i) => (
                        <li key={i} className="text-xs flex items-start">
                          <CheckCircle className="w-3 h-3 text-emerald-500 mr-2 mt-0.5 shrink-0" />
                          <span>
                            <span className="font-bold">[{r.label}]</span> {r.text}
                            {r.ref && <span className="text-muted-foreground ml-1">({r.ref})</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Предупреждения */}
                  {result.warnings.length > 0 && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
                      <h4 className="text-amber-700 dark:text-amber-400 text-xs font-bold mb-2 flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-2" /> ТРЕБОВАНИЯ И ИНВЕНТАРЬ:
                      </h4>
                      <ul className="space-y-1">
                        {result.warnings.map((w, i) => (
                          <li key={i} className="text-[10px]">• {w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Примечания */}
                  {result.notes.length > 0 && (
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <h4 className="text-xs font-bold mb-2 flex items-center">
                        <Info className="w-3 h-3 mr-2" /> ПРИМЕЧАНИЯ:
                      </h4>
                      <ul className="space-y-1">
                        {result.notes.map((n, i) => (
                          <li key={i} className="text-[10px] text-muted-foreground">• {n}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Комплектация щита */}
                  {result.shieldType && SHIELD_CONFIG[result.shieldType] && (
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800">
                      <h4 className="text-purple-700 dark:text-purple-400 text-xs font-bold mb-2 flex items-center">
                        <Shield className="w-3 h-3 mr-2" /> КОМПЛЕКТАЦИЯ ЩИТА {result.shieldType}:
                      </h4>
                      <ul className="space-y-1">
                        {SHIELD_CONFIG[result.shieldType].map((item, i) => (
                          <li key={i} className="text-[10px]">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="py-20 text-center text-muted-foreground">
                  <Calculator className="w-12 h-12 mx-auto mb-4 opacity-10" />
                  Укажите площадь и выберите категорию/тип объекта
                </div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
