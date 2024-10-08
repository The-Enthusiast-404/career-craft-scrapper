import puppeteer from 'puppeteer';
import { GITHUB_JOBS_URL, scrapeGithub, jobDetailEvaluation } from './github.js';

vi.setConfig({ testTimeout: 300000 });

describe('Github Jobs Scraper', () => {
  it('scrapeGithub', async () => {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const jobs = await scrapeGithub(browser);
    console.log(jobs);
  });

  it('jobDetailEvaluation', async () => {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto('https://www.github.careers/careers-home/jobs/3406?lang=en-us');

    const jobDetail = await page.evaluate(jobDetailEvaluation);
    console.log(jobDetail);
  });
});