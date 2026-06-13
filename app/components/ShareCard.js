'use client';
import { useRef } from 'react';
import html2canvas from 'html2canvas';

export default function ShareCard({ ticker, name, price, priceChange, metrics, score, verdict }) {
  const cardRef = useRef(null);

  const handleShare = async () => {
    if (!cardRef.current) return;
    
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0B0E14',
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${ticker}-traqcker.png`;
        a.click();
        URL.revokeObjectURL(url);
      });
    } catch (e) {
      console.error('Share failed:', e);
      alert('Failed to generate image');
    }
  };

  const verdictColor = verdict === 'BUY' ? '#22c55e' : verdict === 'SELL' ? '#ef4444' : '#eab308';

  return (
    <>
      {/* Hidden card for rendering to image */}
      <div ref={cardRef} style={{
        position: 'fixed',
        left: '-9999px',
        width: '800px',
        height: '900px',
        background: '#0B0E14',
        padding: '60px',
        borderRadius: '24px',
        border: '3px solid #a78bfa',
        fontFamily: 'JetBrains Mono, monospace',
        color: '#e0e7ff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box'
      }}>
        {/* Top Section - Logo + Ticker + Name */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          {/* Logo */}
          <div style={{ fontSize: '56px', fontWeight: 700, color: '#a78bfa', marginBottom: '30px', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '2px' }}>
            Traq●cker
          </div>
          
          {/* Ticker */}
          <div style={{ fontSize: '72px', fontWeight: 700, color: '#ffffff', marginBottom: '12px', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '1px' }}>
            {ticker}
          </div>
          
          {/* Company Name */}
          <div style={{ fontSize: '28px', color: '#cbd5e1', marginBottom: '40px' }}>
            {name}
          </div>
        </div>

        {/* Middle Section - Price */}
        <div style={{ textAlign: 'center', marginBottom: '50px', borderTop: '2px solid #a78bfa', borderBottom: '2px solid #a78bfa', paddingTop: '30px', paddingBottom: '30px' }}>
          {/* Current Price */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{ fontSize: '64px', fontWeight: 700, color: '#ffffff' }}>
              ${price?.toFixed(2) || '—'}
            </div>
            {priceChange !== undefined && (
              <div style={{ fontSize: '32px', color: priceChange >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                {priceChange >= 0 ? '↑' : '↓'} {Math.abs(priceChange).toFixed(2)}%
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section - Score & Verdict */}
        <div style={{ textAlign: 'center' }}>
          {/* Score */}
          <div style={{ marginBottom: '30px' }}>
            <div style={{ fontSize: '16px', color: '#94a3b8', letterSpacing: '2px', marginBottom: '10px' }}>
              EASY MODE SCORE
            </div>
            <div style={{ fontSize: '56px', fontWeight: 700, color: '#a78bfa' }}>
              {score}/100
            </div>
          </div>

          {/* Verdict */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{ fontSize: '16px', color: '#94a3b8', letterSpacing: '2px', marginBottom: '10px' }}>
              VERDICT
            </div>
            <div style={{ fontSize: '48px', fontWeight: 700, color: verdictColor }}>
              {verdict}
            </div>
          </div>

          {/* Footer */}
          <div style={{ fontSize: '14px', color: '#64748b', letterSpacing: '1px' }}>
            traqcker.com — Fundamental analysis without noise
          </div>
        </div>
      </div>

      {/* Visible Share Button - Downloads PNG */}
      <button onClick={handleShare}
        style={{
          width: '100%',
          padding: '16px',
          marginBottom: '16px',
          borderRadius: '12px',
          border: '1px solid var(--accent)',
          background: 'var(--accent-dim)',
          color: 'var(--accent)',
          cursor: 'pointer',
          fontSize: '14px',
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 700,
          transition: 'all 0.2s',
          letterSpacing: '0.5px'
        }}
        onMouseEnter={e => {
          e.target.style.background = 'var(--accent)';
          e.target.style.color = '#0B0E14';
        }}
        onMouseLeave={e => {
          e.target.style.background = 'var(--accent-dim)';
          e.target.style.color = 'var(--accent)';
        }}>
        📸 Share as Image
      </button>
    </>
  );
}
