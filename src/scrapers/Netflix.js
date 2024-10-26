import { createPage } from '../utils/browser.js';
import logger from '../utils/logger.js';

export async function NetflixJobScrapper (browser) {
    const url = 'https://explore.jobs.netflix.net/careers';
    const page = await createPage(browser);

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });
        logger.info(`Navigated to ${url}`);

        const jobs = await page.evaluate(async () => {
            const jobListings = [];
            
            // Select the main container holding both left and right sections
            const mainContainer = document.querySelector('div.search-results-main-container');
            
            // Selecting all job cards within the left sidebar
            const jobCards = mainContainer.querySelectorAll('div.position-card');
        
            for (const jobCard of jobCards) {
                const jobTitle = jobCard.querySelector('.position-title')?.innerText || 'Not specified';
                const jobLocation = jobCard.querySelector('p.position-location')?.innerText || 'Not specified';
                const departmentName = jobCard.querySelector('.position-department')?.innerText || 'Not specified';
        
                // Click on the job card to reveal detailed information on the right
                jobCard.click();
                
                // Wait for the detailed view to load
                await new Promise(resolve => setTimeout(resolve, 1000)); // Adjust the delay as necessary
        
                // Initialize variables to store the extracted values
                let jobId = 'Not specified';
                let jobType = 'Not specified';
                let jobDescription = 'Not specified'; 
        
                // Find all h4 elements inside the job details section
                const jobDetails = document.querySelectorAll('.custom-jd-field h4');
                
                // Loop through the h4 elements and find the corresponding div values
                jobDetails.forEach(h4 => {
                    const nextDiv = h4.nextElementSibling;
                    
                    if (h4.innerText.includes("Job Requisition ID") && nextDiv) {
                        jobId = nextDiv.innerText;
                    }
        
                    if (h4.innerText.includes("Work Type") && nextDiv) {
                        jobType = nextDiv.innerText;
                    }
                });

                // Extract job description
                const descriptionContainer = document.querySelector('.position-job-description div');
                if (descriptionContainer) {
                    const paragraphs = descriptionContainer.querySelectorAll('p');
                    const descriptions = [];

                    paragraphs.forEach(p => {
                        const spans = p.querySelectorAll('span');
                        spans.forEach(span => {
                            descriptions.push(span.innerText.trim());
                        });
                    });

                    jobDescription = descriptions.join('\n'); // Join descriptions into a single string
                }
        
                // Push the job data into the listings
                jobListings.push({
                    department: departmentName,
                    jobId: jobId,
                    title: jobTitle,
                    url: "https://explore.jobs.netflix.net/careers/job?pid=790299137794&domain=netflix.com&sort_by=relevance&show_multiple=false#apply",
                    company: 'Netflix',
                    location: jobLocation,
                    salary: 'Not specified',
                    jobType: jobType,
                    description: jobDescription, // Include the extracted description
                });

                // Close or navigate back to the job list if needed (depends on UI behavior)
            }
        
            return jobListings;
        });
        
        logger.info(`Found ${jobs.length} Netflix jobs`);
        return jobs;
    } catch (error) {
        logger.error(`Error scraping Netflix jobs: ${error.message}`);
        return [];
    } finally {
        await page.close();
    }
}
