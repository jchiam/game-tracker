export interface Character {
  id: string;
  name: string;
  path: string;
  element: string;
  imageUrl: string;
}

export const ALL_CHARACTERS: Character[] = [
  // 5-Stars
  { id: 'acheron', name: 'Acheron', path: 'Nihility', element: 'Lightning', imageUrl: '/assets/characters/acheron.webp' },
  { id: 'argent', name: 'Argenti', path: 'Erudition', element: 'Physical', imageUrl: '/assets/characters/argent.webp' },
  { id: 'aventurine', name: 'Aventurine', path: 'Preservation', element: 'Imaginary', imageUrl: '/assets/characters/aventurine.webp' },
  { id: 'bailu', name: 'Bailu', path: 'Abundance', element: 'Lightning', imageUrl: '/assets/characters/bailu.webp' },
  { id: 'black_swan', name: 'Black Swan', path: 'Nihility', element: 'Wind', imageUrl: '/assets/characters/black_swan.webp' },
  { id: 'blade', name: 'Blade', path: 'Destruction', element: 'Wind', imageUrl: '/assets/characters/blade.webp' },
  { id: 'bronya', name: 'Bronya', path: 'Harmony', element: 'Wind', imageUrl: '/assets/characters/bronya.webp' },
  { id: 'clara', name: 'Clara', path: 'Destruction', element: 'Physical', imageUrl: '/assets/characters/clara.webp' },
  { id: 'dan_heng_il', name: 'Dan Heng • Imbibitor Lunae', path: 'Destruction', element: 'Imaginary', imageUrl: '/assets/characters/dan_heng_il.webp' },
  { id: 'dr_ratio', name: 'Dr. Ratio', path: 'Hunt', element: 'Imaginary', imageUrl: '/assets/characters/dr_ratio.webp' },
  { id: 'firefly', name: 'Firefly', path: 'Destruction', element: 'Fire', imageUrl: '/assets/characters/firefly.webp' },
  { id: 'fu_xuan', name: 'Fu Xuan', path: 'Preservation', element: 'Quantum', imageUrl: '/assets/characters/fu_xuan.webp' },
  { id: 'gepard', name: 'Gepard', path: 'Preservation', element: 'Ice', imageUrl: '/assets/characters/gepard.webp' },
  { id: 'himeko', name: 'Himeko', path: 'Erudition', element: 'Fire', imageUrl: '/assets/characters/himeko.webp' },
  { id: 'huohuo', name: 'Huohuo', path: 'Abundance', element: 'Wind', imageUrl: '/assets/characters/huohuo.webp' },
  { id: 'jing_yuan', name: 'Jing Yuan', path: 'Erudition', element: 'Lightning', imageUrl: '/assets/characters/jing_yuan.webp' },
  { id: 'jingliu', name: 'Jingliu', path: 'Destruction', element: 'Ice', imageUrl: '/assets/characters/jingliu.webp' },
  { id: 'kafka', name: 'Kafka', path: 'Nihility', element: 'Lightning', imageUrl: '/assets/characters/kafka.webp' },
  { id: 'luocha', name: 'Luocha', path: 'Abundance', element: 'Imaginary', imageUrl: '/assets/characters/luocha.webp' },
  { id: 'ruan_mei', name: 'Ruan Mei', path: 'Harmony', element: 'Ice', imageUrl: '/assets/characters/ruan_mei.webp' },
  { id: 'seele', name: 'Seele', path: 'Hunt', element: 'Quantum', imageUrl: '/assets/characters/seele.webp' },
  { id: 'silver_wolf', name: 'Silver Wolf', path: 'Nihility', element: 'Quantum', imageUrl: '/assets/characters/silver_wolf.webp' },
  { id: 'sparkle', name: 'Sparkle', path: 'Harmony', element: 'Quantum', imageUrl: '/assets/characters/sparkle.webp' },
  { id: 'topaz', name: 'Topaz & Numby', path: 'Hunt', element: 'Fire', imageUrl: '/assets/characters/topaz.webp' },
  { id: 'welt', name: 'Welt', path: 'Nihility', element: 'Imaginary', imageUrl: '/assets/characters/welt.webp' },
  { id: 'yanqing', name: 'Yanqing', path: 'Hunt', element: 'Ice', imageUrl: '/assets/characters/yanqing.webp' },
  
  // 4-Stars
  { id: 'arlan', name: 'Arlan', path: 'Destruction', element: 'Lightning', imageUrl: '/assets/characters/arlan.webp' },
  { id: 'asta', name: 'Asta', path: 'Harmony', element: 'Fire', imageUrl: '/assets/characters/asta.webp' },
  { id: 'dan_heng', name: 'Dan Heng', path: 'Hunt', element: 'Wind', imageUrl: '/assets/characters/dan_heng.webp' },
  { id: 'gallagher', name: 'Gallagher', path: 'Abundance', element: 'Fire', imageUrl: '/assets/characters/gallagher.webp' },
  { id: 'guinaifen', name: 'Guinaifen', path: 'Nihility', element: 'Fire', imageUrl: '/assets/characters/guinaifen.webp' },
  { id: 'hanya', name: 'Hanya', path: 'Harmony', element: 'Physical', imageUrl: '/assets/characters/hanya.webp' },
  { id: 'herta', name: 'Herta', path: 'Erudition', element: 'Ice', imageUrl: '/assets/characters/herta.webp' },
  { id: 'hook', name: 'Hook', path: 'Destruction', element: 'Fire', imageUrl: '/assets/characters/hook.webp' },
  { id: 'luka', name: 'Luka', path: 'Nihility', element: 'Physical', imageUrl: '/assets/characters/luka.webp' },
  { id: 'lynx', name: 'Lynx', path: 'Abundance', element: 'Quantum', imageUrl: '/assets/characters/lynx.webp' },
  { id: 'march_7th', name: 'March 7th', path: 'Preservation', element: 'Ice', imageUrl: '/assets/characters/march_7th.webp' },
  { id: 'march_7th_hunt', name: 'March 7th (Hunt)', path: 'Hunt', element: 'Imaginary', imageUrl: '/assets/characters/march_7th_hunt.webp' },
  { id: 'misha', name: 'Misha', path: 'Destruction', element: 'Ice', imageUrl: '/assets/characters/misha.webp' },
  { id: 'moze', name: 'Moze', path: 'Hunt', element: 'Lightning', imageUrl: '/assets/characters/moze.webp' },
  { id: 'natasha', name: 'Natasha', path: 'Abundance', element: 'Physical', imageUrl: '/assets/characters/natasha.webp' },
  { id: 'pela', name: 'Pela', path: 'Nihility', element: 'Ice', imageUrl: '/assets/characters/pela.webp' },
  { id: 'qingque', name: 'Qingque', path: 'Erudition', element: 'Quantum', imageUrl: '/assets/characters/qingque.webp' },
  { id: 'sampo', name: 'Sampo', path: 'Nihility', element: 'Wind', imageUrl: '/assets/characters/sampo.webp' },
  { id: 'serval', name: 'Serval', path: 'Erudition', element: 'Lightning', imageUrl: '/assets/characters/serval.webp' },
  { id: 'sushang', name: 'Sushang', path: 'Hunt', element: 'Physical', imageUrl: '/assets/characters/sushang.webp' },
  { id: 'tingyun', name: 'Tingyun', path: 'Harmony', element: 'Lightning', imageUrl: '/assets/characters/tingyun.webp' },
  { id: 'xueyi', name: 'Xueyi', path: 'Destruction', element: 'Quantum', imageUrl: '/assets/characters/xueyi.webp' },
  { id: 'yukong', name: 'Yukong', path: 'Harmony', element: 'Imaginary', imageUrl: '/assets/characters/yukong.webp' },
];
