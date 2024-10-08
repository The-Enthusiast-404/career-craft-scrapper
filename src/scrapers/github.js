import { scrape, ScrapperBuilder } from "../utils/scrapper.js";
import logger from "../utils/logger.js";

export const GITHUB_JOBS_URL = "https://www.github.careers/careers-home/jobs";

export async function jobListingEvaluation() {
  return [];
}

export async function scrapeGithub(browser) {
  try {
    logger.info("Scraping Github jobs page ...");
    
    const scrapper = ScrapperBuilder
      .setJobListingEvaluation(jobListingEvaluation)
      .setJobListingSelector(".job-results-container")
      .setJobListingScrapper(async (page, evaluate) => {
        logger.info("Scraping job listing ...");
        
        const nextPageSelector = ".mat-paginator-navigation-next:not(.mat-button-disabled)"
        let jobs = [];
        let hasNextPage = true;
        
        while (hasNextPage) {
          const data = await page.evaluate(evaluate);
          jobs = jobs.concat(data);

          const nextButton = await page.$(nextPageSelector);
          
          if (nextButton) {
            logger.info("Clicking next page ...");
            await nextButton.click();
            await page.waitForSelector('.job-results-container', { timeout: 5000 });
          } else {
            logger.info("No next page found");
            hasNextPage = false;
          }
        }

        logger.info(`Found ${jobs.length} jobs`);

        return jobs;
      })
      .setBrowser(browser)
      .build();

    return await scrapper.scrape(GITHUB_JOBS_URL);

  } catch (error) {
    logger.error(`Error scraping Sentry jobs: ${error.message}`);
    throw error;
  }
}
