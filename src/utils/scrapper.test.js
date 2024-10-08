import { describe, it, expect, vi } from 'vitest';
import { scrape } from './scrapper.js';
import logger from './logger.js';

vi.mock('./logger.js');

describe('scrape', () => {
  const mockBrowser = {
    newPage: vi.fn(),
  };
  const mockPage = {
    goto: vi.fn(),
    evaluate: vi.fn(),
    close: vi.fn(),
  };

  beforeEach(() => {
    mockBrowser.newPage.mockResolvedValue(mockPage);
    mockPage.goto.mockResolvedValue();
    mockPage.close.mockResolvedValue();
  });

  it('should scrape job listings and details successfully', async () => {
    const scrapper = { 
      jobListing: vi.fn(), 
      jobDetail: vi.fn(), 
    };

    mockPage.evaluate.mockImplementation((fn) => {
      if (fn === scrapper.jobListing) {
        return [{ url: 'http://example.com/job1', title: 'Job 1' }];
      }

      if (fn === scrapper.jobDetail) {
        return { description: 'Job 1 description' };
      }

      return null;
    });

    const jobs = await scrape(mockBrowser, 'http://example.com', scrapper);

    expect(mockPage.goto).toHaveBeenCalledWith('http://example.com', { waitUntil: 'networkidle0' });
    expect(mockPage.evaluate).toHaveBeenCalledWith(scrapper.jobListing);
    expect(logger.info).toHaveBeenCalledWith('Found 1 jobs. Scraping details...');

    expect(mockPage.goto).toHaveBeenCalledWith('http://example.com/job1', { waitUntil: 'networkidle0' });
    expect(mockPage.evaluate).toHaveBeenCalledWith(scrapper.jobDetail);
    expect(logger.info).toHaveBeenCalledWith('Scraped details for job: Job 1');

    expect(jobs).toEqual([
      { 
        url: 'http://example.com/job1', 
        title: 'Job 1', 
        description: 'Job 1 description' 
      }
    ]);
  });

  it('should handle errors when scraping job details', async () => {
    const scrapper = { 
      jobListing: vi.fn(), 
      jobDetail: vi.fn(), 
    };

    mockPage.evaluate.mockImplementation((fn) => {
      if (fn === scrapper.jobListing) {
        return [{ url: 'http://example.com/job1', title: 'Job 1' }];
      }
      
      if (fn === scrapper.jobDetail) {
        throw new Error('Detail error');
      }

      return null;
    });

    const jobs = await scrape(mockBrowser, 'http://example.com', scrapper);

    expect(mockPage.goto).toHaveBeenCalledWith('http://example.com', { waitUntil: 'networkidle0' });
    expect(mockPage.evaluate).toHaveBeenCalledWith(scrapper.jobListing);
    expect(logger.info).toHaveBeenCalledWith('Found 1 jobs. Scraping details...');

    expect(mockPage.goto).toHaveBeenCalledWith('http://example.com/job1', { waitUntil: 'networkidle0' });
    expect(logger.error).toHaveBeenCalledWith('Error scraping details for job Job 1: Detail error');
    expect(jobs).toEqual([{ url: 'http://example.com/job1', title: 'Job 1' }]);
  });

  it('should handle errors when scraping job listings', async () => {
    mockPage.goto.mockRejectedValueOnce(new Error('Listing error'));
    const scrapper = { 
      jobListing: vi.fn(), 
      jobDetail: vi.fn(),
    };

    await expect(scrape(mockBrowser, 'http://example.com', scrapper))
      .rejects.toThrow('Listing error');
    expect(logger.error)
      .toHaveBeenCalledWith('Error scraping jobs from http://example.com: Listing error');
  });
});