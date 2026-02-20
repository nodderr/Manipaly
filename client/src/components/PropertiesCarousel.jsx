import React, { useState } from 'react';
import PROPERTY_DETAILS from '../data/propertyDetails';
import './PropertiesCarousel.css';

const GROUP_ORDER = [
  'brown', 'lightblue', 'pink', 'orange', 'red', 'yellow', 'green', 'darkblue', 'railroad', 'utility',
];

const GROUP_COLORS = {
  brown:     '#8B4513',
  lightblue: '#AAD8E6',
  pink:      '#D93A96',
  orange:    '#F7941D',
  red:       '#ED1B24',
  yellow:    '#FDEF44',
  green:     '#1FB25A',
  darkblue:  '#0072BB',
  railroad:  '#444',
  utility:   '#444',
};

const GROUP_LABELS = {
  brown: 'Brown', lightblue: 'Light Blue', pink: 'Pink', orange: 'Orange',
  red: 'Red', yellow: 'Yellow', green: 'Green', darkblue: 'Dark Blue',
  railroad: 'Railroads', utility: 'Utilities',
};

export default function PropertiesCarousel({ properties, playerId, onPropertyClick }) {
  const [openGroup, setOpenGroup] = useState(null);

  // Gather player's properties grouped by color
  const grouped = {};
  for (const [spaceId, val] of Object.entries(properties)) {
    if (val.ownerId !== playerId) continue;
    const detail = PROPERTY_DETAILS[Number(spaceId)];
    if (!detail) continue;
    if (!grouped[detail.group]) grouped[detail.group] = [];
    grouped[detail.group].push({ spaceId: Number(spaceId), ...detail });
  }

  const activeGroups = GROUP_ORDER.filter((g) => grouped[g]);

  if (activeGroups.length === 0) {
    return (
      <div className="accordion">
        <div className="accordion__empty">No properties yet</div>
      </div>
    );
  }

  return (
    <div className="accordion">
      {activeGroups.map((group) => {
        const isOpen = openGroup === group;
        const color = GROUP_COLORS[group];
        const label = GROUP_LABELS[group];
        const props = grouped[group];
        const isLight = group === 'yellow' || group === 'lightblue';

        return (
          <div key={group} className="accordion__group">
            <button
              className={`accordion__header ${isOpen ? 'accordion__header--open' : ''}`}
              onClick={() => setOpenGroup(isOpen ? null : group)}
            >
              <span className="accordion__swatch" style={{ backgroundColor: color }} />
              <span className="accordion__label">{label}</span>
              <span className="accordion__count">{props.length}</span>
              <span className="accordion__chevron">{isOpen ? '▾' : '▸'}</span>
            </button>

            {isOpen && (
              <div className="accordion__body">
                {props.map((prop) => (
                  <div
                    key={prop.spaceId}
                    className="accordion__item"
                    onClick={() => onPropertyClick(prop.spaceId)}
                  >
                    <div
                      className="accordion__item-band"
                      style={{ backgroundColor: color }}
                    />
                    <div className="accordion__item-info">
                      <span className="accordion__item-name">{prop.name}</span>
                      <span className="accordion__item-rent">Rent ₹{prop.rent}</span>
                    </div>
                    <span className="accordion__item-price">₹{prop.price}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
