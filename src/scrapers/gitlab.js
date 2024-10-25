const axios = require('axios');

const baseUrl = 'https://gitlab.com/api/v4/';
const accessToken = 'glpat-XTM5QsLJA88sG_LrDdHD';

async function getProjectId(projectName) {
    const url = `${baseUrl}/projects?search=${projectName}`;
    const config = {
        headers: {
            Authorization: `Bearer ${accessToken}`
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