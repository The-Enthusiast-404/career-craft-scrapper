import { scrape, ScrapperBuilder } from "../utils/scrapper.js";
import logger from "../utils/logger.js";

export const GITHUB_JOBS_URL = "https://www.github.careers/careers-home/jobs";

export async function jobListingEvaluation() {
  const jobCards = document.querySelectorAll('mat-expansion-panel');

  return Array.from(jobCards).map(job => ({ 
    title: job.querySelector('.job-title').textContent.trim() || "" , 
    url: job.querySelector('a.read-more-button').href,
    company: "GitHub", 
    location: job.querySelector('.label-value.location').textContent.trim() || "",
    department: job.querySelector('.label-value.categories').textContent.trim() || "",
  }));
}

export async function jobDetailEvaluation() {
  const metadata = document.querySelector('.meta-data-options');
  const description = document.querySelector('article');

  return {
      description: description.innerText.trim() || "",
      // category: "",
      // jobType: "",
      // responsibilities: "",
      // qualifications: "",
      // benefits: "",
      // remoteType: "",
      // experience: "",
      // education: "",
      // salary: "",
      // applicationDeadline: "",
      // postedDate: "",
      // companyDescription: "",
  };
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
      .setJobDetailEvaluation(jobDetailEvaluation)
      .setJobDetailSelector(".job-description-container")
      .setBrowser(browser)
      .build();

    return await scrapper.scrape(GITHUB_JOBS_URL);

  } catch (error) {
    logger.error(`Error scraping Sentry jobs: ${error.message}`);
    throw error;
  }
}
