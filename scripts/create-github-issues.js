/**
 * GitHub Issue Creator Script
 * 
 * Usage:
 *   node scripts/create-github-issues.js <YOUR_GITHUB_TOKEN>
 * Or:
 *   $env:GITHUB_TOKEN="your_token"; node scripts/create-github-issues.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const token = process.argv[2] || process.env.GITHUB_TOKEN;
const REPO_OWNER = 'almas77abolfazl';
const REPO_NAME = 'chat-app';

if (!token) {
  console.error('\x1b[31m[ERROR] GitHub Personal Access Token is required!\x1b[0m');
  console.log('\nUsage:');
  console.log('  node scripts/create-github-issues.js <YOUR_GITHUB_TOKEN>\n');
  console.log('You can generate a token with "repo" scope at:');
  console.log('  https://github.com/settings/tokens/new?scopes=repo\n');
  process.exit(1);
}

const templatesDir = path.join(__dirname, '..', '.github', 'ISSUE_TEMPLATE');
const files = fs.readdirSync(templatesDir)
  .filter(f => f.endsWith('.md') && !f.includes('bug_report') && !f.includes('feature_request'))
  .sort();

// Filter for the new issues: 28 to 37
const targetFiles = files.filter(f => {
  const num = parseInt(f.split('-')[0], 10);
  return num >= 28 && num <= 37;
});

function parseTemplate(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);
  
  let title = '';
  let labels = ['enhancement'];
  let bodyStartIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('title:')) {
      title = line.replace('title:', '').trim().replace(/^"(.*)"$/, '$1');
    } else if (line.startsWith('labels:')) {
      try {
        const jsonStr = line.replace('labels:', '').trim();
        labels = JSON.parse(jsonStr);
      } catch (e) {
        labels = ['feature'];
      }
    } else if (line.startsWith('## ') || line.startsWith('name:')) {
      if (line.startsWith('## ')) {
        bodyStartIndex = i;
        break;
      }
    }
  }

  const body = lines.slice(bodyStartIndex).join('\n').trim();
  return { title, labels, body };
}

function postIssue(issue) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      title: issue.title,
      body: issue.body,
      labels: issue.labels,
    });

    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: `/repos/${REPO_OWNER}/${REPO_NAME}/issues`,
      method: 'POST',
      headers: {
        'User-Agent': 'Node-Script-Issue-Creator',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Accept': 'application/vnd.github+json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } else {
          reject(new Error(`GitHub API Error (${res.statusCode}): ${data}`));
        }
      });
    });

    req.on('error', err => reject(err));
    req.write(postData);
    req.end();
  });
}

async function run() {
  console.log(`\n\x1b[36mFound ${targetFiles.length} new issue templates to publish...\x1b[0m\n`);

  for (const file of targetFiles) {
    const fullPath = path.join(templatesDir, file);
    const parsed = parseTemplate(fullPath);

    if (!parsed.title) {
      console.warn(`[SKIP] Missing title in ${file}`);
      continue;
    }

    try {
      console.log(`Creating: "${parsed.title}"...`);
      const res = await postIssue(parsed);
      console.log(`\x1b[32m✔ Issue #${res.number} created: ${res.html_url}\x1b[0m\n`);
      // Sleep 1 second to avoid secondary rate limits
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error(`\x1b[31m✖ Failed to create ${file}: ${err.message}\x1b[0m\n`);
    }
  }

  console.log('\x1b[32mAll issues processed successfully!\x1b[0m\n');
}

run();
