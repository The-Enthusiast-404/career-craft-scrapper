import puppeteer from "puppeteer";
import * as cheerio from "cheerio";
import logger from "../utils/logger.js";

export async function scrapetoptaljobs(browser) {
  //  browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  logger.info("Navigating to Toptal jobs page");

  // Initialize an array to hold jobs
  const jobs = [];

  try {
    // Navigate to Toptal careers page
    await page.goto("https://www.toptal.com/careers", {
      waitUntil: "networkidle0",
      timeout: 90000,
    });

    // Get the page content
    const content = await page.content();

    // Load content into Cheerio
    const $ = cheerio.load(content);

    // Wait for the main selectors to load
    try {
      await page.waitForSelector("main");
      await page.waitForSelector(
        "section#positions._3n2-gsWT.mb-24.last\\:mb-0"
      );
    } catch (selectorError) {
      logger.error(`Selector loading error: ${selectorError.message}`);
      return [];
    }

    // Extract job URLs
    const jobUrls = [];
    const jobTitles = [];

    $("section#positions._3n2-gsWT.mb-24.last\\:mb-0 ul._3-FZWlkL li").each(
      (index, element) => {
        const anchor = $(element).find("a");
        const jobUrl = anchor.attr("href");
        jobUrls.push(jobUrl || "#");

        // Extract job title
        const titleSpan = anchor.find("span._89eR_lH6");
        if (titleSpan) {
          jobTitles.push(titleSpan.text().trim());
        } else {
          jobTitles.push("No Title");
        }
      }
    );

    logger.info(`Found ${jobUrls.length} job URLs.`);

    // Scrape details for each job
    for (const jobUrl of jobUrls) {
      const job = {
        title: jobTitles.shift(),
        url: jobUrl,
        location: "Location not specified",
        company: "Toptal",
        description: "Not specified",
        salary: "Not specified",
        experience: "Not specified",
        remote: "Yes",
        skills: "Not specified",
      };

      try {
        if (job.url && job.url !== "#") {
          await page.goto(job.url, { waitUntil: "networkidle2" });

          // Extract job location
          try {
            await page.waitForSelector("div.ayIL1Wn7");
            const locationText = await page.evaluate(() => {
              const divs = document.querySelectorAll("div.ayIL1Wn7");
              let location = "Location not found";
              divs.forEach((div) => {
                const heading = div.querySelector("h3._1eHoqFIR");
                if (heading && heading.textContent.trim() === "Location") {
                  const paragraph = div.querySelector("p");
                  if (paragraph) {
                    location = paragraph.textContent.trim();
                  }
                }
              });
              return location;
            });
            job.location = locationText;
          } catch (error) {
            logger.error(
              `Error scraping location for ${job.title}: ${error.message}`
            );
          }

          // Extract job description
          try {
            await page.waitForSelector("div._2ogP2LNO h3#job-summary");
            const combinedParas = await page.evaluate(() => {
              const description = document.querySelector(
                "div._2ogP2LNO h3#job-summary"
              );
              if (!description) return "Description not found";
              const paras = [];
              let current = description.nextElementSibling;
              while (current && current.tagName !== "H3") {
                if (current.tagName === "P") {
                  paras.push(current.textContent.trim());
                }
                current = current.nextElementSibling;
              }
              return paras.join("");
            });
            job.description = combinedParas;
          } catch (error) {
            logger.error(
              `Error scraping description for ${job.title}: ${error.message}`
            );
            job.description = "Error retrieving description";
          }

          // Scrape job salary
          try {
            const salaryParaExists = await page.$(
              "h3#us-flsa-classification--full-timeexempt"
            );
            if (salaryParaExists) {
              const salaryContent = await page.evaluate(() => {
                const salaryPara = document.querySelector(
                  "h3#us-flsa-classification--full-timeexempt"
                );
                const paragraph =
                  salaryPara.nextElementSibling.querySelector("p em");
                return paragraph ? paragraph.textContent.trim() : null;
              });
              const salaryRangeMatch = salaryContent
                ? salaryContent.match(
                    /\$\d+(,\d{3})*\.?\d*\s*-\s*\$\d+(,\d{3})*\.?\d*/
                  )
                : null;
              job.salary = salaryRangeMatch
                ? salaryRangeMatch[0]
                : "Not specified";
            } else {
              job.salary = "Not specified";
            }
          } catch (error) {
            logger.error(
              `Error scraping salary for ${job.title}: ${error.message}`
            );
            job.salary = "Not specified";
          }

          // Scrape job skills
          try {
            const skillsPara = await page.$("p.ddq8l4GA");
            if (skillsPara) {
              const spanContent = await page.evaluate((el) => {
                const spans = el.querySelectorAll("span");
                return Array.from(spans).map((span) => span.textContent.trim());
              }, skillsPara);
              job.skills = spanContent.join(",");
            }
          } catch (error) {
            logger.error(
              `Error scraping skills for ${job.title}: ${error.message}`
            );
            job.skills = "Not specified";
          }

          // Scrape job experience
          try {
            const jobExperience = await page.evaluate((jobTitle) => {
              const qualificationH3 = document.querySelector(
                "h3#qualifications-and-job-requirements"
              );
              if (!qualificationH3) return null;
              const ulElement = qualificationH3.nextElementSibling;
              if (ulElement.tagName !== "UL") return null;
              const liItems = ulElement.querySelectorAll("li");
              if (jobTitle === "Technical Account Manager") {
                return liItems[2].textContent.trim();
              } else {
                return liItems[1].textContent.trim();
              }
            }, job.title);
            job.experience = jobExperience || "Not specified";
          } catch (error) {
            job.experience = "Not specified";
            logger.error(
              `Error scraping job experience for ${job.title}: ${error.message}`
            );
          }
        }
      } catch (error) {
        logger.error(
          `Error processing job ${job.title} at URL ${job.url}: ${error.message}`
        );
      }

      // Add the job to the jobs array
      jobs.push(job);
    }

    logger.info(`Scraped ${jobs.length} Toptal jobs. Scraping details...`);
  } catch (error) {
    logger.error(`Error while scraping Toptal jobs: ${error.message}`);
    return [];
  } finally {
    await browser.close();
  }

  return jobs;
}

// Call the function and log the result
// scrapetoptaljobs()
//   .then((jobs) => {
//     console.log("Scraping completed.", jobs);
//   })
//   .catch((err) => {
//     console.error("Scraping failed:", err);
//   });
