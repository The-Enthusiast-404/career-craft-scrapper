import logger from "./logger.js";

export function validateAndNormalizeJob(job) {
  // Ensure title and company are present
  if (!job.title || !job.company) {
    logger.warn(`Invalid job: missing title or company`);
    return null;
  }

  const normalizedJob = {
    title: job.title.trim(),
    company: job.company.trim(),
    JobId: job.JobId || "check in the link",
    location: job.location ? job.location.trim() : "Not specified",
    salary: job.salary ? job.salary.trim() : "Not specified",
    role: job.role ? job.role.trim() : "Not specified",
    skills: job.skills ? job.skills.trim() : "Not specified",
    remote: job.remote || false,
    experience: job.experience ? job.experience.trim() : "Not specified",
    education: job.education ? job.education.trim() : "Not specified",
    department: job.department ? job.department.trim() : "Not specified",
    jobType: job.jobType ? job.jobType.trim() : "Not specified",
    url: job.url ? job.url.trim() : "",
    description: job.description ? job.description.trim() : "Not specified",
  };

  return normalizedJob;
}
