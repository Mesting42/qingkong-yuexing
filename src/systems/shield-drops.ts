import { POWERS } from "../config";
import type { Gate, ShieldPickup } from "../types";

/**
 * 独立护盾生成器，使用障碍组数而非分数或拾星量计数。
 * 每次出现或消耗后重新抽取 20～30 组间隔；已持有时冻结排期，
 * 不囤积延迟发放的护盾。新一局创建新实例，暂停不会改变排期。
 */
export class ShieldDrops {
  private remaining: number;
  constructor(private random: () => number = Math.random) {
    this.remaining = this.interval();
  }
  private interval() {
    return (
      POWERS.shieldGateMin +
      Math.floor(
        this.random() * (POWERS.shieldGateMax - POWERS.shieldGateMin + 1),
      )
    );
  }
  restartAfterUse() {
    this.remaining = this.interval();
  }
  next(gate: Gate, holding: boolean): ShieldPickup | null {
    if (holding || --this.remaining > 0) return null;
    this.remaining = this.interval();
    const x = gate.x + gate.width / 2;
    return {
      id: gate.id,
      gateId: gate.id,
      x,
      previousX: x,
      y: gate.center,
      previousY: gate.center,
      speed: gate.speed,
      taken: false,
    };
  }
}
