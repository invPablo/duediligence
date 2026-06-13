'use client';
import { useState, useEffect } from 'react';

export default function AchievementToast({ achievement, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'linear-gradient(135deg, var(--accent-dim), rgba(167, 139, 250, 0.05))',
      border: '2px solid var(--accent)',
      borderRadius: '16px',
      padding: '20px 24px',
      boxShadow: '0 10px 40px rgba(167, 139, 250, 0.3)',
      zIndex: 10000,
      maxWidth: '320px',
      animation: 'slideIn 0.4s ease-out',
      fontFamily: 'JetBrains Mono, monospace'
    }}>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ fontSize: '40px', animation: 'pulse 0.6s ease-in-out' }}>
          {achievement.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontSize: '14px', 
            fontWeight: 700, 
            color: 'var(--accent)', 
            marginBottom: '4px',
            letterSpacing: '0.5px'
          }}>
            🎉 ACHIEVEMENT UNLOCKED
          </div>
          <div style={{ 
            fontSize: '13px', 
            fontWeight: 600, 
            color: 'var(--text)',
            marginBottom: '2px'
          }}>
            {achievement.title}
          </div>
          <div style={{ 
            fontSize: '11px', 
            color: 'var(--text-3)',
            lineHeight: 1.4
          }}>
            {achievement.description}
          </div>
        </div>
      </div>
    </div>
  );
}
