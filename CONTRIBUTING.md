# 开发规范

## 工作流

```text
Task → AI/人实现 → 运行检查 → 人工确认 → Commit → 下一 Task
```

## 常用命令

| 命令                                                 | 用途                                            |
| ---------------------------------------------------- | ----------------------------------------------- |
| `deno task dev`                                      | 启动开发环境（Hono :8000 + Vite :5173）         |
| `deno task check`                                    | fmt --check + lint + type check，提交前必须通过 |
| `deno task test`                                     | 运行测试                                        |
| `deno task build`                                    | 生产构建                                        |
| `deno task data:import / data:validate / data:build` | 数据管线                                        |

## 提交前检查清单

```sh
deno fmt
deno lint
deno check src/ scripts/ tests/
deno test
```

## 代码约定

- TypeScript 严格模式（Deno 默认），不使用 `any` 逃逸，除非有注释说明
- 导入本地文件必须带扩展名（`./App.tsx`、`./types.ts`）
- 组件放 `src/client/components/`，页面放 `src/client/pages/`
- 前后端共享的类型 / schema 只放 `src/shared/`，client 与 server 不得互相引用
- 运行时数据校验使用 schema（shared/schemas），不信任外部输入

## 数据纪律

- `data/source/` 是原始 v1 JSON，**只读，任何情况下不修改**
- `data/normalized/`、`data/generated/` 是管线产物，可随时重建，不手工编辑
- `data/generated/` 不进 Git

## Git 约定

- 分支：`feat/v3-*` / `fix/*` / `chore/*`
- Commit message：conventional commits（`feat:` / `fix:` / `chore:` / `data:`）
- 三个里程碑 checkpoint（Day 1/2/3），日常允许小提交

## 架构原则

Content-driven · Feature-oriented · Mobile-first · Local-first · API boundary ·
不过度工程化
