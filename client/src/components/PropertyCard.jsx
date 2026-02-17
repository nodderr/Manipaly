import React from 'react';
import PROPERTY_DETAILS from '../data/propertyDetails';
import './PropertyCard.css';

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

/**
 * Property detail card — shown as a popup/modal when clicking a board square.
 * Props: spaceId, owner (optional { ownerName }), onClose
 */
export default function PropertyCard({ spaceId, owner, onClose }) {
  const detail = PROPERTY_DETAILS[spaceId];
  if (!detail) return null;

  const color = GROUP_COLORS[detail.group] || '#444';
  const isLight = detail.group === 'yellow' || detail.group === 'lightblue';

  return (
    <div className="propcard-overlay" onClick={onClose}>
      <div className="propcard" onClick={(e) => e.stopPropagation()}>
        {/* Header with group color */}
        <div className="propcard__header" style={{ backgroundColor: color }}>
          <span className={`propcard__title ${isLight ? 'propcard__title--dark' : ''}`}>
            {detail.name}
          </span>
          <span className={`propcard__group ${isLight ? 'propcard__group--dark' : ''}`}>
            {detail.groupLabel}
          </span>
        </div>

        {/* Body */}
        <div className="propcard__body">
          {/* Price */}
          <div className="propcard__row propcard__row--price">
            <span>Price</span>
            <span className="propcard__val">${detail.price}</span>
          </div>

          <div className="propcard__divider" />

          {/* Rent tiers */}
          {!detail.isRailroad && !detail.isUtility && (
            <>
              <div className="propcard__row">
                <span>Rent (no houses)</span>
                <span className="propcard__val">${detail.rent}</span>
              </div>
              <div className="propcard__row">
                <span>With 1 House</span>
                <span className="propcard__val">${detail.rent1}</span>
              </div>
              <div className="propcard__row">
                <span>With 2 Houses</span>
                <span className="propcard__val">${detail.rent2}</span>
              </div>
              <div className="propcard__row">
                <span>With 3 Houses</span>
                <span className="propcard__val">${detail.rent3}</span>
              </div>
              <div className="propcard__row">
                <span>With 4 Houses</span>
                <span className="propcard__val">${detail.rent4}</span>
              </div>
              <div className="propcard__row propcard__row--highlight">
                <span>With Hotel 🏨</span>
                <span className="propcard__val">${detail.rentHotel}</span>
              </div>
              <div className="propcard__divider" />
              <div className="propcard__row">
                <span>House Cost</span>
                <span className="propcard__val">${detail.houseCost} each</span>
              </div>
              <div className="propcard__row">
                <span>Hotel Cost</span>
                <span className="propcard__val">${detail.houseCost} + 4 houses</span>
              </div>
            </>
          )}

          {detail.isRailroad && (
            <>
              <div className="propcard__row">
                <span>Rent (1 RR owned)</span>
                <span className="propcard__val">${detail.rent}</span>
              </div>
              <div className="propcard__row">
                <span>Rent (2 RRs owned)</span>
                <span className="propcard__val">${detail.rent2rr}</span>
              </div>
              <div className="propcard__row">
                <span>Rent (3 RRs owned)</span>
                <span className="propcard__val">${detail.rent3rr}</span>
              </div>
              <div className="propcard__row propcard__row--highlight">
                <span>Rent (4 RRs owned)</span>
                <span className="propcard__val">${detail.rent4rr}</span>
              </div>
            </>
          )}

          {detail.isUtility && (
            <div className="propcard__row">
              <span>Rent Rule</span>
              <span className="propcard__val propcard__val--small">{detail.rentRule}</span>
            </div>
          )}

          <div className="propcard__divider" />

          <div className="propcard__row">
            <span>Mortgage Value</span>
            <span className="propcard__val">${detail.mortgage}</span>
          </div>

          {/* Owner info */}
          {owner && (
            <>
              <div className="propcard__divider" />
              <div className="propcard__row propcard__row--owner">
                <span>Owned by</span>
                <span className="propcard__val">{owner.ownerName}</span>
              </div>
            </>
          )}
        </div>

        <button className="propcard__close" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
