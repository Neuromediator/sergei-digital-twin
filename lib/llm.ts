import Anthropic from "@anthropic-ai/sdk";
import { config } from "@/data/config";
import { PERSONA_AND_RULES, buildProfileBlock, languageDirective } from "@/lib/systemPrompt";
import { DEFAULT_LOCALE, type Locale } from "@/data/i18n";

// Provider abstraction. `streamChat` returns a web ReadableStream of UTF-8 text
// chunks (the answer, token by token). Default provider is Anthropic (Claude
// Haiku 4.5). Set LLM_PROVIDER=groq|cerebras to swap to an OpenAI-compatible
// open-model endpoint for raw speed (see .env.example). The rest of the app
// doesn't care which provider is active.

export type ChatMessage = { role: "user" | "assistant"; content: string };

const encoder = new TextEncoder();

function streamFromAsyncIterable(gen: AsyncGenerator<string>): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { value, done } = await gen.next();
      if (done) {
        controller.close();
        return;
      }
      if (value) controller.enqueue(encoder.encode(value));
    },
    async cancel() {
      await gen.return?.(undefined);
    },
  });
}

// ---- Anthropic (default) ------------------------------------------------------

// Hybrid model routing: Haiku for English (cheap/fast), Sonnet 5 for Estonian &
// Russian (much stronger grammar in morphologically rich languages).
function modelForLocale(locale: Locale): "claude-haiku-4-5" | "claude-sonnet-5" {
  return locale === "en" ? "claude-haiku-4-5" : "claude-sonnet-5";
}

async function* anthropicDeltas(
  messages: ChatMessage[],
  locale: Locale,
): AsyncGenerator<string> {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY
  const model = modelForLocale(locale);

  const params: Anthropic.MessageStreamParams = {
    model,
    max_tokens: 1024,
    // Persona/rules first (stable), then the profile marked for prompt caching,
    // then the per-locale language directive AFTER the cache breakpoint so the
    // cached prefix (persona + profile) is identical across languages.
    system: [
      { type: "text", text: PERSONA_AND_RULES },
      { type: "text", text: buildProfileBlock(), cache_control: { type: "ephemeral" } },
      { type: "text", text: languageDirective(locale) },
    ],
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  };

  // Sonnet 5 runs adaptive thinking by default; disable it to keep chat snappy
  // (grammar quality doesn't need thinking). Haiku doesn't accept the param.
  if (model === "claude-sonnet-5") {
    params.thinking = { type: "disabled" };
  }

  const stream = client.messages.stream(params);

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      yield event.delta.text;
    }
  }
}

// ---- OpenAI-compatible (Groq / Cerebras) -------------------------------------

type OpenAICompatConfig = {
  baseUrl: string;
  apiKey: string | undefined;
  model: string;
};

function openaiCompatConfig(provider: "groq" | "cerebras"): OpenAICompatConfig {
  if (provider === "groq") {
    return {
      baseUrl: "https://api.groq.com/openai/v1",
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    };
  }
  return {
    baseUrl: "https://api.cerebras.ai/v1",
    apiKey: process.env.CEREBRAS_API_KEY,
    model: process.env.CEREBRAS_MODEL || "llama-3.3-70b",
  };
}

async function* openaiCompatDeltas(
  provider: "groq" | "cerebras",
  messages: ChatMessage[],
  locale: Locale,
): AsyncGenerator<string> {
  const { baseUrl, apiKey, model } = openaiCompatConfig(provider);
  if (!apiKey) {
    throw new Error(
      `LLM_PROVIDER=${provider} but the ${provider === "groq" ? "GROQ_API_KEY" : "CEREBRAS_API_KEY"} env var is not set.`,
    );
  }

  const system = `${PERSONA_AND_RULES}\n\n${buildProfileBlock()}\n\n${languageDirective(locale)}`;
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      stream: true,
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`${provider} request failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE: events separated by newlines, each "data: {json}" or "data: [DONE]".
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta) yield delta;
      } catch {
        // ignore keep-alive / partial lines
      }
    }
  }
}

// ---- Public entry point -------------------------------------------------------

export function streamChat(
  messages: ChatMessage[],
  locale: Locale = DEFAULT_LOCALE,
): ReadableStream<Uint8Array> {
  const provider = (process.env.LLM_PROVIDER || "anthropic").toLowerCase();

  if (provider === "groq" || provider === "cerebras") {
    return streamFromAsyncIterable(openaiCompatDeltas(provider, messages, locale));
  }
  return streamFromAsyncIterable(anthropicDeltas(messages, locale));
}

export const activeProvider = (process.env.LLM_PROVIDER || "anthropic").toLowerCase();
export const twinName = config.name;
