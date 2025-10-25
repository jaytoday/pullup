/**
 * Skill Update Engine
 *
 * Updates existing application-specific skills by re-exploring
 * the application and merging new discoveries with existing knowledge.
 */

const fs = require('fs');
const path = require('path');
const ExplorationEngine = require('./explorer');
const AnalysisEngine = require('./analyzer');
const SkillGenerator = require('./generator');

class SkillUpdater {
  constructor(config) {
    this.config = config;
    this.appName = config.appName;
    this.skillName = `${this.appName}-testing`;
    this.skillPath = path.join(config.outputDirectory, this.skillName);
  }

  /**
   * Update existing skill
   */
  async updateSkill() {
    console.log(`🔄 Updating skill: ${this.skillName}`);

    // Verify skill exists
    if (!fs.existsSync(this.skillPath)) {
      throw new Error(`Skill not found at: ${this.skillPath}\nCreate it first with --name and --url`);
    }

    // Load existing knowledge
    const knowledgePath = path.join(this.skillPath, 'app-knowledge.json');
    if (!fs.existsSync(knowledgePath)) {
      throw new Error(`app-knowledge.json not found. Skill may be corrupted.`);
    }

    const existingKnowledge = JSON.parse(
      fs.readFileSync(knowledgePath, 'utf8')
    );

    console.log(`📂 Found existing skill (version ${existingKnowledge.version})`);

    // Get URL from existing knowledge if not provided
    if (!this.config.targetUrl) {
      this.config.targetUrl = existingKnowledge.baseUrl;
      console.log(`   Using existing URL: ${this.config.targetUrl}`);
    }

    // Re-explore the application
    console.log(`\n🔍 Re-exploring application...\n`);

    const explorer = new ExplorationEngine(this.config);
    const newExplorationData = await explorer.explore();

    console.log(`\n📊 New exploration complete!`);

    // Analyze new data
    console.log(`🔬 Analyzing changes...\n`);

    const analyzer = new AnalysisEngine(newExplorationData, this.config);
    const newAnalysis = await analyzer.analyze();

    // Merge with existing knowledge
    console.log(`🔗 Merging with existing knowledge...\n`);

    const mergedAnalysis = this.mergeKnowledge(existingKnowledge, newAnalysis);

    // Backup existing skill
    await this.backupExistingSkill();

    // Generate updated skill
    console.log(`✨ Generating updated skill...\n`);

    const generator = new SkillGenerator(mergedAnalysis, this.config);
    await generator.generate();

    // Generate summary
    const summary = this.generateUpdateSummary(existingKnowledge, mergedAnalysis);

    return {
      skillPath: this.skillPath,
      summary: summary
    };
  }

  /**
   * Merge existing and new knowledge
   */
  mergeKnowledge(existing, newAnalysis) {
    const merged = { ...newAnalysis };

    // Increment version
    const versionParts = existing.version.split('.');
    versionParts[1] = parseInt(versionParts[1]) + 1;
    merged.version = versionParts.join('.');

    // Merge pages - combine categories
    for (const category in merged.pages) {
      const existingPages = existing.pages[category] || [];
      const newPages = merged.pages[category] || [];

      // Create map of existing pages by path
      const existingMap = new Map();
      existingPages.forEach(p => existingMap.set(p.path, p));

      // Update with new pages, preserving any custom data
      newPages.forEach(newPage => {
        const existingPage = existingMap.get(newPage.path);
        if (existingPage && existingPage.customData) {
          newPage.customData = existingPage.customData;
        }
      });
    }

    // Merge forms - keep track of removed forms
    const existingFormPaths = new Set(
      existing.forms.map(f => new URL(f.action).pathname)
    );
    const newFormPaths = new Set(
      merged.forms.map(f => new URL(f.action).pathname)
    );

    // Add note about removed forms
    merged.removedForms = Array.from(existingFormPaths)
      .filter(path => !newFormPaths.has(path));

    // Preserve any custom test data from existing forms
    merged.forms.forEach(newForm => {
      const existingForm = existing.forms.find(f =>
        new URL(f.action).pathname === new URL(newForm.action).pathname
      );
      if (existingForm && existingForm.customTestData) {
        newForm.customTestData = existingForm.customTestData;
      }
    });

    // Add metadata about update
    merged.updateHistory = existing.updateHistory || [];
    merged.updateHistory.push({
      date: new Date().toISOString(),
      previousVersion: existing.version,
      newVersion: merged.version,
      pagesAdded: this.countNewPages(existing, merged),
      formsAdded: merged.forms.length - existing.forms.length,
      flowsAdded: merged.userFlows.length - existing.userFlows.length
    });

    return merged;
  }

  /**
   * Count new pages discovered
   */
  countNewPages(existing, merged) {
    const existingPaths = new Set();
    Object.values(existing.pages).flat().forEach(p => existingPaths.add(p.path));

    let newCount = 0;
    Object.values(merged.pages).flat().forEach(p => {
      if (!existingPaths.has(p.path)) {
        newCount++;
      }
    });

    return newCount;
  }

  /**
   * Backup existing skill before updating
   */
  async backupExistingSkill() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const backupDir = path.join(this.skillPath, '.backups');

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupPath = path.join(backupDir, `backup-${timestamp}`);

    // Copy current files
    const filesToBackup = ['SKILL.md', 'app-knowledge.json', 'test-patterns.js', 'README.md'];

    fs.mkdirSync(backupPath, { recursive: true });

    filesToBackup.forEach(file => {
      const sourcePath = path.join(this.skillPath, file);
      if (fs.existsSync(sourcePath)) {
        const destPath = path.join(backupPath, file);
        fs.copyFileSync(sourcePath, destPath);
      }
    });

    console.log(`   💾 Backup created: ${backupPath}`);
  }

  /**
   * Generate human-readable update summary
   */
  generateUpdateSummary(existing, merged) {
    const updates = [];

    const pagesAdded = this.countNewPages(existing, merged);
    if (pagesAdded > 0) {
      updates.push(`${pagesAdded} new pages discovered`);
    }

    const formDiff = merged.forms.length - existing.forms.length;
    if (formDiff > 0) {
      updates.push(`${formDiff} new forms found`);
    } else if (formDiff < 0) {
      updates.push(`${Math.abs(formDiff)} forms removed`);
    }

    const flowDiff = merged.userFlows.length - existing.userFlows.length;
    if (flowDiff > 0) {
      updates.push(`${flowDiff} new flows identified`);
    }

    if (updates.length === 0) {
      return 'No significant changes detected';
    }

    return updates.join(', ');
  }
}

module.exports = SkillUpdater;
