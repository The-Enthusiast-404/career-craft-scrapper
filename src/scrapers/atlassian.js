import logger from "../utils/logger.js";
import puppeteer from "puppeteer";

const ATLASSIAN_JOBS_URL = "https://www.atlassian.com/company/careers/all-jobs";

export const scrapeAtlassianJobs = async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto(ATLASSIAN_JOBS_URL, { waitUntil: "networkidle0" });
    logger.info("Extracting job information");

    const jobs = await page.evaluate(() => {
      const jobListing = document.querySelectorAll(".careers td a");
      return Array.from(jobListing).map((job) => {
        return {
          title: job ? job.innerText.trim() : "No Title",
          url: job ? job.href : "No URL",
          company: "Atlassian",
        };
      });
    });
    logger.info(`Scraped ${jobs.length} Atlassian jobs`);
    return jobs;
  } catch (error) {
    logger.error(`Error scraping Atlassian jobs: ${error.message}`);
    throw error;
  } finally {
    browser.close();
  }
};
