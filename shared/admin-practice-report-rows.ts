/**
 * Структура строк отчета административной практики
 * Форма II - Административная практика
 */

export interface AdminPracticeReportRow {
    id: string;
    number: string;
    label: string;
    isSection?: boolean;
    isSubRow?: boolean;
    isSumRow?: boolean;
}

export const ADMIN_PRACTICE_REPORT_ROWS: AdminPracticeReportRow[] = [
    // Раздел II. АДМИНИСТРАТИВНАЯ ПРАКТИКА
    { id: 'section-2', number: '', label: 'II. АДМИНИСТРАТИВНАЯ ПРАКТИКА', isSection: true },

    { id: 'row-4', number: '4', label: 'Общее количество административных взысканий (по проверкам, пожарам, загораниям, отравлениям угарным газом, пища на плите и т.д.)' },
    { id: 'row-5', number: '5', label: 'Количество предупреждений' },
    { id: 'row-6', number: '6', label: 'Количество штрафов' },
    { id: 'row-7', number: '7', label: 'Сумма наложенных штрафов', isSumRow: true },
    { id: 'row-8', number: '8', label: 'в том числе, штрафы на юридических лиц', isSubRow: true },
    { id: 'row-9', number: '9', label: 'сумма штрафов', isSubRow: true, isSumRow: true },
    { id: 'row-10', number: '10', label: 'штрафы на должностных лиц', isSubRow: true },
    { id: 'row-11', number: '11', label: 'сумма штрафов', isSubRow: true, isSumRow: true },
    { id: 'row-12', number: '12', label: 'штрафы на физических лиц', isSubRow: true },
    { id: 'row-13', number: '13', label: 'сумма штрафов', isSubRow: true, isSumRow: true },
    { id: 'row-14', number: '14', label: 'добровольно оплаченные штрафы' },
    { id: 'row-15', number: '15', label: 'сумма оплаченных штрафов', isSumRow: true },
    { id: 'row-16', number: '16', label: 'Направлено штрафов для принудительного взыскания' },
    { id: 'row-17', number: '17', label: 'количество штрафов', isSubRow: true },
    { id: 'row-18', number: '18', label: 'сумма штрафов', isSubRow: true, isSumRow: true },
    { id: 'row-19', number: '19', label: 'Взыскано в принудительном порядке' },
    { id: 'row-20', number: '20', label: 'количество штрафов', isSubRow: true },
    { id: 'row-21', number: '21', label: 'сумма штрафов', isSubRow: true, isSumRow: true },
    { id: 'row-22', number: '22', label: 'Отсутствует информация по направленным для принудительного взыскания штрафов' },
    { id: 'row-23', number: '23', label: 'количество штрафов', isSubRow: true },
    { id: 'row-24', number: '24', label: 'сумма штрафов', isSubRow: true, isSumRow: true },

    // Раздел II.I. АДМИНИСТРАТИВНАЯ ПРАКТИКА - пожары
    { id: 'section-2-1', number: '', label: 'II.I. АДМИНИСТРАТИВНАЯ ПРАКТИКА - пожары (загорания и т.д.)', isSection: true },

    { id: 'row-26', number: '26', label: 'Наложено административных взысканий в отношении виновных лиц, допустивших пожары (в том числе по загораниям, пище на плите, отравления угарным газом и т.д.)' },
    { id: 'row-27', number: '27', label: 'Количество предупреждений' },
    { id: 'row-28', number: '28', label: 'Количество штрафов' },
    { id: 'row-29', number: '29', label: 'Сумма наложенных штрафов', isSumRow: true },
    { id: 'row-30', number: '30', label: 'в том числе, штрафы на юридических лиц', isSubRow: true },
    { id: 'row-31', number: '31', label: 'сумма штрафов', isSubRow: true, isSumRow: true },
    { id: 'row-32', number: '32', label: 'штрафы на должностных лиц', isSubRow: true },
    { id: 'row-33', number: '33', label: 'сумма штрафов', isSubRow: true, isSumRow: true },
    { id: 'row-34', number: '34', label: 'штрафы на физических лиц', isSubRow: true },
    { id: 'row-35', number: '35', label: 'сумма штрафов', isSubRow: true, isSumRow: true },

    // Раздел II.II. АДМИНИСТРАТИВНАЯ ПРАКТИКА - протоколы в суд
    { id: 'section-2-2', number: '', label: 'II.II. АДМИНИСТРАТИВНАЯ ПРАКТИКА - сведения о направленных протоколов в судебные органы', isSection: true },

    { id: 'row-37', number: '37', label: 'Количество административных протоколов, составленных по части 3 статьи 462 КоАП РК' },
    { id: 'row-38', number: '38', label: 'наложено судебными органами штрафов', isSubRow: true },
    { id: 'row-39', number: '39', label: 'сумма штрафов', isSubRow: true, isSumRow: true },
    { id: 'row-40', number: '40', label: 'наряду со штрафом вынесено решение о приостановлении эксплуатации объекта', isSubRow: true },
    { id: 'row-41', number: '41', label: 'оставлено без рассмотрения суда (причины указать в примечании)', isSubRow: true },
    { id: 'row-42', number: '42', label: 'на рассмотрении в суде', isSubRow: true },
    { id: 'row-43', number: '43', label: 'Вынесено постановлений судом об отмене дел об административном правонарушении' },
    { id: 'row-44', number: '44', label: 'Вынесено протестов органами прокуратуры по делу об административном правонарушении' },

    // Раздел III. Общие сведения
    { id: 'section-3', number: '', label: 'III. Общие сведения', isSection: true },

    { id: 'row-46', number: '46', label: 'Отказано в регистрации актов о назначении проверок и профилактического контроля в органах КПСиСУ (в примечание указать причины)' },
    { id: 'row-47', number: '47', label: 'Количество государственных инспекторов, привлеченных к дисциплинарной ответственности' },
];

// Типы столбцов для данных
export type AdminPracticeColumnKey =
    | 'total'
    | 'government'
    | 'ngoIndividual'
    | 'businessSmall'
    | 'businessMedium'
    | 'businessLarge';

// Заголовки столбцов
export const ADMIN_PRACTICE_COLUMNS = [
    { key: 'total' as const, label: 'Всего', colSpan: 1, rowSpan: 2 },
    { key: 'government' as const, label: 'гос.организации', colSpan: 1, rowSpan: 2 },
    { key: 'ngoIndividual' as const, label: 'некоммерческие организации, физ.лица', colSpan: 1, rowSpan: 2 },
    { key: 'businessSmall' as const, label: 'малое', colSpan: 1, rowSpan: 1, group: 'business' },
    { key: 'businessMedium' as const, label: 'среднее', colSpan: 1, rowSpan: 1, group: 'business' },
    { key: 'businessLarge' as const, label: 'крупное', colSpan: 1, rowSpan: 1, group: 'business' },
];
