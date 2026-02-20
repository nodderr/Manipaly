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

export default function PropertyCard({ spaceId, owner, myId, onClose, onBuild, onMortgage, onUnmortgage }) {
  const detail = PROPERTY_DETAILS[spaceId];
  if (!detail) return null;

  const color = GROUP_COLORS[detail.group] || '#444';
  const isLight = detail.group === 'yellow' || detail.group === 'lightblue';
  const isMine = owner && owner.ownerId === myId;
  const isMortgaged = owner?.mortgaged;
  const houses = owner?.houses || 0;

  // Highlight current rent tier
  const currentRentIndex = houses;

  return (
    <div className="propcard-overlay" onClick={onClose}>
      <div className="propcard" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="propcard__header" style={{ backgroundColor: color }}>
          <span className={`propcard__title ${isLight ? 'propcard__title--dark' : ''}`}>
            {detail.name}
          </span>
          <span className={`propcard__group ${isLight ? 'propcard__group--dark' : ''}`}>
            {detail.groupLabel}
            {isMortgaged && ' (MORTGAGED)'}
          </span>
        </div>

        {/* Body */}
        <div className="propcard__body">
          <div className="propcard__row propcard__row--price">
            <span>Price</span>
            <span className="propcard__val">₹{detail.price}</span>
          </div>

          <div className="propcard__divider" />

          {/* Regular property rent tiers */}
          {!detail.isRailroad && !detail.isUtility && (
            <>
              <div className={`propcard__row ${currentRentIndex === 0 && isMine ? 'propcard__row--active-rent' : ''}`}>
                <span>Rent (no houses)</span>
                <span className="propcard__val">₹{detail.rent}</span>
              </div>
              <div className={`propcard__row ${currentRentIndex === 1 && isMine ? 'propcard__row--active-rent' : ''}`}>
                <span>With 1 House 🏠</span>
                <span className="propcard__val">₹{detail.rent1}</span>
              </div>
              <div className={`propcard__row ${currentRentIndex === 2 && isMine ? 'propcard__row--active-rent' : ''}`}>
                <span>With 2 Houses</span>
                <span className="propcard__val">₹{detail.rent2}</span>
              </div>
              <div className={`propcard__row ${currentRentIndex === 3 && isMine ? 'propcard__row--active-rent' : ''}`}>
                <span>With 3 Houses</span>
                <span className="propcard__val">₹{detail.rent3}</span>
              </div>
              <div className={`propcard__row ${currentRentIndex === 4 && isMine ? 'propcard__row--active-rent' : ''}`}>
                <span>With 4 Houses</span>
                <span className="propcard__val">₹{detail.rent4}</span>
              </div>
              <div className={`propcard__row ${currentRentIndex === 5 && isMine ? 'propcard__row--active-rent' : ''} propcard__row--highlight`}>
                <span>With Hotel 🏨</span>
                <span className="propcard__val">₹{detail.rentHotel}</span>
              </div>
              <div className="propcard__divider" />
              <div className="propcard__row">
                <span>House Cost</span>
                <span className="propcard__val">₹{detail.houseCost} each</span>
              </div>
            </>
          )}

          {/* Railroad tiers */}
          {detail.isRailroad && (
            <>
              <div className="propcard__row"><span>1 RR owned</span><span className="propcard__val">₹{detail.rent}</span></div>
              <div className="propcard__row"><span>2 RRs owned</span><span className="propcard__val">₹{detail.rent2rr}</span></div>
              <div className="propcard__row"><span>3 RRs owned</span><span className="propcard__val">₹{detail.rent3rr}</span></div>
              <div className="propcard__row propcard__row--highlight"><span>4 RRs owned</span><span className="propcard__val">₹{detail.rent4rr}</span></div>
            </>
          )}

          {/* Utility */}
          {detail.isUtility && (
            <div className="propcard__row">
              <span>Rent Rule</span>
              <span className="propcard__val propcard__val--small">{detail.rentRule}</span>
            </div>
          )}

          <div className="propcard__divider" />

          <div className="propcard__row">
            <span>Mortgage Value</span>
            <span className="propcard__val">₹{detail.mortgage}</span>
          </div>

          {/* Owner info */}
          {owner && (
            <>
              <div className="propcard__divider" />
              <div className="propcard__row propcard__row--owner">
                <span>Owned by</span>
                <span className="propcard__val">
                  {owner.ownerName}
                  {houses > 0 && ` (${houses === 5 ? '🏨 Hotel' : `🏠 ×${houses}`})`}
                </span>
              </div>
            </>
          )}

          {/* Action buttons for my properties */}
          {isMine && (
            <div className="propcard__actions">
              {!detail.isRailroad && !detail.isUtility && !isMortgaged && houses < 5 && (
                <button className="propcard__action-btn propcard__action-btn--build" onClick={() => { onBuild(spaceId); onClose(); }}>
                  🏠 Build House (${detail.houseCost})
                </button>
              )}
              {!isMortgaged && houses === 0 && (
                <button className="propcard__action-btn propcard__action-btn--mortgage" onClick={() => { onMortgage(spaceId); onClose(); }}>
                  🏚️ Mortgage (₹+{detail.mortgage})
                </button>
              )}
              {isMortgaged && (
                <button className="propcard__action-btn propcard__action-btn--unmortgage" onClick={() => { onUnmortgage(spaceId); onClose(); }}>
                  🏠 Unmortgage (₹-{Math.ceil(detail.mortgage * 1.1)})
                </button>
              )}
            </div>
          )}
        </div>

        <button className="propcard__close" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
