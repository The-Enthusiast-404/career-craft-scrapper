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
import { scrapeDuckduckgoJobs } from "./scrapers/duckduckgo.js";
import logger from "./utils/logger.js";
import { sendJobsToAPI } from "./utils/sendJobs.js";
import { validateAndNormalizeJob } from "./utils/jobUtils.js";
import { scrapeShopifyJobs } from "./scrapers/shopify.js";
// import { scrapeCircleCiJobs } from "./scrapers/circleCi.js";
import { scrapeSentry } from './scrapers/sentry.js'
import { scrapeSegmentJobs } from "./scrapers/segment.js";
import { scrapeAuth0Jobs } from './scrapers/auth0.js'
import { scrapetoptaljobs } from "./scrapers/topTal.js";
import { scrapeZappierJobs } from "./scrapers/Zappier.js";
import { NetflixJobScrapper } from "./scrapers/Netflix.js";
import { scrapeAtlassianLoomJobs } from "./scrapers/atlassianLoom.js";

async function main() {
  let browser;
  try {
    browser = await launchBrowser();

    // scrape the atalssian jobs
    // const atlassianJobs = await scrapeAtlassianJobs (browser);
    // logger.info(`Found ${atlassianJobs.length} atlassian jobs`);


    // logger.info("Starting Dropbox job scrapping");
    // const dropboxJobs = await scrapeDropbox(browser);
    // logger.info(`Found ${dropboxJobs.length} Dropbox jobs with descriptions`);
    //

    // Scrape PhonePe jobs
    // const phonePeJobs = await scrapePhonePeJobs(browser);
    // logger.info(`Found ${phonePeJobs.length} PhonePe jobs`);

    // // Scrape Flipkart jobs
    // const flipkartJobs = await scrapeFlipkartJobs(browser);
    // logger.info(`Found ${flipkartJobs.length} Flipkart jobs`);

    // Scrape Airbnb jobs
    //logger.info("Starting Airbnb job scraping");
    //const airbnbJobs = await scrapeAirbnbJobs(browser);
    //logger.info(`Found ${airbnbJobs.length} Airbnb jobs with details`);

    // logger.info("Starting Slack job scraping");
    // const slackJobs = await scrapeSlackJobs(browser);
    // logger.info(`Found ${slackJobs.length} Slack jobs with descriptions`);

    // logger.info("Starting Airbnb job scrapping");
    // const airbnbJobs = await scrapeAirbnbJobs(browser);
    // logger.info(`Found ${airbnbJobs.length} Airbnb jobs with descriptions`);

    // logger.info("Starting Mozilla job scrapping");
    // const mozillaJobs = await scrapeMozillaJobs(browser);
    // logger.info(`Found ${mozillaJobs.length} Mozilla jobs with descriptions`);

    // logger.info("Starting Duckduckgo job scrapping");
    // const duckduckgoJobs = await scrapeDuckduckgoJobs(browser);
    // logger.info(`Found ${duckduckgoJobs.length} Duckduckgo jobs with descriptions`);

    // logger.info("Starting Spotify job scrapping");
    // const spotifyJobs = await scrapeSpotifyJobs(browser);
    // logger.info(`Found ${spotifyJobs.length} Spotify jobs with descriptions`);

    // logger.info("Starting Paytm job scraping");
    // const paytmJobs = await scrapePaytmJobs(browser);
    // logger.info(`Found ${paytmJobs.length} Paytm jobs with descriptions`);

    //scrape shopify jobs
    // const shopifyjobs = await scrapeShopifyJobs(browser);
    // logger.info(`Found ${shopifyjobs.length} shopify jobs`);

    // // scrape Cicle Ci jobs
    // const circleCiJobs = await scrapeCircleCiJobs(browser);
    // logger.info(`Found ${circleCiJobs.length} CircleCI jobs with descriptions`);
    // const segmentJobs = await scrapeSegmentJobs(browser);
    // logger.info(`Found ${segmentJobs.length} Segment jobs`);
    
    const sentryJobs = await scrapeSentry(browser);
    logger.info(`Found ${sentryJobs.length} sentry jobs`);
    const auth0Jobs = await scrapeAuth0Jobs(browser);
    logger.info(`Found ${auth0Jobs.length} Auth0 jobs`);

    // scrape Toptal jobs
    const toptalJobs= await scrapetoptaljobs(browser);
    logger.info(`Found ${toptalJobs.length} Toptal jobs`)
    // const sentryJobs = await scrapeSentry(browser);
    // logger.info(`Found ${sentryJobs.length} sentry jobs`);
    // const auth0Jobs = await scrapeAuth0Jobs(browser);
    // logger.info(`Found ${auth0Jobs.length} Auth0 jobs`);

    // Scrape Zappier jobs
    // const zappierJobs = await scrapeZappierJobs(browser);
    // logger.info(`Found ${zappierJobs.length} Zappier jobs with descriptions`);

    // scrape Netflix Jobs
    // const NetflixJobs = await NetflixJobScrapper(browser);
    // logger.info(`Found ${NetflixJobs.length} Netflix jobs with valid description`);

    // Scrape the Toptal jobs
    // const lyftJob = await lyftJobScrapper(browser);
    // logger.info(`Found ${lyftJob.length} lyftJob jobs with valid description`);

    // scrape the atlassianLoom Jobs
    // const atlassianLoom = await scrapeAtlassianLoomJobs(browser);
    // logger.info(`Found ${atlassianLoom.length} AtlassianLoom jobs with valid description`);

    //scrape the Gitlab Jobs
    const stripe = await scrapeStripeJobs(browser);
    logger.info(`Found ${stripe.length} stripe jobs with valid description`);

 


    // Combine all jobs
    let allJobs = [

      // ...phonePeJobs,
      // ...flipkartJobs,
      //...airbnbJobs,

      // ...paytmJobs,
      // ...dropboxJobs,
      // ...slackJobs,

      // ...airbnbJobs,
      // ...mozillaJobs,
      // ...spotifyJobs,
      // ...circleCiJobs,
      // Add other job arrays here when uncommented

      // ...atlassianJobs,
      ...shopifyjobs,
      ...duckduckgoJobs,
      ...segmentJobs,
      ...sentryJobs,
      ...auth0Jobs,
      ...toptalJobs,
      // ...shopifyjobs,
      // ...duckduckgoJobs,
      // ...segmentJobs,
      // ...sentryJobs,
      // ...auth0Jobs,
      // ...zappierJobs,
      // ...NetflixJobs
      // ...lyftJob
      ...atlassianLoom
    ];

    
    // Filter and process jobs
    allJobs = allJobs.map(validateAndNormalizeJob).filter(Boolean);
    logger.info(`Total valid jobs after normalization: ${allJobs.length}`);

    // Prepare table data
    const tableData = allJobs.map((job) => ({
      title: job.title,
      company: job.company,
      JobId: job.JobId.toString(),
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
        error.response ? error.response.data : error.message
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
