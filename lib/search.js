// Lane Law AI - retrieval.
// BM25 over section title + text, plus:
//  - domain query rewriting (everyday words -> legal terms, e.g. "bike" -> "motor cycle")
//  - intent boosts (fine/penalty questions prefer the current 2019 penalty table)
//  - vehicle filter boosts (two-wheeler / four-wheeler)
//  - amendment linking (a 1988 section pulls in its 2019 revised penalty)
import chunks from "../data/chunks.json";

const STOP = new Set(
  "a an the of to in on for is are was were be been by with or and as at from that this it its if any such which who whom what when where how why do does did can could should would may might shall will i me my we our you your he she they them his her their there here than then so not no yes about into under over per up down out off also all".split(
    " "
  )
);

// Everyday words -> words the Act actually uses. Applied before BM25.
const SYNONYMS = [
  [/\bhelmets?\b/, "helmet protective headgear"],
  [/\b(bike|bikes|scooter|scooty|two[\s-]?wheelers?|motorbike)\b/, "motor cycle two-wheeler"],
  [/\b(car|cars|four[\s-]?wheelers?|jeep|suv)\b/, "motor car light motor vehicle four-wheeler"],
  [/\b(drunk|drink|drinking|alcohol|liquor|booze|dui)\b/, "drunken alcohol drugs influence breath analyser"],
  [/\b(seat\s?belts?)\b/, "safety belt seat belt"],
  [/\b(dl|license|licences|licenses|licence)\b/, "licence driving licence"],
  [/\b(phone|mobile|cellphone|calling|texting)\b/, "mobile telephone communication device"],
  [/\b(insurance|insured|uninsured)\b/, "insurance uninsured third party"],
  [/\b(ambulance|fire\s?(engine|truck)|emergency)\b/, "emergency vehicle ambulance fire service"],
  [/\b(speeding|overspeed|over-speeding|speed)\b/, "speed over-speeding speed limit"],
  [/\b(triple|three\s+people|3\s+people|pillion|passengers?\s+on\s+bike)\b/, "overloading two-wheelers pillion rider"],
  [/\b(minor|underage|under\s?age|juvenile|kid|teen)\b/, "juvenile minor age"],
  [/\b(horn|honk|honking)\b/, "horn silence zone"],
  [/\b(red\s?light|signal|signals|jump(ed|ing)?)\b/, "traffic control signals"],
  [/\b(park|parking|parked)\b/, "stopping parking"],
  [/\b(overtake|overtaking)\b/, "overtaking"],
  [/\b(lane|lanes)\b/, "lane traffic lane splitting"],
  [/\b(u[\s-]?turn|turning|turn)\b/, "left right u turns"],
  [/\b(fine|fines|penalty|penalties|challan|punishment|jail|amount|how\s+much|what\s+happens|caught|consequences?)\b/, "penalty fine punishable rupees"],
  [/\b(rc|registration|register)\b/, "registration certificate"],
  [/\b(accident|crash|hit)\b/, "accident injury"],
  [/\b(reverse|backwards)\b/, "driving backwards reverse"],
];

const PENALTY_INTENT = /\b(fine|fines|penalty|penalties|challan|punish|punishment|jail|prison|imprison|amount|how\s+much|rupees|rs\.?|what\s+happens|happen|caught|consequences?)\b/i;

function stem(w) {
  if (w.length > 5 && w.endsWith("ing")) return w.slice(0, -3);
  if (w.length > 4 && w.endsWith("ed")) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
  return w;
}

export function tokenize(text) {
  return (text.toLowerCase().match(/[a-z0-9]+/g) || [])
    .filter((w) => !STOP.has(w) && w.length > 1)
    .map(stem);
}

export function rewriteQuery(q) {
  const lower = q.toLowerCase();
  const extra = [];
  for (const [re, add] of SYNONYMS) if (re.test(lower)) extra.push(add);
  return { text: [q, ...extra].join(" "), expansions: extra };
}

// ---- BM25 index (built once per server instance) ----
const K1 = 1.4;
const B = 0.75;
const docs = chunks.map((c) => {
  // title counts 3x: section titles are the strongest signal in legal text
  const toks = tokenize(`${c.title} ${c.title} ${c.title} ${c.text}`);
  const tf = new Map();
  for (const t of toks) tf.set(t, (tf.get(t) || 0) + 1);
  return { c, tf, len: toks.length };
});
const N = docs.length;
const avgLen = docs.reduce((s, d) => s + d.len, 0) / N;
const df = new Map();
for (const d of docs) for (const t of d.tf.keys()) df.set(t, (df.get(t) || 0) + 1);
const idf = (t) => {
  const n = df.get(t) || 0;
  return Math.log(1 + (N - n + 0.5) / (n + 0.5));
};

function bm25(queryTokens, d) {
  let s = 0;
  for (const t of queryTokens) {
    const f = d.tf.get(t);
    if (!f) continue;
    s += idf(t) * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * d.len) / avgLen)));
  }
  return s;
}

const byId = new Map(chunks.map((c) => [c.id, c]));

/**
 * @param {string} question
 * @param {{vehicle?: "all"|"two-wheeler"|"four-wheeler", k?: number}} opts
 */
export function search(question, { vehicle = "all", k = 6 } = {}) {
  const { text, expansions } = rewriteQuery(question);
  const qTokens = [...new Set(tokenize(text))];
  const rawTokens = [...new Set(tokenize(question))];
  const penaltyIntent = PENALTY_INTENT.test(question);

  const scored = docs.map((d) => {
    let score = bm25(qTokens, d);
    const c = d.c;
    if (penaltyIntent && c.is_penalty) score *= 1.25;
    if (penaltyIntent && c.current) score *= 1.35; // prefer the 2019 table for amounts
    if (vehicle !== "all" && c.vehicle?.includes(vehicle)) score *= 1.3;
    return { c, score };
  });
  scored.sort((a, b) => b.score - a.score);

  // keep the best part of each section, at most 2 parts per section
  const picked = [];
  const perSection = new Map();
  for (const s of scored) {
    if (s.score <= 0) break;
    const key = `${s.c.doc}-${s.c.number}`;
    const n = perSection.get(key) || 0;
    if (n >= 2) continue;
    perSection.set(key, n + 1);
    picked.push(s);
    if (picked.length >= k) break;
  }

  // amendment linking: a 1988 section in the results pulls in its 2019 penalty row
  for (const s of [...picked]) {
    const linked = s.c.amended_by && byId.get(s.c.amended_by);
    if (linked && !picked.some((p) => p.c.id === linked.id)) {
      picked.push({ c: linked, score: s.score * 0.99, linked: true });
    }
  }

  // coverage: how many of the user's own content words appear in the top chunks
  const topText = picked.slice(0, 3).map((p) => `${p.c.title} ${p.c.text}`.toLowerCase()).join(" ");
  const topTokens = new Set(tokenize(topText));
  const covered = rawTokens.filter((t) => topTokens.has(t)).length;
  const coverage = rawTokens.length ? covered / rawTokens.length : 0;

  const top = picked[0]?.score || 0;
  return {
    results: picked.map((p, i) => ({
      rank: i + 1,
      id: p.c.id,
      score: Number(p.score.toFixed(3)),
      relative: top ? Number((p.score / top).toFixed(3)) : 0,
      linked: !!p.linked,
      chunk: p.c,
    })),
    topScore: Number(top.toFixed(3)),
    coverage: Number(coverage.toFixed(2)),
    expansions,
    penaltyIntent,
  };
}

// Below this, the question is treated as outside the corpus and we skip the LLM call.
export const MIN_SCORE = 6;
export const MIN_COVERAGE = 0.34;

export function isAnswerable(r) {
  return r.topScore >= MIN_SCORE && r.coverage >= MIN_COVERAGE;
}

export const corpusStats = {
  chunks: chunks.length,
  docs: [...new Set(chunks.map((c) => c.doc_title))],
};
