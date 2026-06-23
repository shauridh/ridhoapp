"use client";

import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EntryActions } from "./manual-entry-form";
import type { CashflowEntryRow } from "@/lib/data/cashflow";
import type { AkunWithBalance } from "@/lib/data/akun";

const kindBadge: Record<
  string,
  { tone: "neutral" | "accent" | "success" | "danger"; label: string }
> = {
  income: { tone: "success", label: "OMZET" },
  pemasukan: { tone: "success", label: "PEMASUKAN" },
  capital: { tone: "accent", label: "MODAL" },
  opex: { tone: "danger", label: "OPEX" },
  capex: { tone: "danger", label: "CAPEX" },
  withdrawal: { tone: "neutral", label: "WITHDRAWAL" },
  transfer: { tone: "neutral", label: "TRANSFER" },
};

type SortKey = "entry_date" | "note" | "kind" | "amount_in" | "amount_out";
type SortDir = "asc" | "desc";

function SortIcon({ col, current, dir }: { col: SortKey; current: SortKey; dir: SortDir }) {
  if (col !== current) return <ChevronsUpDown size={13} className="ml-1 inline text-ink-faint" />;
  return dir === "asc" ? (
    <ChevronUp size={13} className="ml-1 inline text-brand" />
  ) : (
    <ChevronDown size={13} className="ml-1 inline text-brand" />
  );
}

interface Props {
  entries: CashflowEntryRow[];
  akun: AkunWithBalance[];
}

export function CashflowTable({ entries, akun }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("entry_date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "entry_date" ? "desc" : "asc");
    }
  };

  const sorted = useMemo(() => {
    return [...entries].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "entry_date":
          cmp = a.entry_date.localeCompare(b.entry_date);
          break;
        case "note":
          cmp = (a.note ?? "").localeCompare(b.note ?? "");
          break;
        case "kind":
          cmp = a.kind.localeCompare(b.kind);
          break;
        case "amount_in":
          cmp = (a.direction === "in" ? a.amount : 0) - (b.direction === "in" ? b.amount : 0);
          break;
        case "amount_out":
          cmp = (a.direction === "out" ? a.amount : 0) - (b.direction === "out" ? b.amount : 0);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [entries, sortKey, sortDir]);

  const th = (key: SortKey, label: string, className = "") => (
    <th
      className={`cursor-pointer select-none px-4 py-3 hover:text-ink ${className}`}
      onClick={() => toggleSort(key)}
    >
      {label}
      <SortIcon col={key} current={sortKey} dir={sortDir} />
    </th>
  );

  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface text-left text-ink-soft">
            {th("entry_date", "Tanggal")}
            {th("note", "Keterangan")}
            {th("kind", "Jenis")}
            {th("amount_in", "Masuk", "text-right")}
            {th("amount_out", "Keluar", "text-right")}
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((e) => {
            const badge = kindBadge[e.kind] ?? {
              tone: "neutral" as const,
              label: e.kind.toUpperCase(),
            };
            return (
              <tr
                key={e.id}
                className="border-b border-hairline last:border-0 text-ink transition hover:bg-surface/50"
              >
                <td className="px-4 py-3">{new Date(e.entry_date).toLocaleDateString("id-ID")}</td>
                <td className="px-4 py-3">{e.note || "-"}</td>
                <td className="px-4 py-3">
                  <Badge tone={badge.tone}>{badge.label}</Badge>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-success">
                  {e.direction === "in" ? `Rp ${Number(e.amount).toLocaleString("id-ID")}` : "-"}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-danger">
                  {e.direction === "out" ? `Rp ${Number(e.amount).toLocaleString("id-ID")}` : "-"}
                </td>
                <td className="px-4 py-3 text-right">
                  <EntryActions entry={e} akun={akun} />
                </td>
              </tr>
            );
          })}
          {entries.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-ink-soft">
                Belum ada transaksi.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Card>
  );
}
