import { launchBrowser, createPage } from "./utils/browser.js";
import { scrapePhonePeJobs } from "./scrapers/phonepe.js";
import { scrapeFlipkartJobs } from "./scrapers/flipkart.js";
import logger from "./utils/logger.js";
import fs from "fs/promises";

async function main() {
  let browser;
  try {
    // Scrape PhonePe jobs
    browser = await launchBrowser();
    const page = await createPage(browser);
    const phonePeJobs = await scrapePhonePeJobs(page);
    logger.info(`Found ${phonePeJobs.length} PhonePe jobs`);

    // Log PhonePe jobs to a file
    await logJobsToFile(phonePeJobs, "phonepe_jobs.json");

    // Console output for PhonePe jobs
    console.log("PhonePe Jobs:");
    console.table(
      phonePeJobs.map((job) => ({
        Title: truncateString(job.title, 47),
        Department: truncateString(job.department, 27),
        Location: truncateString(job.location, 27),
        Type: truncateString(job.type, 12),
        Date: job.date,
      })),
    );

    // Scrape Flipkart jobs
    const flipkartJobs = await scrapeFlipkartJobs();
    logger.info(`Found ${flipkartJobs.length} Flipkart jobs`);

    // Log Flipkart jobs to a file
    await logJobsToFile(flipkartJobs, "flipkart_jobs.json");

    // Console output for Flipkart jobs
    console.log("\nFlipkart Jobs:");
    console.table(
      flipkartJobs.map((job) => ({
        Title: truncateString(job.title, 40),
        Department: truncateString(job.department, 20),
        Location: truncateString(job.location, 20),
        Experience: job.experience,
        Skills: truncateString(job.skills, 50),
        JobCode: job.jobCode,
        CreatedDate: job.createdDate,
        ModifiedDate: job.modifiedDate,
      })),
    );
  } catch (error) {
    logger.error(`An error occurred: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function truncateString(str, maxLength) {
  if (str && str.length > maxLength) {
    return str.slice(0, maxLength - 3) + "...";
  }
  return str || "";
}

async function logJobsToFile(jobs, filename) {
  try {
    await fs.writeFile(filename, JSON.stringify(jobs, null, 2));
    logger.info(`Jobs logged to ${filename}`);
  } catch (error) {
    logger.error(`Error writing to ${filename}: ${error.message}`);
  }
}

main();
