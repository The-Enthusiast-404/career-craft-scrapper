import logger from "../utils/logger.js";
import puppeteer from "puppeteer";

const ATLASSIAN_JOBS_URL = "https://www.atlassian.com/company/careers/all-jobs";

export const scrapeAtlassianJobs = async (browser) => {
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

    logger.info(`Found ${jobs.length} Atlassian jobs. Scraping details...`);

    // Scrape job details
    for (const job of jobs) {
      try {
        await page.goto(job.url, { waitUntil: "networkidle0" });
        const details = await page.evaluate(() => {
          const highlightElement = document.querySelector(
            ".job-posting-detail--highlight",
          );
          const descriptionElement = document.querySelector(
            ".column.colspan-10.text-left.push.push-1",
          );

          return {
            highlight: highlightElement
              ? highlightElement.textContent.trim()
              : "",
            description: descriptionElement
              ? descriptionElement.innerText.trim()
              : "",
          };
        });

        // Parse highlight information
        const [department, location, jobType] = details.highlight
          .split("|")
          .map((item) => item.trim());

        job.department = department || "";
        job.location = location || "";
        job.jobType = jobType || "";
        job.description = details.description;

        logger.info(`Scraped details for job: ${job.title}`);
      } catch (error) {
        logger.error(
          `Error scraping details for job ${job.title}: ${error.message}`,
        );
      }
    }

    return jobs;
  } catch (error) {
    logger.error(`Error scraping Atlassian jobs: ${error.message}`);
    throw error;
  } finally {
    await page.close();
  }
};
