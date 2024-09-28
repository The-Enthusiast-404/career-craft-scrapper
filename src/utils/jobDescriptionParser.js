import natural from "natural";
import logger from "./logger.js";

const tokenizer = new natural.WordTokenizer();

function extractInfo(text, keywords, stopKeywords = []) {
  const lines = text.toLowerCase().split("\n");
  let capturing = false;
  let result = [];

  for (const line of lines) {
    if (keywords.some((keyword) => line.includes(keyword.toLowerCase()))) {
      capturing = true;
      continue;
    }

    if (capturing) {
      if (
        stopKeywords.some((keyword) => line.includes(keyword.toLowerCase()))
      ) {
        break;
      }
      result.push(line.trim());
    }
  }

  return result.join(" ").trim() || null;
}

export function parseJobDescription(description, keywordSets) {
  try {
    const parsedInfo = {};

    for (const [key, keywords] of Object.entries(keywordSets)) {
      if (Array.isArray(keywords)) {
        if (key === "education") {
          parsedInfo[key] =
            extractInfo(description, keywords, [
              "why join us",
              "compensation",
            ]) || "Not specified";
        } else {
          parsedInfo[key] =
            extractInfo(description, keywords) || "Not specified";
        }
      } else if (typeof keywords === "function") {
        parsedInfo[key] = keywords(description);
      }
    }

    return parsedInfo;
  } catch (error) {
    logger.error(`Error parsing job description: ${error.message}`);
    return Object.fromEntries(
      Object.keys(keywordSets).map((key) => [key, "Not specified"]),
    );
  }
}

export function createKeywordMatcher(keywords) {
  return (text) => {
    const lowercaseText = text.toLowerCase();
    return keywords.some((keyword) =>
      lowercaseText.includes(keyword.toLowerCase()),
    );
  };
}

export const defaultKeywordSets = {
  location: ["location", "based", "city", "country"],
  salary: ["salary", "compensation", "pay", "remuneration"],
  role: ["role", "position", "job title", "title"],
  skills: ["skills", "requirements", "qualifications"],
  remote: createKeywordMatcher(["remote", "work from home", "telecommute"]),
  experience: ["experience", "years of experience", "work experience"],
  education: ["education", "degree", "qualification"],
  department: ["department", "team", "division"],
  jobType: ["job type", "employment type", "contract type"],
  applicationDeadline: ["deadline", "apply by", "closing date"],
  companyDescription: ["about us", "company description", "who we are"],
  responsibilities: ["responsibilities", "duties", "what you'll do"],
  benefits: ["benefits", "perks", "what we offer"],
};
