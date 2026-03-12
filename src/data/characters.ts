export interface Character {
  id: string;
  name: string;
  element: string;
  imageUrl: string;
}

export const ALL_CHARACTERS: Character[] = [
  // 5-Stars
  { id: 'acheron', name: 'Acheron',  element: 'Lightning', imageUrl: '/assets/characters/acheron.webp' },
  { id: 'argent', name: 'Argenti',  element: 'Physical', imageUrl: '/assets/characters/argent.webp' },
  { id: 'aventurine', name: 'Aventurine',  element: 'Imaginary', imageUrl: '/assets/characters/aventurine.webp' },
  { id: 'bailu', name: 'Bailu',  element: 'Lightning', imageUrl: '/assets/characters/bailu.webp' },
  { id: 'black_swan', name: 'Black Swan',  element: 'Wind', imageUrl: '/assets/characters/black_swan.webp' },
  { id: 'blade', name: 'Blade',  element: 'Wind', imageUrl: '/assets/characters/blade.webp' },
  { id: 'bronya', name: 'Bronya',  element: 'Wind', imageUrl: '/assets/characters/bronya.webp' },
  { id: 'clara', name: 'Clara',  element: 'Physical', imageUrl: '/assets/characters/clara.webp' },
  { id: 'dan_heng_il', name: 'Dan Heng • Imbibitor Lunae',  element: 'Imaginary', imageUrl: '/assets/characters/dan_heng_il.webp' },
  { id: 'dr_ratio', name: 'Dr. Ratio',  element: 'Imaginary', imageUrl: '/assets/characters/dr_ratio.webp' },
  { id: 'firefly', name: 'Firefly',  element: 'Fire', imageUrl: '/assets/characters/firefly.webp' },
  { id: 'fu_xuan', name: 'Fu Xuan',  element: 'Quantum', imageUrl: '/assets/characters/fu_xuan.webp' },
  { id: 'gepard', name: 'Gepard',  element: 'Ice', imageUrl: '/assets/characters/gepard.webp' },
  { id: 'himeko', name: 'Himeko',  element: 'Fire', imageUrl: '/assets/characters/himeko.webp' },
  { id: 'huohuo', name: 'Huohuo',  element: 'Wind', imageUrl: '/assets/characters/huohuo.webp' },
  { id: 'jing_yuan', name: 'Jing Yuan',  element: 'Lightning', imageUrl: '/assets/characters/jing_yuan.webp' },
  { id: 'jingliu', name: 'Jingliu',  element: 'Ice', imageUrl: '/assets/characters/jingliu.webp' },
  { id: 'kafka', name: 'Kafka',  element: 'Lightning', imageUrl: '/assets/characters/kafka.webp' },
  { id: 'luocha', name: 'Luocha',  element: 'Imaginary', imageUrl: '/assets/characters/luocha.webp' },
  { id: 'ruan_mei', name: 'Ruan Mei',  element: 'Ice', imageUrl: '/assets/characters/ruan_mei.webp' },
  { id: 'seele', name: 'Seele',  element: 'Quantum', imageUrl: '/assets/characters/seele.webp' },
  { id: 'silver_wolf', name: 'Silver Wolf',  element: 'Quantum', imageUrl: '/assets/characters/silver_wolf.webp' },
  { id: 'sparkle', name: 'Sparkle',  element: 'Quantum', imageUrl: '/assets/characters/sparkle.webp' },
  { id: 'topaz', name: 'Topaz & Numby',  element: 'Fire', imageUrl: '/assets/characters/topaz.webp' },
  { id: 'welt', name: 'Welt',  element: 'Imaginary', imageUrl: '/assets/characters/welt.webp' },
  { id: 'yanqing', name: 'Yanqing',  element: 'Ice', imageUrl: '/assets/characters/yanqing.webp' },
  
  // 4-Stars
  { id: 'arlan', name: 'Arlan',  element: 'Lightning', imageUrl: '/assets/characters/arlan.webp' },
  { id: 'asta', name: 'Asta',  element: 'Fire', imageUrl: '/assets/characters/asta.webp' },
  { id: 'dan_heng', name: 'Dan Heng',  element: 'Wind', imageUrl: '/assets/characters/dan_heng.webp' },
  { id: 'gallagher', name: 'Gallagher',  element: 'Fire', imageUrl: '/assets/characters/gallagher.webp' },
  { id: 'guinaifen', name: 'Guinaifen',  element: 'Fire', imageUrl: '/assets/characters/guinaifen.webp' },
  { id: 'hanya', name: 'Hanya',  element: 'Physical', imageUrl: '/assets/characters/hanya.webp' },
  { id: 'herta', name: 'Herta',  element: 'Ice', imageUrl: '/assets/characters/herta.webp' },
  { id: 'hook', name: 'Hook',  element: 'Fire', imageUrl: '/assets/characters/hook.webp' },
  { id: 'luka', name: 'Luka',  element: 'Physical', imageUrl: '/assets/characters/luka.webp' },
  { id: 'lynx', name: 'Lynx',  element: 'Quantum', imageUrl: '/assets/characters/lynx.webp' },
  { id: 'march_7th', name: 'March 7th',  element: 'Ice', imageUrl: '/assets/characters/march_7th.webp' },
  { id: 'march_7th_hunt', name: 'March 7th (Hunt)',  element: 'Imaginary', imageUrl: '/assets/characters/march_7th_hunt.webp' },
  { id: 'misha', name: 'Misha',  element: 'Ice', imageUrl: '/assets/characters/misha.webp' },
  { id: 'moze', name: 'Moze',  element: 'Lightning', imageUrl: '/assets/characters/moze.webp' },
  { id: 'natasha', name: 'Natasha',  element: 'Physical', imageUrl: '/assets/characters/natasha.webp' },
  { id: 'pela', name: 'Pela',  element: 'Ice', imageUrl: '/assets/characters/pela.webp' },
  { id: 'qingque', name: 'Qingque',  element: 'Quantum', imageUrl: '/assets/characters/qingque.webp' },
  { id: 'sampo', name: 'Sampo',  element: 'Wind', imageUrl: '/assets/characters/sampo.webp' },
  { id: 'serval', name: 'Serval',  element: 'Lightning', imageUrl: '/assets/characters/serval.webp' },
  { id: 'sushang', name: 'Sushang',  element: 'Physical', imageUrl: '/assets/characters/sushang.webp' },
  { id: 'tingyun', name: 'Tingyun',  element: 'Lightning', imageUrl: '/assets/characters/tingyun.webp' },
  { id: 'xueyi', name: 'Xueyi',  element: 'Quantum', imageUrl: '/assets/characters/xueyi.webp' },
  { id: 'yukong', name: 'Yukong',  element: 'Imaginary', imageUrl: '/assets/characters/yukong.webp' },
];
