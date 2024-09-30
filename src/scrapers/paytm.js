import puppeteer from "puppeteer";
import {
  parseJobDescription,
  defaultKeywordSets,
} from "../utils/jobDescriptionParser.js";
import logger from "../utils/logger.js";

const PAYTM_JOBS_URL = "https://jobs.lever.co/paytm";

export async function scrapePaytmJobs(browser) {
  const page = await browser.newPage();
  logger.info("Navigating to Paytm jobs page...");
  try {
    await page.goto(PAYTM_JOBS_URL, {
      waitUntil: "networkidle0",
    });

    const jobs = await page.evaluate(() => {
      const jobListings = [];
      const postings = document.querySelectorAll(".posting");
      postings.forEach((posting) => {
        const titleElement = posting.querySelector(
          'h5[data-qa="posting-name"]',
        );
        const linkElement = posting.querySelector("a.posting-btn-submit");
        const locationElement = posting.querySelector(
          ".sort-by-time.posting-category:nth-child(1)",
        );
        const departmentElement = posting.querySelector(
          ".sort-by-team.posting-category",
        );
        const commitmentElement = posting.querySelector(
          ".sort-by-commitment.posting-category",
        );
        const workplaceTypeElement = posting.querySelector(
          ".sort-by-time.posting-category:nth-child(4)",
        );

        if (titleElement && linkElement) {
          const title = titleElement.innerText.trim();
          const url = linkElement.href;
          const company = "Paytm";
          const location = locationElement
            ? locationElement.innerText.trim()
            : "";
          const department = departmentElement
            ? departmentElement.innerText.trim()
            : "";
          const commitment = commitmentElement
            ? commitmentElement.innerText.trim()
            : "";
          const workplaceType = workplaceTypeElement
            ? workplaceTypeElement.innerText.trim()
            : "";

          jobListings.push({
            title,
            url,
            company,
            location,
            department,
            commitment,
            workplaceType,
          });
        }
      });
      return jobListings;
    });

    logger.info(`Found ${jobs.length} Paytm job listings`);

    // Scrape job descriptions and additional details
    for (const job of jobs) {
      try {
        await page.goto(job.url, { waitUntil: "networkidle0" });
        const jobDescription = await page.evaluate(() => {
          const descriptionElement = document.querySelector(
            '.section[data-qa="job-description"]',
          );
          return descriptionElement ? descriptionElement.innerText.trim() : "";
        });

        // Use the updated parser with custom keyword sets for Paytm
        const paytmKeywordSets = {
          ...defaultKeywordSets,
          // Add or modify keyword sets specific to Paytm job listings
          experience: [
            "experience",
            "years of experience",
            "work experience",
            "years",
          ],
          skills: ["superpowers", "skills", "requirements", "qualifications"],
          education: ["education", "degree", "qualification"],
        };

        const parsedInfo = parseJobDescription(
          jobDescription,
          paytmKeywordSets,
        );

        // Merge the parsed info with the existing job data
        Object.assign(job, parsedInfo, { description: jobDescription });

        // Log each job's details for debugging
        logger.info(`Job Details for "${job.title}":`);
        Object.entries(job).forEach(([key, value]) => {
          if (key === "description") {
            logger.info(`  ${key}: ${value.substring(0, 100)}...`); // Log first 100 characters of description
          } else {
            logger.info(`  ${key}: ${value}`);
          }
        });
      } catch (error) {
        logger.error(
          `Error scraping details for job ${job.title}: ${error.message}`,
        );
      }
    }

    return jobs;
  } catch (error) {
    logger.error(`Error scraping Paytm jobs: ${error.message}`);
    return [];
  } finally {
    await page.close();
  }
}
