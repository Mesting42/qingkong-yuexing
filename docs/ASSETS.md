# 素材与原创实现记录

所有正式资源均打包在项目中，游戏运行时不连接图片、字体、音频或 AI 服务。

## 原创远景

使用内置 imagegen 工具生成，分别保存为：

- `public/art/bay.png`：晨光海湾。
- `public/art/forest.png`：林间浮岛。
- `public/art/snow.png`：雪峰云海。
- `public/art/sunset.png`：暖色落日。

没有使用参考游戏的源码、图片、角色或名称。远景图不是碰撞地图；云层、粒子、角色、星星、道具和障碍由 `src/render/` 独立绘制并动画。

共同生成提示词：

```text
Use case: illustration-story. Asset type: original high quality animated film
matte painting, landscape wide game background for an original casual bird
flying game. Composition: expansive open sky occupies upper 65 percent and
center; islands and scenery mostly bottom third and outer sides, soft distant
silhouettes, inviting sense of airy journey. Detailed painterly natural forms,
polished stylized feature-animation environment, rounded sculptural clouds
with subtle brush texture and nuanced lighting, restrained saturated natural
colors. Environment only, no characters, no birds, no foreground gameplay
obstacles, no typography, no UI, no watermark. Wide landscape 1536x1024 or wider.
```

四种场景分别在上述提示词中加入：

```text
bay: Morning bay: turquoise blue sky, ivory sunlit cumulus, turquoise sea far
below, ancient floating limestone islands topped with meadow, one graceful
weathered stone arch at lower far right. Pale gold dawn.

forest: Forest sky islands: layered deep jade woodland crowns on floating
mossy earth islands, sun shafts through soft sage clouds, trailing vines,
hazy green valleys. Trees with real volume and individual foliage.
No stone bay structures.

snow: Snow mountain sea of clouds: towering remote alpine peaks, ice-blue
floating crystal cliffs on outer edges, white windblown snow ridges,
lavender blue atmospheric perspective, pearl light.

sunset: Sunset sky archipelago: warm amber and dusky rose sky, apricot clouds,
distant violet mesas, floating red sandstone islands with eroded arch
formations at the lower edges, golden grass, small late afternoon sun.
```

## 角色、道具和图标

`src/render/art.ts` 中的候鸟、翅羽、尾羽、外观配饰、星星、云层与障碍均为本项目原创 Canvas 绘制。`src/ui/icons.ts` 与 favicon 为本项目原创 SVG。角色并非 Emoji 或纯色圆形；所有外观共用基础碰撞尺寸。

## 字体

标题采用开源 **Ma Shan Zheng** 的本地字形子集，字库来源为 Google Fonts。原始名称按许可保留，文件名为 `public/fonts/journey-display.ttf`。完整 SIL Open Font License 位于 `public/fonts/OFL.txt`。

官方源码与许可：[google/fonts 的 Ma Shan Zheng](https://github.com/google/fonts/tree/main/ofl/mashanzheng)。

正文使用系统中文字体，不下载外部资源。标题子集仅覆盖当前标题及短句，增加新标题时可重新生成合法子集或使用正文回退字体。

## 音乐与音效

`src/systems/audio.ts` 中定义原创乐句与合成音色，使用 Web Audio 原生 API。没有引用录音、商业歌曲或外部音频。音乐与音效独立总线，音源按时释放，暂停销毁排队短音。
