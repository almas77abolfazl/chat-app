export interface StickerItem {
  id: string;
  name: string;
  nameKey?: string;
  pack: string;
  url: string;
}

export interface StickerPack {
  id: string;
  name: string;
  nameKey?: string;
  icon: string;
}

export const STICKER_PACKS: StickerPack[] = [
  { id: 'all', name: 'همه', nameKey: 'stickers.pack.all', icon: '🌟' },
  { id: 'panda', name: 'پاندا', nameKey: 'stickers.pack.panda', icon: '🐼' },
  { id: 'cat', name: 'گربه', nameKey: 'stickers.pack.cat', icon: '🐱' },
  { id: 'reactions', name: 'واکنش‌ها', nameKey: 'stickers.pack.reactions', icon: '🔥' },
];

function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

export const STICKERS: StickerItem[] = [
  // Panda Pack
  {
    id: 'panda-happy',
    name: 'پاندا خوشحال',
    pack: 'panda',
    url: svgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <circle cx="32" cy="30" r="18" fill="#1e293b"/>
        <circle cx="88" cy="30" r="18" fill="#1e293b"/>
        <circle cx="60" cy="65" r="44" fill="#ffffff" stroke="#e2e8f0" stroke-width="3"/>
        <ellipse cx="44" cy="58" rx="10" ry="14" fill="#1e293b"/>
        <ellipse cx="76" cy="58" rx="10" ry="14" fill="#1e293b"/>
        <circle cx="46" cy="54" r="4" fill="#ffffff"/>
        <circle cx="78" cy="54" r="4" fill="#ffffff"/>
        <ellipse cx="60" cy="72" rx="7" ry="5" fill="#0f172a"/>
        <path d="M52 78 Q60 88 68 78" stroke="#0f172a" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <circle cx="34" cy="70" r="6" fill="#f43f5e" opacity="0.45"/>
        <circle cx="86" cy="70" r="6" fill="#f43f5e" opacity="0.45"/>
      </svg>
    `),
  },
  {
    id: 'panda-love',
    name: 'پاندا عاشق',
    pack: 'panda',
    url: svgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <circle cx="32" cy="30" r="18" fill="#1e293b"/>
        <circle cx="88" cy="30" r="18" fill="#1e293b"/>
        <circle cx="60" cy="65" r="44" fill="#ffffff" stroke="#fbcfe8" stroke-width="3"/>
        <path d="M44 50 Q36 42 40 58 Q44 64 44 66 Q44 64 48 58 Q52 42 44 50 Z" fill="#ef4444"/>
        <path d="M76 50 Q68 42 72 58 Q76 64 76 66 Q76 64 80 58 Q84 42 76 50 Z" fill="#ef4444"/>
        <ellipse cx="60" cy="72" rx="6" ry="4" fill="#0f172a"/>
        <path d="M53 79 Q60 86 67 79" stroke="#0f172a" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="33" cy="69" r="7" fill="#fb7185" opacity="0.5"/>
        <circle cx="87" cy="69" r="7" fill="#fb7185" opacity="0.5"/>
      </svg>
    `),
  },
  {
    id: 'panda-cool',
    name: 'پاندا باحال',
    pack: 'panda',
    url: svgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <circle cx="32" cy="30" r="18" fill="#1e293b"/>
        <circle cx="88" cy="30" r="18" fill="#1e293b"/>
        <circle cx="60" cy="65" r="44" fill="#ffffff" stroke="#cbd5e1" stroke-width="3"/>
        <path d="M30 52 L56 52 L52 64 L34 64 Z" fill="#0f172a"/>
        <path d="M64 52 L90 52 L86 64 L68 64 Z" fill="#0f172a"/>
        <line x1="56" y1="55" x2="64" y2="55" stroke="#0f172a" stroke-width="3"/>
        <line x1="33" y1="55" x2="48" y2="61" stroke="#38bdf8" stroke-width="1.5"/>
        <line x1="67" y1="55" x2="82" y2="61" stroke="#38bdf8" stroke-width="1.5"/>
        <ellipse cx="60" cy="74" rx="6" ry="4" fill="#0f172a"/>
        <path d="M55 81 Q64 85 70 80" stroke="#0f172a" stroke-width="3" fill="none" stroke-linecap="round"/>
      </svg>
    `),
  },
  {
    id: 'panda-cry',
    name: 'پاندا گریون',
    pack: 'panda',
    url: svgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <circle cx="32" cy="30" r="18" fill="#1e293b"/>
        <circle cx="88" cy="30" r="18" fill="#1e293b"/>
        <circle cx="60" cy="65" r="44" fill="#ffffff" stroke="#93c5fd" stroke-width="3"/>
        <ellipse cx="44" cy="58" rx="10" ry="14" fill="#1e293b"/>
        <ellipse cx="76" cy="58" rx="10" ry="14" fill="#1e293b"/>
        <path d="M40 56 Q44 60 48 56" stroke="#ffffff" stroke-width="2.5" fill="none"/>
        <path d="M72 56 Q76 60 80 56" stroke="#ffffff" stroke-width="2.5" fill="none"/>
        <path d="M42 66 Q40 85 43 92" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" fill="none"/>
        <path d="M78 66 Q80 85 77 92" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" fill="none"/>
        <ellipse cx="60" cy="73" rx="6" ry="4" fill="#0f172a"/>
        <path d="M54 84 Q60 78 66 84" stroke="#0f172a" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      </svg>
    `),
  },

  // Cat Pack
  {
    id: 'cat-happy',
    name: 'گربه ملوس',
    pack: 'cat',
    url: svgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <polygon points="30,22 48,46 22,50" fill="#f59e0b"/>
        <polygon points="90,22 98,50 72,46" fill="#f59e0b"/>
        <polygon points="32,27 44,44 26,48" fill="#fecdd3"/>
        <polygon points="88,27 94,48 76,44" fill="#fecdd3"/>
        <circle cx="60" cy="66" r="42" fill="#fbbf24"/>
        <ellipse cx="45" cy="60" rx="6" ry="9" fill="#1e293b"/>
        <ellipse cx="75" cy="60" rx="6" ry="9" fill="#1e293b"/>
        <circle cx="47" cy="57" r="2.5" fill="#ffffff"/>
        <circle cx="77" cy="57" r="2.5" fill="#ffffff"/>
        <polygon points="60,70 56,66 64,66" fill="#f43f5e"/>
        <path d="M54 72 Q60 76 60 71 Q60 76 66 72" stroke="#1e293b" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <line x1="20" y1="64" x2="36" y2="67" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
        <line x1="20" y1="73" x2="36" y2="72" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
        <line x1="100" y1="64" x2="84" y2="67" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
        <line x1="100" y1="73" x2="84" y2="72" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
        <circle cx="36" cy="71" r="5" fill="#f43f5e" opacity="0.4"/>
        <circle cx="84" cy="71" r="5" fill="#f43f5e" opacity="0.4"/>
      </svg>
    `),
  },
  {
    id: 'cat-love',
    name: 'گربه قلبی',
    pack: 'cat',
    url: svgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <polygon points="30,22 48,46 22,50" fill="#f472b6"/>
        <polygon points="90,22 98,50 72,46" fill="#f472b6"/>
        <circle cx="60" cy="66" r="42" fill="#fbcfe8"/>
        <path d="M45 52 Q38 45 42 60 Q45 65 45 67 Q45 65 48 60 Q52 45 45 52 Z" fill="#e11d48"/>
        <path d="M75 52 Q68 45 72 60 Q75 65 75 67 Q75 65 78 60 Q82 45 75 52 Z" fill="#e11d48"/>
        <polygon points="60,71 56,67 64,67" fill="#be123c"/>
        <path d="M55 73 Q60 77 65 73" stroke="#881337" stroke-width="2" fill="none" stroke-linecap="round"/>
      </svg>
    `),
  },
  {
    id: 'cat-surprised',
    name: 'گربه شگفت‌زده',
    pack: 'cat',
    url: svgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <polygon points="30,22 48,46 22,50" fill="#a855f7"/>
        <polygon points="90,22 98,50 72,46" fill="#a855f7"/>
        <circle cx="60" cy="66" r="42" fill="#c084fc"/>
        <circle cx="44" cy="58" r="10" fill="#ffffff"/>
        <circle cx="76" cy="58" r="10" fill="#ffffff"/>
        <circle cx="44" cy="58" r="5" fill="#1e1b4b"/>
        <circle cx="76" cy="58" r="5" fill="#1e1b4b"/>
        <ellipse cx="60" cy="77" rx="7" ry="9" fill="#1e1b4b"/>
      </svg>
    `),
  },
  {
    id: 'cat-sleepy',
    name: 'گربه خواب‌آلود',
    pack: 'cat',
    url: svgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <polygon points="30,26 48,48 22,52" fill="#94a3b8"/>
        <polygon points="90,26 98,52 72,48" fill="#94a3b8"/>
        <circle cx="60" cy="68" r="42" fill="#cbd5e1"/>
        <path d="M38 60 Q44 65 50 60" stroke="#334155" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M70 60 Q76 65 82 60" stroke="#334155" stroke-width="3" fill="none" stroke-linecap="round"/>
        <polygon points="60,68 57,65 63,65" fill="#f43f5e"/>
        <text x="82" y="42" font-size="16" font-weight="bold" fill="#64748b" font-family="sans-serif">z</text>
        <text x="94" y="30" font-size="20" font-weight="bold" fill="#64748b" font-family="sans-serif">Z</text>
      </svg>
    `),
  },

  // Reactions Pack
  {
    id: 'reaction-fire',
    name: 'آتشین و داغ',
    pack: 'reactions',
    url: svgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <path d="M60 15 Q75 35 70 50 Q85 45 92 65 Q100 85 85 102 Q70 115 50 110 Q28 105 25 80 Q22 62 40 45 Q48 38 48 28 Q52 24 60 15 Z" fill="url(#fireGrad)"/>
        <path d="M60 45 Q70 58 68 70 Q78 68 80 80 Q82 92 72 98 Q60 105 50 100 Q38 95 38 82 Q38 72 50 60 Q54 56 60 45 Z" fill="#fbbf24"/>
        <path d="M60 70 Q66 78 64 85 Q70 85 68 92 Q62 98 55 94 Q48 90 50 82 Q52 76 60 70 Z" fill="#ffffff"/>
        <defs>
          <linearGradient id="fireGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#f97316"/>
            <stop offset="50%" stop-color="#ef4444"/>
            <stop offset="100%" stop-color="#dc2626"/>
          </linearGradient>
        </defs>
      </svg>
    `),
  },
  {
    id: 'reaction-rocket',
    name: 'موشک پرواز',
    pack: 'reactions',
    url: svgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <path d="M85 20 Q95 50 75 75 L45 45 Q70 25 85 20 Z" fill="#e2e8f0"/>
        <path d="M85 20 Q90 35 80 45 L75 40 Q85 30 85 20 Z" fill="#ef4444"/>
        <circle cx="68" cy="48" r="8" fill="#38bdf8" stroke="#0284c7" stroke-width="2"/>
        <polygon points="45,45 35,50 38,62" fill="#ef4444"/>
        <polygon points="75,75 70,85 58,82" fill="#ef4444"/>
        <polygon points="45,75 35,85 40,95" fill="#f97316"/>
        <path d="M40 70 L20 95 L30 105 L50 80 Z" fill="url(#exhaustGrad)" opacity="0.9"/>
        <defs>
          <linearGradient id="exhaustGrad" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#f59e0b"/>
            <stop offset="100%" stop-color="#ef4444"/>
          </linearGradient>
        </defs>
      </svg>
    `),
  },
  {
    id: 'reaction-trophy',
    name: 'جام قهرمانی',
    pack: 'reactions',
    url: svgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <path d="M35 25 L85 25 L80 65 Q80 80 60 80 Q40 80 40 65 Z" fill="#eab308" stroke="#ca8a04" stroke-width="2"/>
        <path d="M35 32 Q20 35 22 52 Q24 64 38 62" stroke="#ca8a04" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M85 32 Q100 35 98 52 Q96 64 82 62" stroke="#ca8a04" stroke-width="4" fill="none" stroke-linecap="round"/>
        <rect x="54" y="80" width="12" height="16" fill="#ca8a04"/>
        <rect x="38" y="96" width="44" height="12" rx="4" fill="#713f12"/>
        <circle cx="60" cy="50" r="10" fill="#fef08a"/>
        <polygon points="60,43 62,48 67,49 63,53 64,58 60,55 56,58 57,53 53,49 58,48" fill="#ca8a04"/>
      </svg>
    `),
  },
  {
    id: 'reaction-100',
    name: 'صد درصد عالی',
    pack: 'reactions',
    url: svgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <circle cx="60" cy="60" r="48" fill="#ef4444"/>
        <text x="60" y="66" font-size="34" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="Arial, sans-serif">100</text>
        <line x1="28" y1="80" x2="92" y2="80" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
        <line x1="28" y1="88" x2="92" y2="88" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
      </svg>
    `),
  },
];
