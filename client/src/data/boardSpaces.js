import PROPERTY_DETAILS from './propertyDetails';

// Base layout: defines the sequence and types of spaces (0 to 39)
const LAYOUT = [
  // ── Bottom Row ────────────────────────────────────────────────
  { id: 0,  name: 'GO',              type: 'corner' },
  { id: 1,  /* property */           type: 'property' },
  { id: 2,  name: 'Community Chest', type: 'chest' },
  { id: 3,  /* property */           type: 'property' },
  { id: 4,  name: 'Income Tax',      type: 'tax',      price: 200 },
  { id: 5,  /* railroad */           type: 'railroad' },
  { id: 6,  /* property */           type: 'property' },
  { id: 7,  name: 'Chance',          type: 'chance' },
  { id: 8,  /* property */           type: 'property' },
  { id: 9,  /* property */           type: 'property' },

  // ── Left Column ───────────────────────────────────────────────
  { id: 10, name: 'Jail',            type: 'corner' },
  { id: 11, /* property */           type: 'property' },
  { id: 12, /* utility */            type: 'utility' },
  { id: 13, /* property */           type: 'property' },
  { id: 14, /* property */           type: 'property' },
  { id: 15, /* railroad */           type: 'railroad' },
  { id: 16, /* property */           type: 'property' },
  { id: 17, name: 'Community Chest', type: 'chest' },
  { id: 18, /* property */           type: 'property' },
  { id: 19, /* property */           type: 'property' },

  // ── Top Row ───────────────────────────────────────────────────
  { id: 20, name: 'Free Parking',    type: 'corner' },
  { id: 21, /* property */           type: 'property' },
  { id: 22, name: 'Chance',          type: 'chance' },
  { id: 23, /* property */           type: 'property' },
  { id: 24, /* property */           type: 'property' },
  { id: 25, /* railroad */           type: 'railroad' },
  { id: 26, /* property */           type: 'property' },
  { id: 27, /* property */           type: 'property' },
  { id: 28, /* utility */            type: 'utility' },
  { id: 29, /* property */           type: 'property' },

  // ── Right Column ──────────────────────────────────────────────
  { id: 30, name: 'Go To Jail',      type: 'corner' },
  { id: 31, /* property */           type: 'property' },
  { id: 32, /* property */           type: 'property' },
  { id: 33, name: 'Community Chest', type: 'chest' },
  { id: 34, /* property */           type: 'property' },
  { id: 35, /* railroad */           type: 'railroad' },
  { id: 36, name: 'Chance',          type: 'chance' },
  { id: 37, /* property */           type: 'property' },
  { id: 38, name: 'Super Tax',       type: 'tax',      price: 200 },
  { id: 39, /* property */           type: 'property' },
];

// Merge the static layout with the dynamic property details
const BOARD_SPACES = LAYOUT.map(space => {
  const details = PROPERTY_DETAILS[space.id];
  if (details) {
    return {
      ...space,
      name: details.name,
      group: details.group,
      price: details.price,
    };
  }
  return { ...space, group: space.group || null, price: space.price || null };
});

export default BOARD_SPACES;
