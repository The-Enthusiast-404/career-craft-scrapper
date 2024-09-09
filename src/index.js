import { launchBrowser, createPage } from "./utils/browser.js";
import { scrapePhonePeJobs } from "./scrapers/phonepe.js";
import { scrapeFlipkartJobs } from "./scrapers/flipkart.js";
import { scrapeAirbnbJobs } from "./scrapers/airbnb.js";
import logger from "./utils/logger.js";
import { sendJobsToAPI } from "./utils/sendJobs.js";
import { validateAndNormalizeJob } from "./utils/jobUtils.js";

async function main() {
  let browser;
  try {
    browser = await launchBrowser();

    // Scrape PhonePe jobs
    const phonePeJobs = await scrapePhonePeJobs(browser);
    logger.info(`Found ${phonePeJobs.length} PhonePe jobs`);

    // // Scrape Flipkart jobs
    const flipkartJobs = await scrapeFlipkartJobs(browser);
    logger.info(`Found ${flipkartJobs.length} Flipkart jobs`);

    // Scrape Airbnb jobs
    const airbnbJobs = await scrapeAirbnbJobs(browser);
    logger.info(`Found ${airbnbJobs.length} Airbnb jobs`);

    // Combine all jobs
    let allJobs = [...phonePeJobs, ...flipkartJobs, ...airbnbJobs];

    // Filter and process jobs
    allJobs = allJobs.map(validateAndNormalizeJob).filter(Boolean);

    logger.info(`Total valid jobs to be sent: ${allJobs.length}`);

    // Log the first few jobs for debugging
    allJobs.slice(0, 5).forEach((job, index) => {
      logger.info(`Job ${index + 1}:`, JSON.stringify(job, null, 2));
    });

    // Send jobs to API
    const result = await sendJobsToAPI(allJobs);
    logger.info(`API response: ${JSON.stringify(result)}`);

    // Console output for all jobs
    console.table(allJobs);
  } catch (error) {
    logger.error(`An error occurred: ${error.message}`);
    logger.error(error.stack); // Log the full stack trace
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

main();
