"use client";
import { motion, useScroll, useTransform } from "motion/react";

const links = [
  ["How it works", "#how"],
  ["Ask", "#ask"],
  ["Sources", "#coverage"],
  ["Evaluation", "#eval"],
];

export default function Nav() {
  const { scrollY, scrollYProgress } = useScroll();
  const bg = useTransform(scrollY, [0, 120], ["rgba(5,6,7,0)", "rgba(8,10,12,0.72)"]);
  const border = useTransform(scrollY, [0, 120], ["rgba(255,255,255,0)", "rgba(255,255,255,0.08)"]);

  return (
    <>
      <motion.div
        style={{ scaleX: scrollYProgress }}
        className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-cyan-500 via-cyan-300 to-sky-200 shadow-[0_0_12px_rgba(34,211,238,0.8)]"
      />
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 top-3 z-50 px-3"
      >
        <motion.nav
          style={{ backgroundColor: bg, borderColor: border }}
          className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border px-4 py-2.5 backdrop-blur-xl"
        >
          <a href="#top" className="flex items-center gap-2.5">
            <span className="relative grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-cyan-300 to-cyan-600 shadow-[0_0_24px_-4px_rgba(34,211,238,0.8)]">
              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="#04131a" strokeWidth="2.4" strokeLinecap="round">
                <path d="M6 21 L10 3 M18 21 L14 3 M12 7v2 M12 12v2 M12 17v2" />
              </svg>
            </span>
            <span className="font-display text-[15px] font-semibold tracking-tight text-white">
              Lane Law <span className="text-cyan-300">AI</span>
            </span>
          </a>
          <div className="hidden items-center gap-1 md:flex">
            {links.map(([l, h]) => (
              <a key={h} href={h} className="rounded-lg px-3 py-1.5 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white">
                {l}
              </a>
            ))}
          </div>
          <a
            href="#ask"
            className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-3.5 py-1.5 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/20"
          >
            Try it
          </a>
        </motion.nav>
      </motion.header>
    </>
  );
}
