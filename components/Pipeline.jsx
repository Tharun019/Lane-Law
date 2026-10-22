"use client";
import { useRef } from "react";
import { motion, useScroll, useSpring } from "motion/react";
import { FileText, Search, Sparkles, Quote } from "lucide-react";

const ease = [0.22, 1, 0.36, 1];

const steps = [
  {
    n: "01",
    icon: FileText,
    title: "Ingest",
    body: "Three official documents are split into one chunk per Section, Regulation or penalty row. Table-of-contents entries and amendment footnotes are filtered out, so a chunk is a real legal unit.",
    detail: "352 chunks · section number, title & page kept for citation",
  },
  {
    n: "02",
    icon: Search,
    title: "Retrieve",
    body: "BM25 keyword search over titles and text, with legal query rewriting: “bike” becomes “motor cycle”, “drunk” becomes “drunken driving”. Weak matches get a second, LLM-rewritten search.",
    detail: "Top-6 chunks · fine questions prefer the current 2019 penalty table",
  },
  {
    n: "03",
    icon: Sparkles,
    title: "Generate",
    body: "Groq’s LLM writes the answer only from the retrieved chunks. If the documents don’t cover the question, it says “I don’t know” instead of guessing.",
    detail: "Off-topic questions are refused before the LLM is even called",
  },
  {
    n: "04",
    icon: Quote,
    title: "Cite",
    body: "Every sentence carries a tag like [S1]. Tap it to see the exact passage, its section number, page and the original PDF it came from.",
    detail: "1988 sections are linked to their revised 2019 fines",
  },
];

export default function Pipeline() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 60%"] });
  const line = useSpring(scrollYProgress, { stiffness: 90, damping: 22 });

  return (
    <section id="how" ref={ref} className="relative mx-auto max-w-6xl px-4 py-28 sm:px-6">
      <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease }}
            className="font-mono text-xs uppercase tracking-[0.25em] text-amber-300/80"
          >
            The pipeline
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 26, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease, delay: 0.1 }}
            className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl"
          >
            From a 233-page Act
            <br />
            <span className="text-slate-400">to one cited answer.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease, delay: 0.25 }}
            className="mt-5 max-w-md leading-relaxed text-slate-400"
          >
            Most riders learn traffic law from hearsay — and many still quote fines that changed in 2019. Lane Law AI
            reads the law for them and shows its work.
          </motion.p>
        </div>

        <div className="relative pl-8 sm:pl-10">
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-white/[0.07] sm:left-[15px]" />
          <motion.div
            style={{ scaleY: line }}
            className="absolute left-[11px] top-2 bottom-2 w-px origin-top bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 shadow-[0_0_14px_rgba(251,191,36,0.9)] sm:left-[15px]"
          />
          <div className="space-y-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, x: 40, filter: "blur(10px)" }}
                whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                viewport={{ once: true, margin: "-120px" }}
                transition={{ duration: 0.85, ease, delay: i * 0.05 }}
                className="group relative"
              >
                <span className="absolute -left-8 top-7 grid h-6 w-6 place-items-center rounded-full border border-amber-300/50 bg-[#050607] shadow-[0_0_16px_rgba(251,191,36,0.6)] sm:-left-10 sm:h-8 sm:w-8">
                  <span className="h-2 w-2 rounded-full bg-amber-300" />
                </span>
                <div className="glass rounded-3xl p-6 transition duration-500 group-hover:border-amber-300/25 group-hover:shadow-[0_30px_80px_-30px_rgba(251,191,36,0.35)] sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent">
                        <s.icon className="h-5 w-5 text-amber-300" />
                      </span>
                      <h3 className="font-display text-xl font-semibold text-white">{s.title}</h3>
                    </div>
                    <span className="font-mono text-sm text-slate-500">{s.n}</span>
                  </div>
                  <p className="mt-4 leading-relaxed text-slate-300/90">{s.body}</p>
                  <p className="mt-4 border-t border-white/[0.06] pt-3 font-mono text-xs text-amber-200/70">{s.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
