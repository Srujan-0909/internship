import { useState, useRef, useCallback, useEffect } from "react";

const PRIORITY_ORDER = ["Consulting", "Finance", "Business Analyst"];

const KEYWORDS = {
  "Consulting": [
    "consulting", "consultant", "management consulting", "strategy",
    "advisory", "client-facing", "engagement", "deliverable", "stakeholder management",
    "problem solving", "analytical", "presentation", "powerpoint", "case study",
    "due diligence", "market research", "competitive analysis", "framework",
    "recommendation", "implementation", "transformation", "change management",
    "communication", "leadership", "team", "project", "proposal", "RFP",
    "business development", "strategy consulting", "operations consulting",
    "financial analysis", "benchmarking", "best practices", "workshop",
    "facilitation", "stakeholder", "cross-functional", "problem-solving",
  ],
  "Finance": [
    "finance", "financial", "investment", "banking", "accounting",
    "valuation", "DCF", "financial modeling", "equity", "debt",
    "portfolio", "risk management", "capital markets", "M&A", "mergers",
    "acquisitions", "private equity", "venture capital", "hedge fund",
    "asset management", "corporate finance", "treasury", "budgeting",
    "forecasting", "P&L", "balance sheet", "cash flow", "ROI",
    "financial planning", "audit", "compliance", "SEC", "GAAP",
    "impact investing", "ESG", "sustainable finance", "fintech",
    "revenue", "profit", "loss", "fiscal", "monetary", "credit",
    "loan", "interest rate", "bond", "stock", "derivatives",
  ],
  "Business Analyst": [
    "business analyst", "business analysis", "requirements gathering", "stakeholder",
    "process improvement", "BRD", "user stories", "agile", "scrum", "jira",
    "business requirements", "gap analysis", "workflow", "use case", "UAT",
    "functional requirements", "business process", "BA ", "business intelligence",
    "project management", "product owner", "backlog", "sprint", "KPI",
    "dashboard", "reporting", "excel", "powerpoint", "visio", "wireframe",
    "data-driven", "operations", "strategy", "optimization", "metrics",
  ],
};

function scoreMatch(jobText, resumeType) {
  const lower = jobText.toLowerCase();
  const kws = KEYWORDS[resumeType];
  let hits = 0;
  for (const kw of kws) {
    if (lower.includes(kw.toLowerCase())) hits++;
  }
  return Math.round((hits / kws.length) * 100);
}

function matchResume(jobText) {
  const scores = PRIORITY_ORDER.map((type, idx) => ({
    type,
    score: scoreMatch(jobText, type),
    priority: idx,
  }));
  scores.sort((a, b) => {
    if (Math.abs(a.score - b.score) <= 8) return a.priority - b.priority;
    return b.score - a.score;
  });
  return scores;
}

const STATUS_OPTIONS = ["To Apply", "Applied", "Interview", "Offer", "Rejected"];
const STATUS_COLORS = {
  "To Apply":  { bg: "#FFF7ED", text: "#C2410C", dot: "#EA580C" },
  "Applied":   { bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6" },
  "Interview": { bg: "#F5F3FF", text: "#6D28D9", dot: "#8B5CF6" },
  "Offer":     { bg: "#ECFDF5", text: "#047857", dot: "#10B981" },
  "Rejected":  { bg: "#FEF2F2", text: "#B91C1C", dot: "#EF4444" },
};
const RESUME_COLORS = {
  "Consulting":       { bg: "#E0E7FF", text: "#3730A3", accent: "#6366F1" },
  "Finance":          { bg: "#FEF3C7", text: "#92400E", accent: "#F59E0B" },
  "Business Analyst": { bg: "#DBEAFE", text: "#1E40AF", accent: "#3B82F6" },
};

const generateId = () => Math.random().toString(36).substring(2, 10);

// ─── Components ───────────────────────────────────────────────────────────────

function GlassCard({ children, style, className, onClick }) {
  return (
    <div onClick={onClick} className={className} style={{
      background: "rgba(255,255,255,0.72)",
      backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      borderRadius: 16, border: "1px solid rgba(255,255,255,0.35)",
      boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
      ...style,
    }}>
      {children}
    </div>
  );
}

function ScoreRing({ score, size = 52, color }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width={size} height={size} style={{ display: "block" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={4} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)" }} />
      <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: 13, fontWeight: 700, fill: color, fontFamily: "'DM Sans', sans-serif" }}>
        {score}
      </text>
    </svg>
  );
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function hashPin(pin) {
  // simple djb2 hash — good enough for local-only auth
  let h = 5381;
  for (let i = 0; i < pin.length; i++) h = (h * 33) ^ pin.charCodeAt(i);
  return (h >>> 0).toString(36);
}

// ─── Login screen ─────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const isSetup = !localStorage.getItem("ip_pin_hash");
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [name, setName] = useState(localStorage.getItem("ip_name") || "");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (isSetup) {
      if (pin.length < 4) { setError("PIN must be at least 4 characters."); return; }
      if (pin !== confirm) { setError("PINs don't match."); triggerShake(); return; }
      if (!name.trim()) { setError("Enter your name."); return; }
      localStorage.setItem("ip_pin_hash", hashPin(pin));
      localStorage.setItem("ip_name", name.trim());
      onLogin(name.trim());
    } else {
      if (hashPin(pin) !== localStorage.getItem("ip_pin_hash")) {
        setError("Wrong PIN.");
        triggerShake();
        setPin("");
        return;
      }
      onLogin(localStorage.getItem("ip_name") || "");
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)",
      fontFamily: "'DM Sans', system-ui, sans-serif", padding: 20,
    }}>
      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
      <div style={{
        width: "100%", maxWidth: 380,
        animation: "fadeUp 0.4s ease",
        ...(shake ? { animation: "shake 0.45s ease" } : {}),
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⚡</div>
          <h1 style={{
            margin: 0, color: "#F8FAFC",
            fontFamily: "'Space Mono', monospace", fontSize: 26, fontWeight: 700,
          }}>InternPilot</h1>
          <p style={{ margin: "6px 0 0", color: "#94A3B8", fontSize: 13 }}>
            {isSetup ? "Create your account" : "Welcome back"}
          </p>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.06)", backdropFilter: "blur(20px)",
          borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)",
          padding: "32px 28px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        }}>
          <form onSubmit={handleSubmit}>
            {isSetup && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94A3B8", marginBottom: 6, letterSpacing: "0.5px" }}>
                  YOUR NAME
                </label>
                <input
                  value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Srujan"
                  autoFocus
                  style={{
                    width: "100%", padding: "11px 14px", borderRadius: 10, boxSizing: "border-box",
                    border: "1.5px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.07)",
                    color: "#F8FAFC", fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#818CF8"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
                />
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94A3B8", marginBottom: 6, letterSpacing: "0.5px" }}>
                {isSetup ? "CREATE PIN" : "PIN"}
              </label>
              <input
                type="password" value={pin} onChange={(e) => setPin(e.target.value)}
                placeholder={isSetup ? "Min 4 characters" : "Enter your PIN"}
                autoFocus={!isSetup}
                style={{
                  width: "100%", padding: "11px 14px", borderRadius: 10, boxSizing: "border-box",
                  border: "1.5px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.07)",
                  color: "#F8FAFC", fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none",
                }}
                onFocus={(e) => e.target.style.borderColor = "#818CF8"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
              />
            </div>

            {isSetup && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94A3B8", marginBottom: 6, letterSpacing: "0.5px" }}>
                  CONFIRM PIN
                </label>
                <input
                  type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat PIN"
                  style={{
                    width: "100%", padding: "11px 14px", borderRadius: 10, boxSizing: "border-box",
                    border: "1.5px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.07)",
                    color: "#F8FAFC", fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#818CF8"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
                />
              </div>
            )}

            {error && (
              <div style={{
                marginBottom: 14, padding: "9px 13px", borderRadius: 9,
                background: "rgba(239,68,68,0.15)", color: "#FCA5A5", fontSize: 13,
              }}>{error}</div>
            )}

            <button type="submit" style={{
              width: "100%", padding: "12px", borderRadius: 11, border: "none",
              background: "linear-gradient(135deg, #6366F1, #818CF8)",
              color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
            }}>
              {isSetup ? "Create Account" : "Sign In"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: 20, color: "#475569", fontSize: 12 }}>
          Data is stored locally in your browser.
        </p>
      </div>
    </div>
  );
}

// ─── Job Board Tab ─────────────────────────────────────────────────────────────

// Region presets
const REGION_PRESETS = [
  { label: "🇮🇳 India",  location: "India" },
  { label: "🇺🇸 USA",    location: "United States" },
  { label: "🇬🇧 UK",     location: "United Kingdom" },
  { label: "🇪🇺 Europe", location: "Europe" },
  { label: "🌍 Remote",  location: "remote" },
];

// Terms that improve internship hit-rate in JSearch (no employment_types filter)
const INTERNSHIP_TERMS = ["internship", "intern", "trainee", "graduate program", "summer analyst"];

// Optimal query presets per role × region
const QUERY_PRESETS = {
  "Consulting": {
    "India":          ["management consulting internship", "strategy consulting intern", "business consulting intern", "McKinsey BCG Bain intern India", "consulting analyst intern"],
    "United States":  ["management consulting internship", "strategy intern summer 2026", "consulting analyst intern", "McKinsey BCG Bain summer analyst", "advisory intern"],
    "United Kingdom": ["management consulting internship London", "strategy consulting graduate scheme", "consulting analyst intern UK", "advisory internship London"],
    "Europe":         ["management consulting internship Europe", "strategy intern summer", "consulting graduate program Europe", "advisory intern Frankfurt Paris"],
    "remote":         ["consulting internship remote", "strategy analyst intern remote", "management consulting remote intern"],
  },
  "Finance": {
    "India":          ["finance internship", "investment banking intern India", "equity research intern", "financial analyst intern", "ESG finance intern India"],
    "United States":  ["investment banking summer analyst", "finance internship Wall Street", "equity research intern", "corporate finance intern", "impact investing intern"],
    "United Kingdom": ["investment banking internship London", "finance summer analyst UK", "asset management intern London", "ESG investing intern"],
    "Europe":         ["investment banking internship Europe", "finance intern Frankfurt Zurich", "private equity intern Europe", "sustainable finance intern"],
    "remote":         ["finance internship remote", "financial analyst intern remote", "fintech intern remote"],
  },
  "Business Analyst": {
    "India":          ["business analyst internship", "product analyst intern India", "operations intern", "data analyst intern", "business intelligence intern India"],
    "United States":  ["business analyst internship", "product analyst intern", "operations analyst summer 2026", "strategy and operations intern", "MBA intern business analyst"],
    "United Kingdom": ["business analyst internship UK", "product intern London", "operations analyst graduate scheme", "business intelligence intern"],
    "Europe":         ["business analyst internship Europe", "product analyst intern", "operations intern Germany France", "data analyst intern Europe"],
    "remote":         ["business analyst internship remote", "product analyst intern remote", "operations analyst remote intern"],
  },
};

function JobBoardTab({ resumes, onAddToTracker }) {
  const [query, setQuery] = useState("consulting internship");
  const [location, setLocation] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [autoMatched, setAutoMatched] = useState({});
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("jsearch_key") || "");
  const [showKeyInput, setShowKeyInput] = useState(false);

  const saveKey = (val) => {
    setApiKey(val);
    localStorage.setItem("jsearch_key", val);
  };

  const runSearch = async (q, loc) => {
    if (!apiKey.trim()) { setError("no_key"); return; }
    setLoading(true);
    setError("");
    setResults([]);
    setAutoMatched({});
    try {
      // Ensure query includes an internship term for better results
      const hasInternTerm = INTERNSHIP_TERMS.some((t) => q.toLowerCase().includes(t));
      const finalQuery = hasInternTerm ? q : `${q} internship`;
      const searchQuery = loc ? `${finalQuery} in ${loc}` : finalQuery;

      // Fetch 3 pages in parallel for more results
      const pages = [1, 2, 3];
      const responses = await Promise.all(pages.map((page) => {
        const url = new URL("https://jsearch.p.rapidapi.com/search");
        url.searchParams.set("query", searchQuery);
        url.searchParams.set("page", String(page));
        url.searchParams.set("num_pages", "1");
        url.searchParams.set("date_posted", "all");
        // No employment_types filter — it's too strict and drops most results
        return fetch(url.toString(), {
          headers: {
            "X-RapidAPI-Key": apiKey.trim(),
            "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
          },
        }).then((r) => r.json()).catch(() => ({ data: [] }));
      }));

      const seen = new Set();
      const jobs = responses.flatMap((data) => data.data || [])
        .filter((job) => {
          if (seen.has(job.job_id)) return false;
          seen.add(job.job_id);
          return true;
        })
        .map((job) => ({
          id: job.job_id,
          title: job.job_title,
          company: job.employer_name,
          location: [job.job_city, job.job_state, job.job_country].filter(Boolean).join(", ") || (job.job_is_remote ? "Remote" : ""),
          description: job.job_description?.substring(0, 1000) || "",
          url: job.job_apply_link || job.job_google_link,
          employer_logo: job.employer_logo,
          source: job.job_publisher,
        }));

      setResults(jobs);
      const matched = {};
      for (const job of jobs) {
        const scores = matchResume(`${job.title} ${job.description}`);
        matched[job.id] = scores[0];
      }
      setAutoMatched(matched);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const search = () => runSearch(query, location);
  const handleKeyDown = (e) => { if (e.key === "Enter") search(); };

  return (
    <div>
      <GlassCard style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1E293B" }}>Job Board Search</h2>
          <button onClick={() => setShowKeyInput((v) => !v)} style={{
            padding: "4px 12px", borderRadius: 8, border: "1.5px solid #E2E8F0",
            background: "#fff", color: "#64748B", fontSize: 12, fontWeight: 600, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {apiKey ? "🔑 Key set" : "🔑 Set API key"}
          </button>
        </div>
        <p style={{ margin: "0 0 14px", fontSize: 13, color: "#64748B" }}>
          Searches LinkedIn, Indeed, Glassdoor & Ziprecruiter simultaneously via JSearch. Results are auto-matched to your best resume.
        </p>

        {(showKeyInput || !apiKey) && (
          <div style={{ marginBottom: 14, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => saveKey(e.target.value)}
              placeholder="Paste your RapidAPI JSearch key here…"
              style={{
                flex: "1 1 280px", padding: "9px 13px", borderRadius: 10,
                border: "1.5px solid #818CF8", fontSize: 13,
                fontFamily: "'DM Sans', sans-serif", outline: "none",
              }}
            />
            <button onClick={() => setShowKeyInput(false)} style={{
              padding: "9px 16px", borderRadius: 10, border: "none",
              background: "#6366F1", color: "#fff", fontWeight: 600, fontSize: 13,
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}>Save</button>
          </div>
        )}

        {/* Region quick-select */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {REGION_PRESETS.map((r) => (
            <button key={r.label}
              onClick={() => { setLocation(r.location); runSearch(query, r.location); }}
              disabled={loading}
              style={{
                padding: "5px 12px", borderRadius: 20, border: "1.5px solid #E2E8F0",
                background: location === r.location ? "#EEF2FF" : "#fff",
                color: location === r.location ? "#6366F1" : "#64748B",
                fontSize: 12.5, fontWeight: 600, cursor: loading ? "default" : "pointer",
                fontFamily: "'DM Sans', sans-serif",
                borderColor: location === r.location ? "#818CF8" : "#E2E8F0",
              }}>
              {r.label}
            </button>
          ))}
        </div>

        {/* Optimal query presets dropdown */}
        {(() => {
          const regionKey = location || "United States";
          const allPresets = PRIORITY_ORDER.flatMap((role) =>
            (QUERY_PRESETS[role]?.[regionKey] || QUERY_PRESETS[role]?.["United States"] || []).map((q) => ({
              label: q,
              role,
              color: RESUME_COLORS[role].accent,
              bg: RESUME_COLORS[role].bg,
              text: RESUME_COLORS[role].text,
            }))
          );
          if (!allPresets.length) return null;
          return (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: "#94A3B8", marginBottom: 6, letterSpacing: "0.4px" }}>
                OPTIMIZED SEARCHES {location ? `· ${location.toUpperCase()}` : ""}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {allPresets.map((p) => (
                  <button key={p.label}
                    onClick={() => { setQuery(p.label); runSearch(p.label, location); }}
                    disabled={loading}
                    style={{
                      padding: "4px 11px", borderRadius: 20,
                      border: `1.5px solid ${query === p.label ? p.color : "#E2E8F0"}`,
                      background: query === p.label ? p.bg : "#fff",
                      color: query === p.label ? p.text : "#64748B",
                      fontSize: 12, fontWeight: 500, cursor: loading ? "default" : "pointer",
                      fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
                    }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="e.g. 'consulting', 'finance analyst', 'business analyst'"
            style={{
              flex: "2 1 200px", padding: "10px 14px", borderRadius: 10,
              border: "1.5px solid #E2E8F0", fontSize: 13.5,
              fontFamily: "'DM Sans', sans-serif", outline: "none",
            }}
            onFocus={(e) => e.target.style.borderColor = "#818CF8"}
            onBlur={(e) => e.target.style.borderColor = "#E2E8F0"}
          />
          <input value={location} onChange={(e) => setLocation(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Location (or pick above)"
            style={{
              flex: "1 1 140px", padding: "10px 14px", borderRadius: 10,
              border: "1.5px solid #E2E8F0", fontSize: 13.5,
              fontFamily: "'DM Sans', sans-serif", outline: "none",
            }}
            onFocus={(e) => e.target.style.borderColor = "#818CF8"}
            onBlur={(e) => e.target.style.borderColor = "#E2E8F0"}
          />
          <button onClick={search} disabled={loading}
            style={{
              padding: "10px 24px", borderRadius: 10, border: "none",
              background: loading ? "#CBD5E1" : "linear-gradient(135deg, #6366F1, #818CF8)",
              color: "#fff", fontWeight: 700, fontSize: 14, cursor: loading ? "default" : "pointer",
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: loading ? "none" : "0 2px 12px rgba(99,102,241,0.3)",
            }}>
            {loading ? "Searching…" : "Search"}
          </button>
        </div>
        {error && (
          <div style={{
            marginTop: 12, padding: "10px 14px", borderRadius: 10,
            background: "#FEF2F2", color: "#B91C1C", fontSize: 13,
          }}>
            {error === "no_key"
              ? <><strong>API key missing.</strong> Click "🔑 Set API key" above and paste your RapidAPI JSearch key.</>
              : error}
          </div>
        )}
      </GlassCard>

      {loading && (
        <GlassCard style={{ padding: 40, textAlign: "center" }}>
          <div style={{
            width: 36, height: 36, border: "3px solid #E2E8F0",
            borderTopColor: "#6366F1", borderRadius: "50%",
            margin: "0 auto 14px",
            animation: "spin 0.8s linear infinite",
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: "#64748B", fontSize: 14 }}>Searching job boards…</p>
        </GlassCard>
      )}

      {!loading && results.length > 0 && (
        <div>
          <div style={{ fontSize: 13, color: "#64748B", marginBottom: 12 }}>
            Found <strong>{results.length}</strong> results
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {results.map((job) => {
              const best = autoMatched[job.id];
              const rc = best ? RESUME_COLORS[best.type] : null;
              return (
                <GlassCard key={job.id} style={{ padding: "18px 22px" }}>
                  <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
                    {/* Company logo placeholder */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                      background: "#F1F5F9", display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 20,
                      overflow: "hidden",
                    }}>
                      {job.employer_logo
                        ? <img src={job.employer_logo} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        : "🏢"}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14.5, color: "#1E293B", marginBottom: 2 }}>
                        {job.title}
                      </div>
                      <div style={{ fontSize: 13, color: "#64748B" }}>
                        {job.company} · {job.location || "Remote"}
                        {job.source && <span style={{ marginLeft: 8, fontSize: 11.5, color: "#94A3B8" }}>via {job.source}</span>}
                      </div>
                      {job.description && (
                        <div style={{
                          marginTop: 8, fontSize: 12.5, color: "#475569",
                          lineHeight: 1.6, display: "-webkit-box",
                          WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
                        }}>
                          {job.description}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", flexShrink: 0 }}>
                      {best && rc && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <ScoreRing score={best.score} size={44} color={rc.accent} />
                          <span style={{
                            background: rc.bg, color: rc.text, padding: "3px 10px",
                            borderRadius: 6, fontSize: 11.5, fontWeight: 600, whiteSpace: "nowrap",
                          }}>
                            {best.type}
                          </span>
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 8 }}>
                        {job.url && (
                          <a href={job.url} target="_blank" rel="noopener noreferrer"
                            style={{
                              padding: "6px 12px", borderRadius: 8,
                              border: "1.5px solid #E2E8F0", background: "#fff",
                              color: "#64748B", fontSize: 12, fontWeight: 600,
                              textDecoration: "none", fontFamily: "'DM Sans', sans-serif",
                            }}>
                            View
                          </a>
                        )}
                        <button
                          onClick={() => onAddToTracker(job.title, job.company, best?.type || "Consulting", `${job.title} ${job.description || ""}`)}
                          style={{
                            padding: "6px 12px", borderRadius: 8, border: "none",
                            background: rc?.accent || "#6366F1", color: "#fff",
                            fontWeight: 600, fontSize: 12, cursor: "pointer",
                            fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
                          }}>
                          + Track
                        </button>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}

      {!loading && results.length === 0 && !error && (
        <GlassCard style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
          <p style={{ color: "#64748B", fontSize: 14 }}>
            Search for internships above. Results are auto-scored against your resumes.
          </p>
          <p style={{ color: "#94A3B8", fontSize: 12, marginTop: 8 }}>
            Requires a free JSearch API key — see <code>.env.example</code> for setup.
          </p>
        </GlassCard>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function InternshipDashboard() {
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem("ip_session"));
  const [userName, setUserName] = useState(() => localStorage.getItem("ip_name") || "");

  const handleLogin = (name) => {
    sessionStorage.setItem("ip_session", "1");
    setUserName(name);
    setAuthed(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("ip_session");
    setAuthed(false);
  };

  if (!authed) return <LoginScreen onLogin={handleLogin} />;

  return <Dashboard userName={userName} onLogout={handleLogout} />;
}

function Dashboard({ userName, onLogout }) {
  const [tab, setTab] = useState("board");
  const [resumes, setResumes] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ip_resumes") || "{}"); } catch { return {}; }
  });
  const [jobText, setJobText] = useState("");
  const [matchResult, setMatchResult] = useState(null);
  const [applications, setApplications] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ip_applications") || "[]"); } catch { return []; }
  });
  const [coverLetter, setCoverLetter] = useState("");
  const [coverLoading, setCoverLoading] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const fileRef = useRef();

  // Persist to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem("ip_applications", JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    localStorage.setItem("ip_resumes", JSON.stringify(resumes));
  }, [resumes]);

  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeError, setResumeError] = useState("");

  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    setResumeError("");
    setResumeUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      let detected = "Consulting";
      let best = 0;
      for (const type of PRIORITY_ORDER) {
        const s = scoreMatch(text, type);
        if (s > best) { best = s; detected = type; }
      }
      setResumes((prev) => ({ ...prev, [detected]: { name: file.name, preview: text.substring(0, 300), text, detectedType: detected } }));
      setResumeUploading(false);
    };
    reader.onerror = () => { setResumeError("Failed to read file."); setResumeUploading(false); };
    reader.readAsText(file);
  };

  const handleMatch = () => {
    if (!jobText.trim()) return;
    setMatchResult(matchResume(jobText));
  };

  const saveApplication = useCallback((title, company, resumeType, text = jobText) => {
    setApplications((prev) => [{
      id: generateId(),
      title: title || "Untitled Role",
      company: company || "Unknown",
      resumeType,
      status: "To Apply",
      date: new Date().toLocaleDateString(),
      jobText: text,
    }, ...prev]);
    setTab("tracker");
  }, [jobText]);

  const generateCover = async (app) => {
    setCoverLoading(true);
    setCoverLetter("");
    setSelectedApp(app);
    setTab("cover");
    try {
      const resume = resumes[app.resumeType];
      const res = await fetch("/api/cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: app.title,
          company: app.company,
          resumeType: app.resumeType,
          resumeText: resume?.text || "",
          jobText: app.jobText || "",
        }),
      });
      const data = await res.json();
      setCoverLetter(data.letter || data.error || "Error generating letter.");
    } catch {
      setCoverLetter("Failed to generate cover letter. Check that ANTHROPIC_API_KEY is set in .env and the backend is running.");
    }
    setCoverLoading(false);
  };

  const tabs = [
    { id: "board",   label: "Job Board",    icon: "🔍" },
    { id: "match",   label: "Job Matcher",  icon: "🎯" },
    { id: "tracker", label: "Tracker",      icon: "📋" },
    { id: "resumes", label: "Resumes",      icon: "📄" },
    { id: "cover",   label: "Cover Letter", icon: "✉️" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 40%, #F0FDF4 100%)",
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
        padding: "28px 32px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <span style={{ fontSize: 28 }}>⚡</span>
            <h1 style={{
              margin: 0, color: "#F8FAFC",
              fontFamily: "'Space Mono', monospace", fontSize: 22, fontWeight: 700,
              letterSpacing: "-0.5px", flex: 1,
            }}>
              InternPilot
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: "#94A3B8", fontSize: 13 }}>👋 {userName}</span>
              <button onClick={onLogout} style={{
                padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)",
                background: "transparent", color: "#64748B", fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}>Sign out</button>
            </div>
          </div>
          <p style={{ margin: "4px 0 0 40px", color: "#94A3B8", fontSize: 13 }}>
            Consulting · Finance · Business Analyst — your path to impact
          </p>
          <div style={{ display: "flex", gap: 4, marginTop: 20, flexWrap: "wrap" }}>
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: "8px 18px", borderRadius: "10px 10px 0 0", border: "none",
                background: tab === t.id ? "rgba(255,255,255,0.12)" : "transparent",
                color: tab === t.id ? "#F8FAFC" : "#64748B",
                fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, fontWeight: 600,
                cursor: "pointer", transition: "all 0.2s",
                borderBottom: tab === t.id ? "2px solid #818CF8" : "2px solid transparent",
              }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 20px 60px" }}>

        {/* ═══ JOB BOARD ═══ */}
        {tab === "board" && (
          <JobBoardTab resumes={resumes} onAddToTracker={saveApplication} />
        )}

        {/* ═══ JOB MATCHER ═══ */}
        {tab === "match" && (
          <div>
            <GlassCard style={{ padding: 24, marginBottom: 20 }}>
              <h2 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 700, color: "#1E293B" }}>
                Paste a Job Description
              </h2>
              <p style={{ margin: "0 0 14px", fontSize: 13, color: "#64748B" }}>
                Score against your 3 resumes with Consulting → Finance → BA priority tiebreaker.
              </p>
              <textarea value={jobText} onChange={(e) => setJobText(e.target.value)}
                placeholder="Paste the full job description here…"
                style={{
                  width: "100%", minHeight: 160, padding: 14, borderRadius: 12, fontSize: 13.5,
                  border: "1.5px solid #E2E8F0", fontFamily: "'DM Sans', sans-serif",
                  background: "#FAFBFD", resize: "vertical", outline: "none", boxSizing: "border-box",
                }}
                onFocus={(e) => e.target.style.borderColor = "#818CF8"}
                onBlur={(e) => e.target.style.borderColor = "#E2E8F0"}
              />
              <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                <button onClick={handleMatch} style={{
                  padding: "10px 28px", borderRadius: 10, border: "none",
                  background: "linear-gradient(135deg, #6366F1, #818CF8)",
                  color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  boxShadow: "0 2px 12px rgba(99,102,241,0.3)",
                }}>
                  🎯 Match & Rank
                </button>
                <input type="text" id="jobTitle" placeholder="Job title (optional)" style={{
                  padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E2E8F0",
                  fontSize: 13.5, fontFamily: "'DM Sans', sans-serif", flex: "1 1 140px", outline: "none",
                }} />
                <input type="text" id="companyName" placeholder="Company (optional)" style={{
                  padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E2E8F0",
                  fontSize: 13.5, fontFamily: "'DM Sans', sans-serif", flex: "1 1 140px", outline: "none",
                }} />
              </div>
            </GlassCard>

            {matchResult && (
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1E293B", margin: "0 0 12px" }}>
                  Resume Match Rankings
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {matchResult.map((r, i) => {
                    const rc = RESUME_COLORS[r.type];
                    const isBest = i === 0;
                    return (
                      <GlassCard key={r.type} style={{
                        padding: "16px 20px", display: "flex", alignItems: "center", gap: 16,
                        border: isBest ? `2px solid ${rc.accent}` : "1px solid rgba(255,255,255,0.35)",
                        position: "relative", overflow: "hidden",
                      }}>
                        {isBest && (
                          <div style={{
                            position: "absolute", top: 0, right: 0,
                            background: rc.accent, color: "#fff", fontSize: 10, fontWeight: 700,
                            padding: "3px 12px 3px 14px", borderRadius: "0 14px 0 10px",
                          }}>
                            BEST MATCH
                          </div>
                        )}
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, background: rc.bg,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 15, fontWeight: 800, color: rc.text, flexShrink: 0,
                        }}>
                          {i + 1}
                        </div>
                        <ScoreRing score={r.score} color={rc.accent} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14.5, color: "#1E293B" }}>{r.type}</div>
                          <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                            {r.score >= 30 ? "Strong keyword match" : r.score >= 15 ? "Moderate match" : "Low match"} · Priority #{r.priority + 1}
                          </div>
                        </div>
                        {isBest && (
                          <button onClick={() => {
                            const title = document.getElementById("jobTitle")?.value || "";
                            const company = document.getElementById("companyName")?.value || "";
                            saveApplication(title, company, r.type);
                          }} style={{
                            padding: "7px 16px", borderRadius: 8, border: "none",
                            background: rc.accent, color: "#fff", fontWeight: 600,
                            fontSize: 12.5, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                          }}>
                            + Add to Tracker
                          </button>
                        )}
                      </GlassCard>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ TRACKER ═══ */}
        {tab === "tracker" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1E293B" }}>Application Tracker</h2>
              <div style={{ display: "flex", gap: 8, fontSize: 12, color: "#64748B", flexWrap: "wrap" }}>
                {STATUS_OPTIONS.map((s) => {
                  const count = applications.filter((a) => a.status === s).length;
                  const sc = STATUS_COLORS[s];
                  return count > 0 ? (
                    <span key={s} style={{
                      background: sc.bg, color: sc.text, padding: "3px 10px",
                      borderRadius: 6, fontWeight: 600, fontSize: 11.5,
                    }}>{s}: {count}</span>
                  ) : null;
                })}
              </div>
            </div>
            {applications.length === 0 ? (
              <GlassCard style={{ padding: 40, textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
                <p style={{ color: "#64748B", fontSize: 14 }}>No applications yet. Use Job Board or Matcher to add roles!</p>
              </GlassCard>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {applications.map((app) => {
                  const sc = STATUS_COLORS[app.status];
                  const rc = RESUME_COLORS[app.resumeType];
                  const updateApp = (fields) =>
                    setApplications((prev) => prev.map((a) => a.id === app.id ? { ...a, ...fields } : a));
                  return (
                    <GlassCard key={app.id} style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                        {/* Title + editable company + link */}
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <div style={{ fontWeight: 700, fontSize: 14.5, color: "#1E293B" }}>{app.title}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                            <input
                              value={app.company}
                              onChange={(e) => updateApp({ company: e.target.value })}
                              style={{
                                fontSize: 12.5, color: "#64748B", border: "none", outline: "none",
                                background: "transparent", fontFamily: "'DM Sans', sans-serif",
                                borderBottom: "1px dashed #CBD5E1", minWidth: 60, maxWidth: 180,
                                padding: "0 2px",
                              }}
                              onFocus={(e) => e.target.style.borderBottomColor = "#818CF8"}
                              onBlur={(e) => e.target.style.borderBottomColor = "#CBD5E1"}
                            />
                            <span style={{ color: "#CBD5E1", fontSize: 12 }}>·</span>
                            <span style={{ fontSize: 12, color: "#94A3B8" }}>Added {app.date}</span>
                          </div>
                          {/* Application URL */}
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
                            <span style={{ fontSize: 11, color: "#94A3B8" }}>🔗</span>
                            <input
                              value={app.url || ""}
                              onChange={(e) => updateApp({ url: e.target.value })}
                              placeholder="Paste application link…"
                              style={{
                                fontSize: 12, color: "#6366F1", border: "none", outline: "none",
                                background: "transparent", fontFamily: "'DM Sans', sans-serif",
                                borderBottom: "1px dashed #E2E8F0", flex: 1, minWidth: 0,
                                padding: "0 2px",
                              }}
                              onFocus={(e) => e.target.style.borderBottomColor = "#818CF8"}
                              onBlur={(e) => e.target.style.borderBottomColor = "#E2E8F0"}
                            />
                            {app.url && (
                              <a href={app.url} target="_blank" rel="noopener noreferrer" style={{
                                fontSize: 11, color: "#6366F1", fontWeight: 600,
                                textDecoration: "none", whiteSpace: "nowrap",
                              }}>Open ↗</a>
                            )}
                          </div>
                        </div>

                        <span style={{
                          background: rc.bg, color: rc.text, padding: "3px 10px",
                          borderRadius: 6, fontSize: 11.5, fontWeight: 600, flexShrink: 0,
                        }}>{app.resumeType}</span>
                        <select value={app.status} onChange={(e) => updateApp({ status: e.target.value })}
                          style={{
                            padding: "5px 10px", borderRadius: 8,
                            border: `1.5px solid ${sc.dot}`,
                            background: sc.bg, color: sc.text,
                            fontWeight: 600, fontSize: 12, fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
                          }}>
                          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button onClick={() => generateCover(app)} style={{
                          padding: "6px 14px", borderRadius: 8, border: "1.5px solid #E2E8F0",
                          background: "#fff", color: "#6366F1", fontWeight: 600,
                          fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                        }}>✉️ Cover Letter</button>
                        <button onClick={() => setApplications((prev) => prev.filter((a) => a.id !== app.id))}
                          style={{
                            padding: "6px 10px", borderRadius: 8, border: "none",
                            background: "transparent", color: "#CBD5E1", fontSize: 16, cursor: "pointer",
                          }}>×</button>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ RESUMES ═══ */}
        {tab === "resumes" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1E293B" }}>Your Resumes</h2>
              <button onClick={() => fileRef.current?.click()} disabled={resumeUploading} style={{
                padding: "8px 20px", borderRadius: 10, border: "none",
                background: resumeUploading ? "#CBD5E1" : "linear-gradient(135deg, #6366F1, #818CF8)",
                color: "#fff", fontWeight: 700, fontSize: 13,
                cursor: resumeUploading ? "default" : "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {resumeUploading ? "Reading…" : "+ Upload .txt"}
              </button>
              <input type="file" ref={fileRef} accept=".txt,text/plain" onChange={handleResumeUpload} style={{ display: "none" }} />
            </div>
            <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 16px" }}>
              Upload your 3 resumes as <strong>.txt</strong> files. Copy your resume text into Notepad and save as .txt.
            </p>
            {resumeError && (
              <div style={{
                marginBottom: 14, padding: "10px 14px", borderRadius: 10,
                background: "#FEF2F2", color: "#B91C1C", fontSize: 13,
              }}>
                {resumeError}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {PRIORITY_ORDER.map((type, idx) => {
                const rc = RESUME_COLORS[type];
                const resume = resumes[type];
                return (
                  <GlassCard key={type} style={{ padding: "18px 22px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, background: rc.bg,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16, fontWeight: 800, color: rc.text, flexShrink: 0,
                      }}>#{idx + 1}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14.5, color: "#1E293B" }}>{type}</div>
                        <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 2 }}>
                          Priority #{idx + 1}{resume ? ` · ${resume.name}` : " · Not uploaded"}
                        </div>
                      </div>
                      <span style={{
                        padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                        background: resume ? "#ECFDF5" : "#FEF2F2",
                        color: resume ? "#047857" : "#B91C1C",
                      }}>{resume ? "✓ Ready" : "Missing"}</span>
                    </div>
                    {resume && (
                      <div style={{
                        marginTop: 12, padding: 12, borderRadius: 10, background: "#F8FAFC",
                        fontSize: 12, color: "#64748B", maxHeight: 80, overflow: "hidden", lineHeight: 1.6,
                      }}>
                        {(resume.preview || resume.text || "").substring(0, 300)}…
                      </div>
                    )}
                  </GlassCard>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ COVER LETTER ═══ */}
        {tab === "cover" && (
          <div>
            <h2 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 700, color: "#1E293B" }}>
              AI Cover Letter Generator
            </h2>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748B" }}>
              Click "Cover Letter" on any tracked application, or pick one below.
            </p>
            {applications.length > 0 && !coverLetter && !coverLoading && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {applications.map((app) => (
                  <GlassCard key={app.id} onClick={() => generateCover(app)}
                    style={{ padding: "14px 18px", cursor: "pointer" }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#1E293B" }}>
                      {app.title} @ {app.company}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                      {app.resumeType} · Click to generate
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
            {coverLoading && (
              <GlassCard style={{ padding: 40, textAlign: "center" }}>
                <div style={{
                  width: 36, height: 36, border: "3px solid #E2E8F0",
                  borderTopColor: "#6366F1", borderRadius: "50%",
                  margin: "0 auto 14px", animation: "spin 0.8s linear infinite",
                }} />
                <p style={{ color: "#64748B", fontSize: 14 }}>Crafting your cover letter with AI…</p>
              </GlassCard>
            )}
            {coverLetter && !coverLoading && (
              <GlassCard style={{ padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 14, color: "#1E293B" }}>{selectedApp?.title}</span>
                    <span style={{ color: "#94A3B8", fontSize: 13 }}> @ {selectedApp?.company}</span>
                  </div>
                  <button onClick={() => navigator.clipboard?.writeText(coverLetter)} style={{
                    padding: "6px 14px", borderRadius: 8, border: "1.5px solid #E2E8F0",
                    background: "#fff", color: "#6366F1", fontWeight: 600,
                    fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  }}>📋 Copy</button>
                </div>
                <div style={{
                  whiteSpace: "pre-wrap", fontSize: 13.5, lineHeight: 1.75,
                  color: "#334155", fontFamily: "'DM Sans', sans-serif",
                }}>
                  {coverLetter}
                </div>
              </GlassCard>
            )}
            {applications.length === 0 && !coverLetter && (
              <GlassCard style={{ padding: 40, textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>✉️</div>
                <p style={{ color: "#64748B", fontSize: 14 }}>
                  Add applications from the Job Board or Matcher first.
                </p>
              </GlassCard>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
