# yskdocu-v3

学习应用 v3。从 yskdocu-v1 演进而来的生产方向项目。

## 技术栈

- Deno 2.9+
- React 19 + Vite
- Hono
- TypeScript

## 架构原则

- Content-driven
- Feature-oriented
- Mobile-first
- Local-first
- API boundary
- 不过度工程化

## 常用任务

```sh
deno task dev            # 同时启动 Hono server (:8000) 和 Vite dev server (:5173)
deno task check          # fmt --check + lint + type check
deno test                # 运行测试
deno task data:import    # 导入 v1 JSON -> data/normalized
deno task data:validate  # 校验 normalized 数据
deno task data:build     # 生成 data/generated
deno task build          # 生产构建前端到 dist/
```

## 目录结构

```
data/
  source/      # 原始 v1 JSON（只读，禁止修改）
  normalized/  # 导入、标准化后的数据
  generated/   # data:build 产物（gitignore）
scripts/data/  # 数据管线脚本
src/client/    # React 前端
src/server/    # Hono API
src/shared/    # 前后端共享类型与 schema
tests/         # 测试
```
