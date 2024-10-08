import puppeteer from 'puppeteer';
import { GITHUB_JOBS_URL, scrapeGithub } from './github.js';

vi.setConfig({ testTimeout: 30000 });

describe('Github Jobs Scraper', () => {
  it('should scrape the job listings from the Github jobs page', async () => {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const jobs = await scrapeGithub(browser);
    expect(jobs).toEqual([]);
  });
});
