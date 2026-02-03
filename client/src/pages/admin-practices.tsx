import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { REGION_NAMES, ADMIN2_BY_REGION } from "@/data/kazakhstan-data";
import { Button } from "@/components/ui/button";
import { Plus, Pencil } from "lucide-react";
import AdminCaseForm from "@/components/admin-practices/admin-case-form";

type AdminCase = {
  id: string;
  number: string;
  caseDate: string;
  protocolNumber: string;
  protocolDate: string;
  region: string;
  district: string;
  article: string;
  status: string;
  paymentType: string;
  outcome: string;
  offenderName: string;
  offenderBirthDate: string;
  offenderIin: string;
  orgName: string;
  orgBin: string;
  inspectorName: string;
  penaltyType: string;
  resolutionDate: string;
  fineAmount: number;
  finePaidVoluntary: boolean;
  finePaidReduced: boolean;
  finePaidForced: boolean;
  terminationReason: string;
  terminationDate: string;
  appealResult: string;
  appealDecisionDate: string;
  transferTo: string;
  transferType: string;
  enforcementSent: boolean;
  offenderContact: string;
};

type AdminCasesResponse = {
  items: AdminCase[];
  total: number;
};

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
  const { user } = useAuth();

  const userRole = (user as any)?.role?.toUpperCase?.() || (user as any)?.role || "";
  const isMchsUser = userRole === "MCHS" || userRole === "ADMIN";
  const isDchsUser = userRole === "DCHS";
  const isDistrictUser = userRole === "OCHS" || userRole === "DISTRICT";
  const userRegion = (user as any)?.region || "";
  const userDistrict = (user as any)?.district || "";

  const [region, setRegion] = useState("");
  const [district, setDistrict] = useState("");
  const [article, setArticle] = useState("Все");
  const [stage, setStage] = useState("Все");
  const [period, setPeriod] = useState("all");
  const [paymentStatuses, setPaymentStatuses] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<AdminCase | null>(null);

  const canWrite = userRole !== "MCHS";
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    if (isMchsUser) return;
    setRegion(userRegion || "");
    if (isDistrictUser) {
      setDistrict(userDistrict || "");
    }
  }, [isMchsUser, isDistrictUser, userRegion, userDistrict]);

  const availableDistricts = useMemo(() => {
    if (!region) return [];
    return ADMIN2_BY_REGION[region] || [];
  }, [region]);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (region) params.append("region", region);
    if (district) params.append("district", district);
    return params.toString();
  }, [region, district]);

  const { data, isLoading, error } = useQuery<AdminCasesResponse>({
    queryKey: ["/api/admin-cases", region, district],
    queryFn: async () => {
      const url = queryParams ? `/api/admin-cases?${queryParams}` : "/api/admin-cases";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch admin cases");
      }
      return response.json();
    },
  });

  const entries = data?.items || [];

  const articles = useMemo(() => {
    return ["Все", ...Array.from(new Set(entries.map((item) => item.article)))];
  }, [entries]);

  const stages = useMemo(() => {
    return ["Все", ...Array.from(new Set(entries.map((item) => item.status)))];
  }, [entries]);

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
      if (stage !== "Все" && item.status !== stage) return false;

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
  }, [entries, article, stage, periodStart, paymentStatuses, dateFrom, dateTo]);

  const isRegionDisabled = !isMchsUser;
  const isDistrictDisabled = !isMchsUser && !isDchsUser;

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
          <div className="flex items-center gap-3">
            {canWrite && (
              <Button
                onClick={() => {
                  setEditingCase(null);
                  setFormOpen(true);
                }}
                data-testid="button-add-case"
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить запись
              </Button>
            )}
            <div className="rounded-xl border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
              Записей: <span className="font-semibold text-foreground">{filtered.length}</span>
            </div>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-border bg-card/40 p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-6">
          <div>
            <label className="text-xs text-muted-foreground">Регион</label>
            <select
              value={region}
              onChange={(event) => {
                setRegion(event.target.value);
                setDistrict("");
              }}
              disabled={isRegionDisabled}
              className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="select-region"
            >
              <option value="">Все регионы</option>
              {REGION_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Район</label>
            <select
              value={district}
              onChange={(event) => setDistrict(event.target.value)}
              disabled={isDistrictDisabled || !region}
              className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="select-district"
            >
              <option value="">Все районы</option>
              {availableDistricts.map((name) => (
                <option key={name} value={name}>
                  {name}
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
              data-testid="select-article"
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
              data-testid="select-stage"
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
              data-testid="select-period"
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Дата с</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                data-testid="input-date-from"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Дата по</label>
              <input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                data-testid="input-date-to"
              />
            </div>
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
                      data-testid={`checkbox-payment-${option.value}`}
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
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-muted-foreground">Загрузка данных...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-destructive">Ошибка загрузки данных</div>
          </div>
        ) : (
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
                {canWrite && <th className="px-3 py-3 w-12"></th>}
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
                  <td colSpan={canWrite ? 30 : 29} className="px-4 py-10 text-center text-muted-foreground">
                    По выбранным фильтрам записи не найдены.
                  </td>
                </tr>
              ) : (
                filtered.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-t border-border/60 hover:bg-muted/30"
                  >
                    {canWrite && (
                      <td className="px-3 py-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingCase(item);
                            setFormOpen(true);
                          }}
                          data-testid={`button-edit-case-${item.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </td>
                    )}
                    <td className="px-3 py-2 text-muted-foreground">{index + 1}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{item.number}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{item.region}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{item.district}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{item.caseDate}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{item.article}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{item.status}</td>
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
        )}
      </section>

      <AdminCaseForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingCase(null);
        }}
        editData={editingCase}
      />
    </div>
  );
}
