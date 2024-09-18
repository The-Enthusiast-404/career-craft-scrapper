# Career Craft Scrapper

This repository contains the web scraping component of the Career Craft project, designed to collect job listings from various company websites.

## Overview

The Career Craft Scrapper is a Node.js application that automates the process of gathering job postings from different company career pages. It currently supports scraping from:

- PhonePe
- Flipkart
- Airbnb
- Spotify
- Mozilla
- Paytm

## Prerequisites

Before running the scrapper, ensure you have the following installed:

- Node.js (version 14 or higher)
- npm (usually comes with Node.js)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/The-Enthusiast-404/career-craft-scrapper.git
   cd career-craft-scrapper
   ```

2. Install dependencies:
   ```
   npm install
   ```

## Configuration

The scrapper configuration is stored in `config.js`. You can modify this file to add or update scraping targets and selectors.

## Usage

To run the scrapper:

```
npm start
```

This will execute the main script (`src/index.js`), which orchestrates the scraping process for all configured companies.

## Project Structure

- `src/`: Contains the source code
  - `index.js`: Main entry point
  - `scrapers/`: Individual scraper modules for each company
  - `utils/`: Utility functions and helpers
- `config.js`: Configuration file for scraping targets
- `package.json`: Project metadata and dependencies

## Dependencies

- axios: For making HTTP requests
- cheerio: For parsing and manipulating HTML
- puppeteer: For browser automation and scraping dynamic content
- winston: For logging

## Contributing

Contributions to improve the scrapper or add support for new companies are welcome. Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature-name`)
3. Make your changes
4. Commit your changes (`git commit -am 'Add some feature'`)
5. Push to the branch (`git push origin feature/your-feature-name`)
6. Create a new Pull Request

## License

This project is licensed under the MIT License.
