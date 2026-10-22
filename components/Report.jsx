"use client";
import { useState } from "react";
import { motion } from "motion/react";
import {
  Scale, Gavel, Landmark, Eye, ListChecks, FileStack, HelpCircle, ExternalLink, Printer, AlertTriangle, CheckCircle2, CircleSlash, Search,
} from "lucide-react";
import { CiteText, SourceCard, useCiteFocus, ease } from "./ui";
import { OFFICIAL_LINKS } from "@/lib/situations";

const sev = {
  high: ["High risk", "border-rose-400/30 bg-rose-400/10 text-rose-200"],
  medium: ["Medium risk", "border-orange-300/30 bg-orange-300/10 text-orange-200"],
  low: ["Low risk", "border-emerald-300/30 bg-emerald-300/10 text-emerald-200"],
};

function Block({ icon: Icon, title, children, i = 0 }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 22, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.6, ease, delay: 0.08 * i }}
      className="glass rounded-2xl p-5"
    >
      <h4 className="mb-3.5 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-[0.14em] text-slate-300">
        <Icon className="h-4 w-4 text-amber-300" /> {title}
      </h4>
      {children}
    </motion.section>
  );
}

function Item({ text, cite, general, onCite }) {
  return (
    <div className="flex gap-2.5 text-sm leading-relaxed text-slate-300">
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300/70" />
      <div>
        <CiteText text={`${text} ${cite || ""}`.trim()} onCite={onCite} />
        {general && <span className="mt-1 inline-block rounded border border-white/10 px-1.5 text-[10px] text-slate-500">general advice — not from the documents</span>}
      </div>
    </div>
  );
}

export default function Report({ data, id = "rep" }) {
  const [hl, focus] = useCiteFocus(id);
  const [done, setDone] = useState({});
  const r = data.report;
  const [sevLabel, sevCls] = sev[r.severity] || sev.medium;

  return (
    <div className="space-y-4">
      {/* headline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
        className="glass-strong relative overflow-hidden rounded-2xl p-6"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-amber-400/15 blur-3xl" />
        <div className="flex flex-wrap items-center gap-2">
          {r.found ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-xs font-medium text-amber-100">
              <CheckCircle2 className="h-3.5 w-3.5" /> Found in the law
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300">
              <CircleSlash className="h-3.5 w-3.5" /> Not covered by our documents
            </span>
          )}
          {r.found && <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${sevCls}`}>{sevLabel}</span>}
          {data.model && <span className="font-mono text-[11px] text-slate-500">{data.model} · {(data.latencyMs / 1000).toFixed(1)}s</span>}
          <button
            type="button"
            onClick={() => window.print()}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1 text-xs text-slate-400 transition hover:text-white print:hidden"
          >
            <Printer className="h-3.5 w-3.5" /> Save as PDF
          </button>
        </div>
        <h3 className="mt-4 font-display text-2xl font-semibold leading-snug text-white">{r.headline}</h3>
        <CiteText text={r.understanding} onCite={focus} className="mt-3 text-[15px] leading-relaxed text-slate-300" />
        {data.facts?.length > 0 && (
          <div className="mt-4 rounded-xl border border-orange-300/20 bg-orange-300/[0.06] p-3.5">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-orange-200">
              <AlertTriangle className="h-3.5 w-3.5" /> Flags from your profile
            </p>
            <ul className="space-y-1 text-xs text-orange-100/80">
              {data.facts.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
          </div>
        )}
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-2">
        {r.law?.length > 0 && (
          <Block icon={Scale} title="What the law says" i={1}>
            <div className="space-y-2.5">{r.law.map((x, i) => <Item key={i} text={x.point} cite={x.cite} onCite={focus} />)}</div>
          </Block>
        )}
        {r.penalties?.length > 0 && (
          <Block icon={Gavel} title="Penalties that may apply" i={2}>
            <div className="space-y-3">
              {r.penalties.map((x, i) => (
                <div key={i} className="rounded-xl border border-white/[0.07] bg-black/30 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{x.offence}</p>
                  <CiteText text={`${x.penalty} ${x.cite || ""}`} onCite={focus} className="mt-1 text-sm text-white" />
                </div>
              ))}
              <p className="text-[11px] text-slate-500">States can set their own compounding fines, so the amount on an actual challan may differ.</p>
            </div>
          </Block>
        )}
        {r.process?.length > 0 && (
          <Block icon={Landmark} title="How the government handles it" i={3}>
            <ol className="space-y-2.5">
              {r.process.map((x, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-300">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-amber-300/40 font-mono text-[10px] text-amber-200">{i + 1}</span>
                  <CiteText text={`${x.step} ${x.cite || ""}`} onCite={focus} />
                </li>
              ))}
            </ol>
          </Block>
        )}
        {r.reality_check?.length > 0 && (
          <Block icon={Eye} title="Reality check" i={4}>
            <div className="space-y-2.5">{r.reality_check.map((x, i) => <Item key={i} text={x.point} cite={x.cite} general={x.general} onCite={focus} />)}</div>
          </Block>
        )}
      </div>

      {r.next_steps?.length > 0 && (
        <Block icon={ListChecks} title="Your next steps" i={5}>
          <div className="space-y-2">
            {r.next_steps.map((x, i) => (
              <label key={i} className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition ${done[i] ? "border-amber-300/30 bg-amber-300/[0.06]" : "border-white/[0.07] bg-black/25 hover:border-white/15"}`}>
                <input type="checkbox" className="mt-1 h-4 w-4 accent-amber-300" checked={!!done[i]} onChange={() => setDone({ ...done, [i]: !done[i] })} />
                <div className={`text-sm ${done[i] ? "text-slate-500 line-through" : "text-slate-200"}`}>
                  <CiteText text={`${x.step} ${x.cite || ""}`} onCite={focus} />
                  {x.general && <span className="mt-1 inline-block rounded border border-white/10 px-1.5 text-[10px] text-slate-500 no-underline">general advice</span>}
                </div>
              </label>
            ))}
          </div>
        </Block>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {r.documents?.length > 0 && (
          <Block icon={FileStack} title="Keep these documents ready" i={6}>
            <div className="flex flex-wrap gap-2">
              {r.documents.map((d) => (
                <span key={d} className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-slate-200">{d}</span>
              ))}
            </div>
          </Block>
        )}
        <Block icon={HelpCircle} title="What our documents don't answer" i={7}>
          {r.not_covered?.length ? (
            <ul className="space-y-1.5 text-sm text-slate-400">
              {r.not_covered.map((d) => (
                <li key={d}>• {d}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">Nothing flagged.</p>
          )}
          <p className="mt-3 text-[11px] text-slate-500">For anything here, ask your local RTO, traffic police or a lawyer.</p>
        </Block>
      </div>

      <Block icon={ExternalLink} title="Official portals" i={8}>
        <div className="grid gap-2 sm:grid-cols-2">
          {OFFICIAL_LINKS.map((l) => (
            <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="group flex items-center justify-between rounded-xl border border-white/[0.07] bg-black/25 px-3.5 py-2.5 text-sm text-slate-200 transition hover:border-amber-300/40">
              {l.name}
              <ExternalLink className="h-3.5 w-3.5 text-slate-500 transition group-hover:text-amber-300" />
            </a>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-slate-500">Government websites for taking action. They are not part of the documents the answer is based on.</p>
      </Block>

      {data.sources?.length > 0 && (
        <Block icon={Search} title={`Sources used (${data.sources.length})`} i={9}>
          <div className="grid gap-3 md:grid-cols-2">
            {data.sources.map((s) => (
              <SourceCard key={s.tag} s={s} domId={`${id}-${s.tag}`} highlighted={hl === s.tag} />
            ))}
          </div>
          {data.queries && (
            <details className="mt-4 text-xs text-slate-500">
              <summary className="cursor-pointer hover:text-slate-300">How we searched ({data.queries.length} queries)</summary>
              <ul className="mt-2 space-y-1 font-mono">
                {data.queries.map((q) => (
                  <li key={q}>→ {q}</li>
                ))}
              </ul>
            </details>
          )}
        </Block>
      )}
    </div>
  );
}
