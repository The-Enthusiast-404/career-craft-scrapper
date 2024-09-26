import logger from "../utils/logger.js";

const DROPBOX_JOBS_URL = "https://jobs.dropbox.com/all-jobs";
const selector = {
  jobGroup: ".open-positions__listing-group",
  jobDepartment: ".open-positions__dept-title-link",
  jobLink: ".open-positions__listing-link",
  jobLocation: ".open-positions__listing-location",
  jobTitle: ".open-positions__listing-title",
  jobDescription: ".jc03-content", // Selector for job description
};

export async function scrapeDropbox(browser) {
  const page = await browser.newPage();
  try {
    logger.info("Navigating to Dropbox jobs page");
    await page.goto(DROPBOX_JOBS_URL, { waitUntil: "networkidle0" });

    // Function to extract jobs from the current page
    const extractJobs = async () => {
      const jobs = await page.evaluate((selector) => {
        const jobLinks = document.querySelectorAll(selector.jobLink);
        return Array.from(jobLinks).map((element) => {
          const groupElement = element.closest(selector.jobGroup);
          const departmentElement = groupElement.querySelector(
            selector.jobDepartment
          );
          const titleElement = element.querySelector(selector.jobTitle);
          const locationElement = element.querySelector(selector.jobLocation);
          const url = element.getAttribute("href");
          return {
            title: titleElement?.textContent.trim() || "",
            location: locationElement?.textContent.trim() || "",
            department: departmentElement?.textContent.trim() || "",
            company: "Dropbox",
            url: new URL(url, "https://jobs.dropbox.com").href,
          };
        });
      }, selector);

      return jobs;
    };

    const jobs = await extractJobs();
    logger.info(`Found ${jobs.length} Dropbox jobs`);

    // Extract job descriptions
    for (const job of jobs) {
      try {
        await page.goto(job.url, { waitUntil: "networkidle0" });
        job.description = await page.evaluate((selector) => {
          const descElement = document.querySelector(selector.jobDescription);
          return descElement ? descElement.innerText.trim() : "";
        }, selector);
        logger.info(`Extracted description for job: ${job.title}`);
      } catch (error) {
        logger.error(
          `Error extracting description for job ${job.title}: ${error.message}`
        );
        job.description = ""; // Set empty description if extraction fails
      }
    }

    return jobs;
  } catch (error) {
    logger.error(`Error scraping Dropbox jobs: ${error.message}`);
    throw error;
  } finally {
    await page.close();
  }
}
