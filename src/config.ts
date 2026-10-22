import type { Mode, Theme, Skin } from "./types";

/** 手感只在此定义；屏幕大小、外观、模式均不能改写拍翼能力。 */
export const WORLD = {
  width: 432,
  height: 768,
  floor: 748,
  playerX: 112,
  rx: 14,
  ry: 11,
  step: 1 / 120,
};
export const FLIGHT = { gravity: 840, impulse: -302, terminal: 500 };
export const POWERS = {
  shieldGateMin: 20,
  shieldGateMax: 30,
  magnetEvery: 15,
  magnetSeconds: 8,
  recoverySeconds: 2.2,
  magnetRadius: 190,
};
export const THEMES: Theme[] = [
  {
    id: "bay",
    name: "晨光海湾",
    description: "海风托起第一片羽毛",
    sky: ["#80bdce", "#cce8e6", "#f9e6bc"],
    mountains: "#9bbfc7",
    middle: "#6a9daa",
    rock: "#d2c9af",
    shadow: "#879c98",
    grass: "#6d9b87",
    sun: "#fff1bd",
  },
  {
    id: "forest",
    name: "林间浮岛",
    description: "从树梢，飞向更远的绿意",
    sky: ["#7fb9b3", "#cee0bc", "#f0e6b6"],
    mountains: "#8cb5a0",
    middle: "#538b7d",
    rock: "#ae9980",
    shadow: "#655f57",
    grass: "#4e8866",
    sun: "#fff0b3",
  },
  {
    id: "snow",
    name: "雪峰云海",
    description: "雪线之上，天空格外安静",
    sky: ["#819fca", "#c7d7ed", "#f1ecf2"],
    mountains: "#a9b9d5",
    middle: "#7b98bd",
    rock: "#d1e7ed",
    shadow: "#7895b4",
    grass: "#f1f8fa",
    sun: "#fff2da",
  },
  {
    id: "sunset",
    name: "暖色落日",
    description: "把最后一束日光带回家",
    sky: ["#9f9ec2", "#e5b4b2", "#f9d6ad"],
    mountains: "#b494ae",
    middle: "#947b98",
    rock: "#d5a38a",
    shadow: "#9b7779",
    grass: "#b98e82",
    sun: "#ffe7aa",
  },
];
export const SKINS: Skin[] = [
  {
    id: "dawn",
    name: "初晴",
    subtitle: "迎风的蓝翼小候鸟",
    price: 0,
    body: "#f5eadd",
    wing: "#467f95",
    dark: "#284c62",
    accent: "#e5ad69",
    feature: "swallow",
    requirement: 0,
  },
  {
    id: "fern",
    name: "林间信使",
    subtitle: "叶冠与短尾，捎来森林的信",
    price: 18,
    body: "#ece6b9",
    wing: "#668b65",
    dark: "#365e4d",
    accent: "#b6be71",
    feature: "crest",
    requirement: 0,
  },
  {
    id: "scarf",
    name: "暖风旅人",
    subtitle: "系一条随风飘动的红围巾",
    price: 28,
    body: "#f1d9bb",
    wing: "#ac7454",
    dark: "#6f4b45",
    accent: "#c76650",
    feature: "scarf",
    requirement: 0,
  },
  {
    id: "ribbon",
    name: "云上来信",
    subtitle: "蓝色缎带与圆润的翼尖",
    price: 40,
    body: "#f4e9f1",
    wing: "#9691b5",
    dark: "#605d83",
    accent: "#70aebf",
    feature: "ribbon",
    requirement: 0,
  },
  {
    id: "comet",
    name: "流星尾羽",
    subtitle: "修长尾羽，划过金色天际",
    price: 55,
    body: "#efe2c4",
    wing: "#788ca3",
    dark: "#4d617e",
    accent: "#e2b875",
    feature: "longtail",
    requirement: 0,
  },
  {
    id: "explorer",
    name: "远行家",
    subtitle: "带上小帽，去未曾到过的岛",
    price: 65,
    body: "#eddbbd",
    wing: "#8b8968",
    dark: "#535f56",
    accent: "#aa7b53",
    feature: "cap",
    requirement: 0,
  },
  {
    id: "blossom",
    name: "春日花羽",
    subtitle: "花瓣羽冠与柔软的扇形尾",
    price: 75,
    body: "#f2d9d2",
    wing: "#c08b99",
    dark: "#835966",
    accent: "#edbf8d",
    feature: "petal",
    requirement: 0,
  },
  {
    id: "pilot",
    name: "追风飞行员",
    subtitle: "护目镜下，是好奇的眼睛",
    price: 90,
    body: "#e7dfca",
    wing: "#657f88",
    dark: "#354b5c",
    accent: "#c18f54",
    feature: "goggles",
    requirement: 20,
  },
  {
    id: "crown",
    name: "日光领航者",
    subtitle: "金色羽冠，赠给坚定的旅途",
    price: 120,
    body: "#f7e8bd",
    wing: "#bb915e",
    dark: "#7c6049",
    accent: "#e7bb58",
    feature: "crown",
    requirement: 40,
  },
];

/** 难度有上限。生成器冻结每一组的参数，已进入视野的门不会收窄或加速。 */
export function difficulty(mode: Mode, score: number) {
  const stage =
    score < 6
      ? 0
      : score < 16
        ? 1
        : score < 30
          ? 2
          : score < 50
            ? 3
            : score < 80
              ? 4
              : score < 120
                ? 5
                : 6;
  return {
    stage,
    name: [
      "初起的风",
      "渐入云间",
      "群岛穿行",
      "追风远航",
      "晴空领航",
      "长风试炼",
      "云巅挑战",
    ][stage],
    speed: [140, 155, 178, 202, 224, 240, 250][stage],
    gap:
      [236, 224, 206, 188, 174, 166, 160][stage] - (mode === "chaos" ? 6 : 0),
    distance: [272, 277, 286, 296, 306, 316, 324][stage],
  };
}
