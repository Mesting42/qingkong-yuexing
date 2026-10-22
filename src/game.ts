import { difficulty, POWERS, WORLD } from "./config";
import type {
  Bird,
  Gate,
  Mode,
  Particle,
  Phase,
  Run,
  Star,
  ShieldPickup,
} from "./types";
import { Generator } from "./systems/generator";
import { flap, integrate, clamp } from "./systems/physics";
import { crossing, hitsGate, segmentRect } from "./systems/collision";
import {
  collectStar,
  collectShield,
  activateMagnet,
  recover,
} from "./systems/powers";
import { ShieldDrops } from "./systems/shield-drops";
import { awardPass } from "./systems/scoring";
import { Storage } from "./systems/storage";
import type { AudioSystem } from "./systems/audio";
import { MISSIONS } from "./systems/missions";

export interface GameEvents {
  state: () => void;
  notice: (text: string, kind?: string) => void;
}
/** 状态机拥有一局的所有临时对象；UI 只能通过动作接口请求转换，不得修改积分。 */
export class Game {
  phase: Phase = "home";
  bird: Bird = { y: 370, previousY: 370, vy: 0, flap: 0, hurt: 0 };
  run: Run = this.emptyRun("classic");
  gates: Gate[] = [];
  stars: Star[] = [];
  shields: ShieldPickup[] = [];
  particles: Particle[] = [];
  private generator = new Generator();
  private shieldDrops = new ShieldDrops();
  private distance = 272;
  private countdown = 0;
  private announced = new Set<string>();
  private failTime = 0;
  private resumePhase: "ready" | "flying" = "flying";
  constructor(
    public storage: Storage,
    private audio: Pick<AudioSystem, "sound" | "setPaused">,
    private events: GameEvents,
  ) {}
  private emptyRun(mode: Mode): Run {
    return {
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      mode,
      time: 0,
      score: 0,
      stars: 0,
      picked: 0,
      combo: 0,
      maxCombo: 0,
      shield: false,
      invulnerable: 0,
      recoveries: 0,
      magnet: 0,
      magnetUsed: false,
      stage: 0,
      flapCount: 0,
      cause: "",
      settled: false,
      newRecord: false,
    };
  }
  start(mode: Mode) {
    if (this.phase !== "home" && this.phase !== "result") return;
    this.run = this.emptyRun(mode);
    this.bird = { y: 370, previousY: 370, vy: 0, flap: 0, hurt: 0 };
    this.gates = [];
    this.stars = [];
    this.shields = [];
    this.particles = [];
    this.generator = new Generator();
    this.shieldDrops = new ShieldDrops();
    this.distance = 272;
    this.failTime = 0;
    this.announced = new Set(
      MISSIONS.filter((m) => m.value(this.storage.data) >= m.target).map(
        (m) => m.id,
      ),
    );
    this.spawn(590);
    this.phase = "ready";
    this.audio.setPaused(false);
    this.events.state();
  }
  press() {
    if (this.phase === "ready") {
      this.phase = "flying";
      const used = this.storage.data.stats.usedSkins;
      if (!used.includes(this.storage.data.equipped)) {
        used.push(this.storage.data.equipped);
        this.storage.persist();
      }
      this.events.state();
    }
    if (this.phase !== "flying") return;
    flap(this.bird);
    this.run.flapCount++;
    this.audio.sound("flap");
    this.burst(WORLD.playerX - 10, this.bird.y + 8, 4, "#f9f4da");
  }
  pause() {
    if (
      this.phase === "flying" ||
      this.phase === "ready" ||
      this.phase === "resuming"
    ) {
      if (this.phase !== "resuming") this.resumePhase = this.phase;
      this.phase = "paused";
      this.audio.setPaused(true);
      this.events.state();
    }
  }
  resume() {
    if (this.phase !== "paused") return;
    this.phase = this.resumePhase === "ready" ? "ready" : "resuming";
    this.countdown = 1.5;
    this.audio.setPaused(false);
    this.events.state();
  }
  get countdownLabel() {
    return this.countdown > 0.75 ? "准备好" : "继续飞行";
  }
  home() {
    if (
      this.phase !== "home" &&
      this.phase !== "result" &&
      this.run.flapCount > 0
    )
      this.storage.settle(this.run);
    this.phase = "home";
    this.gates = [];
    this.stars = [];
    this.shields = [];
    this.particles = [];
    this.audio.setPaused(document.hidden);
    this.events.state();
  }
  magnet() {
    if (this.phase === "flying" && activateMagnet(this.run)) {
      this.audio.sound("magnet");
      this.events.notice("星光正在向你靠近", "power");
      this.checkMissions();
    }
  }
  private spawn(x: number) {
    const next = this.generator.next(this.run.mode, this.run.score, x);
    this.gates.push(next.gate);
    const shield = this.shieldDrops.next(next.gate, this.run.shield);
    // 稀有道具周围留出辨识空间，避免星星与护盾图案重叠。
    this.stars.push(
      ...next.stars.filter(
        (star) => !shield || Math.abs(star.x - shield.x) > 50,
      ),
    );
    if (shield) this.shields.push(shield);
    this.distance = next.distance;
  }
  private checkMissions() {
    for (const m of MISSIONS)
      if (
        !this.announced.has(m.id) &&
        m.value(this.storage.data, this.run) >= m.target
      ) {
        this.announced.add(m.id);
        this.events.notice(`任务完成 · ${m.title}`, "mission");
        this.audio.sound("mission");
      }
  }
  private burst(x: number, y: number, count: number, color: string) {
    if (this.storage.data.settings.reducedMotion) count = Math.min(3, count);
    for (let i = 0; i < count && this.particles.length < 90; i++) {
      const a = Math.random() * Math.PI * 2,
        s = 12 + Math.random() * 70,
        life = 0.25 + Math.random() * 0.4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life,
        max: life,
        color,
        size: 1 + Math.random() * 2,
      });
    }
  }
  private accident(cause: string, gate?: Gate) {
    if (this.run.invulnerable > 0 || this.phase !== "flying") return;
    this.bird.hurt = 0.7;
    if (this.run.shield) {
      recover(this.bird, this.run, this.gates, gate);
      this.shieldDrops.restartAfterUse();
      this.audio.sound("break");
      this.burst(WORLD.playerX, this.bird.y, 28, "#f8e4a5");
      this.events.notice("护盾保护 · 调整高度，继续飞行", "power");
      this.checkMissions();
      return;
    }
    this.phase = "dying";
    this.failTime = 0.4;
    this.run.cause = cause;
    this.audio.sound("hit");
    this.burst(WORLD.playerX, this.bird.y, 18, "#f7e8d0");
    this.storage.settle(this.run);
    this.events.state();
  }
  /** 只接收固定 dt。暂停/准备/结算不推进任何道具、障碍或计时。 */
  update(dt: number) {
    if (this.phase === "resuming") {
      this.countdown -= dt;
      if (this.countdown <= 0) {
        this.bird.previousY = this.bird.y;
        for (const gate of this.gates) {
          gate.previousX = gate.x;
          gate.previousCenter = gate.center;
        }
        this.phase = "flying";
        this.events.state();
      }
      return;
    }
    if (this.phase === "dying") {
      this.failTime -= dt;
      this.bird.hurt = Math.max(0, this.bird.hurt - dt);
      this.particlesStep(dt);
      if (this.failTime <= 0) {
        this.phase = "result";
        if (this.run.newRecord) this.audio.sound("record");
        this.events.state();
      }
      return;
    }
    if (this.phase !== "flying") return;
    this.run.time += dt;
    this.run.invulnerable = Math.max(0, this.run.invulnerable - dt);
    if (this.run.magnet > 0) {
      this.run.magnet = Math.max(0, this.run.magnet - dt);
      if (!this.run.magnet) this.audio.sound("endMagnet");
    }
    integrate(this.bird, dt);
    for (const gate of this.gates) {
      gate.previousX = gate.x;
      gate.previousCenter = gate.center;
      gate.x -= gate.speed * dt;
      gate.age += dt;
      gate.center =
        gate.baseCenter +
        Math.sin(gate.age * 0.95 + gate.phase) * gate.amplitude;
    }
    const last = this.gates[this.gates.length - 1];
    if (!last || last.x < WORLD.width + 60 - this.distance)
      this.spawn(WORLD.width + 60);
    // 碰撞优先于计分/拾取。同一固定步内只消费一次护盾，剩余事故受无敌期保护。
    if (this.bird.y - WORLD.ry < 0) this.accident("飞出了上方的安全天空");
    else if (this.bird.y + WORLD.ry > WORLD.floor)
      this.accident("飞得太低，触到了地面");
    else {
      const hit = this.gates.find((g) => hitsGate(this.bird, g));
      if (hit) this.accident("碰到了遗迹边缘");
    }
    if (this.phase !== "flying") return;
    if (this.run.invulnerable > 0) {
      this.bird.y = clamp(
        this.bird.y,
        WORLD.ry + 2,
        WORLD.floor - WORLD.ry - 2,
      );
    }
    for (const gate of this.gates) {
      const cross = crossing(this.bird, gate);
      if (cross) {
        gate.scored = true;
        const bonus = awardPass(this.run, cross.precise);
        this.audio.sound(cross.precise ? "perfect" : "pass");
        if (cross.precise) {
          this.events.notice(
            this.run.combo >= 3
              ? `精准 ${this.run.combo} 连击${bonus ? " · 星星 +1" : ""}`
              : "精准穿越",
            "perfect",
          );
          this.burst(WORLD.playerX, this.bird.y, 8, "#f2d184");
          if (bonus) this.audio.sound("combo", this.run.combo);
        }
        const stage = difficulty(this.run.mode, this.run.score);
        if (stage.stage !== this.run.stage) {
          this.run.stage = stage.stage;
          this.events.notice(`风向渐进 · ${stage.name}`, "stage");
        }
        this.checkMissions();
      }
    }
    for (const star of this.stars) {
      if (star.taken) continue;
      star.previousX = star.x;
      star.previousY = star.y;
      star.x -= star.speed * dt;
      const dx = WORLD.playerX - star.x,
        dy = this.bird.y - star.y,
        d = Math.hypot(dx, dy);
      if (this.run.magnet > 0 && d < POWERS.magnetRadius) {
        star.attracted = true;
        const amount = Math.min(1, dt * (5 + 220 / Math.max(d, 20)));
        star.x += dx * amount;
        star.y += dy * amount;
      }
      const picked = segmentRect(
        star.previousX,
        star.previousY,
        star.x,
        star.y,
        WORLD.playerX - 24,
        this.bird.y - 22,
        WORLD.playerX + 24,
        this.bird.y + 22,
      );
      if (picked) {
        star.taken = true;
        collectStar(this.run);
        this.audio.sound("star");
        this.burst(star.x, star.y, 6, "#f7d98c");
        if (this.run.picked === POWERS.magnetEvery)
          this.events.notice("磁铁就绪 · 按 E 或点击磁铁", "power");
        this.checkMissions();
      }
    }
    for (const shield of this.shields) {
      if (shield.taken) continue;
      shield.previousX = shield.x;
      shield.previousY = shield.y;
      const gate = this.gates.find((g) => g.id === shield.gateId);
      shield.x -= shield.speed * dt;
      if (gate) shield.y = gate.center;
      // 在鸟的相对坐标中扫掠拾取；护盾完全绕过磁铁和星星计数逻辑。
      if (
        segmentRect(
          shield.previousX - WORLD.playerX,
          shield.previousY - this.bird.previousY,
          shield.x - WORLD.playerX,
          shield.y - this.bird.y,
          -27,
          -28,
          27,
          28,
        )
      ) {
        shield.taken = true;
        if (collectShield(this.run)) {
          this.audio.sound("charge");
          this.burst(shield.x, shield.y, 12, "#f8e4a5");
          this.events.notice("拾取护盾 · 可抵消一次事故", "power");
        } else this.events.notice("护盾已持有 · 无法叠加", "power");
      }
    }
    this.gates = this.gates.filter((g) => g.x + g.width > -40);
    this.stars = this.stars.filter((s) => !s.taken && s.x > -40);
    this.shields = this.shields.filter((s) => !s.taken && s.x > -40);
    this.particlesStep(dt);
  }
  private particlesStep(dt: number) {
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 30 * dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }
  /** 只读遥测供验收脚本观察真实运行；返回副本，不能借此写分数或调用结算。 */
  snapshot() {
    return {
      phase: this.phase,
      bird: { ...this.bird },
      run: { ...this.run },
      gates: this.gates.map((g) => ({ ...g })),
      shields: this.shields.map((s) => ({ ...s })),
      objects: {
        gates: this.gates.length,
        stars: this.stars.length,
        shields: this.shields.length,
        particles: this.particles.length,
      },
    };
  }
}
