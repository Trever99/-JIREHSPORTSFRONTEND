import { useState, useMemo } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function parseBloodPressure(value) {
  const parts = value.split("/").map((part) => Number(part.trim()));
  if (parts.length !== 2 || parts.some((v) => Number.isNaN(v))) return null;
  return { systolic: parts[0], diastolic: parts[1] };
}

function calcBmi(weight, height) {
  if (!weight || !height) return null;
  return Number((weight / ((height / 100) ** 2)).toFixed(1));
}

function bmiCategory(bmi) {
  if (!bmi) return "Unknown";
  if (bmi < 18.5) return "Under";
  if (bmi < 25) return "Normal";
  return "Over";
}

function bpCategory(systolic, diastolic) {
  if (systolic >= 140 || diastolic >= 90) return "High";
  if (systolic >= 120 || diastolic >= 80) return "Elevated";
  return "Normal";
}

function hrCategory(hr) {
  if (!hr) return "Unknown";
  return hr > 100 ? "Elevated" : "Normal";
}

function riskLevel(systolic, diastolic, dizziness, heartRate, painLevel, currentlyInjured) {
  if (systolic >= 140 || diastolic >= 90 || dizziness) return "HIGH";
  if (heartRate > 100 || painLevel === "Severe" || currentlyInjured) return "MODERATE";
  return "LOW";
}

function recommendation(level) {
  if (level === "HIGH") return "Refer to clinic for further evaluation";
  if (level === "MODERATE") return "Monitor or refer to physiotherapy";
  return "Fit for activity";
}

function statusBadge(level) {
  if (level === "HIGH") return "badge-red";
  if (level === "MODERATE") return "badge-yellow";
  return "badge-green";
}

export default function PharmacyScreening({ setToast }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [login, setLogin] = useState({ email: "", password: "" });
  const [search, setSearch] = useState("");
  const [player, setPlayer] = useState(null);
  const [screening, setScreening] = useState({
    height: "",
    weight: "",
    bloodPressure: "",
    restingHeartRate: "",
    bodyComposition: "",
    painLevel: "None",
    dizziness: "No",
    previousInjury: "None",
    currentlyInjured: "No",
    onMedication: "No",
    notes: "",
  });
  const [savedRecord, setSavedRecord] = useState(null);
  const [loading, setLoading] = useState(false);

  const bp = useMemo(() => parseBloodPressure(screening.bloodPressure), [screening.bloodPressure]);
  const bmi = useMemo(() => calcBmi(Number(screening.weight), Number(screening.height)), [screening.weight, screening.height]);
  const category = useMemo(() => ({
    bmi: bmiCategory(bmi),
    bp: bp ? bpCategory(bp.systolic, bp.diastolic) : "Unknown",
    hr: hrCategory(Number(screening.restingHeartRate)),
    risk: bp ? riskLevel(bp.systolic, bp.diastolic, screening.dizziness === "Yes", Number(screening.restingHeartRate), screening.painLevel, screening.currentlyInjured === "Yes") : "LOW",
    recommendation: bp ? recommendation(riskLevel(bp.systolic, bp.diastolic, screening.dizziness === "Yes", Number(screening.restingHeartRate), screening.painLevel, screening.currentlyInjured === "Yes")) : "Fit for activity",
  }), [bmi, bp, screening.dizziness, screening.restingHeartRate, screening.painLevel, screening.currentlyInjured]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/partner/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(login),
      });
      const result = await res.json();
      if (result.token) {
        setToken(result.token);
        setUser(result);
        setToast({ message: `Welcome, ${result.clinicName}!` });
      } else {
        setToast({ message: result.error || "Login failed.", type: "error" });
      }
    } catch (err) {
      setToast({ message: "Connection error.", type: "error" });
    }
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/players/search/${search.trim().toUpperCase()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (res.ok) {
        setPlayer(result);
        setSavedRecord(null);
      } else {
        setPlayer(null);
        setToast({ message: result.error || "Player not found.", type: "error" });
      }
    } catch {
      setToast({ message: "Connection error.", type: "error" });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!player) return;
    if (!screening.height || !screening.weight || !screening.bloodPressure || !screening.restingHeartRate) {
      setToast({ message: "Height, weight, blood pressure and heart rate are required.", type: "error" });
      return;
    }

    const payload = {
      playerId: player.id,
      heightCm: Number(screening.height),
      weightKg: Number(screening.weight),
      bloodPressure: screening.bloodPressure,
      restingHeartRate: Number(screening.restingHeartRate),
      bodyComposition: screening.bodyComposition ? Number(screening.bodyComposition) : null,
      painLevel: screening.painLevel,
      dizziness: screening.dizziness === "Yes",
      previousInjury: screening.previousInjury,
      currentlyInjured: screening.currentlyInjured === "Yes",
      onMedication: screening.onMedication === "Yes",
      notes: screening.notes,
    };

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/pharmacy/screenings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (res.ok) {
        setSavedRecord(result.screening);
        setToast({ message: "Screening saved successfully." });
      } else {
        setToast({ message: result.error || "Save failed.", type: "error" });
      }
    } catch {
      setToast({ message: "Connection error.", type: "error" });
    }
    setLoading(false);
  };

  const downloadPdf = async () => {
    if (!savedRecord) return;
    try {
      const res = await fetch(`${API}/api/pharmacy/screenings/${savedRecord.id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const result = await res.json();
        setToast({ message: result.error || "PDF generation failed.", type: "error" });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `pharmacy-screening-${savedRecord.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setToast({ message: "Unable to download PDF.", type: "error" });
    }
  };

  if (!token) {
    return (
      <div style={{ maxWidth: 500, margin: "60px auto", padding: "0 24px" }}>
        <div style={{ fontFamily: "Bebas Neue", fontSize: 36, letterSpacing: 2, color: "var(--gold)", marginBottom: 16 }}>PHARMACY SCREENING LOGIN</div>
        <div className="card">
          <div className="form-group"><label>Email</label><input className="input-field" type="email" value={login.email} onChange={(e) => setLogin((prev) => ({ ...prev, email: e.target.value }))} placeholder="clinic@partner.jireh.com" /></div>
          <div className="form-group"><label>Password</label><input className="input-field" type="password" value={login.password} onChange={(e) => setLogin((prev) => ({ ...prev, password: e.target.value }))} placeholder="••••••••" onKeyDown={(e) => e.key === "Enter" && handleLogin()} /></div>
          <button className="btn-primary" style={{ width: "100%" }} onClick={handleLogin} disabled={loading}>{loading ? "Signing in..." : "LOGIN"}</button>
          <p style={{ fontSize: 11, color: "var(--white-dim)", marginTop: 12, textAlign: "center" }}>Use your partner credentials to open the pharmacy screening module.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 980, margin: "40px auto", padding: "0 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "Bebas Neue", fontSize: 36, letterSpacing: 2, color: "var(--gold)" }}>PHARMACY SCREENING MODULE</div>
          <div style={{ fontSize: 13, color: "var(--white-dim)" }}>{user.clinicName}</div>
        </div>
        <button className="btn-secondary" onClick={() => { setToken(null); setUser(null); setPlayer(null); setSavedRecord(null); }}>Logout</button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "Barlow Condensed", fontSize: 16, letterSpacing: 1.5, color: "var(--gold)", marginBottom: 12 }}>PLAYER LOOKUP</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input className="input-field" value={search} onChange={(e) => setSearch(e.target.value.toUpperCase())} placeholder="Enter player code (APP-XXXX or JRH-XXXX)" style={{ flex: 1 }} onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
          <button className="btn-primary" onClick={handleSearch} disabled={loading} style={{ whiteSpace: "nowrap" }}>Search</button>
        </div>
      </div>

      {player && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "Bebas Neue", fontSize: 22, marginBottom: 8 }}>{player.name}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, color: "var(--white-dim)", fontSize: 13 }}>
            <div><strong>Age</strong><br />{player.age}</div>
            <div><strong>Sport</strong><br />{player.position || "N/A"}</div>
            <div><strong>Position</strong><br />{player.position || "N/A"}</div>
            <div><strong>Status</strong><br /><span className={player.status === "Verified" ? "badge-green" : "badge-pending"}>{player.status}</span></div>
          </div>
        </div>
      )}

      {player && (
        <div className="card" style={{ display: "grid", gap: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <div style={{ fontFamily: "Barlow Condensed", fontSize: 14, letterSpacing: 1.5, color: "var(--gold)", marginBottom: 12 }}>STEP 1: VITALS</div>
              <div className="form-group"><label>Height (cm)</label><input className="input-field" type="number" value={screening.height} onChange={(e) => setScreening((prev) => ({ ...prev, height: e.target.value }))} placeholder="178" /></div>
              <div className="form-group"><label>Weight (kg)</label><input className="input-field" type="number" value={screening.weight} onChange={(e) => setScreening((prev) => ({ ...prev, weight: e.target.value }))} placeholder="72" /></div>
              <div className="form-group"><label>Blood Pressure</label><input className="input-field" value={screening.bloodPressure} onChange={(e) => setScreening((prev) => ({ ...prev, bloodPressure: e.target.value }))} placeholder="120/80" /></div>
              <div className="form-group"><label>Resting Heart Rate</label><input className="input-field" type="number" value={screening.restingHeartRate} onChange={(e) => setScreening((prev) => ({ ...prev, restingHeartRate: e.target.value }))} placeholder="72" /></div>
              <div className="form-group"><label>Body Composition (%)</label><input className="input-field" type="number" value={screening.bodyComposition} onChange={(e) => setScreening((prev) => ({ ...prev, bodyComposition: e.target.value }))} placeholder="18" /></div>
            </div>
            <div>
              <div style={{ fontFamily: "Barlow Condensed", fontSize: 14, letterSpacing: 1.5, color: "var(--gold)", marginBottom: 12 }}>STEP 2: QUICK SCREENING</div>
              <div className="form-group"><label>Pain during training?</label><select className="input-field" value={screening.painLevel} onChange={(e) => setScreening((prev) => ({ ...prev, painLevel: e.target.value }))}><option>None</option><option>Mild</option><option>Severe</option></select></div>
              <div className="form-group"><label>Recent dizziness or fainting?</label><select className="input-field" value={screening.dizziness} onChange={(e) => setScreening((prev) => ({ ...prev, dizziness: e.target.value }))}><option>No</option><option>Yes</option></select></div>
              <div className="form-group"><label>Previous injury</label><select className="input-field" value={screening.previousInjury} onChange={(e) => setScreening((prev) => ({ ...prev, previousInjury: e.target.value }))}><option>None</option><option>Knee</option><option>Ankle</option><option>Other</option></select></div>
              <div className="form-group"><label>Currently injured?</label><select className="input-field" value={screening.currentlyInjured} onChange={(e) => setScreening((prev) => ({ ...prev, currentlyInjured: e.target.value }))}><option>No</option><option>Yes</option></select></div>
              <div className="form-group"><label>On medication?</label><select className="input-field" value={screening.onMedication} onChange={(e) => setScreening((prev) => ({ ...prev, onMedication: e.target.value }))}><option>No</option><option>Yes</option></select></div>
            </div>
          </div>

          <div className="card" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
            <div style={{ fontFamily: "Barlow Condensed", fontSize: 14, letterSpacing: 1.5, color: "var(--gold)", marginBottom: 12 }}>STEP 3: AUTO CALCULATIONS</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
              <div style={{ padding: 14, background: "rgba(255,255,255,0.06)", borderRadius: 10 }}><div style={{ fontSize: 11, color: "var(--white-dim)", marginBottom: 6 }}>BMI</div><div style={{ fontSize: 22, fontWeight: 700 }}>{bmi || "—"}</div><div style={{ color: "var(--gold)", fontSize: 12 }}>{category.bmi}</div></div>
              <div style={{ padding: 14, background: "rgba(255,255,255,0.06)", borderRadius: 10 }}><div style={{ fontSize: 11, color: "var(--white-dim)", marginBottom: 6 }}>BP Category</div><div style={{ fontSize: 22, fontWeight: 700 }}>{category.bp}</div></div>
              <div style={{ padding: 14, background: "rgba(255,255,255,0.06)", borderRadius: 10 }}><div style={{ fontSize: 11, color: "var(--white-dim)", marginBottom: 6 }}>HR Category</div><div style={{ fontSize: 22, fontWeight: 700 }}>{category.hr}</div></div>
              <div style={{ padding: 14, background: "rgba(255,255,255,0.06)", borderRadius: 10 }}><div style={{ fontSize: 11, color: "var(--white-dim)", marginBottom: 6 }}>Risk Level</div><div className={statusBadge(category.risk)} style={{ fontSize: 22, fontWeight: 700, padding: "8px 10px", display: "inline-block" }}>{category.risk}</div></div>
            </div>
          </div>

          <div className="form-group"><label>Pharmacy Notes</label><textarea className="input-field" rows={4} value={screening.notes} onChange={(e) => setScreening((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Observations, recommendations, referral notes..." style={{ resize: "vertical" }} /></div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            <button className="btn-primary" onClick={handleSave} disabled={loading}>{loading ? "Saving..." : "Save Screening Record"}</button>
            <button className="btn-secondary" onClick={downloadPdf} disabled={!savedRecord}>{savedRecord ? "Download PDF Report" : "Save first to generate PDF"}</button>
          </div>

          <div style={{ marginTop: 16, padding: 16, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10 }}>
            <div style={{ fontFamily: "Barlow Condensed", fontSize: 13, color: "var(--gold)", marginBottom: 8 }}>DISCLAIMER</div>
            <p style={{ color: "var(--white-dim)", fontSize: 13, lineHeight: 1.6 }}>This screening is not a medical diagnosis. Consult a qualified medical professional for further evaluation.</p>
          </div>
        </div>
      )}

      {savedRecord && (
        <div className="card" style={{ marginTop: 20, borderColor: "rgba(34,197,94,0.25)" }}>
          <div style={{ fontFamily: "Bebas Neue", fontSize: 22, color: "#22c55e", marginBottom: 10 }}>Last Saved Screening</div>
          <div style={{ color: "var(--white-dim)", fontSize: 13, marginBottom: 8 }}>Record ID: {savedRecord.id} · {new Date(savedRecord.created_at).toLocaleString()}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
            <div style={{ padding: 14, background: "rgba(255,255,255,0.05)", borderRadius: 10 }}><strong>BMI</strong><div>{savedRecord.bmi} ({savedRecord.bmi_category})</div></div>
            <div style={{ padding: 14, background: "rgba(255,255,255,0.05)", borderRadius: 10 }}><strong>BP</strong><div>{savedRecord.systolic}/{savedRecord.diastolic} ({savedRecord.bp_category})</div></div>
            <div style={{ padding: 14, background: "rgba(255,255,255,0.05)", borderRadius: 10 }}><strong>HR</strong><div>{savedRecord.resting_heart_rate} bpm ({savedRecord.hr_category})</div></div>
            <div style={{ padding: 14, background: "rgba(255,255,255,0.05)", borderRadius: 10 }}><strong>Risk</strong><div className={statusBadge(savedRecord.risk_level)} style={{ padding: "6px 10px", display: "inline-block" }}>{savedRecord.risk_level}</div></div>
          </div>
        </div>
      )}
    </div>
  );
}
