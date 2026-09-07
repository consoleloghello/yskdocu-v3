/**
 * Motion 设计 token —— 时长 / 缓动 / 常用过渡组合。
 *
 * 与 global.css 的 `--transition: 180ms ease` 对齐（= fast + standard），
 * Day 3 动画打磨（页面 / 反馈 / 切题过渡）统一从这里取，不要散写魔法数字。
 * keyframes 本体仍定义在 global.css，这里只收敛名称与周期。
 */

export const motionDuration = {
  /** 悬停 / 涟漪等即时反馈 */
  instant: 100,
  /** 默认交互反馈（按钮 / 卡片位移） */
  fast: 180,
  /** 页面元素过渡 */
  base: 240,
  /** 大面积 / 页面级过渡 */
  slow: 360,
} as const;

export const motionEasing = {
  standard: "ease",
  /** 进入类动画：先快后稳 */
  emphasized: "cubic-bezier(0.2, 0, 0, 1)",
} as const;

/** 生成 "opacity 180ms ease" 形式的 transition 字符串 */
export function transition(
  property: string,
  durationMs: number = motionDuration.fast,
  easing: string = motionEasing.standard,
): string {
  return `${property} ${durationMs}ms ${easing}`;
}

/** 常用过渡组合 */
export const motionTransition = {
  fade: transition("opacity"),
  lift: transition("transform"),
  fadeLift: [transition("opacity"), transition("transform")].join(", "),
  bar: transition("width"),
} as const;

/** keyframes 名称（定义见 global.css） */
export const motionKeyframes = {
  skeleton: "skeleton",
} as const;

/** Skeleton 呼吸动画周期 */
export const skeletonDurationMs = 1200;
