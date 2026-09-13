---
name: skill-seo
description: 审计和优化 Agent Skill 的可发现性。用户要检查 Skill 的 SEO、GitHub 描述、SkillHub 简介、名称、关键词、标签、README 或发布资料时使用；读取 SKILL.md、manifest.yaml、agents/openai.yaml 和 README，输出真实、可搜索、不过度堆词的修复清单，不虚构功能、数据或平台排名。
---

# Skill SEO 检查器

把一个 Skill 的“能不能被搜到、看不懂、字段互相打架”一次检查清楚。它不替 Skill 添加不存在的功能，也不承诺 GitHub、SkillHub 的排名或流量。

## 什么时候使用

- 新建或接管一个 Skill，准备发布到 GitHub、Gitee 或 SkillHub。
- 发现仓库有代码但首页描述为空、名称不统一、搜索词不准确或平台简介太短。
- 批量检查 `skills/` 目录，生成按 P0/P1/P2 排序的修复报告。

## 检查内容

1. **身份一致**：`SKILL.md` 的 name 与目录、manifest 的 name 一致；显示名称可中文化，但不能与功能无关。
2. **一句话价值**：描述先说用户要解决的事，再说输入、输出和必要前置条件；不把实现术语当卖点。
3. **搜索词**：保留 1 个核心词、2 至 4 个场景/结果词和 0 至 2 个品牌词。关键词必须能在功能或示例中找到依据，禁止重复堆叠“免费、自动、最强”等词。
4. **展示字段**：`manifest.yaml`、`agents/openai.yaml` 和 `README.md` 的名称、简介、能力范围一致；短简介控制在 25 至 64 个字符。
5. **发布首页**：README 首屏应有一句价值说明、能力列表、输入/输出、使用方式和真实限制；不要把审计报告或过程日志塞进首屏。
6. **事实边界**：没有真实来源的 Star、下载量、排名、性能、免费额度和“保证成功”不得写入公开描述。

## 命令

在本 Skill 目录执行：

```bash
node scripts/audit.mjs --root /path/to/skill --output /tmp/skill-seo --strict
node scripts/audit.mjs --skills-root /path/to/selfmedia/skills --output /tmp/skills-seo
```

单个 Skill 使用 `--strict` 时，P0/P1 问题返回非零退出码，适合接入发布前门禁；批量模式默认只生成报告。输出为 `seo-audit.json` 和 `seo-report.md`。脚本只读目标 Skill，不自动改文件。

## 修复顺序

先修 P0（缺少必需文件、名称冲突、描述为空），再修 P1（短简介、标签/关键词不足、README 首屏不完整），最后处理 P2（措辞、顺序和平台差异化）。修复后重新运行审计，再运行 Skill 自己声明的 `self_test`，最后才更新 GitHub/Gitee/SkillHub 的公开字段。

## 参考资料

- [references/seo-checklist.md](references/seo-checklist.md)：字段规则、关键词模板和验收清单。
- [docs/multi-platform-publishing-seo.md](../../docs/multi-platform-publishing-seo.md)：自媒体内容的标题、简介和标签规范；不要把内容 SEO 规则误当成 Skill 元数据。
