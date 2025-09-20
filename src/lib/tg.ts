const BOT_TOKEN: string = process.env.TELEGRAM_BOT_TOKEN ?? "";
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

export interface SendMessageOptions {
  parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
  reply_markup?: unknown;
  disable_web_page_preview?: boolean;
}

export async function tgSendMessage(
  chatId: number | string,
  text: string,
  opts: SendMessageOptions = {}
): Promise<void> {
  const res: Response = await fetch(`${TG_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", ...opts }),
  });
  if (!res.ok) {
    console.error("sendMessage failed", res.status, await res.text().catch(() => ""));
  }
}

export function requireEnv(): void {
  if (!BOT_TOKEN) throw new Error("Missing TELEGRAM_BOT_TOKEN");
}
