# Maintenance and Migration Scripts

This folder contains various one-off scripts and utility functions for maintenance, database migrations, and cron job debugging.

## Available Scripts

- `checkGeminiJobs.js`: Tests the Gemini integration.
- `cleanupDummies.js`: Cleans up dummy jobs or resumes created during testing.
- `fixLogos.js`: Script to address 403 Forbidden cross-origin logo errors.
- `forceFetch.js`: Forces the job scraper to fetch jobs immediately.
- `migrateExperience.js`: Migrates job experience levels in the database.
- `refreshGemini.js`: Refreshes or clears the Gemini scraper caches.
- `scrapeInternet.js`: A manual trigger for the external job scraping process.
- `seedSkills.js`: Seeds the master list of skills into the database.

**Note:** Always ensure your `.env` variables are properly set before running these scripts manually.
