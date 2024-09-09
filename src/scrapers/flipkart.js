// scrapers/flipkart.js

import axios from "axios";
import FormData from "form-data";
import { config } from "../config.js";
import logger from "../utils/logger.js";

export async function scrapeFlipkartJobs() {
  const { url } = config.flipkart;
  let allJobs = [];
  let hasMoreJobs = true;
  let paginationStartNo = 0;

  try {
    while (hasMoreJobs) {
      const formData = new FormData();
      formData.append(
        "filterCri",
        JSON.stringify({
          paginationStartNo,
          selectedCall: "sort",
          sortCriteria: {
            name: "modifiedDate",
            isAscending: false,
          },
        }),
      );
      formData.append("domain", "www.flipkartcareers.com");

      const response = await axios.post(url, formData, {
        headers: {
          ...formData.getHeaders(),
          accept: "application/json, text/plain, */*",
          "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
          dnt: "1",
          origin: "https://www.flipkartcareers.com",
          referer: "https://www.flipkartcareers.com/",
          "sec-ch-ua": '"Chromium";v="127", "Not)A;Brand";v="99"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "cross-site",
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
        },
      });

      const jobs = parseJobsFromResponse(response.data);

      allJobs = allJobs.concat(jobs);

      logger.info(
        `Fetched ${jobs.length} Flipkart jobs. Total: ${allJobs.length}`,
      );

      hasMoreJobs = response.data.data.hasMoreData;
      paginationStartNo += jobs.length;

      // Add a delay to avoid overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return allJobs;
  } catch (error) {
    logger.error(`Error scraping Flipkart jobs: ${error.message}`);
    throw error;
  }
}

function parseJobsFromResponse(data) {
  const jobsData = data.data.data;
  return jobsData.map((job) => ({
    title: job._source.jobTitle,
    company: "Flipkart",
    department: job._source.DepartmentName,
    location: job._source.location,
    type: "Full-time", // Assuming all Flipkart jobs are full-time
    url: `https://www.flipkartcareers.com/#!/jobdetails/${job._source.jobCode}`,
    description: job._source.Description,
    experience:
      job._source.yrsOfExperience ||
      `${job._source.minYearOfExperience || 0} to ${job._source.maxYearOfExperience || "Not specified"} Years`,
    skills: job._source.mandatorySkills
      ? job._source.mandatorySkills.join(", ")
      : "Not specified",
    jobCode: job._source.jobCode,
    createdDate: new Date(job._source.createdDate).toISOString(),
    modifiedDate: new Date(job._source.modifiedDate).toISOString(),
  }));
}
