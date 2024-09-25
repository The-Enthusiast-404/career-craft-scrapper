import puppeteer from "puppeteer";

export async function ScrapSlackJobs(browser) {
    const page = await browser.newPage();
    await page.goto("https://slack.com/intl/en-in/careers", { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForSelector('.job-listing__table tbody', { visible: true, timeout: 60000 });

    const jobs = await page.$$eval('.job-listing__table tbody tr', jobElements => {
        return jobElements.map(jobElement => {
            const titleElement = jobElement.querySelector('.job-listing__table-title');
            const linkElement = jobElement.querySelector('a.o-section--feature__link');
            
            const title = titleElement ? titleElement.textContent.trim() : 'No title';
            const link = linkElement ? linkElement.href : 'No link';

            return {
                title,
                location,
                company: "Slack",
                url: link
            };
        });
    });

    await page.close();
    return jobs;
}
