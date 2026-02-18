// ─── Full Property Details ──────────────────────────────────────
// Detailed data for the property detail card: rent tiers, house/hotel costs, mortgage

const PROPERTY_DETAILS = {
  // ── Brown ─────────────────────────────────────────────────────
  1:  { name: 'Suresh',   group: 'brown',    groupLabel: 'Brown',     price: 60,  rent: 2,   rent1: 10,  rent2: 30,  rent3: 90,  rent4: 160, rentHotel: 250, houseCost: 50,  mortgage: 30 },
  3:  { name: 'Kotyans Cafe',  group: 'brown',    groupLabel: 'Brown',     price: 60,  rent: 4,   rent1: 20,  rent2: 60,  rent3: 180, rent4: 320, rentHotel: 450, houseCost: 50,  mortgage: 30 },

  // ── Light Blue ────────────────────────────────────────────────
  6:  { name: 'Malpe Beach',       group: 'lightblue', groupLabel: 'Light Blue', price: 100, rent: 6,   rent1: 30,  rent2: 90,  rent3: 270, rent4: 400, rentHotel: 550, houseCost: 50,  mortgage: 50 },
  8:  { name: 'Hoode Beach',     group: 'lightblue', groupLabel: 'Light Blue', price: 100, rent: 6,   rent1: 30,  rent2: 90,  rent3: 270, rent4: 400, rentHotel: 550, houseCost: 50,  mortgage: 50 },
  9:  { name: 'Kapu Beach',  group: 'lightblue', groupLabel: 'Light Blue', price: 120, rent: 8,   rent1: 40,  rent2: 100, rent3: 300, rent4: 450, rentHotel: 600, houseCost: 50,  mortgage: 60 },

  // ── Pink ──────────────────────────────────────────────────────
  11: { name: 'Block 5',       group: 'pink',     groupLabel: 'Pink',      price: 140, rent: 10,  rent1: 50,  rent2: 150, rent3: 450, rent4: 625, rentHotel: 750, houseCost: 100, mortgage: 70 },
  13: { name: 'Block 9',       group: 'pink',     groupLabel: 'Pink',      price: 140, rent: 10,  rent1: 50,  rent2: 150, rent3: 450, rent4: 625, rentHotel: 750, houseCost: 100, mortgage: 70 },
  14: { name: 'Block 13',  group: 'pink',     groupLabel: 'Pink',      price: 160, rent: 12,  rent1: 60,  rent2: 180, rent3: 500, rent4: 700, rentHotel: 900, houseCost: 100, mortgage: 80 },

  // ── Orange ────────────────────────────────────────────────────
  16: { name: 'Adithya Mess',      group: 'orange',   groupLabel: 'Orange',    price: 180, rent: 14,  rent1: 70,  rent2: 200, rent3: 550, rent4: 750, rentHotel: 950,  houseCost: 100, mortgage: 90 },
  18: { name: 'FC-1',  group: 'orange',   groupLabel: 'Orange',    price: 180, rent: 14,  rent1: 70,  rent2: 200, rent3: 550, rent4: 750, rentHotel: 950,  houseCost: 100, mortgage: 90 },
  19: { name: 'MIT Cafeteria',     group: 'orange',   groupLabel: 'Orange',    price: 200, rent: 16,  rent1: 80,  rent2: 220, rent3: 600, rent4: 800, rentHotel: 1000, houseCost: 100, mortgage: 100 },

  // ── Red ───────────────────────────────────────────────────────
  21: { name: 'Shubham Biryani',          group: 'red',      groupLabel: 'Red',       price: 220, rent: 18,  rent1: 90,  rent2: 250, rent3: 700, rent4: 875, rentHotel: 1050, houseCost: 150, mortgage: 110 },
  23: { name: 'MFC',    group: 'red',      groupLabel: 'Red',       price: 220, rent: 18,  rent1: 90,  rent2: 250, rent3: 700, rent4: 875, rentHotel: 1050, houseCost: 150, mortgage: 110 },
  24: { name: 'Smoky Docky',    group: 'red',      groupLabel: 'Red',       price: 240, rent: 20,  rent1: 100, rent2: 300, rent3: 750, rent4: 925, rentHotel: 1100, houseCost: 150, mortgage: 120 },

  // ── Yellow ────────────────────────────────────────────────────
  26: { name: 'Bacchus Inn',    group: 'yellow',   groupLabel: 'Yellow',    price: 260, rent: 22,  rent1: 110, rent2: 330, rent3: 800, rent4: 975, rentHotel: 1150, houseCost: 150, mortgage: 130 },
  27: { name: 'DTR',     group: 'yellow',   groupLabel: 'Yellow',    price: 260, rent: 22,  rent1: 110, rent2: 330, rent3: 800, rent4: 975, rentHotel: 1150, houseCost: 150, mortgage: 130 },
  29: { name: 'Edge',      group: 'yellow',   groupLabel: 'Yellow',    price: 280, rent: 24,  rent1: 120, rent2: 360, rent3: 850, rent4: 1025,rentHotel: 1200, houseCost: 150, mortgage: 140 },

  // ── Green ─────────────────────────────────────────────────────
  31: { name: 'Mandavi Emerald',   group: 'green',    groupLabel: 'Green',     price: 300, rent: 26,  rent1: 130, rent2: 390, rent3: 900, rent4: 1100,rentHotel: 1275, houseCost: 200, mortgage: 150 },
  32: { name: 'Mandavi Pearl City',   group: 'green',    groupLabel: 'Green',     price: 300, rent: 26,  rent1: 130, rent2: 390, rent3: 900, rent4: 1100,rentHotel: 1275, houseCost: 200, mortgage: 150 },
  34: { name: 'Mandavi Paradise',     group: 'green',    groupLabel: 'Green',     price: 320, rent: 28,  rent1: 150, rent2: 450, rent3: 1000,rent4: 1200,rentHotel: 1400, houseCost: 200, mortgage: 160 },

  // ── Dark Blue ─────────────────────────────────────────────────
  37: { name: 'Odyssey',       group: 'darkblue', groupLabel: 'Dark Blue', price: 350, rent: 35,  rent1: 175, rent2: 500, rent3: 1100,rent4: 1300,rentHotel: 1500, houseCost: 200, mortgage: 175 },
  39: { name: 'Royal Embassy',         group: 'darkblue', groupLabel: 'Dark Blue', price: 400, rent: 50,  rent1: 200, rent2: 600, rent3: 1400,rent4: 1700,rentHotel: 2000, houseCost: 200, mortgage: 200 },

  // ── Railroads ─────────────────────────────────────────────────
  5:  { name: "Udupi Bus Stand",    group: 'railroad', groupLabel: 'Railroad',  price: 200, rent: 25,  rent2rr: 50, rent3rr: 100, rent4rr: 200, mortgage: 100, isRailroad: true },
  15: { name: 'Mangalore Airport',  group: 'railroad', groupLabel: 'Railroad',  price: 200, rent: 25,  rent2rr: 50, rent3rr: 100, rent4rr: 200, mortgage: 100, isRailroad: true },
  25: { name: 'Tiger Circle Auto Stand',   group: 'railroad', groupLabel: 'Railroad',  price: 200, rent: 25,  rent2rr: 50, rent3rr: 100, rent4rr: 200, mortgage: 100, isRailroad: true },
  35: { name: 'Udupi Railway Station',   group: 'railroad', groupLabel: 'Railroad',  price: 200, rent: 25,  rent2rr: 50, rent3rr: 100, rent4rr: 200, mortgage: 100, isRailroad: true },

  // ── Utilities ─────────────────────────────────────────────────
  12: { name: 'MLH',    group: 'utility',  groupLabel: 'Utility',   price: 150, rentRule: '4× dice if 1 owned, 10× dice if both owned', mortgage: 75, isUtility: true },
  28: { name: 'Thalloor',     group: 'utility',  groupLabel: 'Utility',   price: 150, rentRule: '4× dice if 1 owned, 10× dice if both owned', mortgage: 75, isUtility: true },
};

export default PROPERTY_DETAILS;
