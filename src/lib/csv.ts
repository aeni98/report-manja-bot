import { parse } from "csv-parse/sync";

export interface SheetRow {
  WONUM: string;               // B
  CRMORDERTYPE: string;        // C
  STO: string;                 // G
  TGL_MANJA: string;           // V
  STATUS: string;              // AG
  KETERANGAN_PI: string;       // BC
  AO: string;                  // BH
  UMUR: string;                // BJ
  KATEGORI_PI: string;         // BK
  XCHECK_SHEET_ORDER: string;  // BL
  SYMTOMS: string;             // BM
  HSA: string;                 // BN
}

type Raw = string[][];

let cache: { at: number; rows: SheetRow[] } | null = null;
const CACHE_MS = 60_000;

function colIdx(letter: string): number {
  let idx = 0;
  for (let i = 0; i < letter.length; i++) {
    idx = idx * 26 + (letter.charCodeAt(i) - 64);
  }
  return idx - 1;
}

const IDX = {
  B: colIdx("B"),
  C: colIdx("C"),
  G: colIdx("G"),
  V: colIdx("V"),
  AG: colIdx("AG"),
  BC: colIdx("BC"),
  BH: colIdx("BH"),
  BJ: colIdx("BJ"),
  BK: colIdx("BK"),
  BL: colIdx("BL"),
  BM: colIdx("BM"),
  BN: colIdx("BN"),
} as const;

function cell(row: string[], i: number): string {
  return (row[i] ?? "").toString().trim();
}

function mapRow(r: string[]): SheetRow {
  return {
    WONUM: cell(r, IDX.B),
    CRMORDERTYPE: cell(r, IDX.C),
    STO: cell(r, IDX.G),
    TGL_MANJA: cell(r, IDX.V),
    STATUS: cell(r, IDX.AG),
    KETERANGAN_PI: cell(r, IDX.BC),
    AO: cell(r, IDX.BH),
    UMUR: cell(r, IDX.BJ),
    KATEGORI_PI: cell(r, IDX.BK),
    XCHECK_SHEET_ORDER: cell(r, IDX.BL),
    SYMTOMS: cell(r, IDX.BM),
    HSA: cell(r, IDX.BN),
  };
}

async function loadFromUrl(url: string): Promise<SheetRow[]> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Fetch CSV failed: ${res.status}`);
  const csv = await res.text();

  const records: Raw = parse(csv, { bom: true });
  if (records.length <= 2) return [];
  const dataRows = records.slice(2);

  return dataRows.map(mapRow).filter((r) => r.AO !== "");
}

export async function getCsvRows(): Promise<SheetRow[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.rows;
  const url = process.env.SHEET_CSV_URL;
  if (!url) throw new Error("Missing SHEET_CSV_URL");
  const rows = await loadFromUrl(url);
  cache = { at: Date.now(), rows };
  return rows;
}

export function findByAO(rows: SheetRow[], ao: string): SheetRow | undefined {
  const key = ao.trim().toUpperCase();
  return rows.find((r) => r.AO.toUpperCase() === key);
}
