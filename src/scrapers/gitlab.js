const axios = require('axios');

const baseUrl = 'https://gitlab.com/api/v4/';

async function getProjectId(projectName) {
  const gitlabToken = process.env.GITLAB_TOKEN; // Access the environment variable

  const url = `<span class="math-inline">\{baseUrl\}/projects?search\=</span>{projectName}`;
  const config = {
    headers: {
      Authorization: `Bearer ${gitlabToken}`
    }
  };
    try {
        const response = await axios.get(url, config);
        const projects = response.data;

        // Find the project ID based on the project name
        const project = projects.find(project => project.name === projectName);
        if (project) {
            return project.id;
        } else {
            console.log(`Project "${projectName}" not found.`);
            return null;
        }
    } catch (error) {
        console.error('Error fetching project ID:', error);
        return null;
    }
}

// Example usage:
getProjectId('my-project-name')
    .then(projectId => {
        if (projectId) {
            console.log('Project ID:', projectId);
            // Use the projectId to fetch jobs
            getJobs(projectId);
        }
    });