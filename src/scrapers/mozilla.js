// src/scrapers/mozilla.js
import puppeteer from "puppeteer";
import logger from "../utils/logger.js";

export async function scrapeMozillaJobs() {
  const browser = await puppeteer.launch({ headless: "new" });
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
        return {
          title: titleElement ? titleElement.textContent.trim() : "No title",
          url: titleElement ? titleElement.href : "No URL",
          company: "Mozilla",
        };
      });
    });

    logger.info(`Scraped ${jobs.length} Mozilla jobs`);
    return jobs;
  } catch (error) {
    logger.error(`Error scraping Mozilla jobs: ${error.message}`);
    throw error;
  } finally {
    await browser.close();
  }
}
