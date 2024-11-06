import puppeteer from 'puppeteer';

async function scrapeGitLabJobs() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://about.gitlab.com/jobs/all-jobs/');

  // Wait for the page to fully load, including dynamic content
  await page.waitForSelector('.job-listing');

  const jobListings = await page.$$('.job-listing');

  const jobs = [];
  for (const jobListing of jobListings) {
    const title = await jobListing.$eval('.job-title', el => el.textContent.trim());
    const link = await jobListing.$eval('.job__link', el => el.href);
    const location = await jobListing.$eval('.job-location', el => el.textContent.trim());

    jobs.push({ title, link, location });
  }

  await browser.close();

  console.log(jobs);
}

scrapeGitLabJobs();