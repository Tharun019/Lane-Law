// Minimal Groq client (OpenAI-compatible endpoint) with model fallback on rate limits.
const URL = "https://api.groq.com/openai/v1/chat/completions";

// First model is the main one; the rest are tried if it is rate-limited or unavailable.
// Override with GROQ_MODEL / GROQ_FALLBACK_MODELS (comma separated) in your env.
export function modelList() {
  const main = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
  const fallbacks = (process.env.GROQ_FALLBACK_MODELS || "openai/gpt-oss-20b,llama-3.3-70b-versatile,llama-3.1-8b-instant")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return [main, ...fallbacks.filter((m) => m !== main)];
}

export class RateLimitError extends Error {
  constructor(retryAfter) {
    super("rate_limited");
    this.retryAfter = retryAfter;
  }
}

async function callOnce(model, messages, { json = true, maxTokens = 900 } = {}) {
  const body = {
    model,
    messages,
    temperature: 0.1,
    max_tokens: maxTokens,
    ...(json ? { response_format: { type: "json_object" } } : {}),
  };
  const res = await fetch(URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (res.ok) {
    const data = await res.json();
    return { content: data.choices?.[0]?.message?.content || "", model, usage: data.usage };
  }
  const text = await res.text();
  const err = new Error(`groq_${res.status}: ${text.slice(0, 300)}`);
  err.status = res.status;
  err.retryAfter = Number(res.headers.get("retry-after")) || null;
  err.jsonUnsupported = res.status === 400 && /response_format|json/i.test(text);
  throw err;
}

export async function chat(messages, opts = {}) {
  if (!process.env.GROQ_API_KEY) throw new Error("missing_key");
  let lastRetry = null;
  for (const model of modelList()) {
    try {
      return await callOnce(model, messages, opts);
    } catch (e) {
      if (e.jsonUnsupported) {
        try {
          return await callOnce(model, messages, { ...opts, json: false });
        } catch (e2) {
          e = e2;
        }
      }
      // 429 = rate limited, 404/400 model_not_found / decommissioned -> try the next model
      if ([429, 404, 400, 503].includes(e.status)) {
        if (e.status === 429) lastRetry = e.retryAfter;
        continue;
      }
      throw e;
    }
  }
  throw new RateLimitError(lastRetry);
}

export function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {}
    }
    return null;
  }
}
