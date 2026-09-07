/**
 * 基础 UI 组件（Button / Card / Badge / Progress / Input / Skeleton /
 * EmptyState / ErrorState / Toast）
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ButtonHTMLAttributes,
  CSSProperties,
  InputHTMLAttributes,
  ReactNode,
  Ref,
} from "react";
import {
  motionKeyframes,
  motionTransition,
  skeletonDurationMs,
} from "../styles/motion.ts";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const buttonVariants: Record<Variant, CSSProperties> = {
  primary: {
    background: "var(--primary)",
    color: "#fff",
  },
  secondary: {
    background: "var(--primary-weak)",
    color: "var(--primary)",
  },
  ghost: {
    background: "transparent",
    color: "var(--text)",
    border: "1px solid var(--border)",
  },
  danger: {
    background: "var(--danger)",
    color: "#fff",
  },
};

export function Button({
  children,
  variant = "primary",
  block,
  style,
  ...rest
}: {
  children: ReactNode;
  variant?: Variant;
  block?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      style={{
        padding: "10px 20px",
        borderRadius: "var(--radius)",
        border: "none",
        fontSize: 15,
        fontWeight: 500,
        cursor: "pointer",
        width: block ? "100%" : undefined,
        transition: motionTransition.fadeLift,
        ...buttonVariants[variant],
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Card({
  children,
  onClick,
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--surface)",
        borderRadius: "var(--radius)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow)",
        padding: 16,
        cursor: onClick ? "pointer" : undefined,
        transition: motionTransition.lift,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  color = "var(--primary-weak)",
  textColor = "var(--primary)",
}: {
  children: ReactNode;
  color?: string;
  textColor?: string;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 500,
        background: color,
        color: textColor,
      }}
    >
      {children}
    </span>
  );
}

export function Progress({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div
      style={{
        height: 6,
        borderRadius: 999,
        background: "var(--border)",
        overflow: "hidden",
      }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemax={max}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: "var(--primary)",
          borderRadius: 999,
          transition: motionTransition.bar,
        }}
      />
    </div>
  );
}

export function Input(
  { ref, ...props }: InputHTMLAttributes<HTMLInputElement> & {
    ref?: Ref<HTMLInputElement>;
  },
) {
  return (
    <input
      ref={ref}
      style={{
        width: "100%",
        padding: "10px 14px",
        borderRadius: "var(--radius)",
        border: "1px solid var(--border)",
        fontSize: 15,
        background: "var(--surface)",
        color: "var(--text)",
        outline: "none",
      }}
      {...props}
    />
  );
}

export function EmptyState(
  { icon = "📭", title, hint, action }: {
    icon?: string;
    title: string;
    hint?: ReactNode;
    action?: ReactNode;
  },
) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "40px 20px",
        color: "var(--text-secondary)",
      }}
    >
      <div style={{ fontSize: 36 }}>{icon}</div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          marginTop: 8,
          color: "var(--text)",
        }}
      >
        {title}
      </div>
      {hint && <div style={{ fontSize: 13, marginTop: 4 }}>{hint}</div>}
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}

export function ErrorState(
  { message = "加载失败，请刷新重试。", onRetry }: {
    message?: string;
    onRetry?: () => void;
  },
) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ fontSize: 36 }}>⚠️</div>
      <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>{message}</p>
      {onRetry && <Button onClick={onRetry}>重试</Button>}
    </div>
  );
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="status"
      style={{
        position: "fixed",
        left: "50%",
        bottom: 32,
        transform: "translateX(-50%)",
        background: "var(--text)",
        color: "var(--bg)",
        fontSize: 14,
        padding: "10px 18px",
        borderRadius: 999,
        boxShadow: "var(--shadow)",
        zIndex: 100,
        whiteSpace: "nowrap",
      }}
    >
      {message}
    </div>
  );
}

/** 轻量 toast：返回 [当前消息, 弹出消息]，自动按时消失 */
export function useToast(
  timeoutMs = 1600,
): [string | null, (msg: string) => void] {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  const show = useCallback((msg: string) => {
    setMessage(msg);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(null), timeoutMs);
  }, [timeoutMs]);

  return [message, show];
}

export function Skeleton({ height = 16 }: { height?: number }) {
  return (
    <div
      style={{
        height,
        borderRadius: 6,
        background:
          "linear-gradient(90deg, var(--border) 25%, var(--bg) 50%, var(--border) 75%)",
        backgroundSize: "200% 100%",
        animation:
          `${motionKeyframes.skeleton} ${skeletonDurationMs}ms infinite`,
      }}
    />
  );
}
