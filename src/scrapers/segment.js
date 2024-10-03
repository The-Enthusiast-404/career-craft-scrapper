import logger from "../utils/logger.js";
import {
  parseJobDescription,
  defaultKeywordSets,
  createKeywordMatcher,
} from "../utils/jobDescriptionParser.js";

const SEGMENT_JOBS_URL =
  "https://www.twilio.com/en-us/company/jobs/jcr:content/root/global-main/section/column_control/column-0/jobs_component.jobs.json";

export async function scrapeSegmentJobs(browser) {
  const page = await browser.newPage();

  try {
    logger.info("Navigating to Segment jobs page");
    await page.goto(SEGMENT_JOBS_URL, { waitUntil: "networkidle0" });

    const rawData = await page.evaluate(() =>
      JSON.parse(document.querySelector("body").innerText),
    );
    const jobs = rawData.offices
      .map((office) => {
        const { name, location, departments } = office;
        const remote = name.includes("Remote");
        const locationName = location || name;

        return departments
          .filter((department) => department.jobs.length > 0)
          .map((department) => {
            const { jobs, name: departmentName } = department;
            return jobs.map((job) => ({
              title: job.title,
              url: job.absolute_url,
              company: "Segment",
              location: locationName,
              department: departmentName,
              remote,
            }));
          })
          .flat();
      })
      .flat();

    logger.info(`Found ${jobs.length} Segment jobs. Scraping details...`);
    return jobs;
  } catch (error) {
    logger.error(`Error scraping Segment jobs: ${error.message}`);
    throw error;
  } finally {
    await page.close();
  }
}
