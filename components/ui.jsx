"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, ExternalLink } from "lucide-react";

export const ease = [0.22, 1, 0.36, 1];

export const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
  del(key) {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium tracking-wide text-slate-400">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-500">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-300/50 focus:shadow-[0_0_0_4px_rgba(34,211,238,0.12)]";

export function Segmented({ value, onChange, options }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl border border-white/10 bg-black/40 p-1">
      {options.map(([v, l, Icon]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`relative inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            value === v ? "text-slate-950" : "text-slate-400 hover:text-white"
          }`}
        >
          {value === v && (
            <motion.span
              layoutId={`seg-${options.map((o) => o[0]).join("")}`}
              className="absolute inset-0 rounded-lg bg-cyan-300 shadow-[0_0_20px_-4px_rgba(34,211,238,0.9)]"
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
            />
          )}
          <span className="relative flex items-center gap-1.5">
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {l}
          </span>
        </button>
      ))}
    </div>
  );
}

export function Button({ children, variant = "primary", className = "", ...props }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
  const styles = {
    primary: "bg-cyan-300 text-slate-950 hover:bg-cyan-200 shadow-[0_10px_30px_-10px_rgba(34,211,238,0.8)]",
    ghost: "border border-white/12 bg-white/[0.04] text-slate-200 hover:border-cyan-300/40 hover:text-white",
    danger: "border border-rose-400/30 bg-rose-400/10 text-rose-200 hover:bg-rose-400/20",
  };
  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

// Renders text with [S1] tags as clickable chips + **bold** + simple bullets
export function CiteText({ text, onCite, className = "" }) {
  const lines = String(text || "").split(/\n+/);
  return (
    <div className={`space-y-2 ${className}`}>
      {lines.map((line, li) => {
        const bullet = /^\s*[-*•]\s+/.test(line);
        const clean = line.replace(/^\s*[-*•]\s+/, "");
        const parts = clean.split(/(\[S\d+\]|\*\*[^*]+\*\*)/g).filter(Boolean);
        const content = parts.map((p, i) => {
          const m = p.match(/^\[(S\d+)\]$/);
          if (m)
            return (
              <button
                key={i}
                type="button"
                onClick={() => onCite?.(m[1])}
                className="mx-0.5 inline-flex -translate-y-px items-center rounded-md border border-cyan-300/30 bg-cyan-300/10 px-1.5 py-px align-middle font-mono text-[10px] font-medium text-cyan-200 transition hover:bg-cyan-300/25"
              >
                {m[1]}
              </button>
            );
          if (p.startsWith("**")) return <strong key={i} className="font-semibold text-white">{p.slice(2, -2)}</strong>;
          return <span key={i}>{p}</span>;
        });
        return bullet ? (
          <div key={li} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300/70" />
            <p>{content}</p>
          </div>
        ) : (
          <p key={li}>{content}</p>
        );
      })}
    </div>
  );
}

export function SourceCard({ s, highlighted, domId }) {
  const [open, setOpen] = useState(false);
  const where = s.doc === "pen2019" ? `Row ${s.number}` : `${s.unit} ${s.number}${s.page ? ` · p.${s.page}` : ""}`;
  const docShort =
    s.doc === "mva1988" ? "MV Act 1988" : s.doc === "mvdr2017" ? "Driving Regs 2017" : s.doc === "pen2019" ? "MoRTH 2019 penalties" : s.docTitle;
  return (
    <motion.div
      id={domId}
      layout
      animate={highlighted ? { boxShadow: "0 0 0 1px rgba(34,211,238,0.7), 0 0 40px -6px rgba(34,211,238,0.6)" } : { boxShadow: "0 0 0 1px rgba(255,255,255,0)" }}
      className="rounded-2xl border border-white/[0.08] bg-black/35 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-md bg-cyan-300/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-cyan-200">{s.tag}</span>
            <span className="text-[11px] font-medium text-slate-300">{docShort}</span>
            <span className="text-[11px] text-slate-500">· {where}</span>
            {s.doc === "pen2019" && <span className="rounded-md border border-emerald-300/25 bg-emerald-300/10 px-1.5 py-0.5 text-[10px] text-emerald-200">Current fine</span>}
            {s.doc === "mva1988" && <span className="rounded-md border border-amber-300/20 bg-amber-300/10 px-1.5 py-0.5 text-[10px] text-amber-200/90">1988 text</span>}
          </div>
          <p className="mt-1.5 text-sm font-medium leading-snug text-white">{s.title}</p>
        </div>
        {typeof s.relative === "number" || typeof s.score === "number" ? (
          <div className="w-16 shrink-0 text-right">
            <div className="font-mono text-[10px] text-slate-500">match</div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-cyan-300" style={{ width: `${Math.max(8, Math.min(100, (s.relative ?? s.score) * 100))}%` }} />
            </div>
          </div>
        ) : null}
      </div>
      <AnimatePresence initial={false}>
        <motion.p
          key={open ? "o" : "c"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2.5 whitespace-pre-line text-xs leading-relaxed text-slate-400"
        >
          {open ? s.text : `${s.text.slice(0, 220)}${s.text.length > 220 ? "…" : ""}`}
        </motion.p>
      </AnimatePresence>
      <div className="mt-3 flex items-center gap-3">
        {s.text.length > 220 && (
          <button type="button" onClick={() => setOpen(!open)} className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white">
            <ChevronDown className={`h-3 w-3 transition ${open ? "rotate-180" : ""}`} /> {open ? "Less" : "Full passage"}
          </button>
        )}
        {s.url && (
          <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-cyan-300/80 hover:text-cyan-200">
            Open source <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </motion.div>
  );
}

export function useCiteFocus(prefix) {
  const [hl, setHl] = useState(null);
  const focus = (tag) => {
    setHl(tag);
    document.getElementById(`${prefix}-${tag}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => setHl(null), 2200);
  };
  return [hl, focus];
}

export function Loader({ steps }) {
  return (
    <div className="space-y-3">
      {steps.map((s, i) => (
        <motion.div
          key={s}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.6 }}
          className="flex items-center gap-3"
        >
          <span className="relative h-2 w-2 rounded-full bg-cyan-300">
            <span className="absolute inset-0 animate-ping rounded-full bg-cyan-300" />
          </span>
          <span className="text-sm text-slate-300">{s}</span>
        </motion.div>
      ))}
      <div className="shimmer mt-4 h-3 w-3/4 rounded-full" />
      <div className="shimmer h-3 w-2/3 rounded-full" />
      <div className="shimmer h-3 w-1/2 rounded-full" />
    </div>
  );
}
