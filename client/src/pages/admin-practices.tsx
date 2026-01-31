import React, { useMemo, useState } from "react";

const entries = [
  {
    id: "AP-2024-001",
    caseNumber: "АП-2024-001",
    caseDate: "2024-01-14",
    protocolNumber: "АП-01/24",
    protocolDate: "2024-01-14",
    region: "г. Астана",
    district: "Есиль",
    article: "ст. 410 ч.2",
    stage: "На рассмотрении",
    offenderName: "Иманбеков Ержан",
    offenderBirthDate: "1985-06-22",
    offenderIin: "850622300123",
    orgName: "ТОО \"Нур-Сервис\"",
    orgBin: "120540003221",
    inspectorName: "А. Тлеубаев",
    penaltyType: "Штраф",
    resolutionDate: "2024-01-18",
    fineAmount: 245000,
    finePaidVoluntary: true,
    finePaidReduced: false,
    finePaidForced: false,
    terminationReason: "",
    terminationDate: "",
    appealResult: "",
    appealDecisionDate: "",
    transferTo: "Суд г. Астаны",
    transferType: "По подведомственности",
    enforcementSent: true,
    offenderContact: "+7 701 555 21 12",
  },
  {
    id: "AP-2024-002",
    caseNumber: "АП-2024-002",
    caseDate: "2024-01-22",
    protocolNumber: "АП-05/24",
    protocolDate: "2024-01-20",
    region: "Алматинская область",
    district: "Карасай",
    article: "ст. 409 ч.1",
    stage: "Решено",
    offenderName: "Садыкова Айгерим",
    offenderBirthDate: "1993-11-03",
    offenderIin: "931103450987",
    orgName: "ИП \"Алтын\"",
    orgBin: "990440102933",
    inspectorName: "Н. Ермекова",
    penaltyType: "Штраф",
    resolutionDate: "2024-01-28",
    fineAmount: 120000,
    finePaidVoluntary: false,
    finePaidReduced: true,
    finePaidForced: false,
    terminationReason: "",
    terminationDate: "",
    appealResult: "Оставлено без изменения",
    appealDecisionDate: "2024-02-10",
    transferTo: "",
    transferType: "",
    enforcementSent: false,
    offenderContact: "a.sadykova@mail.kz",
  },
  {
    id: "AP-2024-003",
    caseNumber: "АП-2024-003",
    caseDate: "2024-02-01",
    protocolNumber: "АП-08/24",
    protocolDate: "2024-01-30",
    region: "г. Алматы",
    district: "Алмалы",
    article: "ст. 410 ч.3",
    stage: "В работе",
    offenderName: "Жумабаев Тимур",
    offenderBirthDate: "1979-08-14",
    offenderIin: "790814500456",
    orgName: "АО \"КазТех\"",
    orgBin: "070540005644",
    inspectorName: "Ж. Муратов",
    penaltyType: "Штраф",
    resolutionDate: "2024-02-05",
    fineAmount: 450000,
    finePaidVoluntary: false,
    finePaidReduced: false,
    finePaidForced: false,
    terminationReason: "",
    terminationDate: "",
    appealResult: "",
    appealDecisionDate: "",
    transferTo: "Служба исполнения",
    transferType: "Принудительное взыскание",
    enforcementSent: true,
    offenderContact: "office@kaztech.kz",
  },
  {
    id: "AP-2024-004",
    caseNumber: "АП-2024-004",
    caseDate: "2024-02-11",
    protocolNumber: "АП-12/24",
    protocolDate: "2024-02-09",
    region: "г. Шымкент",
    district: "Енбекши",
    article: "ст. 409 ч.2",
    stage: "На рассмотрении",
    offenderName: "Тулегенов Арман",
    offenderBirthDate: "1988-02-10",
    offenderIin: "880210300765",
    orgName: "ТОО \"ЮгСтрой\"",
    orgBin: "060330004812",
    inspectorName: "С. Садырбек",
    penaltyType: "Предупреждение",
    resolutionDate: "2024-02-15",
    fineAmount: 0,
    finePaidVoluntary: false,
    finePaidReduced: false,
    finePaidForced: false,
    terminationReason: "",
    terminationDate: "",
    appealResult: "",
    appealDecisionDate: "",
    transferTo: "",
    transferType: "",
    enforcementSent: false,
    offenderContact: "+7 7252 33 10 55",
  },
  {
    id: "AP-2024-005",
    caseNumber: "АП-2024-005",
    caseDate: "2024-02-18",
    protocolNumber: "АП-15/24",
    protocolDate: "2024-02-16",
    region: "Карагандинская область",
    district: "Темиртау",
    article: "ст. 410 ч.1",
    stage: "Закрыто",
    offenderName: "Даниярбеков Нурлан",
    offenderBirthDate: "1974-03-05",
    offenderIin: "740305300432",
    orgName: "ГКП \"ТЭЦ-2\"",
    orgBin: "050110020312",
    inspectorName: "Р. Нургалиев",
    penaltyType: "Штраф",
    resolutionDate: "2024-02-20",
    fineAmount: 98000,
    finePaidVoluntary: false,
    finePaidReduced: false,
    finePaidForced: true,
    terminationReason: "Исполнение постановления",
    terminationDate: "2024-03-01",
    appealResult: "",
    appealDecisionDate: "",
    transferTo: "ЧСИ Темиртау",
    transferType: "Исполнительное производство",
    enforcementSent: true,
    offenderContact: "info@tec2.kz",
  },
];

const articles = ["Все", ...Array.from(new Set(entries.map((item) => item.article)))];
const stages = ["Все", ...Array.from(new Set(entries.map((item) => item.stage)))];
const periodOptions = [
  { label: "Все", value: "all" },
  { label: "Текущий месяц", value: "month" },
  { label: "Текущий квартал", value: "quarter" },
  { label: "Текущий год", value: "year" },
];
const paymentStatusOptions = [
  { label: "Добровольная оплата", value: "voluntary" },
  { label: "Сокращенная оплата", value: "reduced" },
  { label: "Принудительная оплата", value: "forced" },
  { label: "Не оплачено", value: "unpaid" },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "KZT",
    maximumFractionDigits: 0,
  }).format(value);

export default function AdminPracticesPage() {
  const [article, setArticle] = useState("Все");
  const [stage, setStage] = useState("Все");
  const [period, setPeriod] = useState("all");
  const [paymentStatuses, setPaymentStatuses] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const periodStart = useMemo(() => {
    const now = new Date();
    if (period === "month") {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    if (period === "quarter") {
      const quarterStart = Math.floor(now.getMonth() / 3) * 3;
      return new Date(now.getFullYear(), quarterStart, 1);
    }
    if (period === "year") {
      return new Date(now.getFullYear(), 0, 1);
    }
    return null;
  }, [period]);

  const filtered = useMemo(() => {
    return entries.filter((item) => {
      if (article !== "Все" && item.article !== article) return false;
      if (stage !== "Все" && item.stage !== stage) return false;

      if (periodStart) {
        const itemDate = new Date(item.caseDate);
        if (itemDate < periodStart) return false;
      }
      if (dateFrom && item.caseDate < dateFrom) return false;
      if (dateTo && item.caseDate > dateTo) return false;

      if (paymentStatuses.length > 0) {
        const isVoluntary = Boolean(item.finePaidVoluntary);
        const isReduced = Boolean(item.finePaidReduced);
        const isForced = Boolean(item.finePaidForced);
        const isUnpaid = !isVoluntary && !isReduced && !isForced;

        const matches = paymentStatuses.some((statusValue) => {
          if (statusValue === "voluntary") return isVoluntary;
          if (statusValue === "reduced") return isReduced;
          if (statusValue === "forced") return isForced;
          if (statusValue === "unpaid") return isUnpaid;
          return false;
        });

        if (!matches) return false;
      }

      return true;
    });
  }, [article, stage, periodStart, paymentStatuses, dateFrom, dateTo]);

  return (
    <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Журнал административной практики
            </h1>
            <p className="text-sm text-muted-foreground">
              Отбирайте протоколы по периоду, статье КоАП, стадии и статусу оплаты.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
            Записей: <span className="font-semibold text-foreground">{filtered.length}</span>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-border bg-card/40 p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-5">
          <div>
            <label className="text-xs text-muted-foreground">Статья КоАП</label>
            <select
              value={article}
              onChange={(event) => setArticle(event.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {articles.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Стадия</label>
            <select
              value={stage}
              onChange={(event) => setStage(event.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {stages.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Период</label>
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Дата с</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Дата по</label>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-background px-3 py-3">
            <p className="text-xs text-muted-foreground">Статусы оплаты</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {paymentStatusOptions.map((option) => {
                const isChecked = paymentStatuses.includes(option.value);
                return (
                  <label key={option.value} className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(event) => {
                        setPaymentStatuses((current) => {
                          if (event.target.checked) {
                            return [...current, option.value];
                          }
                          return current.filter((value) => value !== option.value);
                        });
                      }}
                      className="h-4 w-4 rounded border-border"
                    />
                    {option.label}
                  </label>
                );
              })}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-background px-3 py-3 text-xs text-muted-foreground">
            <p>Подсказка:</p>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              <li>Период ограничивает выборку по дате дела.</li>
              <li>Фильтры оплаты можно комбинировать для сравнения стадий взыскания.</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="rounded-full bg-muted px-3 py-1">
            Используйте горизонтальную прокрутку для просмотра всех столбцов.
          </span>
        </div>
      </section>

      <section className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-[2600px] w-full text-sm">
          <thead className="bg-muted/60 text-left text-muted-foreground">
            <tr>
              <th className="px-3 py-2" colSpan={7}>Дело</th>
              <th className="px-3 py-2" colSpan={2}>Протокол</th>
              <th className="px-3 py-2" colSpan={3}>Нарушитель</th>
              <th className="px-3 py-2" colSpan={2}>Организация</th>
              <th className="px-3 py-2" colSpan={1}>Инспектор</th>
              <th className="px-3 py-2" colSpan={2}>Решение</th>
              <th className="px-3 py-2" colSpan={4}>Оплата</th>
              <th className="px-3 py-2" colSpan={2}>Прекращение</th>
              <th className="px-3 py-2" colSpan={2}>Обжалование</th>
              <th className="px-3 py-2" colSpan={3}>Передача</th>
              <th className="px-3 py-2" colSpan={1}>Контакт</th>
            </tr>
            <tr className="border-t border-border/70">
              <th className="px-3 py-3">№</th>
              <th className="px-3 py-3">Номер дела</th>
              <th className="px-3 py-3">Регион</th>
              <th className="px-3 py-3">Район</th>
              <th className="px-3 py-3">Дата дела</th>
              <th className="px-3 py-3">Статья</th>
              <th className="px-3 py-3">Стадия</th>
              <th className="px-3 py-3">№ протокола</th>
              <th className="px-3 py-3">Дата протокола</th>
              <th className="px-3 py-3">ФИО</th>
              <th className="px-3 py-3">Дата рождения</th>
              <th className="px-3 py-3">ИИН</th>
              <th className="px-3 py-3">Организация</th>
              <th className="px-3 py-3">БИН</th>
              <th className="px-3 py-3">Инспектор</th>
              <th className="px-3 py-3">Вид взыскания</th>
              <th className="px-3 py-3">Дата постановления</th>
              <th className="px-3 py-3">Сумма штрафа</th>
              <th className="px-3 py-3">Добровольно</th>
              <th className="px-3 py-3">Сокращенно</th>
              <th className="px-3 py-3">Принудительно</th>
              <th className="px-3 py-3">Причина</th>
              <th className="px-3 py-3">Дата</th>
              <th className="px-3 py-3">Результат</th>
              <th className="px-3 py-3">Дата решения</th>
              <th className="px-3 py-3">Передано в</th>
              <th className="px-3 py-3">Тип передачи</th>
              <th className="px-3 py-3">Исполнение</th>
              <th className="px-3 py-3">Контакт</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={29} className="px-4 py-10 text-center text-muted-foreground">
                  По выбранным фильтрам записи не найдены.
                </td>
              </tr>
            ) : (
              filtered.map((item, index) => (
                <tr
                  key={item.id}
                  className="border-t border-border/60 hover:bg-muted/30"
                >
                  <td className="px-3 py-2 text-muted-foreground">{index + 1}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{item.caseNumber}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{item.region}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{item.district}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{item.caseDate}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{item.article}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{item.stage}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{item.protocolNumber}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{item.protocolDate}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{item.offenderName}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{item.offenderBirthDate}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{item.offenderIin}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{item.orgName}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{item.orgBin}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{item.inspectorName}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{item.penaltyType}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{item.resolutionDate || "—"}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {formatCurrency(item.fineAmount)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {item.finePaidVoluntary ? "Да" : "—"}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {item.finePaidReduced ? "Да" : "—"}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {item.finePaidForced ? "Да" : "—"}
                  </td>
                  <td className="px-3 py-2 max-w-[180px] text-muted-foreground">
                    {item.terminationReason || "—"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{item.terminationDate || "—"}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{item.appealResult || "—"}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {item.appealDecisionDate || "—"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{item.transferTo || "—"}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{item.transferType || "—"}</td>
                  <td className="px-3 py-2 text-center">
                    {item.enforcementSent ? "Да" : "Нет"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{item.offenderContact}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
