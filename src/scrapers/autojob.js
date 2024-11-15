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
        const companyName = document.querySelector('#wrapper > header > h1')?.innerText; 
        const jobTitle = job.querySelector('.job-card-header h3')?.innerText;
        const link = job.href; 
        const category = job.querySelector('.job-card-category')?.innerText;
        const teamProduct = job.querySelector('.job-card-team')?.innerText;
        const cardType = job.querySelector('.job-card-type')?.innerText; 

     

              // Get requirements
      //const requirements = Array.from(document.querySelectorAll('#content > ul > li')).map(li => li.innerText)

        jobs.push({
          jobTitle,
          link,
          category,
          teamProduct,
          cardType,
          companyName
          //requirements,
        
        });
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