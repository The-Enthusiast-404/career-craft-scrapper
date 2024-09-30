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

      await page.waitForSelector(".inner-grid", {
        timeout: NAVIGATION_TIMEOUT,
      });

      await autoScroll(page);

      const jobs = await extractJobsFromPage(page);
      allJobs = allJobs.concat(jobs);

      logger.info(`Found ${jobs.length} jobs on page ${pageNum}`);

      hasNextPage = await goToNextPage(page);
      pageNum++;

      await delay(2000);
    }

    logger.info(`Found ${allJobs.length} Airbnb jobs. Scraping details...`);

    // Scrape job details
    for (const job of allJobs) {
      try {
        await page.goto(job.url, {
          waitUntil: "networkidle0",
          timeout: NAVIGATION_TIMEOUT,
        });
        const details = await extractJobDetails(page);
        Object.assign(job, details);
        logger.info(`Scraped details for job: ${job.title}`);
      } catch (error) {
        logger.error(
          `Error scraping details for job ${job.title}: ${error.message}`,
        );
      }
    }

    logger.info(
      `Completed scraping ${allJobs.length} Airbnb jobs with details`,
    );
    return allJobs;
  } catch (error) {
    logger.error(`Error scraping Airbnb jobs: ${error.message}`);
    throw error;
  } finally {
    await page.close();
  }
}

async function extractJobsFromPage(page) {
  return page.evaluate(() => {
    const jobElements = document.querySelectorAll(".inner-grid");
    return Array.from(jobElements).map((element) => {
      const titleElement = element.querySelector("h3 a");
      const locationElement = element.querySelector(".location");
      return {
        title: titleElement ? titleElement.textContent.trim() : "",
        company: "Airbnb",
        url: titleElement ? titleElement.href : "",
        location: locationElement ? locationElement.textContent.trim() : "",
      };
    });
  });
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

    const findElementByText = (selector, text) => {
      const elements = document.querySelectorAll(selector);
      return Array.from(elements).find((el) => el.textContent.includes(text));
    };

    const description = getElementText(".job-detail.active");
    const salaryRange = getElementText(".pay-range");

    const extractEducation = () => {
      const educationElement = findElementByText(
        ".job-detail.active p, .job-detail.active li",
        "Bachelor",
      );
      return educationElement
        ? educationElement.textContent.trim()
        : "Not specified";
    };

    const extractExperience = () => {
      const experienceElement = findElementByText(
        ".job-detail.active p, .job-detail.active li",
        "years",
      );
      return experienceElement
        ? experienceElement.textContent.trim()
        : "Not specified";
    };

    return {
      title: getElementText("h1.text-size-12"),
      location: getElementText(".offices span"),
      department: (() => {
        const intro = getElementText(".content-intro");
        const match = intro.match(/This\s+(.*?)\s+role/i);
        return match ? match[1].trim() : "Not specified";
      })(),
      description: description,
      salary: salaryRange !== "Not specified" ? salaryRange : "Not specified",
      responsibilities: getListItems(".job-detail.active ul:nth-of-type(2) li"),
      qualifications: getListItems(".job-detail.active ul:nth-of-type(3) li"),
      education: extractEducation(),
      experience: extractExperience(),
      remoteType: (() => {
        const locationElement = findElementByText(
          ".job-detail.active p",
          "Your Location:",
        );
        return locationElement &&
          locationElement.textContent.includes("Remote Eligible")
          ? "Remote Eligible"
          : "Not specified";
      })(),
      jobType: "Full-time", // Assuming all Airbnb jobs are full-time
      postedDate: "Not specified", // This information is not available in the provided HTML
      applicationDeadline: "Not specified", // This information is not available in the provided HTML
      companyDescription: getElementText(".content-intro"),
      benefits: (() => {
        const benefitsElement = findElementByText(
          ".job-detail.active p",
          "How We'll Take Care of You:",
        );
        return benefitsElement
          ? benefitsElement.textContent.trim()
          : "Not specified";
      })(),
    };
  });
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

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
