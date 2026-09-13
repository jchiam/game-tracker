// Auto-generated from scripts/seeds/dgm-products.json and scripts/seeds/dgm-guides/*.json (curated seeds; facts and images from Wikimon, CC BY-SA 3.0; guides transcribed from each device and its manual, cross-checked against humulos.com/digimon) — do not edit manually.
// Run `node scripts/update-dgm-data.mjs` or trigger the GitHub Actions workflow to update.

/** One colourway or regional edition of a product. `id` doubles as the ImageKit asset name. */
export interface DgmVariant {
  id: string;
  colorway: string;
  releaseYear: number;
  region: 'JP' | 'NA' | 'EU' | 'ASIA';
  imageUrl: string;
}

export interface DgmProgressItem {
  /** `${trackId}:${slug}`, unique within the guide. */
  id: string;
  label: string;
  /** Short requirement or flavour text shown beside the item. */
  hint?: string;
  /** Item ids that must be checked first; checking pulls them in, unchecking drops dependents. */
  requires?: string[];
}

export interface DgmProgressGroup {
  id: string;
  label: string;
  items: DgmProgressItem[];
}

export interface DgmProgressTrack {
  id: string;
  label: string;
  groups: DgmProgressGroup[];
}

/** The in-game checklist for a product — its Progress Tracks and the overall formula. */
export interface DgmProgressGuide {
  /** How the overall percentage is derived from the tracks — chosen per product in the seed. */
  overall: 'track-mean' | 'item-weighted';
  tracks: DgmProgressTrack[];
}

/** One release; its colourways and regional editions are `variants`. */
export interface DgmProduct {
  id: string;
  name: string;
  /** Product line — open string; DGM_LINES lists the distinct values in catalog order. */
  line: string;
  /** Release within the line, e.g. "Ver.20th", "COLOR 1 Nature Spirits". */
  series: string;
  /** Earliest variant release year. */
  releaseYear: number;
  variants: DgmVariant[];
  /** Present only for products with a hand-written progress guide. */
  guide?: DgmProgressGuide;
}

export const ALL_PRODUCTS: DgmProduct[] = [
  // Digital Monster
  {
    id: 'dm-ver-20th',
    name: 'Digital Monster Ver.20th',
    line: 'Digital Monster',
    series: 'Ver.20th',
    releaseYear: 2017,
    variants: [
      {
        id: 'dm-ver20th-original-brown',
        colorway: 'Original Brown',
        releaseYear: 2017,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/dm-ver20th-original-brown.webp',
      },
      {
        id: 'dm-ver20th-original-gray',
        colorway: 'Original Gray',
        releaseYear: 2017,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/dm-ver20th-original-gray.webp',
      },
      {
        id: 'dm-ver20th-original-navy-blue',
        colorway: 'Original Navy Blue',
        releaseYear: 2017,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/dm-ver20th-original-navy-blue.webp',
      },
      {
        id: 'dm-ver20th-original-yellow',
        colorway: 'Original Yellow',
        releaseYear: 2017,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/dm-ver20th-original-yellow.webp',
      },
      {
        id: 'dm-ver20th-omegamon-color',
        colorway: 'Omegamon Color',
        releaseYear: 2017,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/dm-ver20th-omegamon-color.webp',
      },
      {
        id: 'dm-ver20th-alphamon-color',
        colorway: 'Alphamon Color',
        releaseYear: 2017,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/dm-ver20th-alphamon-color.webp',
      },
      {
        id: 'dm-ver20th-english-brick',
        colorway: 'English Brick',
        releaseYear: 2019,
        region: 'NA',
        imageUrl: '/assets/digimon/devices/dm-ver20th-english-brick.webp',
      },
      {
        id: 'dm-ver20th-english-gray',
        colorway: 'English Gray',
        releaseYear: 2019,
        region: 'NA',
        imageUrl: '/assets/digimon/devices/dm-ver20th-english-gray.webp',
      },
    ],
  },
  {
    id: 'dm-x-ver-1',
    name: 'Digital Monster X Ver.1',
    line: 'Digital Monster',
    series: 'X Ver.1',
    releaseYear: 2019,
    variants: [
      {
        id: 'dm-x-ver1-black',
        colorway: 'Black',
        releaseYear: 2019,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/dm-x-ver1-black.webp',
      },
      {
        id: 'dm-x-ver1-white',
        colorway: 'White',
        releaseYear: 2019,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/dm-x-ver1-white.webp',
      },
      {
        id: 'dm-x-ver1-black-and-red',
        colorway: 'Black and Red',
        releaseYear: 2021,
        region: 'NA',
        imageUrl: '/assets/digimon/devices/dm-x-ver1-black-and-red.webp',
      },
      {
        id: 'dm-x-ver1-white-and-blue',
        colorway: 'White and Blue',
        releaseYear: 2021,
        region: 'NA',
        imageUrl: '/assets/digimon/devices/dm-x-ver1-white-and-blue.webp',
      },
      {
        id: 'dm-x-ver1-purple-and-red',
        colorway: 'Purple and Red',
        releaseYear: 2021,
        region: 'NA',
        imageUrl: '/assets/digimon/devices/dm-x-ver1-purple-and-red.webp',
      },
      {
        id: 'dm-x-ver1-green-and-blue',
        colorway: 'Green and Blue',
        releaseYear: 2021,
        region: 'NA',
        imageUrl: '/assets/digimon/devices/dm-x-ver1-green-and-blue.webp',
      },
    ],
  },
  {
    id: 'dm-x-ver-2',
    name: 'Digital Monster X Ver.2',
    line: 'Digital Monster',
    series: 'X Ver.2',
    releaseYear: 2019,
    variants: [
      {
        id: 'dm-x-ver2-red',
        colorway: 'Red',
        releaseYear: 2019,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/dm-x-ver2-red.webp',
      },
      {
        id: 'dm-x-ver2-purple',
        colorway: 'Purple',
        releaseYear: 2019,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/dm-x-ver2-purple.webp',
      },
      {
        id: 'dm-x-ver2-translucent-red-and-gold',
        colorway: 'Translucent Red and Gold',
        releaseYear: 2022,
        region: 'NA',
        imageUrl: '/assets/digimon/devices/dm-x-ver2-translucent-red-and-gold.webp',
      },
      {
        id: 'dm-x-ver2-translucent-purple-and-silver',
        colorway: 'Translucent Purple and Silver',
        releaseYear: 2022,
        region: 'NA',
        imageUrl: '/assets/digimon/devices/dm-x-ver2-translucent-purple-and-silver.webp',
      },
      {
        id: 'dm-x-ver2-metallic-navy-and-silver',
        colorway: 'Metallic Navy and Silver',
        releaseYear: 2022,
        region: 'NA',
        imageUrl: '/assets/digimon/devices/dm-x-ver2-metallic-navy-and-silver.webp',
      },
      {
        id: 'dm-x-ver2-metallic-grey-and-gold',
        colorway: 'Metallic Grey and Gold',
        releaseYear: 2022,
        region: 'NA',
        imageUrl: '/assets/digimon/devices/dm-x-ver2-metallic-grey-and-gold.webp',
      },
    ],
  },
  {
    id: 'dm-x-ver-3',
    name: 'Digital Monster X Ver.3',
    line: 'Digital Monster',
    series: 'X Ver.3',
    releaseYear: 2020,
    variants: [
      {
        id: 'dm-x-ver3-yellow',
        colorway: 'Yellow',
        releaseYear: 2020,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/dm-x-ver3-yellow.webp',
      },
      {
        id: 'dm-x-ver3-blue',
        colorway: 'Blue',
        releaseYear: 2020,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/dm-x-ver3-blue.webp',
      },
    ],
  },
  {
    id: 'dm-color-ver-1',
    name: 'Digital Monster COLOR Ver.1',
    line: 'Digital Monster',
    series: 'COLOR Ver.1',
    releaseYear: 2023,
    variants: [
      {
        id: 'dm-color-ver1-original-brown',
        colorway: 'Original Brown',
        releaseYear: 2023,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/dm-color-ver1-original-brown.webp',
      },
      {
        id: 'dm-color-ver1-original-gray',
        colorway: 'Original Gray',
        releaseYear: 2023,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/dm-color-ver1-original-gray.webp',
      },
    ],
  },
  {
    id: 'dm-color-ver-2',
    name: 'Digital Monster COLOR Ver.2',
    line: 'Digital Monster',
    series: 'COLOR Ver.2',
    releaseYear: 2023,
    variants: [
      {
        id: 'dm-color-ver2-original-white',
        colorway: 'Original White',
        releaseYear: 2023,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/dm-color-ver2-original-white.webp',
      },
      {
        id: 'dm-color-ver2-original-black',
        colorway: 'Original Black',
        releaseYear: 2023,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/dm-color-ver2-original-black.webp',
      },
    ],
  },
  {
    id: 'dm-color-ver-3',
    name: 'Digital Monster COLOR Ver.3',
    line: 'Digital Monster',
    series: 'COLOR Ver.3',
    releaseYear: 2023,
    variants: [
      {
        id: 'dm-color-ver3-original-purple',
        colorway: 'Original Purple',
        releaseYear: 2023,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/dm-color-ver3-original-purple.webp',
      },
    ],
  },
  {
    id: 'dm-color-ver-4',
    name: 'Digital Monster COLOR Ver.4',
    line: 'Digital Monster',
    series: 'COLOR Ver.4',
    releaseYear: 2023,
    variants: [
      {
        id: 'dm-color-ver4-original-clear-red',
        colorway: 'Original Clear Red',
        releaseYear: 2023,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/dm-color-ver4-original-clear-red.webp',
      },
    ],
  },
  {
    id: 'dm-color-ver-5',
    name: 'Digital Monster COLOR Ver.5',
    line: 'Digital Monster',
    series: 'COLOR Ver.5',
    releaseYear: 2023,
    variants: [
      {
        id: 'dm-color-ver5-original-clear-green',
        colorway: 'Original Clear Green',
        releaseYear: 2023,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/dm-color-ver5-original-clear-green.webp',
      },
    ],
  },
  {
    id: 'dm-color-monster-hunter-20th-edition',
    name: 'Digital Monster COLOR Monster Hunter 20th Edition',
    line: 'Digital Monster',
    series: 'COLOR Monster Hunter 20th Edition',
    releaseYear: 2025,
    variants: [
      {
        id: 'dm-color-monster-hunter-liolaeus',
        colorway: 'Liolaeus Color',
        releaseYear: 2025,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/dm-color-monster-hunter-liolaeus.webp',
      },
      {
        id: 'dm-color-monster-hunter-zinogre',
        colorway: 'Zinogre Color',
        releaseYear: 2025,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/dm-color-monster-hunter-zinogre.webp',
      },
    ],
  },
  {
    id: 'dm-color-godzilla-70th-edition',
    name: 'Digital Monster COLOR Godzilla 70th Edition',
    line: 'Digital Monster',
    series: 'COLOR Godzilla 70th Edition',
    releaseYear: 2025,
    variants: [
      {
        id: 'dm-color-godzilla-g-erosion',
        colorway: 'War Greymon "G" Erosion Mode Color',
        releaseYear: 2025,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/dm-color-godzilla-g-erosion.webp',
      },
      {
        id: 'dm-color-godzilla-g-erosion-classic',
        colorway: 'War Greymon "G" Erosion Mode Classic Color',
        releaseYear: 2025,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/dm-color-godzilla-g-erosion-classic.webp',
      },
    ],
  },
  {
    id: 'dm-color-digimon-xros-wars-15th-edition',
    name: 'Digital Monster COLOR Digimon Xros Wars 15th Edition',
    line: 'Digital Monster',
    series: 'COLOR Digimon Xros Wars 15th Edition',
    releaseYear: 2026,
    variants: [
      {
        id: 'dm-color-xros-wars-xros-heart',
        colorway: 'Xros Heart Color',
        releaseYear: 2026,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/dm-color-xros-wars-xros-heart.webp',
      },
      {
        id: 'dm-color-xros-wars-blue-flare',
        colorway: 'Blue Flare Color',
        releaseYear: 2026,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/dm-color-xros-wars-blue-flare.webp',
      },
    ],
  },
  {
    id: 'dm-color-ultraman-series-60th-edition',
    name: 'Digital Monster COLOR Ultraman Series 60th Edition',
    line: 'Digital Monster',
    series: 'COLOR Ultraman Series 60th Edition',
    releaseYear: 2027,
    variants: [
      {
        id: 'dm-color-ultraman-henshin',
        colorway: 'Ultraman Henshin Color',
        releaseYear: 2027,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/dm-color-ultraman-henshin.webp',
      },
      {
        id: 'dm-color-ultraman-graffiti-ultraheroes',
        colorway: 'Graffiti Ultraheroes Color',
        releaseYear: 2027,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/dm-color-ultraman-graffiti-ultraheroes.webp',
      },
    ],
  },
  // Pendulum
  {
    id: 'pen-ver-20th',
    name: 'Digimon Pendulum Ver.20th',
    line: 'Pendulum',
    series: 'Ver.20th',
    releaseYear: 2018,
    variants: [
      {
        id: 'pen-ver20th-original-silver-black',
        colorway: 'Original Silver Black',
        releaseYear: 2018,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/pen-ver20th-original-silver-black.webp',
      },
      {
        id: 'pen-ver20th-original-silver-blue',
        colorway: 'Original Silver Blue',
        releaseYear: 2018,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/pen-ver20th-original-silver-blue.webp',
      },
      {
        id: 'pen-ver20th-dukemon-color',
        colorway: 'Dukemon Color',
        releaseYear: 2018,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/pen-ver20th-dukemon-color.webp',
      },
      {
        id: 'pen-ver20th-beelzebumon-color',
        colorway: 'Beelzebumon Color',
        releaseYear: 2018,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/pen-ver20th-beelzebumon-color.webp',
      },
    ],
  },
  {
    id: 'pen-z',
    name: 'Digimon Pendulum Z Nature Spirits',
    line: 'Pendulum',
    series: 'Z',
    releaseYear: 2020,
    variants: [
      {
        id: 'pen-z-nature-spirits',
        colorway: 'Nature Spirits Green',
        releaseYear: 2020,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/pen-z-nature-spirits.webp',
      },
      {
        id: 'pen-z-deep-savers',
        colorway: 'Deep Savers Blue',
        releaseYear: 2020,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/pen-z-deep-savers.webp',
      },
      {
        id: 'pen-z-nightmare-soldiers',
        colorway: 'Nightmare Soldiers Red',
        releaseYear: 2020,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/pen-z-nightmare-soldiers.webp',
      },
    ],
  },
  {
    id: 'pen-z-ii',
    name: 'Digimon Pendulum Z II Wind Guardians',
    line: 'Pendulum',
    series: 'Z II',
    releaseYear: 2021,
    variants: [
      {
        id: 'pen-z2-wind-guardians',
        colorway: 'Wind Guardians Blue',
        releaseYear: 2021,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/pen-z2-wind-guardians.webp',
      },
      {
        id: 'pen-z2-metal-empire',
        colorway: 'Metal Empire Red',
        releaseYear: 2021,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/pen-z2-metal-empire.webp',
      },
      {
        id: 'pen-z2-virus-busters',
        colorway: 'Virus Busters Yellow',
        releaseYear: 2021,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/pen-z2-virus-busters.webp',
      },
    ],
  },
  {
    id: 'pen-color-1-nature-spirits',
    name: 'Digimon Pendulum COLOR 1 Nature Spirits',
    line: 'Pendulum',
    series: 'COLOR 1 Nature Spirits',
    releaseYear: 2024,
    variants: [
      {
        id: 'pen-color-1-nature-spirits',
        colorway: 'Original Silver-Blue',
        releaseYear: 2024,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/pen-color-1-nature-spirits.webp',
      },
    ],
  },
  {
    id: 'pen-color-2-deep-savers',
    name: 'Digimon Pendulum COLOR 2 Deep Savers',
    line: 'Pendulum',
    series: 'COLOR 2 Deep Savers',
    releaseYear: 2024,
    variants: [
      {
        id: 'pen-color-2-deep-savers',
        colorway: 'Original Blue-Orange',
        releaseYear: 2024,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/pen-color-2-deep-savers.webp',
      },
    ],
  },
  {
    id: 'pen-color-3-nightmare-soldiers',
    name: 'Digimon Pendulum COLOR 3 Nightmare Soldiers',
    line: 'Pendulum',
    series: 'COLOR 3 Nightmare Soldiers',
    releaseYear: 2024,
    variants: [
      {
        id: 'pen-color-3-nightmare-soldiers',
        colorway: 'Original Red-Black',
        releaseYear: 2024,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/pen-color-3-nightmare-soldiers.webp',
      },
    ],
  },
  {
    id: 'pen-color-4-wind-guardians',
    name: 'Digimon Pendulum COLOR 4 Wind Guardians',
    line: 'Pendulum',
    series: 'COLOR 4 Wind Guardians',
    releaseYear: 2024,
    variants: [
      {
        id: 'pen-color-4-wind-guardians',
        colorway: 'Original Green-Bronze',
        releaseYear: 2024,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/pen-color-4-wind-guardians.webp',
      },
    ],
  },
  {
    id: 'pen-color-5-metal-empire',
    name: 'Digimon Pendulum COLOR 5 Metal Empire',
    line: 'Pendulum',
    series: 'COLOR 5 Metal Empire',
    releaseYear: 2024,
    variants: [
      {
        id: 'pen-color-5-metal-empire',
        colorway: 'Original Black-Red',
        releaseYear: 2024,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/pen-color-5-metal-empire.webp',
      },
    ],
  },
  {
    id: 'pen-color-zero-virus-busters',
    name: 'Digimon Pendulum COLOR ZERO Virus Busters',
    line: 'Pendulum',
    series: 'COLOR ZERO Virus Busters',
    releaseYear: 2024,
    variants: [
      {
        id: 'pen-color-zero-virus-busters',
        colorway: 'Original Pearl White-Gold',
        releaseYear: 2024,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/pen-color-zero-virus-busters.webp',
      },
    ],
  },
  {
    id: 'pen-color-6-saiyu-warriors',
    name: 'Digimon Pendulum COLOR 6 Saiyu Warriors',
    line: 'Pendulum',
    series: 'COLOR 6 Saiyu Warriors',
    releaseYear: 2025,
    variants: [
      {
        id: 'pen-color-6-saiyu-warriors',
        colorway: 'Original Red-Yellow',
        releaseYear: 2025,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/pen-color-6-saiyu-warriors.webp',
      },
    ],
  },
  {
    id: 'pen-color-7-toho-braves',
    name: 'Digimon Pendulum COLOR 7 Toho Braves',
    line: 'Pendulum',
    series: 'COLOR 7 Toho Braves',
    releaseYear: 2025,
    variants: [
      {
        id: 'pen-color-7-toho-braves',
        colorway: 'Original White-Red',
        releaseYear: 2025,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/pen-color-7-toho-braves.webp',
      },
    ],
  },
  {
    id: 'pen-color-8-celestial-walker',
    name: 'Digimon Pendulum COLOR 8 Celestial Walker',
    line: 'Pendulum',
    series: 'COLOR 8 Celestial Walker',
    releaseYear: 2026,
    variants: [
      {
        id: 'pen-color-8-celestial-walker',
        colorway: 'Olympos Green',
        releaseYear: 2026,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/pen-color-8-celestial-walker.webp',
      },
    ],
  },
  {
    id: 'pen-color-9-astral-sentinel',
    name: 'Digimon Pendulum COLOR 9 Astral Sentinel',
    line: 'Pendulum',
    series: 'COLOR 9 Astral Sentinel',
    releaseYear: 2026,
    variants: [
      {
        id: 'pen-color-9-astral-sentinel',
        colorway: 'Iliad Blue',
        releaseYear: 2026,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/pen-color-9-astral-sentinel.webp',
      },
    ],
  },
  {
    id: 'pen-color-godzilla-edition',
    name: 'Digimon Pendulum COLOR Godzilla Edition',
    line: 'Pendulum',
    series: 'COLOR Godzilla Edition',
    releaseYear: 2026,
    variants: [
      {
        id: 'pen-color-godzilla-side-godzilla',
        colorway: 'Omegamon G Fusion Mode (SIDE Godzilla)',
        releaseYear: 2026,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/pen-color-godzilla-side-godzilla.webp',
      },
      {
        id: 'pen-color-godzilla-side-digimon',
        colorway: 'Omegamon G Fusion Mode (SIDE Digimon)',
        releaseYear: 2026,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/pen-color-godzilla-side-digimon.webp',
      },
    ],
  },
  // Vital Bracelet
  {
    id: 'vb-digital-monster',
    name: 'Vital Bracelet Digital Monster',
    line: 'Vital Bracelet',
    series: 'Digital Monster',
    releaseYear: 2021,
    variants: [
      {
        id: 'vb-digital-monster-ver-black',
        colorway: 'ver.BLACK',
        releaseYear: 2021,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/vb-digital-monster-ver-black.webp',
      },
      {
        id: 'vb-digital-monster-ver-white',
        colorway: 'ver.WHITE',
        releaseYear: 2021,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/vb-digital-monster-ver-white.webp',
      },
      {
        id: 'vb-digital-monster-ver-special',
        colorway: 'ver.SPECIAL',
        releaseYear: 2021,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/vb-digital-monster-ver-special.webp',
      },
    ],
  },
  {
    id: 'vb-digivice-v',
    name: 'Vital Bracelet Digivice-V-',
    line: 'Vital Bracelet',
    series: 'Digivice-V-',
    releaseYear: 2021,
    variants: [
      {
        id: 'vb-digivice-v',
        colorway: 'Original',
        releaseYear: 2021,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/vb-digivice-v.webp',
      },
    ],
  },
  {
    id: 'vb-vital-hero',
    name: 'Vital Hero',
    line: 'Vital Bracelet',
    series: 'Vital Hero',
    releaseYear: 2022,
    variants: [
      {
        id: 'vb-vital-hero-ver-black',
        colorway: 'ver.BLACK',
        releaseYear: 2022,
        region: 'NA',
        imageUrl: '/assets/digimon/devices/vb-vital-hero-ver-black.webp',
      },
    ],
  },
  {
    id: 'vb-be',
    name: 'Vital Bracelet BE',
    line: 'Vital Bracelet',
    series: 'BE',
    releaseYear: 2022,
    variants: [
      {
        id: 'vb-be-clear-black',
        colorway: 'Clear Black',
        releaseYear: 2022,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/vb-be-clear-black.webp',
      },
      {
        id: 'vb-be-clear-white',
        colorway: 'Clear White',
        releaseYear: 2022,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/vb-be-clear-white.webp',
      },
      {
        id: 'vb-be-25th-anniversary-set',
        colorway: 'Original Brown and Original Gray',
        releaseYear: 2022,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/vb-be-25th-anniversary-set.webp',
      },
    ],
  },
  {
    id: 'vb-be-digivice-vv',
    name: 'Vital Bracelet BE Digivice-VV-',
    line: 'Vital Bracelet',
    series: 'BE Digivice-VV-',
    releaseYear: 2022,
    variants: [
      {
        id: 'vb-be-digivice-vv',
        colorway: 'Original',
        releaseYear: 2022,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/vb-be-digivice-vv.webp',
      },
    ],
  },
  // Digivice
  {
    id: 'dv-ver-15th',
    name: 'Digivice Ver.15th',
    line: 'Digivice',
    series: 'Ver.15th',
    releaseYear: 2014,
    variants: [
      {
        id: 'dv-ver15th-yagami-taichi',
        colorway: 'Yagami Taichi Orange',
        releaseYear: 2014,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/dv-ver15th-yagami-taichi.webp',
      },
      {
        id: 'dv-ver15th-ishida-yamato',
        colorway: 'Ishida Yamato Blue',
        releaseYear: 2014,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/dv-ver15th-ishida-yamato.webp',
      },
    ],
  },
  {
    id: 'dv-digivice',
    name: 'Digivice:',
    line: 'Digivice',
    series: 'Digivice:',
    releaseYear: 2020,
    variants: [
      {
        id: 'dv-2020-blue',
        colorway: 'Blue',
        releaseYear: 2020,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/dv-2020-blue.webp',
      },
    ],
  },
  {
    id: 'dv-ver-complete',
    name: 'Digivice Ver.Complete',
    line: 'Digivice',
    series: 'Ver.Complete',
    releaseYear: 2021,
    variants: [
      {
        id: 'dv-ver-complete',
        colorway: 'Original',
        releaseYear: 2021,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/dv-ver-complete.webp',
      },
    ],
  },
  {
    id: 'dv-25th-color-evolution',
    name: 'Digivice -25th COLOR EVOLUTION-',
    line: 'Digivice',
    series: '-25th COLOR EVOLUTION-',
    releaseYear: 2024,
    variants: [
      {
        id: 'dv-25th-anime-original',
        colorway: 'Anime Original Color',
        releaseYear: 2024,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/dv-25th-anime-original.webp',
      },
      {
        id: 'dv-25th-yagami-taichi',
        colorway: 'Yagami Taichi Color',
        releaseYear: 2024,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/dv-25th-yagami-taichi.webp',
      },
      {
        id: 'dv-25th-ishida-yamato',
        colorway: 'Ishida Yamato Color',
        releaseYear: 2024,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/dv-25th-ishida-yamato.webp',
      },
    ],
    guide: {
      overall: 'track-mean',
      tracks: [
        {
          id: 'partners',
          label: 'Partners',
          groups: [
            {
              id: 'taichi',
              label: 'Taichi Yagami · Agumon line',
              items: [
                {
                  id: 'partners:taichi-greymon',
                  label: 'Greymon',
                  hint: 'Wins: 5',
                },
                {
                  id: 'partners:taichi-metal-greymon',
                  label: 'Metal Greymon',
                  hint: 'Wins: 15',
                  requires: ['partners:taichi-greymon'],
                },
                {
                  id: 'partners:taichi-skull-greymon',
                  label: 'Skull Greymon',
                  hint: 'Wins: 25',
                  requires: ['partners:taichi-greymon'],
                },
                {
                  id: 'partners:taichi-war-greymon',
                  label: 'War Greymon',
                  hint: 'Wins: 45',
                  requires: ['partners:taichi-metal-greymon'],
                },
              ],
            },
            {
              id: 'yamato',
              label: 'Yamato Ishida · Gabumon line',
              items: [
                {
                  id: 'partners:yamato-garurumon',
                  label: 'Garurumon',
                  hint: 'Wins: 5',
                },
                {
                  id: 'partners:yamato-were-garurumon',
                  label: 'Were Garurumon',
                  hint: 'Wins: 15',
                  requires: ['partners:yamato-garurumon'],
                },
                {
                  id: 'partners:yamato-metal-garurumon',
                  label: 'Metal Garurumon',
                  hint: 'Wins: 35',
                  requires: ['partners:yamato-were-garurumon'],
                },
              ],
            },
            {
              id: 'sora',
              label: 'Sora Takenouchi · Piyomon line',
              items: [
                {
                  id: 'partners:sora-birdramon',
                  label: 'Birdramon',
                  hint: 'Wins: 5',
                },
                {
                  id: 'partners:sora-garudamon',
                  label: 'Garudamon',
                  hint: 'Wins: 15',
                  requires: ['partners:sora-birdramon'],
                },
              ],
            },
            {
              id: 'koushiro',
              label: 'Koushiro Izumi · Tentomon line',
              items: [
                {
                  id: 'partners:koushiro-kabuterimon',
                  label: 'Kabuterimon',
                  hint: 'Wins: 5',
                },
                {
                  id: 'partners:koushiro-atlur-kabuterimon',
                  label: 'Atlur Kabuterimon',
                  hint: 'Wins: 15',
                  requires: ['partners:koushiro-kabuterimon'],
                },
              ],
            },
            {
              id: 'mimi',
              label: 'Mimi Tachikawa · Palmon line',
              items: [
                {
                  id: 'partners:mimi-togemon',
                  label: 'Togemon',
                  hint: 'Wins: 5',
                },
                {
                  id: 'partners:mimi-lilimon',
                  label: 'Lilimon',
                  hint: 'Wins: 15',
                  requires: ['partners:mimi-togemon'],
                },
              ],
            },
            {
              id: 'joe',
              label: 'Joe Kido · Gomamon line',
              items: [
                {
                  id: 'partners:joe-ikkakumon',
                  label: 'Ikkakumon',
                  hint: 'Wins: 5',
                },
                {
                  id: 'partners:joe-zudomon',
                  label: 'Zudomon',
                  hint: 'Wins: 15',
                  requires: ['partners:joe-ikkakumon'],
                },
              ],
            },
            {
              id: 'takeru',
              label: 'Takeru Takaishi · Patamon line',
              items: [
                {
                  id: 'partners:takeru-angemon',
                  label: 'Angemon',
                  hint: 'Wins: 5',
                },
                {
                  id: 'partners:takeru-holy-angemon',
                  label: 'Holy Angemon',
                  hint: 'Wins: 15',
                  requires: ['partners:takeru-angemon'],
                },
              ],
            },
            {
              id: 'hikari',
              label: 'Hikari Yagami · Tailmon line',
              items: [
                {
                  id: 'partners:hikari-tailmon',
                  label: 'Tailmon',
                  hint: 'Met in Shibuya area 3 (Tokyo)',
                },
                {
                  id: 'partners:hikari-angewomon',
                  label: 'Angewomon',
                  hint: 'Wins: 20',
                  requires: ['partners:hikari-tailmon'],
                },
              ],
            },
            {
              id: 'jogress',
              label: 'Omegamon · Taichi + Yamato',
              items: [
                {
                  id: 'partners:omegamon',
                  label: 'Omegamon',
                  hint: 'Unlock War Greymon + Metal Garurumon, then clear Subspace',
                  requires: [
                    'partners:taichi-war-greymon',
                    'partners:yamato-metal-garurumon',
                    'map:subspace',
                  ],
                },
              ],
            },
            {
              id: 'guests',
              label: 'Guest partners',
              items: [
                {
                  id: 'partners:wizarmon',
                  label: 'Wizarmon',
                  hint: 'Met after clearing the Network map · cannot evolve',
                  requires: ['map:network'],
                },
                {
                  id: 'partners:v-dramon',
                  label: 'V-dramon',
                  hint: 'Met after every secret area and every evolution · cannot evolve',
                },
              ],
            },
          ],
        },
        {
          id: 'map',
          label: 'Map',
          groups: [
            {
              id: 'file-island',
              label: 'File Island',
              items: [
                {
                  id: 'map:file-island-tropical-jungle',
                  label: 'Tropical Jungle',
                  hint: 'Boss: Shellmon · Ep. 1–2',
                },
                {
                  id: 'map:file-island-tropical-jungle-secret',
                  label: 'Tropical Jungle · secret area',
                  hint: 'Secret · Meramon',
                },
                {
                  id: 'map:file-island-lake',
                  label: 'Lake',
                  hint: 'Boss: Seadramon · Ep. 3',
                  requires: ['map:file-island-tropical-jungle'],
                },
                {
                  id: 'map:file-island-lake-secret',
                  label: 'Lake · secret area',
                  hint: 'Secret · Andromon',
                },
                {
                  id: 'map:file-island-gear-savannah',
                  label: 'Gear Savannah',
                  hint: 'Boss: Meramon · Ep. 4',
                  requires: ['map:file-island-lake'],
                },
                {
                  id: 'map:file-island-gear-savannah-secret',
                  label: 'Gear Savannah · secret area',
                  hint: 'Secret · Seadramon',
                },
                {
                  id: 'map:file-island-factorial-town',
                  label: 'Factorial Town',
                  hint: 'Boss: Andromon · Ep. 5',
                  requires: ['map:file-island-gear-savannah'],
                },
                {
                  id: 'map:file-island-factorial-town-secret',
                  label: 'Factorial Town · secret area',
                  hint: 'Secret · Monzaemon',
                },
                {
                  id: 'map:file-island-toy-town',
                  label: 'Toy-Town',
                  hint: 'Boss: Monzaemon · Ep. 6',
                  requires: ['map:file-island-factorial-town'],
                },
                {
                  id: 'map:file-island-toy-town-secret',
                  label: 'Toy-Town · secret area',
                  hint: 'Secret · Meramon',
                },
                {
                  id: 'map:file-island-infinity-mountain',
                  label: 'Infinity Mountain',
                  hint: 'Boss: Devimon · Ep. 7–8',
                  requires: ['map:file-island-toy-town'],
                },
                {
                  id: 'map:file-island-infinity-mountain-secret',
                  label: 'Infinity Mountain · secret area',
                  hint: 'Secret · Shellmon',
                },
              ],
            },
            {
              id: 'file-island-broken',
              label: 'File Island (Broken)',
              items: [
                {
                  id: 'map:file-island-broken-freeze-land',
                  label: 'Freeze Land',
                  hint: 'Boss: Mojyamon · Ep. 9',
                  requires: ['map:file-island-infinity-mountain'],
                },
                {
                  id: 'map:file-island-broken-freeze-land-secret',
                  label: 'Freeze Land · secret area',
                  hint: 'Secret · Bakemon',
                },
                {
                  id: 'map:file-island-broken-ancient-dino-region',
                  label: 'Ancient Dino Region',
                  hint: 'Boss: Centaurmon · Ep. 10',
                  requires: ['map:file-island-broken-freeze-land'],
                },
                {
                  id: 'map:file-island-broken-ancient-dino-region-secret',
                  label: 'Ancient Dino Region · secret area',
                  hint: 'Secret · Leomon',
                },
                {
                  id: 'map:file-island-broken-overdell-cemetery',
                  label: 'Overdell Cemetery',
                  hint: 'Boss: Bakemon · Ep. 11',
                  requires: ['map:file-island-broken-ancient-dino-region'],
                },
                {
                  id: 'map:file-island-broken-overdell-cemetery-secret',
                  label: 'Overdell Cemetery · secret area',
                  hint: 'Secret · Mojyamon',
                },
                {
                  id: 'map:file-island-broken-the-town-of-beginnings',
                  label: 'The Town of Beginnings',
                  hint: 'Boss: Leomon · Ep. 12',
                  requires: ['map:file-island-broken-overdell-cemetery'],
                },
                {
                  id: 'map:file-island-broken-the-town-of-beginnings-secret',
                  label: 'The Town of Beginnings · secret area',
                  hint: 'Secret · Drimogemon',
                },
                {
                  id: 'map:file-island-broken-infinity-mountain',
                  label: 'Infinity Mountain',
                  hint: 'Boss: Devimon · Ep. 13',
                  requires: ['map:file-island-broken-the-town-of-beginnings'],
                },
                {
                  id: 'map:file-island-broken-infinity-mountain-secret',
                  label: 'Infinity Mountain · secret area',
                  hint: 'Secret · Centaurmon',
                },
                {
                  id: 'map:file-island-broken-open-sea',
                  label: 'Open Sea',
                  hint: 'Boss: Drimogemon · Ep. 14',
                  requires: ['map:file-island-broken-infinity-mountain'],
                },
                {
                  id: 'map:file-island-broken-open-sea-secret',
                  label: 'Open Sea · secret area',
                  hint: 'Secret · Leomon',
                },
              ],
            },
            {
              id: 'server-continent',
              label: 'Server Continent',
              items: [
                {
                  id: 'map:server-continent-koromons-village',
                  label: "Koromon's Village",
                  hint: 'Boss: Etemon · Ep. 15',
                  requires: ['map:file-island-broken-open-sea'],
                },
                {
                  id: 'map:server-continent-koromons-village-secret',
                  label: "Koromon's Village · secret area",
                  hint: 'Secret · Cockatrimon',
                },
                {
                  id: 'map:server-continent-colosseum',
                  label: 'Colosseum',
                  hint: 'Boss: Greymon · Ep. 16',
                  requires: ['map:server-continent-koromons-village'],
                },
                {
                  id: 'map:server-continent-colosseum-secret',
                  label: 'Colosseum · secret area',
                  hint: 'Secret · Tyranomon',
                },
                {
                  id: 'map:server-continent-desert',
                  label: 'Desert',
                  hint: 'Boss: Cockatrimon · Ep. 17',
                  requires: ['map:server-continent-colosseum'],
                },
                {
                  id: 'map:server-continent-desert-secret',
                  label: 'Desert · secret area',
                  hint: 'Secret · Etemon',
                },
                {
                  id: 'map:server-continent-piccolomons-forest',
                  label: "Piccolomon's Forest",
                  hint: 'Boss: Tyranomon · Ep. 18',
                  requires: ['map:server-continent-desert'],
                },
                {
                  id: 'map:server-continent-piccolomons-forest-secret',
                  label: "Piccolomon's Forest · secret area",
                  hint: 'Secret · Pico Devimon',
                },
                {
                  id: 'map:server-continent-reverse-pyramid',
                  label: 'Reverse Pyramid',
                  hint: 'Boss: Etemon · Ep. 19–20',
                  requires: ['map:server-continent-piccolomons-forest'],
                },
                {
                  id: 'map:server-continent-reverse-pyramid-secret',
                  label: 'Reverse Pyramid · secret area',
                  hint: 'Secret · Vegimon',
                },
                {
                  id: 'map:server-continent-amusement-park',
                  label: 'Amusement Park',
                  hint: 'Boss: Pico Devimon · Ep. 22',
                  requires: ['map:server-continent-reverse-pyramid'],
                },
                {
                  id: 'map:server-continent-amusement-park-secret',
                  label: 'Amusement Park · secret area',
                  hint: 'Secret · Vademon',
                },
                {
                  id: 'map:server-continent-restaurant',
                  label: 'Restaurant',
                  hint: 'Boss: Vegimon · Ep. 23',
                  requires: ['map:server-continent-amusement-park'],
                },
                {
                  id: 'map:server-continent-restaurant-secret',
                  label: 'Restaurant · secret area',
                  hint: 'Secret · Tonosama Gekomon',
                },
                {
                  id: 'map:server-continent-different-space',
                  label: 'Different Space',
                  hint: 'Boss: Vademon · Ep. 24',
                  requires: ['map:server-continent-restaurant'],
                },
                {
                  id: 'map:server-continent-different-space-secret',
                  label: 'Different Space · secret area',
                  hint: 'Secret · Etemon',
                },
                {
                  id: 'map:server-continent-tonosama-gekomons-castle',
                  label: "Tonosama Gekomon's Castle",
                  hint: 'Boss: Tonosama Gekomon · Ep. 25',
                  requires: ['map:server-continent-different-space'],
                },
                {
                  id: 'map:server-continent-tonosama-gekomons-castle-secret',
                  label: "Tonosama Gekomon's Castle · secret area",
                  hint: 'Secret · Cockatrimon',
                },
                {
                  id: 'map:server-continent-vamdemons-castle',
                  label: "Vamdemon's Castle",
                  hint: 'Boss: Vamdemon · Ep. 26–28',
                  requires: ['map:server-continent-tonosama-gekomons-castle'],
                },
                {
                  id: 'map:server-continent-vamdemons-castle-secret',
                  label: "Vamdemon's Castle · secret area",
                  hint: 'Secret · Greymon',
                },
              ],
            },
            {
              id: 'tokyo',
              label: 'Tokyo',
              items: [
                {
                  id: 'map:tokyo-hikarigaoka',
                  label: 'Hikarigaoka',
                  hint: 'Boss: Mammon · Ep. 29',
                  requires: ['map:server-continent-vamdemons-castle'],
                },
                {
                  id: 'map:tokyo-hikarigaoka-secret',
                  label: 'Hikarigaoka · secret area',
                  hint: 'Secret · Raremon',
                },
                {
                  id: 'map:tokyo-harumi',
                  label: 'Harumi',
                  hint: 'Boss: Gesomon · Ep. 30',
                  requires: ['map:tokyo-hikarigaoka'],
                },
                {
                  id: 'map:tokyo-harumi-secret',
                  label: 'Harumi · secret area',
                  hint: 'Secret · Death Meramon',
                },
                {
                  id: 'map:tokyo-pier',
                  label: 'Pier',
                  hint: 'Boss: Raremon · Ep. 31',
                  requires: ['map:tokyo-harumi'],
                },
                {
                  id: 'map:tokyo-pier-secret',
                  label: 'Pier · secret area',
                  hint: 'Secret · Mammon',
                },
                {
                  id: 'map:tokyo-tower',
                  label: 'Tower',
                  hint: 'Boss: Death Meramon · Ep. 32',
                  requires: ['map:tokyo-pier'],
                },
                {
                  id: 'map:tokyo-tower-secret',
                  label: 'Tower · secret area',
                  hint: 'Secret · Gesomon',
                },
                {
                  id: 'map:tokyo-shibuya',
                  label: 'Shibuya',
                  hint: 'Boss: Vamdemon · Ep. 33–34',
                  requires: ['map:tokyo-tower'],
                },
                {
                  id: 'map:tokyo-shibuya-secret',
                  label: 'Shibuya · secret area',
                  hint: 'Secret · Mammon',
                },
                {
                  id: 'map:tokyo-exhibition-center',
                  label: 'Exhibition Center',
                  hint: 'Boss: Venom Vamdemon · Ep. 35–39',
                  requires: ['map:tokyo-shibuya'],
                },
                {
                  id: 'map:tokyo-exhibition-center-secret',
                  label: 'Exhibition Center · secret area',
                  hint: 'Secret · Death Meramon',
                },
              ],
            },
            {
              id: 'spiral-mountain',
              label: 'Spiral Mountain',
              items: [
                {
                  id: 'map:spiral-mountain-jungle',
                  label: 'Jungle',
                  hint: 'Boss: Mugendramon · Ep. 40',
                  requires: ['map:tokyo-exhibition-center'],
                },
                {
                  id: 'map:spiral-mountain-jungle-secret',
                  label: 'Jungle · secret area',
                  hint: 'Secret · Pinochimon',
                },
                {
                  id: 'map:spiral-mountain-colosseum',
                  label: 'Colosseum',
                  hint: 'Boss: Piemon · Ep. 40',
                  requires: ['map:spiral-mountain-jungle'],
                },
                {
                  id: 'map:spiral-mountain-colosseum-secret',
                  label: 'Colosseum · secret area',
                  hint: 'Secret · Metal Etemon',
                },
                {
                  id: 'map:spiral-mountain-digital-sea',
                  label: 'Digital Sea',
                  hint: 'Boss: Metal Seadramon · Ep. 41–42',
                  requires: ['map:spiral-mountain-colosseum'],
                },
                {
                  id: 'map:spiral-mountain-digital-sea-secret',
                  label: 'Digital Sea · secret area',
                  hint: 'Secret · Pinochimon',
                },
                {
                  id: 'map:spiral-mountain-digital-forest',
                  label: 'Digital Forest',
                  hint: 'Boss: Pinochimon · Ep. 43–47',
                  requires: ['map:spiral-mountain-digital-sea'],
                },
                {
                  id: 'map:spiral-mountain-digital-city',
                  label: 'Digital City',
                  hint: 'Boss: Mugendramon · Ep. 48–49',
                  requires: ['map:spiral-mountain-digital-forest'],
                },
                {
                  id: 'map:spiral-mountain-digital-city-secret',
                  label: 'Digital City · secret area',
                  hint: 'Secret · Metal Etemon',
                },
                {
                  id: 'map:spiral-mountain-wasteland',
                  label: 'Wasteland',
                  hint: 'Boss: Piemon · Ep. 50–52',
                  requires: ['map:spiral-mountain-digital-city'],
                },
                {
                  id: 'map:spiral-mountain-wasteland-secret',
                  label: 'Wasteland · secret area',
                  hint: 'Secret · Mugendramon',
                },
              ],
            },
            {
              id: 'subspace',
              label: 'Subspace',
              items: [
                {
                  id: 'map:subspace',
                  label: 'Subspace',
                  hint: 'Boss: Apocalymon · Ep. 53–54',
                  requires: ['map:spiral-mountain-wasteland'],
                },
              ],
            },
            {
              id: 'network',
              label: 'Network',
              items: [
                {
                  id: 'map:network',
                  label: 'Network',
                  hint: 'Boss: Diablomon · Ep. Movie',
                  requires: ['map:subspace'],
                },
              ],
            },
          ],
        },
      ],
    },
  },
  // D-3
  {
    id: 'd3-ver-15th',
    name: 'D-3 Ver.15th',
    line: 'D-3',
    series: 'Ver.15th',
    releaseYear: 2016,
    variants: [
      {
        id: 'd3-ver15th-motomiya-daisuke',
        colorway: 'Motomiya Daisuke Color',
        releaseYear: 2016,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/d3-ver15th-motomiya-daisuke.webp',
      },
      {
        id: 'd3-ver15th-ichijouji-ken',
        colorway: 'Ichijouji Ken Color',
        releaseYear: 2016,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/d3-ver15th-ichijouji-ken.webp',
      },
      {
        id: 'd3-ver15th-paildramon',
        colorway: 'Paildramon Color',
        releaseYear: 2016,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/d3-ver15th-paildramon.webp',
      },
    ],
  },
  {
    id: 'd3-25th-color-evolution',
    name: 'D-3 -25th COLOR EVOLUTION-',
    line: 'D-3',
    series: '-25th COLOR EVOLUTION-',
    releaseYear: 2025,
    variants: [
      {
        id: 'd3-25th-motomiya-daisuke',
        colorway: 'Motomiya Daisuke Color',
        releaseYear: 2025,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/d3-25th-motomiya-daisuke.webp',
      },
      {
        id: 'd3-25th-ichijouji-ken',
        colorway: 'Ichijouji Ken Color',
        releaseYear: 2025,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/d3-25th-ichijouji-ken.webp',
      },
      {
        id: 'd3-25th-paildramon',
        colorway: 'Paildramon Color',
        releaseYear: 2025,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/d3-25th-paildramon.webp',
      },
    ],
  },
  // D-Ark
  {
    id: 'dark-ver-15th',
    name: 'D-Ark Ver.15th',
    line: 'D-Ark',
    series: 'Ver.15th',
    releaseYear: 2017,
    variants: [
      {
        id: 'dark-ver15th-matsuda-takato',
        colorway: 'Matsuda Takato Color',
        releaseYear: 2017,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/dark-ver15th-matsuda-takato.webp',
      },
      {
        id: 'dark-ver15th-makino-ruki',
        colorway: 'Makino Ruki Color',
        releaseYear: 2017,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/dark-ver15th-makino-ruki.webp',
      },
    ],
  },
  {
    id: 'dark-25th-color-evolution',
    name: 'D-Ark -25th COLOR EVOLUTION-',
    line: 'D-Ark',
    series: '-25th COLOR EVOLUTION-',
    releaseYear: 2026,
    variants: [
      {
        id: 'dark-25th-matsuda-takato',
        colorway: 'Matsuda Takato Color',
        releaseYear: 2026,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/dark-25th-matsuda-takato.webp',
      },
      {
        id: 'dark-25th-lee-jianliang',
        colorway: 'Lee Jianliang Color',
        releaseYear: 2026,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/dark-25th-lee-jianliang.webp',
      },
      {
        id: 'dark-25th-makino-ruki',
        colorway: 'Makino Ruki Color',
        releaseYear: 2026,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/dark-25th-makino-ruki.webp',
      },
    ],
  },
  // Xros Loader
  {
    id: 'xl-original',
    name: 'Digimon Xros Loader',
    line: 'Xros Loader',
    series: 'Original',
    releaseYear: 2010,
    variants: [
      {
        id: 'xl-original-red',
        colorway: 'Red',
        releaseYear: 2010,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/xl-original-red.webp',
      },
    ],
  },
  {
    id: 'xl-black-color-ver',
    name: 'Digimon Xros Loader Black Color Ver.',
    line: 'Xros Loader',
    series: 'Black Color Ver.',
    releaseYear: 2010,
    variants: [
      {
        id: 'xl-black-color-ver',
        colorway: 'Black',
        releaseYear: 2010,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/xl-black-color-ver.webp',
      },
    ],
  },
  {
    id: 'xl-blue-flare-side',
    name: 'Digimon Xros Loader Blue Flare Side',
    line: 'Xros Loader',
    series: 'Blue Flare Side',
    releaseYear: 2011,
    variants: [
      {
        id: 'xl-blue-flare-side',
        colorway: 'Blue',
        releaseYear: 2011,
        region: 'JP',
        imageUrl: '/assets/digimon/devices/xl-blue-flare-side.webp',
      },
    ],
  },
];

/** Distinct product lines in catalog (seed) order — iterated by the Completion view. */
export const DGM_LINES: string[] = [
  'Digital Monster',
  'Pendulum',
  'Vital Bracelet',
  'Digivice',
  'D-3',
  'D-Ark',
  'Xros Loader',
];
