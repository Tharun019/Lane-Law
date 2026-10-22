"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ClipboardList, MessageSquareText, Warehouse, History, LogOut, Pencil, Send, Bike as BikeIcon, Car as CarIcon, Layers,
  AlertTriangle, CheckCircle2, CircleSlash, Clock, Trash2, Sparkles, ArrowRight,
} from "lucide-react";
import Onboarding from "./Onboarding";
import Report from "./Report";
import { store, Field, inputCls, Segmented, Button, CiteText, SourceCard, useCiteFocus, Loader, ease } from "./ui";
import { CATEGORY_LABELS } from "@/lib/situations";

const ACC_KEY = "lanelaw.account.v1";
const REP_KEY = "lanelaw.reports.v1";

function daysUntil(d) {
  if (!d) return null;
  const t = new Date(d).getTime();
  return Number.isNaN(t) ? null : Math.floor((t - Date.now()) / 86400000);
}

export function complianceFor(profile, v) {
  const items = [];
  const add = (level, text, category) => items.push({ level, text, category });
  const ins = daysUntil(v.insuranceExpiry);
  if (v.insurance === "none") add("bad", "No insurance on record", "insurance");
  else if (ins === null) add("warn", "Insurance date not added", null);
  else if (ins < 0) add("bad", `Insurance expired ${-ins} days ago`, "insurance");
  else if (ins < 30) add("warn", `Insurance expires in ${ins} days`, "insurance");
  else add("ok", `Insurance valid (${ins} days left)`, null);
  const puc = daysUntil(v.pucExpiry);
  if (puc === null) add("warn", "PUC date not added", null);
  else if (puc < 0) add("bad", `PUC expired ${-puc} days ago`, "other");
  else if (puc < 15) add("warn", `PUC expires in ${puc} days`, null);
  else add("ok", `PUC valid (${puc} days left)`, null);
  const lic = profile.licenceType;
  const two = v.type === "two-wheeler";
  if (lic === "none") add("bad", "You don't hold a driving licence", "licence");
  else if (lic === "learner") add("warn", "Learner's licence only — conditions apply", "licence");
  else if ((two && lic === "lmv") || (!two && lic === "mcwg")) add("bad", `Your licence doesn't cover a ${two ? "two-wheeler" : "car"}`, "licence");
  else add("ok", "Licence class matches this vehicle", null);
  const ld = daysUntil(profile.licenceExpiry);
  if (ld !== null && ld < 0) add("bad", `Licence expired ${-ld} days ago`, "licence");
  if (profile.ageGroup === "under18") add("bad", "Driver is under 18", "minor");
  return items;
}

const tabs = [
  ["situation", "Analyse a situation", ClipboardList],
  ["ask", "Quick ask", MessageSquareText],
  ["garage", "My garage", Warehouse],
  ["reports", "Saved reports", History],
];

const samples = [
  "What is the fine for riding without a helmet?",
  "Can three people ride on a scooter?",
  "What is the penalty for drunk driving?",
  "Is using a phone while driving allowed?",
  "What must I do after an accident where someone is injured?",
  "Which insurance company is cheapest?",
];

/* ------------------------------ Quick ask ------------------------------ */
function QuickAsk({ defaultVehicle }) {
  const [q, setQ] = useState("");
  const [vehicle, setVehicle] = useState(defaultVehicle || "all");
  const [turns, setTurns] = useState([]);
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  async function ask(question) {
    const text = (question ?? q).trim();
    if (!text || busy) return;
    setQ("");
    setBusy(true);
    const id = Date.now();
    setTurns((t) => [...t, { id, q: text, pending: true }]);
    try {
      const history = turns.filter((t) => t.res?.found).slice(-2).map((t) => ({ q: t.q, a: t.res.answer }));
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, vehicle, history }),
      });
      const data = await res.json();
      setTurns((t) => t.map((x) => (x.id === id ? { ...x, pending: false, res: data, status: res.status } : x)));
    } catch {
      setTurns((t) => t.map((x) => (x.id === id ? { ...x, pending: false, res: { error: "network" } } : x)));
    } finally {
      setBusy(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 80);
    }
  }

  return (
    <div className="space-y-5">
      <div className="glass rounded-2xl p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <Segmented
            value={vehicle}
            onChange={setVehicle}
            options={[
              ["all", "All", Layers],
              ["two-wheeler", "Two-wheeler", BikeIcon],
              ["four-wheeler", "Four-wheeler", CarIcon],
            ]}
          />
          {turns.length > 0 && (
            <button type="button" onClick={() => setTurns([])} className="text-xs text-slate-500 hover:text-white">
              New chat
            </button>
          )}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask();
          }}
          className="flex gap-2"
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ask anything about the Motor Vehicles Act…"
            className={`${inputCls} py-3 text-[15px]`}
          />
          <Button type="submit" disabled={busy || !q.trim()} className="px-5">
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {samples.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => ask(s)}
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-400 transition hover:border-amber-300/40 hover:text-amber-100"
            >
              {s}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-slate-500">Follow-ups remember your last two answered questions — try “and for a second offence?”</p>
      </div>

      <AnimatePresence initial={false}>
        {turns.map((t) => (
          <Turn key={t.id} t={t} />
        ))}
      </AnimatePresence>
      <div ref={endRef} />
    </div>
  );
}

function Turn({ t }) {
  const [hl, focus] = useCiteFocus(`t${t.id}`);
  const [showAll, setShowAll] = useState(false);
  const r = t.res;
  const usedSet = new Set(r?.used || []);
  const sources = r?.sources || [];
  const shown = showAll ? sources : sources.filter((s) => usedSet.has(s.tag)).length ? sources.filter((s) => usedSet.has(s.tag)) : sources.slice(0, 3);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease }} className="space-y-3">
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-md border border-amber-300/20 bg-amber-300/10 px-4 py-2.5 text-sm text-amber-50">{t.q}</div>
      </div>
      <div className="glass rounded-2xl p-5">
        {t.pending ? (
          <Loader steps={["Rewriting your question into legal terms", "Retrieving matching sections", "Writing a cited answer"]} />
        ) : r?.error ? (
          <div className="flex items-start gap-3 text-sm text-slate-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" />
            <div>
              {r.error === "rate_limited"
                ? `Too many requests right now — try again in ${r.retryAfter || "a few"} seconds.`
                : r.error === "missing_key"
                ? "The server has no GROQ_API_KEY set. Add it in .env.local or in Vercel → Settings → Environment Variables."
                : `Something went wrong (${r.error}). Please try again.`}
            </div>
          </div>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {r.found ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-xs font-medium text-amber-100">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Found
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300">
                  <CircleSlash className="h-3.5 w-3.5" /> Not in documents
                </span>
              )}
              {r.found && r.grounded === false && <span className="rounded-full border border-orange-300/30 px-2 py-0.5 text-[11px] text-orange-200">no citation — verify</span>}
              <span className="font-mono text-[11px] text-slate-500">
                {r.model || "retrieval gate"} · {(r.latencyMs / 1000).toFixed(1)}s
              </span>
            </div>
            <CiteText text={r.answer} onCite={focus} className="text-[15px] leading-relaxed text-slate-200" />
            {sources.length > 0 && (
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">{showAll ? "All retrieved chunks" : r.found ? "Cited sources" : "Closest matches (not enough to answer)"}</span>
                  <button type="button" onClick={() => setShowAll(!showAll)} className="text-xs text-amber-300/80 hover:text-amber-200">
                    {showAll ? "Show cited only" : `Show retrieval (${sources.length})`}
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {shown.map((s) => (
                    <SourceCard key={s.tag} s={s} domId={`t${t.id}-${s.tag}`} highlighted={hl === s.tag} />
                  ))}
                </div>
                {showAll && r.retrieval && (
                  <div className="mt-3 rounded-xl border border-white/[0.06] bg-black/30 p-3 font-mono text-[11px] leading-relaxed text-slate-500">
                    <div>query: {r.retrieval.query}</div>
                    {r.retrieval.rewritten && <div>llm rewrite: {r.retrieval.rewritten}</div>}
                    <div>expansions: {r.retrieval.expansions?.join(" | ") || "—"}</div>
                    <div>top score: {r.retrieval.topScore} · coverage: {r.retrieval.coverage} · fine intent: {String(r.retrieval.penaltyIntent)}</div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

/* ------------------------------ Situation ------------------------------ */
function SituationTab({ account, onSaved, preset }) {
  const vs = account.vehicles;
  const [form, setForm] = useState({
    category: preset?.category || "stopped",
    vehicleId: preset?.vehicleId || vs[0]?.id,
    date: new Date().toISOString().slice(0, 10),
    place: account.profile.city || "",
    description: "",
    worry: "",
  });
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const resultRef = useRef(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e?.target ? e.target.value : e });

  useEffect(() => {
    if (preset) setForm((f) => ({ ...f, category: preset.category, vehicleId: preset.vehicleId || f.vehicleId }));
  }, [preset]);

  async function analyse(e) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setData(null);
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    const vehicle = vs.find((v) => v.id === form.vehicleId) || {};
    try {
      const res = await fetch("/api/situation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: account.profile, vehicle, situation: form }),
      });
      const d = await res.json();
      if (d.error) setErr(d);
      else {
        setData(d);
        onSaved({ id: Date.now(), at: new Date().toISOString(), situation: form, vehicle, data: d });
      }
    } catch {
      setErr({ error: "network" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={analyse} className="glass rounded-2xl p-5 sm:p-6">
        <p className="mb-3 text-xs font-medium tracking-wide text-slate-400">What are you dealing with?</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {Object.entries(CATEGORY_LABELS).map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => set("category")(k)}
              className={`rounded-xl border px-3 py-2.5 text-left text-xs leading-snug transition ${
                form.category === k
                  ? "border-amber-300/60 bg-amber-300/10 text-white shadow-[0_0_24px_-8px_rgba(251,191,36,0.8)]"
                  : "border-white/[0.08] bg-black/25 text-slate-400 hover:border-white/20 hover:text-slate-200"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Field label="Vehicle involved">
            <select className={inputCls} value={form.vehicleId} onChange={set("vehicleId")}>
              {vs.map((v, i) => (
                <option key={v.id} value={v.id}>
                  {v.model || `Vehicle ${i + 1}`} · {v.type}
                </option>
              ))}
            </select>
          </Field>
          <Field label="When">
            <input type="date" className={inputCls} value={form.date} onChange={set("date")} />
          </Field>
          <Field label="Where">
            <input className={inputCls} value={form.place} onChange={set("place")} placeholder="Area, city" />
          </Field>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Field label="What happened? (more detail = better answer)">
            <textarea
              rows={4}
              className={inputCls}
              value={form.description}
              onChange={set("description")}
              placeholder="e.g. Police stopped me near Silk Board. I was riding my scooter with my friend as pillion. My insurance expired last month and they asked for documents…"
            />
          </Field>
          <Field label="What worries you most? (optional)">
            <textarea rows={4} className={inputCls} value={form.worry} onChange={set("worry")} placeholder="e.g. Will my licence be suspended? How much will I have to pay?" />
          </Field>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500">Your profile and vehicle details are included automatically to check compliance.</p>
          <Button type="submit" disabled={busy}>
            <Sparkles className="h-4 w-4" /> {busy ? "Analysing…" : "Analyse my situation"}
          </Button>
        </div>
      </form>

      <div ref={resultRef} className="scroll-mt-28">
        {busy && (
          <div className="glass rounded-2xl p-6">
            <Loader steps={["Checking your profile & vehicle for compliance flags", "Running targeted searches across the Act, Regulations and 2019 penalties", "Mapping your situation to the law and writing your report"]} />
          </div>
        )}
        {err && (
          <div className="glass flex items-start gap-3 rounded-2xl p-5 text-sm text-slate-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" />
            {err.error === "rate_limited"
              ? `Too many requests — try again in ${err.retryAfter || "a few"} seconds.`
              : err.error === "missing_key"
              ? "The server has no GROQ_API_KEY set. Add it in .env.local or in Vercel → Settings → Environment Variables."
              : `Something went wrong (${err.error}). Please try again.`}
          </div>
        )}
        {data && <Report data={data} id={`rep${data.latencyMs}`} />}
      </div>
    </div>
  );
}

/* ------------------------------ Garage ------------------------------ */
function Garage({ account, onEdit, onCheck }) {
  const icon = { ok: CheckCircle2, warn: Clock, bad: AlertTriangle };
  const cls = { ok: "text-emerald-300", warn: "text-orange-300", bad: "text-rose-300" };
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {account.vehicles.map((v, i) => {
        const items = complianceFor(account.profile, v);
        const bad = items.filter((x) => x.level === "bad").length;
        return (
          <motion.div
            key={v.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease, delay: i * 0.08 }}
            className="glass rounded-2xl p-5"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5">
                  {v.type === "two-wheeler" ? <BikeIcon className="h-5 w-5 text-amber-300" /> : <CarIcon className="h-5 w-5 text-amber-300" />}
                </span>
                <div>
                  <p className="font-display font-semibold text-white">{v.model || `Vehicle ${i + 1}`}</p>
                  <p className="text-xs text-slate-500">
                    {[v.regNo, v.year, v.fuel, v.type].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-[11px] ${bad ? "border-rose-400/30 bg-rose-400/10 text-rose-200" : "border-emerald-300/30 bg-emerald-300/10 text-emerald-200"}`}>
                {bad ? `${bad} issue${bad > 1 ? "s" : ""}` : "Road-ready"}
              </span>
            </div>
            <div className="mt-4 space-y-2">
              {items.map((x) => {
                const I = icon[x.level];
                return (
                  <div key={x.text} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-black/25 px-3 py-2">
                    <span className="flex items-center gap-2 text-sm text-slate-300">
                      <I className={`h-4 w-4 ${cls[x.level]}`} /> {x.text}
                    </span>
                    {x.category && (
                      <button type="button" onClick={() => onCheck({ category: x.category, vehicleId: v.id })} className="shrink-0 text-[11px] text-amber-300/80 hover:text-amber-200">
                        What does the law say? →
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })}
      <button
        type="button"
        onClick={onEdit}
        className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-white/15 text-sm text-slate-400 transition hover:border-amber-300/40 hover:text-white"
      >
        <span className="flex items-center gap-2">
          <Pencil className="h-4 w-4" /> Edit profile & vehicles
        </span>
      </button>
    </div>
  );
}

/* ------------------------------ Reports ------------------------------ */
function Reports({ reports, onOpen, onDelete }) {
  if (!reports.length)
    return <div className="glass rounded-2xl p-8 text-center text-sm text-slate-400">No saved reports yet. Analyse a situation and it will appear here.</div>;
  return (
    <div className="space-y-3">
      {reports.map((r) => (
        <div key={r.id} className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-white">{r.data.report.headline}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {CATEGORY_LABELS[r.situation.category]} · {r.vehicle.model || r.vehicle.type} · {new Date(r.at).toLocaleString()}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpen(r)} className="py-1.5 text-xs">
              Open <ArrowRight className="h-3.5 w-3.5" />
            </Button>
            <button type="button" onClick={() => onDelete(r.id)} className="rounded-xl border border-white/10 px-2.5 text-slate-500 hover:text-rose-300" aria-label="Delete report">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ Shell ------------------------------ */
export default function Workspace() {
  const [ready, setReady] = useState(false);
  const [account, setAccount] = useState(null);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState("situation");
  const [reports, setReports] = useState([]);
  const [openReport, setOpenReport] = useState(null);
  const [preset, setPreset] = useState(null);

  useEffect(() => {
    setAccount(store.get(ACC_KEY, null));
    setReports(store.get(REP_KEY, []));
    setReady(true);
  }, []);

  const saveAccount = (a) => {
    store.set(ACC_KEY, a);
    setAccount(a);
    setEditing(false);
  };
  const saveReport = (r) => {
    const next = [r, ...reports].slice(0, 12);
    setReports(next);
    store.set(REP_KEY, next);
  };
  const signOut = () => {
    if (!confirm("Sign out and delete your profile and saved reports from this browser?")) return;
    store.del(ACC_KEY);
    store.del(REP_KEY);
    setAccount(null);
    setReports([]);
  };

  const issues = account ? account.vehicles.reduce((n, v) => n + complianceFor(account.profile, v).filter((x) => x.level === "bad").length, 0) : 0;
  const defaultVehicle = account?.vehicles?.[0]?.type || "all";

  return (
    <section id="ask" className="relative mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:px-6">
      <div className="pointer-events-none absolute left-1/2 top-20 h-80 w-[800px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[120px]" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease }}
        className="relative mb-10"
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-amber-300/80">Your legal co-pilot</p>
        <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Tell us what happened. <span className="text-slate-400">We&apos;ll map it to the law.</span>
        </h2>
      </motion.div>

      {!ready ? (
        <div className="glass h-64 rounded-2xl" />
      ) : !account || editing ? (
        <Onboarding initial={editing ? account : null} onDone={saveAccount} />
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="relative">
          {/* account bar */}
          <div className="glass mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-amber-300 to-amber-700 font-display font-semibold text-slate-950">
                {account.profile.name.trim()[0]?.toUpperCase()}
              </span>
              <div>
                <p className="text-sm font-semibold text-white">Hi, {account.profile.name.split(" ")[0]}</p>
                <p className="text-xs text-slate-500">
                  {account.vehicles.length} vehicle{account.vehicles.length > 1 ? "s" : ""} · {account.profile.city}
                  {issues > 0 && <span className="ml-2 text-rose-300">· {issues} compliance issue{issues > 1 ? "s" : ""}</span>}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" className="py-1.5 text-xs" onClick={() => setEditing(true)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
              <Button variant="danger" className="py-1.5 text-xs" onClick={signOut}>
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </Button>
            </div>
          </div>

          {/* tabs */}
          <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-white/[0.08] bg-black/40 p-1.5 scrollbar-thin">
            {tabs.map(([k, l, I]) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setTab(k);
                  setOpenReport(null);
                }}
                className={`relative flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${tab === k ? "text-white" : "text-slate-500 hover:text-slate-200"}`}
              >
                {tab === k && (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute inset-0 rounded-xl border border-amber-300/30 bg-amber-300/10 shadow-[0_0_30px_-10px_rgba(251,191,36,0.9)]"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <I className="relative h-4 w-4" />
                <span className="relative">{l}</span>
                {k === "garage" && issues > 0 && <span className="relative rounded-full bg-rose-400/20 px-1.5 text-[10px] text-rose-200">{issues}</span>}
                {k === "reports" && reports.length > 0 && <span className="relative rounded-full bg-white/10 px-1.5 text-[10px] text-slate-300">{reports.length}</span>}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={tab + (openReport?.id || "")} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35, ease }}>
              {tab === "situation" && <SituationTab account={account} onSaved={saveReport} preset={preset} />}
              {tab === "ask" && <QuickAsk defaultVehicle={defaultVehicle} />}
              {tab === "garage" && (
                <Garage
                  account={account}
                  onEdit={() => setEditing(true)}
                  onCheck={(p) => {
                    setPreset({ ...p, t: Date.now() });
                    setTab("situation");
                  }}
                />
              )}
              {tab === "reports" &&
                (openReport ? (
                  <div className="space-y-4">
                    <button type="button" onClick={() => setOpenReport(null)} className="text-sm text-slate-400 hover:text-white">
                      ← All reports
                    </button>
                    <Report data={openReport.data} id={`saved${openReport.id}`} />
                  </div>
                ) : (
                  <Reports
                    reports={reports}
                    onOpen={setOpenReport}
                    onDelete={(id) => {
                      const next = reports.filter((r) => r.id !== id);
                      setReports(next);
                      store.set(REP_KEY, next);
                    }}
                  />
                ))}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </section>
  );
}
