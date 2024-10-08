import logger from "./logger.js";

export class ScrapperBuilder {
  static config = {};

  static setBrowser(browser) {
    this.config.browser = browser;
    return this;
  }
  
  /**
   * @param {function(): Promise<any[]>} fn
   * @returns {ScrapperBuilder}
   */
  static setJobListingEvaluation(fn) {
    this.config.jobListingEvaluation = fn;
    return this;
  }

  /**
   * @param {string} selector 
   * @returns {ScrapperBuilder}
   */
  static setJobListingSelector(selector) {
    this.config.jobListingSelector = selector;
    return this;
  }

  /**
   * @param {function(page: Page, evaluate: function): Promise<any[]>} scrapper 
   * @returns {ScrapperBuilder}
   */
  static setJobListingScrapper(scrapper) {
    this.config.jobListingScrapper = scrapper;
    return this;
  }

  /**
   * @param {function(): Promise<any[]>} fn
   * @returns {ScrapperBuilder}
   */
  static setJobDetailEvaluation(fn) {
    this.config.jobDetailEvaluation = fn;
    return this;
  }

  /**
   * @param {string} selector 
   * @returns {ScrapperBuilder}
   */
  static setJobDetailSelector(selector) {
    this.config.jobDetailSelector = selector;
    return this;
  }

  /**
   * @param {function(page: Page, evaluate: function): Promise<any[]>} scrapper 
   * @returns {ScrapperBuilder}
   */
  static setJobDetailScrapper(scrapper) {
    this.config.jobDetailScrapper = scrapper;
    return this;
  }

  static build() {
    const scrapper = new Scrapper(this.config);
    this.config = {}; // Reset config for next use
    return scrapper;
  }
}

export class Scrapper {
  constructor(config) {
    this.config = config;
  }

  async scrape(url) {
    if (!this.config.browser) {
      throw new Error('Browser is not set');
    }

    if (!this.config.jobListingEvaluation) {
      throw new Error('Job listing evaluation function is not set');
    }

    const page = await this.config.browser.newPage();
    await page.goto(url, { waitUntil: "networkidle0" });

    if (this.config.jobListingSelector) {
      await page.waitForSelector(this.config.jobListingSelector);
    }

    // If jobListingScrapper is set, use it to scrape the job listings
    // Otherwise, use the jobListingEvaluation function to scrape the job listings
    const jobs = this.config.jobListingScrapper
      ? await this.config.jobListingScrapper(page, this.config.jobListingEvaluation)
      : await page.evaluate(this.config.jobListingEvaluation);

    if (!this.config.jobDetailEvaluation) {
      await page.close();
      return jobs;
    }

    for (let job of jobs) {
      await page.goto(job.url, { waitUntil: "networkidle0" });
      if (this.config.jobDetailSelector) {
        await page.waitForSelector(this.config.jobDetailSelector);
      }

      // If jobDetailScrapper is set, use it to scrape the job details
      // Otherwise, use the jobDetailEvaluation function to scrape the job details
      const details = this.config.jobDetailScrapper
        ? await this.config.jobDetailScrapper(page, this.config.jobDetailEvaluation)
        : await page.evaluate(this.config.jobDetailEvaluation);

      Object.assign(job, details);
    }

    await page.close();
    return jobs;
  }
}

export async function scrape(browser, url, scrapper) {
  const {jobListing, jobDetail} = scrapper;
  const page = await browser.newPage();
  const jobs = [];

  try {
    await page.goto(url, { waitUntil: "networkidle0" });
    if (jobListing.jobListingSelector) {
      let jobs = [];
      let hasNextPage = true;

      while (hasNextPage) {
        await page.waitForSelector(jobListing.jobListingSelector);
        const pageJobs = await page.evaluate(jobListing.evaluate);
        jobs = jobs.concat(pageJobs);

        const nextButton = await page.$(jobListing.nextButtonSelector);
        if (nextButton) {
          await nextButton.click();
        } else {
          hasNextPage = false;
        }
      }
    } else {
      const jobs = await page.evaluate(jobListing);
    }

    logger.info(`Found ${jobs.length} jobs. Scraping details...`);

    if (!jobDetail) {
      return jobs;
    }

    for (const job of jobs) {
      try {
        await page.goto(job.url, { waitUntil: "networkidle0" });
        const jobDetails = await page.evaluate(jobDetail);

        Object.assign(job, jobDetails);

        logger.info(`Scraped details for job: ${job.title}`);
      } catch (error) {
        logger.error(
          `Error scraping details for job ${job.title}: ${error.message}`,
        );
      }
    }

    return jobs;
  } catch (error) {
    logger.error(`Error scraping jobs from ${url}: ${error.message}`);
    throw error;
  } finally {
    await page.close();
  }
}