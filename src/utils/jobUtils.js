export function validateAndNormalizeJob(job) {
  // Ensure title and company are present
  if (!job.title || !job.company) {
    return null;
  }

  return {
    title: job.title.trim(),
    company: job.company.trim(),
    url: job.url ? job.url.trim() : "",
    description: job.description ? job.description.trim() : "",
  };
}
