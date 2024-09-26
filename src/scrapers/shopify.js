import puppeteer from "puppeteer";
import * as cheerio from "cheerio";

import logger from "../utils/logger.js";

export async function scrapeShopifyJobs(browser) {
  const page = await browser.newPage();

  logger.info("Navigating to Shopify jobs page");

  try {
    await page.goto("https://www.shopify.com/careers", {
      waitUntil: "networkidle2",
    });

    const content = await page.content();
    const $ = cheerio.load(content);
    const baseUrl = "https://www.shopify.com";
    const jobs = [];

    $("div.mb-8, div.mb-10").each((index, element) => {
      const jobTitles = [];
      const jobUrls = [];
      const jobLocations = [];

      // Extract job titles, URLs, and locations
      $(element)
        .find("h3.mb-2")
        .each((i, el) => {
          jobTitles.push($(el).text().trim());
        });
      $(element)
        .find("a")
        .each((i, el) => {
          const relativeUrl = $(el).attr("href");
          jobUrls.push(relativeUrl ? baseUrl + relativeUrl : "#");
        });
      $(element)
        .find("div.flex.items-center span")
        .each((i, el) => {
          jobLocations.push($(el).text().trim());
        });

      // Combine extracted data into organized job objects
      for (let i = 0; i < jobTitles.length; i++) {
        jobs.push({
          title: jobTitles[i] || "No Title",
          url: jobUrls[i] || "#",
          location: jobLocations[i] || "Location not specified",
          company: "Shopify",
        });
      }
    });

    logger.info(`Scraped ${jobs.length} Shopify jobs`);
    return jobs;
  } catch (error) {
    logger.error(`Error while scraping Shopify jobs: ${error.message}`);
    return [];
  } finally {
    await browser.close();
  }
}
