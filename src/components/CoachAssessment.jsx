import { useState, useMemo } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const scoreFields = [
  { key: "firstTouch", label: "First Touch" },
  { key: "weakFoot", label: "Weak Foot" },
  { key: "passing", label: "Passing" },
  { key: "dribbling", label: "Dribbling" },
  { key: "scanning", label: "Scanning" },
  { key: "positioning", label: "Positioning" },
  { key: "decisionMaking", label: "Decision Making" },
  { key: "pressing", label: "Pressing" },
  { key: "recoveryRuns", label: "Recovery Runs" },
  { key: "aggression", label: "Aggression" },
  { key: "leadership", label: "Leadership" },
  { key: "reactionToMistakes", label: "Reaction to Mistakes" },
  { key: "composure", label: "Composure" },
  { key: "timingOfRuns", label: "Timing of Runs" },
  { key: "creatingSpace", label: "Creating Space" },
  { key: "bodyOrientation", label: "Body Orientation" },
  { key: "tackling", label: "Tackling" },
  { key: "interceptions", label: "Interceptions" },
  { key: "aerialDuels", label: "Aerial Duels" },
  { key: "crossing", label: "Crossing" },
  { key: "learningSpeed", label: "Learning Speed" },
  { key: "responseToInstructions", label: "Response to Instructions" },
  { key: "attitude", label: "Attitude" },
];

function average(values) {
  const valid = values.filter((n) => !Number.isNaN(n) && n > 0);
  if (!valid.length) return null;
  return Number((valid.reduce((sum, next) => sum + next, 0) / valid.length).toFixed(1));
}

function createRankings(values) {
  const list = Object.entries(values)
    .map(([key, value]) => ({ key, value, label: scoreFields.find((field) => field.key === key)?.label || key }))
    .filter((item) => typeof item.value === "number" && item.value > 0);
  const sorted = [...list].sort((a, b) => b.value - a.value);
  return {
    top: sorted.slice(0, 3).map((item) => `${item.label} (${item.value})`),
    bottom: sorted.slice(-3).reverse().map((item) => `${item.label} (${item.value})`),
  };
}

export default function CoachAssessment({ setToast }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [login, setLogin] = useState({ email: "", password: "" });
  const [search, setSearch] = useState("");
  const [player, setPlayer] = useState(null);
  const [assessment, setAssessment] = useState({
    sessionType: "Training",
    sessionDate: new Date().toISOString().slice(0, 10),
    opponent: "",
    firstTouch: "5",
    weakFoot: "5",
    passing: "5",
    dribbling: "5",
    scanning: "5",
    positioning: "5",
    decisionMaking: "5",
    topSpeed: "",
    distanceCovered: "",
    highIntensitySprints: "",
    pressing: "5",
    recoveryRuns: "5",
    aggression: "5",
    leadership: "5",
    reactionToMistakes: "5",
    composure: "5",
    timingOfRuns: "5",
    creatingSpace: "5",
    bodyOrientation: "5",
    tackling: "5",
    interceptions: "5",
    aerialDuels: "5",
    shotsOnTarget: "",
    xgCreated: "",
    crossing: "5",
    learningSpeed: "5",
    responseToInstructions: "5",
    attitude: "5",
    coachNotes: "",
  });
  const [savedRecord, setSavedRecord] = useState(null);
  const [loading, setLoading] = useState(false);

  const ratingValues = useMemo(
    () => scoreFields.reduce((acc, field) => ({ ...acc, [field.key]: Number(assessment[field.key]) || 0 }), {}),
    [assessment]
  );

  const averageRating = useMemo(() => average(Object.values(ratingValues)), [ratingValues]);
  const rankings = useMemo(() => createRankings(ratingValues), [ratingValues]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/assessor/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(login),
      });
      const result = await res.json();
      if (result.token) {
        setToken(result.token);
        setUser(result);
        setToast({ message: `Welcome, ${result.name}!` });
      } else {
        setToast({ message: result.error || "Login failed.", type: "error" });
      }
    } catch {
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
      } else {
        setToast({ message: result.error || "Player not found.", type: "error" });
        setPlayer(null);
      }
    } catch {
      setToast({ message: "Connection error.", type: "error" });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!player) {
      setToast({ message: "Search and select a player first.", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        playerId: player.id,
        sessionType: assessment.sessionType,
        sessionDate: assessment.sessionDate,
        opponent: assessment.opponent,
        firstTouch: Number(assessment.firstTouch),
        weakFoot: Number(assessment.weakFoot),
        passing: Number(assessment.passing),
        dribbling: Number(assessment.dribbling),
        scanning: Number(assessment.scanning),
        positioning: Number(assessment.positioning),
        decisionMaking: Number(assessment.decisionMaking),
        topSpeed: assessment.topSpeed ? Number(assessment.topSpeed) : null,
        distanceCovered: assessment.distanceCovered ? Number(assessment.distanceCovered) : null,
        highIntensitySprints: assessment.highIntensitySprints ? Number(assessment.highIntensitySprints) : null,
        pressing: Number(assessment.pressing),
        recoveryRuns: Number(assessment.recoveryRuns),
        aggression: Number(assessment.aggression),
        leadership: Number(assessment.leadership),
        reactionToMistakes: Number(assessment.reactionToMistakes),
        composure: Number(assessment.composure),
        timingOfRuns: Number(assessment.timingOfRuns),
        creatingSpace: Number(assessment.creatingSpace),
        bodyOrientation: Number(assessment.bodyOrientation),
        tackling: Number(assessment.tackling),
        interceptions: Number(assessment.interceptions),
        aerialDuels: Number(assessment.aerialDuels),
        shotsOnTarget: assessment.shotsOnTarget ? Number(assessment.shotsOnTarget) : null,
        xgCreated: assessment.xgCreated ? Number(assessment.xgCreated) : null,
        crossing: Number(assessment.crossing),
        learningSpeed: Number(assessment.learningSpeed),
        responseToInstructions: Number(assessment.responseToInstructions),
        attitude: Number(assessment.attitude),
        coachNotes: assessment.coachNotes,
      };

      const res = await fetch(`${API}/api/coach/assessments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (res.ok) {
        setSavedRecord(result.assessment);
        setToast({ message: "Assessment saved." });
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
      const res = await fetch(`${API}/api/coach/assessments/${savedRecord.id}/pdf`, {
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
      link.download = `coach-assessment-${savedRecord.id}.pdf`;
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
        <div style={{ fontFamily: "Bebas Neue", fontSize: 36, letterSpacing: 2, color: "var(--gold)", marginBottom: 16 }}>COACH ASSESSMENT LOGIN</div>
        <div className="card">
          <div className="form-group"><label>Email</label><input className="input-field" type="email" value={login.email} onChange={(e) => setLogin((prev) => ({ ...prev, email: e.target.value }))} placeholder="coach@jireh.com" /></div>
          <div className="form-group"><label>Password</label><input className="input-field" type="password" value={login.password} onChange={(e) => setLogin((prev) => ({ ...prev, password: e.target.value }))} placeholder="••••••••" onKeyDown={(e) => e.key === "Enter" && handleLogin()} /></div>
          <button className="btn-primary" style={{ width: "100%" }} onClick={handleLogin} disabled={loading}>{loading ? "Signing in..." : "LOGIN"}</button>
          <p style={{ fontSize: 11, color: "var(--white-dim)", marginTop: 12, textAlign: "center" }}>Enter the coach portal to complete assessments and generate reports.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: "40px auto", padding: "0 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "Bebas Neue", fontSize: 36, letterSpacing: 2, color: "var(--gold)" }}>COACH PLAYER ASSESSMENT</div>
          <div style={{ fontSize: 13, color: "var(--white-dim)" }}>{user.name}</div>
        </div>
        <button className="btn-secondary" onClick={() => { setToken(null); setUser(null); setPlayer(null); setSavedRecord(null); }}>Logout</button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "Barlow Condensed", fontSize: 16, letterSpacing: 1.5, color: "var(--gold)", marginBottom: 12 }}>PLAYER SELECTION</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input className="input-field" value={search} onChange={(e) => setSearch(e.target.value.toUpperCase())} placeholder="JRH-XXXX or APP-XXXX" style={{ flex: 1 }} onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
          <button className="btn-primary" onClick={handleSearch} disabled={loading}>Find Player</button>
        </div>
      </div>

      {player && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "Bebas Neue", fontSize: 22, marginBottom: 8 }}>{player.name}</div>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap", color: "var(--white-dim)", fontSize: 13 }}>
            <div><strong>Age</strong><br />{player.age}</div>
            <div><strong>Position</strong><br />{player.position || "N/A"}</div>
            <div><strong>Status</strong><br /><span className={player.status === "Verified" ? "badge-green" : "badge-pending"}>{player.status}</span></div>
          </div>
        </div>
      )}

      {player && (
        <div className="card" style={{ display: "grid", gap: 24 }}>
          <div>
            <div style={{ fontFamily: "Barlow Condensed", fontSize: 14, letterSpacing: 1.5, color: "var(--gold)", marginBottom: 12 }}>SESSION DETAILS</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <div className="form-group"><label>Session Type</label><select className="input-field" value={assessment.sessionType} onChange={(e) => setAssessment((prev) => ({ ...prev, sessionType: e.target.value }))}><option>Training</option><option>Match</option></select></div>
              <div className="form-group"><label>Date</label><input className="input-field" type="date" value={assessment.sessionDate} onChange={(e) => setAssessment((prev) => ({ ...prev, sessionDate: e.target.value }))} /></div>
              <div className="form-group"><label>Opponent</label><input className="input-field" value={assessment.opponent} onChange={(e) => setAssessment((prev) => ({ ...prev, opponent: e.target.value }))} placeholder="Optional" /></div>
            </div>
          </div>

          <div>
            <div style={{ fontFamily: "Barlow Condensed", fontSize: 14, letterSpacing: 1.5, color: "var(--gold)", marginBottom: 12 }}>TECHNICAL & TACTICAL</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
              {scoreFields.slice(0, 7).map((item) => (
                <div key={item.key} className="form-group"><label>{item.label}</label><input className="input-field" type="number" min="1" max="5" value={assessment[item.key]} onChange={(e) => setAssessment((prev) => ({ ...prev, [item.key]: e.target.value }))} /></div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontFamily: "Barlow Condensed", fontSize: 14, letterSpacing: 1.5, color: "var(--gold)", marginBottom: 12 }}>PHYSICAL (OPTIONAL)</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
              <div className="form-group"><label>Top Speed (km/h)</label><input className="input-field" type="number" step="0.1" value={assessment.topSpeed} onChange={(e) => setAssessment((prev) => ({ ...prev, topSpeed: e.target.value }))} /></div>
              <div className="form-group"><label>Distance Covered (km)</label><input className="input-field" type="number" step="0.1" value={assessment.distanceCovered} onChange={(e) => setAssessment((prev) => ({ ...prev, distanceCovered: e.target.value }))} /></div>
              <div className="form-group"><label>High Intensity Sprints</label><input className="input-field" type="number" value={assessment.highIntensitySprints} onChange={(e) => setAssessment((prev) => ({ ...prev, highIntensitySprints: e.target.value }))} /></div>
            </div>
          </div>

          <div>
            <div style={{ fontFamily: "Barlow Condensed", fontSize: 14, letterSpacing: 1.5, color: "var(--gold)", marginBottom: 12 }}>WORK ETHIC, PSYCHOLOGICAL & MOVEMENT</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
              {scoreFields.slice(7, 20).map((item) => (
                <div key={item.key} className="form-group"><label>{item.label}</label><input className="input-field" type="number" min="1" max="5" value={assessment[item.key]} onChange={(e) => setAssessment((prev) => ({ ...prev, [item.key]: e.target.value }))} /></div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontFamily: "Barlow Condensed", fontSize: 14, letterSpacing: 1.5, color: "var(--gold)", marginBottom: 12 }}>ATTACKING & COACHABILITY</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
              {scoreFields.slice(20).map((item) => (
                <div key={item.key} className="form-group"><label>{item.label}</label><input className="input-field" type="number" min="1" max="5" value={assessment[item.key]} onChange={(e) => setAssessment((prev) => ({ ...prev, [item.key]: e.target.value }))} /></div>
              ))}
              <div className="form-group"><label>Shots on Target</label><input className="input-field" type="number" value={assessment.shotsOnTarget} onChange={(e) => setAssessment((prev) => ({ ...prev, shotsOnTarget: e.target.value }))} /></div>
              <div className="form-group"><label>xG Created</label><input className="input-field" type="number" step="0.01" value={assessment.xgCreated} onChange={(e) => setAssessment((prev) => ({ ...prev, xgCreated: e.target.value }))} /></div>
            </div>
          </div>

          <div className="form-group"><label>Coach Notes</label><textarea className="input-field" rows={4} value={assessment.coachNotes} onChange={(e) => setAssessment((prev) => ({ ...prev, coachNotes: e.target.value }))} placeholder="Write performance summary, development plan, or risk notes..." style={{ resize: "vertical" }} /></div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <button className="btn-primary" onClick={handleSave} disabled={loading}>{loading ? "Saving..." : "Save Assessment"}</button>
            <button className="btn-secondary" onClick={downloadPdf} disabled={!savedRecord}>{savedRecord ? "Download PDF Report" : "Save first to generate PDF"}</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 20 }}>
            <div style={{ padding: 14, background: "rgba(255,255,255,0.06)", borderRadius: 12 }}>
              <div style={{ fontSize: 12, color: "var(--white-dim)", marginBottom: 6 }}>Average Rating</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{averageRating || "—"}</div>
            </div>
            <div style={{ padding: 14, background: "rgba(255,255,255,0.06)", borderRadius: 12 }}>
              <div style={{ fontSize: 12, color: "var(--white-dim)", marginBottom: 8 }}>Top 3 Strengths</div>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>{rankings.top.length > 0 ? rankings.top.join("\n") : "None yet."}</div>
            </div>
            <div style={{ padding: 14, background: "rgba(255,255,255,0.06)", borderRadius: 12 }}>
              <div style={{ fontSize: 12, color: "var(--white-dim)", marginBottom: 8 }}>Bottom 3 Weak Areas</div>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>{rankings.bottom.length > 0 ? rankings.bottom.join("\n") : "None yet."}</div>
            </div>
          </div>

          <div style={{ padding: 16, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10 }}>
            <div style={{ fontFamily: "Barlow Condensed", fontSize: 13, color: "var(--gold)", marginBottom: 8 }}>RECOMMENDATION</div>
            <p style={{ color: "var(--white-dim)", fontSize: 13, lineHeight: 1.6 }}>Use this assessment to support player development and referral decisions. Save records and export PDF reports for club review.</p>
          </div>
        </div>
      )}

      {savedRecord && (
        <div className="card" style={{ marginTop: 20, borderColor: "rgba(59,130,246,0.25)" }}>
          <div style={{ fontFamily: "Bebas Neue", fontSize: 22, color: "#3b82f6", marginBottom: 10 }}>Last Saved Assessment</div>
          <div style={{ color: "var(--white-dim)", fontSize: 13, marginBottom: 10 }}>Record ID: {savedRecord.id} · {new Date(savedRecord.created_at).toLocaleString()}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            <div style={{ padding: 14, background: "rgba(255,255,255,0.05)", borderRadius: 10 }}><strong>Average</strong><div>{savedRecord.average_rating}</div></div>
            <div style={{ padding: 14, background: "rgba(255,255,255,0.05)", borderRadius: 10 }}><strong>Top Strengths</strong><div style={{ fontSize: 13, lineHeight: 1.5 }}>{savedRecord.top_strengths}</div></div>
            <div style={{ padding: 14, background: "rgba(255,255,255,0.05)", borderRadius: 10 }}><strong>Weak Areas</strong><div style={{ fontSize: 13, lineHeight: 1.5 }}>{savedRecord.bottom_weaknesses}</div></div>
          </div>
        </div>
      )}
    </div>
  );
}
