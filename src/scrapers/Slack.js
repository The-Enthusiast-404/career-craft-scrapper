import puppeteer from "puppeteer";
import logger from "../utils/logger.js";

export async function ScrapSlackJobs(browser) {
  const page = await browser.newPage();
  try {
    logger.info("Navigating to Slack careers page");
    await page.goto("https://slack.com/intl/en-in/careers", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForSelector(".job-listing__table tbody", {
      visible: true,
      timeout: 60000,
    });

    const jobs = await page.$$eval(
      ".job-listing__table tbody tr",
      (jobElements) => {
        return jobElements
          .filter((jobElement) =>
            jobElement.querySelector(".job-listing__table-title"),
          )
          .map((jobElement) => {
            const titleElement = jobElement.querySelector(
              ".job-listing__table-title",
            );
            const linkElement = jobElement.querySelector(
              "a.o-section--feature__link",
            );
            const locationElement = jobElement.querySelector(
              ".job-listing__table-location",
            );
            const title = titleElement
              ? titleElement.textContent.trim()
              : "No title";
            const link = linkElement ? linkElement.href : "No link";
            const location = locationElement
              ? locationElement.textContent.trim()
              : "No location";
            return {
              title,
              location,
              company: "Slack",
              url: link,
            };
          });
      },
    );

    logger.info(`Found ${jobs.length} Slack job listings`);

    // Scrape job descriptions
    for (const job of jobs) {
      try {
        await page.goto(job.url, { waitUntil: "networkidle0", timeout: 60000 });
        job.description = await page.evaluate(() => {
          const descriptionElement = document.querySelector(
            '[data-automation-id="jobPostingDescription"]',
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
    logger.error(`Error scraping Slack jobs: ${error.message}`);
    return [];
  } finally {
    await page.close();
  }
}
