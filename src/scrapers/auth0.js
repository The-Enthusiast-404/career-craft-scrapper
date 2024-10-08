import logger from "../utils/logger.js";

const AUTH0_JOBS_URL = "https://www.okta.com/company/careers/";

export async function scrapeAuth0Jobs(browser) {
  const page = await browser.newPage();

  try {
    logger.info("Navigating to Auth0 jobs page");
    await page.goto(AUTH0_JOBS_URL, { waitUntil: "networkidle0" });

    const jobs = await page.evaluate(() => {
      const jobElements = document.querySelectorAll(".CareersView__content > .views-row");
      
      return Array.from(jobElements)
        .map((element) => ({
          title: element.querySelector(".views-field-title")?.textContent.trim() || "",
          url: element.querySelector(".views-field-title a")?.href || "",
          company: "Auth0",
          location: element.querySelector(".views-field-field-job-location")?.textContent.trim() || "",
          department: "",
        }));
    });

    logger.info(`Found ${jobs.length} Auth0 jobs. Scraping details...`);

    for (const job of jobs) {
      try {
        await page.goto(job.url, { waitUntil: "networkidle0" });
        const jobDetails = await page.evaluate(() => {
          const jobDescription = document.querySelector("article");
          if (!jobDescription) return {};

          const findSectionContent = (sectionName) => {
            const sectionHeader = Array.from(jobDescription.querySelectorAll("p > strong"))
              .find((element) => element.textContent.includes(sectionName));
            if (!sectionHeader) return "";

            let content = "";
            let nextElement = sectionHeader.parentElement.nextElementSibling;
            while (nextElement && !nextElement.matches("p") && !nextElement.firstElementChild.matches("strong")) {
              content += nextElement.textContent.trim() + "\n";
              nextElement = nextElement.nextElementSibling;
            }

            return content.trim();
          }

          function extractCompanyDescription() {
            return jobDescription.querySelector("p > span > strong")
              .parentElement
              .parentElement
              ?.textContent.trim()
              .replace("Get to know Okta", "") || "";
          }

          function extractRequirements() {
            return findSectionContent("What you’ll bring to the role") 
              + "\n" 
              + findSectionContent("And extra credit if you have experience in any of the following!");
          }

          const department = jobDescription.querySelector(".Breadcrumb .list-item:nth-child(2)")
              ?.textContent.trim() || "";

          return {
            description: jobDescription?.innerText.trim() || "",
            department: department,
            salary: "",
            requirements: extractRequirements(),
            responsibilities: findSectionContent("What you’ll be doing"),
            benefits: findSectionContent("What you can look forward to as an Full-Time Okta employee!"),
            companyDescription: extractCompanyDescription(),
            teamDescription: findSectionContent(department),
            roleDescription: findSectionContent("About the job"),
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
    logger.error(`Error scraping Auth0 jobs: ${error.message}`);
    throw error;
  } finally {
    await page.close();
  }
}
