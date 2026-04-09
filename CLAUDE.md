# InternPilot — Project Context

## About Me
- Future entrepreneur — internships are a stepping stone to building my own company
- Not driven by money, driven by desire to change the world for the better and help people
- Want to build something profitable so I can make a larger impact
- Prefer careers that are open-minded, conversation-driven, and action-oriented

## Career Tracks (Priority Order)
1. **Consulting** — Systems thinking, problem diagnosis through dialogue, exposure to how businesses operate. Most aligned with founder path and conversation-driven culture.
2. **Finance** — Understanding capital allocation, impact investing, ESG, sustainable finance. Critical for scaling impact-driven ventures.
3. **Business Analyst** — Operational empathy, stakeholder interviews, user-centered problem solving. Teaches how organizations actually work from the inside.

## What the Dashboard Does
- **Job Matcher**: Paste job descriptions → auto-scores against 3 resume types using keyword matching → recommends best resume, with priority tiebreaker (within 8% score difference, higher-priority track wins)
- **Application Tracker**: Track status (To Apply → Applied → Interview → Offer → Rejected)
- **Resume Manager**: Upload 3 resumes (.txt), auto-detects which track each belongs to
- **AI Cover Letter Generator**: Uses Claude API to generate tailored cover letters per application

## What Needs to Be Built Next
- **Job board scraping/API integration** (LinkedIn, Handshake, Indeed, Glassdoor)
- **Auto-matching** — automatically run new postings through the matcher without manual paste
- **Notifications** — alert when high-match roles appear
- **Auto-apply pipeline** — pre-fill applications where possible
- **Better resume parsing** — support PDF/DOCX, extract skills/experience programmatically
- **Database** — persist applications, resumes, and cover letters across sessions
- **Authentication** — user login for multi-device access

## Tech Stack
- React (started as single-file JSX artifact)
- Claude API for cover letter generation (claude-sonnet-4-20250514)
- Tailwind-compatible styling (DM Sans + Space Mono fonts, glassmorphism cards)

## Design Preferences
- Clean, modern glassmorphism aesthetic
- Color coding: Consulting (#6366F1 indigo), Finance (#F59E0B amber), BA (#3B82F6 blue)
- Status colors: To Apply (orange), Applied (blue), Interview (purple), Offer (green), Rejected (red)
