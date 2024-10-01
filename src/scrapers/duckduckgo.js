import logger from "../utils/logger.js";
import {
  parseJobDescription,
  defaultKeywordSets,
  createKeywordMatcher,
} from "../utils/jobDescriptionParser.js";

const DUCKDUCKGO_JOBS_URL = "https://duckduckgo.com/hiring";

// Open positions => [class*="careers_openPositions"]
// Job item => [typeof="JobPosting"]
// Department => JobItems.previousElementSibling

export async function scrapeDuckduckgoJobs(browser) {
  const page = await browser.newPage();
  
  try {
    logger.info("Navigating to Duckduckgo jobs page");
    await page.goto(DUCKDUCKGO_JOBS_URL, { waitUntil: "networkidle0" });

    const jobs = await page.evaluate(() => {
      const jobElements = document.querySelectorAll(
        "[typeof='JobPosting']",
      );
      return Array.from(jobElements).map((element) => ({
        title:
          element
            .querySelector("[property='title']")
            ?.textContent.trim() || "",
        url: 
          element
            .querySelector("[property='sameAs']")
            ?.href || "",
        company: "Duckduckgo",
        location:
          element
            .querySelector("[class*='openPositions_headerContainer'] > dl > dd")
            ?.textContent.trim() || "",
        department:
          element
            .previousElementSibling
            ?.textContent.trim() || "",
      }));
    });

    logger.info(`Found ${jobs.length} Duckduckgo jobs. Scraping details...`);

    for (const job of jobs) {
      try {
        await page.goto(job.url, { waitUntil: "networkidle0" });
        const jobDetails = await page.evaluate(() => {
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

          const extractSalaryInfo = () => {
            const salarySection = document.querySelector(
              "div:has(> div > div[data-uw-rm-sr])",
            );
            if (salarySection) {
              return Array.from(
                salarySection.querySelectorAll("div[data-uw-rm-sr]"),
              )
                .map((el) => el.textContent.trim())
                .join(" | ");
            }
            return "";
          };

          const jobDescription = document.querySelector("h3").nextElementSibling;
          const salary = jobDescription
            ?.parentElement
            ?.parentElement
            ?.nextElementSibling
            ?.nextElementSibling
            ?.querySelector('div + div > span + span');

          return {
            description: jobDescription?.innerText.trim() || "",
            salary: salary?.textContent || "",
            // requirements: findSectionContent("Requirements"),
            // responsibilities: findSectionContent("Responsibilities"),
            // benefits: findSectionContent("Benefits"),
            // companyDescription: findSectionContent("Company Description"),
            // teamDescription: findSectionContent("Team Description"),
            // roleDescription: findSectionContent("Role Description"),
          };
        });

        // Merge the scraped details and parsed info with the existing job data
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
    logger.error(`Error scraping Duckduckgo jobs: ${error.message}`);
    throw error;
  } finally {
    await page.close();
  }
}
