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
const FALLBACK_REPLY = "I had a thought and immediately lost it. Try again, genius.";
const VALID_PAGES = [
  { name: "Home", path: "/", keywords: ["home", "main page", "landing"] },
  { name: "Profile", path: "/pages/profile.html", keywords: ["profile", "account"] },
  { name: "Login", path: "/pages/login.html", keywords: ["login", "log in", "sign in", "signin"] },
  { name: "Forum", path: "/pages/forum.html", keywords: ["forum", "thread", "threads", "post", "posts"] },
  { name: "Games / Leaderboards", path: "/pages/games.html", keywords: ["games", "game", "leaderboard", "leaderboards", "scores", "high score", "high scores"] },
  { name: "Live Stream", path: "/pages/live.html", keywords: ["live", "stream", "livestream", "broadcast"] },
  { name: "Chat Rooms", path: "/pages/chat.html", keywords: ["chat", "chat rooms", "room", "rooms"] },
  { name: "Audio Archive / Speeches", path: "/pages/archive.html", keywords: ["speeches", "speech", "audio", "archive", "old speeches", "historical speeches"] }
];

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

function lastUserMessage(messages: ChatMessage[]) {
  return [...messages].reverse().find((message) => message.role === "user")?.content || "";
}

function hasNavigationIntent(text: string) {
  return /\b(open|go|take me|show me|pull up|navigate|send me|bring me)\b/i.test(text);
}

function hasLocationIntent(text: string) {
  return /\b(where|which page|what page|find|located)\b/i.test(text);
}

function pageForMessage(text: string) {
  const clean = text.toLowerCase();
  return VALID_PAGES.find((page) => page.keywords.some((keyword) => clean.includes(keyword))) || null;
}

function routeReply(page: { name: string; path: string }) {
  if (page.path === "/pages/archive.html") {
    return "Yeah, genius, opening the archive.";
  }

  if (page.path === "/pages/games.html") {
    return "Fine, opening Games. Try not to get lost.";
  }

  if (page.path === "/") {
    return "Fine, going home. Brave journey.";
  }

  const label = page.name.replace(" / ", " ");
  return `Fine, opening ${label}. Try not to get lost.`;
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
      text?: unknown;
      message?: {
        content?: unknown;
        reasoning?: unknown;
      };
    }>;
  };

  const choice = root.choices?.[0];
  const content = choice?.message?.content;
  if (typeof content === "string") return content.trim();

  if (Array.isArray(content)) {
    const joined = content
      .map((part) => {
        if (typeof part === "string") return part;
        if (typeof part === "object" && part !== null && "text" in part) {
          return String((part as { text?: unknown }).text || "");
        }
        return "";
      })
      .join("")
      .trim();

    if (joined) return joined;
  }

  if (typeof choice?.message?.reasoning === "string" && choice.message.reasoning.trim()) {
    console.error("OpenRouter returned reasoning without content; using safe fallback.");
    return FALLBACK_REPLY;
  }

  if (typeof choice?.text === "string" && choice.text.trim()) {
    return choice.text.trim();
  }

  return FALLBACK_REPLY;
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

  const userRequest = lastUserMessage(messages);
  const requestedPage = pageForMessage(userRequest);
  if (requestedPage && (hasNavigationIntent(userRequest) || requestedPage.path === "/pages/archive.html")) {
    return jsonResponse({
      reply: routeReply(requestedPage),
      navigateTo: requestedPage.path
    });
  }

  if (requestedPage && hasLocationIntent(userRequest)) {
    return jsonResponse({
      reply: `${requestedPage.name} is at ${requestedPage.path}. The button is not hiding, detective.`
    });
  }

  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) {
    console.error("Missing OPENROUTER_API_KEY");
    return jsonResponse({
      error: "Missing OPENROUTER_API_KEY"
    }, 500);
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
        "Use ONLY these valid pages:",
        "- Home: /",
        "- Profile: /pages/profile.html",
        "- Login: /pages/login.html",
        "- Forum: /pages/forum.html",
        "- Games / Leaderboards: /pages/games.html",
        "- Live Stream: /pages/live.html",
        "- Chat Rooms: /pages/chat.html",
        "- Audio Archive / Speeches: /pages/archive.html",
        "Behavior rules:",
        "Do not invent pages, features, downloads, PDFs, or sections that are not in the list.",
        "Do not claim the archive or site is unavailable unless the API request itself fails.",
        "If a user asks where something is, give the exact page path.",
        "If users ask for speeches, audio, archive, old speeches, or historical speeches, route them to /pages/archive.html.",
        "If a user asks to open, go, take me, show me, or pull up a page, the function should return JSON with reply and navigateTo using one valid path.",
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
