# Quick PR CLI 🚀

⚡ Quickly create GitHub Pull Requests from your current branch with **AI-powered descriptions** using GitHub Copilot.

## Features

- 🤖 **AI-Powered Descriptions** - Automatic PR descriptions using GitHub Copilot
- 🎯 Auto-detects main/master branch
- 📤 Pushes branch automatically  
- 🔄 Creates PR with one command
- 📝 Smart commit summarization
- 🌐 Opens in browser
- 💨 Draft PR support

## Installation

```bash
npm install -g quick-pr-cli
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

3. **GitHub Copilot CLI** (Optional, for AI summaries)
   ```bash
   gh extension install github/gh-copilot
   ```

## Usage

### Basic Usage (with AI summary)
```bash
# Create PR with Copilot-generated description
qpr

# Or use the full command
quick-pr
```

### Create PR to specific branch
```bash
qpr develop
qpr staging
```

### Without Copilot (use commits)
```bash
qpr --fill
qpr --no-copilot
```

### Draft PR
```bash
qpr --draft
qpr -d
```

### Custom title and body
```bash
qpr --title "Feature: Add authentication"
qpr --body "Custom description"
qpr -t "Fix bug" -b "This fixes issue #123"
```

## How It Works

1. ✅ Detects your current branch
2. ✅ Pushes to remote (with upstream tracking)
3. 🤖 **Generates AI summary using GitHub Copilot** (or uses commits as fallback)
4. ✅ Creates PR with smart description
5. ✅ Opens PR in your browser

## Options

| Option | Description |
|--------|-------------|
| `[base-branch]` | Target branch (default: main or master) |
| `-d, --draft` | Create as draft PR |
| `-t, --title <title>` | Custom PR title |
| `-b, --body <body>` | Custom PR description (overrides AI) |
| `--no-copilot` | Disable Copilot summary |
| `-f, --fill` | Use git commits (skip AI) |
| `-V, --version` | Show version |
| `-h, --help` | Show help |
 
## Examples

```bash
# Simple PR with AI description
qpr

# PR to develop with AI summary
qpr develop

# Draft PR with AI summary  
qpr --draft

# PR without AI (use commits)
qpr --fill

# PR with custom title, AI body
qpr -t "Fix: Memory leak"

# PR with completely custom content
qpr -t "Feature X" -b "Manual description"
```

## AI Summary Feature

When you run `qpr`, it automatically:
1. Analyzes the diff between your branch and the base branch
2. Uses GitHub Copilot to generate a meaningful summary
3. Creates a well-formatted PR description

**Fallback**: If Copilot is unavailable, it uses your commit messages.

## Troubleshooting

### "Failed to create PR"
Make sure GitHub CLI is installed and authenticated:
```bash
gh auth status
gh auth login
```

### "Could not generate summary"
Install GitHub Copilot CLI:
```bash
gh extension install github/gh-copilot
```

Or use `--fill` to skip AI generation:
```bash
qpr --fill
```

## License

MIT