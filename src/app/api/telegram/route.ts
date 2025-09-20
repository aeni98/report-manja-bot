import { NextRequest, NextResponse } from "next/server";
import { tgSendMessage, requireEnv } from "@/lib/tg";
import { getCsvRows, findByAO, type SheetRow } from "@/lib/csv";

export const runtime = "nodejs";

function ok() { return NextResponse.json({ ok: true }); }
function checkSecret(req: NextRequest): boolean {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected) return true;
  return req.headers.get("x-telegram-bot-api-secret-token") === expected;
}
function parseCommand(text: string) {
  const t = (text ?? "").trim();
  if (!t.startsWith("/")) return { cmd: t.toLowerCase(), args: "" };
  const [head, ...rest] = t.split(/\s+/);
  return { cmd: head.split("@")[0].toLowerCase(), args: rest.join(" ") };
}

function formatOrder(r: SheetRow): string {
  return [
    r.AO,
    r.WONUM,
    r.CRMORDERTYPE,
    r.STO,
    r.TGL_MANJA,
    r.KATEGORI_PI,
    r.UMUR,
    r.SYMTOMS,
    r.XCHECK_SHEET_ORDER,
    r.KETERANGAN_PI,
  ].filter(Boolean).join(" | ");
}

export async function POST(req: NextRequest) {
  try {
    requireEnv();
    if (!checkSecret(req)) return NextResponse.json({ ok: false }, { status: 401 });

    const update = await req.json();
    const msg = update?.message ?? update?.edited_message;
    if (!msg?.chat?.id) return ok();

    const chatId: number = msg.chat.id as number;
    const text: string = msg.text ?? "";
    const { cmd, args } = parseCommand(text);

    if (cmd === "/start") {
      await tgSendMessage(chatId, "<b>Bot siap!</b>\nGunakan tombol:\nREPORT / CEK ORDER", {
        reply_markup: {
          keyboard: [[{ text: "REPORT" }, { text: "CEK ORDER" }]],
          resize_keyboard: true,
        },
      });
      return ok();
    }

    if (cmd === "report" || cmd === "/report") {
      await tgSendMessage(chatId, "Gunakan menu REPORT di grup.\nUntuk detail order, japri bot dengan /cek <AO>.");
      return ok();
    }

    if (cmd === "cek order") {
      await tgSendMessage(chatId, "Kirimkan AO yang ingin dicek.\nContoh: <code>/cek AOi4250920...</code>");
      return ok();
    }

    if (cmd === "/cek") {
      const ao = args.trim();
      if (!ao) {
        await tgSendMessage(chatId, "Format: <code>/cek &lt;AO&gt;</code>");
        return ok();
      }
      const rows = await getCsvRows();
      const row = findByAO(rows, ao);
      if (!row) {
        await tgSendMessage(chatId, `AO <code>${ao}</code> tidak ditemukan.`);
        return ok();
      }
      await tgSendMessage(chatId, formatOrder(row));
      return ok();
    }

    if (text.trim()) {
      await tgSendMessage(chatId, "Perintah tidak dikenal. Gunakan /start.");
    }
    return ok();
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: String((e as Error).message) }, { status: 500 });
  }
}
