#!/usr/bin/env node

/**
 * PullUp - Application Testing Skill Generator
 *
 * Main execution entry point for generating application-specific testing skills.
 * Takes a web application URL and configuration, explores the application,
 * and generates a custom testing skill with application knowledge.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Change to skill directory for proper module resolution
process.chdir(__dirname);

/**
 * Check if Playwright is installed
 */
function verifyPlaywrightInstalled() {
  try {
    require.resolve('playwright');
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Install Playwright if not present
 */
function setupPlaywright() {
  console.log('📦 Playwright not detected. Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit', cwd: __dirname });
    execSync('npx playwright install chromium', { stdio: 'inherit', cwd: __dirname });
    console.log('✅ Setup completed successfully');
    return true;
  } catch (err) {
    console.error('❌ Setup failed:', err.message);
    console.error('Please run manually: cd', __dirname, '&& npm run setup');
    return false;
  }
}

/**
 * Parse command line arguments
 */
function parseArguments() {
  const argv = process.argv.slice(2);
  const config = {
    appName: null,
    targetUrl: null,
    contextPath: null,
    userPrompt: null,
    updateMode: false,
    outputDirectory: path.join(require('os').homedir(), '.claude', 'skills'),
    extensions: [],
    maxDepth: 3,
    maxPages: 50,
    verbose: false
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const nextVal = argv[i + 1];

    switch (arg) {
      case '--name':
      case '-n':
        config.appName = nextVal;
        i++;
        break;
      case '--url':
      case '-u':
        config.targetUrl = nextVal;
        i++;
        break;
      case '--docs':
      case '--info':
      case '-d':
        config.contextPath = nextVal;
        i++;
        break;
      case '--prompt':
      case '--instructions':
      case '-p':
        config.userPrompt = nextVal;
        i++;
        break;
      case '--update':
        config.updateMode = true;
        break;
      case '--output':
      case '-o':
        config.outputDirectory = nextVal;
        i++;
        break;
      case '--extensions':
      case '-e':
        config.extensions = nextVal.split(',').map(e => e.trim());
        i++;
        break;
      case '--max-depth':
        config.maxDepth = parseInt(nextVal, 10);
        i++;
        break;
      case '--max-pages':
        config.maxPages = parseInt(nextVal, 10);
        i++;
        break;
      case '--verbose':
      case '-v':
        config.verbose = true;
        break;
      case '--help':
      case '-h':
        displayHelp();
        process.exit(0);
      default:
        if (arg.startsWith('-')) {
          console.error(`❌ Unknown option: ${arg}`);

          // Helpful suggestions for common typos
          if (arg.startsWith('---')) {
            console.error(`   Did you mean to use two dashes? e.g., ${arg.replace(/^---/, '--')}`);
          } else if (arg === '--doc' || arg === '--document') {
            console.error(`   Did you mean --docs?`);
          } else if (arg === '--instruction' || arg === '--prompt-text') {
            console.error(`   Did you mean --prompt?`);
          }

          console.error('\nRun with --help for all available options');
          process.exit(1);
        }
    }
  }

  return config;
}

/**
 * Display help information
 */
function displayHelp() {
  console.log(`
PullUp - Application Testing Skill Generator

Usage:
  node execute.js --name <appname> --docs <path> [options]

Primary Options:
  -n, --name <name>          Application name (required)
  -d, --docs <path>          Path to documentation file or folder (recommended)
                             PullUp extracts URLs, credentials, features, pages automatically
  -p, --prompt <text>        Instructions or guidance for exploration
                             Use to focus on specific features or provide context

Additional Options:
  -u, --url <url>            Explicit URL (optional if provided via --docs)
  --update                   Update existing skill instead of creating new one
  -o, --output <dir>         Output directory (default: ~/.claude/skills)
  -v, --verbose              Enable verbose logging
  -h, --help                 Display this help message

Advanced Options:
  --max-depth <n>            Maximum crawl depth (default: 3)
  --max-pages <n>            Maximum pages to explore (default: 50)

Examples:
  # Recommended: With documentation file
  node execute.js --name myapp --docs app-info.md

  # With documentation folder (reads all text files recursively)
  node execute.js --name myapp --docs ./docs

  # With guidance prompt
  node execute.js --name myapp --docs ./docs --prompt "Focus on admin features"

  # Documentation + explicit URL
  node execute.js --name myapp --docs ./docs --url http://localhost:3000

  # Just URL (if no documentation available)
  node execute.js --name myapp --url http://localhost:3000

  # Update existing skill
  node execute.js --name myapp --update

Documentation Format:
  PullUp automatically extracts from your docs:
  - URLs (http://localhost:3000, etc.)
  - Page paths (/login, /dashboard, etc.)
  - Credentials (test@example.com, passwords)
  - Features (from headings and bullet points)

  Example doc (myapp-info.md):
    # MyApp
    Runs at: http://localhost:3000

    ## Features
    - Login: /login
    - Dashboard: /dashboard

    ## Test Account
    Email: test@example.com
    Password: testpass123
`);
}

/**
 * Validate configuration
 */
function validateConfig(config) {
  if (!config.appName) {
    console.error('❌ Application name is required (use --name)');
    return false;
  }

  if (!config.targetUrl && !config.updateMode && !config.contextPath) {
    console.error('❌ Application URL is required (use --url or provide via --docs)');
    return false;
  }

  if (config.targetUrl) {
    try {
      new URL(config.targetUrl);
    } catch (err) {
      console.error(`❌ Invalid URL: ${config.targetUrl}`);
      return false;
    }
  }

  return true;
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 PullUp - Application Testing Skill Generator\n');

  // Verify Playwright installation
  if (!verifyPlaywrightInstalled()) {
    const installed = setupPlaywright();
    if (!installed) {
      process.exit(1);
    }
  }

  // Parse arguments
  const config = parseArguments();

  // Validate configuration
  if (!validateConfig(config)) {
    console.log('\nRun with --help for usage information');
    process.exit(1);
  }

  // Load library modules
  const ExplorationEngine = require('./lib/explorer');
  const AnalysisEngine = require('./lib/analyzer');
  const SkillGenerator = require('./lib/generator');
  const SkillUpdater = require('./lib/updater');
  const ContextReader = require('./lib/context-reader');

  try {
    // Read context from docs if provided
    if (config.contextPath) {
      console.log('📖 Reading application context...\n');
      const contextReader = new ContextReader(config);
      const contextData = await contextReader.readContext(config.contextPath);
      config = contextReader.mergeWithConfig(config, contextData);
      console.log('');
    }

    // Display configuration
    console.log('📋 Configuration:');
    console.log(`   Application: ${config.appName}`);
    if (config.targetUrl) console.log(`   URL: ${config.targetUrl}`);
    console.log(`   Mode: ${config.updateMode ? 'Update' : 'Create'}`);
    console.log(`   Output: ${config.outputDirectory}`);
    if (config.extensions.length > 0) {
      console.log(`   Extensions: ${config.extensions.join(', ')}`);
    }
    if (config.hintPages && config.hintPages.length > 0) {
      console.log(`   Hint Pages: ${config.hintPages.length} pages from context`);
    }
    if (config.userPrompt) {
      console.log(`   Instructions: ${config.userPrompt}`);
    }
    console.log('');

    if (config.updateMode) {
      // Update existing skill
      console.log('🔄 Updating existing skill...\n');

      const updater = new SkillUpdater(config);
      const result = await updater.updateSkill();

      console.log('\n✅ Skill update completed!');
      console.log(`📁 Location: ${result.skillPath}`);
      console.log(`📊 Changes: ${result.summary}`);

    } else {
      // Create new skill
      console.log('🔍 Starting application exploration...\n');

      // Phase 1: Explore the application
      const explorer = new ExplorationEngine(config);
      const explorationData = await explorer.explore();

      console.log('\n📊 Exploration complete!');
      console.log(`   Pages discovered: ${explorationData.pages.length}`);
      console.log(`   Forms found: ${explorationData.forms.length}`);
      console.log(`   Flows identified: ${explorationData.flows.length}`);

      // Phase 2: Analyze the collected data
      console.log('\n🔬 Analyzing application structure...\n');

      const analyzer = new AnalysisEngine(explorationData, config);
      const analysisResults = await analyzer.analyze();

      console.log('✅ Analysis complete!');

      // Phase 3: Generate the skill
      console.log('\n✨ Generating testing skill...\n');

      const generator = new SkillGenerator(analysisResults, config);
      const skillPath = await generator.generate();

      console.log('\n🎉 Success! Testing skill generated!');
      console.log(`📁 Location: ${skillPath}`);
      console.log(`\n📖 Next steps:`);
      console.log(`   1. Review the generated skill at: ${skillPath}`);
      console.log(`   2. Test it: "Use ${config.appName}-testing skill to verify the homepage"`);
      console.log(`   3. Update when needed: node execute.js --name ${config.appName} --update`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (config.verbose) {
      console.error('\n📋 Stack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Execute main function
main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
