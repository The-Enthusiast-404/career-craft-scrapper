import { createPage } from '../utils/browser.js';
import logger from '../utils/logger.js';

export async function GitlabJobScrapper(browser) {
  const page = await createPage(browser);
  const GitlabUrl = 'https://about.gitlab.com/jobs/all-jobs/'; 

  try {
    await page.goto(GitlabUrl, { waitUntil: 'domcontentloaded' });
    logger.info('Navigated to Gitlab Careers page');

    // Wait for the job listings to appear (update the selector accordingly)
    await page.waitForSelector('.sc-q480ss-0.euPhRP');

    // Extract job data
    const jobs = await page.evaluate(() => {
      const jobElements = document.querySelectorAll('a.sc-6f8405d2-0.gxEijG');
      return Array.from(jobElements).map(job => ({
        title: job.querySelector('h2.sc-cx1xxi-0.bKMOol')?.innerText,
        company: 'Lyft',
        url: job.href,
        location: 'Location info',
        description: 'Description info', 
      }));
    });

    return jobs;

  } catch (error) {
    logger.error(`Failed to scrape Lyft jobs: ${error.message}`);
    return [];
  } finally {
    await page.close();
  }
}