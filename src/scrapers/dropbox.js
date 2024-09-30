import logger from "../utils/logger.js";
import {
  parseJobDescription,
  defaultKeywordSets,
  createKeywordMatcher,
} from "../utils/jobDescriptionParser.js";

const DROPBOX_JOBS_URL = "https://jobs.dropbox.com/all-jobs";

export async function scrapeDropbox(browser) {
  const page = await browser.newPage();
  try {
    logger.info("Navigating to Dropbox jobs page");
    await page.goto(DROPBOX_JOBS_URL, { waitUntil: "networkidle0" });

    const jobs = await page.evaluate(() => {
      const jobElements = document.querySelectorAll(
        ".open-positions__listing-link",
      );
      return Array.from(jobElements).map((element) => ({
        title:
          element
            .querySelector(".open-positions__listing-title")
            ?.textContent.trim() || "",
        url: element.href,
        company: "Dropbox",
        location:
          element
            .querySelector(".open-positions__listing-location")
            ?.textContent.trim() || "",
        department:
          element
            .closest(".open-positions__listing-group")
            ?.querySelector(".open-positions__dept-title-link")
            ?.textContent.trim() || "",
      }));
    });

    logger.info(`Found ${jobs.length} Dropbox jobs. Scraping details...`);

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

          return {
            description:
              document.querySelector(".jc03-content")?.innerText.trim() || "",
            salary: extractSalaryInfo(),
            requirements: findSectionContent("Requirements"),
            responsibilities: findSectionContent("Responsibilities"),
            benefits: findSectionContent("Benefits"),
            companyDescription: findSectionContent("Company Description"),
            teamDescription: findSectionContent("Team Description"),
            roleDescription: findSectionContent("Role Description"),
          };
        });

        // Use the updated parser with custom keyword sets for Dropbox
        const dropboxKeywordSets = {
          ...defaultKeywordSets,
          salary: ["Total Rewards", "salary", "compensation"],
          remote: createKeywordMatcher([
            "Virtual First",
            "remote",
            "work from home",
          ]),
          experience: ["years of experience", "experience"],
          education: ["Bachelor's degree", "Master's degree", "PhD"],
        };

        const parsedInfo = parseJobDescription(
          jobDetails.description,
          dropboxKeywordSets,
        );

        // Convert the remote field to a boolean
        parsedInfo.remote = !!parsedInfo.remote;

        // Merge the scraped details and parsed info with the existing job data
        Object.assign(job, jobDetails, parsedInfo);

        logger.info(`Scraped details for job: ${job.title}`);
      } catch (error) {
        logger.error(
          `Error scraping details for job ${job.title}: ${error.message}`,
        );
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
