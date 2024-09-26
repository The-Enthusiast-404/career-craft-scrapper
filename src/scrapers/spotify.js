import puppeteer from "puppeteer";
import logger from "../utils/logger.js";

const SPOTIFY_JOBS_URL = "https://www.lifeatspotify.com/jobs";
const LOAD_MORE_SELECTOR = 'button[aria-label="Load more jobs"]';
const JOB_CARD_SELECTOR = ".entry_container__eT9IU";

export async function scrapeSpotifyJobs(browser) {
  const page = await browser.newPage();
  let allJobs = [];
  try {
    logger.info("Navigating to Spotify jobs page");
    await page.goto(SPOTIFY_JOBS_URL, { waitUntil: "networkidle0" });

    // Function to extract jobs from the current page
    const extractJobs = async () => {
      return page.evaluate((jobCardSelector) => {
        const jobCards = document.querySelectorAll(jobCardSelector);
        return Array.from(jobCards).map((card) => {
          const titleElement = card.querySelector(".entry_title__Q0z3u");
          const locationElement = card.querySelector(".entry_location__CFAvj");
          return {
            title: titleElement ? titleElement.textContent.trim() : "",
            company: "Spotify",
            url: titleElement
              ? "https://www.lifeatspotify.com" +
                titleElement.getAttribute("href")
              : "",
            location: locationElement ? locationElement.textContent.trim() : "",
          };
        });
      }, JOB_CARD_SELECTOR);
    };

    // Function to click "Load more" button and wait for new content
    const loadMoreJobs = async () => {
      const loadMoreButton = await page.$(LOAD_MORE_SELECTOR);
      if (loadMoreButton) {
        const currentJobCount = await page.$$eval(
          JOB_CARD_SELECTOR,
          (elements) => elements.length,
        );
        await loadMoreButton.click();
        await page.waitForFunction(
          (selector, previousCount) =>
            document.querySelectorAll(selector).length > previousCount,
          {},
          JOB_CARD_SELECTOR,
          currentJobCount,
        );
        return true;
      }
      return false;
    };

    // Extract jobs and load more until no more jobs can be loaded
    let hasMore = true;
    while (hasMore) {
      const jobs = await extractJobs();
      allJobs = allJobs.concat(jobs);
      hasMore = await loadMoreJobs();
    }

    logger.info(
      `Found ${allJobs.length} Spotify jobs. Scraping descriptions...`,
    );

    // Scrape job descriptions
    for (const job of allJobs) {
      try {
        await page.goto(job.url, { waitUntil: "networkidle0" });
        job.description = await page.evaluate(() => {
          const descriptionElement = document.querySelector(
            ".singlejob_maxWidth__0SwoF",
          );
          return descriptionElement ? descriptionElement.innerText.trim() : "";
        });
        job.jobType = await page.evaluate(() => {
          const jobTypeElement = document.querySelector(
            ".col-12:nth-child(2) .size-6",
          );
          return jobTypeElement ? jobTypeElement.textContent.trim() : "";
        });
        logger.info(`Scraped description for job: ${job.title}`);
      } catch (error) {
        logger.error(
          `Error scraping description for job ${job.title}: ${error.message}`,
        );
        job.description = "";
        job.jobType = "";
      }
    }

    return allJobs;
  } catch (error) {
    logger.error(`Error scraping Spotify jobs: ${error.message}`);
    throw error;
  } finally {
    await page.close();
  }
}
