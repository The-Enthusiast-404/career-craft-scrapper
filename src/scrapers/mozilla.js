import puppeteer from "puppeteer";
import logger from "../utils/logger.js";

export async function scrapeMozillaJobs(browser) {
  const page = await browser.newPage();
  try {
    logger.info("Navigating to Mozilla careers page");
    await page.goto("https://www.mozilla.org/en-US/careers/listings/", {
      waitUntil: "networkidle0",
    });

    logger.info("Extracting job information");
    const jobs = await page.evaluate(() => {
      const jobElements = document.querySelectorAll(
        ".listings-positions tr.position",
      );
      return Array.from(jobElements).map((element) => {
        const titleElement = element.querySelector(".title a");
        const locationElement = element.querySelector(".location");
        const teamElement = element.querySelector(".team");
        return {
          title: titleElement ? titleElement.textContent.trim() : "No title",
          url: titleElement ? titleElement.href : "No URL",
          company: "Mozilla",
          location: locationElement
            ? locationElement.textContent.trim()
            : "No location",
          team: teamElement ? teamElement.textContent.trim() : "No team",
        };
      });
    });

    logger.info(`Found ${jobs.length} Mozilla job listings`);

    // Scrape job descriptions
    for (const job of jobs) {
      try {
        await page.goto(job.url, { waitUntil: "networkidle0" });
        job.description = await page.evaluate(() => {
          const descriptionElement = document.querySelector(
            ".job-post > div:nth-child(2)",
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
    logger.error(`Error scraping Mozilla jobs: ${error.message}`);
    return [];
  } finally {
    await page.close();
  }
}
