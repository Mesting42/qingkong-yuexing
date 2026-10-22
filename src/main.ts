/**
 * THESIS: 候鸟在云海中等待出发，主菜单让天空与角色先于面板出现。
 * OWN-WORLD: 海蓝、羽白、麦金；自然光插画、中文行楷标题、简洁实心道具。
 * STORY: 选择一阵风和目的地，点击启程，在反复远航中收藏羽翼。
 * FIRST VIEWPORT: 全幅云海、左侧标题与启程、右侧动态鸟、下沿四站风景及旅程菜单。
 * FORM: 用户已确认的细腻动画风及竖屏优先战场，技术方案获准后持续实施。
 */
import "./style.css";
import { WORLD } from "./config";
import { Storage } from "./systems/storage";
import { AudioSystem } from "./systems/audio";
import { Input } from "./systems/input";
import { Renderer } from "./render/renderer";
import { Game } from "./game";
import { UI } from "./ui/ui";

document.querySelector<HTMLDivElement>("#app")!.innerHTML =
  `<canvas id="world" aria-hidden="true"></canvas><div class="home-shade"></div><div id="home"></div><section id="flight-area" aria-label="竖屏飞行战场" hidden><canvas id="flight" aria-label="晴空跃行游戏区域，点击拍翼" tabindex="0"></canvas><div id="hud"></div><div id="flight-bottom"></div><div id="overlay"></div></section><aside class="side-note"><span>晴空跃行</span><p>把节奏交给羽翼<br>把远方交给自己</p><small>点击 / 空格拍翼<br>E 开启磁铁 · Esc 暂停<br>手机与平板请竖屏游玩</small></aside><div id="toast" class="toast" role="status" aria-live="polite"></div><dialog id="panel" class="panel" aria-label="旅程菜单"></dialog>`;
const storage = new Storage(),
  audio = new AudioSystem(() => storage.data.settings);
const renderer = new Renderer(
  document.querySelector("#flight")!,
  document.querySelector("#world")!,
);
let ui: UI;
const game = new Game(storage, audio, {
  state: () => {
    input?.clear();
    accumulator = 0;
    ui?.render();
  },
  notice: (text, kind) => ui?.notice(text, kind),
});
const input = new Input(
  document.querySelector("#flight")!,
  () => {
    if (!document.querySelector<HTMLDialogElement>("#panel")!.open)
      game.press();
  },
  () => game.pause(),
  () => game.magnet(),
  () => audio.unlock(),
);
ui = new UI(game, renderer, audio);
let previous = performance.now(),
  accumulator = 0,
  ambient = 0,
  lastUI = 0;
// 固定 120Hz 模拟，绘制插值；大卡顿按暂停处理，绝不把后台时间补算成坠落。
function frame(now: number) {
  let dt = (now - previous) / 1000;
  previous = now;
  if (dt > 0.3) {
    game.pause();
    dt = 0;
    accumulator = 0;
  }
  ambient += Math.min(dt, 0.05);
  accumulator += Math.min(dt, 0.1);
  while (accumulator >= WORLD.step) {
    accumulator -= WORLD.step;
    game.update(WORLD.step);
  }
  renderer.draw(
    storage.data,
    game.phase,
    game.bird,
    game.run,
    game.gates,
    game.stars,
    game.shields,
    game.particles,
    ambient,
    accumulator / WORLD.step,
  );
  if (now - lastUI > 70) {
    ui.hud();
    if (import.meta.env.DEV)
      document.querySelector<HTMLCanvasElement>("#flight")!.dataset.telemetry =
        JSON.stringify(game.snapshot());
    lastUI = now;
  }
  audio.tick();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
let resizeTimer = 0;
window.addEventListener("resize", () => {
  game.pause();
  input.clear();
  clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => renderer.resize(), 80);
});
window.addEventListener("orientationchange", () => {
  game.pause();
  input.clear();
});
document.addEventListener("visibilitychange", () => {
  audio.setPaused(document.hidden || game.phase === "paused");
});
window.addEventListener("blur", () => audio.setPaused(true));
window.addEventListener("focus", () => {
  if (game.phase === "home" || game.phase === "result") audio.setPaused(false);
});
// 仅开发预览提供只读遥测，自动化必须通过真实输入进行游玩，禁止改分/强制结算。
if (import.meta.env.DEV)
  Object.defineProperty(window, "clearwingSnapshot", {
    value: () => game.snapshot(),
    writable: false,
  });
