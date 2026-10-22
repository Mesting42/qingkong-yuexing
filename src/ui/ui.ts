import { difficulty, POWERS, SKINS, THEMES } from "../config";
import { Game } from "../game";
import { Renderer } from "../render/renderer";
import { MISSIONS, claimMission } from "../systems/missions";
import { equipSkin } from "../systems/collection";
import type { AudioSystem } from "../systems/audio";
import type { Mode, ThemeId } from "../types";
import { icon } from "./icons";

/** UI 不拥有游戏规则，只发出 start/press/pause/magnet 等动作，HUD 用文本节点更新。 */
export class UI {
  mode: Mode = "classic";
  private panel: HTMLDialogElement;
  private toastTimer = 0;
  private lastHud = "";
  constructor(
    private game: Game,
    private renderer: Renderer,
    private audio: AudioSystem,
  ) {
    this.panel = document.querySelector<HTMLDialogElement>("#panel")!;
    document.addEventListener("click", (e) => {
      const button = (e.target as HTMLElement).closest<HTMLButtonElement>(
        "button[data-action]",
      );
      if (!button || button.disabled) return;
      button.blur();
      this.audio.unlock();
      this.audio.sound("menu");
      this.action(button.dataset.action!, button.dataset.value);
    });
    this.panel.addEventListener("click", (e) => {
      if (e.target === this.panel) {
        const r = this.panel.getBoundingClientRect();
        const p = e as MouseEvent;
        if (
          p.clientX < r.left ||
          p.clientX > r.right ||
          p.clientY < r.top ||
          p.clientY > r.bottom
        )
          this.closePanel();
      }
    });
    this.panel.addEventListener("cancel", () => {
      this.panel.close();
    });
    this.render();
  }
  notice(text: string, kind = "normal") {
    const toast = document.querySelector<HTMLElement>("#toast")!;
    toast.textContent = text;
    toast.className = `toast show ${kind}`;
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(
      () => toast.classList.remove("show"),
      kind === "mission" ? 2800 : 1800,
    );
  }
  private action(action: string, value?: string) {
    const g = this.game,
      s = g.storage.data;
    switch (action) {
      case "mode":
        this.mode = value as Mode;
        this.render();
        break;
      case "start":
        this.closePanel();
        g.start(this.mode);
        break;
      case "retry":
        this.closePanel();
        g.start(g.run.mode);
        break;
      case "pause":
        g.pause();
        break;
      case "resume":
        g.resume();
        break;
      case "home":
        this.closePanel();
        g.home();
        break;
      case "magnet":
        g.magnet();
        break;
      case "collection":
        this.openCollection();
        break;
      case "missions":
        this.openMissions();
        break;
      case "settings":
        this.openSettings();
        break;
      case "help":
        this.openHelp();
        s.tutorial = true;
        g.storage.persist();
        break;
      case "close":
        this.closePanel();
        break;
      case "theme":
        s.theme = value as ThemeId;
        g.storage.persist();
        this.render();
        break;
      case "skin": {
        const outcome = equipSkin(s, value!);
        if (outcome === "funds") this.notice("星星还不够，去天空中收集一些吧");
        else if (outcome === "record")
          this.notice("先达到这件外观的飞行纪录条件");
        else {
          g.storage.persist();
          this.openCollection();
          this.render();
          this.notice("已换上新的羽翼");
        }
        break;
      }
      case "claim":
        if (claimMission(s, value!)) {
          g.storage.persist();
          this.audio.sound("mission");
          this.openMissions();
          this.render();
          this.notice("任务奖励已收进星星口袋");
        }
        break;
      case "mute":
        s.settings.mute = !s.settings.mute;
        g.storage.persist();
        this.audio.updateVolumes();
        this.openSettings();
        break;
      case "motion":
        s.settings.reducedMotion = !s.settings.reducedMotion;
        g.storage.persist();
        this.openSettings();
        break;
      case "reset":
        this.openReset();
        break;
      case "reset-confirm":
        g.home();
        g.storage.reset();
        this.closePanel();
        this.render();
        this.audio.updateVolumes();
        this.notice("本地进度已清空，新的旅程开始了");
        break;
      case "full":
        this.fullscreen();
        break;
    }
  }
  render() {
    const g = this.game,
      s = g.storage.data,
      home = g.phase === "home";
    document.body.dataset.phase = g.phase;
    document.body.dataset.theme = s.theme;
    document.querySelector<HTMLElement>("#home")!.hidden = !home;
    document.querySelector<HTMLElement>("#flight-area")!.hidden = home;
    const homeRoot = document.querySelector<HTMLElement>("#home")!;
    homeRoot.innerHTML = `<header class="masthead"><div class="brand">${icon("bird")}<span>晴空跃行</span></div><div class="pocket" aria-label="星星余额">${icon("star")}<b>${s.balance}</b><span>星星口袋</span></div></header>
      <main class="home-story"><h1>晴空跃行</h1><p class="home-tagline">向云的深处，再飞远一点。</p><p class="home-intro">一双羽翼，一程晴空。<br>穿过浮岛与云海，收集沿途的星光。</p></main>
      <section class="departure" aria-label="选择模式并开始"><div class="mode-tabs" role="group" aria-label="游戏模式"><button data-action="mode" data-value="classic" aria-pressed="${this.mode === "classic"}">${icon("bird")}经典飞行</button><button data-action="mode" data-value="chaos" aria-pressed="${this.mode === "chaos"}">${icon("wind")}混乱气流</button></div><p class="mode-description">${this.mode === "classic" ? "从轻柔的风开始，找到自己的飞行节奏。" : "相同的拍翼手感，迎接移动间隙与起伏航线。"}</p><button class="start-button" data-action="start">${icon("play")}<span>启程飞行</span><span class="start-hint">${this.mode === "classic" ? "经典模式" : "混乱模式"}</span></button><div class="record-line">${icon("crown")}最佳纪录 <strong>${s.best[this.mode]}</strong><span>点击天空 / 空格拍翼</span></div></section>
      <section class="landscapes" aria-label="选择飞行主题"><div class="landscape-title"><span>下一站，想去哪里？</span><span class="scene-caption">${THEMES.find((t) => t.id === s.theme)!.description}</span></div><div class="scene-options">${THEMES.map((t) => `<button class="scene-option ${s.theme === t.id ? "selected" : ""}" data-action="theme" data-value="${t.id}" aria-pressed="${s.theme === t.id}"><span class="scene-thumbnail" style="background-image:url('/art/${t.id}.png')"></span><span>${t.name}</span>${s.theme === t.id ? '<span class="scene-check">已选</span>' : ""}</button>`).join("")}</div></section>
      <nav class="home-nav" aria-label="旅程菜单"><button data-action="collection">${icon("feather")}<span>羽翼收藏</span><small>${s.unlocked.length} / ${SKINS.length}</small></button><button data-action="missions">${icon("task")}<span>飞行任务</span>${this.availableMissions() ? `<small class="claim-dot">${this.availableMissions()} 可领取</small>` : ""}</button><button data-action="help">${icon("help")}<span>如何飞行</span></button><button data-action="settings">${icon("settings")}<span>设置</span></button></nav><div class="home-footnote">${s.tutorial ? "愿每次出发，都遇见好风。" : "第一次远行？点「如何飞行」认识这片天空。"}${!g.storage.available ? "<br>当前浏览器无法保存进度，本次进度仅在页面内保留。" : ""}</div>`;
    const overlay = document.querySelector<HTMLElement>("#overlay")!;
    overlay.className = `game-overlay ${g.phase}`;
    if (g.phase === "ready")
      overlay.innerHTML = `<div class="ready-copy">${icon("feather")}<h2>风已经准备好了</h2><p>点击天空，或按空格起飞</p><span>每按一次，拍动一次翅膀</span><button class="quiet" data-action="home">返回主页</button></div>`;
    else if (g.phase === "paused")
      overlay.innerHTML = `<section class="pause-card"><div class="dialog-art">${icon("bird")}</div><h2>让风等一会儿</h2><p>你的飞行停在这里。<br>准备好后，我们继续出发。</p><button class="primary" data-action="resume">${icon("play")}继续飞行</button><button class="secondary" data-action="home">结束本局并返回</button><p class="small">本局星星与任务进度会保存</p></section>`;
    else if (g.phase === "resuming")
      overlay.innerHTML =
        '<div class="resume-count"><h2 id="countdown">准备好</h2><p>马上回到风里</p></div>';
    else if (g.phase === "result") overlay.innerHTML = this.result();
    else overlay.innerHTML = "";
    this.lastHud = "";
    this.hud();
  }
  private result() {
    const r = this.game.run,
      s = this.game.storage.data;
    return `<section class="result-card"><div class="result-feather">${icon(r.newRecord ? "crown" : "feather")}</div><h2>${r.newRecord ? "新的远航纪录" : "每次出发，都算数"}</h2><p class="result-cause">${r.cause}</p><div class="result-score"><strong>${r.score}</strong><span>穿越障碍</span></div><div class="result-details"><div><span>最佳纪录 · ${r.mode === "classic" ? "经典" : "混乱"}</span><b>${s.best[r.mode]}</b></div><div><span>本局星星</span><b>${icon("star")}+${r.stars}</b></div><div><span>本局最高精准连击</span><b>${r.maxCombo}</b></div><div><span>历史最高精准连击</span><b>${s.maxCombo}</b></div></div><button class="primary" data-action="retry">${icon("play")}再飞一次</button><button class="secondary" data-action="home">回到主页</button><button class="text-button" data-action="missions">查看任务${this.availableMissions() ? ` · ${this.availableMissions()} 项奖励可领取` : ""}</button></section>`;
  }
  hud() {
    const g = this.game,
      r = g.run,
      s = g.storage.data;
    if (g.phase === "home") return;
    const data = JSON.stringify([
      r.score,
      r.stars,
      r.shield,
      r.picked,
      r.combo,
      r.maxCombo,
      r.magnet > 0 ? Math.ceil(r.magnet) : 0,
      r.magnetUsed,
      r.stage,
      g.phase,
    ]);
    if (g.phase === "resuming") {
      const el = document.querySelector("#countdown");
      if (el) el.textContent = g.countdownLabel;
    }
    if (data === this.lastHud) return;
    this.lastHud = data;
    const cfg = difficulty(r.mode, r.score),
      magnetReady = r.picked >= POWERS.magnetEvery && !r.magnetUsed;
    document.querySelector<HTMLElement>("#hud")!.innerHTML =
      `<div class="hud-top"><div class="flight-score"><strong>${r.score}</strong><span>最佳 ${Math.max(s.best[r.mode], r.score)}</span></div><div class="flight-stage"><span>${r.mode === "classic" ? "经典飞行" : "混乱气流"}</span><b>${cfg.name}</b></div><button class="icon-button" data-action="pause" aria-label="暂停游戏" ${g.phase === "flying" || g.phase === "ready" ? "" : "disabled"}>${icon("pause")}</button></div><div class="hud-resources"><div class="hud-stars">${icon("star")}<b>${r.stars}</b></div><div class="hud-shield ${r.shield ? "held" : "empty"}">${icon("shield")}<div><span>${r.shield ? "护盾已持有" : "护盾未持有"}</span><small>${r.shield ? "抵消一次事故" : "拾取护盾获得"}</small></div></div><div class="hud-combo"><b>${r.combo}</b><span>精准连击</span></div></div>`;
    document.querySelector<HTMLElement>("#flight-bottom")!.innerHTML =
      `<span class="best-combo">本局最高连击 ${r.maxCombo}</span><button class="magnet-button ${magnetReady ? "charged" : ""}" data-action="magnet" ${g.phase !== "flying" || !magnetReady ? "disabled" : ""}>${icon("magnet")}<span>${r.magnet > 0 ? `吸引中 ${Math.ceil(r.magnet)} 秒` : r.magnetUsed ? "本局已使用" : magnetReady ? "开启磁铁" : `磁铁 ${Math.min(r.picked, POWERS.magnetEvery)} / ${POWERS.magnetEvery}`}</span><kbd>E</kbd></button>`;
  }
  private availableMissions() {
    const s = this.game.storage.data;
    return MISSIONS.filter(
      (m) => !s.claimed.includes(m.id) && m.value(s) >= m.target,
    ).length;
  }
  private open(title: string, body: string, wide = false) {
    this.panel.className = wide ? "panel wide" : "panel";
    this.panel.innerHTML = `<header class="panel-header"><h2>${title}</h2><button class="icon-button" data-action="close" aria-label="关闭">${icon("close")}</button></header>${body}`;
    if (!this.panel.open) this.panel.showModal();
  }
  private closePanel() {
    if (this.panel.open) this.panel.close();
  }
  private openCollection() {
    const s = this.game.storage.data;
    this.open(
      "给远行，换一双羽翼",
      `<div class="panel-intro"><p>每一双羽翼，都有自己的故事。<br>所有外观拥有相同的飞行能力。</p><div class="collection-balance">${icon("star")}<b>${s.balance}</b></div></div><div class="skin-grid">${SKINS.map(
        (skin) => {
          const owned = s.unlocked.includes(skin.id),
            equipped = s.equipped === skin.id,
            record = Math.max(s.best.classic, s.best.chaos) >= skin.requirement;
          return `<article class="skin-item ${equipped ? "equipped" : ""}"><canvas data-skin="${skin.id}" aria-label="${skin.name}外观预览"></canvas><h3>${skin.name}</h3><p>${skin.subtitle}</p>${skin.requirement ? `<span class="skin-requirement">${record ? "已达成" : "需要"}单局 ${skin.requirement} 分</span>` : ""}<button class="${equipped ? "secondary" : "skin-action"}" data-action="skin" data-value="${skin.id}" ${equipped || (!owned && (!record || s.balance < skin.price)) ? "disabled" : ""}>${equipped ? "当前装备" : owned ? "装备羽翼" : `${icon("star")}${skin.price} 星星解锁`}</button></article>`;
        },
      ).join("")}</div>`,
      true,
    );
    this.panel
      .querySelectorAll<HTMLCanvasElement>("canvas[data-skin]")
      .forEach((canvas) => this.renderer.preview(canvas, canvas.dataset.skin!));
  }
  private openMissions() {
    const s = this.game.storage.data;
    this.open(
      "把每一段飞行，变成成长",
      `<div class="panel-intro"><p>奖励只需领取一次，旅途会一直记得。<br>已领取 ${s.claimed.length} / ${MISSIONS.length} 项任务</p><div class="collection-balance">${icon("star")}<b>${s.balance}</b></div></div><div class="mission-list">${MISSIONS.map(
        (m) => {
          const value = Math.min(m.target, m.value(s)),
            claimed = s.claimed.includes(m.id),
            done = value >= m.target;
          return `<article class="mission-item ${claimed ? "claimed" : ""}"><div class="mission-mark">${icon(claimed ? "feather" : done ? "star" : "task")}</div><div class="mission-copy"><h3>${m.title}</h3><p>${m.description}</p><div class="mission-progress"><i style="width:${(value / m.target) * 100}%"></i></div><small>${value} / ${m.target}</small></div><button class="mission-claim" data-action="claim" data-value="${m.id}" ${claimed || !done ? "disabled" : ""}>${claimed ? "已领取" : done ? "领取奖励" : `${icon("star")} +${m.reward}`}${done && !claimed ? `<small>+${m.reward} 星星</small>` : ""}</button></article>`;
        },
      ).join("")}</div>`,
      true,
    );
  }
  private openSettings() {
    const s = this.game.storage.data.settings;
    this.open(
      "让旅途合你心意",
      `<div class="settings-list"><label for="music">背景音乐 <output id="music-value">${Math.round(s.music * 100)}%</output></label><input id="music" type="range" min="0" max="100" value="${s.music * 100}" aria-label="背景音乐音量"><label for="sfx">飞行音效 <output id="sfx-value">${Math.round(s.sfx * 100)}%</output></label><input id="sfx" type="range" min="0" max="100" value="${s.sfx * 100}" aria-label="飞行音效音量"><button class="setting-row" data-action="mute"><span>${icon("sound")}静音</span><b>${s.mute ? "开启" : "关闭"}</b></button><button class="setting-row" data-action="motion"><span>${icon("wind")}减少环境动态与粒子</span><b>${s.reducedMotion ? "开启" : "关闭"}</b></button><button class="setting-row" data-action="full"><span>${icon("full")}切换全屏</span><b>打开</b></button><div class="settings-note">手机、平板请竖屏游玩。<br>离开页面或旋转屏幕，飞行会自动暂停。<br>${this.game.storage.available ? "进度保存在当前浏览器中。" : "当前浏览器存储不可用，进度暂存在本页面。"}</div><button class="danger-button" data-action="reset">清空本地进度</button></div>`,
    );
    for (const key of ["music", "sfx"] as const)
      this.panel
        .querySelector<HTMLInputElement>(`#${key}`)!
        .addEventListener("input", (e) => {
          const v = Number((e.target as HTMLInputElement).value);
          s[key] = v / 100;
          this.panel.querySelector(`#${key}-value`)!.textContent = `${v}%`;
          this.game.storage.persist();
          this.audio.updateVolumes();
        });
  }
  private openHelp() {
    this.open(
      "第一阵风，从这里开始",
      `<div class="help-content"><div class="help-flight">${icon("bird")}<span>点击天空 / 空格</span><strong>一次按下，一次拍翼</strong></div><p>小鸟会自然下落。轻点屏幕、点击游戏区域或按空格，让它向上拍翼。长按不会连续拍翼。</p><h3>从间隙中，找到自己的节奏</h3><p>通过一组障碍获得 1 分；经过间隙中央 30 像素内，算一次精准穿越。连续 3 次精准获得 1 颗奖励星星，之后每 3 次再奖励。普通通过或触发护盾会中断连击。</p><h3>星光会照顾勇敢的羽翼</h3><p>护盾是独立的青色拾取道具，约每 20～30 组障碍出现一次，角色碰到它才会获得。星星不再给护盾充能；磁铁也不会吸引护盾。最多持有一层，即使重复拾取也不会叠加或存成备用。持盾时不再生成，消耗后重新等待 20～30 组障碍。护盾吸收一次事故并安全复位，提供 2.2 秒保护；淡化的障碍不会伤害你，也不会产生精准连击。</p><p>单局拾取 15 颗场景星星后，可按 E 或点击磁铁，吸引附近星星 8 秒，每局限一次。精准奖励与局外余额不参与磁铁充能。</p><h3>记住天空的边界</h3><p>没有护盾时，撞上障碍、触到地面或飞出上边界都会结束飞行。留在天空中间，给自己多一点调整空间。</p><h3>不同的风，相同的羽翼</h3><p>经典模式从宽松的间隙开始，逐步增加挑战。混乱模式加入缓慢移动的间隙与起伏节奏，拍翼手感始终相同。16 分后挑战逐步加强，80 分、120 分进入额外的后期阶段，难度仍有上限。两种模式的纪录独立保存。</p><p>按 Esc / P 或暂停按钮休息；继续时会有短暂准备提示。手机和平板竖屏游玩，旋转或切后台会暂停。本局星星在结算或结束本局返回时存入口袋，任务奖励需到任务页领取。</p><button class="primary" data-action="close">我准备好了</button></div>`,
    );
  }
  private openReset() {
    this.open(
      "让旅程重新开始？",
      `<div class="reset-content"><p>这会清空当前浏览器中的双模式纪录、星星余额、外观、任务和设置。</p><p>此操作无法撤销。</p><button class="danger-button" data-action="reset-confirm">确认清空全部进度</button><button class="secondary" data-action="settings">保留进度</button></div>`,
    );
  }
  private fullscreen() {
    if (document.fullscreenElement)
      void document
        .exitFullscreen()
        .catch(() => this.notice("当前浏览器无法退出全屏"));
    else if (document.documentElement.requestFullscreen)
      void document.documentElement
        .requestFullscreen()
        .catch(() => this.notice("当前浏览器暂不支持全屏，可以继续游玩"));
    else this.notice("当前浏览器不支持全屏，可以直接竖屏游玩");
  }
}
