import axios from "axios";
import logger from "../utils/logger.js";

const HN_API_BASE = "https://hacker-news.firebaseio.com/v0";
const JOB_STORIES_URL = `${HN_API_BASE}/jobstories.json`;
const ITEM_URL = `${HN_API_BASE}/item`;

export async function scrapeHackerNewsJobs() {
  try {
    logger.info("Starting to scrape Hacker News jobs");

    // Fetch job story IDs
    const response = await axios.get(JOB_STORIES_URL);
    const jobIds = response.data;

    // Fetch details for each job
    const jobPromises = jobIds.map(fetchJobDetails);
    const jobs = await Promise.all(jobPromises);

    // Format jobs
    const formattedJobs = jobs.map(formatJob);

    logger.info(`Found ${formattedJobs.length} Hacker News jobs`);
    return formattedJobs;
  } catch (error) {
    logger.error(`Error scraping Hacker News jobs: ${error.message}`);
    throw error;
  }
}

async function fetchJobDetails(id) {
  try {
    const response = await axios.get(`${ITEM_URL}/${id}.json`);
    return response.data;
  } catch (error) {
    logger.error(`Error fetching job ${id}: ${error.message}`);
    return null;
  }
}

function formatJob(job) {
  if (!job) return null;

  return {
    title: job.title,
    company: "Hacker News Job Posting",
    url: job.url || `https://news.ycombinator.com/item?id=${job.id}`,
    description: job.text || "",
    createdDate: new Date(job.time * 1000).toISOString(),
    modifiedDate: new Date(job.time * 1000).toISOString(),
    jobCode: job.id.toString(),
  };
}
