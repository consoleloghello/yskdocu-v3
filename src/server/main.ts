import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import { api } from "./routes/api.ts";

const app = new Hono();

app.route("/api", api);

// 生产环境：服务构建产物（dist/）；开发时前端走 Vite :5173
app.use("*", serveStatic({ root: "./dist" }));
// SPA fallback
app.get("*", serveStatic({ path: "./dist/index.html" }));

Deno.serve({ port: 8000 }, app.fetch);

console.log("Hono server running at http://localhost:8000");
