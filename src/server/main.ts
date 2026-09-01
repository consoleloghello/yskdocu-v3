import { Hono } from "hono";

const app = new Hono();

app.get(
  "/api/health",
  (c) =>
    c.json({ ok: true, name: "yskdocu-v3", time: new Date().toISOString() }),
);

Deno.serve({ port: 8000 }, app.fetch);

console.log("Hono server running at http://localhost:8000");
