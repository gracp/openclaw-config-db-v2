#!/usr/bin/env npx tsx
/**
 * GitHub Auto-Discovery Crawler
 * Searches GitHub for OpenClaw config repos, analyzes them, and queues them for upload.
 */

import { db } from '../src/lib/db';
import { configs, files } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from '../src/lib/utils/nanoid';
import { configAnalyzer } from '../src/lib/utils/config-analyzer';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const SEARCH_QUERIES = [
  'openclaw-config in:path',
  'openclaw.config in:filename', 
  '.openclaw/ workspace path:.',
  'SOUL.md openclaw path:.',
];

interface GitHubSearchResult {
  total_count: number;
  items: {
    full_name: string;
    description: string | null;
    owner: { login: string; avatar_url: string };
    stargazers_count: number;
    html_url: string;
    updated_at: string;
  }[];
}

interface GitHubRepoContent {
  name: string;
  path: string;
  type: 'file' | 'dir';
  download_url: string | null;
}

async function searchGitHub(query: string): Promise<GitHubSearchResult['items']> {
  const url = `https://api.github.com/search/code?q=${encodeURIComponent(query)}&per_page=20`;
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      ...(GITHUB_TOKEN && { 'Authorization': `Bearer ${GITHUB_TOKEN}` }),
    },
  });
  
  if (!res.ok) {
    if (res.status === 403) {
      console.warn('GitHub API rate limited. Set GITHUB_TOKEN to increase limits.');
      return [];
    }
    throw new Error(`GitHub search failed: ${res.status}`);
  }
  
  const data: GitHubSearchResult = await res.json();
  return data.items || [];
}

async function getRepoContents(owner: string, repo: string, path: string = ''): Promise<GitHubRepoContent[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      ...(GITHUB_TOKEN && { 'Authorization': `Bearer ${GITHUB_TOKEN}` }),
    },
  });
  
  if (!res.ok) return [];
  return res.json();
}

async function downloadFile(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) return '';
  return res.text();
}

function classifyFile(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const name = filename.toLowerCase();
  
  if (name.includes('soul') || name.includes('identity')) return 'workspace';
  if (name.includes('agents') || name.includes('agenda')) return 'config';
  if (name.includes('skill') || name.includes('.md')) return 'skill';
  if (name.includes('readme') || name.includes('changelog')) return 'readme';
  if (['ts', 'js', 'json', 'yaml', 'yml'].includes(ext)) return 'config';
  return 'other';
}

async function crawlRepo(fullName: string): Promise<{ files: { filename: string; content: string; type: string }[] } | null> {
  const [owner, repo] = fullName.split('/');
  console.log(`  Crawling ${fullName}...`);
  
  const rootContents = await getRepoContents(owner, repo);
  
  // Find .openclaw/ directory or workspace config files
  const openclawDir = rootContents.find(c => c.name === '.openclaw' && c.type === 'dir');
  
  if (!openclawDir) {
    // Try finding SOUL.md, IDENTITY.md, AGENTS.md at root
    const workspaceFiles = rootContents.filter(c => 
      ['SOUL.md', 'IDENTITY.md', 'AGENTS.md', 'MEMORY.md', 'TOOLS.md'].includes(c.name)
    );
    
    if (workspaceFiles.length === 0) return null;
    
    const files = [];
    for (const f of workspaceFiles) {
      if (f.download_url) {
        const content = await downloadFile(f.download_url);
        files.push({ filename: f.name, content, type: classifyFile(f.name) });
      }
    }
    return { files };
  }
  
  // Crawl .openclaw/ directory recursively
  const openclawContents = await getRepoContents(owner, repo, '.openclaw');
  const files = [];
  
  for (const item of openclawContents) {
    if (item.type === 'file' && item.download_url) {
      const content = await downloadFile(item.download_url);
      files.push({ filename: `.openclaw/${item.name}`, content, type: classifyFile(item.name) });
    }
  }
  
  return { files };
}

async function main() {
  console.log('🔍 Starting GitHub auto-discovery crawl...\n');
  
  const allRepos: Set<string> = new Set();
  
  // Search GitHub for OpenClaw configs
  for (const query of SEARCH_QUERIES) {
    console.log(`Searching: ${query}`);
    try {
      const results = await searchGitHub(query);
      for (const item of results) {
        allRepos.add(item.full_name);
      }
    } catch (e) {
      console.error(`  Search failed: ${e}`);
    }
  }
  
  console.log(`\n📦 Found ${allRepos.size} unique repos to analyze\n`);
  
  let added = 0;
  let skipped = 0;
  
  for (const fullName of allRepos) {
    try {
      // Check if already in DB
      const existing = await db.select().from(configs).where(eq(configs.sourceUrl, `https://github.com/${fullName}`)).get();
      if (existing) {
        skipped++;
        console.log(`  ⏭️  Skipping ${fullName} (already exists)`);
        continue;
      }
      
      const crawled = await crawlRepo(fullName);
      if (!crawled || crawled.files.length === 0) {
        skipped++;
        console.log(`  ⏭️  Skipping ${fullName} (no workspace files found)`);
        continue;
      }
      
      const configId = nanoid();
      const now = new Date();
      
      // Extract agent identity
      const soulFile = crawled.files.find(f => f.filename.includes('SOUL'));
      const identityFile = crawled.files.find(f => f.filename.includes('IDENTITY'));
      const agentName = identityFile?.content.match(/Name:\s*(.+)/)?.[1] || fullName.split('/')[1];
      
      await db.insert(configs).values({
        id: configId,
        name: agentName,
        description: `Auto-discovered OpenClaw config from ${fullName}`,
        author: fullName.split('/')[0],
        authorUrl: `https://github.com/${fullName.split('/')[0]}`,
        sourceUrl: `https://github.com/${fullName}`,
        sourceType: 'github',
        createdAt: now,
        updatedAt: now,
        stars: 0,
        downloads: 0,
        isFeatured: false,
      });
      
      for (const file of crawled.files) {
        await db.insert(files).values({
          id: nanoid(),
          configId,
          filename: file.filename,
          content: file.content,
          fileType: file.type as any,
          fileSize: file.content.length,
        });
      }
      
      added++;
      console.log(`  ✅ Added: ${fullName} (${crawled.files.length} files)`);
    } catch (e) {
      console.error(`  ❌ Error processing ${fullName}: ${e}`);
    }
  }
  
  console.log(`\n✅ Crawl complete. Added: ${added}, Skipped: ${skipped}`);
}

main().catch(console.error);
