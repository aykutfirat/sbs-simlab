import type { SurvivalItem } from '../types';

export const SURVIVAL_ITEMS: SurvivalItem[] = [
  {
    id: 'oxygen',
    name: 'Two 100-lb tanks of oxygen',
    nasaRank: 1,
    reasoning: 'Most pressing survival need — there is virtually no air on the moon.',
  },
  {
    id: 'water',
    name: '5 gallons of water',
    nasaRank: 2,
    reasoning: 'Replacement of tremendous liquid loss on the light side of the moon.',
  },
  {
    id: 'star-map',
    name: 'Stellar map',
    nasaRank: 3,
    reasoning: 'Primary means of navigation — star patterns appear essentially identical from the moon as from Earth.',
  },
  {
    id: 'food',
    name: 'Food concentrate',
    nasaRank: 4,
    reasoning: 'Efficient means of supplying energy requirements.',
  },
  {
    id: 'fm-radio',
    name: 'Solar-powered FM receiver-transmitter',
    nasaRank: 5,
    reasoning: 'For communication with mother ship; FM requires line-of-sight and short ranges.',
  },
  {
    id: 'rope',
    name: '50 feet of nylon rope',
    nasaRank: 6,
    reasoning: 'Useful in scaling cliffs and tying injured together.',
  },
  {
    id: 'first-aid',
    name: 'First aid kit (with injection needle)',
    nasaRank: 7,
    reasoning: 'Needles for vitamins, medicines, etc. will fit special aperture in NASA space suit.',
  },
  {
    id: 'parachute',
    name: 'Parachute silk',
    nasaRank: 8,
    reasoning: 'Protection from the sun\'s rays; can be used as a carrying sling.',
  },
  {
    id: 'life-raft',
    name: 'Self-inflating life raft',
    nasaRank: 9,
    reasoning: 'CO2 bottle in military raft may be used for propulsion.',
  },
  {
    id: 'signal-flares',
    name: 'Signal flares',
    nasaRank: 10,
    reasoning: 'Distress signal when mother ship is sighted; no oxygen on moon so these require their own.',
  },
  {
    id: 'pistols',
    name: 'Two .45 calibre pistols',
    nasaRank: 11,
    reasoning: 'Possible means of self-propulsion.',
  },
  {
    id: 'milk',
    name: 'One case of dehydrated milk',
    nasaRank: 12,
    reasoning: 'Bulkier duplication of food concentrate.',
  },
  {
    id: 'heating-unit',
    name: 'Portable heating unit',
    nasaRank: 13,
    reasoning: 'Not needed unless on the dark side of the moon.',
  },
  {
    id: 'compass',
    name: 'Magnetic compass',
    nasaRank: 14,
    reasoning: 'The magnetic field on the moon is not polarized, so this is essentially worthless for navigation.',
  },
  {
    id: 'matches',
    name: 'Box of matches',
    nasaRank: 15,
    reasoning: 'Virtually worthless — there is no oxygen on the moon to sustain combustion.',
  },
];

// Default shuffled order for initial display
export const DEFAULT_ITEM_ORDER = SURVIVAL_ITEMS.map(item => item.id);

export function getItemById(id: string): SurvivalItem | undefined {
  return SURVIVAL_ITEMS.find(item => item.id === id);
}

export function getItemsMap(): Record<string, SurvivalItem> {
  const map: Record<string, SurvivalItem> = {};
  for (const item of SURVIVAL_ITEMS) {
    map[item.id] = item;
  }
  return map;
}
