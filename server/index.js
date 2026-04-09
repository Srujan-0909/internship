import "dotenv/config";
import express from "express";
import cors from "cors";

import coverRouter from "./routes/cover.js";
import jobsRouter from "./routes/jobs.js";
import applicationsRouter from "./routes/applications.js";
import resumesRouter from "./routes/resumes.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.use("/api/cover", coverRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/applications", applicationsRouter);
app.use("/api/resumes", resumesRouter);

app.get("/api/health", (_, res) => res.json({ ok: true, ts: Date.now() }));

app.listen(PORT, () => {
  console.log(`\n  ⚡ InternPilot API  →  http://localhost:${PORT}/api/health`);
  console.log(`  JSearch key:       ${process.env.JSEARCH_API_KEY ? "✓ set" : "✗ missing (add to .env)"}`);
  console.log(`  Anthropic key:     ${process.env.ANTHROPIC_API_KEY ? "✓ set" : "✗ missing (add to .env)"}\n`);
});
