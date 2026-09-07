import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Question } from "../../shared/types/content.ts";
import { apiClient } from "../lib/api.ts";
import { Badge, Card, Skeleton } from "../components/ui.tsx";

const TYPE_LABEL: Record<string, string> = {
  single_choice: "选择",
  true_false: "判断",
  fill_blank: "填空",
  short_answer: "简答",
};

export function TopicPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!topicId) return;
    setQuestions(null);
    apiClient
      .chapter(topicId)
      .then((ch) => {
        setName(ch.name);
        setQuestions(ch.questions);
      })
      .catch(() => setError(true));
  }, [topicId]);

  if (error) return <p>加载失败。</p>;
  if (!questions) return <Skeleton height={300} />;

  return (
    <div>
      <h1 style={{ fontSize: 20 }}>{name}</h1>
      <p style={{ color: "var(--text-secondary)", marginTop: -8 }}>
        共 {questions.length} 题
      </p>
      <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
        {questions.map((q) => (
          <Card key={q.id}>
            <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <Badge>{TYPE_LABEL[q.type]}</Badge>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                #{q.metadata.number}
              </span>
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.5 }}>{q.content}</div>
          </Card>
        ))}
      </div>
      <div style={{ marginTop: 20 }}>
        <Link
          to={`/practice/${topicId}`}
          style={{ color: "var(--primary)" }}
        >
          进入练习 →
        </Link>
      </div>
    </div>
  );
}
