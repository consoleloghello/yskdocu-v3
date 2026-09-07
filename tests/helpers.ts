/**
 * 测试辅助：需要 data/generated 产物的测试共用前置检查。
 *
 * data/generated/ 在 .gitignore 中（fresh clone 没有），
 * 缺产物时测试主动跳过，而不是失败。
 * 本地运行前先执行：deno task data:build
 */

export async function generatedAvailable(): Promise<boolean> {
  try {
    await Deno.stat("data/generated/catalog.json");
    await Deno.stat("data/generated/chapters.json");
    await Deno.stat("data/generated/questions.json");
    return true;
  } catch {
    return false;
  }
}

export function skipReason(): string {
  return "跳过：缺少 data/generated/ 产物，先运行 deno task data:build";
}
