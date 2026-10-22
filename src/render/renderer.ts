import { SKINS, THEMES, WORLD } from "../config";
import type {
  Bird,
  Gate,
  Particle,
  Run,
  Save,
  Star,
  Phase,
  ShieldPickup,
} from "../types";
import {
  drawBird,
  loadPaintings,
  pillar,
  scene,
  starShape,
  shieldShape,
} from "./art";
import { clamp } from "../systems/physics";

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private backdrop: CanvasRenderingContext2D;
  private bw = 0;
  private bh = 0;
  constructor(
    private canvas: HTMLCanvasElement,
    private background: HTMLCanvasElement,
  ) {
    this.ctx = canvas.getContext("2d")!;
    this.backdrop = background.getContext("2d")!;
    loadPaintings();
    this.resize();
  }
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    this.canvas.width = Math.round(WORLD.width * dpr);
    this.canvas.height = Math.round(WORLD.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.bw = window.innerWidth;
    this.bh = window.innerHeight;
    this.background.width = Math.round(this.bw * dpr);
    this.background.height = Math.round(this.bh * dpr);
    this.backdrop.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  draw(
    save: Save,
    phase: Phase,
    bird: Bird,
    run: Run,
    gates: Gate[],
    stars: Star[],
    shields: ShieldPickup[],
    particles: Particle[],
    time: number,
    alpha: number,
  ) {
    const theme = THEMES.find((t) => t.id === save.theme)!,
      skin = SKINS.find((s) => s.id === save.equipped)!;
    const active = phase !== "home";
    scene(
      this.backdrop,
      this.bw,
      this.bh,
      theme,
      time,
      save.settings.reducedMotion,
    );
    if (!active) {
      const mobile = this.bw < 760 || (this.bw < this.bh && this.bw <= 1024),
        short = mobile && this.bh < 690;
      // 568px 短屏的副标题与模式区之间仅剩约 50px，装饰鸟的整个拍翼周期
      // 都须留在这条安全带中。正式飞行的角色比例完全不受这里影响。
      const scale = short
        ? this.bh < 610
          ? 0.8
          : 1.2
        : mobile
          ? this.bw < 600
            ? 2.4
            : 3.5
          : 3.8;
      const x = short
          ? this.bw * 0.72
          : mobile
            ? this.bw * 0.55
            : this.bw * 0.7,
        y = short ? this.bh * 0.325 : mobile ? this.bh * 0.42 : this.bh * 0.46;
      drawBird(
        this.backdrop,
        x,
        y + (short ? 0 : Math.sin(time * 1.5) * 9),
        scale,
        -0.1,
        Math.sin(time * 5) * 0.7,
        skin,
      );
      for (let i = 0; i < 3; i++)
        starShape(
          this.backdrop,
          x + 90 + i * 32,
          y - 35 + Math.sin(time * 2 + i) * 6,
          8 - i,
          Math.sin(time + i) * 0.12,
        );
      return;
    }
    const c = this.ctx;
    scene(
      c,
      WORLD.width,
      WORLD.height,
      theme,
      run.time,
      save.settings.reducedMotion,
    );
    for (const gate of gates) {
      const x = gate.previousX + (gate.x - gate.previousX) * alpha,
        center =
          gate.previousCenter + (gate.center - gate.previousCenter) * alpha;
      c.save();
      if (gate.harmless) c.globalAlpha = 0.34;
      pillar(
        c,
        x,
        center - gate.gap / 2,
        gate.width,
        true,
        theme,
        gate.ornament,
      );
      pillar(
        c,
        x,
        center + gate.gap / 2,
        gate.width,
        false,
        theme,
        gate.ornament,
      );
      if (gate.amplitude) {
        c.fillStyle = "#fff9dfb0";
        for (const yy of [
          center - gate.gap / 2 - 18,
          center + gate.gap / 2 + 18,
        ]) {
          c.beginPath();
          c.moveTo(x + 25, yy - 4);
          c.lineTo(x + 31, yy - 9);
          c.lineTo(x + 37, yy - 4);
          c.lineTo(x + 31, yy - 6);
          c.fill();
        }
      }
      c.restore();
    }
    for (const star of stars)
      if (!star.taken) {
        const y = star.previousY + (star.y - star.previousY) * alpha,
          x = star.previousX + (star.x - star.previousX) * alpha;
        starShape(
          c,
          x,
          y,
          9 + Math.sin(run.time * 3 + star.phase) * 0.6,
          Math.sin(run.time + star.phase) * 0.15,
        );
      }
    for (const shield of shields)
      if (!shield.taken) {
        shieldShape(
          c,
          shield.previousX + (shield.x - shield.previousX) * alpha,
          shield.previousY + (shield.y - shield.previousY) * alpha,
          run.time,
        );
      }
    c.fillStyle = theme.grass + "a0";
    c.fillRect(0, WORLD.floor, WORLD.width, 20);
    c.fillStyle = theme.sky[2];
    c.fillRect(0, WORLD.floor + 4, WORLD.width, 20);
    const y = bird.previousY + (bird.y - bird.previousY) * alpha;
    const wing =
      bird.flap > 0
        ? -Math.sin((bird.flap / 0.22) * Math.PI) * 0.9
        : 0.22 + Math.sin(run.time * 9) * 0.13;
    const angle =
      phase === "dying"
        ? clamp(bird.vy / 500, -0.4, 1.3)
        : clamp(bird.vy / 650, -0.4, 0.8);
    if (run.shield || run.invulnerable > 0) {
      c.save();
      c.globalAlpha = run.shield ? 0.72 : 0.35 + Math.sin(run.time * 25) * 0.15;
      c.strokeStyle = "#f9f6ca";
      c.lineWidth = 1.6;
      c.beginPath();
      c.ellipse(WORLD.playerX, y, 29, 27, 0, 0, Math.PI * 2);
      c.stroke();
      c.fillStyle = "#fffbd31a";
      c.fill();
      c.restore();
    }
    if (run.magnet > 0) {
      c.strokeStyle = "#f7de9b";
      c.lineWidth = 1.3;
      for (let i = 0; i < 2; i++) {
        c.globalAlpha = 0.25;
        c.beginPath();
        c.arc(
          WORLD.playerX,
          y,
          34 + ((run.time * 30 + i * 22) % 48),
          -0.8,
          0.8,
        );
        c.stroke();
      }
      c.globalAlpha = 1;
    }
    drawBird(c, WORLD.playerX, y, 0.78, angle, wing, skin, bird.hurt > 0);
    for (const p of particles) {
      c.globalAlpha = p.life / p.max;
      c.fillStyle = p.color;
      c.beginPath();
      c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1;
    if (phase === "dying") {
      c.fillStyle = `rgba(255,241,213,${Math.max(0, bird.hurt) * 0.35})`;
      c.fillRect(0, 0, WORLD.width, WORLD.height);
    }
  }
  preview(canvas: HTMLCanvasElement, id: string) {
    const c = canvas.getContext("2d")!;
    canvas.width = 264;
    canvas.height = 160;
    c.clearRect(0, 0, 264, 160);
    drawBird(
      c,
      137,
      84,
      2.1,
      -0.08,
      -0.25,
      SKINS.find((s) => s.id === id)!,
    );
  }
}
