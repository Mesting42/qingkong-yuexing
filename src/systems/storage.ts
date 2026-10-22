import type { Save, Run } from "../types";
import { SKINS, THEMES } from "../config";

export const SAVE_KEY = "clearwing.journey.save.v1";
const integer = (v: unknown, fallback = 0, max = 10_000_000) =>
  typeof v === "number" && Number.isFinite(v)
    ? Math.max(0, Math.min(max, Math.floor(v)))
    : fallback;
const strings = (v: unknown) =>
  Array.isArray(v)
    ? [...new Set(v.filter((s): s is string => typeof s === "string"))].slice(
        0,
        100,
      )
    : [];
export function freshSave(): Save {
  return {
    version: 1,
    best: { classic: 0, chaos: 0 },
    maxCombo: 0,
    balance: 0,
    unlocked: ["dawn"],
    equipped: "dawn",
    theme: "bay",
    claimed: [],
    tutorial: false,
    settings: {
      music: 0.4,
      sfx: 0.65,
      mute: false,
      reducedMotion:
        typeof matchMedia === "function" &&
        matchMedia("(prefers-reduced-motion: reduce)").matches,
    },
    stats: {
      totalGates: 0,
      totalStars: 0,
      bestStars: 0,
      magnets: 0,
      shields: 0,
      chaosBest: 0,
      flights: 0,
      usedSkins: [],
    },
    settledRuns: [],
  };
}
/** v1 是首发格式。未知未来版本不强行降级；各字段分别校验，拒绝 NaN/负数/任意外观 ID。 */
export function decodeSave(raw: string | null): Save {
  const base = freshSave();
  if (!raw) return base;
  try {
    const p = JSON.parse(raw);
    if (!p || p.version !== 1) return base;
    base.best.classic = integer(p.best?.classic);
    base.best.chaos = integer(p.best?.chaos);
    base.balance = integer(p.balance);
    base.maxCombo = integer(p.maxCombo);
    base.unlocked = [
      ...new Set([
        "dawn",
        ...strings(p.unlocked).filter((id) => SKINS.some((s) => s.id === id)),
      ]),
    ];
    base.equipped = base.unlocked.includes(p.equipped) ? p.equipped : "dawn";
    base.theme = THEMES.some((t) => t.id === p.theme) ? p.theme : "bay";
    base.claimed = strings(p.claimed);
    base.tutorial = p.tutorial === true;
    base.settledRuns = strings(p.settledRuns).slice(-32);
    for (const key of [
      "totalGates",
      "totalStars",
      "bestStars",
      "magnets",
      "shields",
      "chaosBest",
      "flights",
    ] as const)
      base.stats[key] = integer(p.stats?.[key]);
    base.stats.usedSkins = strings(p.stats?.usedSkins).filter((id) =>
      SKINS.some((s) => s.id === id),
    );
    for (const key of ["music", "sfx"] as const) {
      const v = p.settings?.[key];
      if (typeof v === "number" && Number.isFinite(v))
        base.settings[key] = Math.max(0, Math.min(1, v));
    }
    base.settings.mute = p.settings?.mute === true;
    base.settings.reducedMotion = p.settings?.reducedMotion === true;
    return base;
  } catch {
    return base;
  }
}
export class Storage {
  data: Save;
  available = true;
  constructor() {
    try {
      this.data = decodeSave(localStorage.getItem(SAVE_KEY));
    } catch {
      this.data = freshSave();
      this.available = false;
    }
  }
  persist() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
      this.available = true;
    } catch {
      this.available = false;
    }
  }
  reset() {
    this.data = freshSave();
    this.persist();
  }
  /** 所有局内货币和累计任务在同一个持久化事务中结算，run ID 与 settled 双重防重。 */
  settle(run: Run) {
    if (run.settled || this.data.settledRuns.includes(run.id)) return false;
    run.newRecord = run.score > this.data.best[run.mode];
    this.data.best[run.mode] = Math.max(this.data.best[run.mode], run.score);
    this.data.maxCombo = Math.max(this.data.maxCombo, run.maxCombo);
    this.data.balance += run.stars;
    const s = this.data.stats;
    s.totalGates += run.score;
    s.totalStars += run.picked;
    s.bestStars = Math.max(s.bestStars, run.picked);
    s.magnets += Number(run.magnetUsed);
    s.shields += run.recoveries;
    s.flights++;
    if (run.mode === "chaos") s.chaosBest = Math.max(s.chaosBest, run.score);
    run.settled = true;
    this.data.settledRuns.push(run.id);
    this.data.settledRuns = this.data.settledRuns.slice(-32);
    this.persist();
    return true;
  }
}
