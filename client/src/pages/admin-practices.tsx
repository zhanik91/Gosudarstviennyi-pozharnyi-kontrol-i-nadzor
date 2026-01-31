import React, { useMemo, useState } from "react";

const entries = [
  {
    id: "AP-2024-001",
    date: "2024-01-14",
    protocolNumber: "АП-01/24",
    region: "г. Астана",
    district: "Есиль",
    subject: "ТОО " + "\"" + "Нур-Сервис" + "\"",
    bin: "120540003221",
    object: "Бизнес-центр " + "\"" + "Сарыарка" + "\"",
    article: "ст. 410 ч.2",
    violation: "Неисправная сигнализация и отсутствие журнала проверок",
    inspector: "А. Тлеубаев",
    fine: 245000,
    status: "В работе",
    dueDate: "2024-02-14",
    note: "Назначена повторная проверка",
  },
  {
    id: "AP-2024-002",
    date: "2024-01-22",
    protocolNumber: "АП-05/24",
    region: "Алматинская область",
    district: "Карасай",
    subject: "ИП " + "\"" + "Алтын" + "\"",
    bin: "990440102933",
    object: "Складской комплекс",
    article: "ст. 409 ч.1",
    violation: "Не проведена эвакуационная тренировка",
    inspector: "Н. Ермекова",
    fine: 120000,
    status: "Оплачено",
    dueDate: "2024-02-05",
    note: "Оплата подтверждена 03.02.2024",
  },
  {
    id: "AP-2024-003",
    date: "2024-02-01",
    protocolNumber: "АП-08/24",
    region: "г. Алматы",
    district: "Алмалы",
    subject: "АО " + "\"" + "КазТех" + "\"",
    bin: "070540005644",
    object: "ЦОД " + "\"" + "Медеу" + "\"",
    article: "ст. 410 ч.3",
    violation: "Отсутствует система дымоудаления на 3 этаже",
    inspector: "Ж. Муратов",
    fine: 450000,
    status: "Просрочено",
    dueDate: "2024-02-20",
    note: "Назначено административное взыскание",
  },
  {
    id: "AP-2024-004",
    date: "2024-02-11",
    protocolNumber: "АП-12/24",
    region: "г. Шымкент",
    district: "Енбекши",
    subject: "ТОО " + "\"" + "ЮгСтрой" + "\"",
    bin: "060330004812",
    object: "ЖК " + "\"" + "Самал" + "\"",
    article: "ст. 409 ч.2",
    violation: "Частично перекрыты эвакуационные выходы",
    inspector: "С. Садырбек",
    fine: 180000,
    status: "В работе",
    dueDate: "2024-03-05",
    note: "Выдано предписание",
  },
  {
    id: "AP-2024-005",
    date: "2024-02-18",
    protocolNumber: "АП-15/24",
    region: "Карагандинская область",
    district: "Темиртау",
    subject: "ГКП " + "\"" + "ТЭЦ-2" + "\"",
    bin: "050110020312",
    object: "Производственный блок",
    article: "ст. 410 ч.1",
    violation: "Не обновлены планы эвакуации",
    inspector: "Р. Нургалиев",
    fine: 98000,
    status: "Оплачено",
    dueDate: "2024-03-01",
    note: "Оплата 27.02.2024",
  },
];

const articles = ["Все", ...Array.from(new Set(entries.map((item) => item.article)))];
const statuses = ["Все", "В работе", "Оплачено", "Просрочено"];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "KZT",
    maximumFractionDigits: 0,
  }).format(value);

export default function AdminPracticesPage() {
  const [article, setArticle] = useState("Все");
  const [status, setStatus] = useState("Все");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    return entries.filter((item) => {
      if (article !== "Все" && item.article !== article) return false;
      if (status !== "Все" && item.status !== status) return false;
      if (dateFrom && item.date < dateFrom) return false;
      if (dateTo && item.date > dateTo) return false;
      return true;
    });
  }, [article, status, dateFrom, dateTo]);

  return (
    <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Журнал административной практики
            </h1>
            <p className="text-sm text-muted-foreground">
              Отбирайте протоколы по периоду, статье КоАП и статусу исполнения.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
            Записей: <span className="font-semibold text-foreground">{filtered.length}</span>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-border bg-card/40 p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-4">
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
            <label className="text-xs text-muted-foreground">Статус</label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item}
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

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="rounded-full bg-muted px-3 py-1">
            Используйте горизонтальную прокрутку для просмотра всех столбцов.
          </span>
        </div>
      </section>

      <section className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-[1400px] w-full text-sm">
          <thead className="bg-muted/60 text-left text-muted-foreground">
            <tr>
              <th className="px-3 py-3">№</th>
              <th className="px-3 py-3">Дата</th>
              <th className="px-3 py-3">Протокол</th>
              <th className="px-3 py-3">Регион</th>
              <th className="px-3 py-3">Район</th>
              <th className="px-3 py-3">Субъект</th>
              <th className="px-3 py-3">БИН</th>
              <th className="px-3 py-3">Объект</th>
              <th className="px-3 py-3">Статья</th>
              <th className="px-3 py-3">Нарушение</th>
              <th className="px-3 py-3">Инспектор</th>
              <th className="px-3 py-3">Сумма штрафа</th>
              <th className="px-3 py-3">Статус</th>
              <th className="px-3 py-3">Срок оплаты</th>
              <th className="px-3 py-3">Примечание</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={15} className="px-4 py-10 text-center text-muted-foreground">
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
                  <td className="px-3 py-2 whitespace-nowrap">{item.date}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{item.protocolNumber}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{item.region}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{item.district}</td>
                  <td className="px-3 py-2">{item.subject}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{item.bin}</td>
                  <td className="px-3 py-2">{item.object}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{item.article}</td>
                  <td className="px-3 py-2 max-w-[260px]">
                    <span className="line-clamp-2">{item.violation}</span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{item.inspector}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatCurrency(item.fine)}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        item.status === "Оплачено"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : item.status === "Просрочено"
                          ? "bg-rose-500/15 text-rose-400"
                          : "bg-amber-500/15 text-amber-400"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{item.dueDate}</td>
                  <td className="px-3 py-2 text-muted-foreground">{item.note}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
