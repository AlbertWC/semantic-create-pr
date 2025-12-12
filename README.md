# Quick PR CLI 🚀

⚡ Quickly create GitHub Pull Requests from your current branch with **AI-powered descriptions and severity analysis** using GitHub Copilot.

## Features

- 🤖 **AI-Powered Descriptions** - Comprehensive PR descriptions with GitHub Copilot analysis
- 📊 **Automatic Severity Analysis** - Classifies changes as Low, Medium, High, or Critical
- 🎯 **Impact Analysis** - Identifies affected areas (API, Security, Testing, etc.)
- ⚠️ **Risk Assessment** - Provides risk considerations and review recommendations
- 🔄 **GitHub Actions Integration** - Auto-writes to `$GITHUB_STEP_SUMMARY` in workflows
- ⚡ **Quick Commit & Push** - Fast workflow commands for PR updates
- 🚀 **Force Push Support** - Amend and force push with one command
- 🔧 **Workflow Generator** - Auto-create GitHub Actions workflows
- 🎯 Auto-detects main/master branch
- 📤 Pushes branch automatically  
- 🔄 Creates PR with one command
- 📝 Smart commit summarization
- 💨 Draft PR support
- ✅ **Comprehensive Test Coverage** - 27 test scenarios covering all features

## Installation

```bash
npm install -g semantic-create-pr
```

## Prerequisites

1. **Git** - Already installed
2. **GitHub CLI**
   ```bash
   brew install gh  # Mac
   # or
   sudo apt install gh  # Linux
   
   gh auth login
   ```

3. **GitHub Copilot CLI** (Optional, for enhanced AI summaries)
   ```bash
   gh extension install github/gh-copilot
   ```

## Usage

### Basic Usage
```bash
# Show help and available options
qpr

# Create PR with AI-generated description and severity analysis
qpr "feat: add new feature"

# Create PR with commit message and specific target branch
qpr "fix: bug fix" main
```

### Advanced Usage
```bash
# Create PR without committing (just push and create PR)
qpr --title "My PR Title"

# Create draft PR
qpr "feat: work in progress" --draft

# Skip AI analysis and use git commits only
qpr "update" --fill
```

### Create PR to specific branch
```bash
qpr "feat: new feature" develop
qpr "hotfix: critical bug" staging
```

### Draft PR
```bash
qpr "feat: WIP" --draft
qpr "test changes" -d
```

### Custom title and body
```bash
qpr "commit msg" --title "Custom PR Title"
qpr --title "Fix bug" --body "Custom description"
qpr -t "Feature: Auth" -b "This adds authentication"
```

### Quick Commit & Push Commands

For faster workflow when updating PRs:

```bash
# Commit all changes and push
qpr push "fix: update validation logic"

# Amend last commit and force push (useful for PR updates)
qpr fpush
```

**When to use `qpr push`:**
- Adding new commits to your PR branch
- Regular workflow updates
- Safe push without rewriting history

**When to use `qpr fpush` (force-push):**
- Fixing typos in last commit
- Updating PR after review without creating new commits
- Keeping PR history clean
- ⚠️ **Caution:** Rewrites history, use carefully!

qpr "commit msg" --title "Custom PR Title"
qpr --title "Fix bug" --body "Custom description"
qpr -t "Feature: Auth" -b "This adds authentication"
```

## How It Works

1. ✅ Detects your current branch
2. 💾 Commits changes (if message provided)
3. ✅ Pushes to remote (with upstream tracking)
4. 🤖 **Analyzes code changes with GitHub Copilot**
   - Generates human-readable summary
   - Determines severity level (Low/Medium/High/Critical)
   - Identifies impact areas (API, Security, Testing, etc.)
   - Assesses risks and provides recommendations
5. ✅ Creates PR with comprehensive description
6. 🌐 Opens PR in your browser

## AI-Powered PR Description

The tool generates comprehensive PR descriptions with:

### 📋 Summary
Clear overview of what changed and how many files/lines were affected

### ⚠️ Severity Analysis
Automatically classifies changes:
- **Critical**: Security issues, breaking changes, auth modifications
- **High**: Large changes (>500 lines), API modifications, many files (>10)
- **Medium**: Moderate changes (>100 lines), config changes, several files (>3)
- **Low**: Minor changes, documentation, small fixes

### 📊 Metrics
- Lines changed
- Files modified
- Insertions/deletions

### 🎯 Impact Analysis
Identifies affected areas:
- Testing
- API endpoints
- UI/UX components
- Data layer
- Configuration
- Security
- Performance
- Documentation

### 🛡️ Risk Assessment
Provides tailored recommendations based on severity:
- Review requirements
- Testing recommendations
- Deployment considerations

**Example Output:**
```markdown
## Summary
This PR introduces changes across 3 files with 150 insertions and 20 deletions.

## Severity: High
**Reasoning:** Public API modifications; Large number of changes (170 lines)

**Metrics:**
- Lines Changed: 170
- Files Modified: 3
- Insertions: +150
- Deletions: -20

## Changes Made
- feat: add authentication endpoint
- refactor: update user service

## Files Modified
- api/auth.js | 120 +++++++++++++++++
- services/user.js | 45 +++++--
- tests/auth.test.js | 5 ++++

## Impact Analysis
- **API:** API endpoints or routes affected
- **Security:** Security-related changes detected
- **Testing:** Test files have been modified or added

## Risks & Considerations
- ⚠️ **Careful Review Recommended:** Significant changes require detailed review
- 🧪 **Test Thoroughly:** Verify all affected functionality

---
*Generated with GitHub Copilot analysis*
```

## Options

| Option | Description |
|--------|-------------|
| `[message]` | Commit message (optional, used as PR title) |
| `[base-branch]` | Target branch (default: main or master) |
| `-d, --draft` | Create as draft PR |
| `-t, --title <title>` | Custom PR title (defaults to commit message) |
| `-b, --body <body>` | Custom PR description (overrides AI) |
| `--no-copilot` | Disable Copilot summary |
| `-f, --fill` | Use git commits (skip AI) |
| `-V, --version` | Show version |
| `-h, --help` | Show help |

## Commands

| Command | Description |
|---------|-------------|
| `qpr [message] [base-branch]` | Create PR (default command) |
| `qpr push <message>` | Add all files, commit, and push to current branch |
| `qpr force-push` or `qpr fpush` | Add all files, amend commit, and force push |
| `qpr create-workflow-summary` | Generate GitHub Actions workflow for automatic PR summaries |
| `-f, --fill` | Use git commits (skip AI) |
| `-V, --version` | Show version |
| `-h, --help` | Show help |

## Commands

| Command | Description |
|---------|-------------|
| `qpr [message] [base-branch]` | Create PR (default command) |
| `qpr push <message>` | Add all files, commit, and push to current branch |
| `qpr force-push` or `qpr fpush` | Add all files, amend commit, and force push |
| `qpr create-workflow-summary` | Generate GitHub Actions workflow for automatic PR summaries |
 
## Examples

```bash
# Show help
qpr
qpr --help

# Simple PR with AI analysis
qpr "feat: add authentication"

# PR to develop with AI summary
qpr "fix: bug" develop

# Draft PR with AI analysis
qpr "feat: WIP feature" --draft

# PR without AI (use commits)
qpr "update" --fill

# PR with custom title, AI generates body
qpr "commit message" -t "Feature: User Profile"

# PR with completely custom content
qpr -t "Feature X" -b "Manual description"

# Create PR without new commit
qpr --title "Refactor code"

# Generate GitHub Actions workflow for automatic PR summaries
qpr create-workflow-summary

# Quick commit and push to current branch
qpr push "fix: resolve bug in validation"

# Amend last commit and force push (useful for PR updates)
qpr fpush
# or
qpr force-push
```
qpr --title "Refactor code"
```

## GitHub Actions Integration

When running in GitHub Actions, the tool automatically writes the PR analysis to the **GitHub Step Summary** using `$GITHUB_STEP_SUMMARY`. This provides a beautiful, formatted summary visible in your workflow run.

### Quick Setup: Auto-Generate Workflow

The easiest way to set up GitHub Actions integration is to use the built-in command:

```bash
qpr create-workflow-summary
```

This will:
1. ✅ Create `.github/workflows/pr-summary.yml`
2. ✅ Configure the workflow to run on PR events
3. ✅ Automatically update PR descriptions with AI analysis
4. ✅ Add comments to PRs with analysis summary

After running this command, just commit and push the workflow file:

```bash
git add .github/workflows/pr-summary.yml
git commit -m "Add PR summary workflow"
git push
```

### What the Workflow Does

Once installed, the workflow automatically:
- 🤖 Runs when a PR is opened, updated, or reopened
- 📊 Generates comprehensive AI analysis with severity assessment
- 📝 Updates the PR description with detailed analysis
- 💬 Posts a comment notifying about the analysis
- 📋 Adds analysis to GitHub Actions step summary

### Manual GitHub Actions Setup

If you prefer to create your own workflow, here's an example:

```yaml
name: Create PR
on:
  push:
    branches-ignore:
      - main
      - master

jobs:
  create-pr:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install semantic-create-pr
        run: npm install -g semantic-create-pr
      
      - name: Authenticate GitHub CLI
        run: gh auth login --with-token <<< "${{ secrets.GITHUB_TOKEN }}"
      
      - name: Create PR with AI Analysis
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: qpr "Automated PR" --title "Auto-generated PR"
```

The PR analysis will appear in your workflow's **Summary** tab with full markdown formatting, including:
- Severity badges
- Change metrics
- Impact analysis
- Risk assessments

## Troubleshooting

### "Failed to create PR"
Make sure GitHub CLI is installed and authenticated:
```bash
gh auth status
gh auth login
```

### "Could not generate summary"
The tool has built-in fallbacks:
1. First tries GitHub Copilot CLI (if installed)
2. Falls back to intelligent analysis without Copilot
3. Finally falls back to commit messages

To install GitHub Copilot CLI (optional):
```bash
gh extension install github/gh-copilot
```

Or use `--fill` to skip AI generation entirely:
```bash
qpr "update" --fill
```

### PR descriptions not formatting correctly
The tool uses `--body-file` with temporary markdown files to ensure proper formatting. If you see issues, make sure your GitHub CLI is up to date:
```bash
gh version
gh upgrade
```

### Force push warnings
When using `qpr fpush`, you'll see a warning that history will be rewritten. This is intentional for updating PRs. Only use on feature branches, never on shared/main branches.

## Development

### Run tests
```bash
npm test
npm run test:watch
```

**Test Coverage:** 27 comprehensive test scenarios including:
- ✅ PR creation with various options
- ✅ AI-powered description generation
- ✅ Severity analysis (Low, Medium, High, Critical)
- ✅ Workflow file generation
- ✅ Commit and push operations
- ✅ Force push functionality
- ✅ GitHub Actions integration
- ✅ Error handling and fallbacks

### Run locally
```bash
npm run dev "feat: test feature"
```

### Test individual commands
```bash
node index.js push "test: commit message"
node index.js fpush
node index.js create-workflow-summary
```

## Contributing

Contributions are welcome! Please ensure:
1. All tests pass (`npm test`)
2. Add tests for new features
3. Update README with new functionality
4. Follow existing code style

## License

MIT