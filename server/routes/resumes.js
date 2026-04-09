import { Router } from "express";
import multer from "multer";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import db from "../db.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const PRIORITY_ORDER = ["Consulting", "Finance", "Business Analyst"];
const KEYWORDS = {
  "Consulting": [
    "consulting", "consultant", "management consulting", "strategy", "advisory",
    "client-facing", "engagement", "deliverable", "stakeholder management",
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

function detectTrack(text) {
  const lower = text.toLowerCase();
  let best = { track: "Consulting", score: 0 };
  for (const track of PRIORITY_ORDER) {
    const hits = KEYWORDS[track].filter((kw) => lower.includes(kw.toLowerCase())).length;
    if (hits > best.score) best = { track, score: hits };
  }
  return best.track;
}

// POST /api/resumes/upload  (multipart, field name: "resume")
router.post("/upload", upload.single("resume"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const { originalname, mimetype, buffer } = req.file;

  if (mimetype !== "application/pdf" && !originalname.toLowerCase().endsWith(".pdf")) {
    return res.status(400).json({ error: "Only PDF files are supported" });
  }

  let text;
  try {
    const parsed = await pdfParse(buffer);
    text = parsed.text;
    if (!text?.trim()) return res.status(422).json({ error: "Could not extract text from PDF. Is it a scanned image?" });
  } catch (err) {
    console.error("PDF parse error:", err.message);
    return res.status(422).json({ error: "Failed to parse PDF: " + err.message });
  }

  const track = detectTrack(text);

  // Persist to SQLite
  db.prepare(`
    INSERT INTO resumes (track, name, content, updated_at)
    VALUES (?, ?, ?, unixepoch())
    ON CONFLICT(track) DO UPDATE SET name=excluded.name, content=excluded.content, updated_at=unixepoch()
  `).run(track, originalname, text);

  res.json({ track, name: originalname, preview: text.substring(0, 300) });
});

// GET /api/resumes  — return all stored resumes (without full text)
router.get("/", (req, res) => {
  const rows = db.prepare("SELECT track, name, substr(content,1,300) as preview FROM resumes").all();
  res.json(rows);
});

// DELETE /api/resumes/:track
router.delete("/:track", (req, res) => {
  db.prepare("DELETE FROM resumes WHERE track = ?").run(req.params.track);
  res.json({ ok: true });
});

export default router;
