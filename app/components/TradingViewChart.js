'use client';
import { useEffect, useRef, useState } from 'react';

export default function TradingViewChart({ ticker }) {
  const containerRef = useRef(null);
  const [id] = useState(() => `tv-chart-${ticker}-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    let removed = false;
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (removed || !window.TradingView || !containerRef.current) return;
      new window.TradingView.widget({
        autosize: true,
        symbol: ticker,
        interval: 'D',
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1',
        locale: 'en',
        toolbar_bg: '#0a0a0f',
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_legend: false,
        container_id: id,
      });
    };
    document.body.appendChild(script);
    return () => { removed = true; script.remove(); };
  }, [ticker, id]);

  return (
    <div style={{ margin: '28px 0', borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--border)' }}>
      <div id={id} ref={containerRef} style={{ height: '420px' }} />
    </div>
  );
}
