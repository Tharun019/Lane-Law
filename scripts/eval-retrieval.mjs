// Retrieval evaluation: runs the test sheet through the real search() and writes data/eval.json.
// Usage: npm run eval
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "lib/search.js"), "utf8").replace(
  'import chunks from "../data/chunks.json";',
  `import chunks from ${JSON.stringify(pathToFileURL(join(root, "data/chunks.json")).href)} with { type: "json" };`
);
const tmp = join(mkdtempSync(join(tmpdir(), "lanelaw-")), "search.mjs");
writeFileSync(tmp, src);
const { search, isAnswerable } = await import(pathToFileURL(tmp).href);

const tests = [
  { q: "What is the fine for riding a bike without a helmet?", vehicle: "two-wheeler", expect: ["pen2019-r25", "mva1988-129"], answerable: true },
  { q: "What is the penalty for drunk driving?", vehicle: "all", expect: ["pen2019-r11", "mva1988-185"], answerable: true },
  { q: "What happens if I drive without a licence?", vehicle: "all", expect: ["pen2019-r7", "mva1988-181", "mva1988-3"], answerable: true },
  { q: "What is the fine for driving without insurance?", vehicle: "all", expect: ["pen2019-r21", "mva1988-196"], answerable: true },
  { q: "What should I do when an ambulance is coming behind me?", vehicle: "all", expect: ["pen2019-r19", "mvdr2017-27"], answerable: true },
  { q: "Can three people ride on a scooter?", vehicle: "two-wheeler", expect: ["pen2019-r24", "mva1988-128"], answerable: true },
  { q: "Is it allowed to use a mobile phone while driving?", vehicle: "all", expect: ["mvdr2017-37"], answerable: true },
  { q: "When am I allowed to overtake another vehicle?", vehicle: "all", expect: ["mvdr2017-14"], answerable: true },
  { q: "Fine for not wearing a seat belt in a car", vehicle: "four-wheeler", expect: ["pen2019-r16"], answerable: true },
  { q: "What must a driver do after an accident where someone is hurt?", vehicle: "all", expect: ["mva1988-134", "mvdr2017-29"], answerable: true },
  { q: "How do I make biryani?", vehicle: "all", expect: [], answerable: false },
  { q: "Who is the transport minister of Karnataka?", vehicle: "all", expect: [], answerable: false },
  { q: "Which insurance company is cheapest?", vehicle: "all", expect: [], answerable: false, note: "Retrieval finds insurance sections; the LLM must refuse (tests grounding)." },
];

const base = (id) => id.replace(/-part\d+$/, "");
const rows = tests.map((t) => {
  const r = search(t.q, { vehicle: t.vehicle, k: 6 });
  const ids = r.results.map((x) => base(x.id));
  const rank = t.expect.length ? Math.min(...t.expect.map((e) => { const i = ids.indexOf(e); return i < 0 ? 99 : i + 1; })) : null;
  const gate = isAnswerable(r);
  let pass;
  if (t.answerable) pass = rank !== null && rank <= 3;
  else pass = t.note ? null : !gate; // null = decided by the LLM, check live
  return {
    question: t.q,
    vehicle: t.vehicle,
    expected: t.expect,
    top3: r.results.slice(0, 3).map((x) => ({ id: base(x.id), title: x.chunk.title, score: x.score })),
    firstHitRank: rank === 99 ? null : rank,
    gatePassed: gate,
    answerable: t.answerable,
    pass,
    note: t.note || null,
  };
});
const graded = rows.filter((r) => r.pass !== null);
const hit1 = rows.filter((r) => r.answerable && r.firstHitRank === 1).length;
const hit3 = rows.filter((r) => r.answerable && r.firstHitRank && r.firstHitRank <= 3).length;
const nAns = rows.filter((r) => r.answerable).length;
const summary = {
  generatedAt: new Date().toISOString(),
  chunks: JSON.parse(readFileSync(join(root, "data/chunks.json"), "utf8")).length,
  answerable: nAns,
  hitAt1: hit1,
  hitAt3: hit3,
  refusalsCorrect: rows.filter((r) => !r.answerable && r.pass === true).length,
  refusalsGraded: rows.filter((r) => !r.answerable && r.pass !== null).length,
  passed: graded.filter((r) => r.pass).length,
  graded: graded.length,
};
writeFileSync(join(root, "data/eval.json"), JSON.stringify({ summary, rows }, null, 1));
console.log(summary);
for (const r of rows) console.log(`${r.pass === null ? "LIVE" : r.pass ? "PASS" : "FAIL"}  rank=${r.firstHitRank ?? "-"}  ${r.question}`);
