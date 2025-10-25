---
name: PullUp - App Testing Skill Generator
description: Higher-order skill that generates application-specific testing skills. Explores web applications, maps their structure, and creates customized testing skills that work with Playwright. Use when you need to create a testing skill for a specific web application.
version: 1.0.0
author: Developer
tags: [testing, automation, skill-generator, meta-skill, web-testing]
---

**IMPORTANT - Path Resolution:**
This skill can be installed in different locations. Before executing commands, determine the skill directory based on where you loaded this SKILL.md file, and use that path in all commands below. Replace `$SKILL_DIR` with the actual discovered path.

Common installation paths:

- Plugin system: `~/.claude/plugins/marketplaces/pullup/skills/pullup-skill`
- Manual global: `~/.claude/skills/pullup-skill`
- Project-specific: `<project>/.claude/skills/pullup-skill`

# PullUp - Application Testing Skill Generator

A meta-skill that creates application-specific testing skills by exploring web applications and capturing their structure, features, and test patterns.

## What It Does

PullUp solves the problem of repeatedly providing application details every time you want to test a specific web app. Instead:

1. **One-time exploration**: PullUp explores your web application once
2. **Knowledge capture**: Maps pages, forms, navigation, and interactive elements
3. **Skill generation**: Creates a custom testing skill with all this knowledge
4. **Easy testing**: Use the generated skill for quick, context-aware testing

## How It Works

1. You provide: Application URL, name, and optional feature documentation
2. PullUp explores the application using browser automation
3. Generates a custom skill with application knowledge
4. You can now test the app without re-explaining its structure

## Setup (First Time)

```bash
cd $SKILL_DIR
npm run setup
```

This installs Playwright and Chromium browser. Only needed once.

## Usage

### Recommended: Use Documentation Files

The easiest way to use PullUp is to provide your existing project documentation. PullUp automatically extracts URLs, credentials, pages, features, and more.

**From a single file:**

```
"Use PullUp to create a testing skill from README.md for myapp"
```

**From a documentation folder:**

```
"Create testing skill for myapp using docs from ./project-docs folder"
```

**With guidance:**

```
"Create testing skill for myapp from ./docs folder.
Focus on the admin features - they're the most important to test."
```

### What Documentation to Provide

Any text or markdown files work. PullUp extracts useful information automatically:

Create a file like `myapp-info.md`:

```markdown
# MyApp Documentation

Runs at: http://localhost:3000

## Features

- Login page: /login
- Dashboard: /dashboard
- Settings: /settings

## Test Account

Email: test@example.com
Password: testpass123
```

Then:

```
"Use PullUp to create a testing skill from myapp-info.md for myapp"
```

**Or use a documentation folder:**

```
"Create testing skill for myapp using docs from ./project-docs folder"
```

PullUp reads all `.txt`, `.md`, and `.markdown` files recursively and extracts:

- ✅ Application URLs (http://localhost:3000, etc.)
- ✅ Page paths (/login, /dashboard, /products, etc.)
- ✅ Credentials (test emails and passwords)
- ✅ Feature descriptions (from headings, bullet points)
- ✅ Important notes and context

### Alternative: Just URL

If you don't have documentation handy:

```
"Create a testing skill for my app at http://localhost:3000 called 'myapp'"
```

### Update an Existing Skill

When your application changes:

```
"Update the mystore testing skill"
```

PullUp will re-explore and merge new findings with existing knowledge.

## Execution Pattern

**Step 1: Provide documentation (recommended) or URL**

```bash
# Recommended: With documentation file
cd $SKILL_DIR && node execute.js --name myapp --docs ./README.md

# With documentation folder (reads all text files recursively)
cd $SKILL_DIR && node execute.js --name myapp --docs ./docs

# With guidance prompt to focus exploration
cd $SKILL_DIR && node execute.js --name myapp --docs ./docs \
  --prompt "Focus on admin features"

# Alternative: Just URL (if no documentation available)
cd $SKILL_DIR && node execute.js --name myapp --url http://localhost:3000

# Update existing skill
cd $SKILL_DIR && node execute.js --name myapp --update
```

**Step 2: PullUp explores and generates**

PullUp will:

1. Read documentation (if provided) to extract context
2. Explore your application with Playwright
3. Discover pages, forms, and interactive elements
4. Generate a complete testing skill

**Step 3: Use the generated skill**

```
"Use myapp-testing to verify the homepage loads"
"Test login with myapp-testing skill"
```

## Generated Skill Structure

PullUp creates a new skill directory:

```
~/.claude/skills/mystore-testing/
├── SKILL.md               # Generated skill definition
├── app-knowledge.json     # Application structure map
├── test-patterns.js       # Common test helpers
└── README.md              # Usage instructions
```

## What Gets Discovered

During exploration, PullUp identifies:

### Pages

- All accessible URLs
- Page titles and purposes
- Navigation structure
- Page types (form, list, detail, etc.)

### Forms

- Input fields with names and types
- Buttons and submit actions
- Validation requirements
- Expected outcomes

### Interactive Elements

- Buttons and their actions
- Links and navigation
- Modals and popups
- Dynamic content areas

### User Flows

- Login/logout patterns
- Multi-step processes (signup, checkout, etc.)
- Navigation paths between pages
- Common user journeys

## Exploration Strategy

PullUp uses intelligent exploration:

1. **Starting Point**: Begins at provided URL
2. **Crawling**: Follows internal links (same domain)
3. **Depth Limit**: Configurable max depth (default: 3 levels)
4. **Rate Limiting**: Respects server load
5. **Authentication**: Tests auth flows if credentials provided
6. **Screenshots**: Captures key pages for reference

## Configuration Options

PullUp uses command-line options for configuration. The primary options are:

### Primary Options

**--docs <path>** (Recommended)
- Path to documentation file or folder
- PullUp automatically extracts:
  - URLs (http://localhost:3000, etc.)
  - Page paths (/login, /dashboard, etc.)
  - Credentials (test emails and passwords)
  - Features (from headings, bullet points)
  - Important notes and context
- Supports: `.md`, `.txt`, `.markdown`, `.json`, `.rst`, `.org`, `.adoc` files
- Can be a single file or entire folder (reads recursively)

**--prompt <text>**
- Additional instructions or guidance for exploration
- Use to focus on specific features or areas
- Provide context about what's most important to test
- Examples:
  - "Focus on admin features"
  - "Pay special attention to the checkout flow"
  - "The authentication system is the most critical part"

**--name <appname>** (Required)
- Name of your application (used for skill naming)

### Additional Options

**--url <url>**
- Explicit application URL
- Optional if provided via --docs
- Use when you want to override or specify URL directly

**--update**
- Update an existing skill instead of creating new one
- Re-explores application and merges with existing knowledge

**--output <dir>**
- Custom output directory for generated skill
- Default: `~/.claude/skills/`

**--verbose**
- Enable detailed logging during exploration

### Advanced Options

**--max-depth <n>**
- Maximum crawl depth (default: 3)

**--max-pages <n>**
- Maximum pages to explore (default: 50)

## Generated Skill Format

When PullUp generates an application-specific testing skill, the skill MUST include executable Playwright script excerpts for specific interactions. This allows Claude to directly run these scripts as part of testing workflows without having to generate the Playwright code from scratch each time.

### Playwright Script Excerpts

Each common interaction should have a ready-to-execute Playwright script excerpt. These excerpts should:

1. **Be Complete & Runnable**: Include all necessary imports and setup
2. **Be Interaction-Specific**: Focus on a single interaction or workflow
3. **Use Application Data**: Reference actual selectors, URLs, and data from exploration
4. **Include Error Handling**: Handle common failure cases
5. **Be Well-Commented**: Explain what each step does

Example format for generated skills:

```markdown
### Login Flow

**Playwright Script:**
\`\`\`javascript
// Login to application
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to login page
    await page.goto('http://localhost:3000/login');

    // Fill login form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'testpass123');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL('**/dashboard');

    console.log('✅ Login successful');
  } catch (error) {
    console.error('❌ Login failed:', error.message);
  } finally {
    await browser.close();
  }
})();
\`\`\`
```

This allows Claude to:
- Directly execute these scripts for testing
- Modify them for specific test cases
- Combine multiple scripts for complex workflows
- Use them as templates for similar interactions

## Using Generated Skills

Once created, use generated skills naturally:

```
"Use mystore-testing skill to verify the checkout flow"
"Test login using mystore-testing skill"
"Check if product search works in mystore"
```

The generated skill already knows:

- Application URL
- Page structure
- Element selectors
- Expected workflows
- Test credentials (if provided)

## Skill Composability

Generated skills reference the base Playwright skill:

- Don't duplicate execution logic
- Focus on application knowledge
- Leverage Playwright's full capabilities
- Can specify extensions to include

## Extension System

Extend PullUp with specialized analyzers:

### Security Extension

Adds security testing patterns:

- XSS vulnerability checks
- SQL injection tests
- Authentication bypass attempts
- Security header verification

### Accessibility Extension

Adds accessibility testing:

- ARIA label verification
- Keyboard navigation tests
- Screen reader compatibility
- Color contrast checks

### Performance Extension

Adds performance benchmarks:

- Page load timing
- Resource size analysis
- Rendering performance
- Network request optimization

### Using Extensions

```
"Create a testing skill with security extension"
"Use PullUp with accessibility and performance extensions"
```

Extensions are npm packages: `pullup-extension-security`, `pullup-extension-accessibility`, etc.

## Output Format

PullUp provides detailed feedback:

```
🔍 Exploring http://localhost:3000...

📄 Discovered 12 pages:
  ✅ / (Homepage)
  ✅ /login (Login Form)
  ✅ /products (Product List)
  ✅ /products/123 (Product Detail)
  ✅ /cart (Shopping Cart)
  ... and 7 more

📝 Found 5 forms:
  - Login (2 fields: email, password)
  - Signup (5 fields)
  - Search (1 field)
  - Checkout (8 fields)
  - Contact (4 fields)

🔗 Identified flows:
  - Login → Dashboard
  - Browse → Add to Cart → Checkout → Confirmation
  - Search → Results → Product Detail

✨ Generated skill: ~/.claude/skills/mystore-testing/

📊 Statistics:
  - Pages: 12
  - Forms: 5
  - Buttons: 47
  - Links: 89
  - Images: 23

⏱️  Completed in 23 seconds
```

## Tips

- **Provide credentials**: Better exploration of authenticated areas
- **Document features**: Help PullUp understand application purpose
- **Update regularly**: Re-run PullUp when application changes significantly
- **Review generated skill**: Check app-knowledge.json for accuracy
- **Customize**: Edit generated test-patterns.js for specific needs

## Troubleshooting

**Skill generation fails:**

```bash
cd $SKILL_DIR && npm run setup
```

**Can't access authenticated pages:**
Provide credentials in documentation files or via --prompt argument

**Too many pages discovered:**
Adjust with --max-pages and --max-depth command-line options

**Missing important pages:**
Add them to your documentation files or use --prompt to specify them

## Example Workflow

**Initial Setup:**

```
User: "Create a testing skill for my app at localhost:3000 called todoapp"

Claude: I'll explore your application and create a testing skill.
[Runs PullUp skill]
[Explores 8 pages, finds 3 forms, identifies 2 user flows]

Created 'todoapp-testing' skill at ~/.claude/skills/todoapp-testing/

Discovered:
- Login page at /login
- Todo list at /todos
- Add todo form
- Edit todo functionality
- Delete todo action

You can now use: "Test the todo creation flow using todoapp-testing"
```

**Using Generated Skill:**

```
User: "Use todoapp-testing to verify login works"

Claude: I'll test login for todoapp.
[Uses todoapp-testing skill - already knows URL, selectors, credentials]
[References base Playwright skill for execution]

Login test passed ✅
- Navigated to http://localhost:3000/login
- Filled email: test@example.com
- Filled password: [hidden]
- Successfully redirected to /todos
```

**Updating After Changes:**

```
User: "We added a calendar view, update todoapp-testing skill"

Claude: I'll update the skill by re-exploring todoapp.
[Runs PullUp with --update flag]
[Discovers new /calendar page]
[Merges with existing knowledge]

Updated todoapp-testing skill:
- Added /calendar page
- Found new calendar navigation button
- Updated navigation structure
- Preserved your custom patterns
```

## Command Reference

**Primary Usage:**
```bash
# Recommended: With documentation
node execute.js --name <appname> --docs <file-or-folder>

# With guidance prompt
node execute.js --name <appname> --docs <path> --prompt "Focus on X feature"

# Update existing skill
node execute.js --name <appname> --update
```

**Additional Options:**
```bash
# Custom output directory
node execute.js --name <appname> --docs <path> --output ~/.claude/skills/

# Verbose output
node execute.js --name <appname> --docs <path> --verbose

# Advanced: Custom exploration settings
node execute.js --name <appname> --docs <path> --max-depth 5 --max-pages 100

# Fallback: Just URL (if no documentation)
node execute.js --name <appname> --url <url>
```

## Notes

- PullUp is a meta-skill that creates other skills
- Generated skills are self-contained and reusable
- Skills can be shared with team members
- Regular updates keep skills in sync with application changes
- Extensions enable specialized testing without modifying core PullUp
- Works best with modern web applications (SPAs, progressive web apps)
