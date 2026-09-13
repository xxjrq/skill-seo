# Skill 元数据 SEO 清单

## 必填字段

| 文件 | 字段 | 要求 |
| --- | --- | --- |
| `SKILL.md` | `name` | 小写短横线，和目录名一致 |
| `SKILL.md` | `description` | 说明做什么、何时触发、输入/输出和硬前置条件 |
| `manifest.yaml` | `display_name` | 用户看得懂的名称，避免只有内部代号 |
| `manifest.yaml` | `slug` | 固定的小写短横线标识，更新版本时不能变化 |
| `manifest.yaml` | `version` | 使用语义化版本，并与 `package.json` 保持一致 |
| `manifest.yaml` | `repository` | 可访问的 GitHub 仓库首页地址 |
| `manifest.yaml` | `description` | 一句话价值 + 主要结果，不写空泛口号 |
| `manifest.yaml` | `trigger_words`/`triggers` | 真实的中文和英文搜索表达 |
| `manifest.yaml` | `tags` | 4 至 8 个主题、场景或结果标签 |
| `agents/openai.yaml` | `interface.short_description` | 25 至 64 个字符，先写结果 |
| `README.md` | 首屏 | 一句话价值、能做什么、怎么开始 |

## 关键词配方

```text
核心词 1 个：用户最可能直接搜索的任务
场景词 2 至 4 个：用户在什么页面、行业或工作流中使用
结果词 1 至 2 个：会得到什么文件、报告或页面结果
品牌词 0 至 2 个：真实的项目名、平台名或运行时
```

关键词放在名称、简介、触发词和 README 的自然位置即可。不要重复同义词，不要用无关热词，不要把“免费、免 Key、自动”当作唯一卖点；这些只有在功能确实满足时才能出现。

## 发布验收

- 四套字段名称和能力范围一致。
- 公开描述没有未核验的 Star、下载量、排名、性能或收益承诺。
- README 有一个可复制的最小使用示例和真实限制。
- 图标、版本、许可证和仓库地址可回读。
- 本地审计 `--strict` 通过，之后再更新远端资料。
