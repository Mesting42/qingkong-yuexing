import type { Run, Save } from "../types";

export interface Mission {
  id: string;
  title: string;
  description: string;
  target: number;
  reward: number;
  value: (s: Save, r?: Run) => number;
}
const live = (r?: Run) => (r && !r.settled ? r : undefined);
export const MISSIONS: Mission[] = [
  {
    id: "first",
    title: "第一阵顺风",
    description: "单局通过 3 组障碍",
    target: 3,
    reward: 5,
    value: (s, r) => Math.max(s.best.classic, s.best.chaos, r?.score ?? 0),
  },
  {
    id: "ten",
    title: "越过云的边缘",
    description: "单局通过 10 组障碍",
    target: 10,
    reward: 10,
    value: (s, r) => Math.max(s.best.classic, s.best.chaos, r?.score ?? 0),
  },
  {
    id: "twenty",
    title: "群岛来客",
    description: "单局通过 20 组障碍",
    target: 20,
    reward: 15,
    value: (s, r) => Math.max(s.best.classic, s.best.chaos, r?.score ?? 0),
  },
  {
    id: "fifty",
    title: "熟悉每一缕风",
    description: "累计通过 50 组障碍",
    target: 50,
    reward: 15,
    value: (s, r) => s.stats.totalGates + (live(r)?.score ?? 0),
  },
  {
    id: "hundred",
    title: "远航的里程",
    description: "累计通过 150 组障碍",
    target: 150,
    reward: 25,
    value: (s, r) => s.stats.totalGates + (live(r)?.score ?? 0),
  },
  {
    id: "combo3",
    title: "恰好在风中央",
    description: "连续精准穿越 3 次",
    target: 3,
    reward: 8,
    value: (s, r) => Math.max(s.maxCombo, r?.maxCombo ?? 0),
  },
  {
    id: "combo6",
    title: "一条漂亮的航线",
    description: "连续精准穿越 6 次",
    target: 6,
    reward: 15,
    value: (s, r) => Math.max(s.maxCombo, r?.maxCombo ?? 0),
  },
  {
    id: "stars8",
    title: "收集一小袋星光",
    description: "单局拾取 8 颗场景星星",
    target: 8,
    reward: 8,
    value: (s, r) => Math.max(s.stats.bestStars, r?.picked ?? 0),
  },
  {
    id: "stars15",
    title: "满载星光",
    description: "单局拾取 15 颗场景星星",
    target: 15,
    reward: 12,
    value: (s, r) => Math.max(s.stats.bestStars, r?.picked ?? 0),
  },
  {
    id: "stars60",
    title: "把天空装进口袋",
    description: "累计拾取 60 颗场景星星",
    target: 60,
    reward: 18,
    value: (s, r) => s.stats.totalStars + (live(r)?.picked ?? 0),
  },
  {
    id: "magnet",
    title: "星光向你而来",
    description: "激活一次磁铁",
    target: 1,
    reward: 10,
    value: (s, r) => s.stats.magnets + Number(live(r)?.magnetUsed ?? false),
  },
  {
    id: "shield",
    title: "风的拥抱",
    description: "触发一次护盾保护",
    target: 1,
    reward: 8,
    value: (s, r) => s.stats.shields + (live(r)?.recoveries ?? 0),
  },
  {
    id: "chaos",
    title: "在乱流中起舞",
    description: "混乱模式单局通过 8 组障碍",
    target: 8,
    reward: 12,
    value: (s, r) =>
      Math.max(s.stats.chaosBest, r?.mode === "chaos" ? r.score : 0),
  },
  {
    id: "closet",
    title: "旅途的新装",
    description: "解锁 3 种外观（含初晴）",
    target: 3,
    reward: 15,
    value: (s) => s.unlocked.length,
  },
  {
    id: "wear",
    title: "不同羽翼，同一片天",
    description: "使用 3 种不同外观开始飞行",
    target: 3,
    reward: 15,
    value: (s) => s.stats.usedSkins.length,
  },
  {
    id: "flights",
    title: "总有下一阵好风",
    description: "完成 10 次飞行",
    target: 10,
    reward: 12,
    value: (s) => s.stats.flights,
  },
];
export function claimMission(save: Save, id: string): boolean {
  const task = MISSIONS.find((t) => t.id === id);
  if (!task || save.claimed.includes(id) || task.value(save) < task.target)
    return false;
  save.claimed.push(id);
  save.balance += task.reward;
  return true;
}
