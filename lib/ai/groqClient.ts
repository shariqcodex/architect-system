// ============================================================================
// Server-side Groq client (OpenAI-compatible). Used ONLY inside the API route
// — the API key never reaches the browser bundle or logs.
// ============================================================================

export const GROQ_BASE = "https://api.groq.com/openai/v1";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function listModels(apiKey: string): Promise<string[]> {
  const res = await fetch(`${GROQ_BASE}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });
  if (!res.ok) throw new GroqError(res.status, await safeText(res));
  const json = (await res.json()) as { data?: { id: string }[] };
  return (json.data ?? [])
    .map((m) => m.id)
    .filter((id) => !/whisper|tts|guard|embedding/i.test(id))
    .sort();
}

export async function chatCompletion(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number; json?: boolean } = {},
): Promise<string> {
  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      model,
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 1024,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) throw new GroqError(res.status, await safeText(res));
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return json.choices?.[0]?.message?.content ?? "";
}

/** Returns the raw streaming Response body for SSE relay. */
export async function chatStreamResponse(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number } = {},
): Promise<Response> {
  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      model,
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 1024,
      stream: true,
    }),
  });
  if (!res.ok) throw new GroqError(res.status, await safeText(res));
  return res;
}

export class GroqError extends Error {
  status: number;
  constructor(status: number, body: string) {
    super(`Groq API error ${status}: ${body.slice(0, 300)}`);
    this.status = status;
    this.name = "GroqError";
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}
