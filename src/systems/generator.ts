import { difficulty, FLIGHT, WORLD } from "../config";
import type { Gate, Mode, Star } from "../types";
import { clamp } from "./physics";

/** 轨迹搜索用于新障碍的保守筛查。格点按 y/速度去重，不为每个候选保留整段轨迹。 */
export function canTraverse(
  from: number,
  to: number,
  seconds: number,
  gap: number,
  amplitude = 0,
): boolean {
  const dt = 1 / 30,
    steps = Math.ceil(seconds / dt),
    clearance = gap / 2 - WORLD.ry - amplitude - 12;
  let states = [{ y: from, v: 0 }];
  for (let i = 0; i < steps; i++) {
    const seen = new Set<string>(),
      next: { y: number; v: number }[] = [];
    const t = (i + 1) / steps,
      ideal = from + (to - from) * (t * t * (3 - 2 * t));
    for (const state of states)
      for (const press of [false, true]) {
        const v = Math.min(
          FLIGHT.terminal,
          (press ? FLIGHT.impulse : state.v) + FLIGHT.gravity * dt,
        );
        const y = state.y + v * dt;
        if (y < 70 || y > WORLD.floor - 50) continue;
        // 前一门的离开阶段和后一门的进入阶段，均须留出角色本体的空间。
        if (
          (t < 0.16 && Math.abs(y - from) > clearance) ||
          (t > 0.8 && Math.abs(y - to) > clearance)
        )
          continue;
        const key = `${Math.round(y / 8)}:${Math.round(v / 36)}`;
        if (!seen.has(key)) {
          seen.add(key);
          next.push({ y, v });
        }
      }
    if (!next.length) return false;
    next.sort((a, b) => Math.abs(a.y - ideal) - Math.abs(b.y - ideal));
    states = next.slice(0, 140);
  }
  return states.some((s) => Math.abs(s.y - to) < clearance);
}

export class Generator {
  private id = 0;
  private lastCenter = 370;
  private rhythm = 0;
  constructor(private random: () => number = Math.random) {}
  next(
    mode: Mode,
    score: number,
    x: number,
  ): { gate: Gate; stars: Star[]; distance: number } {
    const cfg = difficulty(mode, score),
      chaos = mode === "chaos";
    this.rhythm += 0.8 + this.random() * 0.5;
    const distance = cfg.distance + (this.random() - 0.5) * (chaos ? 42 : 24);
    const amplitude = chaos && score >= 3 ? 12 + this.random() * 9 : 0;
    const maxDelta = Math.min(92, (distance / cfg.speed - 0.5) * 72);
    const delta = chaos
      ? Math.sin(this.rhythm) * maxDelta
      : (this.random() * 2 - 1) * maxDelta;
    let center = clamp(this.lastCenter + delta, 205, 550);
    if (
      !canTraverse(
        this.lastCenter,
        center,
        distance / cfg.speed,
        cfg.gap,
        amplitude,
      )
    )
      center = this.lastCenter;
    const id = ++this.id;
    const gate: Gate = {
      id,
      x,
      previousX: x,
      center,
      previousCenter: center,
      baseCenter: center,
      gap: cfg.gap,
      width: 62,
      speed: cfg.speed,
      amplitude,
      phase: this.random() * Math.PI * 2,
      age: 0,
      scored: false,
      harmless: false,
      ornament: this.random(),
    };
    // 星星在路径内部，绝不占用安全间隙；第一颗略在门前，引导玩家准备高度。
    const stars: Star[] = [-26, 22, 70].map((offset, i) => ({
      id: id * 10 + i,
      x: x + offset,
      previousX: x + offset,
      y: center + (i - 1) * 11,
      previousY: center + (i - 1) * 11,
      taken: false,
      attracted: false,
      phase: this.random() * 6,
      speed: cfg.speed,
    }));
    this.lastCenter = center;
    return { gate, stars, distance };
  }
}
