# yskdocu-v3

学习应用 v3。从 yskdocu-v1 演进而来的生产方向项目。

当前状态：Day 1–3 MVP 完成（`milestone/day3`），801 题 / 18
章真实数据全链路跑通。

## 技术栈

- Deno 2.9+
- React 19 + Vite + React Router
- Hono
- TypeScript + Zod（运行时 schema）

## 架构原则

- Content-driven
- Feature-oriented
- Mobile-first
- Local-first（学习状态存 localStorage）
- API boundary（前后端只经 `src/shared` 共享类型，不得互引）
- 不过度工程化

## 学习模型（命名约定）

plan.md 的 `Collection → Topic → Knowledge` 映射到实际两层数据上，定死如下：

| plan 概念  | 实现                        | 说明                                                                    |
| ---------- | --------------------------- | ----------------------------------------------------------------------- |
| Collection | 数据来源（内操版 / 外操版） | `Collection` 类型，由 catalog 推导，不落盘                              |
| Topic      | `Chapter`（18 章）          | `type Topic = Chapter`；路由 `:topicId` 即 chapter id                   |
| Knowledge  | `QuestionEnrichment`        | `type Knowledge = QuestionEnrichment`（keywords / keyPoints / summary） |

## 功能

- 首页：问候、继续练习（断点恢复）、今日统计、探索入口
- 学习：按 Collection 分组浏览 Topic，显示章节掌握度
- 练习：选章节 → 答题 → 反馈 → 解析 → 下一题 → 成绩页；支持收藏（★）
- 复习：薄弱章节、错题（答对自动移出）、收藏列表
- 搜索：⌘K / Ctrl+K 聚焦，结果按主题 / 题目分组
- 深色模式：跟随系统，可手动切换，localStorage 持久化

## 页面路由

| 路由                   | 页面             |
| ---------------------- | ---------------- |
| `/`                    | 首页             |
| `/learn`               | 学习（主题目录） |
| `/learn/:topicId`      | 章节详情         |
| `/practice`            | 选择练习章节     |
| `/practice/:chapterId` | 答题会话         |
| `/review`              | 复习             |
| `/search`              | 搜索             |

## API

| 方法与路径                                           | 说明                         |
| ---------------------------------------------------- | ---------------------------- |
| `GET /api/health`                                    | 健康检查                     |
| `GET /api/catalog`                                   | 目录（章节概览 + 统计）      |
| `GET /api/collections`                               | 合集列表                     |
| `GET /api/chapters`                                  | 章节详情列表                 |
| `GET /api/chapters/:id`                              | 单章节（含题目）             |
| `GET /api/questions?chapterId=&type=&limit=&offset=` | 题目列表（过滤 + 分页）      |
| `GET /api/questions/:id`                             | 单题                         |
| `GET /api/search?q=&limit=`                          | 搜索（题干 + 选项 + 关键词） |

## 数据管线

```text
data/source/*.json（v1 原始，只读，禁止修改）
  → deno task data:import    → data/normalized/all.json
  → deno task data:enrich    → data/normalized/enriched.json（keywords/keyPoints/summary）
  → deno task data:validate  → 结构 + 业务规则校验（0 警告才算过）
  → deno task data:build     → data/generated/{catalog,chapters,questions}.json
```

`data/normalized/*.json` 与 `data/generated/` 都是可重建产物，不进 Git； fresh
clone 后按顺序跑一遍四个命令即可。

## 常用任务

```sh
deno task dev            # 同时启动 Hono server (:8000) 和 Vite (:5173)
deno task dev:server     # 只启动 Hono server
deno task dev:client     # 只启动 Vite
deno task check          # fmt --check + lint + type check
deno task test           # 运行测试（33 例）
deno task data:import    # 导入 v1 JSON -> data/normalized
deno task data:enrich    # 富化（纯规则，不接 AI）
deno task data:validate  # 校验 normalized 数据
deno task data:build     # 生成 data/generated
deno task build          # 生产构建前端到 dist/
```

## 学习状态（localStorage）

key 均为 `yskdocu-v3:*` 前缀：

- `learning-state:v1`：`lastPosition`（上次位置）/
  `completed`（按题记最近一次作答）/ `favorites` / `wrongAnswers` 与
  `mastery`（均从 `completed` 推导，可重建）
- `theme`：`light` / `dark`

## 目录结构

```text
data/
  source/      # 原始 v1 JSON（只读，禁止修改）
  normalized/  # 管线中间产物（gitignore，可重建）
  generated/   # data:build 产物（gitignore）
scripts/data/  # 数据管线脚本（import/enrich/validate/build）
src/
  client/      # React 前端（pages/lib/components/styles）
  server/      # Hono API（routes/repositories）
  shared/      # 前后端共享类型与 schema
tests/         # 测试（schema/repository/api/grading/learning-state/theme）
```

## 里程碑

- `milestone/day3`：Day 3 验收点（check OK / test 33/33 / 801 题 0 警告 / build
  OK）
- 查看：`git show milestone/day3 --no-patch`；回看：`git checkout milestone/day3`
- 详细开发计划见 `plan.md`
