import logger from "./logger.js";

export async function scrape(browser, url, scrapper) {
  const {jobListing, jobDetail} = scrapper;
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: "networkidle0" });
    const jobs = await page.evaluate(jobListing);

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
    throw error;
  } finally {
    await page.close();
  }
}