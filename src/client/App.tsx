import { useEffect, useState } from "react";
import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import { HomePage } from "./pages/HomePage.tsx";
import { LearnPage } from "./pages/LearnPage.tsx";
import { TopicPage } from "./pages/TopicPage.tsx";
import { SearchPage } from "./pages/SearchPage.tsx";
import { PracticePage, PracticeSession } from "./pages/PracticePage.tsx";
import { ReviewPage } from "./pages/ReviewPage.tsx";
import { defaultStorage } from "./lib/learningState.ts";
import {
  applyTheme,
  loadTheme,
  saveTheme,
  toggleThemeValue,
} from "./lib/theme.ts";

const navStyle = {
  display: "flex",
  gap: 4,
  padding: "10px 16px",
  borderBottom: "1px solid var(--border)",
  background: "var(--surface)",
  position: "sticky" as const,
  top: 0,
};

const linkStyle = (active: boolean) => ({
  padding: "6px 12px",
  borderRadius: 8,
  textDecoration: "none",
  fontSize: 14,
  color: active ? "var(--primary)" : "var(--text-secondary)",
  background: active ? "var(--primary-weak)" : "transparent",
  fontWeight: active ? 600 : 400,
});

export function App() {
  const [theme, setTheme] = useState(loadTheme);
  const { pathname } = useLocation();

  useEffect(() => {
    applyTheme(theme);
    saveTheme(defaultStorage(), theme);
  }, [theme]);

  return (
    <div
      style={{
        maxWidth: 640,
        margin: "0 auto",
        padding: "0 16px calc(40px + env(safe-area-inset-bottom))",
      }}
    >
      <nav style={navStyle}>
        {[
          ["/", "首页"],
          ["/learn", "学习"],
          ["/practice", "练习"],
          ["/review", "复习"],
          ["/search", "搜索"],
        ].map(([to, label]) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            style={({ isActive }) => linkStyle(isActive)}
          >
            {label}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => setTheme(toggleThemeValue(theme))}
          aria-label={theme === "light" ? "切换深色模式" : "切换浅色模式"}
          title={theme === "light" ? "深色模式" : "浅色模式"}
          style={{
            marginLeft: "auto",
            border: "1px solid var(--border)",
            background: "transparent",
            borderRadius: 8,
            fontSize: 15,
            padding: "4px 10px",
            cursor: "pointer",
          }}
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>
      </nav>
      <main key={pathname} className="page-enter" style={{ paddingTop: 16 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/learn/:topicId" element={<TopicPage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/practice/:chapterId" element={<PracticeSession />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </main>
    </div>
  );
}
