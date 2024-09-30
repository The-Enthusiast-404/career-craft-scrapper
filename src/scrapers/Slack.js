import puppeteer from "puppeteer";
import logger from "../utils/logger.js";

export async function scrapeSlackJobs(browser) {
  const page = await browser.newPage();
  try {
    logger.info("Navigating to Slack careers page");
    await page.goto("https://slack.com/intl/en-in/careers", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForSelector(".job-listing__table tbody", {
      visible: true,
      timeout: 60000,
    });

    const jobs = await page.$$eval(
      ".job-listing__table tbody tr",
      (jobElements) => {
        return jobElements
          .filter((jobElement) =>
            jobElement.querySelector(".job-listing__table-title"),
          )
          .map((jobElement) => {
            const titleElement = jobElement.querySelector(
              ".job-listing__table-title",
            );
            const linkElement = jobElement.querySelector(
              "a.o-section--feature__link",
            );
            const locationElement = jobElement.querySelector(
              ".job-listing__table-location",
            );
            return {
              title: titleElement
                ? titleElement.textContent.trim()
                : "Not specified",
              location: locationElement
                ? locationElement.textContent.trim()
                : "Not specified",
              company: "Slack",
              url: linkElement ? linkElement.href : "Not specified",
            };
          });
      },
    );

    logger.info(`Found ${jobs.length} Slack job listings`);

    for (const job of jobs) {
      try {
        await page.goto(job.url, { waitUntil: "networkidle0", timeout: 60000 });

        const jobDetails = await page.evaluate(() => {
          const getElementText = (selector) => {
            const element = document.querySelector(selector);
            return element ? element.textContent.trim() : "Not specified";
          };

          const getListItems = (selector) => {
            const items = document.querySelectorAll(selector);
            return (
              Array.from(items)
                .map((item) => item.textContent.trim())
                .join(", ") || "Not specified"
            );
          };

          const description = getElementText(
            '[data-automation-id="jobPostingDescription"]',
          );

          return {
            remoteType: getElementText('[data-automation-id="remoteType"] dd'),
            timeType: getElementText('[data-automation-id="time"] dd'),
            postedOn: getElementText('[data-automation-id="postedOn"] dd'),
            requisitionId: getElementText(
              '[data-automation-id="requisitionId"] dd',
            ),
            jobCategory: getElementText(".css-qxhsiu p:nth-of-type(2)"),
            role: getElementText("h2"),
            salary: description.match(/salary[^.]*\./i)
              ? description
                  .match(/salary[^.]*\./i)[0]
                  .replace(/salary/i, "")
                  .trim()
              : "Not specified",
            skills: getListItems(".css-qxhsiu ul:nth-of-type(2) li"),
            experience: description.match(/(\d+\+?\s*years?)[^.]*experience/i)
              ? description.match(/(\d+\+?\s*years?)[^.]*experience/i)[1]
              : "Not specified",
            education: description.match(/education:?[^.]*\./i)
              ? description
                  .match(/education:?[^.]*\./i)[0]
                  .replace(/education:?/i, "")
                  .trim()
              : "Not specified",
            department: getElementText(".css-qxhsiu p:nth-of-type(1)"),
            jobType: getElementText('[data-automation-id="time"] dd'),
            applicationDeadline: description.match(/deadline:?[^.]*\./i)
              ? description
                  .match(/deadline:?[^.]*\./i)[0]
                  .replace(/deadline:?/i, "")
                  .trim()
              : "Not specified",
            companyDescription: getElementText(".css-qxhsiu p:nth-of-type(3)"),
            responsibilities: getListItems(".css-qxhsiu ul:nth-of-type(1) li"),
            benefits: description.match(/benefits:?[^.]*\./i)
              ? description
                  .match(/benefits:?[^.]*\./i)[0]
                  .replace(/benefits:?/i, "")
                  .trim()
              : "Not specified",
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
    logger.error(`Error scraping Slack jobs: ${error.message}`);
    return [];
  } finally {
    await page.close();
  }
}
