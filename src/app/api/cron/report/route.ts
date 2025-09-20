import { NextResponse } from "next/server";
import { getCsvRows, type SheetRow } from "@/lib/csv";
import { formatPics } from "@/lib/pic";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const GROUP_IDS = (process.env.GROUP_IDS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const SHEET_VIEW_URL = process.env.SHEET_VIEW_URL ?? "";

function nowJakartaString(): string {
  const dt = new Date();
  const fmt = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(dt);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("day")}/${get("month")}/${get("year")} ${get("hour")}:${get("minute")}`;
}

async function sendToGroup(chatId: string, text: string): Promise<void> {
  await fetch(`${TG_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  }).catch((e) => console.error("sendMessage error:", e));
}

export async function GET() {
  try {
    if (!BOT_TOKEN) throw new Error("Missing TELEGRAM_BOT_TOKEN");
    if (!GROUP_IDS.length) throw new Error("No GROUP_IDS defined");

    const rows: SheetRow[] = await getCsvRows();
    const byStatus: Map<string, Map<string, number>> = new Map();
    for (const r of rows) {
      const status = r.STATUS || "-";
      const hsa = r.HSA || "-";
      if (!byStatus.has(status)) byStatus.set(status, new Map());
      const mapHsa = byStatus.get(status)!;
      mapHsa.set(hsa, (mapHsa.get(hsa) ?? 0) + 1);
    }

    const ts = nowJakartaString();
    const lines: string[] = [`<b>REPORT • ${ts}</b>`, ""];

    for (const [status, hsaMap] of byStatus) {
      const sorted = Array.from(hsaMap.entries())
        .map(([hsa, count]) => ({ hsa, count }))
        .sort((a, b) => b.count - a.count || a.hsa.localeCompare(b.hsa));

      lines.push(status);
      for (const { hsa, count } of sorted) {
        const pics = formatPics(hsa);
        const entry = pics ? `${hsa} — ${count}  | ${pics}` : `${hsa} — ${count}`;
        lines.push(entry);
      }
      lines.push("");
    }

    lines.push("─────────────────────");
    lines.push("Silakan japri bot untuk melihat detail ordernya");
    if (SHEET_VIEW_URL) lines.push(`atau akses link berikut:\n${SHEET_VIEW_URL}`);

    const msg = lines.join("\n").trim();

    for (const gid of GROUP_IDS) {
      await sendToGroup(gid, msg);
    }

    return NextResponse.json({ ok: true, sent: GROUP_IDS.length });
  } catch (e) {
    console.error("cron/report error:", e);
    return NextResponse.json({ ok: false, error: String((e as Error).message) }, { status: 500 });
  }
}
