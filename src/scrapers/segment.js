import logger from "../utils/logger.js";

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

    for (const job of jobs) {
      try {
        await page.goto(job.url, { waitUntil: "networkidle0" });
        const jobDetails = await page.evaluate(() => {
          const jobDescription = document.querySelector(".job__description");

          const findSectionContent = (sectionName) => {
            const sectionHeader = Array.from(
              jobDescription.querySelectorAll("h2"),
            ).find((element) => element.textContent.includes(sectionName));

            if (!sectionHeader) {
              return "";
            }

            let content = "";
            let nextElement = sectionHeader.nextElementSibling;
            while (nextElement && !nextElement.matches("h2")) {
              content += nextElement.textContent.trim() + "\n";
              nextElement = nextElement.nextElementSibling;
            }

            return content.trim();
          }

          return {
            description: jobDescription?.innerText.trim() || "",
            salary: "",
            requirements: findSectionContent("Qualifications"),
            responsibilities: findSectionContent("Responsibilities"),
            // benefits: findSectionContent("Benefits"),
            companyDescription: findSectionContent("See yourself at Twilio"),
            // teamDescription: findSectionContent("Team Description"),
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
    logger.error(`Error scraping Segment jobs: ${error.message}`);
    throw error;
  } finally {
    await page.close();
  }
}
