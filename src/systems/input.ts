/** 只监听 pointerdown，避免 touch/click 双发。UI 位于画布外部，不会穿透到飞行输入。 */
export class Input {
  private held = new Set<string>();
  private pointerHeld = new Set<number>();
  constructor(
    canvas: HTMLCanvasElement,
    private press: () => void,
    private pause: () => void,
    private magnet: () => void,
    unlock: () => void,
  ) {
    canvas.addEventListener("pointerdown", (e) => {
      if (
        !e.isPrimary ||
        (e.pointerType === "mouse" && e.button !== 0) ||
        this.pointerHeld.has(e.pointerId)
      )
        return;
      e.preventDefault();
      this.pointerHeld.add(e.pointerId);
      unlock();
      this.press();
    });
    window.addEventListener("pointerup", (e) =>
      this.pointerHeld.delete(e.pointerId),
    );
    window.addEventListener("pointercancel", (e) =>
      this.pointerHeld.delete(e.pointerId),
    );
    window.addEventListener("keydown", (e) => {
      if (!["Space", "KeyE", "Escape", "KeyP"].includes(e.code)) return;
      if ((e.target as HTMLElement).matches("input,select,textarea,button"))
        return;
      if (e.code === "Space") e.preventDefault();
      if (e.repeat || this.held.has(e.code)) return;
      this.held.add(e.code);
      unlock();
      if (e.code === "Space") this.press();
      else if (e.code === "KeyE") this.magnet();
      else this.pause();
    });
    window.addEventListener("keyup", (e) => this.held.delete(e.code));
    window.addEventListener("blur", () => {
      this.clear();
      this.pause();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.clear();
        this.pause();
      }
    });
  }
  clear() {
    this.held.clear();
    this.pointerHeld.clear();
  }
}
