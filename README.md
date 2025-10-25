# PullUp - Application Testing Skill Generator

PullUp is a "factory" Claude skill: a skill that that generates application-specific testing skills for web applications.

When using browser automation tools like Playwright, you constantly need to provide the same information:

- Application URLs and structure
- Page locations and navigation
- Form fields and selectors
- Test credentials
- Expected behaviors and workflows

If you are just providing this information in natural language, it can take a considerable amount of time and token usage for Claude to generate the corresponding Playwright code every time it is performing the same tests.

PullUp explores your web application once and generates a custom testing skill that:

- Already knows your application's structure
- Has pre-mapped pages, forms, and interactive elements
- Includes test patterns for common workflows
- References the base Playwright skill for execution
- Can be updated as your application evolves

This results in being able to more easily invoke Playwright testing for your application, and also results in faster test execution since the skill already contains a baseline of reference information for generating Playwright test scripts for your application.

## How It Works

```
┌─────────────────┐
│  Your Web App   │
│  localhost:3000 │
└────────┬────────┘
         │
         ▼
    ┌────────┐
    │ PullUp │ ◄─── "Create testing skill for myapp at localhost:3000"
    └────┬───┘
         │
         ├─► Explores application (crawls pages, finds forms)
         ├─► Analyzes structure (identifies patterns, flows)
         └─► Generates skill files
              │
              ▼
    ┌─────────────────────┐
    │ myapp-testing skill │
    ├─────────────────────┤
    │ • SKILL.md          │
    │ • app-knowledge.json│
    │ • test-patterns.js  │
    │ • README.md         │
    └─────────────────────┘
              │
              ▼
    Now you can use it:
    "Test login using myapp-testing"
```

## Features

- **Automatic Discovery**: Crawls your application to discover pages, forms, and user flows
- **Smart Analysis**: Identifies patterns, categorizes pages, and generates test scenarios
- **Skill Composability**: Generated skills reference the base Playwright skill for execution
- **Easy Updates**: Re-run PullUp to update skills as your application evolves
- **Extension Support**: Plug in specialized analyzers for security, accessibility, or performance testing
- **Portable Skills**: Share generated skills with your team

## Installation

### Prerequisites

- Node.js >= 14.0.0
- Playwright skill (for executing generated tests)

### Setup

1. Clone or download this repository
2. Navigate to the skill directory:

   ```bash
   cd pullup/skills/pullup-skill
   ```

3. Install dependencies:
   ```bash
   npm run setup
   ```

This installs Playwright and Chromium. Only needed once.

## Quick Start

### Step 1: Create a Testing Skill

**Option A: With Documentation (Recommended)**

Create a simple documentation file `app-info.md`:

```markdown
# MyApp
http://localhost:3000

## Features
- Login: /login
- Dashboard: /dashboard

## Test User
email: test@example.com
password: testpass123
```

Then run:

```bash
cd skills/pullup-skill
node execute.js --name myapp --docs app-info.md
```

Or use an entire documentation folder:

```bash
node execute.js --name myapp --docs ./docs
```

**Option B: Just URL**

```bash
node execute.js --name myapp --url http://localhost:3000
```

**Option C: With Guidance**

```bash
node execute.js --name myapp --docs ./docs \
  --prompt "Focus on admin features, they're most important"
```

PullUp will:

1. Read documentation to understand your app (if --docs provided)
2. Explore your application (typically takes 10-30 seconds)
3. Discover pages, forms, and interactive elements
4. Analyze the structure and identify patterns
5. Generate a custom skill in `~/.claude/skills/myapp-testing/`

### Step 2: Use the Generated Skill

Now when working with Claude, you can simply say:

```
"Use myapp-testing to verify the homepage loads"
"Test the login flow using myapp-testing"
"Check if the checkout process works in myapp"
```

The generated skill already knows:

- Your application's URL
- Page structure and navigation
- Form fields and their purposes
- Common user flows
- Where to find test credentials (if you provided them)

You can also add to your project `CLAUDE.md` an instruction to always test using the generated skill in certain scenarios (non-trivial features and bug fixes, for example), so your prompts don't need to specify testing with the skill.

### Step 3: Update When Needed

As your application changes, you can easily update the skill:

```bash
node execute.js --name myapp --update
```

PullUp will re-explore, find changes, and merge them with existing knowledge.

## Detailed Usage

### Using Documentation Files (Recommended)

**The easiest way:** Provide documentation about your application in plain text or markdown. PullUp extracts useful information automatically.

Create a file like `app-info.md`:

```markdown
# MyApp

Application runs at http://localhost:3000

## Features
- User login at /login
- Dashboard at /dashboard
- Product catalog at /products

## Test Credentials
- Email: test@example.com
- Password: testpass123
```

Then use it:

```bash
node execute.js --name myapp --docs app-info.md
```

**Or use a documentation folder:**

```bash
# Reads all .md, .txt files recursively from folder
node execute.js --name myapp --docs ./project-docs
```

PullUp automatically extracts:
- URLs (http://... or localhost:...)
- Page paths (starting with /)
- Credentials (email/password patterns)
- Features (headings, bullet points)
- Important notes

See `examples/app-documentation.md` for a complete example.

**Add instructions with --prompt:**

Guide PullUp's exploration and prioritization:

```bash
# Emphasize certain features
node execute.js --name myapp --docs ./docs \
  --prompt "Focus on the e-commerce checkout flow, it's the most critical feature"

# Guide documentation reading
node execute.js --name myapp --docs ./project-docs \
  --prompt "The admin folder contains the most important features to test"

# Provide context
node execute.js --name myapp --url http://localhost:3000 \
  --prompt "This is a React SPA with client-side routing, main features are under /app path"
```

The prompt helps PullUp understand what's important in your documentation and application.

### Command Line Options

```bash
# Basic usage
node execute.js --name <appname> --url <url>

# With documentation file (recommended)
node execute.js --name <appname> --docs <file-or-folder>

# With instructions/prompt
node execute.js --name <appname> --docs ./docs --prompt "Focus on admin features"

# Update existing skill
node execute.js --name <appname> --update

# Custom output directory
node execute.js --name myapp --url http://localhost:3000 --output ./my-skills

# Control exploration depth
node execute.js --name myapp --url http://localhost:3000 --max-depth 5 --max-pages 100

# Verbose output
node execute.js --name myapp --url http://localhost:3000 --verbose

# With extensions (future feature)
node execute.js --name myapp --url http://localhost:3000 --extensions security,accessibility
```

### Help

```bash
node execute.js --help
```

## What Gets Generated

PullUp creates a complete skill package:

```
~/.claude/skills/myapp-testing/
├── SKILL.md                # Skill definition (Claude reads this)
├── app-knowledge.json      # Complete application structure
├── test-patterns.js        # Reusable test helper functions
└── README.md              # Usage documentation
```

### SKILL.md

The main skill file that Claude reads. Contains:

- Application context (URL, pages, forms)
- Key pages and their purposes
- Form definitions with field mappings
- User flows (login, signup, checkout, etc.)
- Test scenarios
- Usage examples

### app-knowledge.json

Structured data about your application:

- Complete page inventory with URLs and types
- Form definitions with field names and test data
- Navigation hierarchy
- Identified user flows
- Discovery statistics

### test-patterns.js

Helper functions for common operations:

- `navigateToPage(page, pageName)` - Go to a specific page
- `fillFormWithTestData(page, formPattern)` - Auto-fill forms
- `executeFlow(page, flowName)` - Run a user flow
- `getPagesByType(type)` - Find pages by category
- And more...

### README.md

Documentation for the generated skill:

- Quick usage guide
- Application structure overview
- Available test patterns
- Update instructions

## Example Workflow

Let's walk through a complete example with a todo application:

### 1. Create the Skill

```bash
cd skills/pullup-skill
node execute.js --name todoapp --url http://localhost:3000
```

Output:

```
🚀 PullUp - Application Testing Skill Generator

📋 Configuration:
   Application: todoapp
   URL: http://localhost:3000
   Mode: Create

🔍 Starting application exploration...

..........

⏱️  Exploration completed in 15 seconds

📊 Exploration complete!
   Pages discovered: 8
   Forms found: 3
   Flows identified: 2

🔬 Analyzing application structure...

✅ Analysis complete!

✨ Generating testing skill...

   📄 SKILL.md generated
   📊 app-knowledge.json generated
   🧪 test-patterns.js generated
   📖 README.md generated

🎉 Success! Testing skill generated!
📁 Location: /Users/you/.claude/skills/todoapp-testing

📖 Next steps:
   1. Review the generated skill
   2. Test it: "Use todoapp-testing skill to verify the homepage"
   3. Update when needed: node execute.js --name todoapp --update
```

### 2. Review the Generated Skill

```bash
cd ~/.claude/skills/todoapp-testing
cat SKILL.md
```

You'll see:

- 8 pages discovered (home, login, todos, add, edit, etc.)
- 3 forms mapped (login, add todo, edit todo)
- 2 flows identified (login flow, add todo flow)
- Test scenarios for each feature

### 3. Use the Skill

In Claude:

```
User: "Use todoapp-testing to test if login works"

Claude: I'll test the login flow for todoapp.
[Uses todoapp-testing skill to get login page URL and form fields]
[References Playwright skill to execute the test]

Test Results:
✅ Navigated to http://localhost:3000/login
✅ Found login form with email and password fields
✅ Filled credentials
✅ Successfully redirected to /todos
✅ Login test passed!
```

### 4. Update After Changes

You add a new "calendar view" to your todo app:

```bash
cd skills/pullup-skill
node execute.js --name todoapp --update
```

Output:

```
🔄 Updating skill: todoapp-testing

📂 Found existing skill (version 1.0.0)
   Using existing URL: http://localhost:3000

🔍 Re-exploring application...

📊 New exploration complete!

🔬 Analyzing changes...

🔗 Merging with existing knowledge...

   💾 Backup created: .backups/backup-2025-10-24

✨ Generating updated skill...

✅ Skill update completed!
📁 Location: /Users/you/.claude/skills/todoapp-testing
📊 Changes: 1 new pages discovered, 1 new flows identified
```

The skill now includes the calendar view!

## How Exploration Works

### Discovery Process

1. **Starting Point**: PullUp begins at your provided URL
2. **Breadth-First Crawl**: Follows internal links to discover pages
3. **Depth Control**: Limits depth to prevent infinite loops (default: 3 levels)
4. **Page Limit**: Stops after discovering a set number of pages (default: 50)
5. **Element Extraction**: On each page:
   - Extracts page metadata (title, heading, description)
   - Finds and catalogs forms with field definitions
   - Identifies interactive elements (buttons, links)
   - Takes screenshots for reference
   - Discovers navigation links

### What Gets Analyzed

- **Page Classification**: Homepage, login, signup, list, detail, form, etc.
- **Form Pattern Recognition**: Login, signup, search, contact, checkout forms
- **User Flow Identification**: Login→Dashboard, Browse→Detail, Search→Results
- **Test Data Generation**: Appropriate test values for each form field
- **Navigation Mapping**: Site structure and hierarchy

### Limitations

- Only explores same-domain pages (respects domain boundaries)
- Skips binary files (PDFs, images, downloads)
- Cannot execute JavaScript beyond what Playwright automatically runs
- May miss pages requiring complex interactions to access
- Single-page apps with heavy JavaScript routing may need explicit page lists

## Extension System (Future)

PullUp is designed to support extensions for specialized testing:

### Planned Extensions

- **pullup-extension-security**: Security and penetration testing patterns
- **pullup-extension-accessibility**: Accessibility testing (WCAG compliance)
- **pullup-extension-performance**: Performance benchmarking
- **pullup-extension-visual**: Visual regression testing

### How Extensions Will Work

Extensions will be able to:

- Add custom analyzers during exploration
- Inject specialized test patterns
- Enhance generated skills with domain-specific tests
- Provide additional discovery logic

Usage (when available):

```bash
node execute.js --name myapp --url http://localhost:3000 --extensions security
```

## Best Practices

### For Better Discovery

1. **Provide explicit page lists**: Add key pages to your documentation to ensure they're found
2. **Include credentials**: Enable exploration of authenticated areas in documentation
3. **Document features**: Help PullUp understand application purpose
4. **Set appropriate limits**: Adjust `--max-depth` and `--max-pages` for your app size
5. **Review generated skill**: Check `app-knowledge.json` for accuracy

### For Better Testing

1. **Keep skills updated**: Re-run PullUp when application changes significantly
2. **Customize test data**: Edit form test data in `app-knowledge.json` for better tests
3. **Add custom patterns**: Extend `test-patterns.js` with your own helpers
4. **Use verbose mode**: Debug exploration issues with `--verbose` flag
5. **Share with team**: Generated skills can be version controlled and shared

### Security Notes

- **Never commit real passwords**: Use placeholder values for credentials
- **Review generated files**: Ensure no sensitive data in skill files
- **Limit exploration**: Use `maxPages` to prevent excessive crawling
- **Respect robots.txt**: Consider server load and crawl policies

## Architecture

### Core Components

```
pullup/
├── execute.js          # Main entry point, CLI handling
└── lib/
    ├── explorer.js     # Web crawling engine
    ├── analyzer.js     # Pattern analysis
    ├── generator.js    # Skill file generation
    └── updater.js      # Skill update logic
```

### Data Flow

```
User Input → Explorer → Analysis → Generator → Skill Files
   ↓            ↓          ↓           ↓          ↓
Config      Raw Data   Patterns   Templates   SKILL.md
            Pages      Flows      Helpers     app-knowledge.json
            Forms      Scenarios             test-patterns.js
            Elements   Categories            README.md
```

### Skill Composability

Generated skills extend the base Playwright skill:

```
User Request
     ↓
myapp-testing skill (provides context)
     ↓
playwright-skill (executes automation)
     ↓
Browser Actions
```

This separation ensures:

- Generated skills focus on application knowledge
- Execution logic stays in Playwright skill
- Updates to either skill don't affect the other
- Skills remain lightweight and maintainable

## Troubleshooting

### Common Issues

**"Unknown option: ---docs"**
→ Use two dashes: `--docs` not `---docs`

**"Application URL is required"**
→ Add `--url http://localhost:3000` or include URL in your documentation

**"No text files found in folder"**
→ Make sure folder contains `.md`, `.txt`, or `.markdown` files

### "Playwright not found"

Run setup:

```bash
cd skills/pullup-skill
npm run setup
```

### "Skill not found" (when updating)

Create the skill first:

```bash
node execute.js --name myapp --url http://localhost:3000
```

### "Too few pages discovered"

- Check if site requires authentication - provide credentials in documentation
- Increase `maxDepth` and `maxPages` with command-line options
- Add important pages to your documentation files
- Use `--verbose` to see what's being explored

### "Exploration times out"

- Check if site is accessible
- Verify no blocking popups or cookie banners
- Try with fewer max pages: `--max-pages 25`

### "Generated skill doesn't work well"

- Review `app-knowledge.json` for accuracy
- Add missing pages to your documentation
- Provide more context with `--prompt`
- Customize `test-patterns.js` with your own helpers
- Re-run with `--update` after improving documentation

## Roadmap

### Current Version (1.0.0)

- ✅ Basic exploration and discovery
- ✅ Form and flow analysis
- ✅ Skill generation
- ✅ Skill updates
- ✅ Configurable exploration

### Planned Features

- 🔲 Extension system for specialized testing
- 🔲 Interactive exploration mode (user guides the crawl)
- 🔲 Visual regression baseline capture
- 🔲 API endpoint discovery and testing
- 🔲 Multi-environment support (dev/staging/prod)
- 🔲 CI/CD integration helpers
- 🔲 Skill marketplace for sharing
- 🔲 Enhanced framework detection
- 🔲 Smarter flow identification with ML
- 🔲 Collaborative editing of generated skills

## Contributing

Contributions are welcome! Areas for improvement:

- Better framework detection
- Smarter flow identification
- More robust form analysis
- Support for complex SPAs
- Extension system implementation
- Documentation improvements

## Technical Details

### Dependencies

- **Playwright**: Browser automation (^1.48.0)
- **Node.js**: Runtime (>=14.0.0)

### Browser Support

Currently uses Chromium. Firefox and WebKit support planned.

### Skill Format

Generated skills follow the Claude skill format:

- Markdown-based SKILL.md with YAML frontmatter
- JSON data files for structured information
- JavaScript files for helper functions
- Compatible with Claude Code skill system

## FAQ

**Q: Do I need the Playwright skill installed to use PullUp?**
A: You need PullUp to generate skills, and the Playwright skill to execute tests from generated skills.

**Q: Can I edit generated skills?**
A: Yes! All files are human-readable and can be customized. Your changes will be preserved when updating.

**Q: How often should I update skills?**
A: Update when you add new pages, forms, or workflows to your application.

**Q: Can I use this for production testing?**
A: PullUp is designed for development and testing environments. Use caution with production URLs.

**Q: Does it work with SPAs (Single Page Applications)?**
A: Yes, but you may need to explicitly list routes that aren't discoverable through links.

**Q: Can I share generated skills with my team?**
A: Absolutely! Skills are portable and can be committed to version control.

**Q: What about applications behind authentication?**
A: Provide credentials in your documentation files and PullUp will explore authenticated areas.

**Q: Does it respect robots.txt?**
A: PullUp currently doesn't check robots.txt. Use responsibly on your own applications.

## Examples

See the `examples/` directory for sample documentation files showing best practices for documenting your application for PullUp.

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or contributions:

- Review this README
- Check the generated skill files for accuracy
- Re-run exploration if application has changed
- Customize generated files to fit your needs

---

Built with Playwright • Generates Skills for Claude • Simplifies Testing
