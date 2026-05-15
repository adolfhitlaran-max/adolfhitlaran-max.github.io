import "@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const jsonHeaders = {
  ...corsHeaders,
  "Content-Type": "application/json"
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openrouter/free";
const OPENROUTER_TIMEOUT_MS = 12000;
const API_MESSAGE_LIMIT = 4;

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders
  });
}

function errorDetails(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch (_jsonError) {
    return "Unknown error";
  }
}

function openRouterError(details: string, status = 500) {
  return jsonResponse({
    error: "OpenRouter request failed",
    details
  }, status);
}

function sanitizeMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((message) => {
      const source = typeof message === "object" && message !== null
        ? (message as Record<string, unknown>)
        : {};
      const rawRole = String(source.role || "user");
      const role: ChatMessage["role"] = rawRole === "system" || rawRole === "assistant" ? rawRole : "user";
      const content = String(source.content || "").trim().slice(0, 4000);

      return { role, content };
    })
    .filter((message) => message.content);
}

function extractReply(data: unknown): string {
  if (typeof data !== "object" || data === null) return "";

  const root = data as {
    choices?: Array<{
      message?: {
        content?: unknown;
      };
    }>;
  };

  const content = root.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (typeof part === "object" && part !== null && "text" in part) {
          return String((part as { text?: unknown }).text || "");
        }
        return "";
      })
      .join("")
      .trim();
  }

  return "";
}

async function handleRequest(req: Request) {
  if (req.method === "OPTIONS") {
    return jsonResponse({ ok: true });
  }

  if (req.method !== "POST") {
    return jsonResponse({
      error: "Method not allowed",
      details: "Use POST for Archivist AI chat requests."
    }, 405);
  }

  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) {
    console.error("Missing OPENROUTER_API_KEY");
    return jsonResponse({
      error: "Missing OPENROUTER_API_KEY"
    }, 500);
  }

  let body: { messages?: unknown };
  try {
    body = await req.json();
  } catch (error) {
    console.error("Archivist AI invalid JSON body:", error);
    return jsonResponse({
      error: "Invalid JSON body",
      details: errorDetails(error)
    }, 400);
  }

  const messages = sanitizeMessages(body.messages).slice(-API_MESSAGE_LIMIT);
  if (!messages.length) {
    console.error("Archivist AI request missing messages:", body);
    return jsonResponse({
      error: "No messages provided",
      details: "Send a JSON body shaped like { \"messages\": [{ \"role\": \"user\", \"content\": \"...\" }] }."
    }, 400);
  }

  const openRouterMessages: ChatMessage[] = [
    {
      role: "system",
      content: [
        "You are Archivist AI for UncensoredMedia.io: a blunt, sarcastic archive desk menace with old internet forum energy.",
        "Keep replies short, direct, and useful. Usually answer in 1-3 sentences.",
        "Tone: playful trash-talk, dry sarcasm, chaotic internet humor, and zero corporate assistant polish.",
        "You can lightly roast confusion, broken buttons, and obvious questions, but always answer correctly.",
        "Do not use genuine hate speech, slurs, threats, targeted harassment, or cruelty about protected traits.",
        "Known site sections:",
        "- Home: /index.html",
        "- Profile: /pages/profile.html",
        "- Login: /pages/login.html",
        "- Forum: /pages/forum.html",
        "- Games: /pages/games.html",
        "- Leaderboards: /pages/games.html",
        "- Live Stream: /pages/live.html",
        "- Chat: /pages/chat.html",
        "- Audio Archive: /pages/archive.html",
        "- AI Assistant: floating widget on every page",
        "Behavior rules:",
        "Do not claim the archive or site is unavailable unless the API request itself fails.",
        "If a user asks where something is, give the exact page path.",
        "If a user asks about PDFs, say PDF/library support is not yet fully built unless a PDF page exists.",
        "Avoid vague outage language or long roleplay bits. Help the user get to the right page or next action, preferably with a quick jab."
      ].join("\n")
    },
    ...messages
  ];

  let openRouterResponse: Response;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS);

  try {
    openRouterResponse = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://uncensoredmedia.io",
        "X-Title": "Uncensored Media Archivist AI"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: openRouterMessages,
        max_tokens: 120,
        temperature: 0.4
      }),
      signal: controller.signal
    });
  } catch (error) {
    console.error("OpenRouter fetch threw:", error);
    if (error instanceof DOMException && error.name === "AbortError") {
      return openRouterError("OpenRouter request timed out after 12 seconds.");
    }

    return openRouterError(errorDetails(error));
  } finally {
    clearTimeout(timeoutId);
  }

  let responseText = "";
  try {
    responseText = await openRouterResponse.text();
  } catch (error) {
    console.error("OpenRouter response text read failed:", error);
    return openRouterError(errorDetails(error));
  }

  if (!openRouterResponse.ok) {
    console.error("OpenRouter request failed:", {
      status: openRouterResponse.status,
      statusText: openRouterResponse.statusText,
      responseText
    });

    return openRouterError(responseText || `${openRouterResponse.status} ${openRouterResponse.statusText}`);
  }

  let data: unknown;
  try {
    data = responseText ? JSON.parse(responseText) : null;
  } catch (error) {
    console.error("OpenRouter JSON parse failed:", {
      responseText,
      error
    });

    return openRouterError(`OpenRouter returned invalid JSON: ${errorDetails(error)}`);
  }

  const reply = extractReply(data);
  if (!reply) {
    console.error("OpenRouter response missing reply:", data);
    return openRouterError(`OpenRouter response missing choices[0].message.content. Raw response: ${responseText}`);
  }

  return jsonResponse({ reply });
}

Deno.serve(async (req) => {
  try {
    return await handleRequest(req);
  } catch (error) {
    console.error("Archivist AI unhandled function error:", error);
    return jsonResponse({
      error: "Archivist AI function failed",
      details: errorDetails(error)
    }, 500);
  }
});
