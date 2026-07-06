import { NextRequest } from "next/server";
import { streamChat, type ChatMessage } from "@/lib/llm";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_HISTORY = 20; // messages sent to the model (trims older turns)
const MAX_MESSAGE_CHARS = 4000; // per-message cap to bound token cost

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isValidMessages(x: unknown): x is ChatMessage[] {
  if (!Array.isArray(x) || x.length === 0) return false;
  return x.every(
    (m) =>
      m &&
      typeof m === "object" &&
      (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string",
  );
}

export async function POST(req: NextRequest) {
  // Provider key check up front (before we start streaming a 200 response).
  const provider = (process.env.LLM_PROVIDER || "anthropic").toLowerCase();
  if (provider === "anthropic" && !process.env.ANTHROPIC_API_KEY) {
    return json(
      { error: "Server is missing ANTHROPIC_API_KEY. Add it to .env.local (and Vercel env)." },
      500,
    );
  }

  // Rate limit by IP.
  const { allowed, retryAfterSeconds } = checkRateLimit(clientIp(req));
  if (!allowed) {
    return new Response(
      JSON.stringify({ error: "You're sending messages too fast. Please wait a moment." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfterSeconds),
        },
      },
    );
  }

  // Parse + validate.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const raw = (body as { messages?: unknown })?.messages;
  if (!isValidMessages(raw)) {
    return json({ error: "Expected a non-empty 'messages' array of {role, content}." }, 400);
  }

  // Normalize: trim, cap length, drop empties, keep only the most recent turns,
  // and ensure the last message is from the user.
  const cleaned: ChatMessage[] = raw
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS).trim() }))
    .filter((m) => m.content.length > 0)
    .slice(-MAX_HISTORY);

  if (cleaned.length === 0 || cleaned[cleaned.length - 1].role !== "user") {
    return json({ error: "The last message must be a non-empty user message." }, 400);
  }

  try {
    const stream = streamChat(cleaned);
    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return json({ error: `Failed to start the response: ${message}` }, 500);
  }
}
