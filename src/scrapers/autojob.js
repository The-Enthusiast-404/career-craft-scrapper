import puppeteer from 'puppeteer';

async function scrapeAutomatticJobs() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    await page.goto('https://automattic.com/work-with-us/');

    
    await page.waitForSelector('.job-listing', { timeout: 60000 });

    const jobListings = await page.$$('.job-listing'); 

    const jobs = [];
    for (const jobListing of jobListings) {
        const titleElement = await jobListing.$('.job-card-header a');
        const locationElement = await jobListing.$('.job-location');
        const linkElement = await jobListing.$('.job-card-link');

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
    console.error('Error scraping Automattic jobs:', error);
  } finally {
    await browser.close();
  }
}

scrapeAutomatticJobs();