"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bike as BikeIcon, Car as CarIcon, Plus, Trash2, UserRound, ShieldCheck, ArrowRight } from "lucide-react";
import { Field, inputCls, Segmented, Button, ease } from "./ui";

export const emptyVehicle = () => ({
  id: Math.random().toString(36).slice(2, 9),
  type: "two-wheeler",
  model: "",
  regNo: "",
  year: "",
  fuel: "petrol",
  owner: "self",
  insurance: "comprehensive",
  insuranceExpiry: "",
  pucExpiry: "",
});

export function VehicleForm({ v, onChange, onRemove, index }) {
  const set = (k) => (e) => onChange({ ...v, [k]: e?.target ? e.target.value : e });
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="rounded-2xl border border-white/[0.08] bg-black/30 p-4 sm:p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-xs text-slate-500">Vehicle {index + 1}</span>
        {onRemove && (
          <button type="button" onClick={onRemove} className="text-slate-500 transition hover:text-rose-300" aria-label="Remove vehicle">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="mb-4">
        <Segmented
          value={v.type}
          onChange={set("type")}
          options={[
            ["two-wheeler", "Two-wheeler", BikeIcon],
            ["four-wheeler", "Four-wheeler", CarIcon],
          ]}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Make & model">
          <input className={inputCls} value={v.model} onChange={set("model")} placeholder={v.type === "two-wheeler" ? "e.g. Honda Activa 6G" : "e.g. Maruti Swift"} />
        </Field>
        <Field label="Registration no. (optional)">
          <input className={inputCls} value={v.regNo} onChange={set("regNo")} placeholder="KA 01 AB 1234" />
        </Field>
        <Field label="Year">
          <input className={inputCls} value={v.year} onChange={set("year")} inputMode="numeric" placeholder="2021" />
        </Field>
        <Field label="Fuel">
          <select className={inputCls} value={v.fuel} onChange={set("fuel")}>
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="cng">CNG</option>
            <option value="electric">Electric</option>
          </select>
        </Field>
        <Field label="Owner">
          <select className={inputCls} value={v.owner} onChange={set("owner")}>
            <option value="self">Me</option>
            <option value="family member">Family member</option>
            <option value="friend">Friend</option>
            <option value="employer / company">Employer / company</option>
            <option value="rental">Rental</option>
          </select>
        </Field>
        <Field label="Insurance">
          <select className={inputCls} value={v.insurance} onChange={set("insurance")}>
            <option value="comprehensive">Comprehensive</option>
            <option value="third-party">Third-party only</option>
            <option value="none">None / not sure</option>
          </select>
        </Field>
        <Field label="Insurance valid till">
          <input type="date" className={inputCls} value={v.insuranceExpiry} onChange={set("insuranceExpiry")} />
        </Field>
        <Field label="PUC valid till">
          <input type="date" className={inputCls} value={v.pucExpiry} onChange={set("pucExpiry")} />
        </Field>
      </div>
    </motion.div>
  );
}

export default function Onboarding({ initial, onDone }) {
  const [step, setStep] = useState(0);
  const [p, setP] = useState(
    initial?.profile || { name: "", email: "", city: "Bengaluru, Karnataka", ageGroup: "18plus", licenceType: "mcwg", licenceExpiry: "" }
  );
  const [vehicles, setVehicles] = useState(initial?.vehicles?.length ? initial.vehicles : [emptyVehicle()]);
  const [agree, setAgree] = useState(!!initial);
  const set = (k) => (e) => setP({ ...p, [k]: e?.target ? e.target.value : e });

  const canNext = p.name.trim().length > 1 && agree;

  return (
    <div className="glass-strong relative overflow-hidden rounded-[1.75rem] p-5 sm:p-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" />
      {/* stepper */}
      <div className="mb-8 flex items-center gap-3">
        {["Your account", "Your vehicles"].map((l, i) => (
          <div key={l} className="flex items-center gap-3">
            <span
              className={`grid h-7 w-7 place-items-center rounded-full border font-mono text-xs transition ${
                step >= i ? "border-amber-300 bg-amber-300 text-slate-950 shadow-[0_0_18px_-2px_rgba(251,191,36,0.8)]" : "border-white/15 text-slate-500"
              }`}
            >
              {i + 1}
            </span>
            <span className={`text-sm ${step >= i ? "text-white" : "text-slate-500"}`}>{l}</span>
            {i === 0 && <span className="mx-1 h-px w-10 bg-white/15" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 ? (
          <motion.div key="acc" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.45, ease }}>
            <div className="mb-6 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5">
                <UserRound className="h-5 w-5 text-amber-300" />
              </span>
              <div>
                <h3 className="font-display text-xl font-semibold text-white">Create your Lane Law profile</h3>
                <p className="text-sm text-slate-400">Used to check your situation against the law. Stored only in this browser.</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name">
                <input className={inputCls} value={p.name} onChange={set("name")} placeholder="Your name" />
              </Field>
              <Field label="Email (optional)">
                <input className={inputCls} type="email" value={p.email} onChange={set("email")} placeholder="you@example.com" />
              </Field>
              <Field label="City & state">
                <input className={inputCls} value={p.city} onChange={set("city")} placeholder="Bengaluru, Karnataka" />
              </Field>
              <Field label="Age group">
                <Segmented value={p.ageGroup} onChange={set("ageGroup")} options={[["18plus", "18 or older"], ["under18", "Under 18"]]} />
              </Field>
              <Field label="Driving licence">
                <select className={inputCls} value={p.licenceType} onChange={set("licenceType")}>
                  <option value="mcwg">Motorcycle with gear (MCWG)</option>
                  <option value="lmv">Car / light motor vehicle (LMV)</option>
                  <option value="both">Both MCWG + LMV</option>
                  <option value="learner">Learner's licence only</option>
                  <option value="none">No licence</option>
                </select>
              </Field>
              <Field label="Licence valid till" hint="Leave empty if you don't know">
                <input type="date" className={inputCls} value={p.licenceExpiry} onChange={set("licenceExpiry")} />
              </Field>
            </div>
            <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.07] bg-black/25 p-3.5">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 accent-amber-300" />
              <span className="text-xs leading-relaxed text-slate-400">
                I understand Lane Law AI explains the law from official documents and is <strong className="text-slate-200">not legal advice</strong>. My
                details stay in this browser and are only sent with a question to generate an answer. Don&apos;t enter Aadhaar or licence numbers.
              </span>
            </label>
            <div className="mt-6 flex justify-end">
              <Button disabled={!canNext} onClick={() => setStep(1)}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="veh" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.45, ease }}>
            <div className="mb-6 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5">
                <ShieldCheck className="h-5 w-5 text-amber-300" />
              </span>
              <div>
                <h3 className="font-display text-xl font-semibold text-white">Add your vehicles</h3>
                <p className="text-sm text-slate-400">Insurance and PUC dates let us flag problems before the police do.</p>
              </div>
            </div>
            <div className="space-y-4">
              <AnimatePresence>
                {vehicles.map((v, i) => (
                  <VehicleForm
                    key={v.id}
                    v={v}
                    index={i}
                    onChange={(nv) => setVehicles(vehicles.map((x) => (x.id === v.id ? nv : x)))}
                    onRemove={vehicles.length > 1 ? () => setVehicles(vehicles.filter((x) => x.id !== v.id)) : null}
                  />
                ))}
              </AnimatePresence>
            </div>
            <button
              type="button"
              onClick={() => setVehicles([...vehicles, emptyVehicle()])}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-dashed border-white/15 px-4 py-2.5 text-sm text-slate-300 transition hover:border-amber-300/40 hover:text-white"
            >
              <Plus className="h-4 w-4" /> Add another vehicle
            </button>
            <div className="mt-8 flex justify-between">
              <Button variant="ghost" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button onClick={() => onDone({ profile: p, vehicles, createdAt: initial?.createdAt || new Date().toISOString() })}>
                {initial ? "Save changes" : "Create account"} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
