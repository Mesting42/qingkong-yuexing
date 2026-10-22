import type { Skin, Theme, ThemeId } from "../types";

const TAU = Math.PI * 2;
/** 原创矢量鸟。所有装饰只负责绘制，本体碰撞始终为 28×22 逻辑像素。 */
export function drawBird(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  angle: number,
  wing: number,
  skin: Skin,
  hurt = false,
) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.scale(scale, scale);
  const plume = (points: number[], color: string) => {
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2)
      c.lineTo(points[i], points[i + 1]);
    c.closePath();
    c.fill();
  };
  // 分叉尾、远翼与近翼分别绘制，拍翼时羽轴弯曲而不是整体缩放图标。
  plume([-12, 2, -37, -6, -29, 5, -38, 13, -13, 10], skin.dark);
  if (skin.feature === "longtail") {
    plume([-17, 6, -58, 17, -34, 8, -57, -2, -16, 2], skin.wing);
    plume([-26, 9, -58, 17, -42, 14], skin.accent);
  }
  if (skin.feature === "petal")
    for (let i = 0; i < 4; i++) {
      c.save();
      c.translate(-17, 6);
      c.rotate(i * 0.18 - 0.35);
      c.fillStyle = skin.accent;
      c.beginPath();
      c.ellipse(-13, 0, 17, 5, 0, 0, TAU);
      c.fill();
      c.restore();
    }
  c.save();
  c.translate(-3, -3);
  c.rotate(-0.35 - wing * 0.85);
  c.fillStyle = skin.dark;
  c.beginPath();
  c.moveTo(0, 7);
  c.bezierCurveTo(-19, -2, -26, -24, -12, -28);
  c.bezierCurveTo(3, -24, 6, -4, 0, 7);
  c.fill();
  c.restore();
  const body = c.createLinearGradient(0, -17, 0, 19);
  body.addColorStop(0, "#fff9eb");
  body.addColorStop(0.42, skin.body);
  body.addColorStop(1, skin.accent);
  c.fillStyle = body;
  c.beginPath();
  c.moveTo(-22, 4);
  c.bezierCurveTo(-20, -10, -4, -16, 10, -10);
  c.bezierCurveTo(23, -13, 26, 1, 16, 10);
  c.bezierCurveTo(4, 23, -17, 17, -22, 4);
  c.fill();
  c.fillStyle = skin.body;
  c.beginPath();
  c.ellipse(12, -7, 13, 13, -0.2, 0, TAU);
  c.fill();
  c.fillStyle = skin.wing;
  c.beginPath();
  c.moveTo(3, -18);
  c.bezierCurveTo(11, -25, 25, -17, 24, -6);
  c.bezierCurveTo(17, -11, 9, -12, 3, -10);
  c.fill();
  c.save();
  c.translate(-5, -1);
  c.rotate(0.28 + wing * 1.02);
  const wg = c.createLinearGradient(-20, -20, 7, 13);
  wg.addColorStop(0, skin.dark);
  wg.addColorStop(0.55, skin.wing);
  wg.addColorStop(1, skin.body);
  c.fillStyle = wg;
  c.beginPath();
  c.moveTo(7, 1);
  c.bezierCurveTo(-2, -4, -20, -25, -31, -20);
  c.bezierCurveTo(-30, -11, -26, 0, -17, 9);
  c.bezierCurveTo(-7, 16, 3, 12, 7, 1);
  c.fill();
  for (let i = 0; i < 5; i++) {
    c.strokeStyle = i % 2 ? "#ffffff38" : skin.dark + "65";
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(-5 - i * 3, 7 - i * 0.3);
    c.quadraticCurveTo(-16 - i * 2, -5, -23 - i * 1.3, -14 + i * 2);
    c.stroke();
  }
  c.restore();
  plume([23, -7, 35, -2, 23, 1], skin.accent);
  c.fillStyle = skin.dark;
  c.beginPath();
  c.ellipse(18, -7, 3.3, 4, 0, 0, TAU);
  c.fill();
  c.fillStyle = "#fff";
  c.beginPath();
  c.arc(19, -8.5, 1.1, 0, TAU);
  c.fill();
  c.fillStyle = skin.accent + "90";
  c.beginPath();
  c.ellipse(19, -1, 3.5, 2, 0, 0, TAU);
  c.fill();
  if (hurt) {
    c.strokeStyle = skin.dark;
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(14, -9);
    c.lineTo(21, -5);
    c.moveTo(21, -9);
    c.lineTo(14, -5);
    c.stroke();
  }
  if (
    skin.feature === "crest" ||
    skin.feature === "crown" ||
    skin.feature === "petal"
  ) {
    for (let i = 0; i < 3; i++) {
      c.fillStyle = skin.accent;
      c.beginPath();
      c.ellipse(5 + i * 6, -21 - (i % 2) * 3, 3, 8, -0.6 + i * 0.4, 0, TAU);
      c.fill();
    }
  }
  if (skin.feature === "scarf") {
    c.fillStyle = skin.accent;
    c.beginPath();
    c.moveTo(7, 3);
    c.lineTo(10, 8);
    c.lineTo(-22, 23 + wing * 3);
    c.lineTo(-16, 14);
    c.lineTo(-28, 11);
    c.closePath();
    c.fill();
    c.fillRect(5, 1, 9, 5);
  }
  if (skin.feature === "ribbon") {
    c.strokeStyle = skin.accent;
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(9, 3);
    c.bezierCurveTo(-3, 7, -12, 20 + wing * 4, -24, 14);
    c.moveTo(9, 3);
    c.bezierCurveTo(-3, 8, -5, 28, -18, 25);
    c.stroke();
  }
  if (skin.feature === "cap") {
    c.fillStyle = skin.accent;
    c.beginPath();
    c.ellipse(12, -18, 15, 4, 0.06, 0, TAU);
    c.fill();
    c.beginPath();
    c.roundRect(3, -28, 18, 13, 5);
    c.fill();
    c.fillStyle = skin.dark;
    c.fillRect(3, -20, 18, 3);
  }
  if (skin.feature === "goggles") {
    c.strokeStyle = skin.accent;
    c.lineWidth = 3;
    c.beginPath();
    c.arc(17, -10, 6, 0, TAU);
    c.moveTo(11, -10);
    c.lineTo(-1, -10);
    c.stroke();
    c.fillStyle = "#b6e5ef8a";
    c.beginPath();
    c.arc(17, -10, 4, 0, TAU);
    c.fill();
  }
  c.restore();
}
export function starShape(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  rotation = 0,
) {
  c.save();
  c.translate(x, y);
  c.rotate(rotation);
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5,
      rr = i % 2 ? r * 0.48 : r;
    const px = Math.cos(a) * rr,
      py = Math.sin(a) * rr;
    if (!i) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.closePath();
  const g = c.createLinearGradient(-r, -r, r, r);
  g.addColorStop(0, "#fff1ae");
  g.addColorStop(0.45, "#efc461");
  g.addColorStop(1, "#d39740");
  c.fillStyle = g;
  c.fill();
  c.strokeStyle = "#fff2c9";
  c.lineWidth = Math.max(0.7, r * 0.07);
  c.stroke();
  c.fillStyle = "#fff8d4";
  c.beginPath();
  c.moveTo(0, -r * 0.7);
  c.lineTo(r * 0.18, -r * 0.18);
  c.lineTo(-r * 0.2, 0);
  c.closePath();
  c.fill();
  c.restore();
}
/** 独立护盾为有填充的青色徽章，浅色外缘使其在四个主题上都能辨认。 */
export function shieldShape(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
) {
  c.save();
  c.translate(x, y);
  c.fillStyle = "#fff5db";
  c.beginPath();
  c.arc(0, 0, 21, 0, TAU);
  c.fill();
  const g = c.createLinearGradient(-12, -16, 13, 16);
  g.addColorStop(0, "#91c9ca");
  g.addColorStop(0.55, "#498995");
  g.addColorStop(1, "#2c6577");
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(0, -17);
  c.lineTo(14, -11);
  c.lineTo(13, 3);
  c.bezierCurveTo(12, 10, 5, 15, 0, 18);
  c.bezierCurveTo(-5, 15, -12, 10, -13, 3);
  c.lineTo(-14, -11);
  c.closePath();
  c.fill();
  c.strokeStyle = "#eac98b";
  c.lineWidth = 1.5;
  c.stroke();
  c.fillStyle = "#f9e4ae";
  c.beginPath();
  c.moveTo(0, -8);
  c.lineTo(3, -2);
  c.lineTo(9, 0);
  c.lineTo(3, 3);
  c.lineTo(0, 10);
  c.lineTo(-3, 3);
  c.lineTo(-9, 0);
  c.lineTo(-3, -2);
  c.closePath();
  c.fill();
  c.strokeStyle = "#ffffff99";
  c.lineWidth = 1;
  c.beginPath();
  c.arc(0, 0, 24, time * 0.8, time * 0.8 + 1.1);
  c.stroke();
  c.restore();
}
const paintings = new Map<ThemeId, HTMLImageElement>();
export function loadPaintings() {
  for (const id of ["bay", "forest", "snow", "sunset"] as ThemeId[]) {
    const image = new Image();
    image.src = `/art/${id}.png`;
    paintings.set(id, image);
  }
}

function cloud(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  opacity: number,
) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.globalAlpha = opacity;
  const g = c.createLinearGradient(0, -35, 0, 22);
  g.addColorStop(0, "#fffdf1");
  g.addColorStop(1, "#e6f0ed");
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(-68, 12);
  c.bezierCurveTo(-87, -8, -51, -28, -35, -16);
  c.bezierCurveTo(-39, -58, 20, -66, 30, -28);
  c.bezierCurveTo(54, -46, 77, -12, 70, 0);
  c.bezierCurveTo(107, -2, 104, 22, 76, 23);
  c.lineTo(-55, 23);
  c.bezierCurveTo(-76, 23, -82, 14, -68, 12);
  c.fill();
  c.restore();
}
/** 前后云层独立位移，绘画底图缓慢漂移；画布密度由调用者限制。 */
export function scene(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: Theme,
  time: number,
  reduce = false,
) {
  const sky = c.createLinearGradient(0, 0, 0, h);
  theme.sky.forEach((col, i) => sky.addColorStop(i * 0.5, col));
  c.fillStyle = sky;
  c.fillRect(0, 0, w, h);
  const picture = paintings.get(theme.id);
  if (picture?.complete && picture.naturalWidth) {
    const k = Math.max(w / picture.naturalWidth, h / picture.naturalHeight),
      pw = picture.naturalWidth * k,
      ph = picture.naturalHeight * k;
    c.drawImage(picture, (w - pw) * 0.5, h - ph, pw, ph);
  } else {
    c.fillStyle = theme.sun;
    c.beginPath();
    c.arc(w * 0.72, h * 0.23, 40, 0, TAU);
    c.fill();
    for (let layer = 0; layer < 3; layer++) {
      c.fillStyle = layer === 0 ? theme.mountains : theme.middle;
      c.globalAlpha = 0.38 + layer * 0.16;
      c.beginPath();
      c.moveTo(0, h);
      for (let i = 0; i <= 16; i++) {
        const xx = (i * w) / 16,
          yy = h * (0.65 + layer * 0.11) - Math.sin(i * 1.5 + layer) * h * 0.07;
        c.lineTo(xx, yy);
      }
      c.lineTo(w, h);
      c.fill();
    }
    c.globalAlpha = 1;
  }
  const t = reduce ? 0 : time;
  for (let i = 0; i < 7; i++) {
    const period = w + 360,
      xx =
        ((((i * 241.3 - t * (5 + (i % 3) * 2)) % period) + period) % period) -
        180;
    cloud(
      c,
      xx,
      h * (0.18 + (i % 4) * 0.21),
      0.55 + (i % 3) * 0.25,
      0.12 + (i % 2) * 0.12,
    );
  }
  // 低处云带遮住地平线的硬接缝，前景装饰永远不承担碰撞。
  const mist = c.createLinearGradient(0, h * 0.88, 0, h);
  mist.addColorStop(0, "#ffffff00");
  mist.addColorStop(1, theme.sky[1] + "b0");
  c.fillStyle = mist;
  c.fillRect(0, h * 0.88, w, h * 0.12);
  if (theme.id === "snow") {
    c.fillStyle = "#ffffffb0";
    for (let i = 0; i < 22; i++) {
      const xx = (i * 73 + t * 9) % w,
        yy = (i * 117 + t * 18) % h;
      c.beginPath();
      c.arc(xx, yy, 1 + (i % 2) * 0.4, 0, TAU);
      c.fill();
    }
  }
  if (theme.id === "forest") {
    c.fillStyle = "#e9e9b980";
    for (let i = 0; i < 12; i++) {
      c.save();
      c.translate((i * 113 - t * 17 + w * 30) % w, (i * 137 + t * 9) % h);
      c.rotate(t + i);
      c.beginPath();
      c.ellipse(0, 0, 3, 1.4, 0, 0, TAU);
      c.fill();
      c.restore();
    }
  }
}

/** 柱体端面严格在间隙边界内；所有枝叶/晶体沿柱身生长，避免误导玩家的装饰碰撞。 */
export function pillar(
  c: CanvasRenderingContext2D,
  x: number,
  tip: number,
  width: number,
  top: boolean,
  theme: Theme,
  seed: number,
) {
  c.save();
  c.translate(x, tip);
  if (top) c.scale(1, -1);
  const g = c.createLinearGradient(0, 0, width, 0);
  g.addColorStop(0, theme.shadow);
  g.addColorStop(0.22, theme.rock);
  g.addColorStop(0.68, theme.rock);
  g.addColorStop(1, theme.shadow);
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(width, 0);
  c.lineTo(width, 800);
  c.lineTo(0, 800);
  c.closePath();
  c.fill();
  if (theme.id === "forest") {
    c.fillStyle = "#504d3e30";
    for (let i = 0; i < 6; i++) {
      c.beginPath();
      c.moveTo(7 + i * 10, 4);
      c.bezierCurveTo(i * 10 - 3, 90, 22 + i * 8, 190, 5 + i * 10, 400);
      c.lineTo(10 + i * 10, 400);
      c.lineTo(15 + i * 10, 4);
      c.fill();
    }
    c.strokeStyle = theme.grass;
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(8, 12);
    c.bezierCurveTo(38, 70, 0, 100, 35, 160);
    c.stroke();
    for (let i = 0; i < 5; i++) {
      c.fillStyle = theme.grass;
      c.beginPath();
      c.ellipse(15 + (i % 2) * 15, 30 + i * 27, 8, 4, i, 0, TAU);
      c.fill();
    }
  } else if (theme.id === "snow") {
    c.fillStyle = "#ffffff45";
    c.beginPath();
    c.moveTo(5, 5);
    c.lineTo(width * 0.48, 5);
    c.lineTo(width * 0.7, 200);
    c.lineTo(width * 0.15, 380);
    c.fill();
    c.strokeStyle = "#effbfa90";
    c.lineWidth = 1.2;
    for (let i = 0; i < 4; i++) {
      c.beginPath();
      c.moveTo(i * 16, 5);
      c.lineTo((i + 1) * 15, 170);
      c.lineTo(i * 13, 330);
      c.stroke();
    }
  } else {
    c.strokeStyle = theme.shadow + "80";
    c.lineWidth = 1.6;
    for (let i = 0; i < 9; i++) {
      const yy = 35 + i * 72;
      c.beginPath();
      c.moveTo(0, yy);
      c.lineTo(width, yy + 8 * Math.sin(i + seed));
      c.moveTo(width * (0.2 + (i % 3) * 0.27), yy);
      c.lineTo(width * (0.25 + (i % 3) * 0.27), yy + 67);
      c.stroke();
    }
    c.fillStyle = "#fff4d930";
    c.beginPath();
    c.moveTo(6, 12);
    c.lineTo(14, 12);
    c.lineTo(11, 730);
    c.lineTo(6, 730);
    c.fill();
  }
  c.fillStyle = theme.shadow;
  c.fillRect(-2, 0, width + 4, 7);
  c.fillStyle = theme.rock;
  c.fillRect(-2, 0, width + 4, 3);
  c.fillStyle = theme.grass;
  c.beginPath();
  c.moveTo(0, 0);
  for (let i = 0; i <= 8; i++)
    c.lineTo((i * width) / 8, 3 + Math.sin(i * 2 + seed) * 2);
  c.lineTo(width, 9);
  c.lineTo(0, 9);
  c.fill();
  // 端面延伸 2px 也计入渲染边界；碰撞已包含主体的安全宽容。
  c.restore();
}
