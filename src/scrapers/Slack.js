import puppeteer from "puppeteer";

export async function ScrapSlackJobs(browser) {
    const page = await browser.newPage();
    await page.goto("https://slack.com/intl/en-in/careers", { waitUntil: 'networkidle0' });

    // Adjusting the selectors based on the updated Slack careers page structure
    const jobs = await page.$$eval('.job-listing', jobElements => {
        return jobElements.map(jobElement => {
            const titleElement = jobElement.querySelector('p.job-listing__table-title');
            const locationElement = jobElement.querySelector('p.job-listing__table-location');
            const linkElement = jobElement.querySelector('a.o-section--feature__link');

            const title = titleElement ? titleElement.innerText.trim() : 'No title';
            const location = locationElement ? locationElement.innerText.trim() : 'No location';
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
