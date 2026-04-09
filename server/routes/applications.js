import { Router } from "express";
import db from "../db.js";

const router = Router();

// GET /api/applications — list all
router.get("/", (req, res) => {
  const rows = db.prepare(`
    SELECT id, title, company, resume_type as resumeType, status, date, url, source
    FROM applications ORDER BY created_at DESC
  `).all();
  res.json(rows);
});

// POST /api/applications — create
router.post("/", (req, res) => {
  const { id, title, company, resumeType, status, date, jobText, url, source } = req.body;
  db.prepare(`
    INSERT INTO applications (id, title, company, resume_type, status, date, job_text, url, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, company, resumeType, status || "To Apply", date, jobText || "", url || "", source || "");
  res.json({ ok: true });
});

// PATCH /api/applications/:id — update status
router.patch("/:id", (req, res) => {
  const { status } = req.body;
  db.prepare("UPDATE applications SET status = ? WHERE id = ?").run(status, req.params.id);
  res.json({ ok: true });
});

// DELETE /api/applications/:id
router.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM applications WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

export default router;
