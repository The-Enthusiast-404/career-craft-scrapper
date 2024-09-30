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
      `Found ${allJobs.length} Spotify jobs. Scraping detailed information...`,
    );

    // Scrape detailed job information
    for (const job of allJobs) {
      try {
        await page.goto(job.url, { waitUntil: "networkidle0" });
        const jobDetails = await extractJobDetails(page);
        Object.assign(job, jobDetails);
        logger.info(`Scraped details for job: ${job.title}`);
      } catch (error) {
        logger.error(
          `Error scraping details for job ${job.title}: ${error.message}`,
        );
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

async function extractJobDetails(page) {
  return page.evaluate(() => {
    const getElementText = (selector) => {
      const element = document.querySelector(selector);
      return element ? element.textContent.trim() : "Not specified";
    };

    const getListItems = (selector) => {
      const items = document.querySelectorAll(selector);
      return Array.from(items).map((item) => item.textContent.trim());
    };

    const description = getElementText(".singlejob_maxWidth__0SwoF");

    return {
      description: description,
      category: getElementText(".tags_container__mE0BD.tags_color__F6uPG p"),
      jobType: getElementText(".col-12:nth-child(2) .size-6"),
      responsibilities: getListItems(
        ".singlejob_maxWidth__0SwoF ul:nth-of-type(1) li",
      ),
      qualifications: getListItems(
        ".singlejob_maxWidth__0SwoF ul:nth-of-type(2) li",
      ),
      benefits: getListItems(
        ".row.mt-l.mt-mobile-xl .perks_container__E7jyf p",
      ),
      remoteType: description.includes("distributed")
        ? "Remote Eligible"
        : "Not specified",
      experience: (() => {
        const expMatch = description.match(/(\d+\+?\s*years?)[^.]*experience/i);
        return expMatch ? expMatch[1] : "Not specified";
      })(),
      education: (() => {
        const eduMatch = description.match(/([^.]+degree[^.]+\.)/i);
        return eduMatch ? eduMatch[1].trim() : "Not specified";
      })(),
      salary: "Not specified", // Salary information not provided in the sample HTML
      applicationDeadline: "Not specified", // Application deadline not provided in the sample HTML
      postedDate: "Not specified", // Posted date not provided in the sample HTML
      companyDescription: getElementText(
        ".row.mb-100.mt-l.mb-l .closingtext_text__B9RMi",
      ),
    };
  });
}
