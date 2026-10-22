import { NextResponse } from "next/server";
import { search, isAnswerable } from "@/lib/search";
import { chat, parseJson, RateLimitError } from "@/lib/groq";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NOT_FOUND = "I don't know — this isn't covered in the documents I have (Motor Vehicles Act 1988, Driving Regulations 2017 and the 2019 revised penalties).";

const SYSTEM = `You are Lane Law AI, an assistant that explains Indian traffic law to riders and drivers.
Answer ONLY from the numbered SOURCES provided. Never use outside knowledge.

Rules:
1. Every factual sentence must end with a citation tag like [S1] or [S2][S3] that points to the source it came from.
2. If the SOURCES do not contain the answer, set "found": false and reply exactly: "${NOT_FOUND}"
   Questions about specific companies, prices, current events, people, a particular city's present-day challan amount, or anything not written in the SOURCES are NOT answerable.
3. Penalty amounts: sources marked [CURRENT - 2019] override amounts in sources marked [ORIGINAL 1988 TEXT]. Give the 2019 amount, and you may note the old amount was revised.
4. When you state a fine, add one short line: "States can set their own compounding fines, so the amount on an actual challan may differ."
5. Be short and plain: 2-6 sentences or a few bullets. Start with the direct answer. Name the section/regulation number in words too (e.g. "Section 185").

Return JSON only: {"found": true|false, "answer": "markdown text with [S#] tags", "used": ["S1","S3"]}`;

const REWRITE = `Rewrite the user's question into a short search query using the vocabulary of India's Motor Vehicles Act (e.g. "bike" -> "motor cycle", "drunk" -> "drunken driving", "challan" -> "penalty fine"). Return JSON only: {"query": "..."}`;

function label(c) {
  if (c.doc === "pen2019") return `2019 revised penalty table (MoRTH), Row ${c.number}: ${c.title} [CURRENT - 2019]`;
  const tag = c.doc === "mva1988" ? " [ORIGINAL 1988 TEXT]" : "";
  const page = c.page ? `, page ${c.page}` : "";
  return `${c.doc_title} — ${c.unit} ${c.number}: ${c.title}${page}${tag}`;
}

function isFollowUp(q) {
  const words = q.trim().split(/\s+/).length;
  return words <= 8 || /\b(it|that|this|they|those|same|again|second|what about|and if|also)\b/i.test(q);
}

function sourcePayload(results) {
  return results.map((r, i) => ({
    tag: `S${i + 1}`,
    id: r.id,
    rank: r.rank,
    score: r.score,
    relative: r.relative,
    linked: r.linked,
    doc: r.chunk.doc,
    docTitle: r.chunk.doc_title,
    unit: r.chunk.unit,
    number: r.chunk.number,
    title: r.chunk.title,
    page: r.chunk.page,
    url: r.chunk.source_url,
    vehicle: r.chunk.vehicle,
    current: !!r.chunk.current,
    text: r.chunk.text,
  }));
}

export async function POST(req) {
  const t0 = Date.now();
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const question = String(body.question || "").trim().slice(0, 500);
  const vehicle = ["two-wheeler", "four-wheeler"].includes(body.vehicle) ? body.vehicle : "all";
  const history = Array.isArray(body.history) ? body.history.slice(-2) : [];
  if (!question) return NextResponse.json({ error: "empty_question" }, { status: 400 });

  // 1) Retrieval. Short follow-ups ("and for a second offence?") borrow the previous question.
  const prev = history.length ? String(history[history.length - 1].q || "") : "";
  const retrievalQuery = prev && isFollowUp(question) ? `${prev} ${question}` : question;
  let r = search(retrievalQuery, { vehicle, k: 6 });
  let rewritten = null;

  try {
    // 2) Weak match -> let the LLM rewrite the query into legal vocabulary, then retry once.
    if (!isAnswerable(r)) {
      let q2 = null;
      try {
        const rw = await chat(
          [
            { role: "system", content: REWRITE },
            { role: "user", content: retrievalQuery },
          ],
          { maxTokens: 120 }
        );
        q2 = parseJson(rw.content)?.query;
      } catch {
        // rewrite is an optional upgrade; fall through to the refusal gate
      }
      if (q2) {
        const r2 = search(q2, { vehicle, k: 6 });
        rewritten = q2;
        if (isAnswerable(r2) || r2.topScore > r.topScore) r = r2;
      }
    }

    const sources = sourcePayload(r.results);
    const retrieval = {
      query: retrievalQuery,
      rewritten,
      expansions: r.expansions,
      topScore: r.topScore,
      coverage: r.coverage,
      penaltyIntent: r.penaltyIntent,
      vehicle,
    };

    // 3) Still nothing relevant -> refuse without spending an LLM call on generation.
    if (!isAnswerable(r)) {
      return NextResponse.json({
        found: false,
        answer: NOT_FOUND,
        used: [],
        sources,
        retrieval,
        model: null,
        latencyMs: Date.now() - t0,
        gate: "retrieval",
      });
    }

    // 4) Grounded generation.
    const context = sources
      .map((s) => `[${s.tag}] ${label(r.results[Number(s.tag.slice(1)) - 1].chunk)}\n${s.text.slice(0, 1400)}`)
      .join("\n\n---\n\n");
    const convo = history
      .map((h) => `Earlier question: ${h.q}\nEarlier answer: ${String(h.a || "").slice(0, 400)}`)
      .join("\n\n");

    const out = await chat(
      [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `${convo ? convo + "\n\n" : ""}SOURCES:\n\n${context}\n\nQUESTION: ${question}`,
        },
      ],
      { maxTokens: 900 }
    );
    const parsed = parseJson(out.content) || { found: true, answer: out.content, used: [] };
    let answer = String(parsed.answer || "").trim();
    let found = parsed.found !== false && !/^I don['’]t know/i.test(answer);
    if (!found) answer = NOT_FOUND;

    const validTags = new Set(sources.map((s) => s.tag));
    const cited = [...new Set((answer.match(/\[S\d+\]/g) || []).map((t) => t.slice(1, -1)))].filter((t) =>
      validTags.has(t)
    );
    const used = found ? [...new Set([...(parsed.used || []).filter((t) => validTags.has(t)), ...cited])] : [];

    return NextResponse.json({
      found,
      answer,
      used,
      grounded: found ? cited.length > 0 : true,
      sources,
      retrieval,
      model: out.model,
      latencyMs: Date.now() - t0,
      gate: "llm",
    });
  } catch (e) {
    if (e instanceof RateLimitError) {
      return NextResponse.json(
        { error: "rate_limited", retryAfter: e.retryAfter, sources: sourcePayload(r.results) },
        { status: 429 }
      );
    }
    if (e.message === "missing_key") {
      return NextResponse.json(
        { error: "missing_key", message: "GROQ_API_KEY is not set on the server.", sources: sourcePayload(r.results) },
        { status: 500 }
      );
    }
    console.error(e);
    return NextResponse.json(
      { error: "llm_failed", message: String(e.message).slice(0, 200), sources: sourcePayload(r.results) },
      { status: 502 }
    );
  }
}
