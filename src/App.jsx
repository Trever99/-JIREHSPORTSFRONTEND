import { useState, useEffect, useRef, useCallback } from "react";
import PharmacyScreening from "./components/PharmacyScreening.jsx";
import CoachAssessment from "./components/CoachAssessment.jsx";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ============================================================
// HELPERS
// ============================================================
function calcAge(dob) {
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}
function daysSince(dateStr) {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}
function gradeColor(grade) {
  if (grade === "Green") return "#22c55e";
  if (grade === "Yellow") return "#eab308";
  if (grade === "Red") return "#ef4444";
  return "#6b7280";
}
function gradeEmoji(grade) {
  if (grade === "Green") return "🟢";
  if (grade === "Yellow") return "🟡";
  if (grade === "Red") return "🔴";
  return "⚪";
}

const POSITIONS = ["Striker", "Midfielder", "Winger", "Defender", "Goalkeeper", "Centre-Back", "Full-Back"];

// ============================================================
// GLOBAL STYLES
// ============================================================
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@500;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --navy: #0a1628; --navy-mid: #0f2040; --navy-light: #1a3260;
      --gold: #d4a017; --gold-light: #f5c842; --gold-dim: #9a7010;
      --white: #f5f0e8; --white-dim: #c8bfaa; --red: #c0392b;
      --surface: #111e35; --border: rgba(212,160,23,0.2);
    }
    html { scroll-behavior: smooth; }
body { font-family: 'Barlow', sans-serif; background: var(--navy); color: var(--white); min-height: 100vh; overflow-x: hidden; }    button { cursor: pointer; font-family: 'Barlow', sans-serif; }
    input, select, textarea { font-family: 'Barlow', sans-serif; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: var(--navy); }
    ::-webkit-scrollbar-thumb { background: var(--gold-dim); border-radius: 3px; }
    @keyframes ticker { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulse-gold { 0%, 100% { box-shadow: 0 0 0 0 rgba(212,160,23,0.4); } 50% { box-shadow: 0 0 0 12px rgba(212,160,23,0); } }
    @keyframes spin { to { transform: rotate(360deg); } }
    .btn-primary { background: var(--gold); color: var(--navy); border: none; padding: 12px 28px; font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 15px; letter-spacing: 1.5px; text-transform: uppercase; cursor: pointer; transition: all 0.2s; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); }
    .btn-primary:hover { background: var(--gold-light); transform: translateY(-2px); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary { background: transparent; color: var(--gold); border: 1px solid var(--gold); padding: 10px 24px; font-family: 'Barlow Condensed', sans-serif; font-weight: 600; font-size: 14px; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; transition: all 0.2s; }
    .btn-secondary:hover { background: rgba(212,160,23,0.1); }
    .card { background: var(--surface); border: 1px solid var(--border); padding: 24px; }
    .input-field { background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: var(--white); padding: 10px 14px; font-size: 14px; width: 100%; transition: border-color 0.2s; outline: none; }
    .input-field:focus { border-color: var(--gold); }
    .input-field::placeholder { color: var(--white-dim); opacity: 0.5; }
    select.input-field option { background: var(--navy-mid); color: var(--white); }
    .badge-green { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); padding: 3px 10px; font-size: 12px; font-weight: 600; }
    .badge-yellow { background: rgba(234,179,8,0.15); color: #eab308; border: 1px solid rgba(234,179,8,0.3); padding: 3px 10px; font-size: 12px; font-weight: 600; }
    .badge-red { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); padding: 3px 10px; font-size: 12px; font-weight: 600; }
    .badge-pending { background: rgba(107,114,128,0.15); color: #9ca3af; border: 1px solid rgba(107,114,128,0.3); padding: 3px 10px; font-size: 12px; font-weight: 600; }
    label { font-size: 12px; letter-spacing: 1px; text-transform: uppercase; color: var(--white-dim); display: block; margin-bottom: 6px; font-weight: 600; }
    .form-group { margin-bottom: 16px; }
    .divider { border: none; border-top: 1px solid var(--border); margin: 24px 0; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--white-dim); padding: 10px 12px; border-bottom: 1px solid var(--border); }
    td { padding: 12px; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; }
    tr:hover td { background: rgba(255,255,255,0.02); }
    .toast { position: fixed; bottom: 30px; right: 30px; background: var(--gold); color: var(--navy); padding: 14px 22px; font-weight: 700; font-size: 14px; z-index: 9999; animation: fadeUp 0.4s ease; max-width: 340px; }
    .toast.error { background: #ef4444; color: white; }
    .toast.info { background: var(--navy-light); color: var(--gold); border: 1px solid var(--gold); }
    .spinner { width: 20px; height: 20px; border: 2px solid rgba(212,160,23,0.3); border-top-color: var(--gold); border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; }
  `}</style>
);

// ============================================================
// TOAST
// ============================================================
function Toast({ message, type = "success", onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return <div className={`toast ${type}`}>{message}</div>;
}

// ============================================================
// NAV
// ============================================================
function Nav({ view, setView }) {
  const navItems = [
    { key: "public", label: "Home" },
    { key: "chatbot", label: "Apply Now" },
    { key: "noticeboard", label: "Notice Board" },
    { key: "pharmacy", label: "Partner Portal" },
    { key: "pharmacy-screening", label: "Pharmacy Screening" },
    { key: "assessor", label: "Assessor Portal" },
    { key: "coach-assessment", label: "Coach Assessment" },
    { key: "admin", label: "Admin" },
  ];
  return (
    <nav style={{ background: "rgba(10,22,40,0.97)", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(10px)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 60 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "var(--gold)", clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "var(--navy)", fontWeight: 900, fontSize: 14, fontFamily: "Bebas Neue" }}>J</span>
          </div>
          <span style={{ fontFamily: "Bebas Neue", fontSize: 22, letterSpacing: 3, color: "var(--gold)" }}>JIREH SPORTS</span>
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {navItems.map(n => (
            <button key={n.key} onClick={() => setView(n.key)}
              style={{ background: view === n.key ? "var(--gold)" : "transparent", color: view === n.key ? "var(--navy)" : "var(--white-dim)", border: "none", padding: "6px 14px", fontSize: 12, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", transition: "all 0.2s", cursor: "pointer", fontFamily: "Barlow Condensed" }}>
              {n.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

// ============================================================
// PUBLIC LANDING PAGE
// ============================================================
function PublicPage({ setView }) {
  const [roster, setRoster] = useState([]);
  const [stats, setStats] = useState({ verifiedPlayers: 0, greenPlayers: 0, upcomingEvents: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/public/roster`).then(r => r.json()),
      fetch(`${API}/api/public/stats`).then(r => r.json()),
    ]).then(([rosterData, statsData]) => {
      setRoster(Array.isArray(rosterData) ? rosterData : []);
      setStats(statsData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const tickerItems = roster.filter(p => p.fitness_grade === "Green").map(p =>
    `Just Verified: ${p.display_name} — ${p.city} — STATUS: GREEN ✓`
  );

  return (
    <div>
      <div style={{ background: "var(--gold)", overflow: "hidden", height: 36, display: "flex", alignItems: "center" }}>
        <div style={{ whiteSpace: "nowrap", animation: "ticker 30s linear infinite", color: "var(--navy)", fontSize: 13, fontWeight: 700 }}>
          {tickerItems.length > 0 ? tickerItems.concat(tickerItems).join("   ·   ") : "Welcome to Jireh Sports Management · Talent is everywhere. Verified data is rare."}
        </div>
      </div>

      <div style={{ position: "relative", minHeight: "85vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #0a1628 0%, #0f2040 50%, #1a0a05 100%)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 50%, rgba(212,160,23,0.08) 0%, transparent 50%)" }} />
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "60px 24px", animation: "fadeUp 0.8s ease" }}>
          <div style={{ fontFamily: "Barlow Condensed", fontSize: 13, letterSpacing: 4, color: "var(--gold)", textTransform: "uppercase", marginBottom: 20 }}>◆ JIREH SPORTS MANAGEMENT ◆</div>
          <h1 style={{ fontFamily: "Bebas Neue", fontSize: "clamp(52px, 8vw, 110px)", lineHeight: 0.9, color: "var(--white)", marginBottom: 24, letterSpacing: 2 }}>
            TALENT IS<br /><span style={{ color: "var(--gold)" }}>EVERYWHERE.</span><br />VERIFIED DATA<br />IS RARE.
          </h1>
          <p style={{ fontFamily: "Barlow Condensed", fontSize: 20, letterSpacing: 2, color: "var(--white-dim)", marginBottom: 40, maxWidth: 600, margin: "0 auto 40px" }}>
            Enter the Jireh Ecosystem — where your stats speak louder than promises.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={() => setView("chatbot")} style={{ fontSize: 18, padding: "16px 40px", animation: "pulse-gold 2s infinite" }}>APPLY NOW →</button>
            <button className="btn-secondary" onClick={() => setView("noticeboard")}>View Combines</button>
          </div>
        </div>
      </div>

      <div style={{ background: "var(--gold)", padding: "20px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, textAlign: "center" }}>
          {[
            { val: stats.verifiedPlayers || 0, label: "Verified Players" },
            { val: stats.greenPlayers || 0, label: "Match-Fit (Green)" },
            { val: stats.upcomingEvents || 0, label: "Upcoming Combines" },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontFamily: "Bebas Neue", fontSize: 48, color: "var(--navy)", lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontFamily: "Barlow Condensed", fontSize: 13, letterSpacing: 2, color: "var(--navy)", textTransform: "uppercase", opacity: 0.75 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "60px auto", padding: "0 24px" }}>
        <div style={{ fontFamily: "Bebas Neue", fontSize: 36, color: "var(--gold)", marginBottom: 8, letterSpacing: 2 }}>ACTIVE ROSTER</div>
        <p style={{ color: "var(--white-dim)", marginBottom: 30, fontSize: 14 }}>Verified players on the active trial list.</p>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}><div className="spinner" /></div>
        ) : roster.length === 0 ? (
          <div className="card" style={{ textAlign: "center", color: "var(--white-dim)", padding: 40 }}>No verified players yet. Be the first to apply!</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {roster.map(p => (
              <div key={p.official_id} className="card" style={{ position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, right: 0, width: 4, height: "100%", background: gradeColor(p.fitness_grade) }} />
                <div style={{ fontFamily: "Bebas Neue", fontSize: 20, letterSpacing: 1, marginBottom: 2 }}>{p.display_name}</div>
                <div style={{ color: "var(--gold)", fontSize: 12, fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>{p.position}</div>
                <div style={{ fontSize: 12, color: "var(--white-dim)", marginBottom: 12 }}>📍 {p.city}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{gradeEmoji(p.fitness_grade)}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: gradeColor(p.fitness_grade) }}>
                    {p.fitness_grade === "Green" ? "MATCH-FIT" : p.fitness_grade === "Yellow" ? "IN DEVELOPMENT" : "MEDICAL FLAG"}
                  </span>
                </div>
                <div style={{ marginTop: 8, fontSize: 10, color: "var(--white-dim)", opacity: 0.5 }}>ID: {p.official_id}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// NOTICE BOARD
// ============================================================
function NoticeBoard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/public/events`).then(r => r.json()).then(data => {
      setEvents(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "60px auto", padding: "0 24px" }}>
      <div style={{ fontFamily: "Bebas Neue", fontSize: 48, letterSpacing: 3, color: "var(--gold)", marginBottom: 8 }}>COMBINE SCHEDULE</div>
      <p style={{ color: "var(--white-dim)", marginBottom: 40 }}>Official Jireh Pop-Up Assessment dates.</p>
      {loading ? <div style={{ textAlign: "center", padding: 40 }}><div className="spinner" /></div>
        : events.length === 0 ? <div className="card" style={{ textAlign: "center", color: "var(--white-dim)" }}>No events scheduled. Check back soon.</div>
        : (
          <div style={{ display: "grid", gap: 16 }}>
            {events.map((e, i) => (
              <div key={e.id} className="card" style={{ display: "grid", gridTemplateColumns: "80px 1fr auto", gap: 24, alignItems: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "Bebas Neue", fontSize: 48, color: "var(--gold)", lineHeight: 1 }}>{String(i + 1).padStart(2, "0")}</div>
                </div>
                <div>
                  <div style={{ fontFamily: "Bebas Neue", fontSize: 26, letterSpacing: 1, marginBottom: 4 }}>{e.title}</div>
                  <div style={{ fontSize: 13, color: "var(--gold)", marginBottom: 2 }}>📅 {e.dates}</div>
                  <div style={{ fontSize: 13, color: "var(--white-dim)" }}>📍 {e.location}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ background: "var(--gold)", color: "var(--navy)", padding: "8px 16px", fontWeight: 700, fontSize: 14 }}>{e.registration_fee}</div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

// ============================================================
// INTAKE CHATBOT
// ============================================================
function Chatbot({ setToast }) {
  const [messages, setMessages] = useState([
    { from: "bot", text: "Welcome to the Jireh Intake System. I am your Digital Gatekeeper.\n\nThis is a professional sports verification process. Answer precisely.\n\nLet's begin: What is your full name?" }
  ]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState("name");
  const [typing, setTyping] = useState(false);
  const [data, setData] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendBot = useCallback((text) => {
    setTyping(true);
    setTimeout(() => { setTyping(false); setMessages(m => [...m, { from: "bot", text }]); }, 1500);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || typing || step === "done") return;
    const val = input.trim();
    setMessages(m => [...m, { from: "user", text: val }]);
    setInput("");

    if (step === "name") {
      setData(d => ({ ...d, name: val }));
      sendBot("Full name logged.\n\nDate of birth? (YYYY-MM-DD format)");
      setStep("dob");
    } else if (step === "dob") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) { sendBot("⚠️ Invalid format. Use YYYY-MM-DD (e.g. 2003-07-15)."); return; }
      const age = calcAge(val);
      setData(d => ({ ...d, dob: val, age }));
      if (age < 18) {
        sendBot(`Age: ${age}. You are a minor.\n\nFIFA regulations require a Guardian on file. Enter your Parent/Guardian's email address.`);
        setStep("parent_email");
      } else {
        sendBot(`Age: ${age}. Proceeding.\n\nCity of residence?`);
        setStep("city");
      }
    } else if (step === "parent_email") {
      if (!val.includes("@")) { sendBot("⚠️ Invalid email. Try again."); return; }
      setData(d => ({ ...d, parentEmail: val }));
      sendBot("Guardian email logged.\n\nCity of residence?");
      setStep("city");
    } else if (step === "city") {
      setData(d => ({ ...d, city: val }));
      sendBot(`City: ${val}.\n\nPosition? (${POSITIONS.join(" / ")})`);
      setStep("position");
    } else if (step === "position") {
      const pos = POSITIONS.find(p => p.toLowerCase() === val.toLowerCase());
      if (!pos) { sendBot(`⚠️ Unrecognized position. Choose from: ${POSITIONS.join(", ")}`); return; }
      setData(d => ({ ...d, position: pos }));
      sendBot(`Position: ${pos}.\n\nEmail address?`);
      setStep("email");
    } else if (step === "email") {
      if (!val.includes("@")) { sendBot("⚠️ Invalid email. Try again."); return; }
      setData(d => ({ ...d, email: val }));
      sendBot("Email logged.\n\nWhatsApp number? (e.g. +263771234567)");
      setStep("whatsapp");
    } else if (step === "whatsapp") {
      const finalData = { ...data, whatsapp: val };
      setData(finalData);
      setTyping(true);
      try {
        const res = await fetch(`${API}/api/players/apply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: finalData.name,
            dob: finalData.dob,
            city: finalData.city,
            position: finalData.position,
            email: finalData.email,
            whatsapp: val,
            parentEmail: finalData.parentEmail || null,
          }),
        });
        const result = await res.json();
        setTyping(false);
        if (result.success) {
          setMessages(m => [...m, { from: "bot", text: `✅ APPLICATION COMPLETE.\n\n━━━━━━━━━━━━━━━━━━━\nAPPLICATION REFERENCE\n${result.tempId}\n━━━━━━━━━━━━━━━━━━━\n\nYou have 14 days to take this number to a Jireh Partner Pharmacy for medical clearance.\n\nA confirmation email has been sent to ${finalData.email}.\n${finalData.parentEmail ? `A courtesy email has been sent to your guardian.` : ""}\n\nDo not lose your reference number.` }]);
          setStep("done");
          setToast({ message: `New application: ${result.tempId}`, type: "info" });
        } else {
          setMessages(m => [...m, { from: "bot", text: `⚠️ ${result.error || "Something went wrong. Please try again."}` }]);
        }
      } catch (err) {
        setTyping(false);
        setMessages(m => [...m, { from: "bot", text: "⚠️ Connection error. Make sure the backend is running." }]);
      }
    }
  };

  return (
    <div style={{ maxWidth: 680, margin: "40px auto", padding: "0 24px" }}>
      <div style={{ fontFamily: "Bebas Neue", fontSize: 36, letterSpacing: 2, color: "var(--gold)", marginBottom: 4 }}>INTAKE CHATBOT</div>
      <p style={{ color: "var(--white-dim)", fontSize: 13, marginBottom: 24 }}>Automated. Strict. Professional.</p>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ background: "var(--navy-light)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid var(--border)" }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e" }} />
          <span style={{ fontFamily: "Barlow Condensed", letterSpacing: 2, fontSize: 14, fontWeight: 600 }}>JIREH GATEKEEPER — ONLINE</span>
        </div>
        <div style={{ height: 420, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start" }}>
              <div style={{ maxWidth: "80%", background: m.from === "user" ? "var(--gold)" : "var(--navy-light)", color: m.from === "user" ? "var(--navy)" : "var(--white)", padding: "12px 16px", borderRadius: m.from === "user" ? "12px 12px 0 12px" : "0 12px 12px 12px", fontSize: 14, fontWeight: m.from === "user" ? 600 : 400, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                {m.text}
              </div>
            </div>
          ))}
          {typing && (
            <div style={{ display: "flex", gap: 6, padding: "12px 16px", background: "var(--navy-light)", borderRadius: "0 12px 12px 12px", width: 60 }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--gold)", animation: `spin 1s ${i * 0.3}s infinite` }} />)}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div style={{ borderTop: "1px solid var(--border)", display: "flex" }}>
          <input className="input-field" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            placeholder={step === "done" ? "Application complete." : "Type your response..."}
            disabled={step === "done" || typing}
            style={{ border: "none", borderRadius: 0, flex: 1 }} />
          <button className="btn-primary" onClick={handleSend} disabled={step === "done" || typing} style={{ clipPath: "none", borderRadius: 0 }}>SEND</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PHARMACY PORTAL
// ============================================================
function PharmacyPortal({ setToast }) {
  const [token, setToken] = useState(null);
  const [partnerInfo, setPartnerInfo] = useState(null);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [search, setSearch] = useState("");
  const [found, setFound] = useState(null);
  const [vitals, setVitals] = useState({ height: "", weight: "", bp: "" });
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/partner/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });
      const result = await res.json();
      if (result.token) {
        setToken(result.token);
        setPartnerInfo(result);
        setToast({ message: `Welcome, ${result.clinicName}!` });
      } else {
        setToast({ message: result.error || "Login failed.", type: "error" });
      }
    } catch { setToast({ message: "Connection error.", type: "error" }); }
    setLoading(false);
  };

  const handleSearch = async () => {
    try {
      const res = await fetch(`${API}/api/players/search/${search.trim().toUpperCase()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (res.ok) setFound(result);
      else setToast({ message: result.error || "Player not found.", type: "error" });
    } catch { setToast({ message: "Connection error.", type: "error" }); }
  };

  const handleVerify = async () => {
    if (!vitals.height || !vitals.weight || !vitals.bp) { setToast({ message: "Fill in all vitals.", type: "error" }); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/players/${found.id}/verify`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ heightCm: vitals.height, weightKg: vitals.weight, bloodPressure: vitals.bp }),
      });
      const result = await res.json();
      if (result.success) {
        setToast({ message: `✓ Player verified! ID: ${result.officialId}. Tokens left: ${result.tokensRemaining}` });
        setPartnerInfo(p => ({ ...p, tokenBalance: result.tokensRemaining }));
        setFound(null); setVitals({ height: "", weight: "", bp: "" }); setSearch("");
      } else {
        setToast({ message: result.error, type: "error" });
      }
    } catch { setToast({ message: "Connection error.", type: "error" }); }
    setLoading(false);
  };

  if (!token) return (
    <div style={{ maxWidth: 480, margin: "80px auto", padding: "0 24px" }}>
      <div style={{ fontFamily: "Bebas Neue", fontSize: 36, letterSpacing: 2, color: "var(--gold)", marginBottom: 24 }}>PARTNER PHARMACY LOGIN</div>
      <div className="card">
        <div className="form-group"><label>Email</label><input className="input-field" type="email" value={loginData.email} onChange={e => setLoginData(d => ({ ...d, email: e.target.value }))} placeholder="clinic@partner.jireh.com" /></div>
        <div className="form-group"><label>Password</label><input className="input-field" type="password" value={loginData.password} onChange={e => setLoginData(d => ({ ...d, password: e.target.value }))} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && handleLogin()} /></div>
        <button className="btn-primary" style={{ width: "100%" }} onClick={handleLogin} disabled={loading}>{loading ? "Logging in..." : "LOGIN →"}</button>
        <p style={{ fontSize: 11, color: "var(--white-dim)", marginTop: 12, textAlign: "center" }}>Demo: avenues@partner.jireh.com / pharmacy123</p>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: "0 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "Bebas Neue", fontSize: 32, letterSpacing: 2, color: "var(--gold)" }}>PHARMACY PORTAL</div>
          <div style={{ fontSize: 13, color: "var(--white-dim)" }}>{partnerInfo?.clinicName}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "Bebas Neue", fontSize: 40, color: partnerInfo?.tokenBalance > 0 ? "var(--gold)" : "#ef4444", lineHeight: 1 }}>{partnerInfo?.tokenBalance}</div>
          <div style={{ fontSize: 11, color: "var(--white-dim)", letterSpacing: 1 }}>TOKENS REMAINING</div>
          <button className="btn-secondary" onClick={() => { setToken(null); setPartnerInfo(null); }} style={{ marginTop: 8, fontSize: 11 }}>Logout</button>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "Barlow Condensed", fontSize: 16, letterSpacing: 1.5, marginBottom: 16, color: "var(--gold)" }}>SEARCH PLAYER</div>
        <div style={{ display: "flex", gap: 10 }}>
          <input className="input-field" value={search} onChange={e => setSearch(e.target.value.toUpperCase())} placeholder="Enter APP-XXXX or JRH-XXXX" onKeyDown={e => e.key === "Enter" && handleSearch()} />
          <button className="btn-primary" onClick={handleSearch} style={{ whiteSpace: "nowrap" }}>SEARCH</button>
        </div>
      </div>
      {found && (
        <div className="card" style={{ animation: "fadeUp 0.4s ease" }}>
          <div style={{ fontFamily: "Bebas Neue", fontSize: 22, letterSpacing: 1, marginBottom: 4 }}>{found.name}</div>
          <div style={{ display: "flex", gap: 16, marginBottom: 16, fontSize: 13, color: "var(--white-dim)", flexWrap: "wrap" }}>
            <span>📍 {found.city}</span><span>⚽ {found.position}</span>
            <span>🎂 Age {found.age}</span>
            <span className={found.status === "Verified" ? "badge-green" : "badge-pending"}>{found.status}</span>
          </div>
          <hr className="divider" />
          <div style={{ fontFamily: "Barlow Condensed", fontSize: 14, letterSpacing: 1, marginBottom: 16, color: "var(--gold)" }}>ENTER VITALS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}><label>Height (cm)</label><input className="input-field" type="number" value={vitals.height} onChange={e => setVitals(v => ({ ...v, height: e.target.value }))} placeholder="178" /></div>
            <div className="form-group" style={{ marginBottom: 0 }}><label>Weight (kg)</label><input className="input-field" type="number" value={vitals.weight} onChange={e => setVitals(v => ({ ...v, weight: e.target.value }))} placeholder="72" /></div>
            <div className="form-group" style={{ marginBottom: 0 }}><label>Blood Pressure</label><input className="input-field" value={vitals.bp} onChange={e => setVitals(v => ({ ...v, bp: e.target.value }))} placeholder="120/80" /></div>
          </div>
          {partnerInfo?.tokenBalance === 0
            ? <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", padding: "12px 16px", fontSize: 14, fontWeight: 600 }}>⛔ Error: Zero Verification Credits remaining. Please contact Jireh.</div>
            : <button className="btn-primary" onClick={handleVerify} disabled={loading} style={{ width: "100%", fontSize: 16, padding: 14 }}>{loading ? "Processing..." : "SUBMIT & VERIFY (Uses 1 Token)"}</button>
          }
        </div>
      )}
    </div>
  );
}

// ============================================================
// ASSESSOR PORTAL
// ============================================================
function AssessorPortal({ setToast }) {
  const [token, setToken] = useState(null);
  const [assessorInfo, setAssessorInfo] = useState(null);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [search, setSearch] = useState("");
  const [found, setFound] = useState(null);
  const [grade, setGrade] = useState("");
  const [stats, setStats] = useState({ sprint40m: "", vertJump: "", notes: "" });
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/assessor/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });
      const result = await res.json();
      if (result.token) { setToken(result.token); setAssessorInfo(result); setToast({ message: `Welcome, ${result.name}!` }); }
      else setToast({ message: result.error || "Login failed.", type: "error" });
    } catch { setToast({ message: "Connection error.", type: "error" }); }
    setLoading(false);
  };

  const handleSearch = async () => {
    try {
      const res = await fetch(`${API}/api/players/search/${search.trim().toUpperCase()}`, { headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (res.ok) { setFound(result); setGrade(result.fitness_grade || ""); }
      else setToast({ message: result.error || "Player not found.", type: "error" });
    } catch { setToast({ message: "Connection error.", type: "error" }); }
  };

  const handleSubmit = async () => {
    if (!grade) { setToast({ message: "Select a fitness grade.", type: "error" }); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/players/${found.id}/grade`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fitnessGrade: grade, sprint40m: stats.sprint40m || null, verticalJumpCm: stats.vertJump || null, assessorNotes: stats.notes || null }),
      });
      const result = await res.json();
      if (result.success) {
        setToast({ message: `✓ ${found.name} graded ${grade}. Timestamp logged.` });
        setFound(null); setSearch(""); setGrade(""); setStats({ sprint40m: "", vertJump: "", notes: "" });
      } else setToast({ message: result.error, type: "error" });
    } catch { setToast({ message: "Connection error.", type: "error" }); }
    setLoading(false);
  };

  if (!token) return (
    <div style={{ maxWidth: 480, margin: "80px auto", padding: "0 24px" }}>
      <div style={{ fontFamily: "Bebas Neue", fontSize: 36, letterSpacing: 2, color: "var(--gold)", marginBottom: 24 }}>ASSESSOR LOGIN</div>
      <div className="card">
        <div className="form-group"><label>Email</label><input className="input-field" type="email" value={loginData.email} onChange={e => setLoginData(d => ({ ...d, email: e.target.value }))} placeholder="coach@jireh.com" /></div>
        <div className="form-group"><label>Password</label><input className="input-field" type="password" value={loginData.password} onChange={e => setLoginData(d => ({ ...d, password: e.target.value }))} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && handleLogin()} /></div>
        <button className="btn-primary" style={{ width: "100%" }} onClick={handleLogin} disabled={loading}>{loading ? "Logging in..." : "LOGIN →"}</button>
        <p style={{ fontSize: 11, color: "var(--white-dim)", marginTop: 12, textAlign: "center" }}>Demo: coach@jireh.com / assessor123</p>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: "0 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "Bebas Neue", fontSize: 32, letterSpacing: 2, color: "var(--gold)" }}>ASSESSOR PORTAL</div>
          <div style={{ fontSize: 13, color: "var(--white-dim)" }}>{assessorInfo?.name} — Live Data Entry</div>
        </div>
        <button className="btn-secondary" onClick={() => { setToken(null); setAssessorInfo(null); }} style={{ fontSize: 11 }}>Logout</button>
      </div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "Barlow Condensed", fontSize: 16, letterSpacing: 1.5, marginBottom: 16, color: "var(--gold)" }}>FIND PLAYER</div>
        <div style={{ display: "flex", gap: 10 }}>
          <input className="input-field" value={search} onChange={e => setSearch(e.target.value.toUpperCase())} placeholder="JRH-XXXX or APP-XXXX" onKeyDown={e => e.key === "Enter" && handleSearch()} />
          <button className="btn-primary" onClick={handleSearch}>SEARCH</button>
        </div>
      </div>
      {found && (
        <div className="card" style={{ animation: "fadeUp 0.4s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: "Bebas Neue", fontSize: 24, letterSpacing: 1 }}>{found.name}</div>
              <div style={{ fontSize: 13, color: "var(--white-dim)" }}>{found.position} · {found.city}</div>
            </div>
            <span style={{ fontSize: 24 }}>{found.fitness_grade ? gradeEmoji(found.fitness_grade) : "⚪"}</span>
          </div>
          <hr className="divider" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}><label>40m Sprint (sec)</label><input className="input-field" type="number" step="0.01" value={stats.sprint40m} onChange={e => setStats(s => ({ ...s, sprint40m: e.target.value }))} placeholder="4.82" /></div>
            <div className="form-group" style={{ marginBottom: 0 }}><label>Vertical Jump (cm)</label><input className="input-field" type="number" value={stats.vertJump} onChange={e => setStats(s => ({ ...s, vertJump: e.target.value }))} placeholder="55" /></div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea className="input-field" rows={2} value={stats.notes} onChange={e => setStats(s => ({ ...s, notes: e.target.value }))} placeholder="Coach observations..." style={{ resize: "none" }} />
          </div>
          <div className="form-group">
            <label>Fitness Grade</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[{ val: "Green", label: "🟢 Match-Fit", color: "#22c55e" }, { val: "Yellow", label: "🟡 Development", color: "#eab308" }, { val: "Red", label: "🔴 Medical Flag", color: "#ef4444" }].map(g => (
                <button key={g.val} onClick={() => setGrade(g.val)}
                  style={{ background: grade === g.val ? g.color : "rgba(255,255,255,0.05)", color: grade === g.val ? "var(--navy)" : g.color, border: `1px solid ${g.color}`, padding: "12px 8px", fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ width: "100%", fontSize: 15, padding: 14 }}>
            {loading ? "Submitting..." : "SUBMIT ASSESSMENT + LOG TIMESTAMP"}
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// ADMIN DASHBOARD
// ============================================================
function AdminDashboard({ setToast }) {
  const [token, setToken] = useState(null);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [tab, setTab] = useState("squad");
  const [players, setPlayers] = useState([]);
  const [partners, setPartners] = useState([]);
  const [assessors, setAssessors] = useState([]);
  const [events, setEvents] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [stats, setStats] = useState({});
  const [filterPos, setFilterPos] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterAge, setFilterAge] = useState("");
  const [selected, setSelected] = useState([]);
  const [tokenInput, setTokenInput] = useState({ pharmacyId: "", amount: "" });
  const [newEvent, setNewEvent] = useState({ title: "", dates: "", location: "", registrationFee: "" });
  const [newPartner, setNewPartner] = useState({ clinicName: "", email: "", password: "", tokenBalance: "0" });
  const [newAssessor, setNewAssessor] = useState({ name: "", email: "", password: "" });
  const [resetPasswordForm, setResetPasswordForm] = useState({ type: "", id: "", password: "" });
  const [loading, setLoading] = useState(false);

  const authHeader = { Authorization: `Bearer ${token}` };

  const loadDashboard = useCallback(async () => {
    try {
      const [dashRes, playersRes, partnersRes, assessorsRes] = await Promise.all([
        fetch(`${API}/api/admin/dashboard`, { headers: authHeader }),
        fetch(`${API}/api/players`, { headers: authHeader }),
        fetch(`${API}/api/admin/partners`, { headers: authHeader }),
        fetch(`${API}/api/admin/assessors`, { headers: authHeader }),
      ]);
      const dash = await dashRes.json();
      const playersList = await playersRes.json();
      const partnersList = await partnersRes.json();
      const assessorsList = await assessorsRes.json();
      setStats(dash.stats || {});
      setPartners(dash.partners || partnersList || []);
      setAssessors(assessorsList || []);
      setEvents(dash.events || []);
      setWarnings(dash.expiryWarnings || []);
      setPlayers(Array.isArray(playersList) ? playersList : []);
    } catch { setToast({ message: "Error loading data.", type: "error" }); }
  }, [token]);

  useEffect(() => { if (token) loadDashboard(); }, [token]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/admin/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });
      const result = await res.json();
      if (result.token) { setToken(result.token); setToast({ message: "Welcome, Admin!" }); }
      else setToast({ message: result.error || "Access denied.", type: "error" });
    } catch { setToast({ message: "Connection error.", type: "error" }); }
    setLoading(false);
  };

  const addTokens = async () => {
    if (!tokenInput.pharmacyId || !tokenInput.amount) return;
    try {
      const res = await fetch(`${API}/api/admin/tokens/add`, {
        method: "POST", headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ partnerId: tokenInput.pharmacyId, amount: parseInt(tokenInput.amount) }),
      });
      const result = await res.json();
      if (result.success) { setToast({ message: result.message }); setTokenInput({ pharmacyId: "", amount: "" }); loadDashboard(); }
      else setToast({ message: result.error, type: "error" });
    } catch { setToast({ message: "Connection error.", type: "error" }); }
  };

  const addEvent = async () => {
    if (!newEvent.title || !newEvent.dates || !newEvent.location) { setToast({ message: "Fill all event fields.", type: "error" }); return; }
    try {
      const res = await fetch(`${API}/api/admin/events`, {
        method: "POST", headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify(newEvent),
      });
      const result = await res.json();
      if (result.success) { setToast({ message: "Event published!" }); setNewEvent({ title: "", dates: "", location: "", registrationFee: "" }); loadDashboard(); }
      else setToast({ message: result.error, type: "error" });
    } catch { setToast({ message: "Connection error.", type: "error" }); }
  };

  const deleteEvent = async (id) => {
    try {
      await fetch(`${API}/api/admin/events/${id}`, { method: "DELETE", headers: authHeader });
      setToast({ message: "Event removed." });
      loadDashboard();
    } catch { setToast({ message: "Connection error.", type: "error" }); }
  };

  const createPartner = async () => {
    if (!newPartner.clinicName || !newPartner.email || !newPartner.password) {
      setToast({ message: "Fill all partner fields.", type: "error" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/partners`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ ...newPartner, tokenBalance: parseInt(newPartner.tokenBalance) }),
      });
      const result = await res.json();
      if (result.success) {
        setToast({ message: `✓ Partner "${newPartner.clinicName}" created!` });
        setNewPartner({ clinicName: "", email: "", password: "", tokenBalance: "0" });
        loadDashboard();
      } else setToast({ message: result.error, type: "error" });
    } catch { setToast({ message: "Connection error.", type: "error" }); }
    setLoading(false);
  };

  const createAssessor = async () => {
    if (!newAssessor.name || !newAssessor.email || !newAssessor.password) {
      setToast({ message: "Fill all assessor fields.", type: "error" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/assessors`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify(newAssessor),
      });
      const result = await res.json();
      if (result.success) {
        setToast({ message: `✓ Assessor "${newAssessor.name}" created!` });
        setNewAssessor({ name: "", email: "", password: "" });
        loadDashboard();
      } else setToast({ message: result.error, type: "error" });
    } catch { setToast({ message: "Connection error.", type: "error" }); }
    setLoading(false);
  };

  const resetUserPassword = async () => {
    if (!resetPasswordForm.type || !resetPasswordForm.id || !resetPasswordForm.password) {
      setToast({ message: "Select user and enter password.", type: "error" });
      return;
    }
    if (resetPasswordForm.password.length < 6) {
      setToast({ message: "Password must be at least 6 characters.", type: "error" });
      return;
    }
    setLoading(true);
    try {
      const endpoint = resetPasswordForm.type === "partner" ? "partners" : "assessors";
      const res = await fetch(`${API}/admin/${endpoint}/${resetPasswordForm.id}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ password: resetPasswordForm.password }),
      });
      const result = await res.json();
      if (result.success) {
        setToast({ message: `✓ ${result.message}` });
        setResetPasswordForm({ type: "", id: "", password: "" });
        loadDashboard();
      } else setToast({ message: result.error, type: "error" });
    } catch { setToast({ message: "Connection error.", type: "error" }); }
    setLoading(false);
  };

  const toggleUserStatus = async (type, id) => {
    setLoading(true);
    try {
      const endpoint = type === "partner" ? "partners" : "assessors";
      const res = await fetch(`${API}/api/admin/${endpoint}/${id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader },
      });
      const result = await res.json();
      if (result.success) {
        const status = result.is_active ? "enabled" : "disabled";
        setToast({ message: `✓ User ${status}!` });
        loadDashboard();
      } else setToast({ message: result.error, type: "error" });
    } catch { setToast({ message: "Connection error.", type: "error" }); }
    setLoading(false);
  };

  const exportSquad = async () => {
    try {
      const selectedPlayers = players.filter(p => selected.includes(p.id));
      const text = selectedPlayers.map(p => `${p.name} | ${p.whatsapp} | ${p.email}`).join("\n");
      navigator.clipboard.writeText(text).then(() => setToast({ message: `✓ ${selectedPlayers.length} players copied to clipboard!` }));
    } catch { setToast({ message: "Export failed.", type: "error" }); }
  };

  const filteredPlayers = players.filter(p => {
    if (filterPos && p.position !== filterPos) return false;
    if (filterGrade && p.fitness_grade !== filterGrade) return false;
    if (filterAge === "u18" && calcAge(p.dob) >= 18) return false;
    if (filterAge === "18-21" && (calcAge(p.dob) < 18 || calcAge(p.dob) > 21)) return false;
    if (filterAge === "22+" && calcAge(p.dob) < 22) return false;
    return true;
  });

  if (!token) return (
    <div style={{ maxWidth: 420, margin: "80px auto", padding: "0 24px" }}>
      <div style={{ fontFamily: "Bebas Neue", fontSize: 36, letterSpacing: 2, color: "var(--gold)", marginBottom: 4 }}>ADMIN ACCESS</div>
      <p style={{ color: "var(--white-dim)", fontSize: 13, marginBottom: 24 }}>Command center. Restricted access only.</p>
      <div className="card">
        <div className="form-group"><label>Username</label><input className="input-field" value={loginData.username} onChange={e => setLoginData(d => ({ ...d, username: e.target.value }))} placeholder="admin" /></div>
        <div className="form-group"><label>Password</label><input className="input-field" type="password" value={loginData.password} onChange={e => setLoginData(d => ({ ...d, password: e.target.value }))} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && handleLogin()} /></div>
        <button className="btn-primary" style={{ width: "100%" }} onClick={handleLogin} disabled={loading}>{loading ? "Verifying..." : "ENTER →"}</button>
        <p style={{ fontSize: 11, color: "var(--white-dim)", marginTop: 12, textAlign: "center" }}>Username: admin / Password: your ADMIN_PASSWORD from .env</p>
      </div>
    </div>
  );

  const tabs = [{ key: "squad", label: "Squad Builder" }, { key: "tokens", label: "Token Management" }, { key: "users", label: "User Management" }, { key: "events", label: "Notice Board" }];

  return (
    <div style={{ maxWidth: 1100, margin: "40px auto", padding: "0 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontFamily: "Bebas Neue", fontSize: 40, letterSpacing: 3, color: "var(--gold)" }}>ADMIN COMMAND CENTER</div>
        <button className="btn-secondary" onClick={() => setToken(null)} style={{ fontSize: 11 }}>Logout</button>
      </div>

      {warnings.length > 0 && (
        <div style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.4)", padding: "12px 16px", marginBottom: 20 }}>
          <span style={{ color: "#eab308", fontWeight: 700, fontSize: 13 }}>⚠️ STATUS EXPIRY WARNING: </span>
          <span style={{ color: "var(--white-dim)", fontSize: 13 }}>{warnings.map(p => p.name).join(", ")} — Green status expires within 10 days.</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Players", val: stats.total || 0 },
          { label: "Verified", val: stats.verified || 0 },
          { label: "Match-Fit 🟢", val: stats.green || 0 },
          { label: "Pending", val: stats.pending || 0 },
        ].map(k => (
          <div key={k.label} className="card" style={{ textAlign: "center", padding: 16 }}>
            <div style={{ fontFamily: "Bebas Neue", fontSize: 36, color: "var(--gold)", lineHeight: 1 }}>{k.val}</div>
            <div style={{ fontSize: 11, color: "var(--white-dim)", letterSpacing: 0.8, marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ background: tab === t.key ? "var(--gold)" : "rgba(255,255,255,0.05)", color: tab === t.key ? "var(--navy)" : "var(--white-dim)", border: "1px solid " + (tab === t.key ? "var(--gold)" : "var(--border)"), padding: "8px 20px", fontFamily: "Barlow Condensed", fontWeight: 700, fontSize: 13, letterSpacing: 1, cursor: "pointer" }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "squad" && (
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div><label>Position</label><select className="input-field" value={filterPos} onChange={e => setFilterPos(e.target.value)} style={{ width: 160 }}><option value="">All</option>{POSITIONS.map(p => <option key={p}>{p}</option>)}</select></div>
            <div><label>Grade</label><select className="input-field" value={filterGrade} onChange={e => setFilterGrade(e.target.value)} style={{ width: 140 }}><option value="">All</option><option>Green</option><option>Yellow</option><option>Red</option></select></div>
            <div><label>Age Group</label><select className="input-field" value={filterAge} onChange={e => setFilterAge(e.target.value)} style={{ width: 140 }}><option value="">All</option><option value="u18">Under 18</option><option value="18-21">18–21</option><option value="22+">22+</option></select></div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button className="btn-secondary" onClick={() => setSelected(filteredPlayers.map(p => p.id))} style={{ fontSize: 12 }}>Select All</button>
              <button className="btn-primary" onClick={exportSquad} disabled={selected.length === 0} style={{ fontSize: 12, opacity: selected.length === 0 ? 0.5 : 1 }}>CREATE TRIAL SQUAD ({selected.length})</button>
            </div>
          </div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table>
              <thead><tr><th style={{ width: 40 }}><input type="checkbox" onChange={e => e.target.checked ? setSelected(filteredPlayers.map(p => p.id)) : setSelected([])} /></th><th>Name</th><th>ID</th><th>Position</th><th>City</th><th>Age</th><th>Status</th><th>Grade</th><th>Last Tested</th></tr></thead>
              <tbody>
                {filteredPlayers.length === 0 && <tr><td colSpan={9} style={{ textAlign: "center", color: "var(--white-dim)", padding: 30 }}>No players found.</td></tr>}
                {filteredPlayers.map(p => (
                  <tr key={p.id}>
                    <td><input type="checkbox" checked={selected.includes(p.id)} onChange={() => setSelected(s => s.includes(p.id) ? s.filter(x => x !== p.id) : [...s, p.id])} /></td>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td style={{ fontFamily: "Barlow Condensed", letterSpacing: 1, color: "var(--gold)", fontSize: 13 }}>{p.official_id || p.temp_id}</td>
                    <td>{p.position}</td>
                    <td>{p.city}</td>
                    <td>{p.age}</td>
                    <td><span className={p.status === "Verified" ? "badge-green" : "badge-pending"}>{p.status}</span></td>
                    <td>{p.fitness_grade ? <span className={p.fitness_grade === "Green" ? "badge-green" : p.fitness_grade === "Yellow" ? "badge-yellow" : "badge-red"}>{gradeEmoji(p.fitness_grade)} {p.fitness_grade}</span> : <span className="badge-pending">—</span>}</td>
                    <td style={{ fontSize: 12, color: "var(--white-dim)" }}>{daysSince(p.last_tested_date) !== null ? `${daysSince(p.last_tested_date)}d ago` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "tokens" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div className="card">
            <div style={{ fontFamily: "Barlow Condensed", fontSize: 16, letterSpacing: 1.5, color: "var(--gold)", marginBottom: 16 }}>ADD TOKENS</div>
            <div className="form-group"><label>Select Pharmacy</label>
              <select className="input-field" value={tokenInput.pharmacyId} onChange={e => setTokenInput(t => ({ ...t, pharmacyId: e.target.value }))}>
                <option value="">Choose partner...</option>
                {partners.map(p => <option key={p.id} value={p.id}>{p.clinic_name}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Token Amount</label><input className="input-field" type="number" min="1" value={tokenInput.amount} onChange={e => setTokenInput(t => ({ ...t, amount: e.target.value }))} placeholder="e.g. 10" /></div>
            <button className="btn-primary" style={{ width: "100%" }} onClick={addTokens}>+ ADD TOKENS</button>
          </div>
          <div className="card">
            <div style={{ fontFamily: "Barlow Condensed", fontSize: 16, letterSpacing: 1.5, color: "var(--gold)", marginBottom: 16 }}>PARTNER BALANCES</div>
            {partners.map(p => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                <div><div style={{ fontWeight: 600, fontSize: 14 }}>{p.clinic_name}</div><div style={{ fontSize: 11, color: "var(--white-dim)" }}>{p.is_active ? "Active" : "Inactive"}</div></div>
                <div style={{ fontFamily: "Bebas Neue", fontSize: 32, color: p.token_balance > 0 ? "var(--gold)" : "#ef4444" }}>{p.token_balance}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "users" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <div style={{ fontFamily: "Barlow Condensed", fontSize: 16, letterSpacing: 1.5, color: "var(--gold)", marginBottom: 16 }}>CREATE PARTNER</div>
            <div className="card">
              <div className="form-group"><label>Clinic Name</label><input className="input-field" value={newPartner.clinicName} onChange={e => setNewPartner(p => ({ ...p, clinicName: e.target.value }))} placeholder="Apollo Clinic" /></div>
              <div className="form-group"><label>Email</label><input className="input-field" type="email" value={newPartner.email} onChange={e => setNewPartner(p => ({ ...p, email: e.target.value }))} placeholder="contact@clinic.com" /></div>
              <div className="form-group"><label>Password</label><input className="input-field" type="password" value={newPartner.password} onChange={e => setNewPartner(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" /></div>
              <div className="form-group"><label>Initial Token Balance</label><input className="input-field" type="number" value={newPartner.tokenBalance} onChange={e => setNewPartner(p => ({ ...p, tokenBalance: e.target.value }))} placeholder="100" /></div>
              <button className="btn-primary" style={{ width: "100%" }} onClick={createPartner} disabled={loading}>+ CREATE PARTNER</button>
            </div>

            <div style={{ fontFamily: "Barlow Condensed", fontSize: 16, letterSpacing: 1.5, color: "var(--gold)", marginTop: 24, marginBottom: 16 }}>CREATE ASSESSOR</div>
            <div className="card">
              <div className="form-group"><label>Assessor Name</label><input className="input-field" value={newAssessor.name} onChange={e => setNewAssessor(a => ({ ...a, name: e.target.value }))} placeholder="Dr. John Smith" /></div>
              <div className="form-group"><label>Email</label><input className="input-field" type="email" value={newAssessor.email} onChange={e => setNewAssessor(a => ({ ...a, email: e.target.value }))} placeholder="john@assessor.com" /></div>
              <div className="form-group"><label>Password</label><input className="input-field" type="password" value={newAssessor.password} onChange={e => setNewAssessor(a => ({ ...a, password: e.target.value }))} placeholder="••••••••" /></div>
              <button className="btn-primary" style={{ width: "100%" }} onClick={createAssessor} disabled={loading}>+ CREATE ASSESSOR</button>
            </div>

            <div style={{ fontFamily: "Barlow Condensed", fontSize: 16, letterSpacing: 1.5, color: "var(--gold)", marginTop: 24, marginBottom: 16 }}>RESET PASSWORD</div>
            <div className="card">
              <div className="form-group">
                <label>User Type</label>
                <select className="input-field" value={resetPasswordForm.type} onChange={e => setResetPasswordForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="">Select type...</option>
                  <option value="partner">Partner</option>
                  <option value="assessor">Assessor</option>
                </select>
              </div>
              <div className="form-group">
                <label>Select User</label>
                <select className="input-field" value={resetPasswordForm.id} onChange={e => setResetPasswordForm(f => ({ ...f, id: e.target.value }))}>
                  <option value="">Choose user...</option>
                  {resetPasswordForm.type === "partner" && partners.map(p => (
                    <option key={p.id} value={p.id}>{p.clinic_name} ({p.email})</option>
                  ))}
                  {resetPasswordForm.type === "assessor" && assessors.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
                  ))}
                </select>
              </div>
              <div className="form-group"><label>New Password</label><input className="input-field" type="password" value={resetPasswordForm.password} onChange={e => setResetPasswordForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" /></div>
              <button className="btn-primary" style={{ width: "100%" }} onClick={resetUserPassword} disabled={loading}>🔄 RESET PASSWORD</button>
            </div>
          </div>

          <div>
            <div style={{ fontFamily: "Barlow Condensed", fontSize: 16, letterSpacing: 1.5, color: "var(--gold)", marginBottom: 16 }}>PARTNERS ({partners.length})</div>
            <div style={{ maxHeight: 600, overflowY: "auto" }}>
              {partners.map(p => (
                <div key={p.id} className="card" style={{ marginBottom: 10, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{p.clinic_name}</div>
                      <div style={{ fontSize: 11, color: "var(--white-dim)", marginTop: 2 }}>{p.email}</div>
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <span className={p.is_active ? "badge-green" : "badge-red"} style={{ fontSize: 10 }}>{p.is_active ? "Active" : "Inactive"}</span>
                        <span className="badge-pending" style={{ fontSize: 10 }}>Balance: {p.token_balance}</span>
                      </div>
                    </div>
                    <button onClick={() => toggleUserStatus("partner", p.id)} style={{ background: p.is_active ? "#ef4444" : "#22c55e", color: "white", border: "none", padding: "4px 12px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
                      {p.is_active ? "Disable" : "Enable"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ fontFamily: "Barlow Condensed", fontSize: 16, letterSpacing: 1.5, color: "var(--gold)", marginTop: 24, marginBottom: 16 }}>ASSESSORS ({assessors.length})</div>
            <div style={{ maxHeight: 600, overflowY: "auto" }}>
              {assessors.map(a => (
                <div key={a.id} className="card" style={{ marginBottom: 10, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{a.name}</div>
                      <div style={{ fontSize: 11, color: "var(--white-dim)", marginTop: 2 }}>{a.email}</div>
                      <div style={{ marginTop: 8 }}>
                        <span className={a.is_active ? "badge-green" : "badge-red"} style={{ fontSize: 10 }}>{a.is_active ? "Active" : "Inactive"}</span>
                      </div>
                    </div>
                    <button onClick={() => toggleUserStatus("assessor", a.id)} style={{ background: a.is_active ? "#ef4444" : "#22c55e", color: "white", border: "none", padding: "4px 12px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
                      {a.is_active ? "Disable" : "Enable"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "events" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div className="card">
            <div style={{ fontFamily: "Barlow Condensed", fontSize: 16, letterSpacing: 1.5, color: "var(--gold)", marginBottom: 16 }}>POST NEW EVENT</div>
            <div className="form-group"><label>Event Title</label><input className="input-field" value={newEvent.title} onChange={e => setNewEvent(n => ({ ...n, title: e.target.value }))} placeholder="Harare Pop-Up Combine" /></div>
            <div className="form-group"><label>Dates</label><input className="input-field" value={newEvent.dates} onChange={e => setNewEvent(n => ({ ...n, dates: e.target.value }))} placeholder="Mar 14–16, 2026" /></div>
            <div className="form-group"><label>Location</label><input className="input-field" value={newEvent.location} onChange={e => setNewEvent(n => ({ ...n, location: e.target.value }))} placeholder="Rufaro Stadium, Harare" /></div>
            <div className="form-group"><label>Registration Fee</label><input className="input-field" value={newEvent.registrationFee} onChange={e => setNewEvent(n => ({ ...n, registrationFee: e.target.value }))} placeholder="$15 USD" /></div>
            <button className="btn-primary" style={{ width: "100%" }} onClick={addEvent}>PUBLISH TO NOTICE BOARD</button>
          </div>
          <div>
            <div style={{ fontFamily: "Barlow Condensed", fontSize: 16, letterSpacing: 1.5, color: "var(--gold)", marginBottom: 16 }}>CURRENT EVENTS ({events.length})</div>
            {events.map(e => (
              <div key={e.id} className="card" style={{ marginBottom: 10, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{e.title}</div>
                    <div style={{ fontSize: 12, color: "var(--gold)", marginTop: 2 }}>{e.dates}</div>
                    <div style={{ fontSize: 12, color: "var(--white-dim)" }}>{e.location}</div>
                  </div>
                  <button onClick={() => deleteEvent(e.id)} style={{ background: "#ef4444", color: "white", border: "none", padding: "6px 12px", fontSize: 11, cursor: "pointer" }}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// ROOT APP
// ============================================================
export default function App() {
  const [view, setView] = useState("public");
  const [toast, setToast] = useState(null);

  return (
    <>
      <GlobalStyle />
      <Nav view={view} setView={setView} />
      {view === "public" && <PublicPage setView={setView} />}
      {view === "chatbot" && <Chatbot setToast={setToast} />}
      {view === "noticeboard" && <NoticeBoard />}
      {view === "pharmacy" && <PharmacyPortal setToast={setToast} />}
      {view === "pharmacy-screening" && <PharmacyScreening setToast={setToast} />}
      {view === "assessor" && <AssessorPortal setToast={setToast} />}
      {view === "coach-assessment" && <CoachAssessment setToast={setToast} />}
      {view === "admin" && <AdminDashboard setToast={setToast} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
