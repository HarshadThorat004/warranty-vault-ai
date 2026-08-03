"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  id?: string;
  value?: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  label?: string;
  hint?: string;
};

function pad2(n: string | number) {
  return String(n).padStart(2, "0");
}

function splitIso(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { day: "", month: "", year: "" };
  }
  const [year, month, day] = value.split("-");
  return { day, month, year };
}

function toIso(day: string, month: string, year: string) {
  if (day.length !== 2 || month.length !== 2 || year.length !== 4) {
    return "";
  }

  const d = Number(day);
  const m = Number(month);
  const y = Number(year);

  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2100) {
    return "";
  }

  const date = new Date(y, m - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return "";
  }

  return `${y}-${pad2(m)}-${pad2(d)}`;
}

export default function SmartDateField({
  id,
  value = "",
  onChange,
  onBlur,
  error,
  hint,
}: Props) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const parts = splitIso(value);

  const [day, setDay] = useState(parts.day);
  const [month, setMonth] = useState(parts.month);
  const [year, setYear] = useState(parts.year);
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    if (value) {
      try {
        return startOfMonth(parseISO(value));
      } catch {
        return startOfMonth(new Date());
      }
    }
    return startOfMonth(new Date());
  });

  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const next = splitIso(value);
    setDay(next.day);
    setMonth(next.month);
    setYear(next.year);
    if (value) {
      try {
        setViewMonth(startOfMonth(parseISO(value)));
      } catch {
        // ignore
      }
    }
  }, [value]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function commit(nextDay: string, nextMonth: string, nextYear: string) {
    const iso = toIso(nextDay, nextMonth, nextYear);
    if (iso) {
      onChange(iso);
    } else if (!nextDay && !nextMonth && !nextYear) {
      onChange("");
    }
  }

  function handleDayChange(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 2);
    setDay(digits);

    if (digits.length === 2) {
      const n = Number(digits);
      if (n >= 1 && n <= 31) {
        monthRef.current?.focus();
        monthRef.current?.select();
      }
    } else if (digits.length === 1 && Number(digits) > 3) {
      // 4-9 can't start a valid 2-digit day beyond 31, so pad and move on
      const padded = pad2(digits);
      setDay(padded);
      monthRef.current?.focus();
      monthRef.current?.select();
    }

    commit(
      digits.length === 1 && Number(digits) > 3 ? pad2(digits) : digits,
      month,
      year
    );
  }

  function handleMonthChange(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 2);
    setMonth(digits);

    if (digits.length === 2) {
      const n = Number(digits);
      if (n >= 1 && n <= 12) {
        yearRef.current?.focus();
        yearRef.current?.select();
      }
    } else if (digits.length === 1 && Number(digits) > 1) {
      // 2-9 are complete months when typed alone
      const padded = pad2(digits);
      setMonth(padded);
      yearRef.current?.focus();
      yearRef.current?.select();
      commit(day, padded, year);
      return;
    }

    commit(day, digits, year);
  }

  function handleYearChange(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 4);
    setYear(digits);
    commit(day, month, digits);
  }

  function handleDayKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowRight" && (e.currentTarget.selectionStart ?? 0) >= day.length) {
      e.preventDefault();
      monthRef.current?.focus();
    }
    if (e.key === "/" || e.key === "-" || e.key === ".") {
      e.preventDefault();
      monthRef.current?.focus();
    }
  }

  function handleMonthKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowRight" && (e.currentTarget.selectionStart ?? 0) >= month.length) {
      e.preventDefault();
      yearRef.current?.focus();
    }
    if (e.key === "ArrowLeft" && (e.currentTarget.selectionStart ?? 0) === 0) {
      e.preventDefault();
      dayRef.current?.focus();
    }
    if (e.key === "/" || e.key === "-" || e.key === ".") {
      e.preventDefault();
      yearRef.current?.focus();
    }
    if (e.key === "Backspace" && month.length === 0) {
      dayRef.current?.focus();
    }
  }

  function handleYearKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowLeft" && (e.currentTarget.selectionStart ?? 0) === 0) {
      e.preventDefault();
      monthRef.current?.focus();
    }
    if (e.key === "Backspace" && year.length === 0) {
      monthRef.current?.focus();
    }
  }

  function pickDate(date: Date) {
    const iso = format(date, "yyyy-MM-dd");
    onChange(iso);
    setOpen(false);
  }

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [viewMonth]);

  const selected = value ? parseISO(value) : null;

  const boxClass =
    "w-full rounded-lg border border-white/10 bg-black/70 px-2 py-2.5 text-center text-sm font-medium text-white outline-none transition placeholder:text-gray-600 focus:border-cyan-400";

  return (
    <div ref={rootRef} className="relative">
      <div className="flex items-stretch gap-2">
        <div className="grid flex-1 grid-cols-[1fr_auto_1fr_auto_1.4fr] items-center gap-1.5">
          <input
            ref={dayRef}
            id={fieldId}
            inputMode="numeric"
            autoComplete="off"
            placeholder="DD"
            aria-label="Day"
            value={day}
            onChange={(e) => handleDayChange(e.target.value)}
            onKeyDown={handleDayKeyDown}
            onBlur={onBlur}
            onFocus={(e) => e.target.select()}
            className={boxClass}
            maxLength={2}
          />
          <span className="text-gray-600" aria-hidden>
            /
          </span>
          <input
            ref={monthRef}
            inputMode="numeric"
            autoComplete="off"
            placeholder="MM"
            aria-label="Month"
            value={month}
            onChange={(e) => handleMonthChange(e.target.value)}
            onKeyDown={handleMonthKeyDown}
            onBlur={onBlur}
            onFocus={(e) => e.target.select()}
            className={boxClass}
            maxLength={2}
          />
          <span className="text-gray-600" aria-hidden>
            /
          </span>
          <input
            ref={yearRef}
            inputMode="numeric"
            autoComplete="off"
            placeholder="YYYY"
            aria-label="Year"
            value={year}
            onChange={(e) => handleYearChange(e.target.value)}
            onKeyDown={handleYearKeyDown}
            onBlur={onBlur}
            onFocus={(e) => e.target.select()}
            className={boxClass}
            maxLength={4}
          />
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-cyan-300 transition hover:border-cyan-400/50 hover:bg-cyan-500/10"
          aria-label="Open calendar"
          aria-expanded={open}
        >
          <CalendarDays size={18} />
        </button>
      </div>

      {hint && !error && (
        <p className="mt-1.5 text-xs text-gray-500">{hint}</p>
      )}
      {error && (
        <p className="mt-1.5 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      {open && (
        <div className="absolute left-0 right-0 z-40 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 p-3 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewMonth((m) => subMonths(m, 1))}
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-white/5 hover:text-white"
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </button>
            <p className="text-sm font-semibold text-white">
              {format(viewMonth, "MMMM yyyy")}
            </p>
            <button
              type="button"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-white/5 hover:text-white"
              aria-label="Next month"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-gray-500">
            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((date) => {
              const inMonth = isSameMonth(date, viewMonth);
              const selectedDay = selected ? isSameDay(date, selected) : false;
              const today = isToday(date);

              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => pickDate(date)}
                  className={`rounded-lg py-2 text-sm transition ${
                    selectedDay
                      ? "bg-cyan-400 font-semibold text-black"
                      : today
                        ? "bg-white/10 text-white"
                        : inMonth
                          ? "text-gray-200 hover:bg-white/10"
                          : "text-gray-600 hover:bg-white/5"
                  }`}
                >
                  {format(date, "d")}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => pickDate(new Date())}
              className="flex-1 rounded-xl border border-white/10 py-2 text-xs font-medium text-gray-300 transition hover:border-cyan-400/40 hover:text-cyan-300"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                onChange("");
                setDay("");
                setMonth("");
                setYear("");
                setOpen(false);
              }}
              className="flex-1 rounded-xl border border-white/10 py-2 text-xs font-medium text-gray-300 transition hover:border-red-400/40 hover:text-red-300"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
