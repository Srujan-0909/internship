import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://poiyfwmdrmtggwhozfqr.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvaXlmd21kcm10Z2d3aG96ZnFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NTg0NjQsImV4cCI6MjA5MTMzNDQ2NH0.ONXRb8EaXhFvokwR91bd-jwt9DOlZvUH0u0jdmDcIPo";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Applications ─────────────────────────────────────────────────────────────

export async function fetchApplications(userId) {
  const { data, error } = await supabase
    .from("applications")
    .select("id, title, company, resume_type, status, date, job_text, url, source")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((r) => ({
    ...r,
    resumeType: r.resume_type,
    jobText: r.job_text,
  }));
}

export async function insertApplication(userId, app) {
  const { error } = await supabase.from("applications").insert({
    id: app.id,
    user_id: userId,
    title: app.title,
    company: app.company,
    resume_type: app.resumeType,
    status: app.status,
    date: app.date,
    job_text: app.jobText || "",
    url: app.url || "",
    source: app.source || "",
  });
  if (error) throw error;
}

export async function updateApplication(id, fields) {
  const mapped = {};
  if (fields.status !== undefined) mapped.status = fields.status;
  if (fields.company !== undefined) mapped.company = fields.company;
  if (fields.title !== undefined) mapped.title = fields.title;
  if (fields.url !== undefined) mapped.url = fields.url;
  const { error } = await supabase.from("applications").update(mapped).eq("id", id);
  if (error) throw error;
}

export async function deleteApplication(id) {
  const { error } = await supabase.from("applications").delete().eq("id", id);
  if (error) throw error;
}

// ─── Resumes ──────────────────────────────────────────────────────────────────

export async function fetchResumes(userId) {
  const { data, error } = await supabase
    .from("resumes")
    .select("track, name, content, preview")
    .eq("user_id", userId);
  if (error) throw error;
  const map = {};
  for (const r of data || []) {
    map[r.track] = { name: r.name, text: r.content, preview: r.preview, detectedType: r.track };
  }
  return map;
}

export async function upsertResume(userId, track, name, content, preview) {
  const { error } = await supabase.from("resumes").upsert({
    track,
    user_id: userId,
    name,
    content,
    preview: preview || content.substring(0, 300),
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}