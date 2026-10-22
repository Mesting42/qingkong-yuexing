import test from "node:test";
import assert from "node:assert/strict";
import { Input } from "../src/systems/input";

/** 事件适配器测试：模拟浏览器传入的事件形态，验证重复输入与 UI 隔离，不修改游戏分数。 */
test("鼠标/触屏同次按下只拍一次，长按、右键和第二手指不会连拍", () => {
  const maps = {
    window: new Map<string, Function>(),
    document: new Map<string, Function>(),
    canvas: new Map<string, Function>(),
  };
  const surface = (name: keyof typeof maps) => ({
    addEventListener: (type: string, fn: Function) => maps[name].set(type, fn),
  });
  Object.defineProperty(globalThis, "window", {
    value: surface("window"),
    configurable: true,
  });
  Object.defineProperty(globalThis, "document", {
    value: { ...surface("document"), hidden: true },
    configurable: true,
  });
  let presses = 0,
    pauses = 0,
    magnets = 0;
  const input = new Input(
    surface("canvas") as unknown as HTMLCanvasElement,
    () => presses++,
    () => pauses++,
    () => magnets++,
    () => {},
  );
  const pointer = {
    pointerId: 1,
    isPrimary: true,
    pointerType: "touch",
    button: 0,
    preventDefault: () => {},
  };
  maps.canvas.get("pointerdown")!(pointer);
  maps.canvas.get("pointerdown")!(pointer);
  assert.equal(presses, 1);
  maps.canvas.get("pointerdown")!({
    ...pointer,
    pointerId: 2,
    isPrimary: false,
  });
  assert.equal(presses, 1);
  maps.window.get("pointerup")!(pointer);
  maps.canvas.get("pointerdown")!(pointer);
  assert.equal(presses, 2);
  maps.canvas.get("pointerdown")!({
    ...pointer,
    pointerId: 3,
    pointerType: "mouse",
    button: 2,
  });
  assert.equal(presses, 2);
  const key = {
    code: "Space",
    repeat: false,
    target: { matches: () => false },
    preventDefault: () => {},
  };
  maps.window.get("keydown")!(key);
  for (let i = 0; i < 20; i++)
    maps.window.get("keydown")!({ ...key, repeat: true });
  assert.equal(presses, 3);
  maps.window.get("keydown")!(key);
  assert.equal(presses, 3);
  maps.window.get("keyup")!(key);
  maps.window.get("keydown")!(key);
  assert.equal(presses, 4);
  maps.window.get("keyup")!(key);
  maps.window.get("keydown")!({ ...key, target: { matches: () => true } });
  assert.equal(presses, 4);
  maps.window.get("keydown")!({ ...key, code: "KeyE" });
  assert.equal(magnets, 1);
  maps.window.get("blur")!();
  assert.equal(pauses, 1);
  input.clear();
  maps.document.get("visibilitychange")!();
  assert.equal(pauses, 2);
});
