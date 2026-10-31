export interface GifItem {
  id: string;
  title: string;
  category: string;
  tags: string[];
  url: string;
  previewUrl?: string;
}

export const GIF_CATEGORIES = [
  { id: 'all', name: 'همه', nameKey: 'stickers.pack.all' },
  { id: 'happy', name: 'خنده و شادی', nameKey: 'gifs.category.happy' },
  { id: 'dance', name: 'رقص و جشن', nameKey: 'gifs.category.dance' },
  { id: 'reactions', name: 'واکنش‌ها', nameKey: 'stickers.pack.reactions' },
  { id: 'love', name: 'عشق', nameKey: 'gifs.category.love' },
  { id: 'cats', name: 'حیوانات', nameKey: 'gifs.category.cats' },
];

function animatedSvgDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

export const GIFS: GifItem[] = [
  {
    id: 'gif-dance-party',
    title: 'رقص و شادی',
    category: 'dance',
    tags: ['dance', 'party', 'happy', 'رقص', 'شادی', 'جشن'],
    url: animatedSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="200" height="160">
        <rect width="200" height="160" fill="#6366f1" rx="12"/>
        <g transform="translate(100, 90)">
          <circle cx="0" cy="-40" r="16" fill="#fde047">
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,-8; 0,0" dur="0.6s" repeatCount="indefinite"/>
          </circle>
          <path d="M-8 -38 Q0 -34 8 -38" stroke="#1e1b4b" stroke-width="2.5" fill="none"/>
          <line x1="-20" y1="-20" x2="20" y2="-20" stroke="#fde047" stroke-width="6" stroke-linecap="round">
            <animateTransform attributeName="transform" type="rotate" values="-15; 15; -15" dur="0.6s" repeatCount="indefinite"/>
          </line>
          <line x1="0" y1="-20" x2="0" y2="25" stroke="#fde047" stroke-width="8" stroke-linecap="round"/>
          <line x1="0" y1="25" x2="-18" y2="55" stroke="#fde047" stroke-width="6" stroke-linecap="round">
            <animateTransform attributeName="transform" type="rotate" values="10; -10; 10" dur="0.6s" repeatCount="indefinite"/>
          </line>
          <line x1="0" y1="25" x2="18" y2="55" stroke="#fde047" stroke-width="6" stroke-linecap="round">
            <animateTransform attributeName="transform" type="rotate" values="-10; 10; -10" dur="0.6s" repeatCount="indefinite"/>
          </line>
        </g>
        <circle cx="40" cy="40" r="8" fill="#f43f5e">
          <animate attributeName="opacity" values="0.2;1;0.2" dur="0.8s" repeatCount="indefinite"/>
        </circle>
        <circle cx="160" cy="50" r="10" fill="#a855f7">
          <animate attributeName="opacity" values="1;0.3;1" dur="0.7s" repeatCount="indefinite"/>
        </circle>
        <circle cx="150" cy="120" r="6" fill="#38bdf8">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="0.9s" repeatCount="indefinite"/>
        </circle>
      </svg>
    `),
  },
  {
    id: 'gif-heart-beat',
    title: 'تپش قلب پر از عشق',
    category: 'love',
    tags: ['love', 'heart', 'عشق', 'قلب', 'دوستی'],
    url: animatedSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="200" height="160">
        <rect width="200" height="160" fill="#ec4899" rx="12"/>
        <g transform="translate(100, 80)">
          <path d="M0 -30 Q-40 -65 -60 -25 Q-75 15 0 50 Q75 15 60 -25 Q40 -65 0 -30 Z" fill="#ffffff">
            <animateTransform attributeName="transform" type="scale" values="1; 1.25; 1.05; 1.3; 1" dur="1s" repeatCount="indefinite"/>
          </path>
        </g>
      </svg>
    `),
  },
  {
    id: 'gif-laughing-tears',
    title: 'خنده با اشک شوق',
    category: 'happy',
    tags: ['laugh', 'lol', 'funny', 'خنده', 'شاد', 'جوک'],
    url: animatedSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="200" height="160">
        <rect width="200" height="160" fill="#f59e0b" rx="12"/>
        <g transform="translate(100, 80)">
          <circle cx="0" cy="0" r="50" fill="#fde047">
            <animateTransform attributeName="transform" type="rotate" values="-5; 5; -5" dur="0.4s" repeatCount="indefinite"/>
          </circle>
          <path d="M-30 -10 Q-20 -25 -10 -10" stroke="#78350f" stroke-width="5" fill="none" stroke-linecap="round"/>
          <path d="M10 -10 Q20 -25 30 -10" stroke="#78350f" stroke-width="5" fill="none" stroke-linecap="round"/>
          <path d="M-30 10 Q0 50 30 10 Z" fill="#78350f"/>
          <ellipse cx="0" cy="22" rx="16" ry="10" fill="#ef4444"/>
          <path d="M-38 2 Q-46 15 -38 28 Q-30 15 -38 2 Z" fill="#38bdf8">
            <animateTransform attributeName="transform" type="translate" values="0,0; -5,8; 0,0" dur="0.5s" repeatCount="indefinite"/>
          </path>
          <path d="M38 2 Q46 15 38 28 Q30 15 38 2 Z" fill="#38bdf8">
            <animateTransform attributeName="transform" type="translate" values="0,0; 5,8; 0,0" dur="0.5s" repeatCount="indefinite"/>
          </path>
        </g>
      </svg>
    `),
  },
  {
    id: 'gif-thumbs-up-clap',
    title: 'عالی و تشویق',
    category: 'reactions',
    tags: ['yes', 'thumbs up', 'clap', 'bravo', 'عالی', 'لایک', 'تشویق'],
    url: animatedSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="200" height="160">
        <rect width="200" height="160" fill="#10b981" rx="12"/>
        <g transform="translate(100, 80)">
          <circle cx="0" cy="0" r="46" fill="#34d399"/>
          <path d="M-15 15 L-5 25 L25 -15" stroke="#ffffff" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <animateTransform attributeName="transform" type="scale" values="0.9; 1.15; 0.9" dur="0.7s" repeatCount="indefinite"/>
          </path>
        </g>
      </svg>
    `),
  },
  {
    id: 'gif-cat-vibe',
    title: 'گربه متحرک ریتمیک',
    category: 'cats',
    tags: ['cat', 'vibe', 'music', 'cute', 'گربه', 'موزیک', 'ریتم'],
    url: animatedSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="200" height="160">
        <rect width="200" height="160" fill="#8b5cf6" rx="12"/>
        <g transform="translate(100, 90)">
          <animateTransform attributeName="transform" type="translate" values="100,90; 100,82; 100,90" dur="0.4s" repeatCount="indefinite"/>
          <polygon points="-35,-45 -18,-20 -40,-15" fill="#f1f5f9"/>
          <polygon points="35,-45 40,-15 18,-20" fill="#f1f5f9"/>
          <circle cx="0" cy="0" r="42" fill="#ffffff"/>
          <ellipse cx="-16" cy="-6" rx="5" ry="8" fill="#1e293b"/>
          <ellipse cx="16" cy="-6" rx="5" ry="8" fill="#1e293b"/>
          <polygon points="0,6 -4,2 4,2" fill="#f43f5e"/>
          <path d="M-8 10 Q0 15 8 10" stroke="#1e293b" stroke-width="2.5" fill="none"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'gif-mind-blown',
    title: 'مغز منفجر شده و شگفت‌زده',
    category: 'reactions',
    tags: ['wow', 'mind blown', 'shock', 'واو', 'شگفت', 'انفجار'],
    url: animatedSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="200" height="160">
        <rect width="200" height="160" fill="#f97316" rx="12"/>
        <g transform="translate(100, 85)">
          <path d="M-30 -25 Q-40 -50 0 -55 Q40 -50 30 -25 Z" fill="#ef4444">
            <animateTransform attributeName="transform" type="scale" values="1; 1.4; 1" dur="0.6s" repeatCount="indefinite"/>
          </path>
          <circle cx="0" cy="5" r="44" fill="#fbbf24"/>
          <circle cx="-16" cy="0" r="8" fill="#ffffff"/>
          <circle cx="16" cy="0" r="8" fill="#ffffff"/>
          <circle cx="-16" cy="0" r="4" fill="#0f172a"/>
          <circle cx="16" cy="0" r="4" fill="#0f172a"/>
          <ellipse cx="0" cy="24" rx="12" ry="16" fill="#0f172a"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'gif-celebrate-confetti',
    title: 'جشن و کانفتی',
    category: 'dance',
    tags: ['celebrate', 'party', 'confetti', 'جشن', 'تولد', 'مبارک'],
    url: animatedSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="200" height="160">
        <rect width="200" height="160" fill="#0ea5e9" rx="12"/>
        <g transform="translate(100, 95)">
          <polygon points="0,-40 -25,20 25,20" fill="#f59e0b">
            <animateTransform attributeName="transform" type="rotate" values="-15; 15; -15" dur="0.8s" repeatCount="indefinite"/>
          </polygon>
          <circle cx="-40" cy="-30" r="5" fill="#f43f5e">
            <animate attributeName="cy" values="-30; -50; -30" dur="0.7s" repeatCount="indefinite"/>
          </circle>
          <circle cx="35" cy="-25" r="6" fill="#a855f7">
            <animate attributeName="cy" values="-25; -45; -25" dur="0.6s" repeatCount="indefinite"/>
          </circle>
          <rect x="-10" y="-60" width="8" height="8" fill="#eab308">
            <animateTransform attributeName="transform" type="rotate" values="0; 360" dur="1s" repeatCount="indefinite"/>
          </rect>
        </g>
      </svg>
    `),
  },
  {
    id: 'gif-no-way',
    title: 'نه امکان نداره',
    category: 'reactions',
    tags: ['no', 'nope', 'refuse', 'نه', 'خیر'],
    url: animatedSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="200" height="160">
        <rect width="200" height="160" fill="#ef4444" rx="12"/>
        <g transform="translate(100, 80)">
          <circle cx="0" cy="0" r="45" fill="#fee2e2"/>
          <line x1="-22" y1="-22" x2="22" y2="22" stroke="#dc2626" stroke-width="8" stroke-linecap="round"/>
          <line x1="22" y1="-22" x2="-22" y2="22" stroke="#dc2626" stroke-width="8" stroke-linecap="round"/>
          <animateTransform attributeName="transform" type="rotate" values="-10; 10; -10" dur="0.3s" repeatCount="indefinite"/>
        </g>
      </svg>
    `),
  },
];
