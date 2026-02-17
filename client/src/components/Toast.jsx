import React, { useEffect, useState } from 'react';
import './Toast.css';

let toastId = 0;

export function useToasts() {
  const [toasts, setToasts] = useState([]);

  function addToast(message, type = 'info') {
    const id = ++toastId;
    setToasts((prev) => [...prev.slice(-2), { id, message, type, exiting: false }]);
    // Auto-dismiss after 3s
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 400);
    }, 3000);
  }

  return { toasts, addToast };
}

export default function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map((toast, i) => (
        <div
          key={toast.id}
          className={`toast toast--${toast.type} ${toast.exiting ? 'toast--exit' : ''}`}
          style={{ '--i': i }}
        >
          <span className="toast__icon">{getIcon(toast.type)}</span>
          <span className="toast__msg">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}

function getIcon(type) {
  switch (type) {
    case 'money-up':   return '💰';
    case 'money-down': return '💸';
    case 'buy':        return '🏗️';
    case 'rent':       return '🏠';
    case 'go':         return '🎉';
    case 'tax':        return '📋';
    default:           return '📢';
  }
}
