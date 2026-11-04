// Icon and colour for a room, from its name (falls back to a colour by position).
const RULES = [
  [/living|lounge|family/, 'weekend', 'honey'],
  [/kitchen|dining|pantry/, 'kitchen', 'clay'],
  [/bed|master|nursery|kid/, 'bed', 'plum'],
  [/study|office|work|desk/, 'desk', 'blue'],
  [/bath|toilet|washroom/, 'bathtub', 'blue'],
  [/garage|porch|car|driveway/, 'garage', 'clay'],
  [/garden|yard|balcony|patio|outdoor/, 'yard', 'sage'],
  [/entry|hall|foyer|door/, 'door_front', 'honey'],
];
const CYCLE = ['sage', 'blue', 'honey', 'plum', 'clay'];
export function roomStyle(name = '', index = 0) {
  const n = name.toLowerCase();
  const hit = RULES.find(([re]) => re.test(n));
  return hit ? { icon: hit[1], tone: hit[2] } : { icon: 'meeting_room', tone: CYCLE[index % CYCLE.length] };
}
