import { createPage } from '../utils/browser.js';
import logger from '../utils/logger.js';

export async function scrapeStripeJobs(browser) {
    const url = 'https://stripe.com/jobs/search';
    const page = await createPage(browser);

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });
        logger.info(`Navigated to ${url}`);

        const jobs = await page.evaluate(() => {
            const jobListings = [];
            const table = document.querySelector('.Table__table'); // Select the table
            const rows = table?.querySelectorAll('.TableRow') || []; // Select all rows in the table

            rows.forEach(row => {
                const cells = row.querySelectorAll('td'); // Assuming the job data is in table cells
                const jobTitle = cells[0]?.innerText || 'No title'; // Adjust index based on actual column
                const department = cells[1]?.innerText || 'No department'; // Adjust index based on actual column
                const jobUrl = row.querySelector('a')?.href || 'No URL';  // Get the job link from anchor tag
                const location = cells[2]?.innerText || "Remote";
                
                if (jobTitle !== 'No title' && jobUrl !== 'No URL') {
                    jobListings.push({
                        department: department,
                        title: jobTitle,
                        url: jobUrl,
                        company: 'Stripe Jobs', 
                        location: location,
                    });
                }
            });

            return jobListings;
        });

        logger.info(`Found ${jobs.length} jobs with descriptions`);
        return jobs;
    } catch (error) {
        logger.error(`Error scraping jobs: ${error.message}`);
        return [];
    } finally {
        await page.close();
    }
}
