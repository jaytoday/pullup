/**
 * Web Application Exploration Engine
 *
 * Crawls and explores a web application to discover pages, forms,
 * interactive elements, and user flows.
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

class ExplorationEngine {
  constructor(config) {
    this.config = config;
    this.targetUrl = config.targetUrl;
    this.appName = config.appName;
    this.maxDepth = config.maxDepth || 3;
    this.maxPages = config.maxPages || 50;
    this.verbose = config.verbose || false;

    // Tracking data
    this.visited = new Set();
    this.toVisit = [];
    this.discoveredPages = [];
    this.discoveredForms = [];
    this.discoveredFlows = [];
    this.interactiveElements = [];

    // URL parsing
    this.baseUrl = new URL(this.targetUrl);
    this.baseDomain = this.baseUrl.hostname;
  }

  /**
   * Main exploration method
   */
  async explore() {
    const startTime = Date.now();
    let browserInstance = null;

    try {
      // Launch browser
      browserInstance = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const contextOptions = {
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (compatible; PullUpBot/1.0; +skill-generator)'
      };

      const browserContext = await browserInstance.newContext(contextOptions);
      const activePage = await browserContext.newPage();

      console.log(`🔍 Starting exploration from: ${this.targetUrl}`);

      // Initialize with starting URL
      this.toVisit.push({ url: this.targetUrl, depth: 0 });

      // Crawl loop
      while (this.toVisit.length > 0 && this.visited.size < this.maxPages) {
        const current = this.toVisit.shift();

        if (this.visited.has(current.url) || current.depth > this.maxDepth) {
          continue;
        }

        await this.explorePage(activePage, current.url, current.depth);
      }

      await browserContext.close();

      const duration = Math.round((Date.now() - startTime) / 1000);

      console.log(`\n⏱️  Exploration completed in ${duration} seconds`);

      return {
        appName: this.appName,
        baseUrl: this.targetUrl,
        pages: this.discoveredPages,
        forms: this.discoveredForms,
        flows: this.discoveredFlows,
        elements: this.interactiveElements,
        statistics: {
          pagesExplored: this.visited.size,
          formsFound: this.discoveredForms.length,
          flowsIdentified: this.discoveredFlows.length,
          duration: duration
        }
      };

    } catch (error) {
      console.error('Exploration error:', error.message);
      throw error;
    } finally {
      if (browserInstance) {
        await browserInstance.close();
      }
    }
  }

  /**
   * Explore a single page
   */
  async explorePage(page, url, depth) {
    try {
      this.visited.add(url);

      if (this.verbose) {
        console.log(`  📄 Exploring [depth ${depth}]: ${url}`);
      } else {
        process.stdout.write('.');
      }

      // Navigate to page
      const response = await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 30000
      }).catch(() => null);

      if (!response || response.status() >= 400) {
        if (this.verbose) {
          console.log(`     ⚠️  Failed to load or error status`);
        }
        return;
      }

      // Wait a bit for dynamic content
      await page.waitForTimeout(1000);

      // Extract page information
      const pageData = await this.extractPageData(page, url);
      this.discoveredPages.push(pageData);

      // Find and catalog forms
      const forms = await this.extractForms(page, url);
      this.discoveredForms.push(...forms);

      // Find interactive elements
      const elements = await this.extractInteractiveElements(page, url);
      this.interactiveElements.push(...elements);

      // Take screenshot
      await this.captureScreenshot(page, pageData.pageName);

      // Find links to explore
      const links = await this.extractLinks(page);

      for (const link of links) {
        if (this.shouldFollowLink(link) && !this.visited.has(link)) {
          this.toVisit.push({ url: link, depth: depth + 1 });
        }
      }

    } catch (error) {
      if (this.verbose) {
        console.log(`     ❌ Error exploring ${url}: ${error.message}`);
      }
    }
  }

  /**
   * Extract page metadata and content
   */
  async extractPageData(page, url) {
    const data = await page.evaluate(() => {
      return {
        title: document.title || '',
        heading: document.querySelector('h1')?.textContent?.trim() || '',
        description: document.querySelector('meta[name="description"]')?.content || '',
        bodyText: document.body?.innerText?.substring(0, 500) || ''
      };
    });

    const urlPath = new URL(url).pathname;
    const pageName = this.generatePageName(urlPath, data.title);
    const pageType = this.classifyPage(data, urlPath);

    return {
      url: url,
      path: urlPath,
      pageName: pageName,
      pageType: pageType,
      title: data.title,
      heading: data.heading,
      description: data.description,
      preview: data.bodyText
    };
  }

  /**
   * Extract form information
   */
  async extractForms(page, pageUrl) {
    return await page.evaluate((url) => {
      const forms = Array.from(document.querySelectorAll('form'));

      return forms.map((form, index) => {
        const fields = Array.from(form.querySelectorAll('input, textarea, select')).map(field => ({
          type: field.type || field.tagName.toLowerCase(),
          name: field.name || field.id || '',
          id: field.id || '',
          placeholder: field.placeholder || '',
          required: field.required || false,
          label: field.labels?.[0]?.textContent?.trim() || ''
        }));

        const buttons = Array.from(form.querySelectorAll('button, input[type="submit"]')).map(btn => ({
          text: btn.textContent?.trim() || btn.value || '',
          type: btn.type || 'submit'
        }));

        return {
          formIndex: index,
          action: form.action || url,
          method: form.method || 'get',
          fields: fields,
          buttons: buttons,
          fieldCount: fields.length
        };
      });
    }, pageUrl);
  }

  /**
   * Extract interactive elements (buttons, links, etc.)
   */
  async extractInteractiveElements(page, pageUrl) {
    return await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button:not(form button)')).map(btn => ({
        type: 'button',
        text: btn.textContent?.trim() || '',
        id: btn.id || '',
        classes: btn.className || ''
      }));

      const clickableElements = Array.from(document.querySelectorAll('[onclick], [role="button"]')).map(el => ({
        type: 'clickable',
        text: el.textContent?.trim()?.substring(0, 50) || '',
        id: el.id || '',
        classes: el.className || ''
      }));

      return [...buttons, ...clickableElements].slice(0, 20); // Limit per page
    });
  }

  /**
   * Extract links from page
   */
  async extractLinks(page) {
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href]'))
        .map(a => a.href)
        .filter(href => href && !href.startsWith('javascript:') && !href.startsWith('mailto:') && !href.startsWith('tel:'));
    });

    return [...new Set(links)]; // Remove duplicates
  }

  /**
   * Determine if a link should be followed
   */
  shouldFollowLink(url) {
    try {
      const linkUrl = new URL(url);

      // Only follow links on same domain
      if (linkUrl.hostname !== this.baseDomain) {
        return false;
      }

      // Skip common non-page resources
      const skipExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.zip', '.exe', '.dmg'];
      if (skipExtensions.some(ext => linkUrl.pathname.toLowerCase().endsWith(ext))) {
        return false;
      }

      // Skip anchor links to same page
      if (linkUrl.pathname === new URL(this.visited.values().next().value || this.targetUrl).pathname && linkUrl.hash) {
        return false;
      }

      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Generate readable page name from URL path
   */
  generatePageName(urlPath, title) {
    if (urlPath === '/' || urlPath === '') {
      return 'Homepage';
    }

    // Try to use title first
    if (title && title.length > 0 && title.length < 50) {
      return title;
    }

    // Generate from path
    const pathParts = urlPath.split('/').filter(p => p);
    if (pathParts.length === 0) {
      return 'Homepage';
    }

    const lastPart = pathParts[pathParts.length - 1];

    // Check if it's a dynamic route (number or UUID-like)
    if (/^\d+$/.test(lastPart) || /^[0-9a-f]{8}-/.test(lastPart)) {
      const secondLast = pathParts[pathParts.length - 2];
      return secondLast ? this.capitalize(secondLast) + ' Detail' : 'Detail Page';
    }

    return this.capitalize(lastPart.replace(/[-_]/g, ' '));
  }

  /**
   * Classify page type based on content
   */
  classifyPage(data, path) {
    const lowerTitle = (data.title + ' ' + data.heading + ' ' + path).toLowerCase();

    if (lowerTitle.includes('login') || lowerTitle.includes('sign in')) {
      return 'login';
    }
    if (lowerTitle.includes('signup') || lowerTitle.includes('register') || lowerTitle.includes('sign up')) {
      return 'signup';
    }
    if (lowerTitle.includes('dashboard')) {
      return 'dashboard';
    }
    if (lowerTitle.includes('profile') || lowerTitle.includes('account')) {
      return 'profile';
    }
    if (lowerTitle.includes('contact')) {
      return 'contact';
    }
    if (lowerTitle.includes('about')) {
      return 'about';
    }
    if (path === '/' || path === '') {
      return 'homepage';
    }
    if (/\d+$/.test(path) || path.includes('detail')) {
      return 'detail';
    }
    if (path.includes('list') || data.bodyText.includes('showing') || data.bodyText.includes('results')) {
      return 'list';
    }

    return 'page';
  }

  /**
   * Capture screenshot of page
   */
  async captureScreenshot(page, pageName) {
    try {
      const screenshotDir = path.join(os.tmpdir(), 'pullup-screenshots', this.appName);

      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }

      const filename = `${pageName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
      const filepath = path.join(screenshotDir, filename);

      await page.screenshot({
        path: filepath,
        fullPage: false // Just viewport for performance
      });

    } catch (err) {
      // Screenshots are optional, don't fail on error
      if (this.verbose) {
        console.log(`     ⚠️  Screenshot failed: ${err.message}`);
      }
    }
  }

  /**
   * Capitalize first letter of string
   */
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

module.exports = ExplorationEngine;
