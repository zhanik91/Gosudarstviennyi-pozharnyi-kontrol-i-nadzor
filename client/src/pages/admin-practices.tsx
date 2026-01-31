import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

type AdminCase = {
  id: string;
  inspectionId?: string | null;
  number: string;
  caseDate: string;
  type: "protocol" | "resolution" | "appeal" | "other";
  status: "opened" | "in_review" | "resolved" | "closed" | "canceled";
  region?: string | null;
  district?: string | null;
  bin?: string | null;
  iin?: string | null;
  article?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

const periodOptions = [
  { value: "all", label: "Все" },
  { value: "day", label: "Сегодня" },
  { value: "week", label: "Неделя" },
  { value: "month", label: "Месяц" },
  { value: "quarter", label: "Квартал" },
  { value: "year", label: "Год" },
];

const statusOptions = [
  { value: "all", label: "Все" },
  { value: "opened", label: "Открыто" },
  { value: "in_review", label: "На рассмотрении" },
  { value: "resolved", label: "Рассмотрено" },
  { value: "closed", label: "Закрыто" },
  { value: "canceled", label: "Отменено" },
];

const statusStyles: Record<AdminCase["status"], string> = {
  opened: "bg-amber-500/15 text-amber-400",
  in_review: "bg-sky-500/15 text-sky-400",
  resolved: "bg-emerald-500/15 text-emerald-400",
  closed: "bg-slate-500/15 text-slate-300",
  canceled: "bg-rose-500/15 text-rose-400",
};

const statusLabels: Record<AdminCase["status"], string> = {
  opened: "Открыто",
  in_review: "На рассмотрении",
  resolved: "Рассмотрено",
  closed: "Закрыто",
  canceled: "Отменено",
};

const typeLabels: Record<AdminCase["type"], string> = {
  protocol: "Протокол",
  resolution: "Постановление",
  appeal: "Обжалование",
  other: "Другое",
};

const toDateInput = (value: Date) => value.toISOString().slice(0, 10);

const getPeriodRange = (period: string) => {
  if (period === "all") {
    return { dateFrom: "", dateTo: "" };
  }

  const now = new Date();
  const dateTo = toDateInput(now);
  const dateFrom = new Date(now);

  switch (period) {
    case "day":
      break;
    case "week":
      dateFrom.setDate(now.getDate() - 7);
      break;
    case "month":
      dateFrom.setMonth(now.getMonth() - 1);
      break;
    case "quarter":
      dateFrom.setMonth(now.getMonth() - 3);
      break;
    case "year":
      dateFrom.setFullYear(now.getFullYear() - 1);
      break;
    default:
      return { dateFrom: "", dateTo: "" };
  }

  return { dateFrom: toDateInput(dateFrom), dateTo };
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ru-RU");
};

const normalizeValue = (value?: string | null) => value?.trim() || "—";

export default function AdminPracticesPage() {
  const [period, setPeriod] = useState("all");
  const [article, setArticle] = useState("all");
  const [status, setStatus] = useState("all");
  const [region, setRegion] = useState("all");
  const [district, setDistrict] = useState("all");
  const [search, setSearch] = useState("");

  const { data: adminCases = [], isLoading, error } = useQuery<AdminCase[]>({
    queryKey: [
      "/api/admin-cases",
      { period, article, status, region, district, search },
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (period !== "all") params.set("period", period);
      if (article !== "all") params.set("article", article);
      if (status !== "all") params.set("status", status);
      if (region !== "all") params.set("region", region);
      if (district !== "all") params.set("district", district);
      if (search.trim()) params.set("search", search.trim());

      const { dateFrom, dateTo } = getPeriodRange(period);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const response = await fetch(`/api/admin-cases?${params.toString()}`);
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Ошибка загрузки административных дел");
      }
      return response.json();
    },
  });

  const articleOptions = useMemo(() => {
    const values = new Set<string>();
    adminCases.forEach((item) => {
      if (item.article) values.add(item.article);
    });
    return ["all", ...Array.from(values).sort()];
  }, [adminCases]);

  const regionOptions = useMemo(() => {
    const values = new Set<string>();
    adminCases.forEach((item) => {
      if (item.region) values.add(item.region);
    });
    return ["all", ...Array.from(values).sort()];
  }, [adminCases]);

  const districtOptions = useMemo(() => {
    const values = new Set<string>();
    adminCases.forEach((item) => {
      if (item.district) values.add(item.district);
    });
    return ["all", ...Array.from(values).sort()];
  }, [adminCases]);

  return (
    <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Журнал административной практики
            </h1>
            <p className="text-sm text-muted-foreground">
              Отбирайте дела по периоду, статье КоАП, статусу и территории.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
            Записей: <span className="font-semibold text-foreground">{adminCases.length}</span>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-border bg-card/40 p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-6">
          <div>
            <label className="text-xs text-muted-foreground">Период</label>
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {periodOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Статья КоАП</label>
            <select
              value={article}
              onChange={(event) => setArticle(event.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {articleOptions.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? "Все" : item}
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
              {statusOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Регион</label>
            <select
              value={region}
              onChange={(event) => setRegion(event.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {regionOptions.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? "Все" : item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Район</label>
            <select
              value={district}
              onChange={(event) => setDistrict(event.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {districtOptions.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? "Все" : item}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="text-xs text-muted-foreground">Поиск</label>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Номер дела, БИН/ИИН, статья..."
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
        <table className="min-w-[1200px] w-full text-sm">
          <thead className="bg-muted/60 text-left text-muted-foreground">
            <tr>
              <th className="px-3 py-3">№</th>
              <th className="px-3 py-3">Номер дела</th>
              <th className="px-3 py-3">Дата дела</th>
              <th className="px-3 py-3">Тип</th>
              <th className="px-3 py-3">Статья</th>
              <th className="px-3 py-3">Статус</th>
              <th className="px-3 py-3">Регион</th>
              <th className="px-3 py-3">Район</th>
              <th className="px-3 py-3">БИН</th>
              <th className="px-3 py-3">ИИН</th>
              <th className="px-3 py-3">Проверка</th>
              <th className="px-3 py-3">Создано</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={12} className="px-4 py-10 text-center text-muted-foreground">
                  Загрузка данных...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={12} className="px-4 py-10 text-center text-rose-400">
                  Не удалось загрузить административные дела. Попробуйте обновить страницу.
                </td>
              </tr>
            ) : adminCases.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-4 py-10 text-center text-muted-foreground">
                  По выбранным фильтрам записи не найдены.
                </td>
              </tr>
            ) : (
              adminCases.map((item, index) => (
                <tr
                  key={item.id}
                  className="border-t border-border/60 hover:bg-muted/30"
                >
                  <td className="px-3 py-2 text-muted-foreground">{index + 1}</td>
                  <td className="px-3 py-2 whitespace-nowrap font-medium">
                    {normalizeValue(item.number)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatDate(item.caseDate)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {typeLabels[item.type]}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {normalizeValue(item.article)}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyles[item.status]}`}
                    >
                      {statusLabels[item.status]}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{normalizeValue(item.region)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{normalizeValue(item.district)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{normalizeValue(item.bin)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{normalizeValue(item.iin)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{normalizeValue(item.inspectionId)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatDate(item.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
