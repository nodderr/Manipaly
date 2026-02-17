import React, { useState, useEffect } from 'react';
import BOARD_SPACES from '../data/boardSpaces';
import './AuctionDialog.css';

export default function AuctionDialog({ auction, myId, players, onBid }) {
  const [bidAmount, setBidAmount] = useState((auction?.highBid || 0) + 10);
  const [timeLeft, setTimeLeft] = useState(10);
  const [timerResetKey, setTimerResetKey] = useState(0);

  const space = BOARD_SPACES.find((s) => s.id === auction?.spaceId);
  const me = players.find((p) => p.id === myId);

  // Reset timer key whenever a new bid comes in
  useEffect(() => {
    if (auction) {
      setTimerResetKey((k) => k + 1);
    }
  }, [auction?.highBid]);

  // Countdown timer — restarts from 10s on every timerResetKey change
  useEffect(() => {
    if (!auction) return;
    setTimeLeft(10);
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const remaining = Math.max(0, 10 - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 100);
    return () => clearInterval(interval);
  }, [timerResetKey]);

  // Update min bid when highBid changes
  useEffect(() => {
    if (auction) setBidAmount(Math.max(bidAmount, (auction.highBid || 0) + 10));
  }, [auction?.highBid]);

  if (!auction || !space) return null;

  const canBid = bidAmount > (auction.highBid || 0) && bidAmount <= (me?.money || 0);

  return (
    <div className="auction-overlay">
      <div className="auction-dialog">
        <h3 className="auction__title">🔨 Auction</h3>
        <div className="auction__property">{space.name}</div>
        <div className="auction__price">List price: ${space.price}</div>

        {/* Timer bar */}
        <div className="auction__timer-track">
          <div
            className="auction__timer-fill"
            style={{ width: `${(timeLeft / 10) * 100}%` }}
          />
        </div>
        <div className="auction__time-label">{timeLeft.toFixed(1)}s</div>

        {/* Current bid */}
        <div className="auction__current">
          {auction.highBidder ? (
            <>{auction.highBidderName}: <strong>${auction.highBid}</strong></>
          ) : (
            <span className="auction__no-bids">No bids yet</span>
          )}
        </div>

        {/* Bid controls */}
        {me && !me.bankrupt && (
          <div className="auction__bid-row">
            <input
              type="number"
              className="auction__bid-input"
              min={(auction.highBid || 0) + 1}
              max={me.money}
              value={bidAmount}
              onChange={(e) => setBidAmount(Number(e.target.value))}
            />
            <button
              className="auction__bid-btn"
              disabled={!canBid}
              onClick={() => onBid(bidAmount)}
            >
              Bid ${bidAmount}
            </button>
          </div>
        )}

        {/* Quick bid buttons */}
        {me && !me.bankrupt && (
          <div className="auction__quick-bids">
            {[10, 25, 50, 100].map((inc) => {
              const val = (auction.highBid || 0) + inc;
              return val <= me.money ? (
                <button
                  key={inc}
                  className="auction__quick-btn"
                  onClick={() => { setBidAmount(val); onBid(val); }}
                >
                  +${inc}
                </button>
              ) : null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
