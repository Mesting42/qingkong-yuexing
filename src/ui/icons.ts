/** 与游戏道具一致的实心图标；不依赖 Emoji、字体图标或远程图标库。 */
const paths: Record<string, string> = {
  bird: '<path fill="currentColor" d="M3 17Q12 4 23 10L29 13 23 16Q16 25 3 17Z"/><path fill="#f6e8ca" d="M9 14Q6 1 19 5L17 18Z"/><circle cx="23" cy="11" r="1.5" fill="#24475a"/>',
  star: '<path fill="#ecc269" stroke="#fff0ba" stroke-width="1" d="m16 3 4 8 9 1.4-6.5 6.3 1.5 9-8-4.3-8 4.3 1.5-9L3 12.4l9-1.4Z"/>',
  play: '<path fill="currentColor" d="M11 6a2 2 0 0 1 3 0l13 8.3a2 2 0 0 1 0 3.4L14 26a2 2 0 0 1-3-1.7Z"/>',
  pause:
    '<rect x="8" y="6" width="6" height="21" rx="2" fill="currentColor"/><rect x="19" y="6" width="6" height="21" rx="2" fill="currentColor"/>',
  feather:
    '<path fill="currentColor" d="M27 3C10 1 2 11 7 23l9-8-4 9c10-1 18-10 15-21Z"/><path d="m5 29 17-19" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',
  task: '<path fill="currentColor" d="M7 5h18a2 2 0 0 1 2 2v21H5V7a2 2 0 0 1 2-2Z"/><rect x="11" y="2" width="10" height="6" rx="2" fill="#e0ba77"/><path d="m10 17 4 4 8-9" stroke="#fff6df" stroke-width="2.5" fill="none"/>',
  settings:
    '<path fill="currentColor" d="m13 2 6 0 1 5 4 2 4-1 3 5-4 3v4l3 3-3 5-5-2-3 2-1 4h-6l-1-5-4-2-4 1-3-5 4-3v-4l-3-3 3-5 5 2 3-2Z"/><circle cx="16" cy="17" r="5" fill="#d5e4dd"/>',
  help: '<circle cx="16" cy="16" r="13" fill="currentColor"/><path d="M12 11c0-6 12-6 10 0-1 3-6 3-6 7" stroke="#f6efdc" stroke-width="2.8" fill="none"/><circle cx="16" cy="23" r="1.7" fill="#f6efdc"/>',
  close:
    '<path d="m9 9 14 14M23 9 9 23" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',
  shield:
    '<path fill="#91bdc1" stroke="#edf6db" stroke-width="1.5" d="M16 3 28 8v9c0 6-8 12-12 13C12 29 4 23 4 17V8Z"/><path fill="#ecf2cd" d="m16 8 2.5 6 6 .4-4.5 4 1.5 6-5.5-3-5.5 3 1.5-6-4.5-4 6-.4Z"/>',
  magnet:
    '<path fill="#b66d56" d="M4 5h8v12a4 4 0 0 0 8 0V5h8v12a12 12 0 0 1-24 0Z"/><path fill="#f5deac" d="M4 4h8v7H4zm16 0h8v7h-8Z"/>',
  full: '<path d="M4 12V4h8m8 0h8v8M4 20v8h8m8 0h8v-8" stroke="currentColor" stroke-width="3" fill="none"/>',
  sound:
    '<path fill="currentColor" d="M3 12h6l9-8v24l-9-8H3Z"/><path d="M22 10q8 6 0 12" stroke="currentColor" fill="none" stroke-width="2.5"/>',
  crown:
    '<path fill="#dab56e" d="m3 8 8 6 5-11 5 11 8-6-3 19H6Z"/><path d="M7 23h18" stroke="#f8e3a9" stroke-width="2"/>',
  wind: '<path d="M3 11h19c8 0 5-10 0-7M3 17h24c7 0 5 10 0 8M3 23h12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none"/>',
};
export function icon(name: string, className = "") {
  return `<svg class="icon ${className}" viewBox="0 0 32 32" aria-hidden="true">${paths[name] ?? paths.bird}</svg>`;
}
