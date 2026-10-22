import { NextResponse } from "next/server";
import { search, isAnswerable } from "@/lib/search";
import { chat, parseJson, RateLimitError } from "@/lib/groq";
import { CATEGORY_LABELS } from "@/lib/situations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Each situation type adds targeted searches so the report covers the whole picture,
// not just the words the user typed.
const CATEGORY_QUERIES = {
  stopped: ["power of police officer to demand production of documents licence registration insurance", "general provision for punishment of offences penalty"],
  echallan: ["penalty fine for the offence", "power of police officer to impound document"],
  accident_minor: ["duty of driver in case of accident and injury", "action in case of vehicular accident", "offences relating to accident penalty"],
  accident_injury: ["duty of driver in case of accident and injury medical treatment", "action in case of vehicular accident", "offences relating to accident penalty", "necessity for insurance against third party risk"],
  seized: ["power of police officer to impound document", "power to detain vehicles used without certificate of registration permit"],
  licence: ["necessity for driving licence", "driving without licence penalty", "renewal of driving licence", "driving despite disqualification penalty"],
  insurance: ["necessity for insurance against third party risk", "driving uninsured vehicle penalty"],
  minor: ["age limit in connection with driving of motor vehicles", "offences by juveniles penalty", "motor vehicle used by a juvenile registration cancelled"],
  lending: ["unauthorized use of vehicles without licence penalty", "owner allows vehicle to be driven by person without licence"],
  helmet: ["wearing of protective headgear", "driving without helmet penalty"],
  drunk: ["driving by a drunken person breath analyser", "drunken driving penalty"],
  speeding: ["limits of speed", "over-speeding penalty", "speed regulation"],
  other: [],
};




const SYSTEM = `You are Lane Law AI, a careful assistant that explains a traffic situation in India to an ordinary rider or driver.
You must use ONLY the numbered SOURCES (Motor Vehicles Act 1988 text, Motor Vehicles (Driving) Regulations 2017, MoRTH 2019 revised penalty table). Never invent law, amounts, deadlines, offices or procedures.

Citations: every item that states law, a penalty or a procedure must end with tags like [S2] or [S1][S4].
If something useful is NOT in the sources, put it in "not_covered" instead of guessing. Do not cite for general common-sense advice; mark such items with "general": true.
Penalty amounts: sources marked [CURRENT - 2019] override [ORIGINAL 1988 TEXT]. Always add that states can set their own compounding fines, so an actual challan may differ.
Write plainly for a non-lawyer. Be honest in the reality check: say what is likely, what is serious, and what is not.

Return JSON only, exactly this shape:
{
 "found": true|false,
 "headline": "one-sentence summary of where the user stands",
 "severity": "low" | "medium" | "high",
 "understanding": "3-5 sentences explaining the situation in plain words",
 "law": [{"point": "what the law says", "cite": "[S1]"}],
 "penalties": [{"offence": "...", "penalty": "...", "cite": "[S2]"}],
 "process": [{"step": "how authorities handle it, in order", "cite": "[S3]"}],
 "reality_check": [{"point": "honest assessment", "general": false, "cite": "[S1]"}],
 "next_steps": [{"step": "what the user should do now", "general": true|false, "cite": "[S2] or empty"}],
 "documents": ["documents to keep ready (only ones named in sources)"],
 "not_covered": ["important questions the documents do not answer"]
}
If the sources say nothing relevant at all, set "found": false, keep arrays empty, and explain in "understanding" that the documents don't cover it.`;

function label(c) {
  if (c.doc === "pen2019") return `2019 revised penalty table (MoRTH), Row ${c.number}: ${c.title} [CURRENT - 2019]`;
  const tag = c.doc === "mva1988" ? " [ORIGINAL 1988 TEXT]" : "";
  const page = c.page ? `, page ${c.page}` : "";
  return `${c.doc_title} — ${c.unit} ${c.number}: ${c.title}${page}${tag}`;
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((d.getTime() - Date.now()) / 86400000);
}

// Compliance flags from the profile -> extra searches + facts for the LLM
function profileFacts(profile = {}, vehicle = {}) {
  const facts = [];
  const queries = [];
  if (profile.ageGroup === "under18") {
    facts.push("The person driving is under 18.");
    queries.push("offences by juveniles penalty", "age limit in connection with driving of motor vehicles");
  }
  const lic = profile.licenceType;
  if (lic === "none") {
    facts.push("The user says they do NOT hold a driving licence.");
    queries.push("driving without licence penalty", "necessity for driving licence");
  } else if (lic === "learner") {
    facts.push("The user holds only a learner's licence.");
    queries.push("learner's licence conditions");
  }
  const ld = daysUntil(profile.licenceExpiry);
  if (ld !== null && ld < 0) {
    facts.push(`The user's driving licence expired ${-ld} days ago.`);
    queries.push("renewal of driving licence", "driving without licence penalty");
  }
  if (vehicle.type) {
    const two = vehicle.type === "two-wheeler";
    if (two && lic === "lmv") facts.push("The vehicle is a two-wheeler but the user's licence is for cars only (LMV).");
    if (!two && lic === "mcwg") facts.push("The vehicle is a car but the user's licence is for motorcycles only.");
  }
  const id = daysUntil(vehicle.insuranceExpiry);
  if (vehicle.insuranceExpiry && id !== null && id < 0) {
    facts.push(`The vehicle's insurance expired ${-id} days ago.`);
    queries.push("driving uninsured vehicle penalty", "necessity for insurance against third party risk");
  }
  if (vehicle.insurance === "none") {
    facts.push("The vehicle has no insurance.");
    queries.push("driving uninsured vehicle penalty");
  }
  const pd = daysUntil(vehicle.pucExpiry);
  if (vehicle.pucExpiry && pd !== null && pd < 0) {
    facts.push(`The vehicle's pollution under control (PUC) certificate expired ${-pd} days ago.`);
    queries.push("pollution under control certificate air pollution standards penalty");
  }
  if (vehicle.owner && vehicle.owner !== "self") {
    facts.push(`The vehicle is owned by: ${vehicle.owner}.`);
    queries.push("unauthorized use of vehicles without licence");
  }
  return { facts, queries };
}

export async function POST(req) {
  const t0 = Date.now();
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const profile = body.profile || {};
  const vehicle = body.vehicle || {};
  const s = body.situation || {};
  const category = CATEGORY_QUERIES[s.category] ? s.category : "other";
  const description = String(s.description || "").slice(0, 1500);
  const vType = ["two-wheeler", "four-wheeler"].includes(vehicle.type) ? vehicle.type : "all";

  const { facts, queries: flagQueries } = profileFacts(profile, vehicle);
  const queries = [
    `${CATEGORY_LABELS[category]} ${description}`.trim(),
    ...CATEGORY_QUERIES[category],
    ...flagQueries,
  ].filter(Boolean);

  // Multi-query retrieval: merge, keep the best score per chunk
  const best = new Map();
  let anyAnswerable = false;
  for (const q of queries) {
    const r = search(q, { vehicle: vType, k: 4 });
    if (isAnswerable(r)) anyAnswerable = true;
    r.results.forEach((x, i) => {
      // first query (the user's own words) gets a small priority bonus
      const w = x.relative * (q === queries[0] ? 1.15 : 1) - i * 0.02;
      const prev = best.get(x.id);
      if (!prev || w > prev.w) best.set(x.id, { ...x, w, query: q });
    });
  }
  const ranked = [...best.values()].sort((a, b) => b.w - a.w).slice(0, 9);

  const sources = ranked.map((r, i) => ({
    tag: `S${i + 1}`,
    id: r.id,
    score: Number(r.w.toFixed(3)),
    query: r.query,
    doc: r.chunk.doc,
    docTitle: r.chunk.doc_title,
    unit: r.chunk.unit,
    number: r.chunk.number,
    title: r.chunk.title,
    page: r.chunk.page,
    url: r.chunk.source_url,
    current: !!r.chunk.current,
    text: r.chunk.text,
  }));

  if (!anyAnswerable || !sources.length) {
    return NextResponse.json({
      report: {
        found: false,
        headline: "Our documents don't cover this situation.",
        severity: "low",
        understanding:
          "Lane Law AI only answers from the Motor Vehicles Act 1988, the Driving Regulations 2017 and MoRTH's 2019 penalty table. Nothing in them matched this situation closely enough to give a grounded answer.",
        law: [], penalties: [], process: [], reality_check: [], next_steps: [], documents: [],
        not_covered: [description || CATEGORY_LABELS[category]],
      },
      sources, queries, facts, model: null, latencyMs: Date.now() - t0,
    });
  }

  const context = ranked
    .map((r, i) => `[S${i + 1}] ${label(r.chunk)}\n${r.chunk.text.slice(0, 1100)}`)
    .join("\n\n---\n\n");

  const userMsg = `USER PROFILE (from the user, not verified):
- City/State: ${profile.city || "not given"}
- Age group: ${profile.ageGroup === "under18" ? "under 18" : "18 or older"}
- Licence: ${profile.licenceType || "not given"}${profile.licenceExpiry ? `, valid till ${profile.licenceExpiry}` : ""}

VEHICLE:
- Type: ${vehicle.type || "not given"}; Model: ${vehicle.model || "not given"}; Fuel: ${vehicle.fuel || "not given"}; Year: ${vehicle.year || "not given"}
- Insurance: ${vehicle.insurance || "not given"}${vehicle.insuranceExpiry ? `, valid till ${vehicle.insuranceExpiry}` : ""}
- PUC: ${vehicle.pucExpiry ? `valid till ${vehicle.pucExpiry}` : "not given"}; Owner: ${vehicle.owner || "self"}

COMPLIANCE FLAGS: ${facts.length ? facts.join(" ") : "none"}

SITUATION: ${CATEGORY_LABELS[category]}
When/where: ${s.date || "not given"}, ${s.place || "not given"}
What happened: ${description || "(no details)"}
User's main worry: ${String(s.worry || "").slice(0, 400) || "(not given)"}

SOURCES:

${context}`;

  try {
    const out = await chat(
      [
        { role: "system", content: SYSTEM },
        { role: "user", content: userMsg },
      ],
      { maxTokens: 1700 }
    );
    const report = parseJson(out.content);
    if (!report) throw new Error("bad_json");
    // keep only valid citation tags
    const valid = new Set(sources.map((x) => x.tag));
    const fix = (c) => (String(c || "").match(/S\d+/g) || []).filter((t) => valid.has(t)).map((t) => `[${t}]`).join("");
    for (const key of ["law", "penalties", "process", "reality_check", "next_steps"]) {
      report[key] = (Array.isArray(report[key]) ? report[key] : []).map((x) => ({ ...x, cite: fix(x.cite) }));
    }
    report.documents = Array.isArray(report.documents) ? report.documents : [];
    report.not_covered = Array.isArray(report.not_covered) ? report.not_covered : [];
    return NextResponse.json({ report, sources, queries, facts, model: out.model, latencyMs: Date.now() - t0 });
  } catch (e) {
    if (e instanceof RateLimitError)
      return NextResponse.json({ error: "rate_limited", retryAfter: e.retryAfter, sources }, { status: 429 });
    if (e.message === "missing_key")
      return NextResponse.json({ error: "missing_key", message: "GROQ_API_KEY is not set on the server." }, { status: 500 });
    console.error(e);
    return NextResponse.json({ error: "llm_failed", message: String(e.message).slice(0, 200), sources }, { status: 502 });
  }
}
