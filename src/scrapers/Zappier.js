import { createPage } from '../utils/browser.js';
import logger from '../utils/logger.js';

export async function scrapeZappierJobs(browser) {
    const url = 'https://zapier.com/jobs';
    const page = await createPage(browser);

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });
        logger.info(`Navigated to ${url}`);

        const jobs = await page.evaluate(() => {
            const jobListings = [];
            const departments = document.querySelectorAll('ul li.css-1l5s92d-JobBoard__department');
        
            departments.forEach(department => {
                const departmentName = department.querySelector('h3.css-xry1pd-JobBoard__departmentHeading')?.innerText || 'No department name';         
                const jobLinks = department.querySelectorAll('ul.css-1l0bv5k-JobBoard__jobList li.css-1p043s2-JobBoard__job');
                
                jobLinks.forEach(job => {
                    const jobTitle = job.querySelector('a')?.innerText || 'No title';  // Get job title
                    const jobUrl = job.querySelector('a')?.href || 'No URL';  
        
                    if (jobTitle !== 'No title' && jobUrl !== 'No URL') {
                        jobListings.push({
                            department: departmentName,
                            title: jobTitle,
                            url: jobUrl,
                            company: 'Zapier',
                            location: 'As per mentioned in the link',
                        });
                    }
                });
            });
        
            return jobListings;
        });
        
        

        logger.info(`Found ${jobs.length} Zappier jobs with descriptions`);
        return jobs;
    } catch (error) {
        logger.error(`Error scraping Zappier jobs: ${error.message}`);
        return [];
    } finally {
        await page.close();
    }
}
