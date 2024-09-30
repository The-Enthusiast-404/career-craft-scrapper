import puppeteer from "puppeteer";
import * as cheerio from "cheerio";
import logger from "../utils/logger.js";

export async function scrapeShopifyJobs(browser) {
  const page = await browser.newPage();

  logger.info("Navigating to Shopify jobs page");

  try {
    // Navigate to Shopify careers page
    await page.goto("https://www.shopify.com/careers", {
      waitUntil: "networkidle0",
    });

    // Get the page content
    const content = await page.content();

    // Load content into Cheerio
    const $ = cheerio.load(content);

    // Initialize an array to hold organized jobs
    const jobs = [];

    // Base URL for constructing absolute URLs
    const baseUrl = "https://www.shopify.com";

    // Iterate over div.mb-8 and div.mb-10 to extract job listings
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
          jobUrls.push(relativeUrl ? baseUrl + relativeUrl : "#"); // Prepend base URL
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
          description: "",
        });
      }
    });

    logger.info(`Scraped ${jobs.length} Shopify jobs. Scraping details...`);

    // Scrape job descriptions
    for (const job of jobs) {
      try {
        if (job.url && job.url !== "#") {
          await page.goto(job.url, { waitUntil: "networkidle2" });

          await page.waitForSelector('div[itemprop="description"] p');

          // Get page content again to load job description
          const jobPageContent = await page.content();
          const $$ = cheerio.load(jobPageContent);

          const jobDescription = $$('div[itemprop="description"] p')
            .first()
            .text()
            .trim();

          job.description = jobDescription || "No description available";
        }
      } catch (error) {
        logger.error(
          `Error scraping job description for ${job.title}: ${error.message}`
        );
        job.description = "Error retrieving description";
      }
    }

    return jobs;
  } catch (error) {
    logger.error(`Error while scraping Shopify jobs: ${error.message}`);
    return [];
  } finally {
    await browser.close();
  }
}
