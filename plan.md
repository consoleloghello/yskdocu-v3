好，现在正式进入 **v3「3 天开发执行计划」**。

这次我们不再做架构讨论，而是把已经评审通过的架构，压缩成一套你可以**直接交给
Codex / AI Agent 执行**的计划。

我会刻意控制范围：**3 天的目标不是把 v3
做“大”，而是做出一个可以持续迭代的生产级骨架 + 一个完整可用的学习闭环。**

---

# v3 · 3 天开发总计划

## 最终目标

3 天结束时，你应该可以做到：

```text
v1 外操版.json
       │
       ▼
deno task data:import
       │
       ▼
deno task data:validate
       │
       ▼
deno task data:build
       │
       ▼
     v3 数据
       │
       ▼
    Hono API
       │
       ▼
    React UI
       │
 ┌─────┼─────────┐
 ▼     ▼         ▼
Learn Practice  Review
 │       │        │
 └───────┼────────┘
         ▼
   Learning State
   localStorage
```

最终用户可以：

```text
首页
 ↓
发现内容
 ↓
进入章节
 ↓
学习
 ↓
开始练习
 ↓
回答问题
 ↓
获得反馈
 ↓
下一题
 ↓
离开
 ↓
再次打开
 ↓
继续学习
 ↓
Review
```

---

# 一、3 天时间分配

建议每天按照：

```text
上午       09:00 - 12:00
下午       14:00 - 18:00
晚上       20:00 - 22:30
```

实际可以根据你的时间调整。

---

# DAY 1

# 数据管线 + 应用骨架

核心目标：

> **让 v1 数据真正进入 v3，并跑通 React + Hono + Deno。**

---

## DAY 1 上午

### Task 1：建立项目骨架

建立：

```text
yskdocu-v3/
├── data/
│   ├── source/
│   ├── normalized/
│   └── generated/
│
├── scripts/
│   └── data/
│
├── src/
│   ├── client/
│   ├── server/
│   └── shared/
│
├── tests/
│
├── deno.json
└── README.md
```

---

### 验收

运行：

```bash
deno task dev
```

能够看到：

```text
React 页面
```

同时：

```text
Hono server
```

正常运行。

---

# Task 2：建立 Git 基线

你已经有 v1 / v2，因此 v3 必须独立。

建议：

```bash
git init
git checkout -b feat/v3-foundation
```

第一次 commit：

```bash
git commit -m "chore: initialize v3 architecture"
```

---

# Task 3：建立基础开发规范

准备：

```text
README.md
CONTRIBUTING.md
```

以及：

```text
deno.json
```

统一任务：

```bash
deno task dev
deno task test
deno task check
deno task build
```

---

# DAY 1 下午

# 数据 Pipeline

这是整个项目最重要的工程基础。

---

## Task 4：导入 v1 JSON

把：

```text
外操版.json
```

放：

```text
data/source/
```

注意：

> **不要修改原始 JSON。**

建立：

```bash
deno task data:import
```

功能：

```text
source JSON
 ↓
读取
 ↓
解析
 ↓
标准化
 ↓
normalized/
```

---

# Task 5：设计 v3 Schema

建立：

```text
src/shared/types/
src/shared/schemas/
```

例如：

```text
Question
Topic
Chapter
Collection
```

Question：

```text
{
  id,
  type,
  content,
  answer,
  knowledge,
  metadata
}
```

Schema 使用运行时验证。

重点不是追求复杂。

而是：

> **以后 v1 JSON 改了，可以检测出来。**

---

# Task 6：Validate

实现：

```bash
deno task data:validate
```

检查：

```text
JSON 是否合法
题目是否有 id
type 是否有效
选择题是否存在 options
答案是否合法
填空题答案是否存在
判断题答案是否合法
```

发现错误：

```text
❌ question q-102
answer missing
```

而不是：

```text
Error
```

---

# Task 7：Enrich

把原始数据转换成更适合学习的数据。

例如：

```text
简答题
```

自动生成：

```text
keywords
keyPoints
summary
```

第一版甚至可以：

> 基于已有解析 + 简单规则生成。

不要第一天接 AI。

---

# Task 8：Build

实现：

```bash
deno task data:build
```

最终：

```text
data/generated/
```

得到：

```text
catalog.json
topics.json
questions.json
```

或者按照你的最终数据模型拆分。

---

# DAY 1 下午结束验收

必须做到：

```bash
deno task data:import
deno task data:validate
deno task data:build
```

全部成功。

并且：

```text
v1 JSON
 ↓
v3 Generated Data
```

真实跑通。

---

# DAY 1 晚上

# Hono + Repository + React 基础 UI

---

## Task 9：Repository

建立：

```text
src/server/repositories/
```

例如：

```text
contentRepository.ts
```

提供：

```text
getCatalog()
getTopic()
getQuestion()
searchQuestions()
```

---

# Task 10：Hono API

建立：

```text
src/server/routes/
```

第一版：

```text
GET /api/catalog
GET /api/topics/:id
GET /api/questions/:id
GET /api/questions
GET /api/search
```

---

# Task 11：React Router

建立：

```text
/
 /learn
 /learn/:topicId
 /practice
 /review
 /search
```

---

# Task 12：设计系统第一版

只做：

```text
Button
Card
Badge
Progress
Input
Skeleton
```

建立：

```text
theme
motion
```

---

# DAY 1 最终验收

打开：

```text
http://localhost:xxxx
```

能够：

```text
首页
 ↓
API
 ↓
真实 v3 数据
 ↓
显示内容
```

---

# DAY 1 Commit

```bash
git commit -m "feat: build content pipeline and application foundation"
```

---

# DAY 2

# Learn + Practice

Day 2 是整个项目的核心。

目标：

> **让用户第一次真正感觉到“这不是 v1”。**

---

# DAY 2 上午

## Task 13：Home

首页完成：

```text
Greeting
Continue Learning
Today
Explore
Recent
```

最重要：

```text
继续学习
```

---

## Task 14：Learn

实现：

```text
Collection
 ↓
Topic
 ↓
Knowledge
```

用户可以：

```text
首页
 ↓
选择主题
 ↓
进入章节
 ↓
浏览知识
```

---

# Task 15：Progress

建立：

```text
learningState
```

第一版：

```text
localStorage
```

记录：

```text
lastPosition
completed
favorites
wrongAnswers
mastery
```

---

# DAY 2 下午

# Question System

---

## Task 16：QuestionRenderer

```tsx
<QuestionRenderer question={question} />;
```

根据：

```text
question.type
```

渲染：

```text
SingleChoiceQuestion
TrueFalseQuestion
FillBlankQuestion
ShortAnswerQuestion
```

---

# Task 17：选择题

完成：

```text
选择
 ↓
确认
 ↓
正确 / 错误
 ↓
解析
 ↓
下一题
```

动画：

```text
selection
feedback
transition
```

---

# Task 18：判断题

两个大按钮：

```text
✓ 正确
× 错误
```

移动端重点优化。

---

# Task 19：填空题

支持：

```text
inline input
```

例如：

```text
水罐 [ 2 ] 座，
容积 [ 9923.3 ] m³
```

---

# Task 20：简答题

完成：

```text
textarea
 ↓
提交
 ↓
参考答案
 ↓
关键点
```

第一版：

> **不做 AI 自动评分。**

---

# DAY 2 晚上

# Learning Feedback

这是 Day 2 最应该打磨的地方。

---

## Task 21：统一反馈组件

```text
AnswerFeedback
```

状态：

```text
correct
incorrect
partial
```

---

## Task 22：Explanation

统一：

```text
为什么？
关键知识点
记住
```

---

## Task 23：Question Transition

实现：

```text
Next Question
```

动画：

```text
Exit
 ↓
Enter
```

避免页面闪烁。

---

# DAY 2 最终验收

完整跑：

```text
Learn
 ↓
Practice
 ↓
选择题
 ↓
判断题
 ↓
填空题
 ↓
简答题
 ↓
Feedback
 ↓
Next
```

---

# DAY 2 Commit

```bash
git commit -m "feat: implement learning and question experience"
```

---

# DAY 3

# Review + Mobile + Polish + Production

---

# DAY 3 上午

## Task 24：Review

实现：

```text
Review
```

根据：

```text
wrongAnswers
mastery
```

生成：

```text
需要复习
```

---

## Task 25：Continue Learning

重新打开：

```text
火炬系统
17 / 32
```

点击：

```text
继续学习
```

直接回：

```text
17 / 32
```

---

## Task 26：Favorites

实现：

```text
收藏
取消收藏
收藏列表
```

---

## Task 27：Search

实现：

```text
⌘ K
```

搜索：

```text
知识
章节
题目
```

结果分组。

---

# DAY 3 下午

# Mobile + Theme + Motion

---

## Task 28：Mobile First

重点测试：

```text
390px
```

检查：

```text
首页
Topic
Question
Input
Bottom navigation
```

---

## Task 29：Dark Mode

完成：

```text
Light
Dark
```

并：

```text
localStorage
```

保存用户选择。

---

## Task 30：Motion

重点打磨：

```text
Page
Card
Answer
Feedback
Question
Theme
```

---

## Task 31：Loading / Empty / Error

统一：

```text
Skeleton
EmptyState
ErrorState
Toast
```

---

# DAY 3 晚上

# Production Hardening

这一部分不要跳过。

---

## Task 32：测试

至少：

```text
data pipeline
schema
repository
question renderer
learning state
```

---

## Task 33：Check

运行：

```bash
deno fmt
deno lint
deno check
deno test
```

全部通过。

---

# Task 34：Build

运行：

```bash
deno task build
```

检查：

```text
production build
```

---

# Task 35：真实数据测试

一定要：

```text
外操版.json
```

真实跑完整流程。

不要只拿 demo 数据测试。

---

# Task 36：移动端最终测试

至少：

```text
390 × 844
768 × 1024
1440 × 900
```

检查：

```text
overflow
button
input
navigation
animation
```

---

# 三天最终验收

最终必须能够完成：

```text
                  HOME
                    │
                    ▼
                  LEARN
                    │
           ┌────────┴────────┐
           ▼                 ▼
         TOPIC            SEARCH
           │
           ▼
        KNOWLEDGE
           │
           ▼
        PRACTICE
           │
   ┌───────┼────────┐
   ▼       ▼        ▼
Choice   Fill     True/False
   │
   ▼
Short Answer
   │
   ▼
 Feedback
   │
   ▼
 Progress
   │
   ▼
  Review
```

---

# 四、三个 Git 节点

我建议不要一天提交几十次。

保留三个主要 checkpoint：

```bash
# Day 1
git commit -m "feat: build content pipeline and application foundation"

# Day 2
git commit -m "feat: implement learning and question experience"

# Day 3
git commit -m "feat: complete review mobile and production polish"
```

当然中途可以正常小提交。

---

# 五、给 Codex / AI Agent 的工作方式

这一点非常重要。

**不要把整个 Day 1 一次性交给 AI。**

应该：

```text
Task
 ↓
AI 实现
 ↓
运行测试
 ↓
人工确认
 ↓
Commit
 ↓
下一 Task
```

---

# 六、每次给 AI 的 Prompt 模板

以后你可以一直使用：

```text
你现在正在开发 yskdocu-v3。

项目技术栈：
- Deno 2.9+
- React
- Hono
- TypeScript

当前阶段：
Day X / Task X

架构原则：
- Content-driven
- Feature-oriented
- Mobile-first
- Local-first
- API boundary
- 不过度工程化

当前任务：
[具体任务]

要求：
1. 先检查现有代码，不要假设目录结构。
2. 理解现有实现后再修改。
3. 不要修改 data/source 中的原始 v1 JSON。
4. 优先复用已有代码。
5. 不要引入未经批准的新框架。
6. 完成后运行：
   deno fmt
   deno lint
   deno check
   deno test
7. 如果发现架构问题，先报告，不要擅自扩大任务范围。
8. 最后说明：
   - 修改了什么
   - 为什么这样修改
   - 测试结果
   - 还有什么问题
```

这个 Prompt 非常适合你的开发方式。

---

# 七、一个重要建议：让 AI “先读后改”

以后无论 Codex 还是其他 Agent：

**不要：**

```text
“帮我实现首页。”
```

应该：

```text
先检查：
deno.json
package.json
src/
data/
tests/

理解当前架构。

然后给出你的实现计划。

不要修改文件。

等确认后再执行。
```

尤其是 Day 1。

---

# 八、你的 AI Agent 开发循环

我建议以后固定成：

```text
你
 │
 │ Task
 ▼
AI Agent
 │
 ├── Inspect
 │
 ├── Plan
 │
 ├── Implement
 │
 ├── Test
 │
 └── Report
 │
 ▼
你 Review
 │
 ├── OK → Commit
 │
 └── 不 OK → Fix
```

这样你不是：

> **让 AI 替你写项目。**

而是：

> **你负责架构和验收，AI 负责执行。**

这其实非常适合你现在学习 Deno + React 的阶段。

---

# 九、三天以后不要立刻继续堆功能

Day 3 结束后，我建议先做：

```text
v3.0.0-alpha
```

然后真实使用。

你自己连续使用几天，观察：

```text
哪里不好点？
哪里动画多余？
哪里找不到？
哪里信息太多？
哪里像 v1？
哪里不像学习 App？
```

然后再进入：

```text
v3.1
```

---

# 十、v3 后续路线

三天 MVP 以后：

```text
v3.0
 │
 ├── v3.1 体验优化
 │
 ├── v3.2 数据扩充
 │
 ├── v3.3 学习算法
 │
 ├── v3.4 AI 辅助学习
 │
 └── v4   用户 / 云同步
```

未来可以逐渐增加：

```text
AI 解析
AI 简答题评价
知识图谱
学习路径
智能复习
错题分析
语音学习
离线学习
账号同步
```

但都建立在现在这套架构上。

---

# 十一、最终的 3 天路线图

![Image](https://images.openai.com/static-rsc-4/9CVKqYOyfq9D8RwoiRINqYysthym4_80qmd05cHg42znWWNbDOpXkl-8Lb584e5hSZAroSwvwHdfePFH2WsHeIrrADipjG4MOnOyVtdnJMLvtC08WojreW_izwPIVufbDwa9zXOujzqPduj0A8CnegHnbeo7dXgmss4_M6rQlghMLJH8f9HzEYwB5xJ5qcIg?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/D-fGILgs1cUG8IMf9dptQn8X7rTUP_T6oT45HeotJrfxqlBkj-XtxjQarmxjXFkU6LPnxZ8R8EPUJDFVr5V0K2-pulu5fy_HsanaJhT-Rlo4DwfxKrN8hKuT86Y09qVW1ywJNqxVbh5HGqSO62GSBKqgHQfB2do4PK9VbdfengsQp1JTtvT9R0QfkINlgo2T?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/XJP1JFjlA17E9vWnx4v6TvTDngsfbOaNQqpn_6814CyHl8NKbmBctDJs7muLsbc9qxXJNb9lWWd7SGSxNP4wdaNKZtkZEu71Z1jU-i2TgUFdwd0hxiw4TPIChJyI6JtQ4_YufoccCHHDWgJYzUOipA6B7vDWpEy-zgNKUf-gwZPyC64t60sww4xnekdFNFH6?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/NiRlMWKMMTL1DoUEponoZVLjM13UGbGMM1slER9sHGmUw-2QqJUS1oogfcPY8opLbFhU3n9977t9kUsZPePH74Ov_AcxaKbpjKs5_kk8pHRzt6nwxMVbY7R97s7OLD-dBLUGJj6UD8-e4v11eo_a7d3sAPYzloGb6_P0OXCZIYoGxjn-ZeVGVgQrQcn4zGgb?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/2lrK618JhJSL8-nPm_RrpOYr5saPS3s4nVuqOcJVGwsumt9BOIDtrBRWpxwIcawYvwFVUI4YFNS9S88qx4I0gy-Y15_HbOsJ63m1A-O3c0Lrd1nwnQ_Vwt8WoLQfGPcNnTX7q2DT2EtlZlkhPjDZ9HmoPVYY4mS8CLsNkr2pcRE11S-ab77oCot1OcWelRME?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/Uus5kNQxgPBno01Xr6zHsgvFotad7G8kazizZE9oK9zmS8Nn9398YFxe4IPQJMiiRjxBz5S85AEd8Ihw_9z5i5rDqGOxB3PnIodrObGZoJz0vptqyTgsNMAvqeYofdh-YcxvN337LCHIZ8GDLeH26ovGF7u4smU7_lHycA70F6ne2DX-RQCOplZzts-NhZdY?purpose=fullsize)

```text
               V3
                │
  ┌─────────────┼─────────────┐
  │             │             │
 DAY 1         DAY 2         DAY 3
  │             │             │
  ▼             ▼             ▼
DATA          LEARN         REVIEW
API           PRACTICE      MOBILE
REACT         QUESTIONS     DARK
Hono          FEEDBACK      MOTION
THEME                        TEST
  │             │             │
  └─────────────┼─────────────┘
                ▼
            v3.0 MVP
                │
                ▼
        Real User Testing
                │
                ▼
             v3.1
```

---

# 十二、我建议我们现在不要直接开始 Day 1 全部任务

虽然计划已经确定，但**真正开始执行时，应该严格按照 Task 1 → Task 2 → Task
3……走**。

第一步只做：

> **Day 1 / Task 1：建立 v3 项目骨架。**

而且这里有一个很关键的区别：

你之前的 `yskdocu-v2` 是你为了学习 Deno 做的 demo；现在的 `yskdocu-v3`
是第一次真正按照我们刚才评审的架构做**生产方向项目**。

所以 Day 1 我建议我们先让 AI **检查你当前 `yskdocu-v3`
仓库状态，然后再决定具体初始化方式**，而不是直接复制一套模板。

你可以直接在 Codex CLI 里把下面这段作为第一条任务：

```text
你现在负责协助开发 yskdocu-v3。

这是一个从 yskdocu-v1 演进而来的生产方向学习应用。

技术栈：
- Deno 2.9.6+
- React
- Hono
- TypeScript

架构原则：
- Content-driven
- Feature-oriented
- Mobile-first
- Local-first
- API boundary
- 不过度工程化

当前阶段：
Day 1 / Task 1：项目骨架初始化

请先不要修改任何文件。

第一步只做代码库检查：

1. 检查当前 Git 状态。
2. 检查当前分支。
3. 查看目录结构。
4. 查看 deno.json / package.json（如果存在）。
5. 查看 src 目录。
6. 查看 data 目录。
7. 查看现有 README。
8. 判断当前项目是否已经存在部分 v3 实现。

然后向我汇报：

- 当前项目状态
- 当前技术栈
- 已存在的代码
- 与 v3 最终架构的差距
- Task 1 建议怎么实施
- 需要新建哪些目录和文件

注意：
不要修改文件。
不要安装依赖。
不要执行破坏性操作。
不要擅自改变架构。
```

**这一步非常重要。**

你把 Codex 的检查结果贴给我，我们就从 **Day 1 / Task 1** 开始，一步一步把 v3
真正做出来。
