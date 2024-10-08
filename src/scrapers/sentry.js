import logger from "../utils/logger.js";
import { scrape } from '../utils/scrapper.js'

const SENTRY_JOBS_URL = "https://sentry.io/careers/";

export async function getSentryJobs() {
  const departmentElements = document.querySelectorAll("#openings > div");

  return Array.from(departmentElements)
    .map((element) => {
      const department = element.querySelector("h3")?.textContent.trim() || "";
      const jobElements = element.querySelectorAll("a[href^='/careers']");
      return Array.from(jobElements)
        .map((jobElement) => ({
          title: jobElement?.textContent.trim() || "",
          url: jobElement.href,
          company: "Sentry",
          location: jobElement.querySelector("p")?.textContent.trim() || "",
          department,
        }));
    }).flat();
}

export async function getSentryJobDetail() {
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
    requirements: findSectionContent("Qualifications"),
    responsibilities: findSectionContent("In this role you will"),
    companyDescription: extractCompanyInfo(),
    roleDescription: findSectionContent("About the role"),
  };
}

export async function scrapeSentry(browser) {
  try {
    logger.info("Scraping Sentry jobs page ...");
    return await scrape(browser, SENTRY_JOBS_URL, {
      jobListing: getSentryJobs, 
      jobDetail: getSentryJobDetail,
    });
  } catch (error) {
    logger.error(`Error scraping Sentry jobs: ${error.message}`);
    throw error;
  }
}
