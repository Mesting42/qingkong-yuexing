import { POWERS, WORLD, FLIGHT } from "../config";
import type { Bird, Gate, Run } from "../types";
import { clamp } from "./physics";

/** 场景星星只增加收益和磁铁进度，任何星星数量都不能自动获得护盾。 */
export function collectStar(run: Run) {
  run.stars++;
  run.picked++;
}
/** 容量严格为一层。重复拾取不存储次数，也不刷新事故后的恢复保护。 */
export function collectShield(run: Run): boolean {
  if (run.shield) return false;
  run.shield = true;
  return true;
}
export function activateMagnet(run: Run) {
  if (run.magnetUsed || run.picked < POWERS.magnetEvery) return false;
  run.magnetUsed = true;
  run.magnet = POWERS.magnetSeconds;
  return true;
}
export function recover(bird: Bird, run: Run, gates: Gate[], hit?: Gate) {
  run.shield = false;
  run.invulnerable = POWERS.recoverySeconds;
  run.recoveries++;
  run.combo = 0;
  bird.y = clamp(hit?.center ?? bird.y, 170, WORLD.floor - 170);
  bird.previousY = bird.y;
  bird.vy = FLIGHT.impulse * 0.35;
  bird.hurt = 0.45;
  // 不移动已可见的障碍。将恢复时间内可能接触的整组遗迹淡化且禁用伤害，
  // 玩家看到的保护范围与实际规则一致；受保护的门可以基础计分，但不能精准连击。
  for (const gate of gates)
    if (
      gate.x <
      WORLD.playerX + gate.speed * POWERS.recoverySeconds + gate.width
    )
      gate.harmless = true;
}
