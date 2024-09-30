import { launchBrowser, createPage } from "./utils/browser.js";
import { scrapePhonePeJobs } from "./scrapers/phonepe.js";
import { scrapeFlipkartJobs } from "./scrapers/flipkart.js";
import { scrapeAirbnbJobs } from "./scrapers/airbnb.js";
import { scrapePaytmJobs } from "./scrapers/paytm.js";
import { scrapeHackerNewsJobs } from "./scrapers/hackernews.js";
import { scrapeMozillaJobs } from "./scrapers/mozilla.js";
import { scrapeSpotifyJobs } from "./scrapers/spotify.js";
import { scrapeDropbox } from "./scrapers/dropbox.js";
import { scrapeSlackJobs } from "./scrapers/Slack.js";
import { scrapeAtlassianJobs } from "./scrapers/atlassian.js";
import logger from "./utils/logger.js";
import { sendJobsToAPI } from "./utils/sendJobs.js";
import { validateAndNormalizeJob } from "./utils/jobUtils.js";

async function main() {
  let browser;
  try {
    browser = await launchBrowser();

    // logger.info("Starting Dropbox job scrapping");
    // const dropboxJobs = await scrapeDropbox(browser);
    // logger.info(`Found ${dropboxJobs.length} Dropbox jobs with descriptions`);
    //

    // logger.info("Starting Slack job scraping");
    // const slackJobs = await scrapeSlackJobs(browser);
    // logger.info(`Found ${slackJobs.length} Slack jobs with descriptions`);

    // logger.info("Starting Airbnb job scrapping");
    // const airbnbJobs = await scrapeAirbnbJobs(browser);
    // logger.info(`Found ${airbnbJobs.length} Airbnb jobs with descriptions`);

    // logger.info("Starting Mozilla job scrapping");
    // const mozillaJobs = await scrapeMozillaJobs(browser);
    // logger.info(`Found ${mozillaJobs.length} Mozilla jobs with descriptions`);

    logger.info("Starting Spotify job scrapping");
    const spotifyJobs = await scrapeSpotifyJobs(browser);
    logger.info(`Found ${spotifyJobs.length} Spotify jobs with descriptions`);

    // logger.info("Starting Paytm job scraping");
    // const paytmJobs = await scrapePaytmJobs(browser);
    // logger.info(`Found ${paytmJobs.length} Paytm jobs with descriptions`);

    // Combine all jobs
    let allJobs = [
      // ...paytmJobs,
      // ...dropboxJobs,
      // ...slackJobs,
      // ...airbnbJobs,
      // ...mozillaJobs,
      ...spotifyJobs,
      // Add other job arrays here when uncommented
    ];

    // Filter and process jobs
    allJobs = allJobs.map(validateAndNormalizeJob).filter(Boolean);
    logger.info(`Total valid jobs after normalization: ${allJobs.length}`);

    // Prepare table data
    const tableData = allJobs.map((job) => ({
      title: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary,
      role: job.role,
      skills: job.skills,
      remote: job.remote.toString(),
      experience: job.experience,
      education: job.education,
      department: job.department,
      jobType: job.jobType,
      url: job.url,
      description: job.description.substring(0, 50) + "...", // Truncate description for readability
    }));

    // Log table of all jobs
    console.table(tableData);

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
