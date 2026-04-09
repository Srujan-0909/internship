import { Router } from "express";

const router = Router();

const JSEARCH_BASE = "https://jsearch.p.rapidapi.com";

/**
 * GET /api/jobs/search
 * Query params: query, location, num_pages (default 1)
 *
 * JSearch aggregates LinkedIn, Indeed, Glassdoor, Ziprecruiter & more.
 * Free tier: 200 requests/month. Sign up at rapidapi.com → search "JSearch by letscrape".
 */
router.get("/search", async (req, res) => {
  const apiKey = process.env.JSEARCH_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Missing JSEARCH_API_KEY" });
  }

  const { query = "internship", location = "", num_pages = "2" } = req.query;

  const searchQuery = location
    ? `${query} in ${location}`
    : query;

  try {
    const url = new URL(`${JSEARCH_BASE}/search`);
    url.searchParams.set("query", searchQuery);
    url.searchParams.set("num_pages", num_pages);
    url.searchParams.set("date_posted", "all");
    url.searchParams.set("employment_types", "INTERN");

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("JSearch error:", response.status, text);
      return res.status(response.status).json({
        error: `JSearch API error ${response.status}: ${text.substring(0, 200)}`,
      });
    }

    const data = await response.json();

    // Normalize to a clean shape
    const jobs = (data.data || []).map((job) => ({
      id: job.job_id,
      title: job.job_title,
      company: job.employer_name,
      location: [job.job_city, job.job_state, job.job_country]
        .filter(Boolean).join(", ") || (job.job_is_remote ? "Remote" : ""),
      description: job.job_description?.substring(0, 1000) || "",
      url: job.job_apply_link || job.job_google_link,
      employer_logo: job.employer_logo,
      source: job.job_publisher,
      posted_at: job.job_posted_at_datetime_utc,
      employment_type: job.job_employment_type,
    }));

    res.json({ jobs, total: data.status === "OK" ? jobs.length : 0 });
  } catch (err) {
    console.error("Job search error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/jobs/details?job_id=xxx
 * Fetches full job details (complete description, salary, etc.)
 */
router.get("/details", async (req, res) => {
  const apiKey = process.env.JSEARCH_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Missing JSEARCH_API_KEY" });

  const { job_id } = req.query;
  if (!job_id) return res.status(400).json({ error: "job_id required" });

  try {
    const url = new URL(`${JSEARCH_BASE}/job-details`);
    url.searchParams.set("job_id", job_id);

    const response = await fetch(url.toString(), {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
      },
    });

    const data = await response.json();
    const job = data.data?.[0];
    if (!job) return res.status(404).json({ error: "Job not found" });

    res.json({
      id: job.job_id,
      title: job.job_title,
      company: job.employer_name,
      description: job.job_description,
      url: job.job_apply_link,
      salary_min: job.job_min_salary,
      salary_max: job.job_max_salary,
      salary_currency: job.job_salary_currency,
      salary_period: job.job_salary_period,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
