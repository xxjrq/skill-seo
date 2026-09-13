# Skill SEO 检查器

检查 Agent Skill 的名称、简介、关键词、标签、README 和 GitHub/SkillHub 展示字段，输出按优先级排序的可执行报告。适合单个 Skill 发布前检查，也支持批量扫描 `skills/` 目录。

## 能做什么

- 找出 `SKILL.md`、`manifest.yaml`、`agents/openai.yaml` 的名称和描述冲突。
- 检查短简介长度、标签、触发词和 README 首屏是否足够让用户理解和搜索。
- 拦截绝对化承诺、无法证明的 Star、排名、性能或收益表达。
- 输出机器可读的 `seo-audit.json` 和人可读的 `seo-report.md`。

## 使用

```bash
node scripts/audit.mjs --root /path/to/skill --output ./seo-report --strict
node scripts/audit.mjs --skills-root /path/to/selfmedia/skills --output ./seo-report
```

脚本只读并报告问题，不自动改动 Skill。修复后重新审计，再发布到 GitHub、Gitee 或 SkillHub。

## 许可

MIT License
