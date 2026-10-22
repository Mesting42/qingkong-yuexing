/** 游戏世界全部以逻辑像素、秒计量；CSS/DPR 只影响绘制，不参与规则。 */
export type Mode = "classic" | "chaos";
export type Phase =
  "home" | "ready" | "flying" | "paused" | "resuming" | "dying" | "result";
export type ThemeId = "bay" | "forest" | "snow" | "sunset";
export interface Bird {
  y: number;
  previousY: number;
  vy: number;
  flap: number;
  hurt: number;
}
export interface Gate {
  id: number;
  x: number;
  previousX: number;
  center: number;
  previousCenter: number;
  baseCenter: number;
  gap: number;
  width: number;
  speed: number;
  amplitude: number;
  phase: number;
  age: number;
  scored: boolean;
  harmless: boolean;
  ornament: number;
}
export interface Star {
  id: number;
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  taken: boolean;
  attracted: boolean;
  phase: number;
  speed: number;
}
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
}
/** 独立护盾拾取物跟随所属间隙，不参与星星充能或磁铁吸附。 */
export interface ShieldPickup {
  id: number;
  gateId: number;
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  speed: number;
  taken: boolean;
}
export interface Run {
  id: string;
  mode: Mode;
  time: number;
  score: number;
  stars: number;
  picked: number;
  combo: number;
  maxCombo: number;
  shield: boolean;
  invulnerable: number;
  recoveries: number;
  magnet: number;
  magnetUsed: boolean;
  stage: number;
  flapCount: number;
  cause: string;
  settled: boolean;
  newRecord: boolean;
}
export interface Stats {
  totalGates: number;
  totalStars: number;
  bestStars: number;
  magnets: number;
  shields: number;
  chaosBest: number;
  flights: number;
  usedSkins: string[];
}
export interface Settings {
  music: number;
  sfx: number;
  mute: boolean;
  reducedMotion: boolean;
}
export interface Save {
  version: 1;
  best: Record<Mode, number>;
  maxCombo: number;
  balance: number;
  unlocked: string[];
  equipped: string;
  theme: ThemeId;
  claimed: string[];
  tutorial: boolean;
  settings: Settings;
  stats: Stats;
  settledRuns: string[];
}
export interface Skin {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  body: string;
  wing: string;
  dark: string;
  accent: string;
  feature:
    | "swallow"
    | "crest"
    | "scarf"
    | "ribbon"
    | "longtail"
    | "cap"
    | "crown"
    | "goggles"
    | "petal";
  requirement: number;
}
export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  sky: [string, string, string];
  mountains: string;
  middle: string;
  rock: string;
  shadow: string;
  grass: string;
  sun: string;
}
