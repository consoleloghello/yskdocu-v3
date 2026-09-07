/**
 * 练习页（Task 17-20 / 23）
 *
 * /practice              按 Collection 分组选章节
 * /practice/:chapterId   答题会话：答题 → 反馈 → 解析 → 下一题
 *
 * 每次作答写入 learningState（localStorage），错题自动进入复习候选。
 */

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type {
  Catalog,
  Collection,
  Question,
} from "../../shared/types/content.ts";
import { apiClient } from "../lib/api.ts";
import {
  defaultStorage,
  loadLearningState,
  recordAnswer,
  saveLearningState,
  setLastPosition,
  toggleFavorite,
} from "../lib/learningState.ts";
import { Button, Card, Progress, Skeleton } from "../components/ui.tsx";
import { QuestionRenderer } from "../components/questions.tsx";

// ── 章节选择 ─────────────────────────────────────────────

export function PracticePage() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [collections, setCollections] = useState<Collection[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([apiClient.catalog(), apiClient.collections()])
      .then(([cat, cols]) => {
        setCatalog(cat);
        setCollections(cols);
      })
      .catch(() => setError(true));
  }, []);

  if (error) return <p>加载失败，请刷新重试。</p>;
  if (!catalog || !collections) {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <Skeleton height={60} />
        <Skeleton height={60} />
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: 20 }}>选择练习章节</h1>
      {collections.map((col) => (
        <section key={col.key} style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 15, color: "var(--text-secondary)" }}>
            {col.title} · {col.total} 题
          </h2>
          <div style={{ display: "grid", gap: 10 }}>
            {catalog.chapters
              .filter((ch) =>
                col.chapterIds.includes(ch.id)
              )
              .map((ch) => (
                <Link
                  key={ch.id}
                  to={`/practice/${ch.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <Card>
                    <div style={{ fontWeight: 600 }}>{ch.name}</div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--text-secondary)",
                        marginTop: 4,
                      }}
                    >
                      {ch.questionCount} 题
                    </div>
                  </Card>
                </Link>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}

// ── 答题会话 ─────────────────────────────────────────────

export function PracticeSession() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const [name, setName] = useState("");
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [error, setError] = useState(false);
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [fav, setFav] = useState(false);

  useEffect(() => {
    if (!chapterId) return;
    setQuestions(null);
    setIndex(0);
    setAnswered(false);
    setCorrectCount(0);
    setFinished(false);
    apiClient
      .chapter(chapterId)
      .then((ch) => {
        setName(ch.name);
        setQuestions(ch.questions);
      })
      .catch(() => setError(true));
  }, [chapterId]);

  if (error) return <p>加载失败：章节不存在或网络错误。</p>;
  if (!questions || !chapterId) return <Skeleton height={300} />;
  if (questions.length === 0) return <p>该章节暂无题目。</p>;

  if (finished) {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <h1 style={{ fontSize: 20 }}>{name} · 练习完成</h1>
        <Card>
          <div style={{ fontSize: 15 }}>
            答对 {correctCount} / {questions.length} 题
          </div>
          <div style={{ marginTop: 8 }}>
            <Progress value={correctCount} max={questions.length} />
          </div>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              marginBottom: 0,
            }}
          >
            错题已记入<Link to="/review">复习页</Link>。
          </p>
        </Card>
        <Button
          block
          onClick={() => {
            setIndex(0);
            setAnswered(false);
            setCorrectCount(0);
            setFinished(false);
          }}
        >
          再练一次
        </Button>
        <Link to={`/learn/${chapterId}`} style={{ textAlign: "center" }}>
          返回章节
        </Link>
      </div>
    );
  }

  const q = questions[index];
  const isLast = index === questions.length - 1;

  // 当前题目的收藏状态跟随切题刷新
  useEffect(() => {
    setFav(loadLearningState(defaultStorage()).favorites.includes(q.id));
  }, [q.id]);

  const flipFav = () => {
    const storage = defaultStorage();
    const next = toggleFavorite(loadLearningState(storage), q.id);
    saveLearningState(storage, next);
    setFav(next.favorites.includes(q.id));
  };

  const handleResult = (correct: boolean) => {
    if (answered) return;
    setAnswered(true);
    if (correct) setCorrectCount((n) => n + 1);
    // 持久化：作答记录 + 上次位置
    const storage = defaultStorage();
    let state = loadLearningState(storage);
    state = recordAnswer(state, q.id, chapterId, correct);
    state = setLastPosition(state, chapterId, q.id);
    saveLearningState(storage, state);
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600 }}>{name}</span>
        <span
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            fontSize: 13,
            color: "var(--text-secondary)",
          }}
        >
          第 {index + 1} / {questions.length} 题 · 答对 {correctCount}
          <button
            type="button"
            onClick={flipFav}
            aria-label={fav ? "取消收藏" : "收藏"}
            title={fav ? "取消收藏" : "收藏"}
            style={{
              border: "1px solid var(--border)",
              background: "var(--surface)",
              borderRadius: 8,
              fontSize: 15,
              padding: "2px 8px",
              cursor: "pointer",
              color: fav ? "var(--primary)" : "var(--text-secondary)",
            }}
          >
            {fav ? "★" : "☆"}
          </button>
        </span>
      </div>
      <div style={{ marginBottom: 12 }}>
        <Progress value={index} max={questions.length} />
      </div>
      {/* Task 23：key 切换触发进入动画，避免页面闪烁 */}
      <div key={q.id} className="question-enter">
        <QuestionRenderer question={q} onResult={handleResult} />
      </div>
      {answered && (
        <div style={{ marginTop: 16 }}>
          <Button
            block
            onClick={() => {
              if (isLast) {
                setFinished(true);
              } else {
                setIndex((i) => i + 1);
                setAnswered(false);
              }
            }}
          >
            {isLast ? "查看结果" : "下一题 →"}
          </Button>
        </div>
      )}
    </div>
  );
}
