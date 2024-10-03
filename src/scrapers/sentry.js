import logger from "../utils/logger.js";
import {
  parseJobDescription,
  defaultKeywordSets,
  createKeywordMatcher,
} from "../utils/jobDescriptionParser.js";

const SENTRY_JOBS_URL = "https://sentry.io/careers/";

export async function scrapeSentry(browser) {
  const page = await browser.newPage();
  try {
    logger.info("Navigating to Sentry jobs page");
    await page.goto(SENTRY_JOBS_URL, { waitUntil: "networkidle0" });

    const jobs = await page.evaluate(() => {
      const departmentElements = document.querySelectorAll("#openings > div");
      return Array.from(departmentElements).map((element) => {
        const department = element.querySelector("h3").textContent.trim() || "";
        const jobElements = element.querySelectorAll("a[href^='/careers']");
        return Array.from(jobElements).map((jobElement) => ({
          title: jobElement.textContent.trim(),
          url: jobElement.href,
          company: "Sentry",
          location: jobElement.querySelector("p")?.textContent.trim() || "",
          department,
        }));
      }).flat();
    });

    logger.info(`Found ${jobs.length} Sentry jobs. Scraping details...`);

    for (const job of jobs) {
      try {
        await page.goto(job.url, { waitUntil: "networkidle0" });
        const jobDetails = await page.evaluate(() => {
          const extractCompanyInfo = () => {
            const introElement = document.querySelector(".content-intro");
            const contentElement = introElement.querySelectorAll("p");
            return Array.from(contentElement)
              .map((el) => el.textContent.trim() || "")
              .join("\n");
          };

          const findSectionContent = (headingText) => {
            const headings = Array.from(document.querySelectorAll("h2"));
            const targetHeading = headings.find((h) =>
              h.textContent.toLowerCase().includes(headingText.toLowerCase()),
            );
            if (targetHeading) {
              let content = "";
              let nextElem = targetHeading.nextElementSibling;
              while (nextElem && nextElem.tagName !== "H2") {
                content += nextElem.innerText + "\n";
                nextElem = nextElem.nextElementSibling;
              }
              return content.trim();
            }
            return "";
          };

          return {
            description: document.querySelector(".content-intro")
              .parentElement.textContent.trim() || "",
            // salary: extractSalaryInfo(),
            requirements: findSectionContent("Qualifications"),
            responsibilities: findSectionContent("In this role you will"),
            // benefits: findSectionContent("Benefits"),
            companyDescription: extractCompanyInfo(),
            // teamDescription: findSectionContent("Team Description"),
            roleDescription: findSectionContent("About the role"),
          };
        });

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
    logger.error(`Error scraping Sentry jobs: ${error.message}`);
    throw error;
  } finally {
    await page.close();
  }
}
