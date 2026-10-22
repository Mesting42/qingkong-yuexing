import { SKINS } from "../config";
import type { Save } from "../types";

/** 外观交易先检查全部条件，再单次扣款；已解锁时仅装备，不会再次消费。 */
export function equipSkin(
  save: Save,
  id: string,
): "equipped" | "funds" | "record" | "invalid" {
  const skin = SKINS.find((s) => s.id === id);
  if (!skin) return "invalid";
  if (!save.unlocked.includes(id)) {
    if (Math.max(save.best.classic, save.best.chaos) < skin.requirement)
      return "record";
    if (save.balance < skin.price) return "funds";
    save.balance -= skin.price;
    save.unlocked.push(id);
  }
  save.equipped = id;
  return "equipped";
}
