import puppeteer from "puppeteer";

export async function ScrapLyfJobs() {
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
   // Now we go to Lyft Careers page
   await page.goto("https://www.lyft.com/careers", {waitUntil:'networkidle2'})
   // Scrape the job data 
   const jobs = await page.evaluate(() => {
    const jobElements = document.querySelectorAll(".jobs-card")
    const jobdata = Array.from(jobElements).map(job => ({
        title: job.querySelector('.job-title').innerText.trim(),
        location: job.querySelector('.job-location').innerText.trim,
        category: job.querySelector('.job-category').innerText.trim(),
    }))
    return jobdata;
   })
   await browser.close();
   return jobs
} 