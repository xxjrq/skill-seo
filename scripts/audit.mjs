#!/usr/bin/env node

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

function usage() {
  console.log(`用法：
  node scripts/audit.mjs --root <skill-dir> [--output <dir>] [--strict]
  node scripts/audit.mjs --skills-root <skills-dir> [--output <dir>]`);
}

function parseArgs(argv) {
  const result = { strict: false };
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--strict') { result.strict = true; continue; }
    if (item === '--help' || item === '-h') { result.help = true; continue; }
    if (item === '--root' || item === '--skills-root' || item === '--output') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) throw new Error(`${item} 缺少值`);
      result[item.slice(2).replaceAll('-', '_')] = value;
      i += 1;
      continue;
    }
    throw new Error(`未知参数：${item}`);
  }
  return result;
}

function scalar(text, key) {
  return text.match(new RegExp(`^\\s*${key}:\\s*(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '') ?? '';
}

function yamlList(text, key) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => new RegExp(`^${key}:\\s*$`).test(line));
  if (start < 0) return [];
  const values = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const match = lines[i].match(/^\s+-\s*["']?(.+?)["']?\s*$/);
    if (match) values.push(match[1].trim());
    else if (lines[i].trim() && !/^\s+#/.test(lines[i])) break;
  }
  return values;
}

function readFile(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function frontmatter(text) {
  return text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
}

function add(issues, severity, code, message, file = null) {
  issues.push({ severity, code, message, file });
}

function auditSkill(dir) {
  const slug = basename(dir);
  const skillText = readFile(join(dir, 'SKILL.md'));
  const manifestText = readFile(join(dir, 'manifest.yaml'));
  const openaiText = readFile(join(dir, 'agents', 'openai.yaml'));
  const readmeText = readFile(join(dir, 'README.md'));
  const packageText = readFile(join(dir, 'package.json'));
  const skillFrontmatter = frontmatter(skillText);
  const skillName = scalar(skillFrontmatter, 'name');
  const skillDescription = scalar(skillFrontmatter, 'description');
  const manifestName = scalar(manifestText, 'name');
  const manifestSlug = scalar(manifestText, 'slug');
  const manifestVersion = scalar(manifestText, 'version');
  const repository = scalar(manifestText, 'repository');
  const displayName = scalar(manifestText, 'display_name');
  const manifestDescription = scalar(manifestText, 'description');
  const interfaceName = scalar(openaiText, 'display_name');
  const shortDescription = scalar(openaiText, 'short_description');
  const icon = scalar(manifestText, 'icon');
  const tags = yamlList(manifestText, 'tags');
  const triggers = yamlList(manifestText, 'trigger_words').concat(yamlList(manifestText, 'triggers'));
  const issues = [];
  let packageVersion = '';
  if (packageText) {
    try { packageVersion = String(JSON.parse(packageText).version || ''); }
    catch { add(issues, 'P1', 'invalid-package-json', 'package.json 无法解析', 'package.json'); }
  }

  for (const [file, text] of [['SKILL.md', skillText], ['manifest.yaml', manifestText], ['agents/openai.yaml', openaiText], ['README.md', readmeText]]) {
    if (!text) add(issues, 'P0', 'missing-file', `缺少 ${file}`, file);
  }
  if (!skillFrontmatter) add(issues, 'P0', 'frontmatter', 'SKILL.md 缺少有效 frontmatter', 'SKILL.md');
  if (!skillName) add(issues, 'P0', 'missing-name', 'SKILL.md 缺少 name', 'SKILL.md');
  else if (!/^[a-z0-9-]+$/.test(skillName)) add(issues, 'P0', 'invalid-name', `name 不是小写短横线：${skillName}`, 'SKILL.md');
  else if (skillName !== slug) add(issues, 'P0', 'name-directory-mismatch', `name ${skillName} 与目录 ${slug} 不一致`, 'SKILL.md');
  if (!skillDescription) add(issues, 'P0', 'missing-description', 'SKILL.md 缺少 description', 'SKILL.md');
  if (manifestName && manifestName !== slug && manifestName !== skillName) add(issues, 'P0', 'manifest-name-mismatch', `manifest name ${manifestName} 与 Skill 不一致`, 'manifest.yaml');
  if (!manifestSlug) add(issues, 'P1', 'missing-slug', 'manifest 缺少稳定 slug，平台更新可能创建重复条目', 'manifest.yaml');
  else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(manifestSlug)) add(issues, 'P1', 'invalid-slug', `manifest slug 不是小写短横线格式：${manifestSlug}`, 'manifest.yaml');
  if (!repository) add(issues, 'P1', 'missing-repository', 'manifest 缺少公开仓库地址，GitHub/SkillHub 无法稳定关联', 'manifest.yaml');
  else if (!/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/.test(repository)) add(issues, 'P1', 'invalid-repository', `repository 不是标准 GitHub 仓库地址：${repository}`, 'manifest.yaml');
  if (packageVersion && manifestVersion && packageVersion !== manifestVersion) add(issues, 'P1', 'version-mismatch', `manifest ${manifestVersion} 与 package.json ${packageVersion} 不一致`, 'package.json');
  if (!manifestDescription) add(issues, 'P0', 'missing-manifest-description', 'manifest 缺少 description', 'manifest.yaml');
  if (skillDescription && skillDescription.length < 80) add(issues, 'P1', 'short-skill-description', `SKILL.md description 只有 ${skillDescription.length} 个字符`, 'SKILL.md');
  if (manifestDescription && manifestDescription.length < 50) add(issues, 'P1', 'short-manifest-description', `manifest description 只有 ${manifestDescription.length} 个字符`, 'manifest.yaml');
  if (!displayName) add(issues, 'P1', 'missing-display-name', '缺少用户可读的 display_name', 'manifest.yaml');
  if (!interfaceName) add(issues, 'P1', 'missing-interface-name', '缺少 agents/openai.yaml interface.display_name', 'agents/openai.yaml');
  if (displayName && interfaceName && displayName !== interfaceName) add(issues, 'P1', 'display-name-mismatch', 'manifest 与 openai.yaml 的显示名称不一致', 'agents/openai.yaml');
  if (!shortDescription) add(issues, 'P1', 'missing-short-description', '缺少 interface.short_description', 'agents/openai.yaml');
  else if (shortDescription.length < 25 || shortDescription.length > 64) add(issues, 'P1', 'short-description-length', `short_description 为 ${shortDescription.length} 个字符，应为 25 至 64 个字符`, 'agents/openai.yaml');
  if (tags.length < 4) add(issues, 'P1', 'too-few-tags', `tags 只有 ${tags.length} 个，建议 4 至 8 个真实标签`, 'manifest.yaml');
  if (triggers.length < 3) add(issues, 'P1', 'too-few-triggers', `触发词只有 ${triggers.length} 个，建议覆盖用户说法`, 'manifest.yaml');
  if (!icon || !existsSync(join(dir, icon))) add(issues, 'P1', 'missing-icon', 'manifest 的 icon 不存在，发布页无法稳定显示图标', 'manifest.yaml');
  if (readmeText && !/^#\s+.+/m.test(readmeText)) add(issues, 'P1', 'readme-heading', 'README 缺少首屏标题', 'README.md');
  if (readmeText && !/(能做什么|适用场景|使用|What it does|Usage|Quick start)/i.test(readmeText)) add(issues, 'P1', 'readme-discovery', 'README 首屏缺少能力或使用说明', 'README.md');
  // SKILL.md contains rules that may mention words such as“最强” in a prohibition;
  // only inspect fields shown to users on catalogue and repository pages.
  const allPublicText = `${manifestText}\n${openaiText}\n${readmeText}`;
  if (/(全网第一|最强|百分百|保证成功|必火|稳赚|永久免费)/.test(allPublicText)) add(issues, 'P2', 'unsupported-promise', '公开字段包含不可证明的绝对化承诺');
  const p0 = issues.filter((item) => item.severity === 'P0').length;
  const p1 = issues.filter((item) => item.severity === 'P1').length;
  const p2 = issues.filter((item) => item.severity === 'P2').length;
  return {
    path: dir,
    slug,
    displayName: displayName || interfaceName || slug,
    score: Math.max(0, 100 - p0 * 35 - p1 * 10 - p2 * 3),
    summary: { P0: p0, P1: p1, P2: p2, total: issues.length },
    metadata: { skillName, skillDescriptionLength: skillDescription.length, manifestName, manifestSlug, manifestVersion, packageVersion, repository, manifestDescriptionLength: manifestDescription.length, displayName, shortDescriptionLength: shortDescription.length, tags, triggers },
    issues
  };
}

function collectBatch(root) {
  if (!existsSync(root)) throw new Error(`目录不存在：${root}`);
  const directories = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    const direct = join(root, entry.name);
    if (existsSync(join(direct, 'SKILL.md')) && existsSync(join(direct, 'manifest.yaml'))) {
      directories.push(direct);
      continue;
    }
    const nested = join(direct, 'skills', entry.name);
    if (existsSync(join(nested, 'SKILL.md')) && existsSync(join(nested, 'manifest.yaml'))) directories.push(nested);
  }
  return directories;
}

function renderReport(reports, batch) {
  const lines = ['# Skill SEO 审计报告', '', `生成时间：${new Date().toISOString()}`, ''];
  if (batch) lines.push(`共检查 ${reports.length} 个 Skill。`, '');
  for (const report of reports) {
    lines.push(`## ${report.displayName}（${report.slug}）`, '', `评分：${report.score}/100；P0 ${report.summary.P0} · P1 ${report.summary.P1} · P2 ${report.summary.P2}`, '');
    if (!report.issues.length) lines.push('结论：通过。', '');
    else {
      for (const issue of report.issues) lines.push(`- **${issue.severity} ${issue.code}**：${issue.message}${issue.file ? `（${issue.file}）` : ''}`);
      lines.push('');
    }
  }
  return lines.join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.root && !args.skills_root)) { usage(); return; }
  const batch = Boolean(args.skills_root);
  const roots = batch ? collectBatch(resolve(args.skills_root)) : [resolve(args.root)];
  const reports = roots.map(auditSkill);
  const output = resolve(args.output ?? join(roots[0], '.factory', 'seo'));
  mkdirSync(output, { recursive: true });
  writeFileSync(join(output, 'seo-audit.json'), JSON.stringify({ generatedAt: new Date().toISOString(), batch, reports }, null, 2));
  writeFileSync(join(output, 'seo-report.md'), renderReport(reports, batch));
  const blocking = reports.reduce((sum, report) => sum + report.summary.P0 + report.summary.P1, 0);
  console.log(JSON.stringify({ ok: blocking === 0, batch, skills: reports.length, blockingIssues: blocking, output }, null, 2));
  if (args.strict && blocking > 0) process.exitCode = 1;
}

main().catch((error) => { console.error(JSON.stringify({ ok: false, error: error.message }, null, 2)); process.exitCode = 1; });
