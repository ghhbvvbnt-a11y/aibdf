import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

// Basic in-memory rate limit (per server instance) to protect the API key from abuse.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > 10;
}
const EX = ["mcq", "tf", "fill", "short", "essay", "section", "pbreak"];
const FM = ["text", "long", "phone", "email", "date", "select", "radio", "check", "sign", "section", "pbreak"];

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return NextResponse.json({ error: "طلبات كثيرة، حاول بعد دقيقة" }, { status: 429 });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ error: "ANTHROPIC_API_KEY غير مضبوط على الخادم" }, { status: 503 });
  const { prompt, doc } = await req.json().catch(() => ({}));
  if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 2000)
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  const kind = doc?.kind === "exam" ? "exam" : "form";
  const allowed = kind === "exam" ? EX : FM;
  const system = `You build Arabic ${kind === "exam" ? "exams" : "forms"}. Reply with JSON only, no markdown: {"title":string,"items":[{"t":type,"q":string,"opts":string[],"ans":number|string,"pts":number,"req":boolean}]}. Allowed t values: ${allowed.join(", ")}. For mcq, ans is the 0-based index of the correct option; for tf, ans is 0 (true) or 1 (false); for fill/short/essay, ans is a model answer string. opts is only for mcq/select/radio/check. Apply the requested change to the current document and return the full updated items list. Write in Arabic.`;
  if (JSON.stringify(doc ?? {}).length > 60_000)
    return NextResponse.json({ error: "المستند كبير جدًا" }, { status: 413 });
  let r: Response;
  try {
    r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal: AbortSignal.timeout(55_000),
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
      max_tokens: 4000,
      system,
      messages: [{ role: "user", content: `Current document: ${JSON.stringify(doc ?? {})}\nRequest: ${prompt}` }],
    }),
    });
  } catch {
    return NextResponse.json({ error: "انتهت مهلة الاتصال بخدمة الذكاء الاصطناعي" }, { status: 504 });
  }
  if (!r.ok) return NextResponse.json({ error: "فشل الاتصال بخدمة الذكاء الاصطناعي" }, { status: 502 });
  const data = await r.json();
  const text: string = (data.content ?? []).map((c: any) => c.text ?? "").join("").replace(/```json|```/g, "").trim();
  const a = text.indexOf("{"), b = text.lastIndexOf("}");
  const body = a >= 0 && b > a ? text.slice(a, b + 1) : text;
  try {
    const j = JSON.parse(body);
    if (!Array.isArray(j.items)) throw new Error("bad");
    const items = (j.items ?? []).filter((x: any) => allowed.includes(x.t)).map((x: any) => ({
      t: x.t, q: String(x.q ?? ""), opts: Array.isArray(x.opts) ? x.opts.map(String) : [],
      ans: x.ans ?? "", pts: Number(x.pts) || 0, req: !!x.req,
    }));
    return NextResponse.json({ title: j.title, items });
  } catch {
    return NextResponse.json({ error: "رد غير صالح من النموذج" }, { status: 502 });
  }
}
