import logger from "../utils/logger.js";

const DROPBOX_JOBS_URL = "https://jobs.dropbox.com/all-jobs";
const selector = {
  jobGroup: ".open-positions__listing-group",
  jobDepartment: ".open-positions__dept-title-link",
  jobLink: ".open-positions__listing-link",
  jobLocation: ".open-positions__listing-location",
  jobTitle: ".open-positions__listing-title",
};

export async function scrapeDropbox(browser) {
  const page = await browser.newPage();

  try {
    logger.info("Navigating to Dropbox jobs page");
    await page.goto(DROPBOX_JOBS_URL, { waitUntil: "networkidle0" });

    // Function to extract jobs from the current page
    const extractJobs = async () => {
      return page.evaluate((selector) => {
        const jobLinks = document.querySelectorAll(selector.jobLink);
        
        return Array.from(jobLinks).map((element) => {
          const groupElement = element.closest(selector.jobGroup);
          const departmentElement = groupElement.querySelector(selector.jobDepartment);
          const titleElement = element.querySelector(selector.jobTitle);
          const locationElement = element.querySelector(selector.jobLocation);
          const url = element.getAttribute("href");

          return {
            title: titleElement?.textContent.trim() || "",
            location: locationElement?.textContent.trim() || "",
            department: departmentElement?.textContent.trim() || "",
            company: "Dropbox",
            url,
          };
        });
      }, selector, findJobListing);
    };

    const jobs = await extractJobs();

    logger.info(`Found ${jobs.length} Dropbox jobs`);
    return jobs;
  } catch (error) {
    logger.error(`Error scraping Spotify jobs: ${error.message}`);
    throw error;
  } finally {
    await page.close();
  }
}
