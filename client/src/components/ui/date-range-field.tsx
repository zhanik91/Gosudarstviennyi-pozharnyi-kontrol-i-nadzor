import { useState } from "react";
import { Label } from "@/components/ui/label";

const daysShort = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const monthLabel = (year: number, month: number) =>
  new Date(year, month, 1).toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });

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
  const firstDayIndex = (y: number, m: number) => (new Date(y, m, 1).getDay() + 6) % 7;
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
    <div className="absolute left-0 z-50 mt-2 w-72 rounded-xl border border-border bg-background p-3 shadow-2xl">
      <div className="mb-2 flex items-center justify-between">
        <button
          onClick={() => nav(-1)}
          className="rounded-md border border-border bg-card px-2 py-1 text-xs hover:bg-muted"
          type="button"
        >
          ◀
        </button>
        <div className="text-sm font-medium capitalize">{monthLabel(year, month)}</div>
        <button
          onClick={() => nav(1)}
          className="rounded-md border border-border bg-card px-2 py-1 text-xs hover:bg-muted"
          type="button"
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
          <div key={`e${i}`} className="py-2 text-sm text-muted-foreground/60">
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
                disabled ? "cursor-not-allowed opacity-40 hover:bg-transparent" : ""
              }`}
              type="button"
            >
              {day}
            </button>
          );
        })}
      </div>
      <div className="mt-2 text-right">
        <button
          onClick={onClose}
          className="rounded-md border border-border bg-card px-3 py-1 text-xs hover:bg-muted"
          type="button"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}

export function DateField({
  value,
  onChange,
  label,
  min,
  max,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  min?: string;
  max?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <Label>{label}</Label>
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 pr-10 text-sm"
          min={min}
          max={max}
        />
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="absolute right-2 top-2 rounded-md border border-border bg-card px-2 py-0.5 text-xs hover:bg-muted"
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
    </div>
  );
}

export function DateRangeField({
  from,
  to,
  onChange,
  fromLabel = "Период с",
  toLabel = "по",
  className,
}: {
  from: string;
  to: string;
  onChange: (next: { from: string; to: string }) => void;
  fromLabel?: string;
  toLabel?: string;
  className?: string;
}) {
  return (
    <div className={className ?? "grid grid-cols-1 gap-3 md:grid-cols-2"}>
      <DateField
        label={fromLabel}
        value={from}
        onChange={(value) => onChange({ from: value, to })}
        max={to || undefined}
      />
      <DateField
        label={toLabel}
        value={to}
        onChange={(value) => onChange({ from, to: value })}
        min={from || undefined}
      />
    </div>
  );
}
