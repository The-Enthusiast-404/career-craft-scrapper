import axios from "axios";
import logger from "./logger.js";

const API_URL = "http://localhost:8080/jobs/bulk";

export async function sendJobsToAPI(jobs) {
  try {
    logger.info(`Sending ${jobs.length} jobs to API`);
    const response = await axios.post(API_URL, jobs);
    logger.info(`API response: ${JSON.stringify(response.data)}`);
    return response.data;
  } catch (error) {
    logger.error(`Error sending jobs to API: ${error.message}`);
    if (error.response) {
      logger.error(`API response: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}
