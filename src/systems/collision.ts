import { WORLD } from "../config";
import type { Bird, Gate } from "../types";

/** 将移动障碍转换到上一帧的相对坐标，做线段/扩张矩形检测，防止高速跨过薄障碍。 */
export function segmentRect(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  left: number,
  top: number,
  right: number,
  bottom: number,
): boolean {
  let low = 0,
    high = 1;
  for (const [start, delta, min, max] of [
    [x0, x1 - x0, left, right],
    [y0, y1 - y0, top, bottom],
  ]) {
    if (Math.abs(delta) < 1e-9) {
      if (start < min || start > max) return false;
    } else {
      let a = (min - start) / delta,
        b = (max - start) / delta;
      if (a > b) [a, b] = [b, a];
      low = Math.max(low, a);
      high = Math.min(high, b);
      if (low > high) return false;
    }
  }
  return true;
}
export function hitsGate(bird: Bird, gate: Gate): boolean {
  if (gate.harmless) return false;
  const x0 = WORLD.playerX - gate.previousX,
    x1 = WORLD.playerX - gate.x;
  const y0 = bird.previousY - gate.previousCenter,
    y1 = bird.y - gate.center;
  const left = -WORLD.rx,
    right = gate.width + WORLD.rx;
  return (
    segmentRect(x0, y0, x1, y1, left, -1200, right, -gate.gap / 2 + WORLD.ry) ||
    segmentRect(x0, y0, x1, y1, left, gate.gap / 2 - WORLD.ry, right, 1200)
  );
}

/** 通过门的中心平面时插值，使用移动间隙在该确切时刻的位置进行精准判定。 */
export function crossing(
  bird: Bird,
  gate: Gate,
): { precise: boolean; distance: number } | null {
  if (gate.scored) return null;
  const before = gate.previousX + gate.width / 2 - WORLD.playerX,
    after = gate.x + gate.width / 2 - WORLD.playerX;
  if (before > 0 && after <= 0) {
    const t = before / (before - after);
    const y = bird.previousY + (bird.y - bird.previousY) * t;
    const center =
      gate.previousCenter + (gate.center - gate.previousCenter) * t;
    const distance = Math.abs(y - center);
    return { precise: !gate.harmless && distance <= 30, distance };
  }
  return null;
}
