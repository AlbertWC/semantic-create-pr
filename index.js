#!/usr/bin/env node
import { execSync } from 'child_process';
import { program } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

function exec(command, silent = false) {
  try {
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: silent ? 'pipe' : 'inherit' 
    });
    return silent ? output.trim() : output;
  } catch (error) {
    return null;
  }
}

function getCurrentBranch() {
  return exec('git branch --show-current', true);
}

function getDefaultBranch() {
  if (exec('git show-ref --verify refs/heads/main', true)) return 'main';
  if (exec('git show-ref --verify refs/heads/master', true)) return 'master';
  
  if (exec('git show-ref --verify refs/remotes/origin/main', true)) return 'main';
  if (exec('git show-ref --verify refs/remotes/origin/master', true)) return 'master';
  
  // Check configured branches
  if (exec('git config --get branch.main.merge', true)) return 'main';
  if (exec('git config --get branch.master.merge', true)) return 'master';
  
  return null;
}

function pushBranch(branch) {
  console.log(chalk.blue(`📤 Pushing ${branch} to remote...`));
  try {
    execSync(`git push -u origin ${branch}`, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(chalk.red('❌ Failed to push branch'));
    console.log(chalk.yellow('💡 Make sure you have committed your changes before pushing.'));
    return false;
  }
}

function generateCopilotSummary(base, head) {
  const spinner = ora('🤖 Generating AI summary with GitHub Copilot...').start();
  
  try {
    // Use GitHub CLI with Copilot extension to generate summary
    const summary = exec(
      `gh copilot suggest -t shell "summarize git diff between ${base} and ${head}"`,
      true
    );
    
    if (summary) {
      spinner.succeed('✅ AI summary generated');
      return summary;
    }
    
    // Fallback: Use git log to get commit messages
    spinner.text = '📝 Generating summary from commits...';
    const commits = exec(
      `git log ${base}..${head} --pretty=format:"%s" --reverse`,
      true
    );
    
    if (commits) {
      spinner.succeed('✅ Summary generated from commits');
      return commits;
    }
    
    spinner.fail('⚠️  Could not generate summary');
    return null;
  } catch (error) {
    spinner.fail('⚠️  Could not generate summary');
    return null;
  }
}

function createPR(base, head, options) {
  console.log(chalk.blue(`🚀 Creating PR from ${head} to ${base}...`));
  
  let command = `gh pr create --base ${base} --head ${head}`;
  
  // Add draft flag
  if (options.draft) {
    command += ' --draft';
  }
  
  // Add title
  if (options.title) {
    command += ` --title "${options.title.replace(/"/g, '\\"')}"`;
  }
  
  // Add body (Copilot summary or custom)
  if (options.body) {
    command += ` --body "${options.body.replace(/"/g, '\\"')}"`;
  } else if (options.copilot !== false) {
    // Generate Copilot summary by default
    const summary = generateCopilotSummary(base, head);
    if (summary) {
      command += ` --body "${summary.replace(/"/g, '\\"')}"`;
    } else {
      command += ' --fill';
    }
  } else {
    command += ' --fill';
  }
  
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(chalk.green('\n✅ PR created successfully!'));
    return true;
  } catch (error) {
    console.error(chalk.red('\n❌ Failed to create PR'));
    console.log(chalk.yellow('\n💡 Make sure GitHub CLI is installed:'));
    console.log(chalk.gray('   brew install gh  # Mac'));
    console.log(chalk.gray('   gh auth login'));
    console.log(chalk.yellow('\n💡 For AI summaries, install GitHub Copilot CLI:'));
    console.log(chalk.gray('   gh extension install github/gh-copilot'));
    return false;
  }
}

program
  .name('qpr')
  .description('Quickly create GitHub PRs with AI-powered descriptions')
  .version('1.0.0');

program
  .argument('<message>', 'Commit message (used as PR title)')
  .argument('[base-branch]', 'Base branch to create PR against')
  .option('-d, --draft', 'Create as draft PR')
  .option('-t, --title <title>', 'PR title')
  .option('-b, --body <body>', 'PR description (overrides Copilot summary)')
  .option('--no-copilot', 'Disable Copilot summary generation')
  .option('-f, --fill', 'Use git commits to fill (skip Copilot)')
  .action((message, baseBranchArg, options) => {
    // Get current branch
    const currentBranch = getCurrentBranch();
    if (!currentBranch) {
      console.error(chalk.red('❌ Not on a git branch'));
      process.exit(1);
    }

    // Commit changes
    try {
      console.log(chalk.blue(`💾 Committing changes...`));
      execSync(`git commit -am "${message.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
    } catch (error) {
      console.log(chalk.yellow('⚠️  No changes to commit or commit failed. Continuing...'));
    }

    // Set title default
    if (!options.title) {
      options.title = message;
    }

    console.log(chalk.cyan(`📍 Current branch: ${currentBranch}`));

    // Determine base branch
    const base = baseBranchArg || getDefaultBranch();
    if (!base) {
      console.error(chalk.red('❌ Could not find main or master branch'));
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

    console.log('');

    // Set copilot option
    if (options.fill) {
      options.copilot = false;
    }

    // Create PR
    if (!createPR(base, currentBranch, options)) {
      process.exit(1);
    }
  });

program.parse();
