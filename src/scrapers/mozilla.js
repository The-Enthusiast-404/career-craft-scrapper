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
          title: titleElement
            ? titleElement.textContent.trim()
            : "Not specified",
          url: titleElement ? titleElement.href : "Not specified",
          company: "Mozilla",
          location: locationElement
            ? locationElement.textContent.trim()
            : "Not specified",
          team: teamElement ? teamElement.textContent.trim() : "Not specified",
        };
      });
    });

    logger.info(`Found ${jobs.length} Mozilla job listings`);

    // Scrape detailed job information
    for (const job of jobs) {
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

    return jobs;
  } catch (error) {
    logger.error(`Error scraping Mozilla jobs: ${error.message}`);
    return [];
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

    const findElementByText = (selector, text) => {
      const elements = document.querySelectorAll(selector);
      return Array.from(elements).find((el) => el.textContent.includes(text));
    };

    const description = getElementText(".job-post > div:nth-child(2)");

    return {
      title: getElementText(".job-title"),
      location: getElementText(".job-post-location"),
      team: getElementText(".job-post-team"),
      description: description,
      responsibilities: getListItems(
        ".job-post > div:nth-child(2) ul:nth-of-type(1) li",
      ),
      qualifications: getListItems(
        ".job-post > div:nth-child(2) ul:nth-of-type(2) li",
      ),
      experience: (() => {
        const expElement = findElementByText(
          ".job-post > div:nth-child(2) li",
          "years experience",
        );
        return expElement ? expElement.textContent.trim() : "Not specified";
      })(),
      education: (() => {
        const eduElement = findElementByText(
          ".job-post > div:nth-child(2) p, .job-post > div:nth-child(2) li",
          "degree",
        );
        return eduElement ? eduElement.textContent.trim() : "Not specified";
      })(),
      remoteType: (() => {
        const remoteElement = findElementByText(".job-post-location", "Remote");
        return remoteElement ? "Remote" : "Not specified";
      })(),
      jobType: "Full-time", // Assuming all Mozilla jobs are full-time
      postedDate: "Not specified", // This information is not available in the provided HTML
      applicationDeadline: "Not specified", // This information is not available in the provided HTML
      companyDescription: getElementText(
        ".job-post > div:nth-child(2) p:first-of-type",
      ),
      benefits: getListItems(
        ".job-post > div:nth-child(2) ul:nth-last-of-type(1) li",
      ),
      reqId: (() => {
        const reqIdElement = findElementByText(
          ".job-post > div:nth-child(2) p",
          "Req ID:",
        );
        return reqIdElement
          ? reqIdElement.textContent.split("Req ID:")[1].trim()
          : "Not specified";
      })(),
    };
  });
}
