import { FLIGHT } from "../config";
import type { Bird } from "../types";

/** 半隐式欧拉积分，调用者保证固定 dt。每次拍翼重设速度，不叠加冲量。 */
export function integrate(bird: Bird, dt: number) {
  bird.previousY = bird.y;
  bird.vy = Math.min(FLIGHT.terminal, bird.vy + FLIGHT.gravity * dt);
  bird.y += bird.vy * dt;
  bird.flap = Math.max(0, bird.flap - dt);
  bird.hurt = Math.max(0, bird.hurt - dt);
}
export function flap(bird: Bird) {
  bird.vy = FLIGHT.impulse;
  bird.flap = 0.22;
}
export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
