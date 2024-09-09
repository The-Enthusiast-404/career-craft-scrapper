import { config } from "../config.js";
import logger from "../utils/logger.js";

export async function scrapePhonePeJobs(page) {
  const { url, selectors, targetText } = config.phonepe;

  try {
    await page.goto(url, { waitUntil: "networkidle0" });
    await page.waitForSelector(selectors.jobCard);

    const jobs = await page.evaluate((selectors) => {
      const jobCards = document.querySelectorAll(selectors.jobCard);
      return Array.from(jobCards).map((card) => ({
        title: card.querySelector(selectors.title)?.textContent.trim() || "",
        company: "PhonePe",
        department:
          card.querySelector(selectors.department)?.textContent.trim() || "",
        location:
          card.querySelector(selectors.location)?.textContent.trim() || "",
        type: card.querySelector(selectors.type)?.textContent.trim() || "",
        url: card.getAttribute("href") || "",
        jobCode: card.getAttribute("href")?.split("/").pop() || "",
        createdDate: new Date().toISOString(),
        modifiedDate: new Date().toISOString(),
      }));
    }, selectors);

    return jobs;
  } catch (error) {
    logger.error(`Error scraping PhonePe jobs: ${error.message}`);
    throw error;
  }
}
