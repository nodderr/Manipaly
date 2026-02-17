import React, { useEffect, useState } from 'react';
import './GoAnimation.css';

export default function GoAnimation({ trigger }) {
  const [bills, setBills] = useState([]);

  useEffect(() => {
    if (!trigger) return;

    const newBills = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      left: 20 + Math.random() * 60,
      delay: Math.random() * 0.4,
      rotation: -30 + Math.random() * 60,
    }));

    setBills(newBills);
    const timer = setTimeout(() => setBills([]), 2000);
    return () => clearTimeout(timer);
  }, [trigger]);

  if (bills.length === 0) return null;

  return (
    <div className="go-anim">
      {bills.map((bill) => (
        <div
          key={bill.id}
          className="go-anim__bill"
          style={{
            left: `${bill.left}%`,
            animationDelay: `${bill.delay}s`,
            '--rotation': `${bill.rotation}deg`,
          }}
        >
          💵
        </div>
      ))}
      <div className="go-anim__text">+$200</div>
    </div>
  );
}
