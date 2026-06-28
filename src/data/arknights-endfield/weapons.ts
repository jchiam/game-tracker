// Hand-authored weapon catalog for Arknights: Endfield.
// Manually maintained — no stable structured data source exists yet. When editing,
// follow the documented procedure in openspec/specs/ae-weapon-catalog/spec.md.
//
// `type` MUST exactly string-match a value of `AeOperator.weapon` in operators.ts
// (`Sword`, `Greatsword`, `Polearm`, `Handcannon`, `Arts Unit`) — it is the join key
// the operator card uses to filter equippable weapons by class. No casing/spacing drift.
//
// Names/rarities cross-checked against game8.co and endfield.wiki.gg weapon lists.
// Where the two disagree on a low-rarity weapon, game8's value is used because it
// matches the per-class tier pattern (one 3★, two 4★, several 5★/6★ per class).
// Verify against a community Endfield database on each patch. Automating this is tracked
// by the `add-ae-data-pipeline` change alongside the operator catalog.

export interface AeWeapon {
  id: string;
  name: string;
  rarity: 3 | 4 | 5 | 6;
  type: string; // matches AeOperator.weapon
}

export const ALL_WEAPONS: AeWeapon[] = [
  // ─── Sword ───────────────────────────────────────────────────────
  { id: 'tarr-11', name: 'Tarr 11', rarity: 3, type: 'Sword' },
  { id: 'prominent-edge', name: 'Prominent Edge', rarity: 4, type: 'Sword' },
  { id: 'wave-tide', name: 'Wave Tide', rarity: 4, type: 'Sword' },
  { id: 'obj-edge-of-lightness', name: 'OBJ Edge of Lightness', rarity: 5, type: 'Sword' },
  { id: 'sundering-steel', name: 'Sundering Steel', rarity: 5, type: 'Sword' },
  { id: 'twelve-questions', name: 'Twelve Questions', rarity: 5, type: 'Sword' },
  { id: 'aspirant', name: 'Aspirant', rarity: 5, type: 'Sword' },
  { id: 'finchaser-3-0', name: 'Finchaser 3.0', rarity: 5, type: 'Sword' },
  { id: 'fortmaker', name: 'Fortmaker', rarity: 5, type: 'Sword' },
  { id: 'forgeborn-scathe', name: 'Forgeborn Scathe', rarity: 6, type: 'Sword' },
  { id: 'lupine-scarlet', name: 'Lupine Scarlet', rarity: 6, type: 'Sword' },
  { id: 'umbral-torch', name: 'Umbral Torch', rarity: 6, type: 'Sword' },
  { id: 'grand-vision', name: 'Grand Vision', rarity: 6, type: 'Sword' },
  { id: 'never-rest', name: 'Never Rest', rarity: 6, type: 'Sword' },
  { id: 'thermite-cutter', name: 'Thermite Cutter', rarity: 6, type: 'Sword' },
  { id: 'eminent-repute', name: 'Eminent Repute', rarity: 6, type: 'Sword' },
  { id: 'white-night-nova', name: 'White Night Nova', rarity: 6, type: 'Sword' },
  { id: 'glorious-memory', name: 'Glorious Memory', rarity: 6, type: 'Sword' },
  { id: 'rapid-ascent', name: 'Rapid Ascent', rarity: 6, type: 'Sword' },

  // ─── Greatsword ──────────────────────────────────────────────────
  { id: 'darhoff-7', name: 'Darhoff 7', rarity: 3, type: 'Greatsword' },
  { id: 'quencher', name: 'Quencher', rarity: 4, type: 'Greatsword' },
  { id: 'industry-0-1', name: 'Industry 0.1', rarity: 4, type: 'Greatsword' },
  { id: 'seeker-of-dark-lung', name: 'Seeker of Dark Lung', rarity: 5, type: 'Greatsword' },
  { id: 'ancient-canal', name: 'Ancient Canal', rarity: 5, type: 'Greatsword' },
  { id: 'obj-heavy-burden', name: 'OBJ Heavy Burden', rarity: 5, type: 'Greatsword' },
  { id: 'finishing-call', name: 'Finishing Call', rarity: 5, type: 'Greatsword' },
  { id: 'exemplar', name: 'Exemplar', rarity: 6, type: 'Greatsword' },
  { id: 'khravengger', name: 'Khravengger', rarity: 6, type: 'Greatsword' },
  { id: 'thunderberge', name: 'Thunderberge', rarity: 6, type: 'Greatsword' },
  { id: 'former-finery', name: 'Former Finery', rarity: 6, type: 'Greatsword' },
  { id: 'sundered-prince', name: 'Sundered Prince', rarity: 6, type: 'Greatsword' },
  { id: 'amaranthine-tassel', name: 'Amaranthine Tassel', rarity: 6, type: 'Greatsword' },
  { id: 'phantom-pain', name: 'Phantom Pain', rarity: 6, type: 'Greatsword' },

  // ─── Polearm ─────────────────────────────────────────────────────
  { id: 'opero-77', name: 'Opero 77', rarity: 3, type: 'Polearm' },
  { id: 'aggeloslayer', name: 'Aggeloslayer', rarity: 4, type: 'Polearm' },
  { id: 'pathfinders-beacon', name: "Pathfinder's Beacon", rarity: 4, type: 'Polearm' },
  { id: 'cohesive-traction', name: 'Cohesive Traction', rarity: 5, type: 'Polearm' },
  { id: 'obj-razorhorn', name: 'OBJ Razorhorn', rarity: 5, type: 'Polearm' },
  { id: 'chimeric-justice', name: 'Chimeric Justice', rarity: 5, type: 'Polearm' },
  { id: 'valiant', name: 'Valiant', rarity: 6, type: 'Polearm' },
  { id: 'mountain-bearer', name: 'Mountain Bearer', rarity: 6, type: 'Polearm' },
  { id: 'jet', name: 'JET', rarity: 6, type: 'Polearm' },
  { id: 'beacon-of-duty', name: 'Beacon of Duty', rarity: 6, type: 'Polearm' },
  {
    id: 'blessing-of-lustrous-carmine',
    name: 'Blessing of Lustrous Carmine',
    rarity: 6,
    type: 'Polearm',
  },

  // ─── Handcannon ──────────────────────────────────────────────────
  { id: 'peco-5', name: 'Peco 5', rarity: 3, type: 'Handcannon' },
  { id: 'long-road', name: 'Long Road', rarity: 4, type: 'Handcannon' },
  { id: 'howling-guard', name: 'Howling Guard', rarity: 4, type: 'Handcannon' },
  { id: 'obj-velocitous', name: 'OBJ Velocitous', rarity: 5, type: 'Handcannon' },
  { id: 'opus-the-living', name: 'Opus: The Living', rarity: 5, type: 'Handcannon' },
  { id: 'rational-farewell', name: 'Rational Farewell', rarity: 5, type: 'Handcannon' },
  { id: 'navigator', name: 'Navigator', rarity: 6, type: 'Handcannon' },
  { id: 'clannibal', name: 'Clannibal', rarity: 6, type: 'Handcannon' },
  { id: 'artzy-tyrannical', name: 'Artzy Tyrannical', rarity: 6, type: 'Handcannon' },
  { id: 'wedge', name: 'Wedge', rarity: 6, type: 'Handcannon' },
  { id: 'home-longing', name: 'Home Longing', rarity: 6, type: 'Handcannon' },
  { id: 'brigands-calling', name: "Brigand's Calling", rarity: 6, type: 'Handcannon' },

  // ─── Arts Unit ───────────────────────────────────────────────────
  { id: 'jiminy-12', name: 'Jiminy 12', rarity: 3, type: 'Arts Unit' },
  { id: 'hypernova-auto', name: 'Hypernova Auto', rarity: 4, type: 'Arts Unit' },
  { id: 'fluorescent-roc', name: 'Fluorescent Roc', rarity: 4, type: 'Arts Unit' },
  { id: 'monaihe', name: 'Monaihe', rarity: 5, type: 'Arts Unit' },
  { id: 'stanza-of-memorials', name: 'Stanza of Memorials', rarity: 5, type: 'Arts Unit' },
  { id: 'obj-arts-identifier', name: 'OBJ Arts Identifier', rarity: 5, type: 'Arts Unit' },
  { id: 'freedom-to-proselytize', name: 'Freedom to Proselytize', rarity: 5, type: 'Arts Unit' },
  { id: 'wild-wanderer', name: 'Wild Wanderer', rarity: 5, type: 'Arts Unit' },
  { id: 'delivery-guaranteed', name: 'Delivery Guaranteed', rarity: 6, type: 'Arts Unit' },
  {
    id: 'dreams-of-the-starry-beach',
    name: 'Dreams of the Starry Beach',
    rarity: 6,
    type: 'Arts Unit',
  },
  { id: 'opus-etch-figure', name: 'Opus: Etch Figure', rarity: 6, type: 'Arts Unit' },
  { id: 'detonation-unit', name: 'Detonation Unit', rarity: 6, type: 'Arts Unit' },
  { id: 'chivalric-virtues', name: 'Chivalric Virtues', rarity: 6, type: 'Arts Unit' },
  { id: 'oblivion', name: 'Oblivion', rarity: 6, type: 'Arts Unit' },
  { id: 'lone-barge', name: 'Lone Barge', rarity: 6, type: 'Arts Unit' },
  { id: 'flickers-in-the-mist', name: 'Flickers in the Mist', rarity: 6, type: 'Arts Unit' },
];
