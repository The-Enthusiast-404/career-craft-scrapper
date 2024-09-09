import puppeteer from "puppeteer";
import logger from "../utils/logger.js";

const NAVIGATION_TIMEOUT = 60000; // 60 seconds
const RETRY_DELAY = 5000; // 5 seconds
const MAX_RETRIES = 3;

export async function scrapeAirbnbJobs(browser) {
  const baseUrl = "https://careers.airbnb.com/positions/";
  const page = await browser.newPage();
  let allJobs = [];

  try {
    await page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT);
    await navigateWithRetry(page, baseUrl);

    let hasNextPage = true;
    let pageNum = 1;
    while (hasNextPage) {
      logger.info(`Scraping Airbnb jobs page ${pageNum}`);

      // Wait for the job listings to load
      await page.waitForSelector(".inner-grid", {
        timeout: NAVIGATION_TIMEOUT,
      });

      // Scroll to load all job listings on the current page
      await autoScroll(page);

      // Extract jobs from the current page
      const jobs = await extractJobsFromPage(page);
      allJobs = allJobs.concat(jobs);

      logger.info(`Found ${jobs.length} jobs on page ${pageNum}`);

      // Check if there's a next page and navigate to it
      hasNextPage = await goToNextPage(page);
      pageNum++;

      // Add a small delay between page navigations
      await delay(2000);
    }

    logger.info(`Found ${allJobs.length} Airbnb jobs in total`);
    return allJobs;
  } catch (error) {
    logger.error(`Error scraping Airbnb jobs: ${error.message}`);
    throw error;
  } finally {
    await page.close();
  }
}

async function navigateWithRetry(page, url, retries = 0) {
  try {
    await page.goto(url, { waitUntil: "networkidle0" });
  } catch (error) {
    if (retries < MAX_RETRIES) {
      logger.warn(
        `Navigation failed, retrying in ${RETRY_DELAY / 1000} seconds...`,
      );
      await delay(RETRY_DELAY);
      await navigateWithRetry(page, url, retries + 1);
    } else {
      throw new Error(
        `Failed to navigate to ${url} after ${MAX_RETRIES} retries`,
      );
    }
  }
}

async function extractJobsFromPage(page) {
  return page.evaluate(() => {
    const jobElements = document.querySelectorAll(".inner-grid");
    return Array.from(jobElements).map((element) => {
      const titleElement = element.querySelector("h3 a");
      return {
        title: titleElement ? titleElement.textContent.trim() : "",
        company: "Airbnb",
        url: titleElement ? titleElement.href : "",
      };
    });
  });
}

async function goToNextPage(page) {
  const nextPageButton = await page.$(".facetwp-page.next");
  if (nextPageButton) {
    try {
      await Promise.all([
        page.waitForNavigation({
          waitUntil: "networkidle0",
          timeout: NAVIGATION_TIMEOUT,
        }),
        nextPageButton.click(),
      ]);
      return true;
    } catch (error) {
      logger.warn(`Error navigating to next page: ${error.message}`);
      return false;
    }
  }
  return false;
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.documentElement.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

// Custom delay function
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
