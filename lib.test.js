import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  createPR, 
  generateCopilotPRDescription, 
  generateCopilotSummary,
  createWorkflowSummary,
  commitAndPush,
  forceCommitAndPush
} from './lib.js';
import { execSync } from 'child_process';
import fs from 'fs';

// Mock child_process and fs
vi.mock('child_process', () => ({
  execSync: vi.fn()
}));

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
    copyFileSync: vi.fn(),
    appendFileSync: vi.fn()
  }
}));

describe('createPR', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock behavior to return empty string to avoid crashes on .trim()
    vi.mocked(execSync).mockReturnValue('');
  });

  it('should create a PR successfully with title and body', () => {
    const base = 'main';
    const head = 'feature/test';
    const options = {
      title: 'Test PR',
      body: 'This is a test PR',
      draft: false
    };

    const result = createPR(base, head, options);

    expect(result).toBe(true);
    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining('gh pr create --base main --head feature/test'),
      expect.objectContaining({ stdio: 'inherit' })
    );
    expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('--title "Test PR"'),
        expect.anything()
    );
    expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('--body "This is a test PR"'),
        expect.anything()
    );
  });

  it('should create a draft PR if requested', () => {
     const base = 'main';
     const head = 'feature/test';
     const options = {
       title: 'Test PR',
       body: 'Body',
       draft: true
     };
 
     createPR(base, head, options);
 
     expect(execSync).toHaveBeenCalledWith(
       expect.stringContaining('--draft'),
       expect.anything()
     );
     expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('--title "Test PR"'),
        expect.anything()
    );
  });

  it('should use generated summary from file changes when body is not provided', () => {
    // Mock execSync to return git outputs
    vi.mocked(execSync).mockImplementation((command) => {
        if (typeof command === 'string') {
           if (command.includes('git log')) {
               return '- feat: new thing\n- fix: bug';
           }
           if (command.includes('git diff --stat')) {
               return ' file.js | 10 ++\n 1 file changed';
           }
        }
        return '';
    });

    const base = 'main';
    const head = 'feature/copilot-test';
    const options = {
      title: 'Copilot Feature',
      // No body provided, should trigger summary generation
    };

    const result = createPR(base, head, options);

    expect(result).toBe(true);
    
    // Check that summary generation was triggered (git commands called)
    expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('git log'),
        expect.objectContaining({ encoding: 'utf8' })
    );
     expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('git diff --stat'),
        expect.objectContaining({ encoding: 'utf8' })
    );

    // Verify that PR was created with --body-file instead of --body
    const prCreateCall = vi.mocked(execSync).mock.calls.find(call => 
      typeof call[0] === 'string' && call[0].includes('gh pr create')
    );
    expect(prCreateCall).toBeTruthy();
    expect(prCreateCall[0]).toContain('--body-file');
    
    // Check that Title was included
    expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('--title "Copilot Feature"'),
        expect.anything()
    );
  });

  it('should handle errors gracefully', () => {
      vi.mocked(execSync).mockImplementation(() => {
          throw new Error('Command failed');
      });
      
      const base = 'main';
      const head = 'feature/test';
      const options = {
        title: 'Test PR',
        copilot: false
      };
      
      const result = createPR(base, head, options);
      expect(result).toBe(false);
  });
});

describe('generateCopilotPRDescription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(execSync).mockReturnValue('');
  });

  it('should generate comprehensive PR description with severity analysis', () => {
    // Mock git commands
    vi.mocked(execSync).mockImplementation((command) => {
      if (typeof command === 'string') {
        if (command.includes('git diff ') && !command.includes('--stat')) {
          return 'diff --git a/file.js b/file.js\n+export function test() {}';
        }
        if (command.includes('git log --pretty=format:"%s"')) {
          return 'feat: add new feature\nfix: resolve bug';
        }
        if (command.includes('git diff --stat')) {
          return ' file.js | 50 ++++++++++++++++++++\n 1 file changed, 50 insertions(+)';
        }
      }
      return '';
    });

    const description = generateCopilotPRDescription('main', 'feature/test');

    expect(description).toBeTruthy();
    expect(description).toContain('## Summary');
    expect(description).toContain('## Severity:');
    expect(description).toContain('## Changes Made');
    expect(description).toContain('## Impact Analysis');
    expect(description).toContain('## Risks & Considerations');
    expect(description).toContain('feat: add new feature');
    expect(description).toContain('fix: resolve bug');
  });

  it('should detect Critical severity for security changes', () => {
    vi.mocked(execSync).mockImplementation((command) => {
      if (typeof command === 'string') {
        if (command.includes('git diff ') && !command.includes('--stat')) {
          return 'diff --git a/auth.js b/auth.js\n+const token = authenticateUser();';
        }
        if (command.includes('git log --pretty=format:"%s"')) {
          return 'security: fix authentication vulnerability';
        }
        if (command.includes('git diff --stat')) {
          return ' auth.js | 100 ++++++++++++++++++++\n 1 file changed, 100 insertions(+)';
        }
      }
      return '';
    });

    const description = generateCopilotPRDescription('main', 'feature/security');

    expect(description).toBeTruthy();
    expect(description).toContain('## Severity: Critical');
    expect(description).toContain('Critical keywords in commits');
  });

  it('should detect High severity for large changes', () => {
    vi.mocked(execSync).mockImplementation((command) => {
      if (typeof command === 'string') {
        if (command.includes('git diff ') && !command.includes('--stat')) {
          return 'diff --git a/api.js b/api.js\n+export const newAPI = () => {};';
        }
        if (command.includes('git log --pretty=format:"%s"')) {
          return 'feat: major API update';
        }
        if (command.includes('git diff --stat')) {
          return ' api.js | 600 +++++++++++++++++++++++++\n 1 file changed, 600 insertions(+)';
        }
      }
      return '';
    });

    const description = generateCopilotPRDescription('main', 'feature/api');

    expect(description).toBeTruthy();
    expect(description).toContain('## Severity: High');
    expect(description).toContain('Large number of changes');
  });

  it('should detect Medium severity for moderate changes', () => {
    vi.mocked(execSync).mockImplementation((command) => {
      if (typeof command === 'string') {
        if (command.includes('git diff ') && !command.includes('--stat')) {
          return 'diff --git a/config.json b/config.json\n+{"key": "value"}';
        }
        if (command.includes('git log --pretty=format:"%s"')) {
          return 'chore: update configuration';
        }
        if (command.includes('git diff --stat')) {
          return ' config.json | 150 +++++++++++++++++++++++++\n 1 file changed, 150 insertions(+)';
        }
      }
      return '';
    });

    const description = generateCopilotPRDescription('main', 'chore/config');

    expect(description).toBeTruthy();
    expect(description).toContain('## Severity: Medium');
  });

  it('should detect Low severity for minimal changes', () => {
    vi.mocked(execSync).mockImplementation((command) => {
      if (typeof command === 'string') {
        if (command.includes('git diff ') && !command.includes('--stat')) {
          return 'diff --git a/README.md b/README.md\n+Documentation update';
        }
        if (command.includes('git log --pretty=format:"%s"')) {
          return 'docs: update README';
        }
        if (command.includes('git diff --stat')) {
          return ' README.md | 5 +++++\n 1 file changed, 5 insertions(+)';
        }
      }
      return '';
    });

    const description = generateCopilotPRDescription('main', 'docs/readme');

    expect(description).toBeTruthy();
    expect(description).toContain('## Severity: Low');
    expect(description).toContain('Minimal changes');
  });

  it('should identify impact areas correctly', () => {
    vi.mocked(execSync).mockImplementation((command) => {
      if (typeof command === 'string') {
        if (command.includes('git diff ') && !command.includes('--stat')) {
          return 'diff --git a/test.spec.js b/test.spec.js\n+describe("test")';
        }
        if (command.includes('git log --pretty=format:"%s"')) {
          return 'test: add unit tests';
        }
        if (command.includes('git diff --stat')) {
          return ' test.spec.js | 30 ++++++++++++++++++++\n 1 file changed, 30 insertions(+)';
        }
      }
      return '';
    });

    const description = generateCopilotPRDescription('main', 'test/unit');

    expect(description).toBeTruthy();
    expect(description).toContain('**Testing:**');
  });

  it('should handle no changes gracefully', () => {
    vi.mocked(execSync).mockImplementation(() => '');

    const description = generateCopilotPRDescription('main', 'feature/empty');

    expect(description).toBeNull();
  });

  it('should fallback when Copilot CLI is unavailable', () => {
    vi.mocked(execSync).mockImplementation((command) => {
      if (typeof command === 'string') {
        if (command.includes('gh copilot suggest')) {
          throw new Error('Copilot CLI not installed');
        }
        if (command.includes('git diff ') && !command.includes('--stat')) {
          return 'diff --git a/file.js b/file.js\n+code';
        }
        if (command.includes('git log --pretty=format:"%s"')) {
          return 'feat: new feature';
        }
        if (command.includes('git diff --stat')) {
          return ' file.js | 20 +++++\n 1 file changed, 20 insertions(+)';
        }
      }
      return '';
    });

    const description = generateCopilotPRDescription('main', 'feature/test');

    // Should still generate description using fallback
    expect(description).toBeTruthy();
    expect(description).toContain('## Summary');
    expect(description).toContain('## Severity:');
  });
});

describe('createPR with Copilot integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(execSync).mockReturnValue('');
  });

  it('should use Copilot PR description by default', () => {
    vi.mocked(execSync).mockImplementation((command) => {
      if (typeof command === 'string') {
        if (command.includes('git diff ') && !command.includes('--stat')) {
          return 'diff --git a/file.js b/file.js\n+code';
        }
        if (command.includes('git log --pretty=format:"%s"')) {
          return 'feat: add feature';
        }
        if (command.includes('git diff --stat')) {
          return ' file.js | 30 +++++\n 1 file changed, 30 insertions(+)';
        }
      }
      return '';
    });

    const base = 'main';
    const head = 'feature/copilot';
    const options = {
      title: 'New Feature'
    };

    const result = createPR(base, head, options);

    expect(result).toBe(true);
    
    // Verify Copilot description was generated (git commands called)
    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining('git diff main...feature/copilot'),
      expect.anything()
    );
    
    // Verify PR was created with --body-file
    const prCreateCall = vi.mocked(execSync).mock.calls.find(call => 
      typeof call[0] === 'string' && call[0].includes('gh pr create')
    );
    expect(prCreateCall).toBeTruthy();
    expect(prCreateCall[0]).toContain('--body-file');
  });

  it('should fallback to basic summary if Copilot fails', () => {
    let callCount = 0;
    vi.mocked(execSync).mockImplementation((command) => {
      if (typeof command === 'string') {
        // First call: git diff (for Copilot) - return nothing to simulate failure
        if (command.includes('git diff ') && !command.includes('--stat') && callCount === 0) {
          callCount++;
          return '';
        }
        // Fallback to basic summary
        if (command.includes('git log --pretty=format:"- %s"')) {
          return '- feat: new thing';
        }
        if (command.includes('git diff --stat')) {
          return ' file.js | 10 ++\n 1 file changed';
        }
      }
      return '';
    });

    const base = 'main';
    const head = 'feature/test';
    const options = {
      title: 'Test Feature'
    };

    const result = createPR(base, head, options);

    expect(result).toBe(true);
  });

  it('should respect custom body and skip Copilot', () => {
    const base = 'main';
    const head = 'feature/custom';
    const options = {
      title: 'Custom PR',
      body: 'This is a custom description'
    };

    createPR(base, head, options);

    // Should NOT call git diff for Copilot analysis
    const diffCalls = vi.mocked(execSync).mock.calls.filter(call =>
      typeof call[0] === 'string' && call[0].includes('git diff ') && !call[0].includes('--stat')
    );
    expect(diffCalls.length).toBe(0);

    // Should use custom body
    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining('--body "This is a custom description"'),
      expect.anything()
    );
  });

  it('should skip Copilot when copilot option is false', () => {
    const base = 'main';
    const head = 'feature/no-copilot';
    const options = {
      title: 'No Copilot',
      copilot: false
    };

    createPR(base, head, options);

    // Should use --fill instead of generating description
    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining('--fill'),
      expect.anything()
    );
  });
});

describe('createWorkflowSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create workflow directory and file', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const result = createWorkflowSummary();

    expect(result).toBe(true);
    expect(fs.mkdirSync).toHaveBeenCalledWith('.github/workflows', { recursive: true });
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('pr-summary.yml'),
      expect.stringContaining('name: PR Summary with AI Analysis'),
      'utf8'
    );
  });

  it('should backup existing workflow file', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);

    const result = createWorkflowSummary();

    expect(result).toBe(true);
    expect(fs.copyFileSync).toHaveBeenCalled();
  });

  it('should handle errors gracefully', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.mkdirSync).mockImplementation(() => {
      throw new Error('Permission denied');
    });

    const result = createWorkflowSummary();

    expect(result).toBe(false);
  });
});

describe('commitAndPush', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(execSync).mockReturnValue('');
  });

  it('should add, commit, and push successfully', () => {
    const message = 'fix: update logic';
    const branch = 'feature/test';

    const result = commitAndPush(message, branch);

    expect(result).toBe(true);
    expect(execSync).toHaveBeenCalledWith('git add -A', expect.anything());
    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining('git commit -m "fix: update logic"'),
      expect.anything()
    );
    expect(execSync).toHaveBeenCalledWith(
      'git push origin feature/test',
      expect.anything()
    );
  });

  it('should escape quotes in commit message', () => {
    const message = 'fix: update "validation" logic';
    const branch = 'main';

    commitAndPush(message, branch);

    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining('git commit -m "fix: update \\"validation\\" logic"'),
      expect.anything()
    );
  });

  it('should handle errors gracefully', () => {
    vi.mocked(execSync).mockImplementation(() => {
      throw new Error('No changes to commit');
    });

    const result = commitAndPush('test', 'main');

    expect(result).toBe(false);
  });
});

describe('forceCommitAndPush', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(execSync).mockReturnValue('');
  });

  it('should add, amend, and force push successfully', () => {
    const branch = 'feature/test';

    const result = forceCommitAndPush(branch);

    expect(result).toBe(true);
    expect(execSync).toHaveBeenCalledWith('git add -A', expect.anything());
    expect(execSync).toHaveBeenCalledWith(
      'git commit --amend --no-edit',
      expect.anything()
    );
    expect(execSync).toHaveBeenCalledWith(
      'git push origin feature/test --force',
      expect.anything()
    );
  });

  it('should handle errors gracefully', () => {
    vi.mocked(execSync).mockImplementation(() => {
      throw new Error('No commit to amend');
    });

    const result = forceCommitAndPush('main');

    expect(result).toBe(false);
  });

  it('should force push to correct branch', () => {
    const branch = 'feature/important-fix';

    forceCommitAndPush(branch);

    expect(execSync).toHaveBeenCalledWith(
      'git push origin feature/important-fix --force',
      expect.anything()
    );
  });
});

describe('GitHub Step Summary Integration', () => {
  afterEach(() => {
    delete process.env.GITHUB_STEP_SUMMARY;
  });

  it('should write to GITHUB_STEP_SUMMARY when environment variable is set', () => {
    const tempFile = '/tmp/github_step_summary.md';
    process.env.GITHUB_STEP_SUMMARY = tempFile;

    vi.mocked(execSync).mockImplementation((command) => {
      if (typeof command === 'string') {
        if (command.includes('git diff ') && !command.includes('--stat')) {
          return 'diff --git a/file.js b/file.js\n+code';
        }
        if (command.includes('git log --pretty=format:"%s"')) {
          return 'feat: add feature';
        }
        if (command.includes('git diff --stat')) {
          return ' file.js | 30 +++++\n 1 file changed, 30 insertions(+)';
        }
      }
      return '';
    });

    const description = generateCopilotPRDescription('main', 'feature/test');

    expect(description).toBeTruthy();
    expect(fs.appendFileSync).toHaveBeenCalledWith(
      tempFile,
      expect.stringContaining('# PR Analysis'),
      'utf8'
    );
  });

  it('should not fail when GITHUB_STEP_SUMMARY is not set', () => {
    delete process.env.GITHUB_STEP_SUMMARY;

    vi.mocked(execSync).mockImplementation((command) => {
      if (typeof command === 'string') {
        if (command.includes('git diff ') && !command.includes('--stat')) {
          return 'diff --git a/file.js b/file.js\n+code';
        }
        if (command.includes('git log --pretty=format:"%s"')) {
          return 'feat: add feature';
        }
        if (command.includes('git diff --stat')) {
          return ' file.js | 20 +++++\n 1 file changed, 20 insertions(+)';
        }
      }
      return '';
    });

    const description = generateCopilotPRDescription('main', 'feature/test');

    expect(description).toBeTruthy();
    // Should not throw error
  });
});
