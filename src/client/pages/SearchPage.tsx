/**
 * 搜索页（Task 27）—— ⌘K / Ctrl+K 聚焦，结果按主题 / 题目分组。
 *
 * 主题匹配在前端对 catalog 做名字过滤，题目走 /api/search。
 */

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { CatalogChapter, Question } from "../../shared/types/content.ts";
import { apiClient } from "../lib/api.ts";
import { Card, Input } from "../components/ui.tsx";
import { QuestionTypeLabel } from "../components/questions.tsx";

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Question[]>([]);
  const [count, setCount] = useState(0);
  const [chapters, setChapters] = useState<CatalogChapter[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K 聚焦搜索框
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setCount(0);
      setChapters([]);
      return;
    }
    const t = setTimeout(() => {
      const q = query.trim();
      Promise.all([
        apiClient.search(q, 20),
        apiClient.catalog().catch(() => null),
      ])
        .then(([r, cat]) => {
          setResults(r.results);
          setCount(r.count);
          const needle = q.toLowerCase();
          setChapters(
            (cat?.chapters ?? []).filter((c) =>
              c.name.toLowerCase().includes(needle)
            ),
          );
        })
        .catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const searching = query.trim().length > 0;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <h1 style={{ fontSize: 20, margin: 0 }}>搜索</h1>
        <kbd
          style={{
            fontSize: 12,
            color: "var(--text-secondary)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "2px 8px",
            background: "var(--surface)",
          }}
        >
          ⌘K
        </kbd>
      </div>
      <div style={{ marginTop: 12 }}>
        <Input
          ref={inputRef}
          placeholder="搜索主题、题干或关键词…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {searching && chapters.length > 0 && (
        <section style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            主题 · {chapters.length}
          </h2>
          <div style={{ display: "grid", gap: 10 }}>
            {chapters.map((c) => (
              <Link
                key={c.id}
                to={`/learn/${c.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <Card>
                  <span style={{ fontWeight: 600 }}>{c.name}</span>
                  <span
                    style={{
                      fontSize: 13,
                      color: "var(--text-secondary)",
                      marginLeft: 8,
                    }}
                  >
                    {c.questionCount} 题
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {searching && (
        <section style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            题目 · {count}
          </h2>
          <div style={{ display: "grid", gap: 10 }}>
            {results.map((q) => (
              <Card key={q.id}>
                <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--text-secondary)",
                    }}
                  >
                    {QuestionTypeLabel[q.type]}
                  </span>
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.5 }}>
                  {q.content}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
