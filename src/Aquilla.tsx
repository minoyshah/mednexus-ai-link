// @ts-nocheck
// Aquilla design prototype (ported as-is from the reference). It drives the UI
// with local component state; the Step 1–6 backend (Supabase schema + Edge
// Functions) is what these flows will be wired to. Typed incrementally.
import React, { useState, useEffect, useRef } from "react";
import {
  Wrench, Zap, Wind, Hammer, Paintbrush, Truck, Sparkles, Lock, Car, Bug,
  Home as HomeIcon, DoorOpen, Sprout, Plug, Star, Clock, ChevronLeft, Check,
  Search, X, Phone, Shield, CreditCard, ChevronRight, Send, Navigation, ArrowRight,
  User, HelpCircle, Wallet, Settings, MessageSquare, Gift, Pencil, LogOut, LayoutGrid, Plus, MoreHorizontal,
  AlertTriangle,
} from "lucide-react";
import { LiveMap, MapExperience, EarningsDashboard, StatusPill, Money, ListRow, RowIcon, EmptyState, toJobStatus, MOCK_CENTER, offsetByMiles } from "@/components/aquilla";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Hex mirrors of the Aquilla tokens in index.css (SVG `fill` attributes can't
// read CSS vars, so the prototype keeps literal values — same palette, one
// source of truth in the token file).
const C = {
  bg: "#F7F8FA", sheet: "#FFFFFF", ink: "#0E1726", sub: "#6B7280",
  line: "#ECEEF2", sel: "#EEF0F4", green: "#10B981", gold: "#FFB400",
  blue: "#2E5BFF", red: "#F43F6E",
  land: "#EAEDF1", water: "#CFE6F7", park: "#DCEBD8", bldg: "#DCDFE4", road: "#FFFFFF", casing: "#DBE0E7",
  meBubble: "#0E1726", proBubble: "#EEF0F4",
};
const F = "'Plus Jakarta Sans', system-ui, sans-serif";
const FEE_RATE = 0.15; // Aquilla takes 15% of the price the pro sets
const VISIT_FEE = 20; // disclosed fee if a job can't be completed; Aquilla still takes 15%
const LABOR_RATE = 0.15, PARTS_RATE = 0.05; // lower take on pass-through parts
const splitJob = (parts, labor) => { const fee = Math.round((labor * LABOR_RATE + parts * PARTS_RATE) * 100) / 100; const total = parts + labor; return { fee, total, payout: +(total - fee).toFixed(2) }; };
const MIN_JOBS = 5; // success-rate guardrail only kicks in after this many jobs
const split = (p) => { const fee = Math.round(p * FEE_RATE * 100) / 100; return { fee, payout: +(p - fee).toFixed(2) }; };

const TRADES = [
  { id: "roadside", name: "Roadside", icon: Car, licReq: false, solo: true, tag: "24/7", rate: 65, unit: "call", jobs: ["Flat tire", "Dead battery / jump", "Out of fuel", "Locked out of car", "Tow truck", "Stuck / winch-out", "Overheated", "Tire delivery"] },
  { id: "plumb", name: "Plumbing", icon: Wrench, licReq: true, rate: 95, unit: "visit", jobs: ["Leaking faucet", "Clogged drain", "Running toilet", "No hot water", "Burst pipe", "Water heater", "Sump pump", "Garbage disposal"] },
  { id: "elec", name: "Electrical", icon: Zap, licReq: true, rate: 110, unit: "visit", jobs: ["Dead outlet", "Breaker tripping", "Install fixture", "Flickering lights", "Panel upgrade", "EV charger install", "Ceiling fan", "Surge protection"] },
  { id: "hvac", name: "HVAC", icon: Wind, licReq: true, rate: 120, unit: "visit", jobs: ["AC not cooling", "Furnace won't start", "Strange noise", "Thermostat", "Refrigerant leak", "Duct cleaning", "Annual tune-up", "Heat pump"] },
  { id: "lock", name: "Locksmith", icon: Lock, licReq: true, rate: 75, unit: "visit", jobs: ["Locked out", "Rekey locks", "Broken key", "New deadbolt", "Smart lock", "Mailbox lock", "Safe lockout", "Window locks"] },
  { id: "roof", name: "Roofing", icon: HomeIcon, licReq: true, rate: 140, unit: "visit", jobs: ["Leak repair", "Missing shingles", "Storm damage", "Flashing repair", "Gutter leak", "Inspection", "Skylight seal", "Replacement quote"] },
  { id: "pest", name: "Pest Control", icon: Bug, licReq: true, rate: 90, unit: "visit", jobs: ["Ants", "Roaches", "Mice / rodents", "Bed bugs", "Termites", "Wasps / hornets", "Spiders", "Mosquito treatment"] },
  { id: "appliance", name: "Appliance Repair", icon: Plug, licReq: false, rate: 70, unit: "visit", jobs: ["Fridge not cooling", "Washer leaking", "Dryer no heat", "Dishwasher", "Oven / stove", "Microwave", "Ice maker", "Disposal"] },
  { id: "garage", name: "Garage Door", icon: DoorOpen, licReq: false, rate: 80, unit: "visit", jobs: ["Won't open", "Broken spring", "Off track", "Opener install", "Cable repair", "Noisy door", "Panel replace", "Remote sync"] },
  { id: "handy", name: "Handyman", icon: Hammer, licReq: false, rate: 45, unit: "hr", jobs: ["Mount a TV", "Assemble furniture", "Hang shelves", "Patch drywall", "Install blinds", "Fix a door", "Caulking", "Childproofing"] },
  { id: "paint", name: "Painting", icon: Paintbrush, licReq: false, rate: 40, unit: "hr", jobs: ["Paint a room", "Touch-ups", "Ceiling", "Trim & doors", "Exterior", "Accent wall", "Cabinet refinish", "Wallpaper removal"] },
  { id: "land", name: "Landscaping", icon: Sprout, licReq: false, rate: 50, unit: "hr", jobs: ["Mow & edge", "Leaf removal", "Hedge trimming", "Sod install", "Mulching", "Tree trimming", "Weed control", "Sprinkler repair"] },
  { id: "move", name: "Moving", icon: Truck, licReq: false, rate: 50, unit: "hr", jobs: ["Move a couch", "Haul junk", "Load a truck", "Single item", "In-home move", "Donation run", "Mattress disposal", "Appliance move"] },
  { id: "clean", name: "Cleaning", icon: Sparkles, licReq: false, rate: 35, unit: "hr", jobs: ["Deep clean", "Move-out clean", "Kitchen & bath", "Whole place", "Carpet", "Windows", "Post-construction", "Recurring"] },
  { id: "other", name: "Other", icon: MoreHorizontal, licReq: false, open: true, tag: "Custom", rate: 0, unit: "job", jobs: ["Describe any task and a nearby pro can claim it."] },
];
const tradeById = (id) => TRADES.find((t) => t.id === id) || TRADES[0];

const FIRST = ["Marcus", "Tanya", "Diego", "Priya", "Sam", "Lena", "Omar", "Kayla", "Vince", "Rosa"];
const LAST = ["R.", "Okafor", "M.", "Singh", "Cole", "B.", "Haddad", "W.", "Russo", "Diaz"];
function prosFor(trade, tier) {
  const licensed = trade.licReq || tier === "licensed"; const n = licensed ? 3 : 4; const out = [];
  for (let i = 0; i < n; i++) {
    const s = (trade.id.charCodeAt(0) + i * 7 + (licensed ? 3 : 1)) % 10;
    const rate = licensed ? trade.rate + s * 4 : Math.round(trade.rate * 0.7) + s * 2;
    out.push({ id: trade.id + tier + i, name: `${FIRST[(s + i) % 10]} ${LAST[(s * 2 + i) % 10]}`, rating: (4.6 + (s % 4) * 0.1).toFixed(1), jobs: 120 + s * 47 + i * 33, eta: 5 + s + i * 3, success: +(0.8 + (s % 5) * 0.038).toFixed(2), rate, licensed });
  }
  return out.sort((a, b) => a.eta - b.eta);
}
const SEED = [
  { id: 901, tradeId: "plumb", proName: "Diego M.", proLicensed: true, problem: "Clogged drain", date: "May 24", price: 130, status: "Completed", rating: 5, review: "Fast and tidy, fixed it in 20 min." },
  { id: 902, tradeId: "roadside", proName: "Sam Cole", proLicensed: true, problem: "Dead battery / jump", date: "May 18", price: 95, status: "Completed", rating: 5, review: "" },
  { id: 903, tradeId: "handy", proName: "Kayla W.", proLicensed: true, problem: "Mount a TV", date: "May 9", price: 120, status: "Completed", rating: 4, review: "Good work, ran a little late." },
  { id: 904, tradeId: "elec", proName: "Tanya Okafor", proLicensed: true, problem: "Install fixture", date: "Apr 30", price: 165, status: "Completed", rating: null, review: "" },
];

/* ---------- map ----------
   StreetMap is now a thin adapter over the real map system (LiveMap): a live,
   token-styled MapLibre map that lazy-loads and gracefully falls back to the
   animated stylized canvas where WebGL/tiles are unavailable. The {nav, arrived}
   contract is unchanged so every call site keeps working untouched. */
function StreetMap({ nav, arrived }) {
  return <LiveMap nav={nav} arrived={arrived} />;
}
const Stars = ({ n, size = 14 }) => <span className="inline-flex">{[1, 2, 3, 4, 5].map((i) => <Star key={i} size={size} color={i <= n ? C.gold : C.line} fill={i <= n ? C.gold : C.line} />)}</span>;
const STEPS = ["Confirming", "On the way", "Arriving", "Arrived"];

export default function App() {
  const [screen, setScreen] = useState("welcome");
  const [tab, setTab] = useState("services");
  const [authMode, setAuthMode] = useState("signup");
  const [trade, setTrade] = useState(null);
  const [tier, setTier] = useState("licensed");
  const [pro, setPro] = useState(null);
  const [quote, setQuote] = useState(null);
  const [jobText, setJobText] = useState("");
  const [budget, setBudget] = useState(0);
  const [proStats, setProStats] = useState({});
  const [threadCtx, setThreadCtx] = useState(null);
  const [role, setRole] = useState("customer");
  const [proSetup, setProSetup] = useState(null);
  const [confirmKind, setConfirmKind] = useState("new");
  const [proEditing, setProEditing] = useState(false);
  const [step, setStep] = useState(0);
  const [eta, setEta] = useState(0);
  const [trips, setTrips] = useState(SEED);
  const [cur, setCur] = useState(null);
  const [profile, setProfile] = useState({ name: "Minoy", phone: "(555) 012-3456", email: "minoy@email.com", rating: "4.9" });
  const timers = useRef([]);
  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => () => clear(), []);
  const go = (s) => setScreen(s);
  const home = () => { clear(); setTab("services"); go("main"); };

  const confirm = () => { setStep(0); setEta(pro.eta); go("dispatch"); clear(); timers.current.push(setTimeout(() => setStep(1), 1500)); };
  useEffect(() => {
    if (screen === "dispatch" && step >= 1 && step < 3) {
      const iv = setInterval(() => setEta((e) => { if (e <= 1) { clearInterval(iv); setStep(3); return 0; } const ne = e - 1; if (ne <= 2) setStep(2); return ne; }), 380);
      return () => clearInterval(iv);
    }
  }, [screen, step]);
  const stat = (name) => proStats[name] || { done: 2, missed: 0 };
  const rateOf = (name) => { const c = stat(name); return c.done / (c.done + c.missed); };
  const bump = (name, key) => setProStats((m) => { const c = m[name] || { done: 2, missed: 0 }; return { ...m, [name]: { ...c, [key]: c[key] + 1 } }; });
  const baseTrip = (over) => ({ id: Date.now(), tradeId: trade.id, proName: pro.name, proLicensed: pro.licensed, problem: quote.problem, date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }), rating: null, review: "", ...over });
  const completeFull = () => { bump(pro.name, "done"); const t = baseTrip({ price: quote.price, status: "Completed" }); setTrips((x) => [t, ...x]); setCur(t); clear(); go("rate"); };
  const completeVisit = () => { const c = stat(pro.name); const tot = c.done + c.missed; if (tot >= MIN_JOBS && c.done / tot < 0.5) return; bump(pro.name, "missed"); const t = baseTrip({ price: VISIT_FEE, status: "Completed", problem: quote.problem + " - couldn't complete (visit fee)" }); setTrips((x) => [t, ...x]); setCur(t); clear(); go("rate"); };
  const completePart = (parts, labor, returnDate, note) => { const t = baseTrip({ price: parts + labor, parts, labor, deposit: parts, status: "Awaiting part", returnDate, partNote: note }); setTrips((x) => [t, ...x]); setCur(t); clear(); setTab("activity"); go("main"); };
  const finishReturn = (tr) => { bump(tr.proName, "done"); setTrips((x) => x.map((t) => t.id === tr.id ? { ...t, status: "Completed" } : t)); setCur({ ...tr, status: "Completed" }); go("rate"); };
  const openThread = (name, status, back) => { setThreadCtx({ name, status, back }); go("thread"); };
  const openConfirm = (kind) => { setConfirmKind(kind); go("confirm"); };
  const resolveConfirm = (ok) => {
    if (confirmKind === "return") {
      if (ok) { finishReturn(cur); }
      else { setTrips((x) => x.map((t) => t.id === cur.id ? { ...t, status: "Disputed" } : t)); setCur({ ...cur, status: "Disputed" }); setTab("activity"); go("main"); }
    } else {
      if (ok) { completeFull(); }
      else { const t = baseTrip({ price: quote.price, status: "Disputed" }); setTrips((x) => [t, ...x]); setCur(t); clear(); setTab("activity"); go("main"); }
    }
  };
  const saveRating = (rating, review) => { setTrips((x) => x.map((t) => t.id === cur.id ? { ...t, rating, review } : t)); setTab("activity"); go("main"); };

  return (
    <div className="w-full flex justify-center min-h-dvh items-center" style={{ background: "#0E1726", fontFamily: F }}>
      <style>{`
        @keyframes scrIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes sheetUp{from{transform:translateY(40px);opacity:.4}to{transform:translateY(0);opacity:1}}
        @keyframes bub{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes dot{0%,60%,100%{opacity:.25;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}
        @keyframes rowIn{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ping{0%{transform:scale(.5);opacity:.5}100%{transform:scale(2.4);opacity:0}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .scr{animation:scrIn .34s cubic-bezier(.22,.7,.25,1) both}.sheet{animation:sheetUp .4s cubic-bezier(.22,.7,.25,1) both}
        .row{animation:rowIn .4s cubic-bezier(.22,.7,.25,1) both}.bub{animation:bub .3s cubic-bezier(.22,.7,.25,1) both}.fadeUp{animation:fadeUp .5s cubic-bezier(.22,.7,.25,1) both}
        *{-webkit-tap-highlight-color:transparent} button{font-family:inherit}
      `}</style>
      {/* True fullscreen on phones; framed device showcase on desktop. */}
      <div className="w-full relative" style={{ maxWidth: 412, height: "min(100dvh, 860px)", background: C.sheet, overflow: "hidden" }}>
        <div key={role + screen + tab} className="scr w-full h-full">{role === "pro" ? (proSetup ? (proEditing ? <ProOnboarding initial={proSetup} editing onDone={(su) => { setProSetup(su); setProEditing(false); }} onCancel={() => setProEditing(false)} /> : <ProApp profile={profile} setup={proSetup} onEditSetup={() => setProEditing(true)} onSaveProfile={setProfile} onExit={() => setRole("customer")} />) : <ProOnboarding onDone={(su) => setProSetup(su)} onCancel={() => setRole("customer")} />) : <>
          {screen === "welcome" && <Welcome onAuth={(m) => { setAuthMode(m); go("auth"); }} onGuest={home} />}
          {screen === "auth" && <Auth mode={authMode} onBack={() => go("welcome")} onDone={home} />}
          {screen === "main" && (
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-auto">
                {tab === "services" && <ServicesTab onPick={(t) => { setTrade(t); setTier("licensed"); go(t.open ? "postJob" : "pros"); }} />}
                {tab === "activity" && <ActivityTab trips={trips} onOpen={(t) => { setCur(t); go("trip"); }} />}
                {tab === "account" && <AccountTab profile={profile} onNav={(k) => {
                  const map = { activity: () => setTab("activity"), pro: () => setRole("pro"), reviews: () => go("reviews"), feedback: () => go("feedback"), editProfile: () => go("editProfile"), help: () => go("help"), wallet: () => go("wallet"), settings: () => go("settings"), promos: () => go("promotions"), signout: () => { setTab("services"); go("welcome"); } };
                  (map[k] || (() => {}))();
                }} />}
              </div>
              <TabBar tab={tab} setTab={setTab} />
            </div>
          )}
          {screen === "pros" && <Pros trade={trade} tier={tier} setTier={setTier} onBack={home} onPick={(p) => { setPro(p); setQuote(null); go("chat"); }} />}
          {screen === "chat" && <Chat trade={trade} pro={pro} openJob={!!(trade && trade.open)} jobText={jobText} budget={budget} onBack={() => go(trade && trade.open ? "openMatch" : "pros")} onAccept={(q) => { setQuote(q); go("pay"); }} />}
          {screen === "postJob" && <PostJob onBack={home} onPost={(desc, b) => { setJobText(desc); setBudget(b); go("openMatch"); }} />}
          {screen === "openMatch" && <OpenMatch jobText={jobText} budget={budget} onBack={() => go("postJob")} onPick={(p) => { setPro(p); setQuote(null); go("chat"); }} />}
          {screen === "pay" && <Pay trade={trade} pro={pro} quote={quote} onBack={() => go("chat")} onConfirm={confirm} />}
          {screen === "dispatch" && (() => { const c = stat(pro.name); const tot = c.done + c.missed; const r = c.done / tot; const blocked = tot >= MIN_JOBS && r < 0.5; return <Dispatch trade={trade} pro={pro} step={step} eta={eta} rate={r} visitBlocked={blocked} onMessage={() => openThread(pro.name, step === 3 ? "Pending \u00b7 on site" : "Pending \u00b7 on the way", "dispatch")} onComplete={() => openConfirm("new")} onVisitOnly={completeVisit} onNeedsPart={() => go("partNeeded")} onCancel={home} />; })()}
          {screen === "thread" && threadCtx && <Thread name={threadCtx.name} status={threadCtx.status} onBack={() => go(threadCtx.back === "trip" ? "trip" : "dispatch")} />}
          {screen === "partNeeded" && <PartNeeded trade={trade} pro={pro} quote={quote} onBack={() => go("dispatch")} onConfirm={completePart} />}
          {screen === "rate" && <Rate trip={cur} onBack={() => { setTab("activity"); go("main"); }} onSubmit={saveRating} />}
          {screen === "trip" && <TripDetail trip={cur} onBack={() => { setTab("activity"); go("main"); }} onRate={() => go("rate")} onHelp={() => go("help")} onCompleteReturn={() => openConfirm("return")} onMessage={() => openThread(cur.proName, "Pending \u00b7 awaiting part \u00b7 returns " + (cur.returnDate || ""), "trip")} onRebook={() => { const t = tradeById(cur.tradeId); setTrade(t); setTier("licensed"); go(t.open ? "postJob" : "pros"); }} />}
          {screen === "confirm" && <Confirm proName={confirmKind === "return" ? (cur && cur.proName) : (pro && pro.name)} customerName={profile.name} onBack={() => go(confirmKind === "return" ? "trip" : "dispatch")} onResolve={resolveConfirm} />}
          {screen === "reviews" && <Reviews trips={trips} onBack={() => { setTab("account"); go("main"); }} onOpen={(t) => { setCur(t); go("trip"); }} />}
          {screen === "feedback" && <Feedback onBack={() => { setTab("account"); go("main"); }} />}
          {screen === "editProfile" && <EditProfile profile={profile} onBack={() => { setTab("account"); go("main"); }} onSave={(p) => { setProfile(p); setTab("account"); go("main"); }} />}
          {screen === "help" && <HelpPage onBack={() => { setTab("account"); go("main"); }} />}
          {screen === "wallet" && <WalletPage onBack={() => { setTab("account"); go("main"); }} />}
          {screen === "settings" && <SettingsPage onBack={() => { setTab("account"); go("main"); }} onSignOut={() => { setTab("services"); go("welcome"); }} />}
          {screen === "promotions" && <PromotionsPage onBack={() => { setTab("account"); go("main"); }} />}
        </>}
        </div>
      </div>
    </div>
  );
}

/* ---------- TAB BAR ---------- */
function TabBar({ tab, setTab }) {
  const items = [["services", "Services", LayoutGrid], ["activity", "Activity", Clock], ["account", "Account", User]];
  return (
    <div className="flex" style={{ borderTop: `1px solid ${C.line}`, background: "#fff", paddingTop: 8, paddingBottom: 14 }}>
      {items.map(([k, l, Icon]) => {
        const on = tab === k;
        return (
          <button key={k} onClick={() => setTab(k)} className="flex-1 flex flex-col items-center gap-1 active:scale-95 transition" style={{ color: on ? C.ink : "#A4A7AD" }}>
            <Icon size={24} strokeWidth={on ? 2.4 : 2} /><span style={{ fontSize: 11, fontWeight: on ? 800 : 600 }}>{l}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- WELCOME / AUTH ---------- */
function Welcome({ onAuth, onGuest }) {
  const points = [
    [Shield, C.green, "Licensed, insured & background-checked", "Every pro is verified before they can take a job."],
    [Lock, C.ink, "Pay only when the job's done", "Your payment is held safely until the work's complete."],
    [Star, C.gold, "Upfront prices — no bidding wars", "Agree on a price first. No spam calls, no surprises."],
  ];
  return (
    <div className="h-full flex flex-col" style={{ background: C.sheet }}>
      <div className="relative" style={{ height: "34%" }}>
        <StreetMap nav />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(255,255,255,.05) 35%, #fff 97%)" }} />
        <div className="absolute left-0 right-0" style={{ bottom: 18 }}>
          <div className="fadeUp flex items-center justify-center gap-2"><div style={{ background: C.ink, color: "#fff", borderRadius: 12, padding: 7 }}><Wrench size={20} strokeWidth={2.5} /></div><span style={{ fontSize: 34, fontWeight: 800, letterSpacing: -1 }}>Aquilla</span></div>
        </div>
      </div>
      <div className="flex-1 px-6 overflow-auto" style={{ minHeight: 0 }}>
        <div className="fadeUp" style={{ animationDelay: "60ms" }}>
          <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>Trusted pros for any fix,<br />on demand.</div>
          <div style={{ color: C.sub, fontSize: 14.5, marginTop: 8, lineHeight: 1.45 }}>Aquilla connects you with vetted local pros for any home repair or roadside emergency — booked in minutes and tracked to your door.</div>
        </div>
        <div className="flex flex-col gap-3 mt-5">
          {points.map(([Icon, col, t, d], i) => (
            <div key={t} className="fadeUp flex items-center gap-3" style={{ animationDelay: `${120 + i * 70}ms` }}>
              <div className="rounded-full flex items-center justify-center shrink-0" style={{ width: 40, height: 40, background: col === C.ink ? C.sel : col === C.green ? "#E7F6EE" : "#FFF6E0" }}><Icon size={19} color={col} fill={col === C.gold ? col : "none"} /></div>
              <div><div style={{ fontWeight: 700, fontSize: 14.5 }}>{t}</div><div style={{ color: C.sub, fontSize: 12.5, lineHeight: 1.35 }}>{d}</div></div>
            </div>
          ))}
        </div>
        <div className="fadeUp rounded-2xl p-3.5 mt-4" style={{ background: C.sel, animationDelay: "360ms" }}>
          <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.5 }}><span style={{ fontWeight: 700, color: C.ink }}>How we're different:</span> other handyman apps sell your details to a dozen pros who flood you with quotes. Aquilla matches you with one trusted pro — and they only get paid when the job's actually done.</div>
        </div>
      </div>
      <div className="px-6 pb-7 pt-3 flex flex-col gap-2.5 fadeUp" style={{ animationDelay: "200ms" }}>
        <button onClick={() => onAuth("signup")} className="rounded-2xl active:scale-[.98] transition flex items-center justify-center gap-2" style={{ background: C.ink, color: "#fff", height: 54, fontWeight: 700, fontSize: 16 }}>Create account <ArrowRight size={18} /></button>
        <button onClick={() => onAuth("signin")} className="rounded-2xl active:scale-[.98] transition" style={{ background: C.sel, color: C.ink, height: 52, fontWeight: 700, fontSize: 16 }}>Sign in</button>
        <button onClick={onGuest} style={{ color: C.sub, fontSize: 14, fontWeight: 600 }}>Continue as guest</button>
      </div>
    </div>
  );
}function Auth({ mode, onBack, onDone }) {
  const [stage, setStage] = useState("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const signup = mode === "signup";
  const digits = phone.replace(/\D/g, "");
  const back = () => (stage === "otp" ? setStage("phone") : onBack());
  if (stage === "otp") return (
    <div className="h-full flex flex-col" style={{ background: C.sheet }}>
      <div className="px-4 pt-12"><button onClick={back} className="active:scale-90 transition"><ChevronLeft size={26} /></button></div>
      <div className="px-6 pt-4"><div style={{ fontSize: 27, fontWeight: 800, letterSpacing: -0.5 }}>Enter the code</div><div style={{ color: C.sub, fontSize: 15, marginTop: 6 }}>We sent a 6-digit code to +1 {phone}.</div></div>
      <div className="px-6 mt-7">
        <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoFocus placeholder="••••••" className="w-full text-center rounded-2xl outline-none" style={{ background: C.sel, height: 64, fontSize: 28, fontWeight: 800, letterSpacing: 12 }} />
        <button disabled={code.length !== 6} onClick={onDone} className="w-full rounded-2xl mt-3 flex items-center justify-center gap-2 active:scale-[.98] transition" style={{ background: code.length === 6 ? C.ink : "#C9CACE", color: "#fff", height: 54, fontWeight: 700, fontSize: 16 }}>Verify <ArrowRight size={18} /></button>
        <button className="w-full text-center mt-4" style={{ color: C.sub, fontSize: 14, fontWeight: 600 }}>Resend code</button>
        <div className="mt-5 rounded-xl p-3 flex gap-2" style={{ background: "#FFF8E8" }}><span style={{ fontSize: 12.5, color: "#8A6D1F", lineHeight: 1.4 }}>Demo only — there's no backend sending a real code, so any 6 digits will verify.</span></div>
      </div>
      <div className="flex-1" />
    </div>
  );
  return (
    <div className="h-full flex flex-col" style={{ background: C.sheet }}>
      <div className="px-4 pt-12"><button onClick={back} className="active:scale-90 transition"><ChevronLeft size={26} /></button></div>
      <div className="px-6 pt-4"><div style={{ fontSize: 27, fontWeight: 800, letterSpacing: -0.5 }}>{signup ? "Create your account" : "Welcome back"}</div><div style={{ color: C.sub, fontSize: 15, marginTop: 6 }}>{signup ? "Enter your number to get started." : "Enter your number to sign in."}</div></div>
      <div className="px-6 mt-7">
        <div className="flex items-center gap-2 rounded-2xl px-4" style={{ background: C.sel, height: 56 }}><span style={{ fontWeight: 700, color: C.sub }}>🇺🇸 +1</span><input value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9 ]/g, ""))} inputMode="tel" autoFocus placeholder="Phone number" className="bg-transparent outline-none flex-1 text-[16px]" style={{ color: C.ink }} /></div>
        <button disabled={digits.length < 10} onClick={() => setStage("otp")} className="w-full rounded-2xl mt-3 flex items-center justify-center gap-2 active:scale-[.98] transition" style={{ background: digits.length >= 10 ? C.ink : "#C9CACE", color: "#fff", height: 54, fontWeight: 700, fontSize: 16 }}>Continue <ArrowRight size={18} /></button>
        <div className="flex items-center gap-3 my-5"><div style={{ flex: 1, height: 1, background: C.line }} /><span style={{ color: C.sub, fontSize: 13 }}>or</span><div style={{ flex: 1, height: 1, background: C.line }} /></div>
        {["Continue with Apple", "Continue with Google"].map((t) => <button key={t} onClick={onDone} className="w-full rounded-2xl mb-3 active:scale-[.98] transition" style={{ border: `1.5px solid ${C.line}`, height: 52, fontWeight: 700, fontSize: 15 }}>{t}</button>)}
      </div>
      <div className="flex-1" /><div className="px-6 pb-8 text-center" style={{ color: C.sub, fontSize: 12.5, lineHeight: 1.5 }}>By continuing you agree to our Terms & Privacy Policy.</div>
    </div>
  );
}

/* ---------- SERVICES TAB ---------- */
function ServicesTab({ onPick }) {
  return (
    <div className="bg-card">
      <div className="px-5 pb-3 pt-12"><h1 className="text-[26px] font-extrabold tracking-tight">Good afternoon</h1><p className="mt-0.5 text-[15px] text-muted-foreground">What needs fixing today?</p></div>
      <div className="px-5"><div className="flex h-[52px] items-center gap-3 rounded-md bg-secondary px-4"><Search size={19} className="text-muted-foreground" /><input placeholder="Describe the problem or pick below" className="flex-1 bg-transparent text-[15px] text-foreground outline-none" /></div></div>
      <div className="mt-6 px-5 pb-6">
        <div className="mb-3 text-[13px] font-bold uppercase tracking-wide text-muted-foreground">Services</div>
        <div className="grid grid-cols-2 gap-3">
          {TRADES.map((t, i) => { const Icon = t.icon; return (
            <button key={t.id} onClick={() => onPick(t)} className="row rounded-lg border border-border bg-card p-4 text-left shadow-card transition active:scale-[.97]" style={{ animationDelay: `${i * 30}ms` }}>
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-secondary"><Icon size={21} className="text-foreground" /></div>
                {t.licReq ? <span className="flex items-center gap-1 rounded-full bg-trust/10 px-2 py-0.5"><Shield size={11} className="text-trust" /><span className="text-[10px] font-bold text-trust">Licensed</span></span>
                  : t.tag ? <span className="rounded-full bg-premium/15 px-2 py-0.5 text-[10px] font-bold text-premium-foreground/80" style={{ color: "hsl(var(--status-visit-fee))" }}>{t.tag}</span> : null}
              </div>
              <div className="mt-4 text-[16px] font-bold">{t.name}</div>
              <div className="mt-0.5 text-[13px] text-muted-foreground">{t.open ? "Name your price" : `from $${Math.round(t.licReq ? t.rate : t.rate * 0.7)}/${t.unit}`}</div>
            </button>); })}
        </div>
      </div>
    </div>
  );
}

/* ---------- ACTIVITY TAB ---------- */
function ActivityTab({ trips, onOpen }) {
  const [filter, setFilter] = useState("all");
  const cat = (t) => { const s = toJobStatus(t.status); return (s === "completed" || s === "visit_fee") ? "completed" : s === "cancelled" ? "cancelled" : "active"; };
  const counts = { active: trips.filter((t) => cat(t) === "active").length, completed: trips.filter((t) => cat(t) === "completed").length };
  const FILTERS = [["all", "All"], ["active", "In progress"], ["completed", "Completed"]];
  const list = trips.filter((t) => filter === "all" || cat(t) === filter);
  const empty = filter === "active"
    ? { title: "Nothing in progress", body: "Jobs you've booked will appear here while they're underway." }
    : filter === "completed"
    ? { title: "No completed trips yet", body: "Finished jobs and their receipts land here." }
    : { title: "No trips yet", body: "Book a pro and your jobs will show up here." };
  return (
    <div className="bg-card">
      <div className="px-5 pb-3 pt-12"><h1 className="text-[26px] font-extrabold tracking-tight">Activity</h1></div>
      <div className="flex gap-2 overflow-x-auto px-5 pb-1">
        {FILTERS.map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} aria-pressed={filter === v} className={cn("whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-bold transition", filter === v ? "bg-foreground text-background" : "bg-secondary text-muted-foreground")}>
            {l}{v !== "all" && counts[v] > 0 ? ` · ${counts[v]}` : ""}
          </button>
        ))}
      </div>
      <div className="mt-4 px-5 pb-6">
        {list.length === 0 ? (
          <EmptyState icon={Clock} title={empty.title} body={empty.body} />
        ) : list.map((t, i) => { const Icon = tradeById(t.tradeId).icon; const done = cat(t) === "completed"; return (
          <button key={t.id} onClick={() => onOpen(t)} className="row mb-2.5 flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3.5 text-left shadow-card transition active:scale-[.98]" style={{ animationDelay: `${i * 45}ms` }}>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-secondary"><Icon size={21} className="text-foreground" /></span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15.5px] font-bold">{tradeById(t.tradeId).name}</div>
              <div className="mt-0.5 truncate text-[12.5px] text-muted-foreground">{t.problem} · {t.date}{t.status === "Awaiting part" && t.returnDate ? ` · returns ${t.returnDate}` : ""}</div>
              <div className="mt-1.5">
                {done
                  ? (t.rating
                    ? <span className="inline-flex items-center gap-1 text-[12px] font-bold text-premium"><Star size={12} fill="currentColor" />{t.rating}.0</span>
                    : <span className="rounded-full bg-premium/15 px-2 py-0.5 text-[10.5px] font-bold text-premium">Rate your pro</span>)
                  : <StatusPill status={t.status} appearance="tint" className="px-2 py-0.5" />}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1"><Money amount={t.price} size="md" /><ChevronRight size={16} className="text-muted-foreground/60" /></div>
          </button>); })}
      </div>
    </div>
  );
}

/* ---------- ACCOUNT TAB ---------- */
function AccountTab({ profile, onNav }) {
  const cards = [["help", "Help", HelpCircle], ["wallet", "Wallet", Wallet], ["activity", "Activity", Clock]];
  const menu = [["pro", "Switch to Pro mode", Wrench], ["reviews", "Your reviews", Star], ["feedback", "Send feedback", MessageSquare], ["editProfile", "Edit profile", Pencil], ["promos", "Promotions", Gift], ["settings", "Settings", Settings], ["signout", "Sign out", LogOut]];
  return (
    <div className="bg-card">
      <div className="px-5 pb-2 pt-12"><h1 className="text-[26px] font-extrabold tracking-tight">Account</h1></div>
      <button onClick={() => onNav("editProfile")} className="flex w-full items-center gap-3 px-5 py-3 transition active:opacity-70">
        <span className="grid h-[60px] w-[60px] place-items-center rounded-full bg-foreground text-[24px] font-bold text-background">{profile.name[0]}</span>
        <span className="flex-1 text-left"><span className="block text-[20px] font-extrabold">{profile.name}</span><span className="mt-0.5 flex items-center gap-1 text-[13px] text-muted-foreground"><Star size={13} className="text-premium" fill="currentColor" />{profile.rating} · Customer</span></span>
        <ChevronRight size={20} className="text-muted-foreground" />
      </button>
      <div className="mt-2 grid grid-cols-3 gap-3 px-5">
        {cards.map(([k, l, Icon]) => <button key={k} onClick={() => onNav(k)} className="flex flex-col items-center gap-2 rounded-lg bg-secondary py-4 transition active:scale-95"><Icon size={22} className="text-foreground" /><span className="text-[13px] font-bold">{l}</span></button>)}
      </div>
      <div className="mt-5 px-5 pb-6">
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {menu.map(([k, l, Icon]) => { const danger = k === "signout"; return (
            <ListRow
              key={k}
              divider
              onClick={() => onNav(k)}
              noChevron={danger}
              leading={<RowIcon className={danger ? "bg-destructive/10 text-destructive" : undefined}><Icon /></RowIcon>}
              title={danger ? <span className="text-destructive">{l}</span> : l}
            />); })}
        </div>
        <div className="mt-6 text-center text-[12px] text-muted-foreground">Aquilla · v1.0</div>
      </div>
    </div>
  );
}

/* ---------- PROS ---------- */
function Pros({ trade, tier, setTier, onBack, onPick }) {
  const pros = prosFor(trade, tier); const [sel, setSel] = useState(pros[0].id);
  const selected = pros.find((p) => p.id === sel) || pros[0]; const showToggle = !trade.licReq && !trade.solo; const Icon = trade.icon;
  return (
    <div className="h-full relative" style={{ background: C.bg }}>
      <div className="relative" style={{ height: 290 }}>
        <StreetMap /><span className="absolute" style={{ left: "47%", top: "30%", width: 26, height: 26, borderRadius: 99, background: C.ink, opacity: .16, animation: "ping 2s ease-out infinite" }} />
        <div className="absolute" style={{ left: "44%", top: "26%" }}><div style={{ background: C.ink, color: "#fff", borderRadius: "16px 16px 16px 4px", padding: "6px 8px" }}><Icon size={18} /></div></div>
        <button onClick={onBack} className="absolute left-4 top-12 rounded-full flex items-center justify-center active:scale-90 transition" style={{ width: 42, height: 42, background: "#fff", boxShadow: "0 2px 10px rgba(0,0,0,.14)" }}><ChevronLeft size={22} /></button>
      </div>
      <div className="sheet absolute left-0 right-0 bottom-0 flex flex-col rounded-t-xl bg-card shadow-sheet" style={{ top: 240 }}>
        <div className="flex justify-center pt-2.5"><div className="h-1 w-10 rounded-full bg-border" /></div>
        <div className="flex items-center gap-2 px-5 pb-2 pt-3"><Icon size={20} /><span className="text-[19px] font-extrabold">Choose a {trade.name.toLowerCase()} pro</span></div>
        {showToggle ? <div className="px-5 pb-1"><div className="flex rounded-full bg-secondary p-1">{[["licensed", "Licensed Pro"], ["quick", "Quick Help"]].map(([v, l]) => <button key={v} onClick={() => setTier(v)} aria-pressed={tier === v} className={cn("flex-1 rounded-full py-2 text-sm font-bold transition", tier === v ? "bg-card text-foreground shadow-card" : "text-muted-foreground")}>{l}</button>)}</div></div>
          : <div className="px-5 pb-1"><div className="flex items-center gap-2 rounded-md bg-trust/10 px-3 py-2"><Shield size={15} className="text-trust" /><span className="text-[12.5px] font-semibold text-status-completed">{trade.solo ? "Vetted, insured & available 24/7." : `License-verified & insured — required for ${trade.name.toLowerCase()}.`}</span></div></div>}
        <div className="flex-1 overflow-auto px-3 pt-2" style={{ paddingBottom: 96 }}>
          {pros.map((p, i) => { const active = sel === p.id; return (
            <button key={p.id} onClick={() => setSel(p.id)} aria-pressed={active} className={cn("row mb-1 flex w-full items-center gap-3 rounded-md border-[1.5px] px-3 py-3 text-left transition", active ? "border-primary bg-accent" : "border-transparent")} style={{ animationDelay: `${i * 45}ms` }}>
              <span className="grid h-[46px] w-[46px] place-items-center rounded-full bg-secondary text-[17px] font-bold">{p.name[0]}</span>
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-[15.5px] font-bold">{p.name}{p.licensed && <Shield size={13} className="text-trust" />}</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-muted-foreground"><Star size={12} className="text-premium" fill="currentColor" />{p.rating}<span>·</span>{Math.round(p.success * 100)}% completed<span>·</span>{p.eta} min</div>
              </div>
              <div className="text-right"><Money amount={p.rate} size="md" /><div className="text-[11px] text-muted-foreground">/{trade.unit}</div></div>
            </button>); })}
        </div>
        <div className="absolute inset-x-0 bottom-0 px-5 pb-6 pt-3" style={{ background: "linear-gradient(to top, hsl(var(--card)) 70%, transparent)" }}><Button size="lg" onClick={() => onPick(selected)} className="w-full"><Send size={17} /> Message {selected.name.split(" ")[0]}</Button></div>
      </div>
    </div>
  );
}

/* ---------- CHAT ---------- */
function Chat({ trade, pro, openJob, jobText, budget, onBack, onAccept }) {
  const [msgs, setMsgs] = useState([]); const [typing, setTyping] = useState(false); const [quote, setQuote] = useState(null); const [asked, setAsked] = useState(openJob || false);
  const endRef = useRef(null); const tm = useRef([]);
  useEffect(() => {
    setTyping(true);
    if (openJob) {
      tm.current.push(setTimeout(() => { setTyping(false); setMsgs([{ from: "pro", text: `Hi, I'm ${pro.name.split(" ")[0]} — I saw your request and I'm happy to take it.` }, { from: "me", text: jobText }]); setTyping(true); }, 900));
      tm.current.push(setTimeout(() => setMsgs((m) => [...m, { from: "pro", text: "Got it, that's no problem at all." }]), 2200));
      tm.current.push(setTimeout(() => { setMsgs((m) => [...m, { from: "pro", text: `I'll do it for your $${budget} budget. Want me to head over?` }]); setTyping(false); setQuote({ price: budget, problem: jobText }); }, 3500));
    } else {
      tm.current.push(setTimeout(() => { setTyping(false); setMsgs([{ from: "pro", text: `Hi, I'm ${pro.name.split(" ")[0]}. What's going on?` }]); }, 900));
    }
    return () => { tm.current.forEach(clearTimeout); };
  }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);
  const send = (text) => {
    if (asked) return; setAsked(true); setMsgs((m) => [...m, { from: "me", text }]); setTyping(true);
    const mins = trade.unit === "hr" ? 90 : trade.unit === "call" ? 30 : 45; const price = trade.unit === "hr" ? pro.rate * 2 : pro.rate + 35;
    tm.current.push(setTimeout(() => setMsgs((m) => [...m, { from: "pro", text: "Got it — I've handled that plenty of times. I can take care of it today." }]), 1300));
    tm.current.push(setTimeout(() => { setMsgs((m) => [...m, { from: "pro", text: `I'd quote a flat $${price} (about ${mins} min on site). Want me to head over?` }]); setTyping(false); setQuote({ price, mins, problem: text }); }, 2600));
  };
  return (
    <div className="h-full flex flex-col" style={{ background: C.sheet }}>
      <div className="flex items-center gap-3 px-4 pt-12 pb-3" style={{ borderBottom: `1px solid ${C.line}` }}><button onClick={onBack} className="active:scale-90 transition"><ChevronLeft size={24} /></button><div className="rounded-full flex items-center justify-center font-bold" style={{ width: 40, height: 40, background: "#E9E9EC" }}>{pro.name[0]}</div><div className="flex-1"><div className="flex items-center gap-1.5" style={{ fontWeight: 700, fontSize: 16 }}>{pro.name}{pro.licensed && <Shield size={13} color={C.green} />}</div><div style={{ color: C.sub, fontSize: 12.5 }}>{openJob ? (pro.label || "Pro") : trade.name} · ⭐ {pro.rating}</div></div><button className="rounded-full flex items-center justify-center" style={{ width: 40, height: 40, background: C.sel }}><Phone size={17} /></button></div>
      <div className="flex-1 overflow-auto px-4 py-4 flex flex-col gap-2.5"><div className="text-center text-xs my-1" style={{ color: C.sub }}>Confirm the fix and price before you pay</div>
        {msgs.map((m, i) => <div key={i} className={`bub flex ${m.from === "me" ? "justify-end" : "justify-start"}`}><div style={{ maxWidth: "78%", padding: "10px 14px", borderRadius: 18, fontSize: 14.5, lineHeight: 1.35, background: m.from === "me" ? C.meBubble : C.proBubble, color: m.from === "me" ? "#fff" : C.ink, borderBottomRightRadius: m.from === "me" ? 5 : 18, borderBottomLeftRadius: m.from === "me" ? 18 : 5 }}>{m.text}</div></div>)}
        {typing && <div className="bub flex justify-start"><div style={{ background: C.proBubble, borderRadius: 18, padding: "12px 16px", display: "flex", gap: 4 }}>{[0, 1, 2].map((d) => <span key={d} style={{ width: 7, height: 7, borderRadius: 99, background: C.sub, animation: "dot 1.2s infinite", animationDelay: `${d * .18}s` }} />)}</div></div>}
        <div ref={endRef} />
      </div>
      {!openJob && !asked && !quote && <div className="px-4 pb-3 flex flex-wrap gap-2">{trade.jobs.map((p) => <button key={p} onClick={() => send(p)} className="rounded-full px-4 py-2.5 text-sm active:scale-95 transition" style={{ border: `1.5px solid ${C.line}`, fontWeight: 600 }}>{p}</button>)}</div>}
      {quote && <div className="bub px-4 pb-6 pt-3" style={{ borderTop: `1px solid ${C.line}` }}><div className="flex items-center justify-between"><span style={{ color: C.sub, fontSize: 14 }}>{openJob ? "Agreed price" : pro.name.split(" ")[0] + "'s price"}</span><span style={{ fontWeight: 800, fontSize: 22 }}>${quote.price}</span></div><div className="mb-3" style={{ color: C.sub, fontSize: 12 }}>You pay ${quote.price} · pro earns ${split(quote.price).payout} after Aquilla's 15% fee (${split(quote.price).fee})</div><button onClick={() => onAccept(quote)} className="w-full rounded-2xl flex items-center justify-center gap-2 active:scale-[.98] transition" style={{ background: C.ink, color: "#fff", height: 54, fontWeight: 700, fontSize: 16 }}>Accept & continue to payment <ChevronRight size={18} /></button></div>}
    </div>
  );
}

/* ---------- PAY ---------- */
function Pay({ trade, pro, quote, onBack, onConfirm }) {
  const { fee, payout } = split(quote.price);
  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex items-center gap-3 px-4 pb-3 pt-12"><button onClick={onBack} className="transition active:scale-90"><ChevronLeft size={24} /></button><span className="text-[19px] font-extrabold">Confirm & pay</span></div>
      <div className="flex-1 overflow-auto px-5">
        <div className="mt-2 flex items-center gap-3 rounded-lg bg-secondary p-4"><span className="grid h-12 w-12 place-items-center rounded-full bg-card text-[17px] font-bold">{pro.name[0]}</span><div className="flex-1"><div className="flex items-center gap-1.5 font-bold">{pro.name}{pro.licensed && <Shield size={13} className="text-trust" />}</div><div className="text-[13px] text-muted-foreground">{trade.name} · {pro.eta} min away</div></div><Clock size={18} className="text-muted-foreground" /></div>
        <div className="mt-5 text-[13px] font-bold uppercase tracking-wide text-muted-foreground">Price</div>
        <div className="mt-2 border-t border-border">
          <div className="flex items-center justify-between border-b border-border py-3"><span className="text-[14.5px] text-muted-foreground">Price set by {pro.name.split(" ")[0]}</span><Money amount={quote.price} size="sm" /></div>
          <div className="flex items-center justify-between py-3"><span className="text-[16px] font-extrabold">You pay</span><Money amount={quote.price} size="lg" /></div>
        </div>
        <div className="mt-2 rounded-lg bg-secondary p-4">
          <div className="mb-2 text-[12px] font-bold uppercase tracking-wide text-muted-foreground">How this splits</div>
          <div className="flex items-center justify-between py-1"><span className="text-[14px] text-muted-foreground">Pro receives</span><Money amount={payout} size="sm" /></div>
          <div className="flex items-center justify-between py-1"><span className="text-[14px] text-muted-foreground">Aquilla service fee (15%)</span><Money amount={fee} size="sm" className="text-trust" /></div>
        </div>
        <div className="mt-2 flex items-center gap-3 rounded-lg border border-border p-4"><CreditCard size={20} /><span className="flex-1 font-semibold">Visa •••• 4242</span><ChevronRight size={18} className="text-muted-foreground" /></div>
        <div className="mt-3 flex items-start gap-2 px-1 text-[12.5px] leading-relaxed text-muted-foreground"><Shield size={14} className="mt-0.5 shrink-0 text-trust" /><span>You're only charged once the job is marked complete. A $20 visit fee applies only if it can't be completed — and is credited toward the repair if you proceed.</span></div>
      </div>
      <div className="px-5 pb-6 pt-3"><Button size="lg" onClick={onConfirm} className="w-full">Confirm {pro.name.split(" ")[0]} · <Money amount={quote.price} size="md" className="text-primary-foreground" /></Button></div>
    </div>
  );
}

/* ---------- DISPATCH ---------- */
function Dispatch({ trade, pro, step, eta, rate, visitBlocked, onMessage, onComplete, onVisitOnly, onNeedsPart, onCancel }) {
  const arrived = step === 3; const arrive = new Date(Date.now() + eta * 60000); const hh = arrive.getHours() % 12 || 12; const mm = String(arrive.getMinutes()).padStart(2, "0");
  return (
    <div className="relative h-full bg-background">
      <div className="absolute inset-0"><StreetMap nav arrived={arrived} /></div>
      <div className="fadeUp absolute inset-x-4 top-12 flex items-center gap-3 rounded-md bg-card px-4 py-3 shadow-float"><div className={cn("flex h-9 w-9 items-center justify-center rounded-full", arrived ? "bg-status-arrived/15" : "bg-status-en-route/15")}>{arrived ? <Check size={18} className="text-status-arrived" /> : <Navigation size={16} className="text-status-en-route" fill="currentColor" />}</div><div className="flex-1"><div className="tnum text-[14.5px] font-bold">{arrived ? "Arrived at your location" : `${eta} min \u00b7 arriving ${hh}:${mm}`}</div><div className="text-[12px] text-muted-foreground">142 Maple Ave</div></div></div>
      <div className="sheet absolute inset-x-0 bottom-0 rounded-t-xl bg-card shadow-sheet">
        <div className="flex justify-center pt-2.5"><div className="h-1 w-10 rounded-full bg-border" /></div>
        <div className="px-5 pt-3">
          <div className="flex items-center justify-between">
            <span className={cn("text-[20px] font-extrabold", arrived && "text-status-arrived")}>{arrived ? "Your pro has arrived" : step === 0 ? "Confirming your pro\u2026" : `${pro.name.split(" ")[0]} is on the way`}</span>
            <StatusPill status={arrived ? "arrived" : step === 0 ? "requested" : "en_route"} appearance="tint" />
          </div>
          <div className="mt-3 flex gap-1.5">{STEPS.map((_, i) => <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors duration-300", i <= step ? "bg-primary" : "bg-border")} />)}</div>
          <div className="mt-4 flex items-center gap-3 rounded-md bg-secondary p-3"><span className="grid h-[50px] w-[50px] place-items-center rounded-full bg-card text-[18px] font-bold">{pro.name[0]}</span><div className="flex-1"><div className="flex items-center gap-1.5 font-bold">{pro.name}{pro.licensed && <Shield size={13} className="text-trust" />}</div><div className="flex items-center gap-1 text-[13px] text-muted-foreground"><Star size={12} className="text-premium" fill="currentColor" /> {pro.rating} \u00b7 {Math.round(rate * 100)}% completion</div></div><button onClick={onMessage} aria-label="Message pro" className="grid h-11 w-11 place-items-center rounded-full bg-card transition active:scale-90"><Send size={17} /></button><button aria-label="Call pro" className="grid h-11 w-11 place-items-center rounded-full bg-trust text-trust-foreground"><Phone size={17} /></button></div>
        </div>
        <div className="px-5 pb-7 pt-4">
          {arrived ? (
            <div className="flex flex-col gap-2.5">
              <Button variant="trust" size="lg" onClick={onComplete} className="w-full">Job completed</Button>
              <Button variant="secondary" onClick={onNeedsPart} className="w-full">Needs a part \u2014 schedule return</Button>
              {visitBlocked ? (
                <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-3"><AlertTriangle size={16} className="mt-0.5 shrink-0 text-destructive" /><span className="text-[12.5px] leading-relaxed text-destructive">Visit fee paused \u2014 this pro's completion rate is below 50%. Their account is under review and they can't charge for incomplete jobs.</span></div>
              ) : (
                <Button variant="outline" onClick={onVisitOnly} className="w-full text-muted-foreground">Couldn't be fixed \u2014 charge $20 visit fee</Button>
              )}
            </div>
          ) : (
            <Button variant="outline" onClick={onCancel} className="w-full text-muted-foreground"><X size={16} /> Cancel</Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- RATE ---------- */
function Rate({ trip, onBack, onSubmit }) {
  const td = tradeById(trip.tradeId); const [stars, setStars] = useState(trip.rating || 0); const [text, setText] = useState(trip.review || ""); const [tags, setTags] = useState([]);
  const TAGS = ["On time", "Professional", "Great work", "Tidy", "Fair price", "Friendly"];
  const toggle = (t) => setTags((x) => x.includes(t) ? x.filter((y) => y !== t) : [...x, t]);
  return (
    <div className="h-full flex flex-col" style={{ background: C.sheet }}>
      <div className="flex items-center gap-3 px-4 pt-12 pb-3"><button onClick={onBack} className="active:scale-90 transition"><X size={24} /></button><span style={{ fontWeight: 800, fontSize: 19 }}>Rate your pro</span></div>
      <div className="flex-1 overflow-auto px-5">
        <div className="flex flex-col items-center mt-4"><div className="rounded-full flex items-center justify-center font-bold" style={{ width: 64, height: 64, background: C.ink, color: "#fff", fontSize: 26 }}>{trip.proName[0]}</div><div className="mt-3" style={{ fontWeight: 800, fontSize: 18 }}>{trip.proName}</div><div style={{ color: C.sub, fontSize: 13.5 }}>{td.name} · {trip.problem}</div></div>
        <div className="text-center mt-6" style={{ fontWeight: 700, fontSize: 16 }}>How was your service?</div>
        <div className="flex justify-center gap-2 mt-3">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setStars(n)} className="active:scale-90 transition"><Star size={40} color={n <= stars ? C.gold : "#E2E2E5"} fill={n <= stars ? C.gold : "#E2E2E5"} /></button>)}</div>
        <div className="flex flex-wrap gap-2 justify-center mt-6">{TAGS.map((t) => { const on = tags.includes(t); return <button key={t} onClick={() => toggle(t)} className="rounded-full px-4 py-2 text-sm active:scale-95 transition" style={{ border: `1.5px solid ${on ? C.ink : C.line}`, background: on ? C.ink : "#fff", color: on ? "#fff" : C.ink, fontWeight: 600 }}>{t}</button>; })}</div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a comment (optional)" className="w-full mt-5 rounded-2xl p-4 outline-none text-[15px]" style={{ background: C.sel, minHeight: 90, resize: "none" }} />
      </div>
      <div className="px-5 pb-6 pt-3"><button disabled={!stars} onClick={() => onSubmit(stars, text)} className="w-full rounded-2xl active:scale-[.98] transition" style={{ background: stars ? C.ink : "#C9CACE", color: "#fff", height: 54, fontWeight: 700, fontSize: 16 }}>Submit review</button></div>
    </div>
  );
}

/* ---------- TRIP DETAIL ---------- */
function TripDetail({ trip, onBack, onRate, onHelp, onCompleteReturn, onMessage, onRebook }) {
  const td = tradeById(trip.tradeId); const Icon = td.icon;
  const awaiting = trip.status === "Awaiting part";
  const disputed = trip.status === "Disputed";
  const sj = trip.parts != null ? splitJob(trip.parts, trip.labor) : null;
  const { fee, payout } = sj || split(trip.price);
  return (
    <div className="h-full flex flex-col" style={{ background: C.sheet }}>
      <div className="flex items-center gap-3 px-4 pt-12 pb-3"><button onClick={onBack} className="active:scale-90 transition"><ChevronLeft size={24} /></button><span style={{ fontWeight: 800, fontSize: 19 }}>Trip details</span></div>
      <div className="flex-1 overflow-auto px-5">
        <div className="relative rounded-lg overflow-hidden mt-2" style={{ height: 130 }}><StreetMap /></div>
        <div className="flex items-center gap-3 mt-4"><div className="rounded-md flex items-center justify-center shrink-0" style={{ background: C.sel, width: 48, height: 48 }}><Icon size={22} color={C.ink} /></div><div className="flex-1 min-w-0"><div className="truncate" style={{ fontWeight: 800, fontSize: 18 }}>{td.name}</div><div className="truncate" style={{ color: C.sub, fontSize: 13 }}>{trip.problem} \u00b7 {trip.date}</div></div><StatusPill status={trip.status} appearance="tint" /></div>
        {disputed && <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3.5"><div className="flex gap-2.5"><Lock size={18} className="mt-0.5 shrink-0 text-destructive" /><div><div className="text-[14px] font-bold text-destructive">Disputed \u2014 funds held</div><div className="mt-0.5 text-[12.5px] leading-snug text-destructive/90">The customer and pro disagreed on completion. Aquilla is reviewing; no money moves until it's resolved.</div></div></div><div className="mt-3 flex items-center justify-between border-t border-destructive/20 pt-3"><span className="text-[12.5px] font-semibold text-destructive/90">Held in escrow</span><Money amount={trip.price} size="md" className="text-destructive" /></div></div>}
        {awaiting && <div className="mt-3 flex gap-2.5 rounded-lg bg-status-awaiting-part/10 p-3.5"><Clock size={18} className="mt-0.5 shrink-0 text-status-awaiting-part" /><div><div className="text-[14px] font-bold text-status-awaiting-part">Returns {trip.returnDate}</div>{trip.partNote ? <div className="mt-0.5 text-[12.5px] text-status-awaiting-part/90">{trip.partNote}</div> : null}</div></div>}
        <div className="flex items-center gap-3 rounded-2xl p-3 mt-4" style={{ background: C.sel }}><div className="rounded-full flex items-center justify-center font-bold" style={{ width: 44, height: 44, background: "#fff" }}>{trip.proName[0]}</div><div className="flex-1"><div className="flex items-center gap-1.5" style={{ fontWeight: 700 }}>{trip.proName}{trip.proLicensed && <Shield size={13} color={C.green} />}</div><div style={{ color: C.sub, fontSize: 12.5 }}>Your pro</div></div><button onClick={onMessage} className="rounded-full flex items-center justify-center active:scale-90 transition" style={{ width: 42, height: 42, background: "#fff" }}><Send size={16} /></button></div>
        <div className="mt-5" style={{ fontSize: 13, fontWeight: 700, color: C.sub }}>{awaiting ? "ESTIMATE" : "RECEIPT"}</div>
        <div className="mt-2" style={{ borderTop: `1px solid ${C.line}` }}>
          {sj ? (<>
            <div className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${C.line}` }}><span className="text-[14.5px] text-muted-foreground">Parts{awaiting ? " (deposit paid)" : ""}</span><Money amount={trip.parts} size="sm" /></div>
            <div className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${C.line}` }}><span className="text-[14.5px] text-muted-foreground">Labor{awaiting ? " (on completion)" : ""}</span><Money amount={trip.labor} size="sm" /></div>
            <div className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${C.line}` }}><span className="text-[14.5px] text-muted-foreground">Aquilla fee (15% labor / 5% parts)</span><Money amount={fee} size="sm" /></div>
            <div className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${C.line}` }}><span className="text-[14.5px] text-muted-foreground">Pro payout</span><Money amount={payout} size="sm" /></div>
          </>) : ([["Pro payout", payout], ["Aquilla service fee (15%)", fee]].map(([k, v]) => <div key={k} className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${C.line}` }}><span className="text-[14.5px] text-muted-foreground">{k}</span><Money amount={v} size="sm" /></div>))}
          <div className="flex items-center justify-between py-3"><span className="text-[15px] font-extrabold">{awaiting ? "Total on completion" : "Total paid"}</span><Money amount={trip.price} size="lg" /></div>
        </div>
        {!awaiting && !disputed && (trip.rating ? <div className="rounded-2xl p-4 mt-3" style={{ border: `1px solid ${C.line}` }}><div className="flex items-center justify-between"><span style={{ fontWeight: 700 }}>Your rating</span><Stars n={trip.rating} size={16} /></div>{trip.review && <div className="mt-2" style={{ color: C.sub, fontSize: 14 }}>\u201c{trip.review}\u201d</div>}</div>
          : <button onClick={onRate} className="w-full rounded-2xl mt-3 active:scale-[.98] transition" style={{ background: "#FFF1DD", color: "#B7791F", height: 50, fontWeight: 700 }}>Rate your pro</button>)}
      </div>
      <div className="px-5 pb-6 pt-3 flex gap-3">{disputed ? <button onClick={onHelp} className="flex-1 rounded-2xl active:scale-[.98] transition" style={{ background: C.ink, color: "#fff", height: 52, fontWeight: 700 }}>Contact support about this dispute</button> : <>{awaiting ? <button onClick={onCompleteReturn} className="flex-1 rounded-2xl active:scale-[.98] transition" style={{ background: C.green, color: "#fff", height: 52, fontWeight: 700 }}>Mark return visit complete</button> : <button onClick={onRebook} className="flex-1 rounded-2xl active:scale-[.98] transition" style={{ background: C.ink, color: "#fff", height: 52, fontWeight: 700 }}>Rebook</button>}<button onClick={onHelp} className="rounded-2xl px-5 active:scale-[.98] transition" style={{ border: `1.5px solid ${C.line}`, height: 52, fontWeight: 700 }}>Get help</button></>}</div>
    </div>
  );
}

/* ---------- REVIEWS ---------- */
function Reviews({ trips, onBack, onOpen }) {
  const reviewed = trips.filter((t) => t.rating);
  return (
    <div className="h-full flex flex-col" style={{ background: C.sheet }}>
      <div className="flex items-center gap-3 px-4 pt-12 pb-3"><button onClick={onBack} className="active:scale-90 transition"><ChevronLeft size={24} /></button><span style={{ fontWeight: 800, fontSize: 19 }}>Your reviews</span></div>
      <div className="flex-1 overflow-auto px-5 pt-2">
        {reviewed.length === 0 ? <div className="text-center py-16" style={{ color: C.sub }}><Star size={34} className="mx-auto mb-3" /><div style={{ fontWeight: 700 }}>No reviews yet</div></div>
          : reviewed.map((t, i) => { const td = tradeById(t.tradeId); return (
            <button key={t.id} onClick={() => onOpen(t)} className="row w-full text-left rounded-2xl p-4 mb-2 active:scale-[.98] transition" style={{ border: `1px solid ${C.line}`, animationDelay: `${i * 40}ms` }}>
              <div className="flex items-center justify-between"><div className="flex items-center gap-1.5" style={{ fontWeight: 700 }}>{t.proName}{t.proLicensed && <Shield size={12} color={C.green} />}</div><Stars n={t.rating} size={14} /></div>
              <div style={{ color: C.sub, fontSize: 12.5, marginTop: 2 }}>{td.name} · {t.date}</div>
              {t.review && <div className="mt-1.5" style={{ fontSize: 14 }}>“{t.review}”</div>}
            </button>); })}
      </div>
    </div>
  );
}

/* ---------- FEEDBACK ---------- */
function Feedback({ onBack }) {
  const [stars, setStars] = useState(0); const [cat, setCat] = useState(""); const [text, setText] = useState(""); const [sent, setSent] = useState(false);
  const CATS = ["Bug", "Idea", "Pricing", "Pro quality", "Other"];
  if (sent) return (
    <div className="h-full flex flex-col items-center justify-center px-8 text-center" style={{ background: C.sheet }}>
      <div className="rounded-full flex items-center justify-center" style={{ width: 76, height: 76, background: "#E7F6EE" }}><Check size={38} color={C.green} /></div>
      <div className="mt-5" style={{ fontWeight: 800, fontSize: 22 }}>Thanks for the feedback</div>
      <div className="mt-2" style={{ color: C.sub, fontSize: 15 }}>It helps us make Aquilla better for everyone.</div>
      <button onClick={onBack} className="mt-7 rounded-2xl px-8 active:scale-[.98] transition" style={{ background: C.ink, color: "#fff", height: 52, fontWeight: 700 }}>Done</button>
    </div>
  );
  return (
    <div className="h-full flex flex-col" style={{ background: C.sheet }}>
      <div className="flex items-center gap-3 px-4 pt-12 pb-3"><button onClick={onBack} className="active:scale-90 transition"><ChevronLeft size={24} /></button><span style={{ fontWeight: 800, fontSize: 19 }}>Send feedback</span></div>
      <div className="flex-1 overflow-auto px-5 pt-2">
        <div style={{ fontWeight: 700, fontSize: 16 }}>How's your Aquilla experience?</div>
        <div className="flex gap-2 mt-3">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setStars(n)} className="active:scale-90 transition"><Star size={34} color={n <= stars ? C.gold : "#E2E2E5"} fill={n <= stars ? C.gold : "#E2E2E5"} /></button>)}</div>
        <div className="mt-6" style={{ fontWeight: 700, fontSize: 15 }}>What's it about?</div>
        <div className="flex flex-wrap gap-2 mt-3">{CATS.map((c) => { const on = cat === c; return <button key={c} onClick={() => setCat(c)} className="rounded-full px-4 py-2 text-sm active:scale-95 transition" style={{ border: `1.5px solid ${on ? C.ink : C.line}`, background: on ? C.ink : "#fff", color: on ? "#fff" : C.ink, fontWeight: 600 }}>{c}</button>; })}</div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Tell us more…" className="w-full mt-5 rounded-2xl p-4 outline-none text-[15px]" style={{ background: C.sel, minHeight: 120, resize: "none" }} />
      </div>
      <div className="px-5 pb-6 pt-3"><button disabled={!stars && !text} onClick={() => setSent(true)} className="w-full rounded-2xl active:scale-[.98] transition" style={{ background: (stars || text) ? C.ink : "#C9CACE", color: "#fff", height: 54, fontWeight: 700, fontSize: 16 }}>Submit feedback</button></div>
    </div>
  );
}

/* ---------- EDIT PROFILE ---------- */
function EditProfile({ profile, onBack, onSave }) {
  const [p, setP] = useState(profile);
  const field = (k, label, props = {}) => (
    <div className="mt-4"><div style={{ fontSize: 13, fontWeight: 700, color: C.sub }} className="mb-1.5">{label}</div><input value={p[k]} onChange={(e) => setP({ ...p, [k]: e.target.value })} className="w-full rounded-2xl px-4 outline-none text-[16px]" style={{ background: C.sel, height: 54 }} {...props} /></div>
  );
  return (
    <div className="h-full flex flex-col" style={{ background: C.sheet }}>
      <div className="flex items-center gap-3 px-4 pt-12 pb-3"><button onClick={onBack} className="active:scale-90 transition"><ChevronLeft size={24} /></button><span style={{ fontWeight: 800, fontSize: 19 }}>Edit profile</span></div>
      <div className="flex-1 overflow-auto px-5">
        <div className="flex justify-center mt-3"><div className="relative"><div className="rounded-full flex items-center justify-center font-bold" style={{ width: 84, height: 84, background: C.ink, color: "#fff", fontSize: 34 }}>{p.name[0]}</div><div className="absolute rounded-full flex items-center justify-center" style={{ right: -2, bottom: -2, width: 30, height: 30, background: "#fff", border: `1px solid ${C.line}` }}><Pencil size={14} /></div></div></div>
        {field("name", "Name")}{field("phone", "Phone", { inputMode: "tel" })}{field("email", "Email", { inputMode: "email" })}
      </div>
      <div className="px-5 pb-6 pt-3"><button onClick={() => onSave(p)} className="w-full rounded-2xl active:scale-[.98] transition" style={{ background: C.ink, color: "#fff", height: 54, fontWeight: 700, fontSize: 16 }}>Save changes</button></div>
    </div>
  );
}

/* ---------- shared helpers ---------- */
function Header({ title, onBack }) {
  return <div className="flex items-center gap-3 px-4 pt-12 pb-3"><button onClick={onBack} className="active:scale-90 transition"><ChevronLeft size={24} /></button><span style={{ fontWeight: 800, fontSize: 19 }}>{title}</span></div>;
}
function Toggle({ on, onClick }) {
  return <button onClick={onClick} className="transition" style={{ width: 48, height: 28, borderRadius: 99, background: on ? C.green : "#D4D5D9", padding: 2, display: "flex", justifyContent: on ? "flex-end" : "flex-start" }}><span style={{ width: 24, height: 24, borderRadius: 99, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.2)", transition: "all .2s" }} /></button>;
}

/* ---------- HELP ---------- */
function HelpPage({ onBack }) {
  const FAQ = [
    ["How do I pay?", "You're only charged after the pro marks the job complete — your saved card is billed automatically, with a receipt in Activity."],
    ["Can I cancel a booking?", "Yes. You can cancel any time before the pro arrives at no charge, right from the tracking screen."],
    ["Are the pros licensed?", "Licensed trades (plumbing, electrical, HVAC, roofing, pest, locksmith) only show license-verified, insured pros. Quick Help covers non-licensed tasks like assembly or hauling."],
    ["How do refunds work?", "If something isn't right, tap Get help on the trip and our team reviews it within 24 hours."],
    ["Is my payment secure?", "Card details are encrypted and never shared with the pros you book."],
  ];
  const [open, setOpen] = useState(-1); const [sent, setSent] = useState(false);
  return (
    <div className="h-full flex flex-col" style={{ background: C.sheet }}>
      <Header title="Help" onBack={onBack} />
      <div className="flex-1 overflow-auto px-5">
        <div className="flex items-center gap-3 rounded-2xl px-4 mt-1" style={{ background: C.sel, height: 50 }}><Search size={18} /><input placeholder="Search help topics" className="bg-transparent outline-none flex-1 text-[15px]" /></div>
        <div className="mt-5" style={{ fontSize: 13, fontWeight: 700, color: C.sub }}>POPULAR TOPICS</div>
        <div className="rounded-2xl overflow-hidden mt-2" style={{ border: `1px solid ${C.line}` }}>
          {FAQ.map(([q, a], i) => (
            <div key={q} style={{ borderTop: i ? `1px solid ${C.line}` : "none" }}>
              <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex items-center gap-3 px-4 py-4 text-left"><HelpCircle size={18} color={C.sub} /><span className="flex-1" style={{ fontWeight: 600, fontSize: 15 }}>{q}</span><ChevronRight size={18} color={C.sub} style={{ transform: open === i ? "rotate(90deg)" : "none", transition: "transform .2s" }} /></button>
              {open === i && <div className="px-4 pb-4" style={{ color: C.sub, fontSize: 14, lineHeight: 1.5 }}>{a}</div>}
            </div>
          ))}
        </div>
        {sent ? <div className="rounded-2xl p-4 mt-4 flex items-center gap-3" style={{ background: "#E7F6EE" }}><Check size={20} color={C.green} /><span style={{ fontSize: 14, color: "#0B7A4D", fontWeight: 600 }}>Support request sent — we'll reply by email within 24 hours.</span></div>
          : <button onClick={() => setSent(true)} className="w-full rounded-2xl mt-4 flex items-center justify-center gap-2 active:scale-[.98] transition" style={{ background: C.ink, color: "#fff", height: 52, fontWeight: 700 }}><MessageSquare size={18} /> Contact support</button>}
      </div>
    </div>
  );
}

/* ---------- WALLET ---------- */
function WalletPage({ onBack }) {
  const [cards, setCards] = useState([{ id: 1, brand: "Visa", last: "4242", def: true }, { id: 2, brand: "Mastercard", last: "8810", def: false }]);
  const [bal, setBal] = useState(0);
  const setDef = (id) => setCards((c) => c.map((x) => ({ ...x, def: x.id === id })));
  const add = () => setCards((c) => [...c, { id: Date.now(), brand: "Amex", last: String(1000 + c.length * 137).slice(-4), def: false }]);
  return (
    <div className="h-full flex flex-col" style={{ background: C.sheet }}>
      <Header title="Wallet" onBack={onBack} />
      <div className="flex-1 overflow-auto px-5">
        <div className="rounded-2xl p-5 mt-1" style={{ background: C.ink, color: "#fff" }}>
          <div style={{ fontSize: 13, opacity: .7, fontWeight: 600 }}>Aquilla Cash</div>
          <div style={{ fontSize: 34, fontWeight: 800, marginTop: 4 }}>${bal.toFixed(2)}</div>
          <button onClick={() => setBal((b) => b + 25)} className="mt-3 rounded-full px-4 py-2 active:scale-95 transition" style={{ background: "#fff", color: C.ink, fontWeight: 700, fontSize: 13 }}>Add $25</button>
        </div>
        <div className="mt-5" style={{ fontSize: 13, fontWeight: 700, color: C.sub }}>PAYMENT METHODS</div>
        <div className="rounded-2xl overflow-hidden mt-2" style={{ border: `1px solid ${C.line}` }}>
          {cards.map((c, i) => (
            <button key={c.id} onClick={() => setDef(c.id)} className="w-full flex items-center gap-3 px-4 py-4 active:bg-neutral-50 transition" style={{ borderTop: i ? `1px solid ${C.line}` : "none" }}>
              <CreditCard size={20} /><span className="flex-1 text-left" style={{ fontWeight: 600, fontSize: 15 }}>{c.brand} •••• {c.last}</span>
              {c.def ? <span className="rounded-full px-2.5 py-1" style={{ background: "#E7F6EE", color: C.green, fontSize: 11, fontWeight: 700 }}>Default</span> : <span style={{ color: C.sub, fontSize: 13, fontWeight: 600 }}>Set default</span>}
            </button>
          ))}
        </div>
        <button onClick={add} className="w-full rounded-2xl mt-4 flex items-center justify-center gap-2 active:scale-[.98] transition" style={{ border: `1.5px solid ${C.line}`, height: 52, fontWeight: 700 }}><Plus size={18} /> Add payment method</button>
      </div>
    </div>
  );
}

/* ---------- SETTINGS ---------- */
function SettingsPage({ onBack, onSignOut }) {
  const [t, setT] = useState({ push: true, location: true, faceid: false, receipts: true });
  const [confirm, setConfirm] = useState(false);
  const flip = (k) => setT((x) => ({ ...x, [k]: !x[k] }));
  const rows = [["push", "Push notifications"], ["location", "Location services"], ["faceid", "Face ID to confirm"], ["receipts", "Email receipts"]];
  return (
    <div className="h-full flex flex-col" style={{ background: C.sheet }}>
      <Header title="Settings" onBack={onBack} />
      <div className="flex-1 overflow-auto px-5">
        <div className="mt-1" style={{ fontSize: 13, fontWeight: 700, color: C.sub }}>PREFERENCES</div>
        <div className="rounded-2xl overflow-hidden mt-2" style={{ border: `1px solid ${C.line}` }}>
          {rows.map(([k, l], i) => <div key={k} className="flex items-center px-4 py-3.5" style={{ borderTop: i ? `1px solid ${C.line}` : "none" }}><span className="flex-1" style={{ fontWeight: 600, fontSize: 15 }}>{l}</span><Toggle on={t[k]} onClick={() => flip(k)} /></div>)}
        </div>
        <div className="mt-5" style={{ fontSize: 13, fontWeight: 700, color: C.sub }}>ACCOUNT</div>
        <button onClick={onSignOut} className="w-full rounded-2xl mt-2 flex items-center gap-3 px-4 py-4 active:bg-neutral-50 transition" style={{ border: `1px solid ${C.line}` }}><LogOut size={20} /><span className="flex-1 text-left" style={{ fontWeight: 600, fontSize: 15 }}>Sign out</span></button>
        {confirm ? (
          <div className="rounded-2xl p-4 mt-3" style={{ border: `1.5px solid ${C.red}` }}>
            <div style={{ fontWeight: 700, color: C.red }}>Delete account?</div>
            <div style={{ color: C.sub, fontSize: 13.5, marginTop: 4 }}>This permanently removes your account and history.</div>
            <div className="flex gap-2 mt-3"><button onClick={() => setConfirm(false)} className="flex-1 rounded-xl py-3" style={{ background: C.sel, fontWeight: 700 }}>Keep account</button><button onClick={onSignOut} className="flex-1 rounded-xl py-3" style={{ background: C.red, color: "#fff", fontWeight: 700 }}>Delete</button></div>
          </div>
        ) : <button onClick={() => setConfirm(true)} className="w-full text-left rounded-2xl mt-3 px-4 py-4" style={{ border: `1px solid ${C.line}`, color: C.red, fontWeight: 600, fontSize: 15 }}>Delete account</button>}
        <div className="text-center mt-6 mb-4" style={{ color: C.sub, fontSize: 12 }}>Aquilla · v1.0</div>
      </div>
    </div>
  );
}

/* ---------- PROMOTIONS ---------- */
function PromotionsPage({ onBack }) {
  const OFFERS = [
    { code: "NEW15", title: "$15 off your first job", desc: "Applied automatically at checkout for new customers.", auto: true },
    { code: "CLEAN20", title: "20% off cleaning this week", desc: "Use code CLEAN20 on any cleaning booking." },
    { code: "REFER20", title: "Refer a friend, get $20", desc: "You both get $20 in Aquilla Cash when they book." },
  ];
  const [code, setCode] = useState(""); const [msg, setMsg] = useState(null);
  const apply = () => { const hit = OFFERS.find((o) => o.code === code.trim().toUpperCase()); setMsg(hit ? { ok: true, text: `${hit.code} applied — ${hit.title.toLowerCase()}.` } : { ok: false, text: "That code isn't valid or has expired." }); };
  return (
    <div className="h-full flex flex-col" style={{ background: C.sheet }}>
      <Header title="Promotions" onBack={onBack} />
      <div className="flex-1 overflow-auto px-5">
        <div className="flex gap-2 mt-1">
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Enter promo code" className="flex-1 rounded-2xl px-4 outline-none text-[15px]" style={{ background: C.sel, height: 52, fontWeight: 600, letterSpacing: 1 }} />
          <button onClick={apply} className="rounded-2xl px-5 active:scale-95 transition" style={{ background: C.ink, color: "#fff", fontWeight: 700 }}>Apply</button>
        </div>
        {msg && <div className="rounded-xl p-3 mt-3 flex items-center gap-2" style={{ background: msg.ok ? "#E7F6EE" : "#FDECEC" }}>{msg.ok ? <Check size={16} color={C.green} /> : <X size={16} color={C.red} />}<span style={{ fontSize: 13.5, fontWeight: 600, color: msg.ok ? "#0B7A4D" : "#B42318" }}>{msg.text}</span></div>}
        <div className="mt-6" style={{ fontSize: 13, fontWeight: 700, color: C.sub }}>AVAILABLE OFFERS</div>
        <div className="flex flex-col gap-3 mt-2 pb-6">
          {OFFERS.map((o) => (
            <div key={o.code} className="rounded-2xl p-4" style={{ border: `1px solid ${C.line}` }}>
              <div className="flex items-center gap-3"><div className="rounded-xl flex items-center justify-center" style={{ background: "#FFF1DD", width: 44, height: 44 }}><Gift size={22} color="#B7791F" /></div>
                <div className="flex-1"><div style={{ fontWeight: 700, fontSize: 15.5 }}>{o.title}</div><div style={{ color: C.sub, fontSize: 12.5, marginTop: 1 }}>{o.desc}</div></div></div>
              <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
                <span className="rounded-md px-2 py-1" style={{ background: C.sel, fontWeight: 800, fontSize: 12, letterSpacing: 1 }}>{o.code}</span>
                {o.auto ? <span style={{ color: C.green, fontSize: 12.5, fontWeight: 700 }}>Active</span> : <button onClick={() => { setCode(o.code); setMsg({ ok: true, text: `${o.code} applied — ${o.title.toLowerCase()}.` }); }} style={{ color: C.ink, fontSize: 13, fontWeight: 700 }}>Apply</button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- POST JOB (Other) ---------- */
function PostJob({ onBack, onPost }) {
  const [desc, setDesc] = useState(""); const [b, setB] = useState("");
  const valid = desc.trim().length > 2 && Number(b) > 0;
  return (
    <div className="h-full flex flex-col" style={{ background: C.sheet }}>
      <Header title="Post a job" onBack={onBack} />
      <div className="flex-1 overflow-auto px-5">
        <div className="flex items-center gap-2 rounded-xl px-3 py-2 mt-1" style={{ background: "#FFF1DD" }}><MoreHorizontal size={16} color="#B7791F" /><span style={{ fontSize: 12.5, color: "#B7791F", fontWeight: 600 }}>Open job — any nearby pro can choose to claim it.</span></div>
        <div className="mt-5" style={{ fontSize: 13, fontWeight: 700, color: C.sub }}>WHAT DO YOU NEED DONE?</div>
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} autoFocus placeholder="e.g. Pick up a package across town, help me move a heavy table, wait for a delivery…" className="w-full mt-2 rounded-2xl p-4 outline-none text-[15px]" style={{ background: C.sel, minHeight: 120, resize: "none" }} />
        <div className="mt-5" style={{ fontSize: 13, fontWeight: 700, color: C.sub }}>YOUR BUDGET</div>
        <div className="flex items-center gap-2 rounded-2xl px-4 mt-2" style={{ background: C.sel, height: 56 }}><span style={{ fontWeight: 800, fontSize: 20 }}>$</span><input value={b} onChange={(e) => setB(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="60" className="bg-transparent outline-none flex-1 text-[18px]" style={{ fontWeight: 700 }} /></div>
        {Number(b) > 0 && <div className="mt-2 px-1" style={{ color: C.sub, fontSize: 12.5 }}>Pro earns ${split(Number(b)).payout} · Aquilla keeps 15% (${split(Number(b)).fee})</div>}
      </div>
      <div className="px-5 pb-6 pt-3"><button disabled={!valid} onClick={() => onPost(desc.trim(), Number(b))} className="w-full rounded-2xl flex items-center justify-center gap-2 active:scale-[.98] transition" style={{ background: valid ? C.ink : "#C9CACE", color: "#fff", height: 54, fontWeight: 700, fontSize: 16 }}><Send size={17} /> Post to nearby pros</button></div>
    </div>
  );
}

/* ---------- OPEN MATCH (pros claim the job) ---------- */
const CLAIM_LABELS = ["Handyman", "Mover", "General pro", "Errand runner", "Painter", "Cleaner"];
function OpenMatch({ jobText, budget, onBack, onPick }) {
  const all = [0, 1, 2].map((i) => { const s = (i * 7 + budget) % 10; return { id: "c" + i, name: `${FIRST[(s + i) % 10]} ${LAST[(s * 2 + i) % 10]}`, label: CLAIM_LABELS[(s + i) % 6], rating: (4.6 + (s % 4) * 0.1).toFixed(1), jobs: 80 + s * 33, eta: 5 + s + i * 3, licensed: false, rate: budget }; }).sort((a, b2) => a.eta - b2.eta);
  const [claimed, setClaimed] = useState([]); const [sel, setSel] = useState(null); const tm = useRef([]);
  useEffect(() => { [900, 1900, 3000].forEach((d, i) => tm.current.push(setTimeout(() => setClaimed((c) => [...c, all[i]]), d))); return () => tm.current.forEach(clearTimeout); }, []);
  const searching = claimed.length < all.length;
  const selected = claimed.find((c) => c.id === sel);
  return (
    <div className="h-full relative" style={{ background: C.bg }}>
      <div className="relative" style={{ height: 290 }}>
        <StreetMap />
        <span className="absolute" style={{ left: "47%", top: "30%", width: 28, height: 28, borderRadius: 99, background: C.blue, opacity: .18, animation: "ping 1.8s ease-out infinite" }} />
        <div className="absolute" style={{ left: "45%", top: "27%", width: 14, height: 14, borderRadius: 99, background: C.blue, border: "3px solid #fff" }} />
        <button onClick={onBack} className="absolute left-4 top-12 rounded-full flex items-center justify-center active:scale-90 transition" style={{ width: 42, height: 42, background: "#fff", boxShadow: "0 2px 10px rgba(0,0,0,.14)" }}><ChevronLeft size={22} /></button>
      </div>
      <div className="sheet absolute left-0 right-0 bottom-0 flex flex-col" style={{ background: C.sheet, borderRadius: "22px 22px 0 0", top: 230, boxShadow: "0 -8px 30px rgba(0,0,0,.12)" }}>
        <div className="flex justify-center pt-2.5"><div style={{ width: 38, height: 4, borderRadius: 99, background: "#D9D9DD" }} /></div>
        <div className="px-5 pt-3 pb-1">
          <div className="flex items-center gap-2"><span style={{ fontWeight: 800, fontSize: 19 }}>{searching ? "Posting your job…" : `${claimed.length} pros want this job`}</span>{searching && <span className="rounded-full" style={{ width: 16, height: 16, border: `2px solid ${C.blue}`, borderTopColor: "transparent", display: "inline-block", animation: "spin .8s linear infinite" }} />}</div>
          <div className="mt-1 rounded-xl px-3 py-2" style={{ background: C.sel, color: C.sub, fontSize: 12.5 }}>“{jobText}” · budget ${budget}</div>
        </div>
        <div className="flex-1 overflow-auto px-3 pt-2" style={{ paddingBottom: 96 }}>
          {claimed.length === 0 ? <div className="text-center py-10" style={{ color: C.sub }}><Search size={30} className="mx-auto mb-2" /><div style={{ fontSize: 14 }}>Sending your request to nearby pros…</div></div>
            : claimed.map((p, i) => { const active = sel === p.id; return (
              <button key={p.id} onClick={() => setSel(p.id)} className="row w-full flex items-center gap-3 rounded-2xl px-3 py-3 mb-1 transition" style={{ background: active ? C.sel : "transparent", border: `1.5px solid ${active ? C.ink : "transparent"}`, animationDelay: "0ms" }}>
                <div className="rounded-full flex items-center justify-center font-bold" style={{ width: 46, height: 46, background: "#E9E9EC", fontSize: 17 }}>{p.name[0]}</div>
                <div className="flex-1 text-left"><div style={{ fontWeight: 700, fontSize: 15.5 }}>{p.name}</div><div className="flex items-center gap-1.5" style={{ color: C.sub, fontSize: 12.5 }}><Star size={12} color={C.ink} fill={C.ink} />{p.rating}<span>·</span>{p.label}<span>·</span>{p.eta} min away</div></div>
                <span className="rounded-full px-2.5 py-1" style={{ background: "#E7F6EE", color: C.green, fontSize: 11, fontWeight: 700 }}>Accepts ${budget}</span>
              </button>); })}
        </div>
        <div className="absolute left-0 right-0 bottom-0 px-5 pb-6 pt-3" style={{ background: "linear-gradient(to top,#fff 70%,transparent)" }}><button disabled={!selected} onClick={() => onPick(selected)} className="w-full rounded-2xl flex items-center justify-center gap-2 active:scale-[.98] transition" style={{ background: selected ? C.ink : "#C9CACE", color: "#fff", height: 54, fontWeight: 700, fontSize: 16 }}><Send size={17} /> {selected ? `Message ${selected.name.split(" ")[0]}` : "Select a pro"}</button></div>
      </div>
    </div>
  );
}

/* ---------- PART NEEDED (multi-day return visit) ---------- */
function PartNeeded({ trade, pro, quote, onBack, onConfirm }) {
  const [parts, setParts] = useState(String(60));
  const [labor, setLabor] = useState(String(quote.price));
  const [days, setDays] = useState(2);
  const [note, setNote] = useState("");
  const P = Number(parts) || 0, L = Number(labor) || 0;
  const fmt = (d) => new Date(Date.now() + d * 86400000).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const OPTS = [["Tomorrow", 1], ["In 2 days", 2], ["In 3 days", 3], ["Next week", 7]];
  const { fee, payout, total } = splitJob(P, L);
  const field = (val, set, label, hint) => (
    <div className="mt-4"><div style={{ fontSize: 13, fontWeight: 700, color: C.sub }} className="mb-1.5">{label}</div>
      <div className="flex items-center gap-2 rounded-2xl px-4" style={{ background: C.sel, height: 54 }}><span style={{ fontWeight: 800, fontSize: 18 }}>$</span><input value={val} onChange={(e) => set(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" className="bg-transparent outline-none flex-1 text-[17px]" style={{ fontWeight: 700 }} /></div>
      {hint && <div className="mt-1 px-1" style={{ color: C.sub, fontSize: 11.5 }}>{hint}</div>}
    </div>
  );
  return (
    <div className="h-full flex flex-col" style={{ background: C.sheet }}>
      <Header title="Needs a part" onBack={onBack} />
      <div className="flex-1 overflow-auto px-5">
        <div className="flex gap-2.5 rounded-xl px-3 py-2.5 mt-1" style={{ background: "#E8F0FE" }}><Clock size={16} color={C.blue} style={{ marginTop: 1, flexShrink: 0 }} /><span style={{ fontSize: 12.5, color: "#174EA6", lineHeight: 1.4 }}>Can't finish today? Send {pro.name.split(" ")[0]}'s quote and a return date. A parts deposit is charged now so they can order it; labor is charged on completion.</span></div>
        {field(parts, setParts, "PARTS (DEPOSIT CHARGED NOW)", "Covers the part so the pro isn't out of pocket.")}
        {field(labor, setLabor, "LABOR (CHARGED ON COMPLETION)")}
        <div className="rounded-2xl p-4 mt-4" style={{ background: C.sel }}>
          <div className="flex justify-between py-1"><span style={{ fontSize: 13.5, color: C.sub }}>Deposit today (parts)</span><span style={{ fontWeight: 700 }}>${P.toFixed(2)}</span></div>
          <div className="flex justify-between py-1"><span style={{ fontSize: 13.5, color: C.sub }}>Balance on completion (labor)</span><span style={{ fontWeight: 700 }}>${L.toFixed(2)}</span></div>
          <div className="flex justify-between py-1" style={{ borderTop: `1px solid #E2E2E5`, marginTop: 4, paddingTop: 8 }}><span style={{ fontSize: 13.5, color: C.sub }}>Aquilla fee (15% labor + 5% parts)</span><span style={{ fontWeight: 700, color: C.green }}>${fee.toFixed(2)}</span></div>
          <div className="flex justify-between py-1"><span style={{ fontSize: 13.5, color: C.sub }}>Pro earns</span><span style={{ fontWeight: 700 }}>${payout.toFixed(2)}</span></div>
        </div>
        <div className="mt-2 px-1" style={{ color: C.sub, fontSize: 12 }}>The $20 visit fee is credited toward this total.</div>
        <div className="mt-5" style={{ fontSize: 13, fontWeight: 700, color: C.sub }}>RETURN VISIT</div>
        <div className="flex flex-wrap gap-2 mt-2">{OPTS.map(([l, d]) => { const on = days === d; return <button key={l} onClick={() => setDays(d)} className="rounded-full px-4 py-2 text-sm active:scale-95 transition" style={{ border: `1.5px solid ${on ? C.ink : C.line}`, background: on ? C.ink : "#fff", color: on ? "#fff" : C.ink, fontWeight: 600 }}>{l}</button>; })}</div>
        <div className="mt-2 px-1" style={{ color: C.sub, fontSize: 12.5 }}>Returns {fmt(days)}</div>
        <div className="mt-5" style={{ fontSize: 13, fontWeight: 700, color: C.sub }}>PART / NOTE (OPTIONAL)</div>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Ordering a replacement compressor" className="w-full mt-2 rounded-2xl p-4 outline-none text-[15px]" style={{ background: C.sel, minHeight: 70, resize: "none" }} />
      </div>
      <div className="px-5 pb-6 pt-3"><button disabled={!(total > 0)} onClick={() => onConfirm(P, L, fmt(days), note.trim())} className="w-full rounded-2xl flex items-center justify-center gap-2 active:scale-[.98] transition" style={{ background: total > 0 ? C.ink : "#C9CACE", color: "#fff", height: 54, fontWeight: 700, fontSize: 16 }}><Check size={18} /> Charge deposit & schedule return</button></div>
    </div>
  );
}

/* ---------- THREAD (open chat until job is done) ---------- */
function Thread({ name, status, onBack }) {
  const [msgs, setMsgs] = useState([{ from: "pro", text: `Hi, it's ${name.split(" ")[0]} \u2014 message me anytime before the job's done.` }]);
  const [text, setText] = useState("");
  const endRef = useRef(null); const tm = useRef([]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);
  useEffect(() => () => tm.current.forEach(clearTimeout), []);
  const REPLIES = ["Sounds good \u2014 thanks for letting me know.", "On it. I'll keep you posted.", "Got it \u2014 see you soon.", "No problem at all."];
  const QUICK = ["Where are you?", "Running late?", "Door code is 1234", "Thanks!"];
  const send = (t) => {
    const v = (t || text).trim(); if (!v) return; setText("");
    setMsgs((m) => [...m, { from: "me", text: v }]);
    tm.current.push(setTimeout(() => setMsgs((m) => [...m, { from: "pro", text: REPLIES[Math.floor(Math.random() * REPLIES.length)] }]), 900));
  };
  return (
    <div className="h-full flex flex-col" style={{ background: C.sheet }}>
      <div className="flex items-center gap-3 px-4 pt-12 pb-3" style={{ borderBottom: `1px solid ${C.line}` }}>
        <button onClick={onBack} className="active:scale-90 transition"><ChevronLeft size={24} /></button>
        <div className="rounded-full flex items-center justify-center font-bold" style={{ width: 40, height: 40, background: "#E9E9EC" }}>{name[0]}</div>
        <div className="flex-1"><div style={{ fontWeight: 700, fontSize: 16 }}>{name}</div><div className="flex items-center gap-1.5"><span className="rounded-full" style={{ width: 7, height: 7, background: C.blue, display: "inline-block" }} /><span style={{ color: C.blue, fontSize: 12, fontWeight: 600 }}>{status}</span></div></div>
        <button className="rounded-full flex items-center justify-center" style={{ width: 40, height: 40, background: C.green, color: "#fff" }}><Phone size={17} /></button>
      </div>
      <div className="flex-1 overflow-auto px-4 py-4 flex flex-col gap-2.5">
        {msgs.map((m, i) => <div key={i} className={`bub flex ${m.from === "me" ? "justify-end" : "justify-start"}`}><div style={{ maxWidth: "78%", padding: "10px 14px", borderRadius: 18, fontSize: 14.5, lineHeight: 1.35, background: m.from === "me" ? C.meBubble : C.proBubble, color: m.from === "me" ? "#fff" : C.ink, borderBottomRightRadius: m.from === "me" ? 5 : 18, borderBottomLeftRadius: m.from === "me" ? 18 : 5 }}>{m.text}</div></div>)}
        <div ref={endRef} />
      </div>
      <div className="px-3 pb-2 flex gap-2 overflow-auto">{QUICK.map((q) => <button key={q} onClick={() => send(q)} className="rounded-full px-3 py-2 active:scale-95 transition shrink-0" style={{ border: `1.5px solid ${C.line}`, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>{q}</button>)}</div>
      <div className="px-3 pb-6 pt-1 flex items-center gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} placeholder="Message" className="flex-1 rounded-full px-4 outline-none text-[15px]" style={{ background: C.sel, height: 48 }} />
        <button onClick={() => send()} className="rounded-full flex items-center justify-center active:scale-90 transition" style={{ width: 48, height: 48, background: C.ink, color: "#fff" }}><Send size={18} /></button>
      </div>
    </div>
  );
}

/* ================= PRO-SIDE APP ================= */
const SEED_REQS = [
  { id: 1, tradeId: "plumb", problem: "Clogged drain", customer: "Alex P.", dist: "1.2", price: 130 },
  { id: 2, tradeId: "roadside", problem: "Dead battery / jump", customer: "Dana K.", dist: "2.0", price: 95 },
  { id: 3, tradeId: "handy", problem: "Mount a TV", customer: "Lee R.", dist: "0.8", price: 120 },
  { id: 4, tradeId: "elec", problem: "Install fixture", customer: "Sam W.", dist: "3.1", price: 165 },
  { id: 5, tradeId: "hvac", problem: "AC not cooling", customer: "Mia T.", dist: "2.4", price: 150 },
  { id: 6, tradeId: "clean", problem: "Deep clean", customer: "Jon B.", dist: "1.6", price: 110 },
  { id: 7, tradeId: "lock", problem: "Locked out", customer: "Ria S.", dist: "0.5", price: 85 },
  { id: 8, tradeId: "paint", problem: "Paint a room", customer: "Theo M.", dist: "3.8", price: 140 },
];

function ProApp({ profile, setup, onEditSetup, onSaveProfile, onExit }) {
  const [tab, setTab] = useState("jobs");
  const [online, setOnline] = useState(true);
  const [requests, setRequests] = useState(SEED_REQS);
  const [active, setActive] = useState(null);
  const [view, setView] = useState("main");
  const [jobsView, setJobsView] = useState("list"); // list | map
  const [jobsSort, setJobsSort] = useState("near");  // near | pay
  const [me, setMe] = useState({ done: 2, missed: 0 });
  const [earn, setEarn] = useState(0);
  const [toast, setToast] = useState("");
  const tm = useRef([]);
  useEffect(() => () => tm.current.forEach(clearTimeout), []);
  const jobs = me.done + me.missed; const rate = me.done / jobs; const lowRate = jobs >= MIN_JOBS && rate < 0.5;
  const myReqs = requests.filter((r) => setup.trades.includes(r.tradeId));
  const sortedReqs = [...myReqs].sort((a, b) =>
    jobsSort === "pay" ? b.price - a.price : parseFloat(a.dist) - parseFloat(b.dist),
  );
  // Place coordinate-less mock requests around the map (deterministic per id),
  // shaped exactly like real job.lat/lng for a later straight swap.
  const reqPins = myReqs.map((r) => ({
    id: String(r.id),
    at: offsetByMiles(MOCK_CENTER, parseFloat(r.dist), (r.id * 47) % 360),
    status: "requested",
    title: tradeById(r.tradeId).name,
    subtitle: `${r.problem} · ${r.customer} · ${r.dist} mi`,
    price: r.price,
    kind: "pro",
  }));
  const acceptById = (id) => { const r = myReqs.find((x) => String(x.id) === String(id)); if (r) accept(r); };
  const flash = (m) => { setToast(m); tm.current.push(setTimeout(() => setToast(""), 2600)); };
  const payOf = (p) => +(p - split(p).fee).toFixed(2);
  const finish = (label) => { setActive(null); setView("main"); setTab("jobs"); flash(label); };
  const accept = (req) => { setActive({ ...req, status: "Active" }); setRequests((r) => r.filter((x) => x.id !== req.id)); setView("active"); };
  const decline = (req) => setRequests((r) => r.filter((x) => x.id !== req.id));
  const complete = () => { const p = payOf(active.price); setEarn((e) => e + p); setMe((s) => ({ ...s, done: s.done + 1 })); finish(`Job complete — you earned $${p.toFixed(2)}`); };
  const finishReturn = () => { const p = payOf(active.price); setEarn((e) => e + p); setMe((s) => ({ ...s, done: s.done + 1 })); finish(`Return visit done — you earned $${p.toFixed(2)}`); };
  const couldntFix = () => { if (lowRate) return; setEarn((e) => e + 18); setMe((s) => ({ ...s, missed: s.missed + 1 })); finish("Visit fee charged — you earned $18.00"); };

  if (view === "thread" && active) return <Thread name={active.customer} status={"Pending · job in progress"} onBack={() => setView("active")} />;
  if (view === "confirm" && active) return <Confirm proName={profile.name} customerName={active.customer} amount={active.price} onBack={() => setView("active")} onResolve={(ok) => { if (ok) complete(); else finish("Disputed \u2014 sent to Aquilla for review"); }} />;
  if (view === "profile") return <EditProfile profile={profile} onBack={() => setView("main")} onSave={(p) => { onSaveProfile && onSaveProfile(p); setView("main"); }} />;

  if (view === "active" && active) {
    const td = tradeById(active.tradeId); const Icon = td.icon; const awaiting = active.status === "Awaiting part";
    return (
      <div className="h-full relative" style={{ background: C.bg }}>
        <div className="relative" style={{ height: 250 }}>
          <StreetMap nav arrived />
          <button onClick={() => { setView("main"); }} className="absolute left-4 top-12 rounded-full flex items-center justify-center active:scale-90 transition" style={{ width: 42, height: 42, background: "#fff", boxShadow: "0 2px 10px rgba(0,0,0,.14)" }}><ChevronLeft size={22} /></button>
          <button className="absolute right-4 top-12 rounded-full flex items-center gap-1.5 px-3 active:scale-95 transition" style={{ height: 42, background: "#fff", boxShadow: "0 2px 10px rgba(0,0,0,.14)", fontWeight: 700, fontSize: 13 }}><Navigation size={15} color={C.blue} fill={C.blue} /> Navigate</button>
        </div>
        <div className="sheet absolute left-0 right-0 bottom-0" style={{ background: C.sheet, borderRadius: "22px 22px 0 0", top: 200, boxShadow: "0 -8px 30px rgba(0,0,0,.14)" }}>
          <div className="flex justify-center pt-2.5"><div style={{ width: 38, height: 4, borderRadius: 99, background: "#D9D9DD" }} /></div>
          <div className="px-5 pt-3 overflow-auto" style={{ maxHeight: 520 }}>
            <div className="flex items-center gap-2"><Icon size={20} /><span style={{ fontWeight: 800, fontSize: 19 }}>{td.name}</span><span className="ml-auto rounded-full px-2.5 py-1" style={{ background: awaiting ? "#E8F0FE" : "#E7F6EE", color: awaiting ? C.blue : C.green, fontSize: 11, fontWeight: 700 }}>{active.status}</span></div>
            <div style={{ color: C.sub, fontSize: 14, marginTop: 2 }}>{active.problem} · {active.dist} mi away</div>
            <div className="flex items-center gap-3 rounded-2xl p-3 mt-4" style={{ background: C.sel }}>
              <div className="rounded-full flex items-center justify-center font-bold" style={{ width: 46, height: 46, background: "#fff" }}>{active.customer[0]}</div>
              <div className="flex-1"><div style={{ fontWeight: 700 }}>{active.customer}</div><div style={{ color: C.sub, fontSize: 12.5 }}>Customer · 142 Maple Ave</div></div>
              <button onClick={() => setView("thread")} className="rounded-full flex items-center justify-center active:scale-90 transition" style={{ width: 44, height: 44, background: "#fff" }}><Send size={17} /></button>
              <button className="rounded-full flex items-center justify-center" style={{ width: 44, height: 44, background: C.green, color: "#fff" }}><Phone size={17} /></button>
            </div>
            <div className="flex justify-between mt-4 px-1"><span style={{ color: C.sub, fontSize: 14 }}>Job price</span><span style={{ fontWeight: 700 }}>${active.price}</span></div>
            <div className="flex justify-between mt-1 px-1"><span style={{ color: C.sub, fontSize: 14 }}>You earn (after 15%)</span><span style={{ fontWeight: 800, color: C.green }}>${payOf(active.price).toFixed(2)}</span></div>
            <div className="mt-4 mb-6 flex flex-col gap-2.5">
              {awaiting ? (
                <button onClick={finishReturn} className="w-full rounded-2xl active:scale-[.98] transition" style={{ background: C.green, color: "#fff", height: 52, fontWeight: 700, fontSize: 16 }}>Mark return visit complete</button>
              ) : (<>
                <button onClick={() => setView("confirm")} className="w-full rounded-2xl active:scale-[.98] transition" style={{ background: C.green, color: "#fff", height: 52, fontWeight: 700, fontSize: 16 }}>Mark completed</button>
                <button onClick={() => setActive((a) => ({ ...a, status: "Awaiting part" }))} className="w-full rounded-2xl active:scale-[.98] transition" style={{ background: C.sel, color: C.ink, height: 50, fontWeight: 700, fontSize: 15 }}>Needs a part — schedule return</button>
                {lowRate ? (
                  <div className="rounded-2xl px-3 py-3 flex items-start gap-2" style={{ background: "#FDECEC", border: `1px solid rgba(234,67,53,.3)` }}><AlertTriangle size={16} color={C.red} style={{ marginTop: 1, flexShrink: 0 }} /><span style={{ fontSize: 12.5, color: "#B42318", lineHeight: 1.4 }}>Your completion rate is below 50%. The $20 visit fee is paused while your account is reviewed.</span></div>
                ) : (
                  <button onClick={couldntFix} className="w-full rounded-2xl active:scale-[.98] transition" style={{ border: `1.5px solid ${C.line}`, color: C.sub, height: 48, fontWeight: 700, fontSize: 14 }}>Couldn't fix it — charge $20 visit fee</button>
                )}
              </>)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ background: C.sheet }}>
      <div className="flex-1 overflow-auto">
        {tab === "jobs" && (
          <div>
            <div className="px-5 pt-12 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2"><div style={{ background: C.ink, color: "#fff", borderRadius: 10, padding: 6 }}><Wrench size={16} strokeWidth={2.5} /></div><span style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>Aquilla Pro</span></div>
              <div className="flex items-center gap-2"><span style={{ fontSize: 13, fontWeight: 700, color: online ? C.green : C.sub }}>{online ? "Online" : "Offline"}</span><Toggle on={online} onClick={() => setOnline((o) => !o)} /></div>
            </div>
            {active && <div className="px-5 mt-2"><button onClick={() => setView("active")} className="w-full flex items-center gap-3 rounded-2xl p-4 active:scale-[.98] transition" style={{ background: C.ink, color: "#fff" }}><Clock size={20} /><div className="flex-1 text-left"><div style={{ fontWeight: 700 }}>Active job in progress</div><div style={{ fontSize: 12.5, opacity: .8 }}>{tradeById(active.tradeId).name} · {active.customer}</div></div><ChevronRight size={18} /></button></div>}
            <div className="px-5 mt-4">
              {!online ? (
                <div className="text-center py-16" style={{ color: C.sub }}><div style={{ fontWeight: 700, fontSize: 16 }}>You're offline</div><div style={{ fontSize: 13.5, marginTop: 4 }}>Go online to start receiving job requests.</div></div>
              ) : lowRate ? (
                <div className="rounded-2xl p-4 flex gap-2.5" style={{ background: "#FDECEC", border: `1px solid rgba(234,67,53,.3)` }}><AlertTriangle size={18} color={C.red} className="shrink-0" style={{ marginTop: 1 }} /><div><div style={{ fontWeight: 700, color: "#B42318" }}>New jobs paused</div><div style={{ fontSize: 12.5, color: "#B42318", marginTop: 2, lineHeight: 1.4 }}>Your completion rate dropped below 50%. New requests are paused while Aquilla reviews your account. Completing jobs will restore access.</div></div></div>
              ) : (<>
                {/* Feed controls: list/map toggle + sort */}
                <div className="flex items-center justify-between mb-3">
                  <div className="rounded-full p-0.5 flex" style={{ background: C.sel }}>
                    {[["list", "List"], ["map", "Map"]].map(([v, l]) => (
                      <button key={v} onClick={() => setJobsView(v)} className="rounded-full px-4 py-1.5 text-[13px] transition" style={{ background: jobsView === v ? "#fff" : "transparent", fontWeight: 700, color: jobsView === v ? C.ink : C.sub, boxShadow: jobsView === v ? "0 1px 4px rgba(14,23,38,.12)" : "none" }}>{l}</button>
                    ))}
                  </div>
                  <button onClick={() => setJobsSort((s) => s === "near" ? "pay" : "near")} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px]" style={{ background: C.sel, fontWeight: 700, color: C.sub }}>
                    <LayoutGrid size={13} /> {jobsSort === "near" ? "Nearest" : "Top pay"}
                  </button>
                </div>

                {jobsView === "map" ? (
                  <div className="rounded-2xl overflow-hidden" style={{ height: 460, border: `1px solid ${C.line}` }}>
                    <MapExperience pins={reqPins} title="Jobs near you" selectLabel="Accept" statusLabel="Open" onSelect={(p) => acceptById(p.id)} />
                  </div>
                ) : myReqs.length === 0 ? (
                  <div className="text-center py-12" style={{ color: C.sub, fontSize: 14 }}>No requests for your trades right now.</div>
                ) : sortedReqs.map((req, i) => { const Icon = tradeById(req.tradeId).icon; return (
                  <div key={req.id} className="row rounded-2xl p-4 mb-3 bg-card shadow-card" style={{ animationDelay: `${i * 45}ms` }}>
                    <div className="flex items-center gap-3">
                      <div className="rounded-md flex items-center justify-center shrink-0" style={{ background: C.sel, width: 46, height: 46 }}><Icon size={21} color={C.ink} /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2"><span style={{ fontWeight: 800, fontSize: 15.5, letterSpacing: -0.2 }}>{tradeById(req.tradeId).name}</span><StatusPill status="requested" label="New request" appearance="tint" className="px-2 py-0.5" /></div>
                        <div className="truncate" style={{ color: C.sub, fontSize: 12.5, marginTop: 2 }}>{req.problem} · {req.customer} · {req.dist} mi away</div>
                      </div>
                      <div className="text-right shrink-0">
                        <Money amount={req.price} size="lg" />
                        <div className="flex items-center justify-end gap-1" style={{ marginTop: 2 }}><span style={{ color: C.sub, fontSize: 11, fontWeight: 600 }}>you earn</span><Money amount={payOf(req.price)} size="sm" className="text-status-completed" /></div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
                      <Button variant="secondary" className="flex-1" onClick={() => decline(req)}>Decline</Button>
                      <Button className="flex-1" onClick={() => accept(req)}>Accept</Button>
                    </div>
                  </div>); })}
              </>)}
            </div>
          </div>
        )}
        {tab === "earnings" && (
          <EarningsDashboard liveEarnings={earn} jobsDone={me.done} completionRate={rate} lowRate={lowRate} />
        )}
        {tab === "account" && (
          <div className="px-5 pt-12">
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>Account</div>
            <button onClick={() => setView("profile")} className="w-full flex items-center gap-3 py-4 active:opacity-70 transition">
              <div className="rounded-full flex items-center justify-center font-bold" style={{ width: 60, height: 60, background: C.ink, color: "#fff", fontSize: 24 }}>{profile.name[0]}</div>
              <div className="flex-1 text-left"><div style={{ fontWeight: 800, fontSize: 20 }}>{profile.name}</div><div className="flex items-center gap-1" style={{ color: C.sub, fontSize: 13 }}><Star size={13} color={C.gold} fill={C.gold} />{profile.rating} · Pro · {Math.round(rate * 100)}% completion</div></div>
              <ChevronRight size={20} color={C.sub} />
            </button>
            <div className="rounded-2xl p-4 mt-1 mb-3" style={{ background: C.sel }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.sub }} className="mb-2">YOUR SERVICES</div>
              <div className="flex flex-wrap gap-1.5">{setup.trades.map((id) => <span key={id} className="rounded-full px-2.5 py-1" style={{ background: "#fff", fontSize: 12, fontWeight: 600 }}>{tradeById(id).name}</span>)}</div>
              <div style={{ color: C.sub, fontSize: 13, marginTop: 10 }}>{setup.area} \u00b7 {setup.radius} mi radius{setup.license ? ` \u00b7 License ${setup.license.number} (${setup.license.state})` : ""}</div>
              <button onClick={onEditSetup} className="w-full rounded-xl mt-3 flex items-center justify-center gap-2 active:scale-95 transition" style={{ background: "#fff", height: 44, fontWeight: 700, fontSize: 14 }}><Pencil size={15} /> Edit services, area & license</button>
            </div>
            <div className="rounded-2xl overflow-hidden mt-1" style={{ border: `1px solid ${C.line}` }}>
              <div className="flex items-center gap-3 px-4 py-4"><Shield size={20} color={C.green} /><span className="flex-1" style={{ fontWeight: 600 }}>License & insurance</span><span className="rounded-full px-2 py-0.5" style={{ background: "#E7F6EE", color: C.green, fontSize: 11, fontWeight: 700 }}>Verified</span></div>
              <div className="flex items-center gap-3 px-4 py-4" style={{ borderTop: `1px solid ${C.line}` }}><Wallet size={20} /><span className="flex-1" style={{ fontWeight: 600 }}>Instant payouts</span><span style={{ color: C.sub, fontSize: 13 }}>•••• 4242</span></div>
            </div>
            <button onClick={onExit} className="w-full rounded-2xl mt-4 flex items-center justify-center gap-2 active:scale-[.98] transition" style={{ background: C.sel, color: C.ink, height: 52, fontWeight: 700 }}><ArrowRight size={18} /> Switch to customer app</button>
          </div>
        )}
      </div>
      {toast && <div className="absolute left-0 right-0 flex justify-center" style={{ bottom: 92 }}><div className="rounded-full px-4 py-2.5" style={{ background: C.ink, color: "#fff", fontWeight: 700, fontSize: 13.5, boxShadow: "0 6px 20px rgba(0,0,0,.25)" }}>{toast}</div></div>}
      <div className="flex" style={{ borderTop: `1px solid ${C.line}`, background: "#fff", paddingTop: 8, paddingBottom: 14 }}>
        {[["jobs", "Jobs", LayoutGrid], ["earnings", "Earnings", Wallet], ["account", "Account", User]].map(([k, l, Icon]) => { const on = tab === k; return (
          <button key={k} onClick={() => setTab(k)} className="flex-1 flex flex-col items-center gap-1 active:scale-95 transition" style={{ color: on ? C.ink : "#A4A7AD" }}><Icon size={24} strokeWidth={on ? 2.4 : 2} /><span style={{ fontSize: 11, fontWeight: on ? 800 : 600 }}>{l}</span></button>); })}
      </div>
    </div>
  );
}

/* ---------- PRO ONBOARDING (required before going live) ---------- */
function ProOnboarding({ initial, editing, onDone, onCancel }) {
  const init = initial || {};
  const [step, setStep] = useState(0);
  const [trades, setTrades] = useState(init.trades || []);
  const [exp, setExp] = useState(init.exp || "");
  const [area, setArea] = useState(init.area || "");
  const [radius, setRadius] = useState(init.radius || 10);
  const [lic, setLic] = useState(init.license ? init.license.number : "");
  const [licState, setLicState] = useState(init.license ? init.license.state : "");
  const [insured, setInsured] = useState(!!init.insured);
  const [bg, setBg] = useState(!!editing);
  const needsLicense = trades.some((id) => tradeById(id).licReq);
  const licensedNames = trades.filter((id) => tradeById(id).licReq).map((id) => tradeById(id).name);
  const toggle = (id) => setTrades((t) => t.includes(id) ? t.filter((x) => x !== id) : [...t, id]);
  const STEPS = ["Trades", "Area", "Credentials", "Review"];
  const canNext = step === 0 ? trades.length > 0
    : step === 1 ? area.trim().length > 1
    : step === 2 ? (bg && (!needsLicense || (lic.trim() && licState.trim() && insured)))
    : true;
  // Tell the pro exactly what's missing rather than just disabling the button.
  const hint = canNext ? null
    : step === 0 ? "Pick at least one trade to continue"
    : step === 1 ? "Enter the city or ZIP you work in"
    : step === 2 ? (needsLicense ? "Add your license number, state, insurance & consent" : "Consent to a background check to continue")
    : null;
  const back = () => (step === 0 ? onCancel() : setStep(step - 1));
  const next = () => { if (step < 3) setStep(step + 1); else onDone({ trades, exp, area: area.trim(), radius, license: needsLicense ? { number: lic.trim(), state: licState.trim().toUpperCase() } : null, insured }); };
  const Box = ({ on }) => <div className={cn("flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-sm border-2 transition-colors", on ? "border-primary bg-primary" : "border-muted-foreground/40 bg-card")}>{on && <Check size={14} color="#fff" strokeWidth={3} />}</div>;
  const chip = (on) => cn("rounded-full px-4 py-2 text-sm font-semibold transition active:scale-95", on ? "bg-primary text-primary-foreground" : "border-[1.5px] border-border bg-card text-foreground");
  const inputCls = "mt-2 h-[54px] w-full rounded-md bg-secondary px-4 text-[16px] outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const eyebrow = "text-[13px] font-bold uppercase tracking-wide text-muted-foreground";

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex items-center gap-3 px-4 pb-2 pt-12">
        <button onClick={back} className="transition active:scale-90"><ChevronLeft size={24} /></button>
        <span className="text-[18px] font-extrabold">{editing ? "Edit pro profile" : "Become an Aquilla Pro"}</span>
      </div>

      {/* Stepper: counter + current label + segmented progress */}
      <div className="px-5 pt-1">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[12px] font-bold uppercase tracking-wide text-primary">Step {step + 1} of {STEPS.length}</span>
          <span className="text-[12px] font-semibold text-muted-foreground">{STEPS[step]}</span>
        </div>
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors duration-300", i <= step ? "bg-primary" : "bg-border")} />
          ))}
        </div>
      </div>

      <div key={step} className="animate-fade-up flex-1 overflow-auto px-5 pt-4">
        {step === 0 && (<>
          <h2 className="text-[22px] font-extrabold tracking-tight">What services do you offer?</h2>
          <p className="mt-1 text-[14px] text-muted-foreground">Pick all that apply — you'll only get matching jobs.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {TRADES.filter((t) => !t.open).map((t) => { const Icon = t.icon; const on = trades.includes(t.id); return (
              <button key={t.id} onClick={() => toggle(t.id)} aria-pressed={on} className={cn("rounded-lg border-[1.5px] p-4 text-left transition active:scale-[.97]", on ? "border-primary bg-accent ring-1 ring-primary" : "border-border bg-card")}>
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-card"><Icon size={20} className={on ? "text-primary" : "text-foreground"} /></div>
                  <Box on={on} />
                </div>
                <div className="mt-3 text-[14.5px] font-bold">{t.name}</div>
                {t.licReq && <div className="mt-0.5 flex items-center gap-1 text-[11px] font-bold text-trust"><Shield size={11} /> License required</div>}
              </button>); })}
          </div>
          <div className={cn("mt-5", eyebrow)}>Experience</div>
          <div className="mt-2 flex flex-wrap gap-2">{["< 1 yr", "1–3 yrs", "3–5 yrs", "5+ yrs"].map((e) => <button key={e} onClick={() => setExp(e)} className={chip(exp === e)}>{e}</button>)}</div>
        </>)}

        {step === 1 && (<>
          <h2 className="text-[22px] font-extrabold tracking-tight">Where do you work?</h2>
          <p className="mt-1 text-[14px] text-muted-foreground">We'll only send you jobs inside your area.</p>
          <div className={cn("mt-4", eyebrow)}>City or ZIP</div>
          <input value={area} onChange={(e) => setArea(e.target.value)} autoFocus placeholder="e.g. Brooklyn, NY or 11201" className={inputCls} />
          <div className={cn("mt-5", eyebrow)}>Service radius</div>
          <div className="mt-2 flex flex-wrap gap-2">{[5, 10, 20, 50].map((m) => <button key={m} onClick={() => setRadius(m)} className={chip(radius === m)}>{m} mi</button>)}</div>
        </>)}

        {step === 2 && (<>
          <h2 className="text-[22px] font-extrabold tracking-tight">Credentials & trust</h2>
          {needsLicense ? (<>
            <div className="mt-4 flex gap-2.5 rounded-md bg-trust/10 p-3"><Shield size={16} className="mt-0.5 shrink-0 text-trust" /><span className="text-[12.5px] leading-snug text-status-completed">{licensedNames.join(", ")} require a verified license & insurance.</span></div>
            <div className={cn("mt-4", eyebrow)}>License number</div>
            <input value={lic} onChange={(e) => setLic(e.target.value)} placeholder="License #" className={inputCls} />
            <div className={cn("mt-3", eyebrow)}>Issuing state</div>
            <input value={licState} onChange={(e) => setLicState(e.target.value)} maxLength={2} placeholder="e.g. NY" className={cn(inputCls, "uppercase")} />
            <button onClick={() => setInsured((v) => !v)} className="mt-4 flex w-full items-center gap-3 text-left"><Box on={insured} /><span className="text-[14.5px] font-semibold">I carry liability insurance</span></button>
          </>) : (
            <div className="mt-4 rounded-md bg-secondary p-3 text-[13px] leading-relaxed text-muted-foreground">Your selected trades don't require a license. You'll still be background-checked before going live.</div>
          )}
          <button onClick={() => setBg((v) => !v)} className="mt-4 flex w-full items-center gap-3 text-left"><Box on={bg} /><span className="text-[14.5px] font-semibold">I consent to a background check</span></button>
        </>)}

        {step === 3 && (<>
          <h2 className="text-[22px] font-extrabold tracking-tight">Review & go live</h2>
          <div className="mt-4 rounded-lg border border-border p-4">
            <div className={eyebrow}>Services</div>
            <div className="mt-2 flex flex-wrap gap-1.5">{trades.map((id) => <span key={id} className="rounded-full bg-secondary px-2.5 py-1 text-[12px] font-semibold">{tradeById(id).name}</span>)}</div>
            <div className="mt-4 flex justify-between border-t border-border pt-3"><span className="text-[14px] text-muted-foreground">Experience</span><span className="font-semibold">{exp || "—"}</span></div>
            <div className="mt-2 flex justify-between"><span className="text-[14px] text-muted-foreground">Area</span><span className="font-semibold">{area} · {radius} mi</span></div>
            <div className="mt-2 flex justify-between"><span className="text-[14px] text-muted-foreground">License</span><span className="font-semibold">{needsLicense ? `${lic} (${licState.toUpperCase()})` : "Not required"}</span></div>
            <div className="mt-2 flex justify-between"><span className="text-[14px] text-muted-foreground">Background check</span><span className="flex items-center gap-1 font-semibold text-trust"><Check size={14} /> Consented</span></div>
          </div>
          <p className="mt-3 px-1 text-[12.5px] leading-relaxed text-muted-foreground">Verification usually completes within 24 hours. You can start receiving jobs once approved.</p>
        </>)}
      </div>

      <div className="px-5 pb-6 pt-3">
        {hint && <p className="mb-2 text-center text-[12.5px] font-semibold text-muted-foreground">{hint}</p>}
        <Button size="lg" disabled={!canNext} onClick={next} className="w-full">
          {step < 3 ? "Continue" : editing ? "Save changes" : "Go live as a pro"} <ArrowRight size={18} />
        </Button>
      </div>
    </div>
  );
}

/* ---------- CONFIRM COMPLETION (both sides must agree) ---------- */
function Confirm({ proName, customerName, amount, onBack, onResolve }) {
  const [client, setClient] = useState(null);
  const [proAns, setProAns] = useState(null);
  const [secs, setSecs] = useState(12);
  const [autoC, setAutoC] = useState(false);
  const [autoP, setAutoP] = useState(false);
  useEffect(() => { if (secs <= 0) return; const id = setTimeout(() => setSecs((x) => x - 1), 1000); return () => clearTimeout(id); }, [secs]);
  useEffect(() => { if (secs !== 0) return; if (client === null) { setAutoC(true); setClient(true); } if (proAns === null) { setAutoP(true); setProAns(true); } }, [secs]);
  const both = client !== null && proAns !== null;
  const agreed = client === true && proAns === true;
  const Choice = ({ val, set, kind, children }) => {
    const on = val === (kind === "yes");
    return (
      <button
        onClick={() => set(kind === "yes")}
        aria-pressed={on}
        className={cn(
          "flex flex-1 items-center justify-center gap-1.5 rounded-md border-[1.5px] py-2.5 text-[14px] font-bold transition active:scale-95",
          on && kind === "yes" && "border-trust bg-trust/10 text-status-completed",
          on && kind === "no" && "border-destructive bg-destructive/10 text-destructive",
          !on && "border-border bg-card text-foreground",
        )}
      >
        {kind === "yes" ? <Check size={15} /> : <X size={15} />}
        {children}
      </button>
    );
  };
  const Row = ({ label, who, val, set, auto }) => (
    <div className="mt-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="text-[14.5px] font-bold">{label}</div>
        {auto && <span className="rounded-full bg-accent px-2 py-0.5 text-[10.5px] font-bold text-accent-foreground">Auto-confirmed</span>}
        {!auto && val !== null && <span className={cn("text-[10.5px] font-bold uppercase tracking-wide", val ? "text-status-completed" : "text-destructive")}>{val ? "Completed" : "Not completed"}</span>}
      </div>
      <div className="mt-0.5 text-[12.5px] font-medium text-muted-foreground">{who}</div>
      <div className="mt-3 flex gap-2">
        <Choice val={val} set={set} kind="yes">Completed</Choice>
        <Choice val={val} set={set} kind="no">Not completed</Choice>
      </div>
    </div>
  );
  return (
    <div className="flex h-full flex-col bg-card">
      <Header title="Confirm completion" onBack={onBack} />
      <div className="flex-1 overflow-auto px-5">
        <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">
          Both sides confirm before payment is released — if you disagree it goes to review, so neither side can lie. If one side doesn't respond within 24 hours, the job auto-confirms as complete so the pro still gets paid.
        </p>

        {/* Funds-held trust strip */}
        <div className="mt-3 flex items-center gap-2.5 rounded-lg bg-secondary p-3.5">
          <Lock size={17} className="shrink-0 text-foreground" />
          <span className="text-[12.5px] font-medium leading-snug text-muted-foreground">
            {amount != null ? <><Money amount={amount} size="sm" /> is </> : "Payment is "}
            held securely in escrow — released the moment you both confirm.
          </span>
        </div>

        {secs > 0 ? (
          <div className="mt-3 flex items-center gap-2.5 rounded-lg bg-status-requested/10 p-3">
            <Clock size={16} className="text-status-requested" />
            <span className="tnum text-[12.5px] font-semibold text-status-requested">Auto-confirms in 24h if no response · demo: {secs}s</span>
          </div>
        ) : (autoC || autoP) ? (
          <div className="mt-3 flex items-center gap-2.5 rounded-lg bg-status-requested/10 p-3">
            <Check size={16} className="text-status-requested" />
            <span className="text-[12.5px] font-semibold text-status-requested">Window elapsed — unanswered side auto-confirmed as complete.</span>
          </div>
        ) : null}

        <Row label="Customer's confirmation" who={customerName || "Customer"} val={client} set={setClient} auto={autoC} />
        <Row label="Pro's confirmation" who={proName || "Pro"} val={proAns} set={setProAns} auto={autoP} />

        {both && (
          <div className={cn("mt-4 flex gap-2.5 rounded-lg p-3.5", agreed ? "bg-trust/10" : "bg-destructive/10")}>
            {agreed ? <Check size={18} className="mt-0.5 shrink-0 text-status-completed" /> : <AlertTriangle size={18} className="mt-0.5 shrink-0 text-destructive" />}
            <div>
              <div className={cn("text-[13.5px] font-bold", agreed ? "text-status-completed" : "text-destructive")}>
                {agreed ? "Both confirmed — releasing payment" : "Disagreement — funds stay held"}
              </div>
              <div className={cn("mt-0.5 text-[12.5px] leading-snug", agreed ? "text-status-completed/90" : "text-destructive/90")}>
                {agreed
                  ? "The pro is paid out instantly, minus Aquilla's fee."
                  : "Sent to Aquilla for review. Nobody is paid until it's resolved."}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="px-5 pb-6 pt-3">
        <button
          disabled={!both}
          onClick={() => onResolve(agreed)}
          className={cn(
            "h-[54px] w-full rounded-md text-[16px] font-bold text-white transition active:scale-[.98] disabled:opacity-100",
            !both ? "bg-muted-foreground/40" : agreed ? "bg-trust" : "bg-destructive",
          )}
        >
          {!both ? "Waiting on both sides…" : agreed ? "Release payment" : "Send to review"}
        </button>
      </div>
    </div>
  );
}
