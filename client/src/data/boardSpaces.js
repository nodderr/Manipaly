// ─── Board Data: 40 Monopoly-style spaces ──────────────────────
// Each space: id, name, type, group (color), price

const BOARD_SPACES = [
  // ── Bottom Row (right to left: GO is bottom-right corner) ─────
  { id: 0,  name: 'GO',              type: 'corner',   group: null,       price: null },
  { id: 1,  name: 'Old Kent Road',   type: 'property', group: 'brown',    price: 60 },
  { id: 2,  name: 'Community Chest', type: 'chest',    group: null,       price: null },
  { id: 3,  name: 'Whitechapel Rd',  type: 'property', group: 'brown',    price: 60 },
  { id: 4,  name: 'Income Tax',      type: 'tax',      group: null,       price: 200 },
  { id: 5,  name: "King's Cross",    type: 'railroad', group: 'railroad', price: 200 },
  { id: 6,  name: 'The Angel',       type: 'property', group: 'lightblue', price: 100 },
  { id: 7,  name: 'Chance',          type: 'chance',   group: null,       price: null },
  { id: 8,  name: 'Euston Road',     type: 'property', group: 'lightblue', price: 100 },
  { id: 9,  name: 'Pentonville Rd',  type: 'property', group: 'lightblue', price: 120 },

  // ── Left Column (bottom to top) ───────────────────────────────
  { id: 10, name: 'Jail',            type: 'corner',   group: null,       price: null },
  { id: 11, name: 'Pall Mall',       type: 'property', group: 'pink',     price: 140 },
  { id: 12, name: 'Electric Co.',    type: 'utility',  group: 'utility',  price: 150 },
  { id: 13, name: 'Whitehall',       type: 'property', group: 'pink',     price: 140 },
  { id: 14, name: 'Northumberland',  type: 'property', group: 'pink',     price: 160 },
  { id: 15, name: 'Marylebone Stn',  type: 'railroad', group: 'railroad', price: 200 },
  { id: 16, name: 'Bow Street',      type: 'property', group: 'orange',   price: 180 },
  { id: 17, name: 'Community Chest', type: 'chest',    group: null,       price: null },
  { id: 18, name: 'Marlborough St',  type: 'property', group: 'orange',   price: 180 },
  { id: 19, name: 'Vine Street',     type: 'property', group: 'orange',   price: 200 },

  // ── Top Row (left to right) ───────────────────────────────────
  { id: 20, name: 'Free Parking',    type: 'corner',   group: null,       price: null },
  { id: 21, name: 'Strand',          type: 'property', group: 'red',      price: 220 },
  { id: 22, name: 'Chance',          type: 'chance',   group: null,       price: null },
  { id: 23, name: 'Fleet Street',    type: 'property', group: 'red',      price: 220 },
  { id: 24, name: 'Trafalgar Sq',    type: 'property', group: 'red',      price: 240 },
  { id: 25, name: 'Fenchurch Stn',   type: 'railroad', group: 'railroad', price: 200 },
  { id: 26, name: 'Leicester Sq',    type: 'property', group: 'yellow',   price: 260 },
  { id: 27, name: 'Coventry St',     type: 'property', group: 'yellow',   price: 260 },
  { id: 28, name: 'Water Works',     type: 'utility',  group: 'utility',  price: 150 },
  { id: 29, name: 'Piccadilly',      type: 'property', group: 'yellow',   price: 280 },

  // ── Right Column (top to bottom) ──────────────────────────────
  { id: 30, name: 'Go To Jail',      type: 'corner',   group: null,       price: null },
  { id: 31, name: 'Regent Street',   type: 'property', group: 'green',    price: 300 },
  { id: 32, name: 'Oxford Street',   type: 'property', group: 'green',    price: 300 },
  { id: 33, name: 'Community Chest', type: 'chest',    group: null,       price: null },
  { id: 34, name: 'Bond Street',     type: 'property', group: 'green',    price: 320 },
  { id: 35, name: 'Liverpool Stn',   type: 'railroad', group: 'railroad', price: 200 },
  { id: 36, name: 'Chance',          type: 'chance',   group: null,       price: null },
  { id: 37, name: 'Park Lane',       type: 'property', group: 'darkblue', price: 350 },
  { id: 38, name: 'Super Tax',       type: 'tax',      group: null,       price: 200 },
  { id: 39, name: 'Mayfair',         type: 'property', group: 'darkblue', price: 400 },
];

export default BOARD_SPACES;
