import { NextRequest, NextResponse } from "next/server";
import {
  chatCompletion,
  chatStreamResponse,
  GroqError,
  listModels,
  type ChatMessage,
} from "@/lib/ai/groqClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  action: "chat" | "generate" | "models" | "test";
  apiKey?: string;
  model?: string;
  system?: string;
  messages?: ChatMessage[];
  prompt?: string;
  json?: boolean;
}

// NOTE: the key is read from the request and used only to call Groq. It is
// never logged, never persisted server-side, and never returned to the client.
export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const apiKey = body.apiKey?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "No API key provided. Link the Architect in Settings." }, { status: 401 });
  }

  try {
    switch (body.action) {
      case "models": {
        const models = await listModels(apiKey);
        return NextResponse.json({ models });
      }

      case "test": {
        const models = await listModels(apiKey);
        return NextResponse.json({ ok: true, count: models.length });
      }

      case "generate": {
        const model = body.model || "llama-3.3-70b-versatile";
        const messages: ChatMessage[] = [
          ...(body.system ? [{ role: "system", content: body.system } as ChatMessage] : []),
          { role: "user", content: body.prompt ?? "" },
        ];
        const content = await chatCompletion(apiKey, model, messages, {
          temperature: 0.6,
          maxTokens: 900,
          json: true,
        });
        return NextResponse.json({ content });
      }

      case "chat":
      default: {
        const model = body.model || "llama-3.3-70b-versatile";
        const messages: ChatMessage[] = [
          ...(body.system ? [{ role: "system", content: body.system } as ChatMessage] : []),
          ...(body.messages ?? []),
        ];
        const upstream = await chatStreamResponse(apiKey, model, messages, { maxTokens: 1024 });
        return new Response(relayTextStream(upstream), {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store",
          },
        });
      }
    }
  } catch (err) {
    if (err instanceof GroqError) {
      const status = err.status === 429 ? 429 : err.status >= 400 && err.status < 500 ? err.status : 502;
      const msg =
        err.status === 429
          ? "The Architect is rate-limited (Groq free tier). Wait a moment and retry."
          : err.status === 401
            ? "Invalid Groq API key."
            : "The Architect could not be reached.";
      return NextResponse.json({ error: msg }, { status });
    }
    return NextResponse.json({ error: "Unexpected error contacting the Architect." }, { status: 500 });
  }
}

/** Parses Groq SSE and re-emits only the text deltas as a plain-text stream. */
function relayTextStream(upstream: Response): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const reader = upstream.body!.getReader();
  let buffer = "";

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") {
          controller.close();
          return;
        }
        try {
          const json = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] };
          const text = json.choices?.[0]?.delta?.content;
          if (text) controller.enqueue(encoder.encode(text));
        } catch {
          /* ignore keep-alive / partial lines */
        }
      }
    },
    cancel() {
      void reader.cancel();
    },
  });
}
