import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface AdminCaseReportRow {
  period: string;
  article: string | null;
  totalCount: number | string;
  totalFines: number | string;
  paidVoluntaryCount: number | string;
  paidForcedCount: number | string;
  paidVoluntaryShare: number | string;
  paidForcedShare: number | string;
  warningsCount: number | string;
  terminationsCount: number | string;
  appealsCount: number | string;
  openedCount: number | string;
  inReviewCount: number | string;
  resolvedCount: number | string;
  closedCount: number | string;
  canceledCount: number | string;
}

const periodOptions = [
  { value: "quarter", label: "Квартал" },
  { value: "year", label: "Год" },
] as const;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "KZT",
    maximumFractionDigits: 0,
  }).format(value);

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

const formatPeriodLabel = (raw: string, periodType: string) => {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "—";
  if (periodType === "year") {
    return `${date.getFullYear()}`;
  }
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `${date.getFullYear()} Q${quarter}`;
};

export default function AdminCasesReports() {
  const [period, setPeriod] = useState("quarter");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [article, setArticle] = useState("Все");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("period", period);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    return params.toString();
  }, [period, dateFrom, dateTo]);

  const { data: rows = [], isLoading } = useQuery<AdminCaseReportRow[]>({
    queryKey: ["/api/reports/admin-cases", queryString],
    queryFn: async () => {
      const response = await fetch(`/api/reports/admin-cases?${queryString}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Ошибка загрузки отчёта");
      return response.json();
    },
  });

  const normalizedRows = useMemo(() => {
    return rows.map((row) => ({
      ...row,
      articleLabel: row.article || "Без статьи",
      totalCount: Number(row.totalCount || 0),
      totalFines: Number(row.totalFines || 0),
      paidVoluntaryCount: Number(row.paidVoluntaryCount || 0),
      paidForcedCount: Number(row.paidForcedCount || 0),
      paidVoluntaryShare: Number(row.paidVoluntaryShare || 0),
      paidForcedShare: Number(row.paidForcedShare || 0),
      warningsCount: Number(row.warningsCount || 0),
      terminationsCount: Number(row.terminationsCount || 0),
      appealsCount: Number(row.appealsCount || 0),
      openedCount: Number(row.openedCount || 0),
      inReviewCount: Number(row.inReviewCount || 0),
      resolvedCount: Number(row.resolvedCount || 0),
      closedCount: Number(row.closedCount || 0),
      canceledCount: Number(row.canceledCount || 0),
    }));
  }, [rows]);

  const articles = useMemo(() => {
    const values = new Set<string>();
    normalizedRows.forEach((row) => values.add(row.articleLabel));
    return ["Все", ...Array.from(values)];
  }, [normalizedRows]);

  const filteredRows = useMemo(() => {
    if (article === "Все") return normalizedRows;
    return normalizedRows.filter((row) => row.articleLabel === article);
  }, [article, normalizedRows]);

  const totals = useMemo(() => {
    return filteredRows.reduce(
      (acc, row) => {
        acc.totalCount += row.totalCount;
        acc.totalFines += row.totalFines;
        acc.paidVoluntaryCount += row.paidVoluntaryCount;
        acc.paidForcedCount += row.paidForcedCount;
        acc.warningsCount += row.warningsCount;
        acc.terminationsCount += row.terminationsCount;
        acc.appealsCount += row.appealsCount;
        acc.openedCount += row.openedCount;
        acc.inReviewCount += row.inReviewCount;
        acc.resolvedCount += row.resolvedCount;
        acc.closedCount += row.closedCount;
        acc.canceledCount += row.canceledCount;
        return acc;
      },
      {
        totalCount: 0,
        totalFines: 0,
        paidVoluntaryCount: 0,
        paidForcedCount: 0,
        warningsCount: 0,
        terminationsCount: 0,
        appealsCount: 0,
        openedCount: 0,
        inReviewCount: 0,
        resolvedCount: 0,
        closedCount: 0,
        canceledCount: 0,
      }
    );
  }, [filteredRows]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">Отчёт по административным делам</h3>
        <p className="text-sm text-muted-foreground">
          Сводные показатели по статье КоАП, периодам и результатам оплаты.
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-card/40 p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-4">
          <div>
            <label className="text-xs text-muted-foreground">Период группировки</label>
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
      </section>

      <section className="grid gap-4 md:grid-cols-4 xl:grid-cols-6">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Дел всего</p>
          <p className="text-2xl font-semibold text-foreground">{totals.totalCount}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Сумма штрафов</p>
          <p className="text-2xl font-semibold text-foreground">{formatCurrency(totals.totalFines)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Оплачено добровольно</p>
          <p className="text-2xl font-semibold text-foreground">{totals.paidVoluntaryCount}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Оплачено принудительно</p>
          <p className="text-2xl font-semibold text-foreground">{totals.paidForcedCount}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Открытые</p>
          <p className="text-2xl font-semibold text-foreground">{totals.openedCount}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Рассмотрение</p>
          <p className="text-2xl font-semibold text-foreground">{totals.inReviewCount}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Закрытые</p>
          <p className="text-2xl font-semibold text-foreground">{totals.closedCount}</p>
        </div>
      </section>

      <section className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-[1400px] w-full text-sm">
          <thead className="bg-muted/60 text-left text-muted-foreground">
            <tr>
              <th className="px-3 py-3">Период</th>
              <th className="px-3 py-3">Статья КоАП</th>
              <th className="px-3 py-3">Дел</th>
              <th className="px-3 py-3">Сумма штрафов</th>
              <th className="px-3 py-3">Доля оплаты (добров.)</th>
              <th className="px-3 py-3">Доля оплаты (принуд.)</th>
              <th className="px-3 py-3">Предупреждения</th>
              <th className="px-3 py-3">Прекращения</th>
              <th className="px-3 py-3">Обжалования</th>
              <th className="px-3 py-3">Открыты</th>
              <th className="px-3 py-3">На рассмотрении</th>
              <th className="px-3 py-3">Решены</th>
              <th className="px-3 py-3">Закрыты</th>
              <th className="px-3 py-3">Отменены</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={14} className="px-4 py-10 text-center text-muted-foreground">
                  Загрузка отчёта...
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={14} className="px-4 py-10 text-center text-muted-foreground">
                  По выбранным фильтрам записи не найдены.
                </td>
              </tr>
            ) : (
              filteredRows.map((row, index) => (
                <tr key={`${row.period}-${row.articleLabel}-${index}`} className="border-t border-border/60">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {formatPeriodLabel(row.period, period)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{row.articleLabel}</td>
                  <td className="px-3 py-2">{row.totalCount}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatCurrency(row.totalFines)}</td>
                  <td className="px-3 py-2">{formatPercent(row.paidVoluntaryShare)}</td>
                  <td className="px-3 py-2">{formatPercent(row.paidForcedShare)}</td>
                  <td className="px-3 py-2">{row.warningsCount}</td>
                  <td className="px-3 py-2">{row.terminationsCount}</td>
                  <td className="px-3 py-2">{row.appealsCount}</td>
                  <td className="px-3 py-2">{row.openedCount}</td>
                  <td className="px-3 py-2">{row.inReviewCount}</td>
                  <td className="px-3 py-2">{row.resolvedCount}</td>
                  <td className="px-3 py-2">{row.closedCount}</td>
                  <td className="px-3 py-2">{row.canceledCount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
