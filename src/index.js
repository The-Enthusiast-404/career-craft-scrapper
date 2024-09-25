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
import { ScrapSlackJobs } from "./scrapers/Slack.js";  // Include Slack scraper
import { scrapeAtlassianJobs } from "./scrapers/atlassian.js";  // Include Atlassian scraper

async function main() {
  let browser;
  try {
    browser = await launchBrowser();

    // Scrape PhonePe jobs
    // const phonePeJobs = await scrapePhonePeJobs(browser);
    // logger.info(`Found ${phonePeJobs.length} PhonePe jobs`);

    // // Scrape Flipkart jobs
    // const flipkartJobs = await scrapeFlipkartJobs(browser);
    // logger.info(`Found ${flipkartJobs.length} Flipkart jobs`);

    // // Scrape Airbnb jobs
    // const airbnbJobs = await scrapeAirbnbJobs(browser);
    // logger.info(`Found ${airbnbJobs.length} Airbnb jobs`);

    // Scrape Paytm jobs
    // const paytmJobs = await scrapePaytmJobs(browser);
    // logger.info(`Found ${paytmJobs.length} Paytm jobs`);

    // Scrape Hacker News jobs
    // const hackerNewsJobs = await scrapeHackerNewsJobs();
    // logger.info(`Found ${hackerNewsJobs.length} Hacker News jobs`);
    //

    // const mozillaJobs = await scrapeMozillaJobs(browser);
    // logger.info(`Found ${mozillaJobs.length} Mozilla jobs`);

    // const spotifyJobs = await scrapeSpotifyJobs(browser);
    // logger.info(`Found ${spotifyJobs.length} Spotify jobs`);

    const slackJobs = await ScrapSlackJobs(browser);
    logger.info(`Found ${slackJobs.length} Slack Jobs`);

    // const atlassianJobs = await scrapeAtlassianJobs(browser);
    // logger.info(`Found ${atlassianJobs.length} Atlassian jobs`);

    // Combine all jobs
    let allJobs = [
      // ...phonePeJobs,
      // ...flipkartJobs,
      // ...airbnbJobs,
      // ...paytmJobs,
      // ...hackerNewsJobs,
      // ...mozillaJobs,
      // ...spotifyJobs,
      // ...lyftJobs,
      ...slackJobs,
      // ...spotifyJobs,
      // ...atlassianJobs,
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
      logger.info(`API response: ${JSON.stringify(result)}`);
  } catch (error) {
      logger.error("Error while you sending the jobs to Api endpoint", error.response ? error.response.data : error.message);
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
