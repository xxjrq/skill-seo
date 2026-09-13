import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = await mkdtemp(join(tmpdir(), 'skill-seo-'));
const skill = join(root, 'sample-skill');
await mkdir(join(skill, 'agents'), { recursive: true });
await writeFile(join(skill, 'SKILL.md'), '---\nname: sample-skill\ndescription: 一个用于验证 Skill 元数据的示例工具，说明做什么、何时使用、输入是什么、输出什么结果以及发布前如何检查，适合演示标准流程、字段验收、公开页面优化和搜索词整理。\n---\n\n# Sample\n');
await writeFile(join(skill, 'manifest.yaml'), 'name: sample-skill\ndisplay_name: 示例技能\nslug: sample-skill\nversion: 1.0.0\nrepository: https://github.com/example/sample-skill\ndescription: 检查示例输入并输出结构化结果报告，适合在 Skill 发布前验证名称、简介、标签和展示字段是否完整一致。\nicon: icon-512.png\ntags:\n  - example\n  - metadata\n  - validation\n  - skill\ntrigger_words:\n  - 示例技能\n  - 检查元数据\n  - 发布前校验\n');
await writeFile(join(skill, 'agents', 'openai.yaml'), 'interface:\n  display_name: "示例技能"\n  short_description: "检查元数据并输出发布前结构化结果报告，帮助修复名称简介和关键词问题"\n');
await writeFile(join(skill, 'README.md'), '# 示例技能\n\n## 能做什么\n检查并输出结果。\n\n## 使用\n直接提供输入。\n');
await writeFile(join(skill, 'icon-512.png'), 'placeholder');
const result = await new Promise((resolve) => {
  const child = spawn(process.execPath, [fileURLToPath(new URL('./audit.mjs', import.meta.url)), '--root', skill, '--output', join(root, 'out'), '--strict'], { stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = ''; let stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  child.on('close', (code) => resolve({ code, stdout, stderr }));
});
if (result.code !== 0) throw new Error(`audit self-test failed: ${result.stderr || result.stdout}`);
const report = JSON.parse(await readFile(join(root, 'out', 'seo-audit.json'), 'utf8'));
if (report.reports?.[0]?.summary?.total !== 0) throw new Error('expected clean sample audit');
await rm(root, { recursive: true, force: true });
console.log('skill-seo self-test ok');
