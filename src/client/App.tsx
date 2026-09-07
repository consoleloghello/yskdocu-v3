import { NavLink, Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage.tsx";
import { TopicPage } from "./pages/TopicPage.tsx";
import { SearchPage } from "./pages/SearchPage.tsx";
import { PracticePage, PracticeSession } from "./pages/PracticePage.tsx";
import { ReviewPage } from "./pages/PlaceholderPages.tsx";

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
  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 16px 40px" }}>
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
      </nav>
      <main style={{ paddingTop: 16 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/learn" element={<HomePage />} />
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
