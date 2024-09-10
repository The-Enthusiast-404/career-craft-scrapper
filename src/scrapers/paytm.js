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
        const title = posting
          .querySelector('h5[data-qa="posting-name"]')
          .innerText.trim();
        const url = posting.querySelector("a.posting-btn-submit").href;
        const company = "Paytm";

        jobListings.push({ title, url, company });
      });

      return jobListings;
    });

    logger.info(`Scraped ${jobs.length} Paytm jobs`);
    return jobs;
  } catch (error) {
    logger.error(`Error scraping Paytm jobs: ${error.message}`);
    return [];
  } finally {
    await page.close();
  }
}
