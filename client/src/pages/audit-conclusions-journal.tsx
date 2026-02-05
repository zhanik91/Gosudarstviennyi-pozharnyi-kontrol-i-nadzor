import React, { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";

type AuditEntry = {
  id: string;
  subjectName: string;
  subjectBIN: string;
  objectName: string;
  objectAddress: string;
  expertOrg: string;
  conclusionType: "Положительное" | "Отрицательное";
  conclusionNumber: string;
  approvalDate: string;
  submissionDate: string;
  exemptionPeriod: string;
};

const STORAGE_KEY = "audit_journal_entries_v2";

const toISODate = (s: string) => {
  if (!s) return "";
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  const m = String(s).match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (m) {
    const dd = m[1].padStart(2, "0");
    const mm = m[2].padStart(2, "0");
    const yyyy = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${yyyy}-${mm}-${dd}`;
  }
  return "";
};

const fmtDateRu = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
};

const calcYearPeriod = (approvalISO: string) => {
  if (!approvalISO) return "";
  const start = new Date(approvalISO);
  if (isNaN(start.getTime())) return "";
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + 1);
  end.setDate(end.getDate() - 1);
  return `${fmtDateRu(start.toISOString().slice(0, 10))} — ${fmtDateRu(
    end.toISOString().slice(0, 10)
  )}`;
};

const calcExemption = (
  type: AuditEntry["conclusionType"],
  approvalISO: string
) => (type === "Отрицательное" ? "Не освобождается" : calcYearPeriod(approvalISO));

const todayISO = () => new Date().toISOString().slice(0, 10);

function CalendarPopup({
  initialISO,
  onSelect,
  onClose,
  minISO,
  maxISO,
}: {
  initialISO: string;
  onSelect: (iso: string) => void;
  onClose: () => void;
  minISO?: string;
  maxISO?: string;
}) {
  const init = initialISO ? new Date(initialISO) : new Date();
  const [year, setYear] = useState(init.getFullYear());
  const [month, setMonth] = useState(init.getMonth());
  const daysShort = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const firstDayIndex = (y: number, m: number) =>
    (new Date(y, m, 1).getDay() + 6) % 7;
  const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const min = minISO ? new Date(minISO) : null;
  const max = maxISO ? new Date(maxISO) : null;

  const selectDay = (day: number) => {
    const dd = String(day).padStart(2, "0");
    const mm = String(month + 1).padStart(2, "0");
    const candidate = `${year}-${mm}-${dd}`;
    const cd = new Date(candidate);
    if ((min && cd < min) || (max && cd > max)) return;
    onSelect(candidate);
    onClose();
  };

  const nav = (delta: number) => {
    const d = new Date(year, month, 1);
    d.setMonth(d.getMonth() + delta);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  return (
    <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-border bg-background p-3 shadow-2xl">
      <div className="mb-2 flex items-center justify-between">
        <button
          onClick={() => nav(-1)}
          className="rounded-md bg-muted px-2 py-1 text-xs hover:bg-accent"
        >
          ◀
        </button>
        <div className="text-sm font-medium">
          {fmtDateRu(
            `${year}-${String(month + 1).padStart(2, "0")}-01`
          ).slice(3)}
        </div>
        <button
          onClick={() => nav(1)}
          className="rounded-md bg-muted px-2 py-1 text-xs hover:bg-accent"
        >
          ▶
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {daysShort.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1 text-center">
        {Array.from({ length: firstDayIndex(year, month) }).map((_, i) => (
          <div key={`e${i}`} className="py-2 text-sm text-muted-foreground">
            {" "}
          </div>
        ))}
        {Array.from({ length: daysInMonth(year, month) }).map((_, i) => {
          const day = i + 1;
          const dd = String(day).padStart(2, "0");
          const mm = String(month + 1).padStart(2, "0");
          const candidate = `${year}-${mm}-${dd}`;
          const cd = new Date(candidate);
          const disabled = (min && cd < min) || (max && cd > max);
          return (
            <button
              key={day}
              onClick={() => selectDay(day)}
              disabled={!!disabled}
              className={`rounded-md px-0.5 py-1 text-sm hover:bg-muted ${
                disabled
                  ? "cursor-not-allowed opacity-40 hover:bg-transparent"
                  : ""
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
      <div className="mt-2 text-right">
        <button
          onClick={onClose}
          className="rounded-md bg-muted px-3 py-1 text-xs hover:bg-accent"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}

function DateField({
  value,
  onChange,
  error,
  label,
  min,
  max,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
  label: string;
  min?: string;
  max?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-muted-foreground">{label}</span>
      <div className="relative flex items-center">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-lg border px-3 py-2 pr-10 text-sm ${
            error ? "border-red-600" : "border-border"
          } bg-background`}
          min={min}
          max={max}
          placeholder="гггг-мм-дд"
        />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="absolute right-2 rounded-md bg-muted px-2 py-1 text-xs hover:bg-accent"
          title="Открыть календарь"
        >
          📅
        </button>
        {open && (
          <CalendarPopup
            initialISO={value}
            onSelect={onChange}
            onClose={() => setOpen(false)}
            minISO={min}
            maxISO={max}
          />
        )}
      </div>
      {error ? (
        <span className="mt-1 block text-xs text-red-500">{error}</span>
      ) : null}
    </label>
  );
}

type AuditJournalPageProps = {
  embedded?: boolean;
};

export default function AuditJournalPage({ embedded = false }: AuditJournalPageProps) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [periodFrom, setPeriodFrom] = useState<string>("");
  const [periodTo, setPeriodTo] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [filterType, setFilterType] =
    useState<"" | AuditEntry["conclusionType"]>("");
  const [open, setOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const initialForm: AuditEntry = {
    id: "",
    subjectName: "",
    subjectBIN: "",
    objectName: "",
    objectAddress: "",
    expertOrg: "",
    conclusionType: "Положительное",
    conclusionNumber: "",
    approvalDate: todayISO(),
    submissionDate: "",
    exemptionPeriod: calcExemption("Положительное", todayISO()),
  };
  const [form, setForm] = useState<AuditEntry>({ ...initialForm });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setEntries(JSON.parse(saved));
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    setForm((s) => ({
      ...s,
      exemptionPeriod: calcExemption(s.conclusionType, s.approvalDate),
    }));
  }, [form.approvalDate, form.conclusionType]);

  const setRange = (fromISO: string, toISO: string) => {
    setPeriodFrom(fromISO);
    setPeriodTo(toISO);
  };
  const thisYear = () => {
    const now = new Date();
    const y = now.getFullYear();
    setRange(`${y}-01-01`, `${y}-12-31`);
  };
  const prevQuarter = () => {
    const now = new Date();
    let y = now.getFullYear();
    const q = Math.floor(now.getMonth() / 3) + 1;
    let pq = q - 1;
    if (pq === 0) {
      pq = 4;
      y -= 1;
    }
    const startMonth = (pq - 1) * 3;
    const from = new Date(y, startMonth, 1);
    const to = new Date(y, startMonth + 3, 0);
    setRange(from.toISOString().slice(0, 10), to.toISOString().slice(0, 10));
  };

  const filtered = useMemo(() => {
    let list = [...entries];

    if (periodFrom) {
      const dFrom = new Date(periodFrom);
      list = list.filter(
        (e) => new Date(e.approvalDate || e.submissionDate || 0) >= dFrom
      );
    }
    if (periodTo) {
      const dTo = new Date(periodTo);
      dTo.setHours(23, 59, 59, 999);
      list = list.filter(
        (e) => new Date(e.approvalDate || e.submissionDate || 0) <= dTo
      );
    }

    if (filterType) {
      list = list.filter((e) => e.conclusionType === filterType);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) =>
        [e.subjectName, e.objectName, e.subjectBIN, e.expertOrg]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    return list.sort((a, b) =>
      (b.approvalDate || "").localeCompare(a.approvalDate || "")
    );
  }, [entries, periodFrom, periodTo, filterType, search]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportXLSX = () => {
    if (filtered.length === 0) {
      alert("Нет данных для экспорта");
      return;
    }
    try {
      const data = filtered.map((e, idx) => ({
        "№п/п": idx + 1,
        "Наименование субъекта контроля": e.subjectName,
        "БИН субъекта контроля": e.subjectBIN,
        "Наименование объекта контроля": e.objectName,
        "Адрес объекта контроля": e.objectAddress,
        "Наименование экспертной организации проводившей аудит": e.expertOrg,
        "Вид заключения": e.conclusionType,
        "Номер заключения": e.conclusionNumber,
        "Дата утверждения заключения": e.approvalDate,
        "Дата представления заключения": e.submissionDate,
        "Период освобождения объекта контроля от профильных проверок":
          e.exemptionPeriod,
      }));
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, "Журнал");
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      downloadBlob(blob, `Журнал_аудитов_${todayISO()}.xlsx`);
    } catch {
      exportCSV();
    }
  };

  const exportCSV = () => {
    if (filtered.length === 0) {
      alert("Нет данных для экспорта");
      return;
    }
    const header = [
      "№п/п",
      "Наименование субъекта контроля",
      "БИН субъекта контроля",
      "Наименование объекта контроля",
      "Адрес объекта контроля",
      "Наименование экспертной организации проводившей аудит",
      "Вид заключения",
      "Номер заключения",
      "Дата утверждения заключения",
      "Дата представления заключения",
      "Период освобождения объекта контроля от профильных проверок",
    ];
    const rows = filtered.map((e, idx) => [
      String(idx + 1),
      e.subjectName,
      e.subjectBIN,
      e.objectName,
      e.objectAddress,
      e.expertOrg,
      e.conclusionType,
      e.conclusionNumber,
      e.approvalDate,
      e.submissionDate,
      e.exemptionPeriod,
    ]);
    const csv =
      [header, ...rows]
        .map((r) =>
          r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")
        )
        .join("\n");
    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    downloadBlob(blob, `Журнал_аудитов_${todayISO()}.csv`);
  };

  const importFile = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

      const mapped: AuditEntry[] = json.map((row) => {
        const approvalISO = toISODate(
          String(row["Дата утверждения заключения"] ?? row["Дата утверждения"] ?? "")
        );
        const rawType = String(
          row["Вид заключения"] ?? row["Заключение"] ?? ""
        ).toLowerCase();
        const type: AuditEntry["conclusionType"] = rawType.includes("отриц")
          ? "Отрицательное"
          : "Положительное";
        const provided = String(
          row["Период освобождения объекта контроля от профильных проверок"] ??
            row["Период освобождения"] ??
            ""
        );
        const period =
          calcExemption(type, approvalISO) === "Не освобождается"
            ? "Не освобождается"
            : provided || calcYearPeriod(approvalISO);

        return {
          id: crypto.randomUUID(),
          subjectName: String(
            row["Наименование субъекта контроля"] ??
              row["Субъект контроля"] ??
              row["Субъект"] ??
              ""
          ),
          subjectBIN: String(row["БИН субъекта контроля"] ?? row["БИН"] ?? ""),
          objectName: String(
            row["Наименование объекта контроля"] ?? row["Объект контроля"] ?? ""
          ),
          objectAddress: String(
            row["Адрес объекта контроля"] ?? row["Адрес"] ?? ""
          ),
          expertOrg: String(
            row["Наименование экспертной организации проводившей аудит"] ??
              row["Экспертная организация"] ??
              ""
          ),
          conclusionType: type,
          conclusionNumber: String(
            row["Номер заключения"] ?? row["№ заключения"] ?? ""
          ),
          approvalDate: approvalISO,
          submissionDate: toISODate(
            String(
              row["Дата представления заключения"] ?? row["Дата представления"] ?? ""
            )
          ),
          exemptionPeriod: period,
        };
      });

      const nonEmpty = mapped.filter(
        (m) => m.subjectName || m.conclusionNumber
      );
      setEntries((prev) => [...nonEmpty, ...prev]);
      alert(`Импортировано записей: ${nonEmpty.length}`);
    } catch {
      alert("Не удалось импортировать файл. Попробуйте CSV или другой XLSX.");
    }
  };

  const validate = (v: AuditEntry) => {
    const e: Record<string, string> = {};
    if (!v.subjectName.trim()) e.subjectName = "Обязательное поле";
    if (!/^\d{12}$/.test(v.subjectBIN)) e.subjectBIN = "БИН: 12 цифр";
    if (!v.objectName.trim()) e.objectName = "Обязательное поле";
    if (!v.objectAddress.trim()) e.objectAddress = "Обязательное поле";
    if (!v.expertOrg.trim()) e.expertOrg = "Обязательное поле";
    if (!v.conclusionType) e.conclusionType = "Обязательное поле";
    if (!v.conclusionNumber.trim()) e.conclusionNumber = "Обязательное поле";
    if (!v.approvalDate) e.approvalDate = "Укажите дату";
    const today = new Date(todayISO());
    if (v.approvalDate && new Date(v.approvalDate) > today)
      e.approvalDate = "Дата не может быть позже сегодняшней";
    if (
      v.submissionDate &&
      v.approvalDate &&
      new Date(v.submissionDate) < new Date(v.approvalDate)
    )
      e.submissionDate = "Не раньше даты утверждения";
    return e;
  };

  const onSaveForm = () => {
    const prepared: AuditEntry = {
      ...form,
      id: form.id || crypto.randomUUID(),
      approvalDate: toISODate(form.approvalDate),
      submissionDate: toISODate(form.submissionDate),
      exemptionPeriod: calcExemption(
        form.conclusionType,
        toISODate(form.approvalDate)
      ),
    };
    const errs = validate(prepared);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const isDuplicate = entries.some(
      (x) =>
        x.conclusionNumber.trim() &&
        x.subjectBIN === prepared.subjectBIN &&
        x.conclusionNumber === prepared.conclusionNumber &&
        x.id !== prepared.id
    );
    if (isDuplicate) {
      setErrors({
        conclusionNumber: "Дубль: такой № заключения уже есть для этого БИН",
      });
      return;
    }

    setEntries((prev) => {
      const exists = prev.find((e) => e.id === prepared.id);
      if (exists) return prev.map((e) => (e.id === prepared.id ? prepared : e));
      return [prepared, ...prev];
    });
    setOpen(false);
    setEditingId(null);
    setForm({ ...initialForm });
    setErrors({});
  };

  const onEdit = (id: string) => {
    const e = entries.find((x) => x.id === id);
    if (!e) return;
    setEditingId(id);
    setForm({ ...e });
    setErrors({});
    setOpen(true);
  };

  const onRequestDelete = (id: string) => setConfirmDeleteId(id);
  const onCancelDelete = () => setConfirmDeleteId(null);
  const onConfirmDelete = () => {
    if (!confirmDeleteId) return;
    setEntries((prev) => prev.filter((e) => e.id !== confirmDeleteId));
    setConfirmDeleteId(null);
  };

  return (
    <div
      className={`bg-background text-foreground p-6 ${
        embedded ? "rounded-2xl border border-border" : "min-h-screen"
      }`}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            Журнал учета заключений аудитов в области пожарной безопасности
          </h1>
          <div className="flex items-center gap-3">
            <button
              className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-medium shadow hover:bg-blue-500"
              onClick={() => {
                setEditingId(null);
                setForm({ ...initialForm });
                setErrors({});
                setOpen(true);
              }}
            >
              ➕ Добавить в журнал
            </button>
            <button
              className="rounded-2xl bg-muted px-4 py-2 text-sm font-medium hover:bg-accent"
              onClick={() => {
                setPeriodFrom("");
                setPeriodTo("");
                setSearch("");
                setFilterType("");
              }}
            >
              Очистить
            </button>
          </div>
        </header>

        <section className="rounded-2xl border border-border bg-card p-4 shadow">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-60">
                <DateField
                  label="Период по дате утверждения (с)"
                  value={periodFrom}
                  onChange={setPeriodFrom}
                />
              </div>
              <div className="w-60">
                <DateField
                  label="Период по дате утверждения (по)"
                  value={periodTo}
                  onChange={setPeriodTo}
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={thisYear}
                  className="rounded-md border border-border bg-muted px-3 py-2 text-xs hover:bg-muted"
                >
                  Этот год
                </button>
                <button
                  onClick={prevQuarter}
                  className="rounded-md border border-border bg-muted px-3 py-2 text-xs hover:bg-muted"
                >
                  Прошлый квартал
                </button>
                <button
                  onClick={() => setRange("", "")}
                  className="rounded-md border border-border bg-muted px-3 py-2 text-xs hover:bg-muted"
                >
                  Очистить период
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-56">
                <label className="text-xs text-muted-foreground">Вид заключения</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">Все заключения</option>
                  <option value="Положительное">Положительное</option>
                  <option value="Отрицательное">Отрицательное</option>
                </select>
              </div>
              <div className="relative">
                <input
                  placeholder="Поиск: субъект / объект / БИН·ИИН / экспертная организация"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-96 rounded-lg border border-border bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <span className="pointer-events-none absolute right-2 top-2.5 text-muted-foreground">
                  🔎
                </span>
              </div>
              <button
                className="rounded-lg border border-border bg-muted px-3 py-2 text-sm hover:bg-muted"
                onClick={() => fileInputRef.current?.click()}
                title="Импорт XLSX/CSV"
              >
                ⬆️ Импорт
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importFile(f);
                  e.currentTarget.value = "";
                }}
              />
              <button
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium hover:bg-emerald-500"
                onClick={exportXLSX}
              >
                ⬇️ Экспорт XLSX
              </button>
              <button
                className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium hover:bg-emerald-600"
                onClick={exportCSV}
              >
                ⬇️ Экспорт CSV
              </button>
            </div>
          </div>
        </section>

        <section className="overflow-x-auto rounded-2xl border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted">
              <tr className="text-left text-muted-foreground">
                <th className="px-3 py-3">№</th>
                <th className="px-3 py-3">Наименование субъекта контроля</th>
                <th className="px-3 py-3">БИН</th>
                <th className="px-3 py-3">Наименование объекта контроля</th>
                <th className="px-3 py-3">Адрес объекта контроля</th>
                <th className="px-3 py-3">Экспертная организация</th>
                <th className="px-3 py-3">Вид заключения</th>
                <th className="px-3 py-3">№ заключения</th>
                <th className="px-3 py-3">Дата утверждения</th>
                <th className="px-3 py-3">Дата представления</th>
                <th className="px-3 py-3">Период освобождения</th>
                <th className="px-3 py-3">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={12}
                    className="px-3 py-10 text-center text-muted-foreground"
                  >
                    Журнал пуст. Нажмите «Добавить в журнал» или «Импорт» для
                    загрузки данных.
                  </td>
                </tr>
              ) : (
                filtered.map((e, idx) => (
                  <tr
                    key={e.id}
                    className="border-t border-border hover:bg-card"
                  >
                    <td className="px-3 py-2">{idx + 1}</td>
                    <td className="px-3 py-2">{e.subjectName}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {e.subjectBIN}
                    </td>
                    <td className="px-3 py-2">{e.objectName}</td>
                    <td className="px-3 py-2">{e.objectAddress}</td>
                    <td className="px-3 py-2">{e.expertOrg}</td>
                    <td className="px-3 py-2">{e.conclusionType}</td>
                    <td className="px-3 py-2">{e.conclusionNumber}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {fmtDateRu(e.approvalDate)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {fmtDateRu(e.submissionDate)}
                    </td>
                    <td className="px-3 py-2">{e.exemptionPeriod}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          className="rounded-lg bg-muted px-2 py-1 text-xs hover:bg-accent"
                          onClick={() => onEdit(e.id)}
                        >
                          Изменить
                        </button>
                        <button
                          className="rounded-lg bg-red-600 px-2 py-1 text-xs hover:bg-red-500"
                          onClick={() => onRequestDelete(e.id)}
                        >
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        {filtered.length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
            <div>
              Всего записей: <span className="font-semibold">{filtered.length}</span>
            </div>
          </section>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-4xl rounded-2xl border border-border bg-background p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingId ? "Редактировать запись" : "Добавить запись"}
              </h2>
              <button
                className="rounded-lg bg-muted px-3 py-1 text-sm hover:bg-accent"
                onClick={() => setOpen(false)}
              >
                Закрыть
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Наименование субъекта контроля" error={errors.subjectName}>
                <input
                  className={`w-full rounded-lg border px-3 py-2 text-sm ${
                    errors.subjectName ? "border-red-600" : "border-border"
                  } bg-background`}
                  value={form.subjectName}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, subjectName: e.target.value }))
                  }
                />
              </Field>

              <Field label="БИН субъекта контроля" error={errors.subjectBIN}>
                <input
                  inputMode="numeric"
                  pattern="\\d{12}"
                  maxLength={12}
                  placeholder="12 цифр"
                  className={`w-full rounded-lg border px-3 py-2 text-sm ${
                    errors.subjectBIN ? "border-red-600" : "border-border"
                  } bg-background`}
                  value={form.subjectBIN}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      subjectBIN: e.target.value.replace(/[^0-9]/g, ""),
                    }))
                  }
                />
              </Field>

              <Field label="Наименование объекта контроля" error={errors.objectName}>
                <input
                  className={`w-full rounded-lg border px-3 py-2 text-sm ${
                    errors.objectName ? "border-red-600" : "border-border"
                  } bg-background`}
                  value={form.objectName}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, objectName: e.target.value }))
                  }
                />
              </Field>

              <Field label="Адрес объекта контроля" error={errors.objectAddress}>
                <input
                  className={`w-full rounded-lg border px-3 py-2 text-sm ${
                    errors.objectAddress ? "border-red-600" : "border-border"
                  } bg-background`}
                  value={form.objectAddress}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, objectAddress: e.target.value }))
                  }
                />
              </Field>

              <Field label="Экспертная организация" error={errors.expertOrg}>
                <input
                  className={`w-full rounded-lg border px-3 py-2 text-sm ${
                    errors.expertOrg ? "border-red-600" : "border-border"
                  } bg-background`}
                  value={form.expertOrg}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, expertOrg: e.target.value }))
                  }
                />
              </Field>

              <Field label="Вид заключения" error={errors.conclusionType}>
                <select
                  className={`w-full rounded-lg border px-3 py-2 text-sm ${
                    errors.conclusionType ? "border-red-600" : "border-border"
                  } bg-background`}
                  value={form.conclusionType}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      conclusionType: e.target
                        .value as AuditEntry["conclusionType"],
                    }))
                  }
                >
                  {(["Положительное", "Отрицательное"] as const).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="№ заключения" error={errors.conclusionNumber}>
                <input
                  className={`w-full rounded-lg border px-3 py-2 text-sm ${
                    errors.conclusionNumber
                      ? "border-red-600"
                      : "border-border"
                  } bg-background`}
                  value={form.conclusionNumber}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      conclusionNumber: e.target.value,
                    }))
                  }
                />
              </Field>

              <DateField
                label="Дата утверждения заключения"
                value={form.approvalDate}
                onChange={(v) => setForm((s) => ({ ...s, approvalDate: v }))}
                error={errors.approvalDate}
                max={todayISO()}
              />

              <DateField
                label="Дата представления заключения"
                value={form.submissionDate}
                onChange={(v) => setForm((s) => ({ ...s, submissionDate: v }))}
                error={errors.submissionDate}
              />

              <label className="block text-sm">
                <span className="mb-1 block text-muted-foreground">
                  Период освобождения от профильных проверок (авто)
                </span>
                <input
                  className="w-full cursor-not-allowed rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground"
                  value={form.exemptionPeriod}
                  readOnly
                />
              </label>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                className="rounded-xl bg-muted px-4 py-2 text-sm hover:bg-accent"
                onClick={() => setOpen(false)}
              >
                Отмена
              </button>
              <button
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
                onClick={onSaveForm}
              >
                Сохранить в журнал
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={onCancelDelete}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-background p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">Удалить запись?</h3>
            <p className="mt-2 text-sm text-muted-foreground">Действие необратимо.</p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                className="rounded-xl bg-muted px-4 py-2 text-sm hover:bg-accent"
                onClick={onCancelDelete}
              >
                Отмена
              </button>
              <button
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium hover:bg-red-500"
                onClick={onConfirmDelete}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-muted-foreground">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-red-500">{error}</span>
      ) : null}
    </label>
  );
}
