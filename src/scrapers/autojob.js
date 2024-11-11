import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    await page.goto('https://automattic.com/work-with-us/');

    const jobDetails = await page.evaluate(() => {
      const jobs = [];
      const jobCards = document.querySelectorAll('.job-card');

      if (jobCards.length === 0) {
        throw new Error('No job listings found.');
      }

      jobCards.forEach(job => {
        const title = job.querySelector('.job-card-header h3')?.innerText;
        const link = job.href;
        const category = job.querySelector('.job-card-category')?.innerText;

        jobs.push({ title, link, category });
      });

      return jobs;
    });

    console.log(`Found ${jobDetails.length} jobs in Automattic jobs.`);
    console.log(jobDetails);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  } finally {
    await browser.close();
  }
})();