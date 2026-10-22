import type { Run } from "../types";

/** 门的 scored 标记由主循环设置；本模块只处理一次已确认的穿越事件。 */
export function awardPass(run: Run, precise: boolean) {
  run.score++;
  run.combo = precise ? run.combo + 1 : 0;
  run.maxCombo = Math.max(run.maxCombo, run.combo);
  const bonus = precise && run.combo % 3 === 0 ? 1 : 0;
  run.stars += bonus;
  return bonus;
}
