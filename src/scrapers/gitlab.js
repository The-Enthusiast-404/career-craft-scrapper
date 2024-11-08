import puppeteer from 'puppeteer';

async function scrapeGitLabJobs() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    await page.goto('https://about.gitlab.com/jobs/all-jobs/');

    
    await page.waitForSelector('.department-accordion', { timeout: 30000 });

    const jobListings = await page.$$('.department-accordion'); 

    const jobs = [];
    for (const jobListing of jobListings) {
      const titleElement = await jobListing.$('.job__link'); 
      const locationElement = await jobListing.$('p'); 
      const linkElement = await jobListing.$('.job__link'); 

      if (titleElement && locationElement) {
        const title = await titleElement.evaluate(el => el.textContent.trim());
        const link = await linkElement.getProperty('href').then(property => property.jsonValue());
        const location = await locationElement.evaluate(el => el.textContent.trim());

      
        const locationParts = location.split(','); 

        jobs.push({ title, link, location: locationParts[0].trim() }); 
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