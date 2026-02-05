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

type ObjType = "INDUSTRIAL" | "PUBLIC" | "SERVICE" | "PETROLEUM" | "CONSTRUCTION";
type ExtCategory = "A" | "B" | "V_GAS" | "V_SOLID" | "G" | "D";
type FireClass = "A" | "B" | "C" | "D" | "E";

// ============================================================================
// КЛАССЫ ПОЖАРОВ (Приложение 1 к Техническому регламенту)
// ============================================================================

const FIRE_CLASS_INFO: Record<FireClass, { label: string; description: string; examples: string }> = {
  "A": {
    label: "Класс А",
    description: "Пожары твёрдых горючих веществ и материалов",
    examples: "Дерево, бумага, ткани, пластмассы"
  },
  "B": {
    label: "Класс B",
    description: "Пожары горючих жидкостей или плавящихся твёрдых веществ",
    examples: "Бензин, масла, растворители, парафин"
  },
  "C": {
    label: "Класс C",
    description: "Пожары газов",
    examples: "Пропан, метан, водород, ацетилен"
  },
  "D": {
    label: "Класс D",
    description: "Пожары металлов",
    examples: "Алюминий, магний, титан, натрий"
  },
  "E": {
    label: "Класс E",
    description: "Пожары электроустановок под напряжением",
    examples: "Электрощиты, серверные, трансформаторы"
  }
};

// ============================================================================
// МАТРИЦА РЕКОМЕНДАЦИЙ ПО ТИПАМ ОГНЕТУШИТЕЛЕЙ (Таблицы 1-2 Прил. 3)
// "++": рекомендуемый, "+": допускаемый, "-": не допускается
// ============================================================================

type ExtRecommendation = "++" | "+" | "-";

interface ExtinguisherRec {
  foam: ExtRecommendation;      // Пенные и водные
  powder2: ExtRecommendation;   // Порошковые 2 л
  powder5: ExtRecommendation;   // Порошковые 5(4) л
  powder10: ExtRecommendation;  // Порошковые 10(9) л
  powder3: ExtRecommendation;   // Порошковые 3 л
  powder6: ExtRecommendation;   // Порошковые 6 л
  emulsion: ExtRecommendation;  // Воздушно-эмульсионные
  co2_2: ExtRecommendation;     // Углекислотные 2(2) л
  co2_5: ExtRecommendation;     // Углекислотные 3(5), 5(8) л
}

// Таблица 1: Переносные огнетушители
const PORTABLE_MATRIX: Record<string, Record<FireClass, ExtinguisherRec>> = {
  // Категория А, Б, В1-В4 (горючие газы и жидкости) — 200 м²
  "A_B_V_GAS": {
    "A": { foam: "++", powder2: "++", powder5: "-", powder10: "++", powder3: "++", powder6: "++", emulsion: "++", co2_2: "-", co2_5: "-" },
    "B": { foam: "++", powder2: "-", powder5: "++", powder10: "++", powder3: "++", powder6: "++", emulsion: "++", co2_2: "-", co2_5: "+" },
    "C": { foam: "-", powder2: "-", powder5: "-", powder10: "++", powder3: "-", powder6: "++", emulsion: "-", co2_2: "-", co2_5: "-" },
    "D": { foam: "-", powder2: "-", powder5: "-", powder10: "++", powder3: "-", powder6: "++", emulsion: "-", co2_2: "-", co2_5: "-" },
    "E": { foam: "-", powder2: "-", powder5: "-", powder10: "++", powder3: "++", powder6: "++", emulsion: "-", co2_2: "++", co2_5: "++" }
  },
  // Категория В1-В4 (твёрдые горючие вещества) — 400 м²
  "V_SOLID": {
    "A": { foam: "++", powder2: "-", powder5: "++", powder10: "++", powder3: "++", powder6: "++", emulsion: "++", co2_2: "-", co2_5: "+" },
    "B": { foam: "-", powder2: "-", powder5: "-", powder10: "-", powder3: "-", powder6: "-", emulsion: "-", co2_2: "-", co2_5: "-" },
    "C": { foam: "-", powder2: "-", powder5: "-", powder10: "-", powder3: "-", powder6: "-", emulsion: "-", co2_2: "-", co2_5: "-" },
    "D": { foam: "-", powder2: "-", powder5: "++", powder10: "++", powder3: "++", powder6: "++", emulsion: "-", co2_2: "++", co2_5: "++" },
    "E": { foam: "-", powder2: "-", powder5: "++", powder10: "++", powder3: "++", powder6: "++", emulsion: "-", co2_2: "++", co2_5: "++" }
  },
  // Категория Г и Д — 1800 м²
  "G_D": {
    "A": { foam: "++", powder2: "-", powder5: "-", powder10: "++", powder3: "-", powder6: "++", emulsion: "+", co2_2: "-", co2_5: "+" },
    "B": { foam: "-", powder2: "-", powder5: "-", powder10: "-", powder3: "-", powder6: "-", emulsion: "-", co2_2: "-", co2_5: "-" },
    "C": { foam: "-", powder2: "-", powder5: "-", powder10: "-", powder3: "-", powder6: "-", emulsion: "-", co2_2: "-", co2_5: "-" },
    "D": { foam: "-", powder2: "-", powder5: "-", powder10: "++", powder3: "-", powder6: "++", emulsion: "-", co2_2: "++", co2_5: "++" },
    "E": { foam: "-", powder2: "-", powder5: "-", powder10: "++", powder3: "-", powder6: "++", emulsion: "-", co2_2: "++", co2_5: "++" }
  },
  // Общественные здания — 800 м²
  "PUBLIC": {
    "A": { foam: "++", powder2: "++", powder5: "++", powder10: "++", powder3: "++", powder6: "++", emulsion: "++", co2_2: "-", co2_5: "+" },
    "B": { foam: "-", powder2: "-", powder5: "-", powder10: "-", powder3: "-", powder6: "-", emulsion: "-", co2_2: "-", co2_5: "-" },
    "C": { foam: "-", powder2: "-", powder5: "-", powder10: "-", powder3: "-", powder6: "-", emulsion: "-", co2_2: "-", co2_5: "-" },
    "D": { foam: "-", powder2: "-", powder5: "-", powder10: "-", powder3: "-", powder6: "-", emulsion: "-", co2_2: "-", co2_5: "-" },
    "E": { foam: "-", powder2: "-", powder5: "++", powder10: "++", powder3: "++", powder6: "++", emulsion: "-", co2_2: "++", co2_5: "++" }
  }
};

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
  matrixKey: string;      // Ключ для PORTABLE_MATRIX
}> = {
  "A": {
    label: "А (повышенная взрывопожароопасность)",
    blockArea: 200, powderNorm: 2, distance: 30, mobileThreshold: 500,
    shieldType: "ЩП-А", shieldArea: 200, fireClass: "А, Б, В",
    matrixKey: "A_B_V_GAS"
  },
  "B": {
    label: "Б (взрывопожароопасность)",
    blockArea: 200, powderNorm: 2, distance: 30, mobileThreshold: 500,
    shieldType: "ЩП-Б", shieldArea: 200, fireClass: "А, Б, В",
    matrixKey: "A_B_V_GAS"
  },
  "V_GAS": {
    label: "В - горючие газы и жидкости",
    blockArea: 200, powderNorm: 2, distance: 30, mobileThreshold: 500,
    shieldType: "ЩП-Б", shieldArea: 200, fireClass: "А, Б",
    matrixKey: "A_B_V_GAS"
  },
  "V_SOLID": {
    label: "В - твердые горючие вещества и материалы",
    blockArea: 400, powderNorm: 2, distance: 30, mobileThreshold: 800,
    shieldType: "ЩП-А", shieldArea: 400, fireClass: "А",
    matrixKey: "V_SOLID"
  },
  "G": {
    label: "Г (умеренная пожароопасность) и Д",
    blockArea: 1800, powderNorm: 2, distance: 40, mobileThreshold: 1800,
    shieldType: "ЩП-А", shieldArea: 1800, fireClass: "А",
    matrixKey: "G_D"
  },
  "D": {
    label: "Д (пониженная пожароопасность)",
    blockArea: 1800, powderNorm: 2, distance: 70,
    shieldType: "", shieldArea: 0, fireClass: "—",
    matrixKey: "G_D"
  }
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
  const [objType, setObjType] = useState<ObjType>("INDUSTRIAL");
  const [area, setArea] = useState("");
  const [category, setCategory] = useState<ExtCategory | "">("");
  const [subCategory, setSubCategory] = useState("");
  const [floors, setFloors] = useState("1");
  const [hasAUPT, setHasAUPT] = useState(false);
  const [hasElectrical, setHasElectrical] = useState(false);
  const [hasCabinets, setHasCabinets] = useState(false);
  const [unitCount, setUnitCount] = useState("1"); // Для гаражей, эстакад и т.д.
  const [fireClasses, setFireClasses] = useState<FireClass[]>(["A"]); // Классы пожара
  const [strictOnly, setStrictOnly] = useState(true); // Только рекомендуемые (++)

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
    // РЕЖИМ 1: Производственные и складские здания (Категории А-Д)
    // =========================================================================
    if (objType === "INDUSTRIAL") {
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
        text: `Для площади ${S} м² требуется ${portableQty} шт. переносных огнетушителей (норма: ${data.powderNorm} шт. на каждые ${data.blockArea} м² для данной категории).`,
        ref: "Табл. 1 Прил. 3 к ППБ РК"
      });

      // Рекомендации по типам огнетушителей на основе классов пожара
      if (fireClasses.length > 0) {
        const matrixData = PORTABLE_MATRIX[data.matrixKey];
        if (matrixData) {
          const recs = fireClasses.map(fc => matrixData[fc]).filter(Boolean);

          // Поиск типов, которые являются рекомендуемыми (++) для ВСЕХ выбранных классов
          const universalPlusPlus = ["powder10", "powder6", "foam", "emulsion", "co2_5"].filter(type =>
            recs.every(r => r[type as keyof ExtinguisherRec] === "++")
          );

          // Поиск типов, которые хотя бы допускаются (+) для ВСЕХ выбранных классов
          const universalPlus = ["powder10", "powder6", "foam", "emulsion", "co2_5"].filter(type =>
            recs.every(r => r[type as keyof ExtinguisherRec] === "++" || r[type as keyof ExtinguisherRec] === "+")
          ).filter(type => !universalPlusPlus.includes(type));

          const typeMap: Record<string, string> = {
            powder10: "ОП-10", powder6: "ОП-6", foam: "ОВП-10", emulsion: "ОВЭ-6", co2_5: "ОУ-5/ОУ-8"
          };

          const recommendedTypes = universalPlusPlus.map(t => typeMap[t]);
          const allowedTypes = universalPlus.map(t => typeMap[t]);

          if (recommendedTypes.length > 0 || (!strictOnly && allowedTypes.length > 0)) {
            reasons.push({
              label: "Тип огнетушителей",
              text: `На основе выбранных классов (${fireClasses.join(", ")}): ${recommendedTypes.length > 0 ? `Рекомендуемые (++): ${recommendedTypes.join(", ")}` : "Рекомендуемых типов для всех классов одновременно не найдено"
                }${!strictOnly && allowedTypes.length > 0 ? `. Допускаемые (+): ${allowedTypes.join(", ")}` : ""}.`,
              ref: "Табл. 1 Прил. 3 к ППБ РК"
            });

            if (universalPlusPlus.some(t => t.startsWith("powder"))) {
              notes.push("Предпочтение отдается более универсальному порошковому огнетушителю (п. 2 Прил. 3).");
            }
          } else if (strictOnly && universalPlus.length > 0) {
            warnings.push("Для выбранной комбинации классов нет 'рекомендуемых' (++) типов, но есть 'допускаемые' (+). Отключите фильтр 'Только рекомендуемые', чтобы увидеть их.");
          }

          // Примечания по маркам порошка
          if (fireClasses.includes("A")) {
            notes.push("Для тушения пожаров класса А – порошковые огнетушители с зарядом ABC(E).");
          }
          if (fireClasses.some(c => ["B", "C", "E"].includes(c))) {
            notes.push("Для тушения пожаров классов В, С и Е – порошковые огнетушители с зарядом BC(E) или ABC(E).");
          }
          if (fireClasses.includes("D")) {
            notes.push("Для тушения пожаров класса D – порошковые огнетушители с зарядом D.");
          }

          const classDescriptions = fireClasses.map(fc => `${fc} (${FIRE_CLASS_INFO[fc].description})`).join("; ");
          notes.push(`Выбранные классы пожара: ${classDescriptions}`);
        }
      }

      // Скидка 50% при наличии АУПТ
      if (hasAUPT) {
        const before = portableQty;
        portableQty = Math.max(Math.round(portableQty * 0.5), 1); // Минимум 1 если не общественное
        reasons.push({
          label: "АУПТ",
          text: `Снижение на 50% (с ${before} до ${portableQty} шт.) при наличии автоматической установки пожаротушения.`,
          ref: "п. 10 Прил. 3 к ППБ РК"
        });
      }

      // Распределение по типам
      powderCount = portableQty;
      if (hasElectrical || fireClasses.includes("E")) {
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

      notes.push(`Максимальное расстояние до огнетушителя: ${maxDistance} м`);
    }

    // =========================================================================
    // РЕЖИМ 2: Общественные здания
    // =========================================================================
    else if (objType === "PUBLIC") {
      if (S <= 0) return null;
      maxDistance = 20;

      const blockArea = 800;
      const powderNorm = 2;
      const blocks = Math.ceil(S / blockArea);
      let portableQty = blocks * powderNorm;

      reasons.push({
        label: "Базовый расчёт",
        text: `Для площади ${S} м² требуется ${portableQty} шт. переносных огнетушителей (норма: 2 шт. на каждые 800 м² для общественных зданий).`,
        ref: "Табл. 1 Прил. 3 к ППБ РК"
      });

      // Рекомендации по типам огнетушителей для общественных зданий
      if (fireClasses.length > 0) {
        const matrixData = PORTABLE_MATRIX["PUBLIC"];
        if (matrixData) {
          const recs = fireClasses.map(fc => matrixData[fc]).filter(Boolean);

          const universalPlusPlus = ["powder10", "powder6", "foam", "emulsion", "co2_5"].filter(type =>
            recs.every(r => r[type as keyof ExtinguisherRec] === "++")
          );

          const universalPlus = ["powder10", "powder6", "foam", "emulsion", "co2_5"].filter(type =>
            recs.every(r => r[type as keyof ExtinguisherRec] === "++" || r[type as keyof ExtinguisherRec] === "+")
          ).filter(type => !universalPlusPlus.includes(type));

          const typeMap: Record<string, string> = {
            powder10: "ОП-10", powder6: "ОП-6", foam: "ОВП-10", emulsion: "ОВЭ-6", co2_5: "ОУ-5/ОУ-8"
          };

          const recommendedTypes = universalPlusPlus.map(t => typeMap[t]);
          const allowedTypes = universalPlus.map(t => typeMap[t]);

          if (recommendedTypes.length > 0 || (!strictOnly && allowedTypes.length > 0)) {
            reasons.push({
              label: "Тип огнетушителей",
              text: `На основе выбранных классов (${fireClasses.join(", ")}): ${recommendedTypes.length > 0 ? `Рекомендуемые (++): ${recommendedTypes.join(", ")}` : "Рекомендуемых типов для всех классов одновременно не найдено"
                }${!strictOnly && allowedTypes.length > 0 ? `. Допускаемые (+): ${allowedTypes.join(", ")}` : ""}.`,
              ref: "Табл. 1 Прил. 3 к ППБ РК"
            });
          } else if (strictOnly && universalPlus.length > 0) {
            warnings.push("Нет 'рекомендуемых' (++) типов для этой комбинации классов. Отключите 'Только рекомендуемые' в настройках.");
          }

          // Примечания по порошку
          if (fireClasses.includes("A")) {
            notes.push("Для общественных зданий (класс А) – порошковые огнетушители с зарядом ABC(E).");
          }
          if (fireClasses.some(c => ["B", "C", "E"].includes(c))) {
            notes.push("Для тушения электроустановок (класс Е) – порошковые ABC(E) или углекислотные ОУ.");
          }
        }
      }

      // Скидка 50% при наличии АУПТ
      if (hasAUPT) {
        const before = portableQty;
        portableQty = Math.max(Math.round(portableQty * 0.5), N * 2);
        reasons.push({
          label: "АУПТ",
          text: `Снижение на 50% (с ${before} до ${portableQty} шт., но не менее 2 на этаж).`,
          ref: "п. 10 Прил. 3 к ППБ РК"
        });
      }

      // Минимум 2 на этаж
      if (portableQty < N * 2) {
        portableQty = N * 2;
        reasons.push({
          label: "Минимум на этаж",
          text: `В общественных зданиях и сооружениях на каждом этаже размещается не менее двух огнетушителей.`,
          ref: "п. 5 Прил. 3 к ППБ РК"
        });
      }

      powderCount = portableQty;
      if (hasElectrical || fireClasses.includes("E")) {
        co2Count = Math.max(1, Math.round(portableQty * 0.2));
        powderCount = portableQty - co2Count;
        reasons.push({ label: "Электрооборудование", text: `Замена ${co2Count} шт. на ОУ.` });
      }

      notes.push(`Максимальное расстояние до огнетушителя: ${maxDistance} м`);
    }

    // =========================================================================
    // РЕЖИМ 3: Объекты обслуживания (Таблица 5)
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
    setObjType("INDUSTRIAL");
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
    if (objType === "INDUSTRIAL" && category) {
      objName = `Производственное или складское здание (кат. ${category})`;
    } else if (objType === "PUBLIC") {
      objName = "Общественное здание";
    } else if (objType === "SERVICE") {
      objName = "Объект обслуживания";
    } else if (objType === "PETROLEUM") {
      objName = "Предприятие нефтепродуктообеспечения";
    } else if (objType === "CONSTRUCTION") {
      objName = "Строящееся/реконструируемое здание или сооружение";
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
        <h1 className="text-4xl font-black mb-4 flex items-center justify-center text-white">
          <Calculator className="mr-3 w-10 h-10 text-red-600" />
          Калькулятор первичных средств пожаротушения
        </h1>
        <p className="text-white uppercase text-xs tracking-widest font-black">
          согласно правилам пожарной безопасности рк
        </p>
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
              <Label htmlFor="obj-type">Тип объекта (помещение, здание)</Label>
              <Select
                value={objType}
                onValueChange={(v) => {
                  const newType = v as ObjType;
                  setObjType(newType);
                  setSubCategory("");
                  // Если переключаемся на общественные, оставляем только подходящие классы
                  if (newType === "PUBLIC") {
                    setFireClasses(prev => {
                      const filtered = prev.filter(c => ["A", "E"].includes(c));
                      return filtered.length > 0 ? filtered : ["A"];
                    });
                  }
                }}
              >
                <SelectTrigger id="obj-type">
                  <SelectValue placeholder="Выберите тип объекта" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INDUSTRIAL">Производственные и складские здания</SelectItem>
                  <SelectItem value="PUBLIC">Общественные здания</SelectItem>
                  <SelectItem value="SERVICE">Объекты обслуживания</SelectItem>
                  <SelectItem value="PETROLEUM">Основные и вспомогательные предприятия нефтепродуктообеспечения</SelectItem>
                  <SelectItem value="CONSTRUCTION">Строящиеся и реконструируемые здания, сооружения и подсобные помещения</SelectItem>
                </SelectContent>
              </Select>
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
            {objType === "INDUSTRIAL" ? (
              <div className="space-y-2">
                <Label>Категория производственного/складского здания</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as ExtCategory)}>
                  <SelectTrigger><SelectValue placeholder="Выберите категорию" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_DATA).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : objType !== "PUBLIC" ? (
              <div className="space-y-2">
                <Label>Тип участка / Оборудование</Label>
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
            ) : null}

            {/* Классы пожара (Производственные и Общественные) */}
            {(objType === "INDUSTRIAL" || objType === "PUBLIC") && (
              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    Классы пожара
                    <span className="text-[10px] text-muted-foreground font-normal">(выберите все применимые)</span>
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="strict-mode" className="text-[10px] uppercase font-bold text-slate-500 cursor-pointer">
                      Только рекомендуемые (++)
                    </Label>
                    <Checkbox
                      id="strict-mode"
                      checked={strictOnly}
                      onCheckedChange={(checked) => setStrictOnly(!!checked)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {(Object.keys(FIRE_CLASS_INFO) as FireClass[])
                    .filter(fc => objType === "INDUSTRIAL" || ["A", "E"].includes(fc)) // Для общественных обычно A и E
                    .map((fc) => (
                      <div
                        key={fc}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${fireClasses.includes(fc)
                          ? "bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 shadow-sm"
                          : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-blue-200"
                          }`}
                        onClick={() => {
                          if (fireClasses.includes(fc)) {
                            if (fireClasses.length > 1) {
                              setFireClasses(fireClasses.filter(c => c !== fc));
                            }
                          } else {
                            setFireClasses([...fireClasses, fc]);
                          }
                        }}
                      >
                        <Checkbox
                          checked={fireClasses.includes(fc)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFireClasses([...fireClasses, fc]);
                            } else if (fireClasses.length > 1) {
                              setFireClasses(fireClasses.filter(c => c !== fc));
                            }
                          }}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-base text-black dark:text-white">{fc}</span>
                            <span className="text-sm text-black dark:text-white font-bold">— {FIRE_CLASS_INFO[fc].description}</span>
                          </div>
                          <div className="text-xs text-black/80 dark:text-white/80 mt-1 font-semibold italic">
                            {FIRE_CLASS_INFO[fc].examples}
                          </div>
                        </div>
                      </div>
                    ))}
                  {objType === "PUBLIC" && (
                    <p className="text-xs text-black dark:text-white font-bold text-center italic mt-2">
                      Для общественных зданий обычно рассматриваются классы A и E (п. 1.2 Прил. 1)
                    </p>
                  )}
                </div>
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
                  className="space-y-6 pt-6"
                >
                  {/* Основные огнетушители */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-red-50 dark:bg-red-950/40 rounded-2xl text-center border-2 border-red-100 dark:border-red-900/50 shadow-sm">
                      <div className="text-4xl font-black text-red-600 dark:text-red-400 mb-1">{result.powderCount}</div>
                      <div className="text-xs text-red-800 dark:text-red-200 font-black uppercase tracking-tight">Порошковые (ОП)</div>
                    </div>
                    <div className="p-5 bg-blue-50 dark:bg-blue-950/40 rounded-2xl text-center border-2 border-blue-100 dark:border-blue-900/50 shadow-sm">
                      <div className="text-4xl font-black text-blue-600 dark:text-blue-400 mb-1">{result.co2Count}</div>
                      <div className="text-xs text-blue-800 dark:text-blue-200 font-black uppercase tracking-tight">Углекисл. (ОУ)</div>
                    </div>
                    <div className="p-5 bg-green-50 dark:bg-green-950/40 rounded-2xl text-center border-2 border-green-100 dark:border-green-900/50 shadow-sm">
                      <div className="text-4xl font-black text-green-600 dark:text-green-400 mb-1">{result.foamCount}</div>
                      <div className="text-xs text-green-800 dark:text-green-200 font-black uppercase tracking-tight">Пенные (ОВП)</div>
                    </div>
                    <div className="p-5 bg-orange-50 dark:bg-orange-950/40 rounded-2xl text-center border-2 border-orange-100 dark:border-orange-900/50 shadow-sm">
                      <div className="text-4xl font-black text-orange-600 dark:text-orange-400 mb-1">{result.mobileCount}</div>
                      <div className="text-xs text-orange-800 dark:text-orange-200 font-black uppercase tracking-tight">Передвижные</div>
                    </div>
                  </div>

                  {/* Итого и дистанция */}
                  <div className="flex justify-between items-center p-4 bg-primary rounded-2xl shadow-lg">
                    <div>
                      <span className="text-xs font-black text-primary-foreground/70 uppercase tracking-widest mr-2">ИТОГО:</span>
                      <span className="text-2xl font-black text-primary-foreground">{result.totalCount} шт.</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-primary-foreground/70 uppercase tracking-widest mr-2">МАКС. ДИСТАНЦИЯ:</span>
                      <span className="text-xl font-black text-primary-foreground">{result.maxDistance} м</span>
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
                  <div className="space-y-4 pt-6 border-t-2 border-slate-100 dark:border-slate-800">
                    <h4 className="font-black text-xs flex items-center text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      <Info className="w-4 h-4 mr-2 text-blue-500" /> ОБОСНОВАНИЕ РАСЧЕТА
                    </h4>
                    <div className="space-y-3">
                      {result.reasons.map((r, i) => (
                        <div key={i} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div className="flex items-start">
                            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mr-3 mt-0.5 shrink-0" />
                            <div className="text-sm leading-relaxed">
                              <span className="font-black text-black dark:text-white uppercase text-xs bg-slate-300 dark:bg-slate-700 px-2 py-1 rounded mr-2 border border-slate-400">
                                {r.label}
                              </span>
                              <span className="text-black dark:text-white font-bold text-base">{r.text}</span>
                              {r.ref && (
                                <div className="mt-1 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                                  Источник: {r.ref}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Предупреждения */}
                  {result.warnings.length > 0 && (
                    <div className="p-5 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border-2 border-amber-100 dark:border-amber-900/30">
                      <h4 className="text-amber-800 dark:text-amber-400 text-xs font-black mb-3 flex items-center uppercase tracking-widest">
                        <AlertTriangle className="w-4 h-4 mr-2" /> ТРЕБОВАНИЯ И ИНВЕНТАРЬ
                      </h4>
                      <ul className="space-y-2">
                        {result.warnings.map((w, i) => (
                          <li key={i} className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2 shrink-0" />
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Примечания */}
                  {result.notes.length > 0 && (
                    <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <h4 className="text-xs font-black mb-3 flex items-center text-black dark:text-white uppercase tracking-widest">
                        <Info className="w-4 h-4 mr-2 text-blue-600" /> ВАЖНО ИЗ ППБ:
                      </h4>
                      <ul className="space-y-2">
                        {result.notes.map((n, i) => (
                          <li key={i} className="text-sm text-black dark:text-white font-bold leading-relaxed italic">• {n}</li>
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
