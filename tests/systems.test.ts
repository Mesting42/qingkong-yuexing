import test from "node:test";
import assert from "node:assert/strict";
import { FLIGHT, WORLD, difficulty } from "../src/config";
import { integrate, flap } from "../src/systems/physics";
import { Generator, canTraverse } from "../src/systems/generator";
import { crossing, hitsGate, segmentRect } from "../src/systems/collision";
import {
  collectStar,
  collectShield,
  activateMagnet,
  recover,
} from "../src/systems/powers";
import { ShieldDrops } from "../src/systems/shield-drops";
import { awardPass } from "../src/systems/scoring";
import {
  Storage,
  freshSave,
  decodeSave,
  SAVE_KEY,
} from "../src/systems/storage";
import { claimMission } from "../src/systems/missions";
import { equipSkin } from "../src/systems/collection";
import { Game } from "../src/game";
import type { Bird, Run, Mode } from "../src/types";

const memory = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => memory.set(k, v),
  },
});
Object.defineProperty(globalThis, "document", { value: { hidden: false } });
const bird = (): Bird => ({ y: 370, previousY: 370, vy: 0, flap: 0, hurt: 0 });
const run = (): Run => ({
  id: Math.random().toString(),
  mode: "classic",
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
});
function seed(n: number) {
  return () => {
    n = (n * 1664525 + 1013904223) >>> 0;
    return n / 4294967296;
  };
}
const audio = { sound: () => {}, setPaused: () => {} };
const game = () => {
  memory.clear();
  return new Game(new Storage(), audio, { state: () => {}, notice: () => {} });
};

test("快速拍翼重设速度，不叠加冲量，终端下落速度有上限", () => {
  const b = bird();
  for (let i = 0; i < 50; i++) flap(b);
  assert.equal(b.vy, FLIGHT.impulse);
  for (let i = 0; i < 1000; i++) integrate(b, WORLD.step);
  assert.equal(b.vy, FLIGHT.terminal);
});
test("30/60/90/120/144Hz 显示分组使用相同固定步得到相同结果", () => {
  function simulate(hz: number) {
    const b = bird();
    let acc = 0,
      step = 0;
    for (let i = 0; i < hz * 5; i++) {
      acc += 1 / hz;
      while (acc + 1e-10 >= WORLD.step) {
        if (step % 83 === 0) flap(b);
        integrate(b, WORLD.step);
        acc -= WORLD.step;
        step++;
      }
    }
    return { y: b.y, v: b.vy, step };
  }
  const reference = simulate(60);
  for (const hz of [30, 90, 120, 144])
    assert.deepEqual(simulate(hz), reference);
});
test("两种模式、七个阶段的随机路线通过保守轨迹检查", () => {
  let checked = 0;
  for (const mode of ["classic", "chaos"] as Mode[])
    for (const score of [0, 6, 16, 30, 50, 80, 120]) {
      const gen = new Generator(seed(score + mode.length));
      let prev = 370;
      for (let i = 0; i < 45; i++) {
        const { gate, distance } = gen.next(mode, score, 492);
        assert.ok(Math.abs(gate.baseCenter - prev) <= 92.001);
        assert.ok(
          canTraverse(
            prev,
            gate.baseCenter,
            distance / gate.speed,
            gate.gap,
            gate.amplitude,
          ),
        );
        assert.ok(gate.baseCenter >= 205 && gate.baseCenter <= 550);
        prev = gate.baseCenter;
        checked++;
      }
    }
  assert.equal(checked, 630);
});
test("难度参数有上限，混乱不改重力/拍翼", () => {
  assert.deepEqual(difficulty("classic", 5000), difficulty("classic", 120));
  assert.equal(difficulty("classic", 120).speed, 250);
  assert.equal(difficulty("classic", 120).gap, 160);
  assert.equal(difficulty("chaos", 120).gap, 154);
  assert.equal(difficulty("chaos", 20).speed, difficulty("classic", 20).speed);
});
test("扫掠检测能命中单步穿过的薄障碍", () => {
  assert.equal(segmentRect(-100, 20, 100, 20, -5, 0, 5, 40), true);
  assert.equal(segmentRect(-100, 60, 100, 60, -5, 0, 5, 40), false);
});
test("碰撞本体宽容装饰，但不会穿过柱体", () => {
  const { gate } = new Generator(seed(3)).next("classic", 0, 100);
  gate.previousX = 100;
  gate.center = gate.previousCenter = 370;
  const b = bird();
  assert.equal(hitsGate(b, gate), false);
  b.y = b.previousY = 200;
  assert.equal(hitsGate(b, gate), true);
});
test("移动间隙在穿越确切时刻插值，门只能判定一次", () => {
  const { gate } = new Generator(seed(2)).next("chaos", 10, 80);
  gate.previousX = 90;
  gate.x = 70;
  gate.previousCenter = 350;
  gate.center = 390;
  const b = bird();
  b.previousY = 350;
  b.y = 390;
  assert.equal(crossing(b, gate)?.precise, true);
  gate.scored = true;
  assert.equal(crossing(b, gate), null);
});
test("连击三次奖励一星，普通通过只清空连击", () => {
  const r = run();
  for (let i = 0; i < 6; i++) awardPass(r, true);
  assert.equal(r.stars, 2);
  assert.equal(r.maxCombo, 6);
  awardPass(r, false);
  assert.equal(r.score, 7);
  assert.equal(r.combo, 0);
  assert.equal(r.stars, 2);
});
test("无论拾取多少星星都不获得护盾，磁铁仍单局一次", () => {
  const r = run();
  for (let i = 0; i < 1000; i++) collectStar(r);
  assert.equal(r.shield, false);
  assert.equal(r.stars, 1000);
  assert.equal(activateMagnet(r), true);
  assert.equal(activateMagnet(r), false);
  assert.equal(r.stars, 1000);
});
test("重复拾取护盾没有备用次数，也不延长恢复时间", () => {
  const r = run(),
    b = bird();
  r.invulnerable = 0.6;
  assert.equal(collectShield(r), true);
  for (let i = 0; i < 10; i++) assert.equal(collectShield(r), false);
  assert.equal(r.invulnerable, 0.6);
  recover(b, r, []);
  assert.equal(r.shield, false);
  assert.equal(r.recoveries, 1);
  for (let i = 0; i < 100; i++) collectStar(r);
  assert.equal(r.shield, false);
});
test("护盾每20～30组生成，已持有时不生成，消耗后重新等待完整间隔", () => {
  const template = new Generator(seed(7)).next("classic", 0, 492).gate;
  for (const [random, interval] of [
    [0, 20],
    [0.5, 25],
    [0.999999, 30],
  ]) {
    const drops = new ShieldDrops(() => random);
    const issued: number[] = [];
    for (let id = 1; id <= 90; id++)
      if (drops.next({ ...template, id }, false)) issued.push(id);
    assert.equal(issued[0], interval);
    for (let i = 1; i < issued.length; i++)
      assert.equal(issued[i] - issued[i - 1], interval);
    for (let id = 91; id < 191; id++)
      assert.equal(drops.next({ ...template, id }, true), null);
    drops.restartAfterUse();
    for (let i = 1; i < interval; i++)
      assert.equal(drops.next({ ...template, id: 191 + i }, false), null);
    assert.ok(drops.next({ ...template, id: 191 + interval }, false));
  }
});
test("拾取集成夹具：两个道具只给一层，第二次事故正常结束，不储备护盾", () => {
  const g = game();
  g.start("classic");
  g.press();
  g.shields = [1, 2].map((id) => ({
    id,
    gateId: -1,
    x: 112,
    y: 370,
    previousX: 112,
    previousY: 370,
    speed: 140,
    taken: false,
  }));
  g.update(WORLD.step);
  assert.equal(g.run.shield, true);
  assert.equal(g.shields.length, 0);
  assert.equal(g.run.stars, 0);
  assert.equal(g.run.picked, 0);
  g.bird.y = -50;
  g.update(WORLD.step);
  assert.equal(g.run.recoveries, 1);
  assert.equal(g.run.shield, false);
  assert.equal(g.phase, "flying");
  g.run.invulnerable = 0;
  g.bird.y = -50;
  g.update(WORLD.step);
  assert.equal(g.phase, "dying");
  assert.equal(g.run.recoveries, 1);
});
test("磁铁不吸护盾，错过的护盾离场回收且不自动授予", () => {
  const g = game();
  g.start("classic");
  g.press();
  g.run.picked = 15;
  g.magnet();
  g.shields = [
    {
      id: 1,
      gateId: -1,
      x: 200,
      y: 370,
      previousX: 200,
      previousY: 370,
      speed: 140,
      taken: false,
    },
  ];
  g.update(WORLD.step);
  assert.ok(Math.abs(g.shields[0].x - (200 - 140 * WORLD.step)) < 1e-8);
  assert.equal(g.shields[0].y, 370);
  assert.equal(g.run.shield, false);
  g.shields[0].x = -41;
  g.update(WORLD.step);
  assert.equal(g.shields.length, 0);
  assert.equal(g.run.shield, false);
});
test("护盾恢复安全复位并清除临近障碍再次伤害风险", () => {
  const r = run(),
    b = bird();
  r.shield = true;
  r.combo = 5;
  b.y = 747;
  const gates = [
    new Generator(seed(1)).next("classic", 10, 105).gate,
    new Generator(seed(3)).next("classic", 10, 300).gate,
  ];
  recover(b, r, gates, gates[0]);
  assert.equal(r.shield, false);
  assert.equal(r.combo, 0);
  assert.equal(r.recoveries, 1);
  assert.ok(r.invulnerable > 2);
  assert.ok(b.y > 100 && b.y < 648);
  assert.ok(gates.every((g) => g.harmless));
});
test("损坏/未知版本/非法字段存档安全回退", () => {
  for (const raw of ["{broken", "null", "[]", '{"version":9}'])
    assert.equal(decodeSave(raw).equipped, "dawn");
  const s = decodeSave(
    '{"version":1,"balance":-10,"best":{"classic":"999"},"unlocked":["alien"],"equipped":"alien"}',
  );
  assert.equal(s.balance, 0);
  assert.equal(s.best.classic, 0);
  assert.deepEqual(s.unlocked, ["dawn"]);
});
test("结算 ID 防重、双模式纪录独立、货币只发一次", () => {
  memory.clear();
  const store = new Storage(),
    r = run();
  r.score = 9;
  r.stars = 11;
  assert.equal(store.settle(r), true);
  assert.equal(store.settle(r), false);
  assert.equal(store.settle({ ...r, settled: false }), false);
  assert.equal(store.data.balance, 11);
  assert.equal(store.data.best.classic, 9);
  assert.equal(store.data.best.chaos, 0);
  const loaded = new Storage();
  assert.equal(loaded.data.balance, 11);
  assert.ok(memory.has(SAVE_KEY));
});
test("任务不能重复领取，外观不能重复扣款", () => {
  const s = freshSave();
  s.best.classic = 10;
  assert.equal(claimMission(s, "first"), true);
  assert.equal(claimMission(s, "first"), false);
  assert.equal(s.balance, 5);
  s.balance = 100;
  assert.equal(equipSkin(s, "fern"), "equipped");
  assert.equal(s.balance, 82);
  equipSkin(s, "fern");
  assert.equal(s.balance, 82);
  assert.equal(equipSkin(s, "crown"), "record");
});
test("暂停冻结磁铁、重试彻底清理临时状态", () => {
  const g = game();
  g.start("classic");
  g.press();
  g.run.picked = 15;
  g.magnet();
  g.shields = [
    {
      id: 1,
      gateId: -1,
      x: 300,
      y: 370,
      previousX: 300,
      previousY: 370,
      speed: 140,
      taken: false,
    },
  ];
  g.pause();
  const before = g.snapshot();
  for (let i = 0; i < 300; i++) g.update(WORLD.step);
  assert.deepEqual(g.snapshot(), before);
  g.resume();
  for (let i = 0; i < 200; i++) g.update(WORLD.step);
  assert.equal(g.phase, "flying");
  g.home();
  g.start("chaos");
  assert.equal(g.run.score, 0);
  assert.equal(g.run.magnet, 0);
  assert.equal(g.run.magnetUsed, false);
  assert.equal(g.run.shield, false);
  assert.equal(g.run.combo, 0);
  assert.equal(g.stars.length, 3);
  assert.equal(g.shields.length, 0);
  assert.equal(g.particles.length, 0);
});

test("自动物理驾驶验证两种模式完整推进及 12 分钟对象数量上限", () => {
  for (const mode of ["classic", "chaos"] as Mode[]) {
    const g = game();
    g.start(mode);
    g.press();
    let maxShields = 0,
      maxGates = 0,
      maxStars = 0,
      maxParticles = 0;
    for (let i = 0; i < 120 * 60 * 12; i++) {
      const next = g.gates.find(
        (o) => o.x + o.width + WORLD.rx > WORLD.playerX,
      );
      const target = next?.center ?? 370;
      // 仅调用真实拍翼动作，不改变位置、积分、道具或结算。与浏览器输入回放分开报告。
      if (g.bird.y > target + 22 && g.bird.vy > -40) g.press();
      if (g.run.picked >= 15 && !g.run.magnetUsed) g.magnet();
      g.update(WORLD.step);
      maxGates = Math.max(maxGates, g.gates.length);
      maxStars = Math.max(maxStars, g.stars.length);
      maxShields = Math.max(maxShields, g.shields.length);
      maxParticles = Math.max(maxParticles, g.particles.length);
      assert.equal(
        g.phase,
        "flying",
        `${mode} 在 ${g.run.score} 分结束：${g.run.cause}`,
      );
    }
    assert.ok(g.run.score > 400);
    assert.equal(g.run.shield, true, "完整生成、移动与拾取链路应在长局中获得一层护盾");
    assert.equal(g.run.recoveries, 0, "长局路线应无需护盾救场也能通过");
    assert.ok(maxGates < 6);
    assert.ok(maxStars < 20);
    assert.ok(maxParticles <= 90);
    assert.ok(maxShields <= 1);
    console.log(
      `${mode} 12分钟：${g.run.score}分，门/星/粒子/护盾峰值 ${maxGates}/${maxStars}/${maxParticles}/${maxShields}`,
    );
  }
});
