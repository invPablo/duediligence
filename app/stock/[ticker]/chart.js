'use client';
import { useEffect, useRef, useState } from 'react';

export default function PriceChart({ ticker }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [range, setRange] = useState('6M');

  useEffect(() => {
    let chart, candleSeries, volumeSeries;

    async function init() {
      const { createChart, CandlestickSeries, HistogramSeries } = await import('lightweight-charts');

      if (!containerRef.current) return;

      const res = await fetch(`/api/price?ticker=${ticker}`);
      const data = await res.json();

      if (data.error) { setError(data.error); setLoading(false); return; }

      const all = data.candles;

      const now = new Date();
      const cutoff = new Date();
      if (range === '1M') cutoff.setMonth(now.getMonth() - 1);
      else if (range === '3M') cutoff.setMonth(now.getMonth() - 3);
      else if (range === '6M') cutoff.setMonth(now.getMonth() - 6);
      else cutoff.setFullYear(now.getFullYear() - 1);

      const cutStr = cutoff.toISOString().slice(0, 10);
      const candles = all.filter(c => c.time >= cutStr);

      if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }

      chart = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height: 320,
        layout: { background: { color: '#09090b' }, textColor: '#a1a1aa' },
        grid: { vertLines: { color: '#27272a' }, horzLines: { color: '#27272a' } },
        crosshair: { mode: 1 },
        rightPriceScale: { borderColor: '#3f3f46' },
        timeScale: { borderColor: '#3f3f46', timeVisible: true },
      });

      chartRef.current = chart;

      candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#10b981',
        downColor: '#ef4444',
        borderUpColor: '#10b981',
        borderDownColor: '#ef4444',
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
      });

      candleSeries.setData(candles);

      volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#10b98144',
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });

      chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

      volumeSeries.setData(candles.map(c => ({
        time: c.time,
        value: c.volume,
        color: c.close >= c.open ? '#10b98144' : '#ef444444',
      })));

      chart.timeScale().fitContent();
      setLoading(false);

      const handleResize = () => {
        if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }

    init();
    return () => { if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; } };
  }, [ticker, range]);

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
        <div className="text-sm font-medium text-zinc-300">{ticker} — Precio histórico</div>
        <div className="flex gap-1">
          {['1M', '3M', '6M', '1Y'].map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                range === r ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-500 hover:text-white'
              }`}>
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="p-4">
        {loading && (
          <div className="flex items-center justify-center h-80">
            <div className="text-center">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <div className="text-zinc-500 text-sm">Cargando precio...</div>
            </div>
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center h-80">
            <div className="text-zinc-500 text-sm">{error}</div>
          </div>
        )}
        <div ref={containerRef} style={{ display: loading || error ? 'none' : 'block' }} />
      </div>
    </div>
  );
}