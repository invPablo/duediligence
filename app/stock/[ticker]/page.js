'use client';
import { useState, useEffect, use } from 'react';

const fmt = (val) => {
  if (val === null || val === undefined) return 'N/A';
  if (val >= 1e12) return `$${(val / 1e12).toFixed(1)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(0)}M`;
  return `$${val.toLocaleString()}`;
};

export default function StockPage({ params }) {
  const { ticker: rawTicker } = use(params);
  const ticker = rawTicker.toUpperCase();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/stock?ticker=${ticker}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        setData(d);
      })
      .catch(() => setError('Error de conexión'))
      .finally(() => setLoading(false));
  }, [ticker]);

  if (loading) return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-emerald-400 text-lg mb-2">Cargando SEC EDGAR...</div>
        <div className="text-zinc-500 text-sm">{ticker}</div>
      </div>
    </main>
  );

  if (error) return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-400 text-lg mb-4">{error}</div>
        <a href="/" className="text-zinc-500 text-sm hover:text-white">← Volver</a>
      </div>
    </main>
  );

  const secUrl = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${data.cik}&type=10-K&dateb=&owner=include&count=5`;

  return (
    <main className="min-h-screen bg-black text-white px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <a href="/" className="text-zinc-500 hover:text-white text-sm transition-colors">← Inicio</a>
          <span className="text-zinc-700">/</span>
          <span className="text-zinc-400 text-sm">{ticker}</span>
        </div>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-medium tracking-tight">{data.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-zinc-400 text-sm">{ticker}</span>
              <a href={secUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs border border-zinc-700 px-2 py-0.5 rounded text-zinc-400 hover:border-emerald-500 hover:text-emerald-400 transition-colors">
                SEC EDGAR ↗
              </a>
            </div>
          </div>
          <a href="/" className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Iniciar Due Diligence
          </a>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 sm:grid-cols-4">
          {[
            { label: 'Revenue', val: fmt(data.revVal) },
            { label: 'Net Income', val: fmt(data.niVal) },
            { label: 'Cash Flow Operativo', val: fmt(data.fcfVal) },
            { label: 'Total Assets', val: fmt(data.assetsVal) },
          ].map(m => (
            <div key={m.label} className="bg-zinc-900 rounded-xl p-4">
              <div className="text-xs text-zinc-500 mb-1 uppercase tracking-wide">{m.label}</div>
              <div className="text-xl font-medium">{m.val}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Margen Operativo', val: data.opMargin !== null ? `${data.opMargin}%` : 'N/A', good: data.opMargin > 15 },
            { label: 'Margen Neto', val: data.netMargin !== null ? `${data.netMargin}%` : 'N/A', good: data.netMargin > 10 },
            { label: 'Crecimiento Revenue', val: data.revGrowth !== null ? `${data.revGrowth > 0 ? '+' : ''}${data.revGrowth}%` : 'N/A', good: data.revGrowth > 0 },
          ].map(m => (
            <div key={m.label} className="bg-zinc-900 rounded-xl p-4">
              <div className="text-xs text-zinc-500 mb-1 uppercase tracking-wide">{m.label}</div>
              <div className={`text-xl font-medium ${m.good ? 'text-emerald-400' : 'text-red-400'}`}>{m.val}</div>
            </div>
          ))}
        </div>

        {data.revHistory.length > 0 && (
          <div className="bg-zinc-900 rounded-xl p-6 mb-6">
            <h3 className="text-sm text-zinc-400 uppercase tracking-wide mb-4">Revenue histórico</h3>
            <div className="flex items-end gap-3" style={{ height: '120px' }}>
              {data.revHistory.map((r, i) => {
                const max = Math.max(...data.revHistory.map(x => x.val));
                const pct = Math.round((r.val / max) * 100);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1" style={{ height: '100%' }}>
                    <div className="text-xs text-zinc-500">{(r.val / 1e9).toFixed(0)}B</div>
                    <div className="w-full bg-emerald-500 rounded-t-sm" style={{ height: `${pct}%`, minHeight: '4px' }}></div>
                    <div className="text-xs text-zinc-500">{r.year}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-xs text-zinc-600">
          Datos de SEC EDGAR (XBRL). No constituye asesoramiento de inversión.
        </p>
      </div>
    </main>
  );
}