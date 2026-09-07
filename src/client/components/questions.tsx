/**
 * 题目渲染体系（Task 16 / 21 / 22）
 *
 * <QuestionRenderer question onResult /> 按 question.type 分发；
 * 各题型组件内部管理「作答 → 提交 → 反馈 → 解析」状态机，
 * 判分完成后调用一次 onResult(correct)，父组件负责切题与记分。
 */

import { useState } from "react";
import type { Question, QuestionType } from "../../shared/types/content.ts";
import { gradeQuestion, splitBlanks } from "../lib/grading.ts";
import type { GradeStatus } from "../lib/grading.ts";
import { Badge, Button, Card } from "./ui.tsx";

export const QuestionTypeLabel: Record<QuestionType, string> = {
  single_choice: "选择",
  true_false: "判断",
  fill_blank: "填空",
  short_answer: "简答",
};

// ── Task 21：统一反馈 ────────────────────────────────────

const feedbackStyle: Record<GradeStatus, { bg: string; color: string }> = {
  correct: { bg: "var(--primary-weak)", color: "var(--success)" },
  incorrect: { bg: "#fef2f2", color: "var(--danger)" },
  manual: { bg: "var(--primary-weak)", color: "var(--primary)" },
};

const feedbackText: Record<GradeStatus, string> = {
  correct: "✓ 回答正确",
  incorrect: "× 回答错误",
  manual: "对照参考答案自评",
};

export function AnswerFeedback({ status }: { status: GradeStatus }) {
  const s = feedbackStyle[status];
  return (
    <div
      style={{
        background: s.bg,
        color: s.color,
        fontWeight: 600,
        fontSize: 15,
        borderRadius: 8,
        padding: "10px 14px",
      }}
      role="status"
    >
      {feedbackText[status]}
    </div>
  );
}

// ── Task 22：统一解析 ────────────────────────────────────

function answerText(q: Question): string {
  switch (q.type) {
    case "single_choice": {
      const opt = (q.options ?? []).find((o) => o.key === q.answer);
      return opt ? `${opt.key}. ${opt.text}` : String(q.answer);
    }
    case "true_false":
      return q.answer === true ? "正确" : "错误";
    case "fill_blank":
      return (q.answer as string[]).join(" / ");
    case "short_answer":
      return q.answer as string;
  }
}

export function Explanation({ question }: { question: Question }) {
  const keyPoints = question.enrichment?.keyPoints ?? [];
  const summary = question.enrichment?.summary;
  return (
    <Card>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>解析</div>
      <div style={{ fontSize: 14, lineHeight: 1.6 }}>
        <span style={{ color: "var(--text-secondary)" }}>答案：</span>
        {answerText(question)}
      </div>
      {keyPoints.length > 0 && (
        <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6 }}>
          <div style={{ color: "var(--text-secondary)" }}>关键点：</div>
          <ul style={{ margin: "4px 0 0", paddingLeft: 20 }}>
            {keyPoints.map((k, i) => <li key={i}>{k}</li>)}
          </ul>
        </div>
      )}
      {summary && (
        <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6 }}>
          <span style={{ color: "var(--text-secondary)" }}>记住：</span>
          {summary}
        </div>
      )}
    </Card>
  );
}

// ── 公共：题干头 ─────────────────────────────────────────

function Stem({ question }: { question: Question }) {
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <Badge>{QuestionTypeLabel[question.type]}</Badge>
        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          #{question.metadata.number}
        </span>
      </div>
      {question.type !== "fill_blank" && (
        <div style={{ fontSize: 16, lineHeight: 1.6 }}>{question.content}</div>
      )}
    </div>
  );
}

interface QCProps {
  question: Question;
  onResult: (correct: boolean) => void;
}

// ── Task 17：选择题 ──────────────────────────────────────

export function SingleChoiceQuestion({ question, onResult }: QCProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<GradeStatus | null>(null);

  const submit = () => {
    if (!selected || status) return;
    const s = gradeQuestion(question, selected);
    setStatus(s);
    onResult(s === "correct");
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Stem question={question} />
      <div style={{ display: "grid", gap: 8 }}>
        {(question.options ?? []).map((o) => {
          const active = selected === o.key;
          const isAnswer = status && o.key === question.answer;
          const isWrongPick = status === "incorrect" && active;
          return (
            <button
              key={o.key}
              type="button"
              disabled={!!status}
              onClick={() => setSelected(o.key)}
              style={{
                textAlign: "left",
                padding: "12px 14px",
                borderRadius: 10,
                fontSize: 15,
                cursor: status ? "default" : "pointer",
                border: `1px solid ${
                  isAnswer
                    ? "var(--success)"
                    : isWrongPick
                    ? "var(--danger)"
                    : active
                    ? "var(--primary)"
                    : "var(--border)"
                }`,
                background: isAnswer ? "var(--primary-weak)" : "var(--surface)",
              }}
            >
              <strong style={{ marginRight: 8 }}>{o.key}</strong>
              {o.text}
            </button>
          );
        })}
      </div>
      {!status && (
        <Button block disabled={!selected} onClick={submit}>
          确认
        </Button>
      )}
      {status && (
        <>
          <AnswerFeedback status={status} />
          <Explanation question={question} />
        </>
      )}
    </div>
  );
}

// ── Task 18：判断题 ──────────────────────────────────────

export function TrueFalseQuestion({ question, onResult }: QCProps) {
  const [status, setStatus] = useState<GradeStatus | null>(null);
  const [picked, setPicked] = useState<boolean | null>(null);

  const answer = (v: boolean) => {
    if (status) return;
    setPicked(v);
    const s = gradeQuestion(question, v);
    setStatus(s);
    onResult(s === "correct");
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Stem question={question} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {([true, false] as const).map((v) => (
          <button
            key={String(v)}
            type="button"
            disabled={!!status}
            onClick={() => answer(v)}
            style={{
              padding: "20px 0",
              fontSize: 20,
              fontWeight: 600,
              borderRadius: 12,
              cursor: status ? "default" : "pointer",
              border: `2px solid ${
                status && picked === v
                  ? status === "correct" ? "var(--success)" : "var(--danger)"
                  : "var(--border)"
              }`,
              background: "var(--surface)",
              color: v ? "var(--success)" : "var(--danger)",
            }}
          >
            {v ? "✓ 正确" : "× 错误"}
          </button>
        ))}
      </div>
      {status && (
        <>
          <AnswerFeedback status={status} />
          <Explanation question={question} />
        </>
      )}
    </div>
  );
}

// ── Task 19：填空题 ──────────────────────────────────────

export function FillBlankQuestion({ question, onResult }: QCProps) {
  const blanks = (question.answer as string[]).length;
  const [values, setValues] = useState<string[]>(() => Array(blanks).fill(""));
  const [status, setStatus] = useState<GradeStatus | null>(null);

  const submit = () => {
    if (status) return;
    const s = gradeQuestion(question, values);
    setStatus(s);
    onResult(s === "correct");
  };

  const parts = splitBlanks(question.content);
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Stem question={question} />
      <div style={{ fontSize: 16, lineHeight: 2.2 }}>
        {parts.map((p, i) => (
          <span key={i}>
            {p}
            {i < blanks && (
              <input
                value={values[i] ?? ""}
                disabled={!!status}
                onChange={(e) => {
                  const next = [...values];
                  next[i] = e.target.value;
                  setValues(next);
                }}
                style={{
                  width: 90,
                  // 16px：防止 iOS Safari 聚焦时自动缩放
                  fontSize: 16,
                  padding: "4px 8px",
                  margin: "0 4px",
                  borderRadius: 6,
                  border: `1px solid ${
                    status
                      ? status === "correct"
                        ? "var(--success)"
                        : "var(--danger)"
                      : "var(--primary)"
                  }`,
                  outline: "none",
                }}
              />
            )}
          </span>
        ))}
      </div>
      {!status && (
        <Button
          block
          disabled={values.some((v) => v.trim() === "")}
          onClick={submit}
        >
          提交
        </Button>
      )}
      {status && (
        <>
          <AnswerFeedback status={status} />
          <Explanation question={question} />
        </>
      )}
    </div>
  );
}

// ── Task 20：简答题（不做 AI 评分，用户自评）──────────────

export function ShortAnswerQuestion({ question, onResult }: QCProps) {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const selfRate = (correct: boolean) => {
    onResult(correct);
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Stem question={question} />
      {!submitted
        ? (
          <>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder="写下你的回答…"
              style={{
                width: "100%",
                // 16px：防止 iOS Safari 聚焦时自动缩放
                fontSize: 16,
                padding: "10px 14px",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                outline: "none",
                resize: "vertical",
              }}
            />
            <Button
              block
              disabled={text.trim() === ""}
              onClick={() => setSubmitted(true)}
            >
              提交
            </Button>
          </>
        )
        : (
          <>
            <AnswerFeedback status="manual" />
            <Explanation question={question} />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <Button variant="secondary" block onClick={() => selfRate(true)}>
                我答对了
              </Button>
              <Button variant="ghost" block onClick={() => selfRate(false)}>
                没答对
              </Button>
            </div>
          </>
        )}
    </div>
  );
}

// ── Task 16：统一分发 ────────────────────────────────────

export function QuestionRenderer(
  { question, onResult }: QCProps,
) {
  switch (question.type) {
    case "single_choice":
      return <SingleChoiceQuestion question={question} onResult={onResult} />;
    case "true_false":
      return <TrueFalseQuestion question={question} onResult={onResult} />;
    case "fill_blank":
      return <FillBlankQuestion question={question} onResult={onResult} />;
    case "short_answer":
      return <ShortAnswerQuestion question={question} onResult={onResult} />;
  }
}
