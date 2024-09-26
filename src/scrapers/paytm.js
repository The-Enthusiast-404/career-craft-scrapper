import logger from "../utils/logger.js";

export async function scrapePaytmJobs(browser) {
  const page = await browser.newPage();
  logger.info("Navigating to Paytm jobs page...");
  try {
    await page.goto("https://jobs.lever.co/paytm", {
      waitUntil: "networkidle0",
    });

    const jobs = await page.evaluate(() => {
      const jobListings = [];
      const postings = document.querySelectorAll(".posting");
      postings.forEach((posting) => {
        const titleElement = posting.querySelector(
          'h5[data-qa="posting-name"]',
        );
        const linkElement = posting.querySelector("a.posting-btn-submit");

        if (titleElement && linkElement) {
          const title = titleElement.innerText.trim();
          const url = linkElement.href;
          const company = "Paytm";

          jobListings.push({ title, url, company });
        }
      });
      return jobListings;
    });

    logger.info(`Found ${jobs.length} Paytm job listings`);

    // Scrape job descriptions
    for (const job of jobs) {
      try {
        await page.goto(job.url, { waitUntil: "networkidle0" });
        job.description = await page.evaluate(() => {
          const descriptionElement = document.querySelector(
            '.section[data-qa="job-description"]',
          );
          return descriptionElement ? descriptionElement.innerText.trim() : "";
        });
        logger.info(`Scraped description for job: ${job.title}`);
      } catch (error) {
        logger.error(
          `Error scraping description for job ${job.title}: ${error.message}`,
        );
        job.description = "";
      }
    }

    return jobs;
  } catch (error) {
    logger.error(`Error scraping Paytm jobs: ${error.message}`);
    return [];
  } finally {
    await page.close();
  }
}
