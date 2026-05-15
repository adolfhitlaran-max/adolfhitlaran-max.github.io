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
const MODEL = "openai/gpt-4o-mini";

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
  return error instanceof Error ? error.message : String(error);
}

function sanitizeMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((message) => {
      const rawRole = String(message?.role || "user");
      const role = rawRole === "system" || rawRole === "assistant" ? rawRole : "user";
      const content = String(message?.content || "").trim().slice(0, 4000);

      return { role, content };
    })
    .filter((message) => message.content);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders
    });
  }

  if (req.method !== "POST") {
    return jsonResponse({
      error: "Method not allowed",
      details: "Use POST for Archivist AI chat requests."
    }, 405);
  }

  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) {
    return jsonResponse({
      error: "Missing OPENROUTER_API_KEY",
      details: "Set OPENROUTER_API_KEY in the Supabase Edge Function secrets before using Archivist AI."
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

  const messages = sanitizeMessages(body.messages);
  if (!messages.length) {
    return jsonResponse({
      error: "No messages provided",
      details: "Send a JSON body shaped like { \"messages\": [{ \"role\": \"user\", \"content\": \"...\" }] }."
    }, 400);
  }

  const openRouterMessages: ChatMessage[] = [
    {
      role: "system",
      content: "You are Archivist AI for uncensoredmedia.io. Be concise, useful, and help visitors navigate the site's speeches, PDFs, livestreams, forum, games, profiles, and chat."
    },
    ...messages
  ];

  try {
    const openRouterResponse = await fetch(OPENROUTER_URL, {
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
        temperature: 0.5
      })
    });

    const responseText = await openRouterResponse.text();

    if (!openRouterResponse.ok) {
      console.error("OpenRouter request failed:", {
        status: openRouterResponse.status,
        statusText: openRouterResponse.statusText,
        responseText
      });

      return jsonResponse({
        error: "OpenRouter request failed",
        details: responseText || `${openRouterResponse.status} ${openRouterResponse.statusText}`
      }, 502);
    }

    let data: {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };

    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error("OpenRouter JSON parse failed:", {
        responseText,
        error
      });

      return jsonResponse({
        error: "OpenRouter returned invalid JSON",
        details: errorDetails(error)
      }, 502);
    }

    const reply = String(data.choices?.[0]?.message?.content || "").trim();
    if (!reply) {
      console.error("OpenRouter response missing reply:", data);
      return jsonResponse({
        error: "OpenRouter response missing reply",
        details: responseText
      }, 502);
    }

    return jsonResponse({ reply });
  } catch (error) {
    console.error("Archivist AI OpenRouter error:", error);
    return jsonResponse({
      error: "Archivist AI request failed",
      details: errorDetails(error)
    }, 500);
  }
});
