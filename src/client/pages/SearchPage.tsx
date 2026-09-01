import { useEffect, useState } from "react";
import type { Question } from "../../shared/types/content.ts";
import { apiClient } from "../lib/api.ts";
import { Card, Input } from "../components/ui.tsx";

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Question[]>([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setCount(0);
      return;
    }
    const t = setTimeout(() => {
      apiClient
        .search(query, 20)
        .then((r) => {
          setResults(r.results);
          setCount(r.count);
        })
        .catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div>
      <h1 style={{ fontSize: 20 }}>搜索</h1>
      <Input
        autoFocus
        placeholder="搜索题干或关键词…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {query.trim() && (
        <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
          {count} 条结果
        </p>
      )}
      <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
        {results.map((q) => (
          <Card key={q.id}>
            <div style={{ fontSize: 14, lineHeight: 1.5 }}>{q.content}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
