import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  
  await page.goto('https://automattic.com/work-with-us/');

  const jobDetails = await page.evaluate(() => {
    const jobs = [];
    document.querySelectorAll('.job-card').forEach(job => {
      const title = job.querySelector('.job-card-header h3')?.innerText;
      const link = job.href;
      const category = job.querySelector('.job-card-category')?.innerText;

      jobs.push({ title, link, category });
    });
    return jobs;
  });

  console.log(`Found ${jobDetails.length} jobs in Automattic jobs page.`);
  console.log(jobDetails);

  await browser.close();
})();