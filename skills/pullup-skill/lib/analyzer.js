/**
 * Application Analysis Engine
 *
 * Analyzes exploration data to identify patterns, user flows,
 * framework detection, and test scenarios.
 */

class AnalysisEngine {
  constructor(explorationData, config) {
    this.data = explorationData;
    this.config = config;
    this.verbose = config.verbose || false;
  }

  /**
   * Main analysis method
   */
  async analyze() {
    console.log('🔬 Analyzing application structure...');

    const results = {
      appName: this.data.appName,
      baseUrl: this.data.baseUrl,
      pages: this.analyzePagesStructure(),
      forms: this.analyzeFormsPatterns(),
      navigation: this.analyzeNavigation(),
      userFlows: this.identifyUserFlows(),
      testScenarios: this.generateTestScenarios(),
      framework: this.detectFramework(),
      statistics: this.data.statistics
    };

    if (this.verbose) {
      console.log(`   Analyzed ${results.pages.length} pages`);
      console.log(`   Identified ${results.userFlows.length} user flows`);
      console.log(`   Generated ${results.testScenarios.length} test scenarios`);
    }

    return results;
  }

  /**
   * Analyze pages and categorize them
   */
  analyzePagesStructure() {
    const categorizedPages = {
      authentication: [],
      content: [],
      forms: [],
      lists: [],
      details: [],
      other: []
    };

    this.data.pages.forEach(page => {
      const category = this.categorizePage(page);
      categorizedPages[category].push({
        name: page.pageName,
        url: page.url,
        path: page.path,
        type: page.pageType,
        title: page.title,
        heading: page.heading,
        description: page.description
      });
    });

    return categorizedPages;
  }

  /**
   * Categorize a page into a high-level category
   */
  categorizePage(page) {
    const type = page.pageType;

    if (type === 'login' || type === 'signup') {
      return 'authentication';
    }
    if (type === 'list') {
      return 'lists';
    }
    if (type === 'detail') {
      return 'details';
    }
    if (type === 'homepage' || type === 'about' || type === 'contact') {
      return 'content';
    }

    // Check if page has forms
    const pageForms = this.data.forms.filter(f => {
      const formUrl = new URL(f.action);
      const pageUrl = new URL(page.url);
      return formUrl.pathname === pageUrl.pathname;
    });

    if (pageForms.length > 0) {
      return 'forms';
    }

    return 'other';
  }

  /**
   * Analyze form patterns
   */
  analyzeFormsPatterns() {
    const formsAnalysis = [];

    this.data.forms.forEach(form => {
      const analysis = {
        action: form.action,
        method: form.method,
        fields: form.fields,
        fieldCount: form.fieldCount,
        buttons: form.buttons,
        pattern: this.identifyFormPattern(form),
        testData: this.generateFormTestData(form)
      };

      formsAnalysis.push(analysis);
    });

    return formsAnalysis;
  }

  /**
   * Identify form pattern (login, signup, search, etc.)
   */
  identifyFormPattern(form) {
    const fieldNames = form.fields.map(f => (f.name + ' ' + f.label).toLowerCase());
    const allFieldText = fieldNames.join(' ');

    if (allFieldText.includes('email') && allFieldText.includes('password') && form.fieldCount <= 3) {
      return 'login';
    }
    if ((allFieldText.includes('email') || allFieldText.includes('username')) &&
        allFieldText.includes('password') &&
        (allFieldText.includes('confirm') || form.fieldCount > 3)) {
      return 'signup';
    }
    if (allFieldText.includes('search') || allFieldText.includes('query')) {
      return 'search';
    }
    if (allFieldText.includes('contact') || allFieldText.includes('message')) {
      return 'contact';
    }
    if (allFieldText.includes('checkout') || allFieldText.includes('payment') || allFieldText.includes('card')) {
      return 'checkout';
    }

    return 'generic';
  }

  /**
   * Generate test data for a form
   */
  generateFormTestData(form) {
    const testData = {};

    form.fields.forEach(field => {
      const fieldName = field.name || field.id;
      if (!fieldName) return;

      const lowerName = fieldName.toLowerCase();
      const lowerLabel = (field.label || '').toLowerCase();
      const fieldType = field.type;

      // Generate appropriate test data based on field characteristics
      if (lowerName.includes('email') || lowerLabel.includes('email') || fieldType === 'email') {
        testData[fieldName] = 'test@example.com';
      } else if (lowerName.includes('password') || fieldType === 'password') {
        testData[fieldName] = '[TEST_PASSWORD]'; // Placeholder
      } else if (lowerName.includes('phone') || lowerLabel.includes('phone') || fieldType === 'tel') {
        testData[fieldName] = '555-0123';
      } else if (lowerName.includes('name') || lowerLabel.includes('name')) {
        if (lowerName.includes('first') || lowerLabel.includes('first')) {
          testData[fieldName] = 'John';
        } else if (lowerName.includes('last') || lowerLabel.includes('last')) {
          testData[fieldName] = 'Doe';
        } else {
          testData[fieldName] = 'John Doe';
        }
      } else if (lowerName.includes('address') || lowerLabel.includes('address')) {
        testData[fieldName] = '123 Main St';
      } else if (lowerName.includes('city') || lowerLabel.includes('city')) {
        testData[fieldName] = 'San Francisco';
      } else if (lowerName.includes('zip') || lowerName.includes('postal') || lowerLabel.includes('zip')) {
        testData[fieldName] = '94102';
      } else if (lowerName.includes('message') || lowerLabel.includes('message') || fieldType === 'textarea') {
        testData[fieldName] = 'This is a test message.';
      } else if (fieldType === 'number') {
        testData[fieldName] = '123';
      } else if (fieldType === 'checkbox') {
        testData[fieldName] = true;
      } else {
        testData[fieldName] = `test_${fieldName}`;
      }
    });

    return testData;
  }

  /**
   * Analyze navigation structure
   */
  analyzeNavigation() {
    const navigation = {
      mainPages: [],
      hierarchy: {},
      commonPaths: []
    };

    // Identify main pages (top-level navigation)
    const topLevelPages = this.data.pages.filter(page => {
      const pathDepth = page.path.split('/').filter(p => p).length;
      return pathDepth <= 1;
    });

    navigation.mainPages = topLevelPages.map(page => ({
      name: page.pageName,
      path: page.path,
      type: page.pageType
    }));

    // Build hierarchy
    this.data.pages.forEach(page => {
      const pathParts = page.path.split('/').filter(p => p);
      if (pathParts.length > 0) {
        const topLevel = '/' + pathParts[0];
        if (!navigation.hierarchy[topLevel]) {
          navigation.hierarchy[topLevel] = [];
        }
        if (pathParts.length > 1) {
          navigation.hierarchy[topLevel].push(page.path);
        }
      }
    });

    return navigation;
  }

  /**
   * Identify user flows from page relationships
   */
  identifyUserFlows() {
    const flows = [];

    // Authentication flow
    const loginPage = this.data.pages.find(p => p.pageType === 'login');
    const signupPage = this.data.pages.find(p => p.pageType === 'signup');
    const dashboardPage = this.data.pages.find(p => p.pageType === 'dashboard');

    if (loginPage && dashboardPage) {
      flows.push({
        name: 'Login Flow',
        steps: [
          { action: 'Navigate to login', url: loginPage.url },
          { action: 'Fill credentials', selector: 'form' },
          { action: 'Submit form', selector: 'button[type="submit"]' },
          { action: 'Verify redirect', url: dashboardPage.url }
        ]
      });
    }

    if (signupPage && dashboardPage) {
      flows.push({
        name: 'Signup Flow',
        steps: [
          { action: 'Navigate to signup', url: signupPage.url },
          { action: 'Fill registration form', selector: 'form' },
          { action: 'Submit form', selector: 'button[type="submit"]' },
          { action: 'Verify account created', url: dashboardPage.url }
        ]
      });
    }

    // Search flow
    const searchForms = this.data.forms.filter(f =>
      this.identifyFormPattern(f) === 'search'
    );

    if (searchForms.length > 0) {
      flows.push({
        name: 'Search Flow',
        steps: [
          { action: 'Enter search query', selector: 'input[type="search"], input[name*="search"]' },
          { action: 'Submit search', selector: 'button[type="submit"]' },
          { action: 'Verify results displayed', selector: '[class*="result"], [class*="search"]' }
        ]
      });
    }

    // List to detail flow
    const listPages = this.data.pages.filter(p => p.pageType === 'list');
    const detailPages = this.data.pages.filter(p => p.pageType === 'detail');

    if (listPages.length > 0 && detailPages.length > 0) {
      flows.push({
        name: 'Browse to Detail Flow',
        steps: [
          { action: 'Navigate to list page', url: listPages[0].url },
          { action: 'Click on item', selector: 'a[href*="' + listPages[0].path + '"]' },
          { action: 'Verify detail page loaded', selector: 'h1' }
        ]
      });
    }

    return flows;
  }

  /**
   * Generate test scenarios based on discovered features
   */
  generateTestScenarios() {
    const scenarios = [];

    // Homepage test
    const homepage = this.data.pages.find(p => p.pageType === 'homepage' || p.path === '/');
    if (homepage) {
      scenarios.push({
        name: 'Homepage Load Test',
        description: 'Verify homepage loads correctly',
        steps: [
          `Navigate to ${homepage.url}`,
          'Verify page title is present',
          'Check for main navigation',
          'Capture screenshot'
        ]
      });
    }

    // Form submission tests
    this.data.forms.forEach((form, index) => {
      const pattern = this.identifyFormPattern(form);
      if (pattern !== 'generic') {
        scenarios.push({
          name: `${this.capitalize(pattern)} Form Test`,
          description: `Test ${pattern} form submission`,
          steps: [
            `Navigate to form page`,
            'Fill all required fields',
            'Submit form',
            'Verify success or redirect'
          ]
        });
      }
    });

    // Navigation test
    if (this.data.pages.length > 3) {
      scenarios.push({
        name: 'Navigation Test',
        description: 'Verify main navigation works',
        steps: [
          'Start at homepage',
          'Click through main navigation links',
          'Verify each page loads',
          'Check for broken links'
        ]
      });
    }

    // Responsive test
    scenarios.push({
      name: 'Responsive Design Test',
      description: 'Test responsive behavior',
      steps: [
        'Load page in desktop viewport',
        'Take screenshot',
        'Switch to mobile viewport',
        'Take screenshot',
        'Verify layout adapts'
      ]
    });

    return scenarios;
  }

  /**
   * Attempt to detect framework/technology
   */
  detectFramework() {
    const detection = {
      framework: 'unknown',
      indicators: []
    };

    // This is a simplified detection - would need more sophisticated analysis
    // in a production implementation

    const allPageText = this.data.pages.map(p =>
      p.title + ' ' + p.description + ' ' + p.preview
    ).join(' ').toLowerCase();

    if (allPageText.includes('react') || allPageText.includes('__react')) {
      detection.framework = 'React';
      detection.indicators.push('React detected in page content');
    } else if (allPageText.includes('vue') || allPageText.includes('v-')) {
      detection.framework = 'Vue.js';
      detection.indicators.push('Vue detected in page content');
    } else if (allPageText.includes('angular')) {
      detection.framework = 'Angular';
      detection.indicators.push('Angular detected in page content');
    }

    return detection;
  }

  /**
   * Capitalize first letter
   */
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

module.exports = AnalysisEngine;
