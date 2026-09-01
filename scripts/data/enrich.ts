/**
 * data:enrich —— 对 normalized 数据做学习增强
 *
 * 规则驱动，不接 AI：
 * 1. 简答题/实操分析题/应急处理题 → keywords, keyPoints, summary
 * 2. 选择题 → keywords（从选项 + 题干提取）
 * 3. 填空题 → keywords（从题干提取）
 * 4. 判断题 → keywords（从题干提取）
 */

import type {
  NormalizedData,
  Question,
  QuestionEnrichment,
} from "../../src/shared/types/content.ts";

const INPUT = "data/normalized/all.json";
const OUTPUT = "data/normalized/enriched.json";

// ── 分点解析 ──────────────────────────────────────────

/** 按常见分点模式拆分答案文本 */
function splitKeyPoints(text: string): string[] {
  // 优先级1：（1）（2）或 (1)(2)
  let points = trySplit(text, /（(\d+)）|\((\d+)\)/g);
  if (points) return points;

  // 优先级2：①②③
  points = trySplit(text, /[①②③④⑤⑥⑦⑧⑨⑩]/g);
  if (points) return points;

  // 优先级3：第一/第二/第三
  points = trySplitChineseOrdinal(text);
  if (points) return points;

  // 无明显分点，按句号拆（最多5句）
  return text
    .split(/[。；]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, 5);
}

/** 通用分隔符拆分 */
function trySplit(text: string, sep: RegExp): string[] | null {
  const matches = [...text.matchAll(sep)];
  if (matches.length < 2) return null;
  const points: string[] = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index! + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : text.length;
    const point = text.slice(start, end).trim().replace(/^[，,：:]\s*/, "");
    if (point) points.push(point);
  }
  return points.length >= 2 ? points : null;
}

/** 中文序数拆分 */
function trySplitChineseOrdinal(text: string): string[] | null {
  const ordinals = [
    "第一",
    "第二",
    "第三",
    "第四",
    "第五",
    "第六",
    "第七",
    "第八",
  ];
  const indices = ordinals
    .map((o) => text.indexOf(o))
    .filter((i) => i >= 0);
  if (indices.length < 2) return null;
  const points: string[] = [];
  for (let i = 0; i < indices.length; i++) {
    const start = indices[i];
    const end = i + 1 < indices.length ? indices[i + 1] : text.length;
    const point = text.slice(start, end).trim().replace(
      /^第[一二三四五六七八九十][，,：:]\s*/,
      "",
    );
    if (point) points.push(point);
  }
  return points;
}

// ── 关键词提取 ────────────────────────────────────────

/** 设备名模式：XX罐 XX泵 XX塔 XX器 XX炉 XX槽 */
const EQUIP_RE =
  /(?<=[，。、；：\s]|^)[\u4e00-\u9fff]{1,4}(?:罐|泵|塔|器|炉|槽|阀|柜|池|井|站|机)/g;

/** 参数模式：数字+单位 */
const PARAM_RE = /\d+(?:\.\d+)?\s*(?:MPa|m[³²]|℃|t\/h|mm|kg|kW|kV|A|G)/g;

/** 噪音词：动词+通用名词组合，不是真正的关键词 */
const NOISE_RE =
  /^(?:查看|检查|巡检|确认|核对|监视|观察|注意|开启|关闭|启动|停止|切换|操作|配合|通知|反馈|汇报)(?:电磁阀|阀门|压力|温度|液位|状态|运行|设备|仪表|参数|数值)$/;

function extractKeywords(text: string): string[] {
  const equip = text.match(EQUIP_RE) ?? [];
  const param = text.match(PARAM_RE) ?? [];
  const all = [...equip, ...param].filter((w) => !NOISE_RE.test(w));
  return [...new Set(all)].slice(0, 8);
}

// ── 摘要 ──────────────────────────────────────────────

function makeSummary(answer: string, keyPoints: string[]): string {
  if (keyPoints.length > 0) return keyPoints[0].slice(0, 100);
  return answer.trim().slice(0, 100);
}

// ── 各题型 enrich ────────────────────────────────────

function enrichShortAnswer(q: Question): QuestionEnrichment {
  const answer = q.answer as string;
  const keyPoints = splitKeyPoints(answer);
  const keywords = extractKeywords(q.content + " " + answer);
  const summary = makeSummary(answer, keyPoints);
  return { keywords, keyPoints, summary };
}

function enrichChoice(q: Question): QuestionEnrichment {
  const optionText = (q.options ?? []).map((o) => o.text).join(" ");
  const keywords = extractKeywords(q.content + " " + optionText);
  const summary = q.content.slice(0, 60);
  return { keywords, keyPoints: [], summary };
}

function enrichFillBlank(q: Question): QuestionEnrichment {
  const keywords = extractKeywords(q.content);
  const summary = q.content.slice(0, 60);
  return { keywords, keyPoints: [], summary };
}

function enrichTrueFalse(q: Question): QuestionEnrichment {
  const keywords = extractKeywords(q.content);
  const summary = q.content.slice(0, 60);
  return { keywords, keyPoints: [], summary };
}

function enrich(q: Question): Question {
  let enrichment: QuestionEnrichment;
  switch (q.type) {
    case "single_choice":
      enrichment = enrichChoice(q);
      break;
    case "true_false":
      enrichment = enrichTrueFalse(q);
      break;
    case "fill_blank":
      enrichment = enrichFillBlank(q);
      break;
    case "short_answer":
      enrichment = enrichShortAnswer(q);
      break;
  }
  return { ...q, enrichment };
}

// ── 主流程 ────────────────────────────────────────────

async function main() {
  const data: NormalizedData = JSON.parse(await Deno.readTextFile(INPUT));

  console.log(`▶ Enrich ${data.questions.length} 题 ...`);
  const enriched = data.questions.map(enrich);

  // 统计
  const withKeyPoints = enriched.filter(
    (q) => (q.enrichment?.keyPoints.length ?? 0) > 0,
  );
  const withKeywords = enriched.filter(
    (q) => (q.enrichment?.keywords.length ?? 0) > 0,
  );
  console.log(
    `   ✓ 有要点: ${withKeyPoints.length} 题 | 有关键词: ${withKeywords.length} 题`,
  );

  const out: NormalizedData = { ...data, questions: enriched };
  await Deno.writeTextFile(OUTPUT, JSON.stringify(out, null, 2) + "\n");
  console.log(`✅ → ${OUTPUT}`);
}

if (import.meta.main) await main();
