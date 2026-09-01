import { useEffect, useState } from "react";

type Health = { ok: boolean; name: string; time: string };

export function App() {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>yskdocu v3</h1>
      <p>React + Hono + Deno 骨架已就绪。</p>
      <p>
        API 状态：
        {health === null
          ? "连接中…"
          : health.ok
          ? `✅ 已连接 (${health.name})`
          : "❌ 异常"}
      </p>
    </main>
  );
}
