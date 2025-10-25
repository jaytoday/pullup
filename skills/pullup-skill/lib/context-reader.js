/**
 * Context Reader
 *
 * Reads application context from text files, markdown files, or entire folders.
 * Extracts useful information like URLs, credentials, features, and pages.
 */

const fs = require('fs');
const path = require('path');

class ContextReader {
  constructor(config) {
    this.config = config;
    this.verbose = config.verbose || false;
  }

  /**
   * Read context from file or folder
   */
  async readContext(contextPath) {
    const absolutePath = path.resolve(contextPath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Context path not found: ${absolutePath}`);
    }

    const stats = fs.statSync(absolutePath);

    if (stats.isDirectory()) {
      return await this.readFromFolder(absolutePath);
    } else {
      return await this.readFromFile(absolutePath);
    }
  }

  /**
   * Read all files from a folder recursively
   */
  async readFromFolder(folderPath) {
    console.log(`📂 Reading context from folder: ${folderPath}`);

    const files = this.getAllFilesRecursive(folderPath);
    const textFiles = files.filter(f => this.isTextFile(f));

    if (textFiles.length === 0) {
      console.log('   ⚠️  No text files found in folder');
      return { rawText: '', parsedData: {} };
    }

    console.log(`   Found ${textFiles.length} text files`);

    let combinedText = '';

    for (const file of textFiles) {
      const relativePath = path.relative(folderPath, file);
      if (this.verbose) {
        console.log(`   📄 Reading: ${relativePath}`);
      }

      const content = fs.readFileSync(file, 'utf8');
      combinedText += `\n\n# File: ${relativePath}\n\n${content}`;
    }

    const parsedData = this.parseContext(combinedText);

    return {
      rawText: combinedText,
      parsedData: parsedData,
      fileCount: textFiles.length
    };
  }

  /**
   * Read from a single file
   */
  async readFromFile(filePath) {
    console.log(`📄 Reading context from file: ${path.basename(filePath)}`);

    const content = fs.readFileSync(filePath, 'utf8');
    const parsedData = this.parseContext(content);

    return {
      rawText: content,
      parsedData: parsedData,
      fileCount: 1
    };
  }

  /**
   * Get all files recursively from a directory
   */
  getAllFilesRecursive(dir) {
    let results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Skip hidden files, node_modules, and common build directories
      if (entry.name.startsWith('.') ||
          entry.name === 'node_modules' ||
          entry.name === 'dist' ||
          entry.name === 'build') {
        continue;
      }

      if (entry.isDirectory()) {
        results = results.concat(this.getAllFilesRecursive(fullPath));
      } else {
        results.push(fullPath);
      }
    }

    return results;
  }

  /**
   * Check if file is a text file
   */
  isTextFile(filePath) {
    const textExtensions = [
      '.txt', '.md', '.markdown', '.json',
      '.rst', '.org', '.adoc', '.asciidoc'
    ];

    const ext = path.extname(filePath).toLowerCase();
    return textExtensions.includes(ext);
  }

  /**
   * Parse context to extract structured information
   */
  parseContext(text) {
    const data = {
      urls: [],
      credentials: [],
      features: [],
      pages: [],
      notes: []
    };

    // Extract URLs
    const urlPattern = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;
    const urls = text.match(urlPattern) || [];
    data.urls = [...new Set(urls)]; // Remove duplicates

    // Also look for localhost references
    const localhostPattern = /localhost:\d+/g;
    const localhostUrls = text.match(localhostPattern) || [];
    localhostUrls.forEach(loc => {
      if (!loc.startsWith('http')) {
        data.urls.push(`http://${loc}`);
      }
    });

    // Extract credentials (look for email/password patterns)
    const credentialPatterns = [
      /(?:username|user|email):\s*([^\s\n]+)/gi,
      /(?:password|pass):\s*([^\s\n]+)/gi,
      /test\s+user:\s*([^\n]+)/gi,
      /admin\s+user:\s*([^\n]+)/gi
    ];

    credentialPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && !match[1].includes('your-') && !match[1].includes('example')) {
          data.credentials.push(match[1].trim());
        }
      }
    });

    // Extract page paths (look for routes starting with /)
    const pagePattern = /['"`](\/?[a-z0-9/_-]+)['"`]/gi;
    const potentialPages = text.matchAll(pagePattern);

    for (const match of potentialPages) {
      const page = match[1];
      if (page.startsWith('/') && page.length > 1 && page.length < 100) {
        // Filter out common false positives
        if (!page.includes('.js') &&
            !page.includes('.css') &&
            !page.includes('.png') &&
            !page.includes('/api/')) {
          data.pages.push(page);
        }
      }
    }

    data.pages = [...new Set(data.pages)]; // Remove duplicates

    // Extract features (look for headings or bullet points describing features)
    const featurePatterns = [
      /(?:^|\n)#+\s+([^\n]+)/g,  // Markdown headings
      /(?:^|\n)[-*]\s+([^\n]+)/g, // Bullet points
      /Feature:\s*([^\n]+)/gi,
      /\d+\.\s+([^\n]+)/g         // Numbered lists
    ];

    featurePatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const feature = match[1].trim();
        if (feature.length > 10 && feature.length < 200) {
          data.features.push(feature);
        }
      }
    });

    // Extract important notes or descriptions
    const notePatterns = [
      /(?:note|important|warning):\s*([^\n]+)/gi,
      /(?:description|about):\s*([^\n]+)/gi
    ];

    notePatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        data.notes.push(match[1].trim());
      }
    });

    return data;
  }

  /**
   * Merge parsed context with config
   */
  mergeWithConfig(config, contextData) {
    const merged = { ...config };

    // Use first URL if no URL in config
    if (!merged.targetUrl && contextData.parsedData.urls.length > 0) {
      merged.targetUrl = contextData.parsedData.urls[0];
      console.log(`   📍 Detected URL: ${merged.targetUrl}`);
    }

    // Add discovered pages to exploration hints
    if (contextData.parsedData.pages.length > 0) {
      merged.hintPages = contextData.parsedData.pages;
      console.log(`   📄 Found ${contextData.parsedData.pages.length} page references`);
    }

    // Store credentials for reference (sanitized in output)
    if (contextData.parsedData.credentials.length > 0) {
      merged.credentialHints = contextData.parsedData.credentials;
      console.log(`   🔑 Found ${contextData.parsedData.credentials.length} credential references`);
    }

    // Store features for analysis enhancement
    if (contextData.parsedData.features.length > 0) {
      merged.featureHints = contextData.parsedData.features;
      console.log(`   ✨ Found ${contextData.parsedData.features.length} feature descriptions`);
    }

    // Store raw context for AI-enhanced analysis (future)
    merged.contextText = contextData.rawText;
    merged.contextNotes = contextData.parsedData.notes;

    return merged;
  }
}

module.exports = ContextReader;
