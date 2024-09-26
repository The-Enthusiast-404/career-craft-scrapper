import { launchBrowser, createPage } from "./utils/browser.js";
import { scrapePhonePeJobs } from "./scrapers/phonepe.js";
import { scrapeFlipkartJobs } from "./scrapers/flipkart.js";
import { scrapeAirbnbJobs } from "./scrapers/airbnb.js";
import { scrapePaytmJobs } from "./scrapers/paytm.js"; // Import the new Paytm scraper
import logger from "./utils/logger.js";
import { sendJobsToAPI } from "./utils/sendJobs.js";
import { validateAndNormalizeJob } from "./utils/jobUtils.js";
import { scrapeHackerNewsJobs } from "./scrapers/hackernews.js";
import { scrapeMozillaJobs } from "./scrapers/mozilla.js";
import { scrapeSpotifyJobs } from "./scrapers/spotify.js";
import { scrapeDropbox } from "./scrapers/dropbox.js";
import { ScrapSlackJobs } from "./scrapers/Slack.js"; // Include Slack scraper
import { scrapeAtlassianJobs } from "./scrapers/atlassian.js"; // Include Atlassian scraper

async function main() {
  let browser;
  try {
    browser = await launchBrowser();

    // ... (other job scraping functions)

    logger.info("Starting Dropbox job scraping");
    const dropboxJobs = await scrapeDropbox(browser);
    logger.info(`Found ${dropboxJobs.length} Dropbox jobs with descriptions`);

    // Combine all jobs
    let allJobs = [
      // ... (other job arrays)
      ...dropboxJobs,
    ];

    // Filter and process jobs
    allJobs = allJobs.map(validateAndNormalizeJob).filter(Boolean);
    logger.info(`Total valid jobs to be sent: ${allJobs.length}`);

    // Log the first few jobs for debugging
    allJobs.slice(0, 5).forEach((job, index) => {
      logger.info(`Job ${index + 1}:`, JSON.stringify(job, null, 2));
    });

    // Send jobs to API
    try {
      const result = await sendJobsToAPI(allJobs);
      // logger.info(`API response: ${JSON.stringify(result)}`);
    } catch (error) {
      logger.error(
        "Error while sending the jobs to API endpoint",
        error.response ? error.response.data : error.message,
      );
    }

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
