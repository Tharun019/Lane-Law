"use client";
import { motion } from "motion/react";
import { BookOpen, ScrollText, Gavel, ExternalLink, CheckCircle2, XCircle, Radio, AlertTriangle } from "lucide-react";
import evalData from "@/data/eval.json";

const ease = [0.22, 1, 0.36, 1];

const docs = [
  {
    icon: BookOpen,
    title: "Motor Vehicles Act, 1988",
    meta: "211 sections · 233 pages · India Code",
    body: "Licences, registration, insurance, offences and police powers for every motor vehicle. This copy is the original 1988 text, so each section is linked to its 2019 revised fine.",
    url: "https://indiacode.nic.in/bitstream/123456789/19318/1/the_motor_vehicle_act_1988.pdf",
  },
  {
    icon: ScrollText,
    title: "Motor Vehicles (Driving) Regulations, 2017",
    meta: "40 regulations · MoRTH G.S.R. 634(E)",
    body: "How to ride and drive: lane traffic, right of way, overtaking, speed, parking, horns, mobile phones, lane splitting and what to do after an accident.",
    url: "https://keralapolice.gov.in/storage/orders/iaps/cir-15-2018.pdf",
  },
  {
    icon: Gavel,
    title: "Revised penalties, MV (Amendment) Act 2019",
    meta: "25 rows · Ministry of Road Transport & Highways",
    body: "The current fines that came into force on 1 September 2019 — helmet, seat belt, drunk driving, licence, insurance, juveniles. Transcribed from the official table.",
    url: "https://en.vikaspedia.in/viewcontent/social-welfare/social-awareness/consumer-education/safe-driving/revised-penalties-under-amended-motor-vehicles-act",
  },
];

function Heading({ kicker, title, sub }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, ease }}
      className="mb-10"
    >
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-cyan-300/80">{kicker}</p>
      <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">{title}</h2>
      {sub && <p className="mt-4 max-w-2xl leading-relaxed text-slate-400">{sub}</p>}
    </motion.div>
  );
}

export function Coverage() {
  return (
    <section id="coverage" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:px-6">
      <Heading
        kicker="Knowledge base"
        title={<>Three official documents. <span className="text-slate-400">Nothing else.</span></>}
        sub="Lane Law AI only answers from these. If they don't cover your question, it tells you so instead of guessing."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {docs.map((d, i) => (
          <motion.a
            key={d.title}
            href={d.url}
            target="_blank"
            rel="noreferrer"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease, delay: i * 0.12 }}
            whileHover={{ y: -6 }}
            className="glass group relative overflow-hidden rounded-3xl p-6 transition-shadow hover:shadow-[0_30px_80px_-30px_rgba(34,211,238,0.45)]"
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-400/10 blur-2xl transition group-hover:bg-cyan-400/20" />
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5">
              <d.icon className="h-5 w-5 text-cyan-300" />
            </span>
            <h3 className="mt-5 font-display text-lg font-semibold text-white">{d.title}</h3>
            <p className="mt-1 font-mono text-[11px] text-cyan-200/70">{d.meta}</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">{d.body}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs text-cyan-300/80">
              Open official copy <ExternalLink className="h-3 w-3" />
            </span>
          </motion.a>
        ))}
      </div>
    </section>
  );
}

const failures = [
  {
    title: "Outdated law in the base document",
    cause:
      "The only machine-readable copy of the Act we could get is the original 1988 text: Section 185 still says ₹2,000 for drunk driving, and Sections 194B/194D/194E (seat belt, helmet, emergency vehicles) don't exist in it. A plain RAG system retrieves the old fine with full confidence.",
    fix: "We transcribed MoRTH's 2019 penalty table, linked each 1988 section to its revised row, boost the 2019 table for fine questions, and tell the LLM that [CURRENT - 2019] overrides [ORIGINAL 1988 TEXT].",
  },
  {
    title: "State fines differ from the central Act",
    cause:
      "States set their own compounding amounts (Karnataka and Kerala reduced several 2019 fines). Asked “what is the fine in Bengaluru today?”, the system can only give the central figure — retrieval finds penalty rows that look relevant, so the answer risks sounding more certain than it is.",
    fix: "Every stated fine carries a note that state compounding fines may differ, and city-specific present-day amounts are listed as not covered. A next step would be to add the Karnataka notification as a fourth document.",
  },
];

export function Evaluation() {
  const { summary, rows } = evalData;
  const stats = [
    [`${summary.hitAt1}/${summary.answerable}`, "Correct section ranked #1"],
    [`${summary.hitAt3}/${summary.answerable}`, "Correct section in top 3"],
    [`${summary.refusalsCorrect}/${summary.refusalsGraded}`, "Off-topic refused before the LLM"],
    [String(summary.chunks), "Chunks indexed"],
  ];
  return (
    <section id="eval" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:px-6">
      <Heading
        kicker="Evaluation"
        title={<>Tested honestly. <span className="text-slate-400">Failures included.</span></>}
        sub="Retrieval results below are produced by running the real search code on our test sheet (npm run eval). Answer quality and the insurance refusal are checked live in the demo."
      />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(([n, l], i) => (
          <motion.div
            key={l}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease, delay: i * 0.08 }}
            className="glass rounded-2xl p-5"
          >
            <div className="font-display text-3xl font-semibold text-white">{n}</div>
            <div className="mt-1 text-xs text-slate-400">{l}</div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.8, ease }}
        className="glass overflow-hidden rounded-3xl"
      >
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.07] text-xs uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3.5 font-medium">Question</th>
                <th className="px-5 py-3.5 font-medium">Top result</th>
                <th className="px-5 py-3.5 font-medium">Hit rank</th>
                <th className="px-5 py-3.5 font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.question} className="border-b border-white/[0.04] last:border-0">
                  <td className="px-5 py-3 text-slate-200">{r.question}</td>
                  <td className="px-5 py-3 text-xs text-slate-400">
                    {r.answerable || r.gatePassed ? (
                      <>
                        <span className="font-mono text-cyan-200/80">{r.top3[0]?.id}</span> · {r.top3[0]?.title?.slice(0, 48)}
                      </>
                    ) : (
                      <span className="text-slate-500">blocked by retrieval gate</span>
                    )}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-400">{r.firstHitRank ?? "—"}</td>
                  <td className="px-5 py-3">
                    {r.pass === null ? (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-200">
                        <Radio className="h-3.5 w-3.5" /> LLM must refuse
                      </span>
                    ) : r.pass ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Pass
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-rose-300">
                        <XCircle className="h-3.5 w-3.5" /> Fail
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {failures.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease, delay: i * 0.1 }}
            className="glass rounded-3xl p-6"
          >
            <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-amber-200/80">
              <AlertTriangle className="h-3.5 w-3.5" /> Failure case {i + 1}
            </p>
            <h3 className="mt-3 font-display text-lg font-semibold text-white">{f.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              <strong className="text-slate-200">Cause: </strong>
              {f.cause}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              <strong className="text-slate-200">What we did: </strong>
              {f.fix}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
        <p>
          <span className="font-display text-sm font-semibold text-slate-300">
            Lane Law <span className="text-cyan-300">AI</span>
          </span>{" "}
          · Built for the GAT AIML Hack Hour “From Text to Insight”, 22 Oct 2026.
        </p>
        <p className="max-w-xl md:text-right">
          Explains the law from official documents; not legal advice. State compounding fines may differ from the central Act.
        </p>
      </div>
    </footer>
  );
}
