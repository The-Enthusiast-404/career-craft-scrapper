import { launchBrowser, createPage } from "./utils/browser.js";
import { scrapePhonePeJobs } from "./scrapers/phonepe.js";
import logger from "./utils/logger.js";

async function main() {
  let browser;
  try {
    browser = await launchBrowser();
    const page = await createPage(browser);

    const jobs = await scrapePhonePeJobs(page);

    logger.info(`Found ${jobs.length} jobs`);
    console.table(
      jobs.map((job) => ({
        Title: truncateString(job.title, 47),
        Department: truncateString(job.department, 27),
        Location: truncateString(job.location, 27),
        Type: truncateString(job.type, 12),
        Date: job.date,
      })),
    );
  } catch (error) {
    logger.error(`An error occurred: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function truncateString(str, maxLength) {
  if (str.length > maxLength) {
    return str.slice(0, maxLength - 3) + "...";
  }
  return str;
}

main();
