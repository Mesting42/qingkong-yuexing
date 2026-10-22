import type { Settings } from "../types";

export type Sound =
  | "flap"
  | "pass"
  | "perfect"
  | "combo"
  | "star"
  | "charge"
  | "break"
  | "magnet"
  | "endMagnet"
  | "hit"
  | "record"
  | "mission"
  | "menu";
/** 原创五声音阶音乐与短音色。共用 AudioContext/总线，所有短音源定时 stop，限制复音数。 */
export class AudioSystem {
  private ctx?: AudioContext;
  private music?: GainNode;
  private effects?: GainNode;
  private active = new Set<OscillatorNode>();
  private nextNote = 0;
  private beat = 0;
  private enabled = true;
  constructor(private settings: () => Settings) {}
  unlock() {
    try {
      if (!this.ctx) {
        this.ctx = new AudioContext();
        this.music = this.ctx.createGain();
        this.effects = this.ctx.createGain();
        this.music.connect(this.ctx.destination);
        this.effects.connect(this.ctx.destination);
        this.nextNote = this.ctx.currentTime;
      }
      if (this.ctx.state === "suspended" && this.enabled)
        void this.ctx.resume().catch(() => {});
      this.updateVolumes();
    } catch {
      /* 音频不可用不阻断飞行。 */
    }
  }
  updateVolumes() {
    if (!this.ctx || !this.music || !this.effects) return;
    const s = this.settings(),
      t = this.ctx.currentTime;
    this.music.gain.setTargetAtTime(s.mute ? 0 : s.music * 0.15, t, 0.03);
    this.effects.gain.setTargetAtTime(s.mute ? 0 : s.sfx * 0.21, t, 0.015);
  }
  setPaused(paused: boolean) {
    this.enabled = !paused;
    if (!this.ctx) return;
    if (paused) {
      for (const node of this.active) {
        try {
          node.stop();
        } catch {}
      }
      this.active.clear();
      void this.ctx.suspend().catch(() => {});
    } else {
      this.nextNote = this.ctx.currentTime + 0.05;
      void this.ctx.resume().catch(() => {});
    }
  }
  private tone(
    frequency: number,
    time: number,
    duration: number,
    music = false,
    type: OscillatorType = "sine",
    volume = 1,
    slide?: number,
  ) {
    const ctx = this.ctx,
      bus = music ? this.music : this.effects;
    if (!ctx || !bus || this.active.size >= 24) return;
    const osc = ctx.createOscillator(),
      gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, time);
    if (slide)
      osc.frequency.exponentialRampToValueAtTime(slide, time + duration);
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.002, volume),
      time + 0.008,
    );
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    osc.connect(gain);
    gain.connect(bus);
    this.active.add(osc);
    osc.onended = () => {
      this.active.delete(osc);
      osc.disconnect();
      gain.disconnect();
    };
    osc.start(time);
    osc.stop(time + duration + 0.02);
  }
  sound(kind: Sound, level = 0) {
    if (!this.ctx || !this.enabled || this.settings().mute) return;
    const t = this.ctx.currentTime;
    const tunes: Record<Sound, number[]> = {
      flap: [390],
      pass: [659, 784],
      perfect: [784, 988, 1175],
      combo: [784, 988, 1175, 1568],
      star: [1318, 1760],
      charge: [523, 659, 784, 1047],
      break: [370, 250, 160],
      magnet: [330, 495, 660, 990],
      endMagnet: [660, 440],
      hit: [150, 75],
      record: [659, 784, 988, 1318, 1568],
      mission: [784, 1047, 1318],
      menu: [740],
    };
    tunes[kind].forEach((f, i) =>
      this.tone(
        f * (kind === "combo" ? 1 + Math.min(level, 12) * 0.015 : 1),
        t + i * 0.055,
        kind === "flap" ? 0.065 : 0.18,
        false,
        kind === "hit" ? "triangle" : "sine",
        kind === "flap" ? 0.28 : 0.5,
        kind === "flap" ? 200 : undefined,
      ),
    );
  }
  tick() {
    if (!this.ctx || !this.enabled || this.ctx.state !== "running") return;
    const melody = [
      0, 4, 7, 9, 7, 4, 2, 4, 7, 12, 9, 7, 4, 2, 0, -3, 0, 4, 9, 12, 14, 12, 9,
      7, 4, 7, 2, 4, 0, -3, -5, -3,
    ];
    // 提前 100ms 调度，避免把浏览器帧抖动带入节拍；暂停会销毁已排队短音。
    while (this.nextNote < this.ctx.currentTime + 0.1) {
      const n = melody[this.beat % melody.length],
        f = 261.626 * 2 ** (n / 12);
      this.tone(
        f,
        Math.max(this.nextNote, this.ctx.currentTime),
        0.68,
        true,
        "sine",
        0.45,
      );
      if (this.beat % 4 === 0)
        this.tone(
          130.813 * 2 ** ([0, -3, -5, -3][Math.floor(this.beat / 8) % 4] / 12),
          Math.max(this.nextNote, this.ctx.currentTime),
          1.4,
          true,
          "triangle",
          0.22,
        );
      this.nextNote += 0.38;
      this.beat++;
    }
  }
}
