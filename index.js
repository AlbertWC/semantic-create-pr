#!/usr/bin/env node
import { execSync } from "child_process";
import { program } from "commander";
import chalk from "chalk";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import {
  getCurrentBranch,
  getDefaultBranch,
  pushBranch,
  createPR,
  createWorkflowSummary,
  commitAndPush,
  forceCommitAndPush,
} from "./lib.js";

// Get version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(join(__dirname, "package.json"), "utf8")
);

program
  .name("qpr")
  .description(
    `Quickly create GitHub PRs with AI-powered descriptions (v${packageJson.version})`
  )
  .version(packageJson.version)
  .showHelpAfterError("(add --help for additional information)")
  .addHelpText(
    "after",
    `
Examples:
  $ qpr "feat: add new feature"
  $ qpr "fix: bug fix" main
  $ qpr --title "My PR" --draft
  $ qpr "update" --no-copilot
  $ qpr create-workflow-summary
  $ qpr push "fix: update logic"
  $ qpr fpush
`
  );

program
  .argument("[message]", "Commit message (used as PR title)")
  .argument("[base-branch]", "Base branch to create PR against")
  .option("-d, --draft", "Create as draft PR")
  .option("-t, --title <title>", "PR title (defaults to commit message)")
  .option("-b, --body <body>", "PR description (overrides Copilot summary)")
  .option("--no-copilot", "Disable Copilot summary generation")
  .option("-f, --fill", "Use git commits to fill (skip Copilot)")
  .option("-h, --help", "Display help for command")
  .action((message, baseBranchArg, options) => {
    // If no message provided, show help
    if (!message && !options.title) {
      program.help();
    }

    // Get current branch
    const currentBranch = getCurrentBranch();
    if (!currentBranch) {
      console.error(chalk.red("❌ Not on a git branch"));
      process.exit(1);
    }

    // Commit changes if message provided
    if (message) {
      try {
        console.log(chalk.blue("📦 Adding all files..."));
        execSync("git add -A", { stdio: "inherit" });
        console.log(chalk.blue(`💾 Committing changes...`));
        execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
          stdio: "inherit",
        });
      } catch (error) {
        console.log(
          chalk.yellow(
            "⚠️  No changes to commit or commit failed. Continuing..."
          )
        );
      }
    }

    // Set title default
    if (!options.title) {
      options.title = message || "Update";
    }

    console.log(chalk.cyan(`📍 Current branch: ${currentBranch}`));

    // Determine base branch
    const base = baseBranchArg || getDefaultBranch();
    if (!base) {
      console.error(chalk.red("❌ Could not find main or master branch"));
      process.exit(1);
    }

    // Check if same branch
    if (currentBranch === base) {
      console.error(chalk.red(`❌ Cannot create PR from ${base} to itself`));
      process.exit(1);
    }

    console.log(chalk.cyan(`🎯 Target branch: ${base}\n`));

    // Push branch
    if (!pushBranch(currentBranch)) {
      process.exit(1);
    }

    console.log("");

    // Set copilot option
    if (options.fill) {
      options.copilot = false;
    }

    // Create PR
    if (!createPR(base, currentBranch, options)) {
      process.exit(1);
    }
  });

// Subcommand: create workflow summary
program
  .command("create-workflow-summary")
  .description(
    "Create a GitHub Actions workflow that updates PR with AI summary"
  )
  .action(() => {
    console.log(
      chalk.blue("🔧 Creating GitHub Actions workflow for PR summaries...")
    );

    if (!createWorkflowSummary()) {
      process.exit(1);
    }

    console.log(chalk.green("\n✅ Workflow created successfully!"));
    console.log(chalk.cyan("\n📝 Next steps:"));
    console.log(chalk.gray("   1. git add .github/workflows/pr-summary.yml"));
    console.log(chalk.gray('   2. git commit -m "Add PR summary workflow"'));
    console.log(chalk.gray("   3. git push"));
    console.log(
      chalk.gray("   4. The workflow will run automatically on future PRs")
    );
  });

// Subcommand: push - commit all changes and push
program
  .command("push <message>")
  .description("Add all files, commit with message, and push to current branch")
  .action((message) => {
    const currentBranch = getCurrentBranch();
    if (!currentBranch) {
      console.error(chalk.red("❌ Not on a git branch"));
      process.exit(1);
    }

    console.log(chalk.cyan(`📍 Current branch: ${currentBranch}`));

    if (!commitAndPush(message, currentBranch)) {
      process.exit(1);
    }
  });

// Subcommand: force-push - amend commit and force push
program
  .command("force-push")
  .alias("fpush")
  .description(
    "Add all files, amend commit (no edit), and force push to current branch"
  )
  .action(() => {
    const currentBranch = getCurrentBranch();
    if (!currentBranch) {
      console.error(chalk.red("❌ Not on a git branch"));
      process.exit(1);
    }

    console.log(chalk.cyan(`📍 Current branch: ${currentBranch}`));
    console.log(
      chalk.yellow("⚠️  This will force push and overwrite remote history!")
    );

    if (!forceCommitAndPush(currentBranch)) {
      process.exit(1);
    }
  });

program.parse();
