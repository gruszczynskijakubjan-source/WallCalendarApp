"use client";

import { useEffect, useRef, useState } from "react";
import {
  setMonth,
  setYear,
  format,
  eachMonthOfInterval,
  startOfYear,
  endOfYear,
} from "date-fns";
import { pl } from "date-fns/locale";

const MONTH_LABELS = eachMonthOfInterval({
  start: startOfYear(new Date(2024, 0, 1)),
  end: endOfYear(new Date(2024, 0, 1)),
}).map((m) => format(m, "LLLL", { locale: pl }));

const YEARS_BEFORE = 5;
const YEARS_AFTER = 5;

function Dropdown({
  label,
  open,
  onToggle,
  onClose,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="rounded-lg px-2 py-1 text-center text-lg font-medium capitalize hover:bg-surface-muted"
      >
        {label}
      </button>

      {open && (
        <div className="absolute top-full left-1/2 z-20 mt-2 -translate-x-1/2 rounded-2xl border border-border bg-surface p-2 shadow-lg">
          {children}
        </div>
      )}
    </div>
  );
}

function MonthDropdown({
  date,
  open,
  onToggle,
  onClose,
  onSelect,
}: {
  date: Date;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onSelect: (date: Date) => void;
}) {
  return (
    <Dropdown
      label={format(date, "LLLL", { locale: pl })}
      open={open}
      onToggle={onToggle}
      onClose={onClose}
    >
      <div className="grid max-h-64 w-48 grid-cols-2 gap-1 overflow-y-auto">
        {MONTH_LABELS.map((monthLabel, i) => (
          <button
            key={monthLabel}
            type="button"
            onClick={() => onSelect(setMonth(date, i))}
            className={`rounded-lg px-3 py-2 text-left text-sm capitalize hover:bg-surface-muted ${
              date.getMonth() === i ? "bg-accent-teal/10 font-medium text-accent-teal" : ""
            }`}
          >
            {monthLabel}
          </button>
        ))}
      </div>
    </Dropdown>
  );
}

function YearDropdown({
  date,
  open,
  onToggle,
  onClose,
  onSelect,
}: {
  date: Date;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onSelect: (date: Date) => void;
}) {
  const currentYear = date.getFullYear();
  const years = Array.from(
    { length: YEARS_BEFORE + YEARS_AFTER + 1 },
    (_, i) => currentYear - YEARS_BEFORE + i,
  );

  return (
    <Dropdown
      label={format(date, "yyyy")}
      open={open}
      onToggle={onToggle}
      onClose={onClose}
    >
      <div className="flex max-h-64 flex-col space-y-1 overflow-y-auto">
        {years.map((year) => (
          <button
            key={year}
            type="button"
            onClick={() => onSelect(setYear(date, year))}
            className={`rounded-lg px-3 py-2 text-sm hover:bg-surface-muted ${
              year === currentYear ? "bg-accent-teal/10 font-medium text-accent-teal" : ""
            }`}
          >
            {year}
          </button>
        ))}
      </div>
    </Dropdown>
  );
}

export default function PeriodPicker({
  showMonth,
  date,
  onChange,
}: {
  showMonth: boolean;
  date: Date;
  onChange: (date: Date) => void;
}) {
  const [openPicker, setOpenPicker] = useState<"month" | "year" | null>(null);

  function select(newDate: Date) {
    onChange(newDate);
    setOpenPicker(null);
  }

  return (
    <div className="flex items-center space-x-1">
      {showMonth && (
        <MonthDropdown
          date={date}
          open={openPicker === "month"}
          onToggle={() => setOpenPicker((p) => (p === "month" ? null : "month"))}
          onClose={() => setOpenPicker(null)}
          onSelect={select}
        />
      )}
      <YearDropdown
        date={date}
        open={openPicker === "year"}
        onToggle={() => setOpenPicker((p) => (p === "year" ? null : "year"))}
        onClose={() => setOpenPicker(null)}
        onSelect={select}
      />
    </div>
  );
}
