import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();

router.post("/", async (req, res) => {
  const { title, company, resumeType, resumeText, jobText } = req.body;

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not set in .env" });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `You are a career advisor. Write a concise, compelling cover letter for an internship application.
Role: ${title} at ${company}
Resume type: ${resumeType}
${resumeText ? `Resume content summary:\n${resumeText.substring(0, 1500)}` : "No resume uploaded yet."}
Job description:\n${jobText?.substring(0, 2000) || "Not provided"}

Write a professional 3-paragraph cover letter. Be specific and avoid generic phrases. Output ONLY the letter text, no extra commentary.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const letter = message.content.map((b) => b.text || "").join("\n");
    res.json({ letter });
  } catch (err) {
    console.error("Cover letter generation error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
