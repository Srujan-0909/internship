import { useState, useEffect, useRef, useCallback } from "react";

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
    "facilitation", "stakeholder", "cross-functional", "problem-solving"
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
    "loan", "interest rate", "bond", "stock", "derivatives"
  ],
  "Business Analyst": [
    "business analyst", "business analysis", "requirements gathering", "stakeholder",
    "process improvement", "BRD", "user stories", "agile", "scrum", "jira",
    "business requirements", "gap analysis", "workflow", "use case", "UAT",
    "functional requirements", "business process", "BA ", "business intelligence",
    "project management", "product owner", "backlog", "sprint", "KPI",
    "dashboard", "reporting", "excel", "powerpoint", "visio", "wireframe",
    "data-driven", "operations", "strategy", "optimization", "metrics"
  ]
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
  "To Apply": { bg: "#FFF7ED", text: "#C2410C", dot: "#EA580C" },
  "Applied": { bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6" },
  "Interview": { bg: "#F5F3FF", text: "#6D28D9", dot: "#8B5CF6" },
  "Offer": { bg: "#ECFDF5", text: "#047857", dot: "#10B981" },
  "Rejected": { bg: "#FEF2F2", text: "#B91C1C", dot: "#EF4444" },
};

const RESUME_COLORS = {
  "Consulting": { bg: "#E0E7FF", text: "#3730A3", accent: "#6366F1" },
  "Finance": { bg: "#FEF3C7", text: "#92400E", accent: "#F59E0B" },
  "Business Analyst": { bg: "#DBEAFE", text: "#1E40AF", accent: "#3B82F6" },
};

const generateId = () => Math.random().toString(36).substring(2, 10);

// ─── Glassmorphism card component ───
function GlassCard({ children, style, className, onClick }) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.35)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Animated score ring ───
function ScoreRing({ score, size = 52, color }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width={size} height={size} style={{ display: "block" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="rgba(0,0,0,0.06)" strokeWidth={4} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={4} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)" }} />
      <text x={size / 2} y={size / 2 + 1} textAnchor="middle"
        dominantBaseline="middle"
        style={{ fontSize: 13, fontWeight: 700, fill: color, fontFamily: "'DM Sans', sans-serif" }}>
        {score}
      </text>
    </svg>
  );
}

// ─── Main App ───
export default function InternshipDashboard() {
  const [tab, setTab] = useState("match");
  const [resumes, setResumes] = useState({});
  const [jobText, setJobText] = useState("");
  const [matchResult, setMatchResult] = useState(null);
  const [applications, setApplications] = useState([]);
  const [coverLetter, setCoverLetter] = useState("");
  const [coverLoading, setCoverLoading] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const fileRef = useRef();

  // Resume upload handler
  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      // Detect type
      let detected = "Consulting";
      let best = 0;
      for (const type of PRIORITY_ORDER) {
        const s = scoreMatch(text, type);
        if (s > best) { best = s; detected = type; }
      }
      setResumes((prev) => ({
        ...prev,
        [detected]: { name: file.name, text, detectedType: detected },
      }));
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Match job
  const handleMatch = () => {
    if (!jobText.trim()) return;
    const scores = matchResume(jobText);
    setMatchResult(scores);
  };

  // Save application
  const saveApplication = (title, company, resumeType) => {
    const app = {
      id: generateId(),
      title: title || "Untitled Role",
      company: company || "Unknown",
      resumeType,
      status: "To Apply",
      date: new Date().toLocaleDateString(),
      jobText,
    };
    setApplications((prev) => [app, ...prev]);
    setTab("tracker");
  };

  // Generate cover letter
  const generateCover = async (app) => {
    setCoverLoading(true);
    setCoverLetter("");
    setSelectedApp(app);
    try {
      const resume = resumes[app.resumeType];
      const prompt = `You are a career advisor. Write a concise, compelling cover letter for an internship application.
Role: ${app.title} at ${app.company}
Resume type: ${app.resumeType}
${resume ? `Resume content summary: ${resume.text.substring(0, 1500)}` : "No resume uploaded yet."}
Job description: ${app.jobText?.substring(0, 2000) || "Not provided"}

Write a professional 3-paragraph cover letter. Be specific and avoid generic phrases. Output ONLY the letter text, no extra commentary.`;

      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await resp.json();
      const text = data.content?.map((b) => b.text || "").join("\n") || "Error generating letter.";
      setCoverLetter(text);
    } catch {
      setCoverLetter("Failed to generate cover letter. Please try again.");
    }
    setCoverLoading(false);
  };

  // ─── TABS ───
  const tabs = [
    { id: "match", label: "Job Matcher", icon: "🎯" },
    { id: "tracker", label: "Tracker", icon: "📋" },
    { id: "resumes", label: "Resumes", icon: "📄" },
    { id: "cover", label: "Cover Letter", icon: "✉️" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 40%, #F0FDF4 100%)",
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      padding: "0",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@700&display=swap" rel="stylesheet" />

      {/* ─── Header ─── */}
      <div style={{
        background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
        padding: "28px 32px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <span style={{ fontSize: 28 }}>⚡</span>
            <h1 style={{
              margin: 0, color: "#F8FAFC",
              fontFamily: "'Space Mono', monospace", fontSize: 22, fontWeight: 700,
              letterSpacing: "-0.5px",
            }}>
              InternPilot
            </h1>
          </div>
          <p style={{ margin: "4px 0 0 40px", color: "#94A3B8", fontSize: 13, letterSpacing: "0.3px" }}>
            Consulting · Finance · Business Analyst — your path to impact
          </p>

          {/* Tab bar */}
          <div style={{ display: "flex", gap: 4, marginTop: 20 }}>
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{
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

      {/* ─── Content ─── */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px 60px" }}>

        {/* ═══════════ JOB MATCHER TAB ═══════════ */}
        {tab === "match" && (
          <div>
            <GlassCard style={{ padding: 24, marginBottom: 20 }}>
              <h2 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 700, color: "#1E293B" }}>
                Paste a Job Description
              </h2>
              <p style={{ margin: "0 0 14px", fontSize: 13, color: "#64748B" }}>
                We'll score it against your 3 resumes and recommend the best match, respecting your Consulting → Finance → BA priority.
              </p>
              <textarea value={jobText} onChange={(e) => setJobText(e.target.value)}
                placeholder="Paste the full job description here…"
                style={{
                  width: "100%", minHeight: 160, padding: 14, borderRadius: 12, fontSize: 13.5,
                  border: "1.5px solid #E2E8F0", fontFamily: "'DM Sans', sans-serif",
                  background: "#FAFBFD", resize: "vertical", outline: "none",
                  transition: "border 0.2s", boxSizing: "border-box",
                }}
                onFocus={(e) => e.target.style.borderColor = "#818CF8"}
                onBlur={(e) => e.target.style.borderColor = "#E2E8F0"}
              />
              <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                <button onClick={handleMatch}
                  style={{
                    padding: "10px 28px", borderRadius: 10, border: "none",
                    background: "linear-gradient(135deg, #6366F1, #818CF8)",
                    color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    boxShadow: "0 2px 12px rgba(99,102,241,0.3)",
                    transition: "transform 0.15s, box-shadow 0.15s",
                  }}
                  onMouseDown={(e) => e.target.style.transform = "scale(0.97)"}
                  onMouseUp={(e) => e.target.style.transform = "scale(1)"}
                >
                  🎯 Match & Rank
                </button>
                <input type="text" id="jobTitle" placeholder="Job title (optional)"
                  style={{
                    padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E2E8F0",
                    fontSize: 13.5, fontFamily: "'DM Sans', sans-serif", flex: "1 1 140px",
                    minWidth: 120, outline: "none",
                  }} />
                <input type="text" id="companyName" placeholder="Company (optional)"
                  style={{
                    padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E2E8F0",
                    fontSize: 13.5, fontFamily: "'DM Sans', sans-serif", flex: "1 1 140px",
                    minWidth: 120, outline: "none",
                  }} />
              </div>
            </GlassCard>

            {/* Match Results */}
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
                            letterSpacing: "0.5px",
                          }}>
                            BEST MATCH
                          </div>
                        )}
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: rc.bg, display: "flex", alignItems: "center", justifyContent: "center",
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
                          }}
                            style={{
                              padding: "7px 16px", borderRadius: 8, border: "none",
                              background: rc.accent, color: "#fff", fontWeight: 600,
                              fontSize: 12.5, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                              whiteSpace: "nowrap",
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

        {/* ═══════════ TRACKER TAB ═══════════ */}
        {tab === "tracker" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1E293B" }}>
                Application Tracker
              </h2>
              <div style={{ display: "flex", gap: 8, fontSize: 12, color: "#64748B" }}>
                {STATUS_OPTIONS.map((s) => {
                  const count = applications.filter((a) => a.status === s).length;
                  const sc = STATUS_COLORS[s];
                  return count > 0 ? (
                    <span key={s} style={{
                      background: sc.bg, color: sc.text, padding: "3px 10px",
                      borderRadius: 6, fontWeight: 600, fontSize: 11.5,
                    }}>
                      {s}: {count}
                    </span>
                  ) : null;
                })}
              </div>
            </div>

            {applications.length === 0 ? (
              <GlassCard style={{ padding: 40, textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
                <p style={{ color: "#64748B", fontSize: 14, margin: 0 }}>
                  No applications yet. Use the Job Matcher to add roles!
                </p>
              </GlassCard>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {applications.map((app) => {
                  const sc = STATUS_COLORS[app.status];
                  const rc = RESUME_COLORS[app.resumeType];
                  return (
                    <GlassCard key={app.id} style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 180 }}>
                          <div style={{ fontWeight: 700, fontSize: 14.5, color: "#1E293B" }}>
                            {app.title}
                          </div>
                          <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 2 }}>
                            {app.company} · Added {app.date}
                          </div>
                        </div>
                        <span style={{
                          background: rc.bg, color: rc.text, padding: "3px 10px",
                          borderRadius: 6, fontSize: 11.5, fontWeight: 600,
                        }}>
                          {app.resumeType}
                        </span>
                        <select value={app.status}
                          onChange={(e) => {
                            setApplications((prev) =>
                              prev.map((a) => a.id === app.id ? { ...a, status: e.target.value } : a)
                            );
                          }}
                          style={{
                            padding: "5px 10px", borderRadius: 8,
                            border: `1.5px solid ${sc.dot}`,
                            background: sc.bg, color: sc.text,
                            fontWeight: 600, fontSize: 12, fontFamily: "'DM Sans', sans-serif",
                            cursor: "pointer",
                          }}>
                          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button onClick={() => generateCover(app)}
                          style={{
                            padding: "6px 14px", borderRadius: 8, border: "1.5px solid #E2E8F0",
                            background: "#fff", color: "#6366F1", fontWeight: 600,
                            fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                          }}>
                          ✉️ Cover Letter
                        </button>
                        <button onClick={() => setApplications((prev) => prev.filter((a) => a.id !== app.id))}
                          style={{
                            padding: "6px 10px", borderRadius: 8, border: "none",
                            background: "transparent", color: "#CBD5E1", fontSize: 16,
                            cursor: "pointer", lineHeight: 1,
                          }}>
                          ×
                        </button>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════ RESUMES TAB ═══════════ */}
        {tab === "resumes" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1E293B" }}>
                Your Resumes
              </h2>
              <button onClick={() => fileRef.current?.click()}
                style={{
                  padding: "8px 20px", borderRadius: 10, border: "none",
                  background: "linear-gradient(135deg, #6366F1, #818CF8)",
                  color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                + Upload Resume
              </button>
              <input type="file" ref={fileRef} accept=".txt,.pdf,.doc,.docx"
                onChange={handleResumeUpload} style={{ display: "none" }} />
            </div>
            <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 16px" }}>
              Upload your 3 resumes as .txt files. The system auto-detects which type each resume is.
              You can also manually assign them.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {PRIORITY_ORDER.map((type, idx) => {
                const rc = RESUME_COLORS[type];
                const resume = resumes[type];
                return (
                  <GlassCard key={type} style={{ padding: "18px 22px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: rc.bg, display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16, fontWeight: 800, color: rc.text, flexShrink: 0,
                      }}>
                        #{idx + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14.5, color: "#1E293B" }}>
                          {type}
                        </div>
                        <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 2 }}>
                          Priority #{idx + 1}
                          {resume ? ` · ${resume.name}` : " · Not uploaded"}
                        </div>
                      </div>
                      <span style={{
                        padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                        background: resume ? "#ECFDF5" : "#FEF2F2",
                        color: resume ? "#047857" : "#B91C1C",
                      }}>
                        {resume ? "✓ Ready" : "Missing"}
                      </span>
                    </div>
                    {resume && (
                      <div style={{
                        marginTop: 12, padding: 12, borderRadius: 10,
                        background: "#F8FAFC", fontSize: 12, color: "#64748B",
                        maxHeight: 80, overflow: "hidden", lineHeight: 1.6,
                      }}>
                        {resume.text.substring(0, 300)}…
                      </div>
                    )}
                  </GlassCard>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════ COVER LETTER TAB ═══════════ */}
        {tab === "cover" && (
          <div>
            <h2 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 700, color: "#1E293B" }}>
              AI Cover Letter Generator
            </h2>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748B" }}>
              Click "Cover Letter" on any tracked application, or select one below.
            </p>

            {applications.length > 0 && !coverLetter && !coverLoading && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {applications.map((app) => (
                  <GlassCard key={app.id} onClick={() => generateCover(app)}
                    style={{ padding: "14px 18px", cursor: "pointer", transition: "transform 0.15s" }}>
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
                  margin: "0 auto 14px",
                  animation: "spin 0.8s linear infinite",
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <p style={{ color: "#64748B", fontSize: 14, margin: 0 }}>
                  Crafting your cover letter with AI…
                </p>
              </GlassCard>
            )}

            {coverLetter && !coverLoading && (
              <GlassCard style={{ padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 14, color: "#1E293B" }}>
                      {selectedApp?.title}
                    </span>
                    <span style={{ color: "#94A3B8", fontSize: 13 }}> @ {selectedApp?.company}</span>
                  </div>
                  <button onClick={() => navigator.clipboard?.writeText(coverLetter)}
                    style={{
                      padding: "6px 14px", borderRadius: 8, border: "1.5px solid #E2E8F0",
                      background: "#fff", color: "#6366F1", fontWeight: 600,
                      fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                    }}>
                    📋 Copy
                  </button>
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
                <p style={{ color: "#64748B", fontSize: 14, margin: 0 }}>
                  Add applications from the Job Matcher first, then generate cover letters here.
                </p>
              </GlassCard>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
