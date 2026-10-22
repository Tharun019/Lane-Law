"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "motion/react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Bike, Car } from "./Vehicles";

const ease = [0.22, 1, 0.36, 1];

const line1 = ["Know", "the", "law"];
const line2 = ["before", "the", "challan."];

const word = {
  hidden: { opacity: 0, y: 46, filter: "blur(14px)" },
  show: (i) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease, delay: 0.35 + i * 0.11 },
  }),
};

const fadeUp = (delay) => ({
  initial: { opacity: 0, y: 24, filter: "blur(8px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.8, ease, delay },
});

const stats = [
  ["211", "Act sections"],
  ["40", "Driving regulations"],
  ["25", "2019 penalties"],
  ["100%", "Answers cited"],
];

export default function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const p = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.3 });

  const cardY = useTransform(p, [0, 1], [0, -160]);
  const cardScale = useTransform(p, [0, 1], [1, 0.9]);
  const cardOpacity = useTransform(p, [0, 0.75], [1, 0]);
  const cardBlur = useTransform(p, [0, 0.8], ["blur(0px)", "blur(10px)"]);
  const roadY = useTransform(p, [0, 1], [0, 120]);
  const glowScale = useTransform(p, [0, 1], [1, 1.5]);
  const gridY = useTransform(p, [0, 1], [0, 80]);

  return (
    <section ref={ref} id="top" className="relative min-h-[100svh] overflow-hidden pt-28 pb-56 md:pb-64">
      {/* background */}
      <motion.div style={{ y: gridY }} className="grid-bg pointer-events-none absolute inset-0" />
      <motion.div
        style={{ scale: glowScale }}
        className="pointer-events-none absolute left-1/2 top-[-18%] h-[720px] w-[1100px] -translate-x-1/2 rounded-full"
        aria-hidden
      >
        <div className="h-full w-full rounded-full bg-[radial-gradient(closest-side,rgba(251,191,36,0.28),rgba(251,191,36,0.06)_55%,transparent)]" />
      </motion.div>
      <div className="pointer-events-none absolute -left-40 top-1/3 h-96 w-96 rounded-full bg-amber-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 top-1/4 h-96 w-96 rounded-full bg-slate-400/10 blur-[120px]" />

      {/* glass hero card */}
      <motion.div
        style={{ y: cardY, scale: cardScale, opacity: cardOpacity, filter: cardBlur }}
        className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, ease }}
          className="glass-strong relative overflow-hidden rounded-[2rem] px-6 py-12 sm:px-12 sm:py-16"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />
          <div className="pointer-events-none absolute -top-24 right-[-10%] h-64 w-64 rounded-full bg-amber-400/20 blur-3xl" />

          <motion.div {...fadeUp(0.15)} className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-amber-300/20 bg-amber-400/[0.07] px-3.5 py-1.5 text-xs font-medium tracking-wide text-amber-100/90">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-amber-300" />
            Retrieval-Augmented · Motor Vehicles Act, India
          </motion.div>

          <h1 className="font-display text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.035em] text-white sm:text-6xl md:text-7xl">
            <span className="block">
              {line1.map((w, i) => (
                <motion.span key={w + i} custom={i} variants={word} initial="hidden" animate="show" className="mr-[0.24em] inline-block">
                  {w}
                </motion.span>
              ))}
            </span>
            <span className="block">
              {line2.map((w, i) => (
                <motion.span
                  key={w + i}
                  custom={i + line1.length}
                  variants={word}
                  initial="hidden"
                  animate="show"
                  className="text-gradient mr-[0.24em] inline-block drop-shadow-[0_0_30px_rgba(251,191,36,0.35)]"
                >
                  {w}
                </motion.span>
              ))}
            </span>
          </h1>

          <motion.p {...fadeUp(1.15)} className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300/90 sm:text-lg">
            Ask anything about riding a bike or driving a car in India. Lane Law AI finds the exact section of the
            Motor Vehicles Act, the 2017 Driving Regulations and MoRTH&apos;s 2019 penalties — and answers only from them,
            with every source shown.
          </motion.p>

          <motion.div {...fadeUp(1.4)} className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href="#ask"
              className="glow-accent group inline-flex items-center gap-2 rounded-full bg-amber-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
            >
              Ask Lane Law
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </a>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm font-medium text-slate-200 backdrop-blur transition hover:border-amber-300/40 hover:text-white"
            >
              How it works
            </a>
            <span className="ml-1 inline-flex items-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-300/80" /> Says &ldquo;I don&apos;t know&rdquo; when the law doesn&apos;t say
            </span>
          </motion.div>

          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map(([n, l], i) => (
              <motion.div
                key={l}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease, delay: 1.65 + i * 0.12 }}
                className="rounded-2xl border border-white/[0.07] bg-black/30 px-4 py-3.5 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.9)]"
              >
                <div className="font-display text-2xl font-semibold text-white">{n}</div>
                <div className="mt-0.5 text-xs text-slate-400">{l}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* road with vehicles driving right -> left */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.6 }}
        className="absolute inset-x-0 z-0 h-44 md:h-48"
        style={{ y: roadY, top: "calc(100svh - 12rem)" }}
        aria-hidden
      >
        <div className="road absolute inset-x-0 bottom-0 h-40 md:h-44 shadow-[0_-30px_80px_-20px_rgba(251,191,36,0.15)]">
          <div className="lane-dash absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />
          {/* far lane: bike */}
          <div className="drive" style={{ bottom: "58%", animationDuration: "7.5s", animationDelay: "0.4s" }}>
            <Bike width={150} />
          </div>
          {/* near lane: car */}
          <div className="drive" style={{ bottom: "6%", animationDuration: "10s", animationDelay: "-3.5s" }}>
            <Car width={250} />
          </div>
          {/* second bike, later */}
          <div className="drive opacity-80" style={{ bottom: "8%", animationDuration: "10s", animationDelay: "-8.5s" }}>
            <Bike width={140} />
          </div>
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#050607] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#050607] to-transparent" />
      </motion.div>
    </section>
  );
}
