import puppeteer from 'puppeteer';

async function scrapeGitLabJobs() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    await page.goto('https://about.gitlab.com/jobs/all-jobs/');

    // Wait for the first job listing to appear with a reasonable timeout
    await page.waitForSelector('.jobs-content', { timeout: 30000 });

    const jobListings = await page.$$('.jobs-content');

    const jobs = [];
    for (const jobListing of jobListings) {
      const titleElement = await jobListing.$('.nav-hoc .navigation-dropdown__popover a');
      const locationElement = await jobListing.$('.slp-mb-8');
      const linkElement = await jobListing.$('.job__link');
      if (titleElement && locationElement) {
        const title = await titleElement.evaluate(el => el.textContent.trim());
        const link = await titleElement.getProperty('href').then(property => property.jsonValue());
        const location = await locationElement.evaluate(el => el.textContent.trim());

        jobs.push({ title, link, location });
      } else {
        console.warn('Could not find title or location for a job listing.');
      }
    }

    console.log(jobs);
  } catch (error) {
    console.error('Error scraping GitLab jobs:', error);
  } finally {
    await browser.close();
  }
}

scrapeGitLabJobs();