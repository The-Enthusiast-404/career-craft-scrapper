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
        department:
          card.querySelector(selectors.department)?.textContent.trim() || "",
        location:
          card.querySelector(selectors.location)?.textContent.trim() || "",
        type: card.querySelector(selectors.type)?.textContent.trim() || "",
        date: card.querySelector(selectors.date)?.textContent.trim() || "",
        url: card.getAttribute("href") || "",
      }));
    }, selectors);

    const foundTargetText = await page.evaluate((targetText) => {
      const element = Array.from(document.querySelectorAll("div")).find((el) =>
        el.textContent.includes(targetText),
      );
      return element ? element.textContent.trim() : null;
    }, targetText);

    if (foundTargetText) {
      logger.info(`Found target text: ${foundTargetText}`);
    }

    return jobs;
  } catch (error) {
    logger.error(`Error scraping PhonePe jobs: ${error.message}`);
    throw error;
  }
}
