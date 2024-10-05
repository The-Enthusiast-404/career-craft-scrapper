import puppeteer from "puppeteer";
import * as cheerio from "cheerio";
import logger from "../utils/logger.js";

export async function scrapeCircleCijobs(browser){
    const page= await browser.newPage();

    logger.info("Navigating to Circle Ci jobs page");

    try{
      // navigate to CircleCI careers page
      await page.goto("https://circleci.com/careers/jobs/" ,{
        waitUntill:"networkidle0" ,
      });
      // Get the page content
      const content=await page.content();
      // Load content into Cheerio
      const $= cheerio.load(content);

      // initialize an array to hold jobs
      const jobs=[];

      // Base URL for constructing absolute URLs (if needed)
      const baseUrl="https://circleci.com";
  
      try {
        await page.waitForSelector('main');
        await page.waitForSelector('main section.jobs');
        await page.waitForSelector('div#jobs-list div.margin-bottom-medium');

    } catch (selectorError) {
        logger.error(`Selector loading error: ${selectorError.message}`);
        return []; 
          }

      $("div#jobs-list div.margin-bottom-medium").each((index, element) => {
      
        const jobTitles = [];
        const jobUrls = [];
        const jobLocations = [];

         $(element)
              .find("h3.job-title a")
              .each((i,el) =>{
                jobTitles.push($(el).text().trim());
              });
           $(element)
              .find("h3.job-title a")
              .each((i,el) =>{
                const relativeUrl= $(el).attr("href");
                const trimmedUrl=relativeUrl ? relativeUrl.split('?')[0]:'#';
                jobUrls.push(trimmedUrl ? baseUrl+trimmedUrl: "#");
              });
            $(element)
              .find("div.subtitle")
              .each((i,el) =>{
                jobLocations.push($(el).text().trim());
              });
          for(let i=0;i<jobTitles.length;i++){
            jobs.push({
              title: jobTitles[i] || "No Title",
              url: jobUrls[i] || "#" ,
              location: jobLocations[i] || "Location not specified",
              company: "Circleci",
              description: "",
          });
          }
      });
      
      logger.info(`Scraped ${jobs.length} Circle Ci jobs. Scraping deatils...`);

      // scrape job description
      for(const job of jobs){
        try{
          if(job.url && jobs.url !="#"){
            await page.goto(job.url , {waitUntil:"networkidle2"});

            await page.waitForSelector('div.job-detail-col.col-lg-8.col-lg-pull-4');

            const paragraphs =await page.$$('div.job-detail-col.col-lg-8.col-lg-pull-4 p'); 
            let jobDescription ='';
            if (paragraphs.length > 0) {
              // Evaluate the content of the first paragraph
              const firstParaContent = await page.evaluate(el => el.textContent.trim(), paragraphs[0]);
              const firstParaWords = firstParaContent.split(' ');
              const isSummaryTerm= ["overview", "description", "job summary" , "team summary"].includes(firstParaContent.toLowerCase());
              if ((firstParaWords.length <=2 || isSummaryTerm) && paragraphs.length >1) {
                  // If the first paragraph is just summary words , use the second paragraph
                  jobDescription = await page.evaluate(el => el.textContent.trim(), paragraphs[1]);
                } else {
                  // Otherwise, use the first paragraph
                  jobDescription = firstParaContent;
              }
          } else {
              jobDescription = "Description not found";
          }
            job.description = jobDescription.replace('Overview:', '');
          }
        } catch(error){
          logger.error(
            `Error scraping job description for ${job.title}:${error.message}`
          );
          job.description = "Error retrieving description";
        }
      }
      logger.info('Scraped jobs:', jobs);
      return jobs;
    } catch(error){
      logger.error(`Error while scraping Circle Ci jobs: ${error.message}`);
      return[];
    } finally{
      await browser.close();
    }
}